import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import crypto from "crypto";

/**
 * Combined Upload + Analyze Endpoint
 *
 * Does EVERYTHING in ONE request:
 * 1. Saves file to disk
 * 2. For PDF: extracts metadata (pdf-lib) + renders cover (pdfjs + canvas)
 * 3. Returns storedFileName + full analysis + cover image URLs
 *
 * For non-PDF files: just saves and returns storedFileName (client handles analysis).
 *
 * This eliminates 2-3 extra round trips for small/medium files.
 */

const MAX_FILE_SIZE = 100 * 1024 * 1024;
const ACCEPTED_EXTENSIONS = [
  "pdf", "jpg", "jpeg", "png", "webp", "gif", "bmp", "tiff", "tif", "avif", "svg",
  "docx", "doc", "xlsx", "xls", "pptx", "ppt", "txt", "rtf", "csv",
  "ai", "eps", "psd", "indd",
];

const PAPER_SIZES_MM: Record<string, { w: number; h: number }> = {
  A6: { w: 105, h: 148 }, A5: { w: 148, h: 210 }, B5: { w: 176, h: 250 },
  A4: { w: 210, h: 297 }, B4: { w: 250, h: 353 }, A3: { w: 297, h: 420 },
  Letter: { w: 216, h: 279 }, Legal: { w: 216, h: 356 },
};

function findClosestPaperSize(widthMM: number, heightMM: number): string {
  let closest = "مخصص";
  let bestTol = Infinity;
  for (const [name, d] of Object.entries(PAPER_SIZES_MM)) {
    for (const [dw, dh] of [[d.w, d.h], [d.h, d.w]] as [number, number][]) {
      const tol = Math.abs(widthMM - dw) + Math.abs(heightMM - dh);
      if (tol < bestTol) { bestTol = tol; closest = name; }
    }
  }
  if (bestTol > 20) closest = "مخصص";
  return closest;
}

function getUploadsDir(): string {
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    const dir = "/tmp/uploads";
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    return dir;
  }
  const dir = path.join(process.cwd(), "uploads");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function getPreviewDir(): string {
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    const dir = "/tmp/pdf-previews";
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    return dir;
  }
  const dir = path.join(process.cwd(), "public", "pdf-previews");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

async function analyzePdfAndRenderCover(
  filePath: string,
  fileName: string,
  fileSize: number,
  arrayBuffer: ArrayBuffer,
) {
  // === Step 1: Fast metadata with pdf-lib ===
  const { PDFDocument } = await import("pdf-lib");
  let pdfDoc;
  try {
    pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  } catch {
    return { error: "الملف مشفر أو تالف" };
  }

  const numPages = pdfDoc.getPageCount();
  if (numPages === 0) return { error: "الملف فارغ" };

  const firstPage = pdfDoc.getPage(0);
  const { width: widthPt, height: heightPt } = firstPage.getSize();
  const widthMM = Math.round((widthPt * 25.4) / 72 * 10) / 10;
  const heightMM = Math.round((heightPt * 25.4) / 72 * 10) / 10;
  const isPortrait = heightMM > widthPt + 1;
  const aspectRatio = Math.round((widthPt / heightPt) * 1000) / 1000;
  const closestPaperSize = findClosestPaperSize(widthMM, heightMM);

  let title = "";
  let author = "";
  try { title = pdfDoc.getTitle() || ""; } catch { /* ignore */ }
  try { author = pdfDoc.getAuthor() || ""; } catch { /* ignore */ }

  // === Step 2: Render cover with pdfjs + canvas ===
  let coverUrl: string | null = null;
  let backUrl: string | null = null;
  const coverStartTime = Date.now();

  try {
    const pdfjsLib = await import("pdfjs-dist");

    // Set worker path
    const workerPath = path.join(process.cwd(), "public", "pdf.worker.min.mjs");
    if (fs.existsSync(workerPath)) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = workerPath;
    }

    const { Canvas } = await import("@napi-rs/canvas");

    const nodeCanvasFactory = {
      create(width: number, height: number) {
        const canvas = new Canvas(width, height);
        const context = canvas.getContext("2d");
        return { canvas, context };
      },
      reset(canvasAndCtx: { canvas: { width: number; height: number } }, width: number, height: number) {
        canvasAndCtx.canvas.width = width;
        canvasAndCtx.canvas.height = height;
      },
      destroy(canvasAndCtx: { canvas: unknown }) {
        canvasAndCtx.canvas = null;
      },
    };

    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(arrayBuffer),
      useSystemFonts: true,
      fontExtraProperties: false,
      disableAutoFetch: true,
    });

    const doc = await loadingTask.promise;
    const previewDir = getPreviewDir();

    // Calculate optimal render scale
    const longestEdge = Math.max(widthPt, heightPt);
    const idealScale = 3500 / longestEdge;
    const RENDER_SCALE = Math.min(5.0, Math.max(2.0, idealScale));
    const MAX_DIM = 4096;

    // === Render page 1 (cover) ===
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

    // Convert to WebP for small size + high quality
    const { default: sharp } = await import("sharp");
    const coverPngBuf = canvas1.toBuffer("image/png");
    const coverFileName = `cover_${Date.now()}_${crypto.randomBytes(4).toString("hex")}.webp`;
    const coverPath = path.join(previewDir, coverFileName);

    await sharp(coverPngBuf)
      .webp({ quality: 88, effort: 4, smartSubsample: true })
      .resize(renderW > 2000 ? 2000 : undefined, undefined, {
        withoutEnlargement: true,
        kernel: "lanczos3",
      })
      .toFile(coverPath);

    // Return as data URL to avoid extra fetch from client
    const coverWebpBuf = fs.readFileSync(coverPath);
    coverUrl = `data:image/webp;base64,${coverWebpBuf.toString("base64")}`;

    // === Render last page (back cover) if multi-page ===
    if (numPages > 1) {
      try {
        const lastPage = await doc.getPage(numPages);
        const { width: lastWidPt, height: lastHeiPt } = lastPage.getViewport({ scale: 1 });
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

        const lastFinalScale = Math.min(lastW / lastWidPt, lastH / lastHeiPt);
        const lastFinalVp = lastPage.getViewport({ scale: lastFinalScale });
        await lastPage.render({ canvasContext: ctxLast, viewport: lastFinalVp }).promise;

        const backPngBuf = canvasLast.toBuffer("image/png");
        const backFileName = `back_${Date.now()}_${crypto.randomBytes(4).toString("hex")}.webp`;
        const backPath = path.join(previewDir, backFileName);

        await sharp(backPngBuf)
          .webp({ quality: 88, effort: 4, smartSubsample: true })
          .resize(lastW > 2000 ? 2000 : undefined, undefined, {
            withoutEnlargement: true,
            kernel: "lanczos3",
          })
          .toFile(backPath);

        const backWebpBuf = fs.readFileSync(backPath);
        backUrl = `data:image/webp;base64,${backWebpBuf.toString("base64")}`;
      } catch (backErr) {
        console.warn("[upload-analyze] Back page render skipped:", backErr);
      }
    }

    doc.destroy();
    console.log(`[upload-analyze] Cover rendered in ${Date.now() - coverStartTime}ms`);
  } catch (renderErr) {
    console.warn("[upload-analyze] Cover render failed (non-critical):", renderErr);
  }

  return {
    numPages,
    pageDimensionsMM: { width: widthMM, height: heightMM },
    closestPaperSize,
    isPortrait,
    aspectRatio,
    title,
    author,
    coverUrl,
    backUrl,
  };
}

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "لم يتم إرسال ملف" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `حجم الملف ${(file.size / (1024 * 1024)).toFixed(1)} ميغابايت يتجاوز الحد (100 ميغابايت)` },
        { status: 413 },
      );
    }

    const originalName = file.name || "unknown";
    const ext = originalName.split(".").pop()?.toLowerCase() || "";

    if (!ACCEPTED_EXTENSIONS.includes(ext)) {
      return NextResponse.json(
        { error: `صيغة ".${ext}" غير مدعومة` },
        { status: 400 },
      );
    }

    // === Step 1: Save file to disk ===
    const uploadsDir = getUploadsDir();
    const storedFileName = `file_${Date.now()}_${crypto.randomBytes(8).toString("hex")}.${ext}`;
    const finalPath = path.join(uploadsDir, storedFileName);
    const buffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(finalPath, buffer);
    const uploadTime = Date.now() - startTime;

    const result: Record<string, unknown> = {
      storedFileName,
      originalName,
      size: file.size,
      type: ext,
      isPdf: ext === "pdf",
      uploadTimeMs: uploadTime,
    };

    // === Step 2: PDF — analyze + render cover in the SAME request ===
    if (ext === "pdf") {
      const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer;
      const pdfResult = await analyzePdfAndRenderCover(finalPath, storedFileName, file.size, arrayBuffer);

      if ("error" in pdfResult && pdfResult.error) {
        return NextResponse.json({ ...result, error: pdfResult.error }, { status: 400 });
      }

      Object.assign(result, pdfResult);
    }

    const totalTime = Date.now() - startTime;
    console.log(`[upload-analyze] ${originalName} (${(file.size / (1024 * 1024)).toFixed(1)}MB) total: ${totalTime}ms (upload: ${uploadTime}ms)`);
    result.totalTimeMs = totalTime;

    return NextResponse.json(result);
  } catch (e) {
    console.error("[upload-analyze] Fatal error:", e);
    return NextResponse.json(
      { error: "فشل في رفع أو تحليل الملف" },
      { status: 500 },
    );
  }
}
