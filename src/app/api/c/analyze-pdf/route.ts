import { NextRequest, NextResponse } from "next/server";

/**
 * Fast PDF metadata extraction using pdf-lib only.
 * No cover rendering — just numPages, dimensions, paper size, orientation, title, author.
 * Works for ALL PDF sizes in < 1 second.
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

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "لم يتم إرسال ملف" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();

    // Verify PDF magic bytes
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
    const closestPaperSize = findClosestPaperSize(widthMM, heightMM);

    let title = "";
    let author = "";
    try { title = pdfDoc.getTitle() || ""; } catch { /* ignore */ }
    try { author = pdfDoc.getAuthor() || ""; } catch { /* ignore */ }

    const elapsed = Date.now() - startTime;
    console.log(`[analyze-pdf] ${file.name} (${(file.size / (1024 * 1024)).toFixed(1)}MB, ${numPages} pages) in ${elapsed}ms`);

    return NextResponse.json({
      numPages,
      pageDimensionsMM: { width: widthMM, height: heightMM },
      closestPaperSize,
      isPortrait,
      title,
      author,
      processingTimeMs: elapsed,
    });
  } catch (e) {
    console.error("[analyze-pdf] Fatal error:", e);
    return NextResponse.json(
      { error: "فشل في تحليل الملف على الخادم" },
      { status: 500 },
    );
  }
}
