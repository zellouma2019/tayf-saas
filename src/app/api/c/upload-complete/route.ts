import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import crypto from "crypto";

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

async function analyzePdfMetadata(filePath: string) {
  const t0 = Date.now();
  const fileBuffer = fs.readFileSync(filePath);
  const arrayBuffer = fileBuffer.buffer.slice(fileBuffer.byteOffset, fileBuffer.byteOffset + fileBuffer.byteLength) as ArrayBuffer;

  const { PDFDocument } = await import("pdf-lib");
  let pdfDoc;
  try {
    pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  } catch {
    return null;
  }

  const numPages = pdfDoc.getPageCount();
  if (numPages === 0) return null;

  const firstPage = pdfDoc.getPage(0);
  const { width: widthPt, height: heightPt } = firstPage.getSize();
  const widthMM = Math.round((widthPt * 25.4) / 72 * 10) / 10;
  const heightMM = Math.round((heightPt * 25.4) / 72 * 10) / 10;
  const isPortrait = heightMM > widthMM + 1;
  const closestPaperSize = findClosestPaperSize(widthMM, heightMM);

  let title = "";
  let author = "";
  try { title = pdfDoc.getTitle() || ""; } catch { /* ignore */ }
  try { author = pdfDoc.getAuthor() || ""; } catch { /* ignore */ }

  console.log(`[upload-complete] PDF metadata in ${Date.now() - t0}ms`);
  return {
    numPages,
    pageDimensionsMM: { width: widthMM, height: heightMM },
    closestPaperSize, isPortrait, title, author,
    isPdf: true,
    processingTimeMs: Date.now() - t0,
  };
}

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  try {
    const { fileId } = await req.json();

    if (!fileId) {
      return NextResponse.json({ error: "بيانات غير كافية" }, { status: 400 });
    }

    const chunksDir = getUploadsDir();
    const sessionDir = path.join(chunksDir, fileId);
    const metaPath = path.join(sessionDir, ".meta.json");

    if (!fs.existsSync(metaPath)) {
      return NextResponse.json({ error: "جلسة الرفع غير موجودة" }, { status: 404 });
    }

    const meta = JSON.parse(fs.readFileSync(metaPath, "utf-8"));

    // Verify all chunks uploaded
    const missing: number[] = [];
    for (let i = 0; i < meta.totalChunks; i++) {
      if (!fs.existsSync(path.join(sessionDir, `chunk_${i}`))) {
        missing.push(i);
      }
    }
    if (missing.length > 0) {
      return NextResponse.json({
        error: `أجزاء مفقودة: ${missing.join(", ")}`,
        missingChunks: missing,
        completedChunks: meta.completedChunks,
      }, { status: 400 });
    }

    // Assemble final file
    const finalDir = getUploadsDir();
    const finalFileName = `file_${Date.now()}_${crypto.randomBytes(8).toString("hex")}.${meta.ext}`;
    const finalPath = path.join(finalDir, finalFileName);

    const writeStream = fs.createWriteStream(finalPath);
    for (let i = 0; i < meta.totalChunks; i++) {
      const chunkPath = path.join(sessionDir, `chunk_${i}`);
      const chunkData = fs.readFileSync(chunkPath);
      writeStream.write(chunkData);
      fs.unlinkSync(chunkPath); // Delete chunk after writing
    }
    writeStream.end();

    await new Promise<void>((res) => writeStream.on("finish", res));

    // Cleanup session directory
    try {
      fs.unlinkSync(metaPath);
      fs.rmdirSync(sessionDir);
    } catch {
      // Non-critical
    }

    const result: Record<string, unknown> = {
      storedFileName: finalFileName,
      originalName: meta.originalName,
      size: meta.size,
      type: meta.ext,
      isPdf: meta.ext === "pdf",
    };

    // If PDF, also extract metadata (fast, ~50ms with pdf-lib)
    if (meta.ext === "pdf") {
      const pdfMeta = await analyzePdfMetadata(finalPath);
      if (pdfMeta) {
        Object.assign(result, pdfMeta);
      }
    }

    result.totalTimeMs = Date.now() - startTime;
    console.log(`[upload-complete] ${meta.originalName} assembled + analyzed in ${Date.now() - startTime}ms`);

    return NextResponse.json(result);
  } catch (e) {
    console.error("[upload-complete] Error:", e);
    return NextResponse.json({ error: "فشل في تجميع الملف" }, { status: 500 });
  }
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
