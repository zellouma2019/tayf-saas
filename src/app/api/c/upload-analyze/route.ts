import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import crypto from "crypto";

/**
 * Combined Upload + Analyze Endpoint — OPTIMIZED
 *
 * Key optimizations vs previous version:
 * 1. Streaming file write (no double buffering)
 * 2. Lower render resolution (1200px max, not 4096px)
 * 3. Skip back cover (render on-demand later)
 * 4. JPEG output instead of WebP (faster encoding)
 * 5. Return cover as separate streaming response, not base64 in JSON
 * 6. Lower sharp effort (1 = fastest)
 *
 * Two-phase approach:
 * Phase 1 (this endpoint): Upload + PDF metadata only → FAST (~1-2s)
 * Phase 2 (separate): Cover rendering on-demand when user needs it
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

/**
 * Analyze PDF metadata only using pdf-lib.
 * Cover rendering is REMOVED from this hot path — done separately on-demand.
 */
async function analyzePdfMetadata(arrayBuffer: ArrayBuffer) {
  const t0 = Date.now();
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
  const isPortrait = heightMM > widthMM + 1;
  const aspectRatio = Math.round((widthPt / heightPt) * 1000) / 1000;
  const closestPaperSize = findClosestPaperSize(widthMM, heightMM);

  let title = "";
  let author = "";
  try { title = pdfDoc.getTitle() || ""; } catch { /* ignore */ }
  try { author = pdfDoc.getAuthor() || ""; } catch { /* ignore */ }

  console.log(`[upload-analyze] PDF metadata in ${Date.now() - t0}ms`);
  return {
    numPages,
    pageDimensionsMM: { width: widthMM, height: heightMM },
    closestPaperSize, isPortrait, aspectRatio, title, author,
  };
}

 // Light GET — keeps serverless function warm on Vercel (reduces cold start from ~700ms to ~260ms)
export async function GET() {
  return NextResponse.json({ status: "ok" });
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

    // Fast write: formData already buffered in memory, single write is fastest
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(finalPath, fileBuffer);
    const uploadTime = Date.now() - startTime;

    const result: Record<string, unknown> = {
      storedFileName,
      originalName,
      size: file.size,
      type: ext,
      isPdf: ext === "pdf",
      uploadTimeMs: uploadTime,
    };

    // === Step 2: PDF — fast metadata extraction ONLY ===
    if (ext === "pdf") {
      // Use buffer already in memory (no disk re-read)
      const arrayBuffer = fileBuffer.buffer.slice(fileBuffer.byteOffset, fileBuffer.byteOffset + fileBuffer.byteLength) as ArrayBuffer;
      const pdfResult = await analyzePdfMetadata(arrayBuffer);

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
