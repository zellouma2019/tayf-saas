import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

/**
 * Server-Side PDF Processing Endpoint — ULTRA-HIGH QUALITY
 *
 * For large files (>10MB) that would crash the browser if processed client-side.
 * Uses pdf-lib for fast metadata + pdfjs-dist + @napi-rs/canvas for cover rendering.
 * Returns lightweight JSON: dimensions + page count + cover image URL.
 *
 * Accepts either:
 *   - FormData with "file" field (direct upload)
 *   - Query param "storedFileName" to read from disk (after /api/c/upload saved it)
 *
 * Quality: Dynamic scale (2.5-5.0x), PNG lossless for text, 4096px max dimension.
 */

const PAPER_SIZES_MM: Record<string, { w: number; h: number }> = {
  A6: { w: 105, h: 148 }, A5: { w: 148, h: 210 }, B5: { w: 176, h: 250 },
  A4: { w: 210, h: 297 }, B4: { w: 250, h: 353 }, A3: { w: 297, h: 420 },
  Letter: { w: 216, h: 279 }, Legal: { w: 216, h: 356 },
};

function findClosestPaperSize(widthMM: number, heightMM: number): string {
  let closest = "\u0645\u062e\u0635\u0635";
  let bestTol = Infinity;
  for (const [name, d] of Object.entries(PAPER_SIZES_MM)) {
    for (const [dw, dh] of [[d.w, d.h], [d.h, d.w]] as [number, number][]) {
      const tol = Math.abs(widthMM - dw) + Math.abs(heightMM - dh);
      if (tol < bestTol) { bestTol = tol; closest = name; }
    }
  }
  if (bestTol > 20) closest = "\u0645\u062e\u0635\u0635";
  return closest;
}

function calculateOptimalScale(widthPt: number, heightPt: number): number {
  const longestEdge = Math.max(widthPt, heightPt);
  const TARGET_PX = 3500;
  const MIN_SCALE = 2.5;
  const MAX_SCALE = 5.0;
  const idealScale = TARGET_PX / longestEdge;
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, idealScale));
}

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  try {
    let arrayBuffer: ArrayBuffer;
    let fileName = "file";
    let fileSize = 0;

    // Check if storedFileName is provided (skip re-upload)
    const storedFileName = req.nextUrl.searchParams.get("storedFileName");

    if (storedFileName) {
      // Check /tmp (Vercel) first, then cwd (local dev)
      const tmpPath = path.join("/tmp/uploads", storedFileName);
      const cwdPath = path.join(process.cwd(), "uploads", storedFileName);
      const filePath = fs.existsSync(tmpPath) ? tmpPath : cwdPath;
      if (!fs.existsSync(filePath)) {
        return NextResponse.json({ error: "الملف غير موجود على الخادم" }, { status: 400 });
      }
      const fileBuffer = fs.readFileSync(filePath);
      arrayBuffer = fileBuffer.buffer.slice(fileBuffer.byteOffset, fileBuffer.byteOffset + fileBuffer.byteLength) as ArrayBuffer;
      fileName = storedFileName;
      fileSize = fileBuffer.length;
    } else {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      if (!file) {
        return NextResponse.json({ error: "\u0644\u0645 \u064a\u062a\u0645 \u0625\u0631\u0633\u0627\u0644 \u0645\u0644\u0641" }, { status: 400 });
      }
      arrayBuffer = await file.arrayBuffer();
      fileName = file.name;
      fileSize = file.size;
    }

    // Verify PDF magic bytes
    const header = Buffer.from(arrayBuffer).slice(0, 5).toString("utf-8");
    if (!header.startsWith("%PDF-")) {
      return NextResponse.json({ error: "\u0627\u0644\u0645\u0644\u0641 \u0644\u064a\u0633 PDF \u062d\u0642\u064a\u0642\u064a" }, { status: 400 });
    }

    // STEP 1: Fast metadata extraction with pdf-lib
    const { PDFDocument } = await import("pdf-lib");
    let pdfDoc;
    try {
      pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
    } catch {
      return NextResponse.json({ error: "\u0627\u0644\u0645\u0644\u0641 \u0645\u0634\u0641\u0631 \u0623\u0648 \u062a\u0627\u0644\u0641" }, { status: 400 });
    }

    const numPages = pdfDoc.getPageCount();
    if (numPages === 0) {
      return NextResponse.json({ error: "\u0627\u0644\u0645\u0644\u0641 \u0641\u0627\u0631\u063a" }, { status: 400 });
    }

    const firstPage = pdfDoc.getPage(0);
    const { width: widthPt, height: heightPt } = firstPage.getSize();
    const widthMM = Math.round((widthPt * 25.4) / 72 * 10) / 10;
    const heightMM = Math.round((heightPt * 25.4) / 72 * 10) / 10;
    const isPortrait = heightMM > widthMM + 1;
    const aspectRatio = Math.round((widthPt / heightPt) * 1000) / 1000;
    const closestPaperSize = findClosestPaperSize(widthMM, heightMM);

    let title = "";
    let author = "";
    try { title = pdfDoc.getTitle() || ""; } catch { /* ignore */ }
    try { author = pdfDoc.getAuthor() || ""; } catch { /* ignore */ }

    // STEP 2: Ultra-HD cover rendering on server
    let coverImageUrl: string | null = null;
    let backImageUrl: string | null = null;

    try {
      const pdfjsLib = await import("pdfjs-dist");

      const workerPath = path.join(process.cwd(), "public", "pdf.worker.min.mjs");
      pdfjsLib.GlobalWorkerOptions.workerSrc = workerPath;

      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { Canvas } = require("@napi-rs/canvas");

      const nodeCanvasFactory = {
        create(width: number, height: number) {
          const canvas = new Canvas(width, height);
          const context = canvas.getContext("2d");
          return { canvas, context };
        },
        reset(canvasAndContext: { canvas: unknown; context: unknown }, width: number, height: number) {
          const canvas = canvasAndContext.canvas as { width: number; height: number };
          canvas.width = width;
          canvas.height = height;
        },
        destroy(canvasAndContext: { canvas: unknown }) {
          canvasAndContext.canvas = null;
        },
      };

      const loadingTask = pdfjsLib.getDocument({
        data: new Uint8Array(arrayBuffer),
        useSystemFonts: true,
        fontExtraProperties: false,
        disableAutoFetch: true,
      });

      const doc = await loadingTask.promise;

      // Ensure preview directory exists
      const previewDir = path.join(process.cwd(), "public", "pdf-previews");
      if (!fs.existsSync(previewDir)) {
        fs.mkdirSync(previewDir, { recursive: true });
      }

      const RENDER_SCALE = calculateOptimalScale(widthPt, heightPt);
      const MAX_DIM = 4096;

      // Render page 1 (cover)
      const page1 = await doc.getPage(1);
      const vp1 = page1.getViewport({ scale: RENDER_SCALE });
      let renderW = Math.round(vp1.width);
      let renderH = Math.round(vp1.height);

      if (renderW > MAX_DIM || renderH > MAX_DIM) {
        const scaleDown = MAX_DIM / Math.max(renderW, renderH);
        renderW = Math.round(renderW * scaleDown);
        renderH = Math.round(renderH * scaleDown);
      }

      const canvas1 = new Canvas(renderW, renderH);
      const ctx1 = canvas1.getContext("2d");
      ctx1.imageSmoothingEnabled = true;
      ctx1.imageSmoothingQuality = "high";
      ctx1.fillStyle = "#ffffff";
      ctx1.fillRect(0, 0, renderW, renderH);

      const finalScale = Math.min(renderW / widthPt, renderH / heightPt);
      const finalVp1 = page1.getViewport({ scale: finalScale });
      await page1.render({ canvasContext: ctx1, viewport: finalVp1 }).promise;

      const { default: sharp } = await import("sharp");
      const coverPngBuf = canvas1.toBuffer("image/png");
      const coverFileName = `cover_${Date.now()}_${Math.random().toString(36).slice(2, 10)}.webp`;
      const coverPath = path.join(previewDir, coverFileName);

      await sharp(coverPngBuf)
        .webp({ quality: 92, effort: 6, smartSubsample: true })
        .resize(renderW > 2400 ? 2400 : undefined, undefined, {
          withoutEnlargement: true,
          kernel: "lanczos3",
        })
        .toFile(coverPath);

      coverImageUrl = `/pdf-previews/${coverFileName}`;

      // Render last page (back cover) if multi-page
      if (numPages > 1) {
        try {
          const lastPage = await doc.getPage(numPages);
          const lastVp = lastPage.getViewport({ scale: RENDER_SCALE });
          let lastW = Math.round(lastVp.width);
          let lastH = Math.round(lastVp.height);

          if (lastW > MAX_DIM || lastH > MAX_DIM) {
            const s = MAX_DIM / Math.max(lastW, lastH);
            lastW = Math.round(lastW * s);
            lastH = Math.round(lastH * s);
          }

          const canvasLast = new Canvas(lastW, lastH);
          const ctxLast = canvasLast.getContext("2d");
          ctxLast.imageSmoothingEnabled = true;
          ctxLast.imageSmoothingQuality = "high";
          ctxLast.fillStyle = "#ffffff";
          ctxLast.fillRect(0, 0, lastW, lastH);

          const { width: lastWidPt, height: lastHeiPt } = (await doc.getPage(numPages)).getViewport({ scale: 1 });
          const lastFinalScale = Math.min(lastW / lastWidPt, lastH / lastHeiPt);
          const lastFinalVp = lastPage.getViewport({ scale: lastFinalScale });
          await lastPage.render({ canvasContext: ctxLast, viewport: lastFinalVp }).promise;

          const backPngBuf = canvasLast.toBuffer("image/png");
          const backFileName = `back_${Date.now()}_${Math.random().toString(36).slice(2, 10)}.webp`;
          const backPath = path.join(previewDir, backFileName);

          await sharp(backPngBuf)
            .webp({ quality: 92, effort: 6, smartSubsample: true })
            .resize(lastW > 2400 ? 2400 : undefined, undefined, {
              withoutEnlargement: true,
              kernel: "lanczos3",
            })
            .toFile(backPath);

          backImageUrl = `/pdf-previews/${backFileName}`;
        } catch (backErr) {
          console.warn("[PDF Process] Back page render failed (non-critical):", backErr);
        }
      }

      doc.destroy();
    } catch (renderErr) {
      console.warn("[PDF Process] Cover render failed (non-critical):", renderErr);
    }

    const elapsed = Date.now() - startTime;
    console.log(`[pdf-process] ${fileName} (${(fileSize / (1024 * 1024)).toFixed(1)}MB, ${numPages} pages) in ${elapsed}ms`);

    return NextResponse.json({
      numPages,
      pageDimensionsMM: { width: widthMM, height: heightMM },
      closestPaperSize,
      isPortrait,
      aspectRatio,
      title,
      author,
      coverImageUrl,
      backImageUrl,
      processingTimeMs: elapsed,
    });
  } catch (e) {
    console.error("[pdf-process] Fatal error:", e);
    return NextResponse.json(
      { error: "\u0641\u0634\u0644 \u0641\u064a \u0645\u0639\u0627\u0644\u062c\u0629 \u0627\u0644\u0645\u0644\u0641 \u0639\u0644\u0649 \u0627\u0644\u062e\u0627\u062f\u0645" },
      { status: 500 },
    );
  }
}
