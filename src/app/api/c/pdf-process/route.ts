import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

/**
 * Server-Side PDF Processing — OPTIMIZED for large files
 *
 * Now ONLY extracts metadata (like upload-analyze).
 * Cover rendering delegated to /api/c/render-cover (on-demand, streaming JPEG).
 */

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

function getFilePath(storedFileName: string): string | null {
  const tmpPath = path.join("/tmp/uploads", storedFileName);
  const cwdPath = path.join(process.cwd(), "uploads", storedFileName);
  if (fs.existsSync(tmpPath)) return tmpPath;
  if (fs.existsSync(cwdPath)) return cwdPath;
  return null;
}

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  try {
    let arrayBuffer: ArrayBuffer;
    let fileName = "file";
    let fileSize = 0;
    let storedFileName: string | null = null;

    const sf = req.nextUrl.searchParams.get("storedFileName");

    if (sf) {
      const filePath = getFilePath(sf);
      if (!filePath) {
        return NextResponse.json({ error: "الملف غير موجود على الخادم" }, { status: 400 });
      }
      const fileBuffer = fs.readFileSync(filePath);
      arrayBuffer = fileBuffer.buffer.slice(fileBuffer.byteOffset, fileBuffer.byteOffset + fileBuffer.byteLength) as ArrayBuffer;
      fileName = sf;
      fileSize = fileBuffer.length;
      storedFileName = sf;
    } else {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      if (!file) {
        return NextResponse.json({ error: "لم يتم إرسال ملف" }, { status: 400 });
      }
      arrayBuffer = await file.arrayBuffer();
      fileName = file.name;
      fileSize = file.size;
    }

    const header = Buffer.from(arrayBuffer).slice(0, 5).toString("utf-8");
    if (!header.startsWith("%PDF-")) {
      return NextResponse.json({ error: "الملف ليس PDF حقيقي" }, { status: 400 });
    }

    const { PDFDocument } = await import("pdf-lib");
    let pdfDoc;
    try {
      pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
    } catch {
      return NextResponse.json({ error: "الملف مشفر أو تالف" }, { status: 400 });
    }

    const numPages = pdfDoc.getPageCount();
    if (numPages === 0) {
      return NextResponse.json({ error: "الملف فارغ" }, { status: 400 });
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

    const elapsed = Date.now() - startTime;
    console.log(`[pdf-process] ${fileName} (${(fileSize / (1024 * 1024)).toFixed(1)}MB, ${numPages} pages) metadata in ${elapsed}ms`);

    // Cover URL points to the new on-demand render endpoint
    const coverUrl = storedFileName ? `/api/c/render-cover?file=${encodeURIComponent(storedFileName)}` : null;

    return NextResponse.json({
      numPages, pageDimensionsMM: { width: widthMM, height: heightMM },
      closestPaperSize, isPortrait, aspectRatio, title, author,
      coverImageUrl: coverUrl,
      backImageUrl: null,
      processingTimeMs: elapsed,
    });
  } catch (e) {
    console.error("[pdf-process] Fatal error:", e);
    return NextResponse.json(
      { error: "فشل في معالجة الملف على الخادم" },
      { status: 500 },
    );
  }
}
