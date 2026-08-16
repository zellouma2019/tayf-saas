/**
 * PDF Worker Bridge
 * 
 * Creates a Web Worker that processes PDFs off the main thread.
 * Only extracts what's needed for the 3D preview (page count, dimensions, cover textures).
 * This prevents UI freezing for large files (>5MB).
 * 
 * Falls back to main-thread processing if Workers are unavailable.
 */

export interface PdfWorkerResult {
  numPages: number;
  pageDimensionsMM: { width: number; height: number };
  closestPaperSize: string;
  isPortrait: boolean;
  aspectRatio: number;
  coverDataUrl: string | null;
  backDataUrl: string | null;
}

export interface PdfWorkerProgress {
  stage: string;
  percent: number;
}

type ProgressCallback = (progress: PdfWorkerProgress) => void;

let workerInstance: Worker | null = null;
let pendingId = 0;
const pendingResolvers = new Map<
  number,
  {
    resolve: (data: unknown) => void;
    reject: (err: Error) => void;
    onProgress?: ProgressCallback;
  }
>();

function getWorker(): Worker | null {
  if (typeof window === "undefined") return null;
  if (workerInstance) return workerInstance;

  try {
    workerInstance = new Worker("/pdf-processor.worker.js");
    workerInstance.onmessage = (e) => {
      const { type, id, payload, error, stage, percent } = e.data;
      const pending = pendingResolvers.get(id);
      if (!pending) return;

      if (type === "progress") {
        pending.onProgress?.({ stage, percent });
        return;
      }

      pendingResolvers.delete(id);

      if (type === "error") {
        pending.reject(new Error(error || "Worker error"));
      } else {
        pending.resolve(payload);
      }
    };

    workerInstance.onerror = (e) => {
      // Reject all pending
      for (const [id, p] of pendingResolvers) {
        p.reject(new Error(`Worker runtime error: ${e.message}`));
        pendingResolvers.delete(id);
      }
      workerInstance = null;
    };

    return workerInstance;
  } catch {
    return null;
  }
}

/**
 * Process a PDF file in a Web Worker.
 * Returns page count, dimensions, and cover/back texture data URLs.
 * Only reads the first and last page - does NOT parse the entire file.
 */
export function processPdfInWorker(
  file: File,
  onProgress?: ProgressCallback,
): Promise<PdfWorkerResult> {
  return new Promise((resolve, reject) => {
    const worker = getWorker();

    if (!worker) {
      // No Worker support - will fall back in the caller
      reject(new Error("Web Workers not available"));
      return;
    }

    const id = ++pendingId;

    // Read file as ArrayBuffer
    file
      .arrayBuffer()
      .then((buffer) => {
        pendingResolvers.set(id, { resolve: resolve as never, reject, onProgress });
        worker.postMessage({ type: "process", id, data: buffer }, [buffer]);
      })
      .catch(reject);
  });
}

/**
 * Extract specific page textures from a PDF (for flip-through).
 */
export function extractPdfPagesInWorker(
  file: File,
  pageNumbers: number[],
): Promise<Record<number, string>> {
  return new Promise((resolve, reject) => {
    const worker = getWorker();
    if (!worker) {
      reject(new Error("Web Workers not available"));
      return;
    }

    const id = ++pendingId;

    file
      .arrayBuffer()
      .then((buffer) => {
        pendingResolvers.set(id, { resolve: resolve as never, reject });
        worker.postMessage(
          { type: "extract-pages", id, data: { arrayBuffer: buffer, pageNumbers } },
          [buffer],
        );
      })
      .catch(reject);
  });
}

/** Terminate the worker and clean up */
export function terminatePdfWorker() {
  if (workerInstance) {
    workerInstance.terminate();
    workerInstance = null;
  }
  pendingResolvers.clear();
}

/**
 * Fallback: Process PDF on the main thread (only first + last page).
 * Used when Web Workers are unavailable or as a safety fallback.
 * Still lightweight - only loads 2 pages max.
 */
export async function processPdfMainThread(
  file: File,
  onProgress?: ProgressCallback,
): Promise<PdfWorkerResult> {
  const pdfjsLib = await import("pdfjs-dist");
  pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

  onProgress?.({ stage: "loading", percent: 10 });

  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await (pdfjsLib.getDocument({ data: arrayBuffer }) as {
    promise: Promise<unknown>;
  }).promise;
  const doc = pdfDoc as {
    numPages: number;
    getPage: (n: number) => Promise<unknown>;
    destroy: () => void;
  };

  onProgress?.({ stage: "dimensions", percent: 30 });

  // Get page 1 for dimensions
  const page1 = await doc.getPage(1) as {
    getViewport: (o: { scale: number }) => { width: number; height: number };
  };
  const vp = page1.getViewport({ scale: 1 });
  const widthMM = Math.round((vp.width * 25.4) / 72 * 10) / 10;
  const heightMM = Math.round((vp.height * 25.4) / 72 * 10) / 10;
  const isPortrait = heightMM > widthMM + 1;
  const aspectRatio = vp.width / vp.height;

  // Find closest paper size
  const SIZES: Record<string, { w: number; h: number }> = {
    A6: { w: 105, h: 148 }, A5: { w: 148, h: 210 }, A4: { w: 210, h: 297 },
    A3: { w: 297, h: 420 }, Letter: { w: 216, h: 279 }, Legal: { w: 216, h: 356 },
  };
  let closestPaper = "مخصص";
  let bestTol = Infinity;
  for (const [name, d] of Object.entries(SIZES)) {
    for (const [dw, dh] of [[d.w, d.h], [d.h, d.w]] as [number, number][]) {
      const tol = Math.abs(widthMM - dw) + Math.abs(heightMM - dh);
      if (tol < bestTol) { bestTol = tol; closestPaper = name; }
    }
  }
  if (bestTol > 20) closestPaper = "مخصص";

  onProgress?.({ stage: "cover", percent: 40 });

  // Dynamic scale for ultra-HD rendering (~3500px longest edge)
  const longestEdge = Math.max(vp.width, vp.height);
  const TARGET_PX = 3500;
  const coverScale = Math.min(5.0, Math.max(2.5, TARGET_PX / longestEdge));

  // Render page 1 (cover) — WHITE BACKGROUND for transparent PDFs
  const p1vp = (await doc.getPage(1) as { getViewport: (o: { scale: number }) => { width: number; height: number }; render: (o: Record<string, unknown>) => { promise: Promise<void> } }).getViewport({ scale: coverScale });
  const c1 = document.createElement("canvas");
  // Cap at 4096px max dimension
  const c1w = Math.min(Math.round(p1vp.width), 4096);
  const c1h = Math.min(Math.round(p1vp.height), 4096);
  c1.width = c1w; c1.height = c1h;
  const ctx1 = c1.getContext("2d")!;
  ctx1.imageSmoothingEnabled = true;
  ctx1.imageSmoothingQuality = "high";
  // ═══ CRITICAL: Fill white background BEFORE rendering ═══
  ctx1.fillStyle = "#ffffff";
  ctx1.fillRect(0, 0, c1w, c1h);
  // Re-calculate viewport for capped dimensions
  const actualScale = Math.min(c1w / vp.width, c1h / vp.height);
  const actualVp = (await doc.getPage(1) as { getViewport: (o: { scale: number }) => { width: number; height: number }; render: (o: Record<string, unknown>) => { promise: Promise<void> } }).getViewport({ scale: actualScale });
  await (await doc.getPage(1) as { render: (o: Record<string, unknown>) => { promise: Promise<void> } }).render({ canvasContext: ctx1, viewport: actualVp, canvas: c1 }).promise;
  // Use WebP for optimal quality/size ratio (92% quality)
  const coverDataUrl = c1.toDataURL("image/webp", 0.92);

  onProgress?.({ stage: "back", percent: 70 });

  // Render last page
  let backDataUrl: string | null = null;
  if (doc.numPages > 1) {
    try {
      const lastPage = await doc.getPage(doc.numPages) as { getViewport: (o: { scale: number }) => { width: number; height: number }; render: (o: Record<string, unknown>) => { promise: Promise<void> } };
      const lastVp1 = lastPage.getViewport({ scale: 1 });
      const lastScale = Math.min(5.0, Math.max(2.5, TARGET_PX / Math.max(lastVp1.width, lastVp1.height)));
      const lvp = lastPage.getViewport({ scale: lastScale });
      const cL = document.createElement("canvas");
      const cLw = Math.min(Math.round(lvp.width), 4096);
      const cLh = Math.min(Math.round(lvp.height), 4096);
      cL.width = cLw; cL.height = cLh;
      const ctxL = cL.getContext("2d")!;
      ctxL.imageSmoothingEnabled = true;
      ctxL.imageSmoothingQuality = "high";
      // White background for back page too
      ctxL.fillStyle = "#ffffff";
      ctxL.fillRect(0, 0, cLw, cLh);
      const lastActualScale = Math.min(cLw / lastVp1.width, cLh / lastVp1.height);
      const lastActualVp = lastPage.getViewport({ scale: lastActualScale });
      await lastPage.render({ canvasContext: ctxL, viewport: lastActualVp, canvas: cL }).promise;
      backDataUrl = cL.toDataURL("image/webp", 0.92);
    } catch (backErr) {
      console.warn("[PdfBridge] Back page render failed:", backErr);
    }
  }

  onProgress?.({ stage: "cleanup", percent: 95 });

  // Save numPages before cleanup (doc may not have destroy() in pdfjs v6)
  const totalPages = doc.numPages;
  try { doc.destroy?.(); } catch { /* pdfjs v6 may not support destroy */ }

  return {
    numPages: totalPages,
    pageDimensionsMM: { width: widthMM, height: heightMM },
    closestPaperSize: closestPaper,
    isPortrait,
    aspectRatio,
    coverDataUrl,
    backDataUrl,
  };
}