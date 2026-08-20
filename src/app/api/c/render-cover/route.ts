import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

/**
 * On-demand cover rendering endpoint.
 * Called AFTER upload+analyze to render the cover image.
 * Returns the cover as a binary image response (not base64 in JSON).
 *
 * Optimizations:
 * - Max 1200px (not 4096px)
 * - JPEG at quality 80 (fast encoding, good enough for preview)
 * - sharp effort: 1 (fastest)
 * - Single page only (back cover on demand via ?page=last)
 * - Streaming response (no base64 bloat)
 */

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

export async function GET(req: NextRequest) {
  // Warm-up: if no file param, just keep function warm
  const storedFileName = req.nextUrl.searchParams.get("file");
  if (!storedFileName) {
    return NextResponse.json({ status: "ok" });
  }

  // Actual cover rendering
  const t0 = Date.now();
  try {
    const filePath = path.join(uploadsDir, storedFileName);
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: "الملف غير موجود" }, { status: 404 });
    }

    const ext = storedFileName.split(".").pop()?.toLowerCase();
    if (ext !== "pdf") {
      // For non-PDF files, serve the original file directly as cover
      const buf = fs.readFileSync(filePath);
      const contentType = ext === "jpg" || ext === "jpeg" ? "image/jpeg" :
        ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "application/octet-stream";
      return new NextResponse(buf, {
        headers: { "Content-Type": contentType, "Cache-Control": "public, max-age=3600" },
      });
    }

    // === PDF: render cover page ===
    const fileBuffer = fs.readFileSync(filePath);
    const arrayBuffer = fileBuffer.buffer.slice(fileBuffer.byteOffset, fileBuffer.byteOffset + fileBuffer.byteLength) as ArrayBuffer;

    // Fast page count + dimensions with pdf-lib
    const { PDFDocument } = await import("pdf-lib");
    const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
    const numPages = pdfDoc.getPageCount();
    const targetPageNum = page === "last" ? numPages : 1;
    const targetPage = pdfDoc.getPage(targetPageNum - 1);
    const { width: widthPt, height: heightPt } = targetPage.getSize();

    // Render with pdfjs + canvas
    const pdfjsLib = await import("pdfjs-dist");
    const workerPath = path.join(process.cwd(), "public", "pdf.worker.min.mjs");
    if (fs.existsSync(workerPath)) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = workerPath;
    }

    const { Canvas } = await import("@napi-rs/canvas");

    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(arrayBuffer),
      useSystemFonts: true,
      fontExtraProperties: false,
      disableAutoFetch: true,
    });
    const doc = await loadingTask.promise;

    // Low resolution for speed: max 1200px
    const MAX_DIM = 1200;
    const longestEdge = Math.max(widthPt, heightPt);
    const scale = Math.min(MAX_DIM / longestEdge, 2.0);

    const pdfPage = await doc.getPage(targetPageNum);
    const vp = pdfPage.getViewport({ scale });
    const renderW = Math.round(vp.width);
    const renderH = Math.round(vp.height);

    const canvas = new Canvas(renderW, renderH);
    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = true;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, renderW, renderH);

    await pdfPage.render({ canvasContext: ctx, viewport: vp }).promise;
    doc.destroy();

    // Convert to JPEG (fast encoding)
    const { default: sharp } = await import("sharp");
    const jpegBuf = await sharp(canvas.toBuffer("image/png"))
      .jpeg({ quality: 80, mozjpeg: true, effort: 1 })
      .toBuffer();

    console.log(`[render-cover] ${storedFileName} page=${page} ${renderW}x${renderH} in ${Date.now() - t0}ms`);

    return new NextResponse(jpegBuf, {
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "public, max-age=3600",
        "X-Render-Time-Ms": String(Date.now() - t0),
      },
    });
  } catch (e) {
    console.error("[render-cover] Error:", e);
    return NextResponse.json({ error: "فشل في استخراج الغلاف" }, { status: 500 });
  }
}
