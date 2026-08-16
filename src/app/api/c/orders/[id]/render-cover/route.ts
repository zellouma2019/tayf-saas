import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import fs from "fs";
import path from "path";

const PAPER_SIZES_MM: Record<string, { w: number; h: number }> = {
  A6: { w: 105, h: 148 }, A5: { w: 148, h: 210 }, B5: { w: 176, h: 250 },
  A4: { w: 210, h: 297 }, B4: { w: 250, h: 353 }, A3: { w: 297, h: 420 },
  Letter: { w: 216, h: 279 }, Legal: { w: 216, h: 356 },
};
function findClosestPaperSize(w: number, h: number): string {
  let closest = "مخصص";
  let best = Infinity;
  for (const [n, d] of Object.entries(PAPER_SIZES_MM)) {
    for (const [dw, dh] of [[d.w, d.h], [d.h, d.w]] as [number, number][]) {
      const t = Math.abs(w - dw) + Math.abs(h - dh);
      if (t < best) { best = t; closest = n; }
    }
  }
  if (best > 20) closest = "مخصص";
  return closest;
}
function calculateOptimalScale(widthPt: number, heightPt: number): number {
  const longest = Math.max(widthPt, heightPt);
  const TARGET = 2000;
  return Math.min(4.0, Math.max(2.0, TARGET / longest));
}
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const order = await db.printOrder.findUnique({ where: { id } });
    if (!order) return NextResponse.json({ error: "الطلب غير موجود" }, { status: 404 });
    if (!order.fileData) return NextResponse.json({ error: "لا يوجد ملف" }, { status: 404 });

    const filePath = order.fileData.startsWith("file_")
      ? path.join(process.cwd(), "uploads", order.fileData)
      : null;
    if (!filePath || !fs.existsSync(filePath))
      return NextResponse.json({ error: "الملف غير موجود" }, { status: 404 });

    const ext = filePath.split(".").pop()?.toLowerCase() || "";
    const mimeMap: Record<string, string> = { png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", webp: "image/webp", gif: "image/gif" };

    if (["png", "jpg", "jpeg", "webp", "gif"].includes(ext)) {
      const buf = fs.readFileSync(filePath);
      return NextResponse.json({ type: "image", coverDataUrl: `data:${mimeMap[ext] || "image/png"};base64,${buf.toString("base64")}`, backDataUrl: null });
    }

    if (ext !== "pdf") return NextResponse.json({ error: "نوع ملف غير مدعوم" }, { status: 400 });

    const pdfBuffer = fs.readFileSync(filePath);
    if (!pdfBuffer.slice(0, 5).toString("utf-8").startsWith("%PDF-"))
      return NextResponse.json({ error: "الملف ليس PDF" }, { status: 400 });

    const { PDFDocument } = await import("pdf-lib");
    let pdfDoc;
    try { pdfDoc = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true }); }
    catch { return NextResponse.json({ error: "الملف مشفر أو تالف" }, { status: 400 }); }

    const numPages = pdfDoc.getPageCount();
    if (numPages === 0) return NextResponse.json({ error: "الملف فارغ" }, { status: 400 });

    const firstPage = pdfDoc.getPage(0);
    const { width: wPt, height: hPt } = firstPage.getSize();
    const wMM = (wPt / 72) * 25.4;
    const hMM = (hPt / 72) * 25.4;

    let coverDataUrl: string | null = null;
    let backDataUrl: string | null = null;
    let pDim: { width: number; height: number } | undefined;
    let closest: string | undefined;
    let portrait: boolean | undefined;
    let ratio: number | undefined;

    try {
      // Polyfill DOMMatrix for pdfjs-dist
      if (typeof (globalThis as Record<string, unknown>).DOMMatrix === "undefined") {
        class PolyDOMMatrix {
          a = 1; b = 0; c = 0; d = 1; e = 0; f = 0; is2D = true; isIdentity = true;
          constructor() {}
          multiply() { return new PolyDOMMatrix(); }
          inverse() { return new PolyDOMMatrix(); }
          transformPoint(p: { x: number; y: number }) { return { x: p.x, y: p.y }; }
          toFloat32Array() { return new Float32Array([1, 0, 0, 1, 0, 0]); }
        }
        (globalThis as unknown as Record<string, unknown>).DOMMatrix = PolyDOMMatrix;
      }

      const pdfjsLib = await import("pdfjs-dist");
      pdfjsLib.GlobalWorkerOptions.workerSrc = path.join(process.cwd(), "public", "pdf.worker.min.mjs");

      const { Canvas } = await import("@napi-rs/canvas");
      const sharp = (await import("sharp")).default;

      const nodeCanvasFactory = {
        create(width: number, height: number) {
          const canvas = new Canvas(width, height);
          const context = canvas.getContext("2d");
          return { canvas, context };
        },
        reset(cc: { canvas: unknown }, width: number, height: number) {
          (cc.canvas as { width: number; height: number }).width = width;
          (cc.canvas as { width: number; height: number }).height = height;
        },
        destroy(cc: { canvas: unknown }) { cc.canvas = null; },
      };

      const loadingTask = pdfjsLib.getDocument({
        data: new Uint8Array(pdfBuffer),
        useSystemFonts: true, fontExtraProperties: false, disableAutoFetch: true,
        canvasFactory: nodeCanvasFactory,
      });
      const doc = await loadingTask.promise;

      const RENDER_SCALE = calculateOptimalScale(wPt, hPt);
      const MAX_DIM = 2400;

      const page = await doc.getPage(1);
      const vp = page.getViewport({ scale: RENDER_SCALE });
      let rW = Math.round(vp.width);
      let rH = Math.round(vp.height);
      if (rW > MAX_DIM || rH > MAX_DIM) {
        const s = MAX_DIM / Math.max(rW, rH); rW = Math.round(rW * s); rH = Math.round(rH * s);
      }
      const canvas = new Canvas(rW, rH);
      const ctx = canvas.getContext("2d");
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, rW, rH);
      const { width: fW, height: fH } = page.getViewport({ scale: 1 });
      const fs2 = Math.min(rW / fW, rH / fH);
      await page.render({ canvasContext: ctx, viewport: page.getViewport({ scale: fs2 }) }).promise;
      const coverPng = canvas.toBuffer("image/png");
      const coverWebp = await sharp(coverPng).webp({ quality: 90, effort: 4 }).resize(rW > 2000 ? 2000 : undefined, undefined, { withoutEnlargement: true }).toBuffer();
      coverDataUrl = `data:image/webp;base64,${coverWebp.toString("base64")}`;

      if (numPages > 1) {
        try {
          const lp = await doc.getPage(numPages);
          const lvp = lp.getViewport({ scale: RENDER_SCALE });
          let lW = Math.round(lvp.width);
          let lH = Math.round(lvp.height);
          if (lW > MAX_DIM || lH > MAX_DIM) { const s = MAX_DIM / Math.max(lW, lH); lW = Math.round(lW * s); lH = Math.round(lH * s); }
          const c2 = new Canvas(lW, lH);
          const x2 = c2.getContext("2d");
          x2.imageSmoothingEnabled = true; x2.imageSmoothingQuality = "high"; x2.fillStyle = "#ffffff"; x2.fillRect(0, 0, lW, lH);
          const { width: lw2, height: lh2 } = lp.getViewport({ scale: 1 });
          const ls = Math.min(lW / lw2, lH / lh2);
          await lp.render({ canvasContext: x2, viewport: lp.getViewport({ scale: ls }) }).promise;
          const bPng = c2.toBuffer("image/png");
          const bWebp = await sharp(bPng).webp({ quality: 90, effort: 4 }).resize(lW > 2000 ? 2000 : undefined, undefined, { withoutEnlargement: true }).toBuffer();
          backDataUrl = `data:image/webp;base64,${bWebp.toString("base64")}`;
        } catch { /* non-critical */ }
      }

      doc.destroy();
      pDim = { width: wMM, height: hMM };
      closest = findClosestPaperSize(wMM, hMM);
      portrait = hMM >= wMM;
      ratio = wPt / hPt;
    } catch (err) {
      console.error("[render-cover] FAIL:", err);
    }

    return NextResponse.json({
      type: "pdf", numPages,
      pageDimensionsMM: pDim || { width: wMM, height: hMM },
      closestPaperSize: closest || findClosestPaperSize(wMM, hMM),
      isPortrait: portrait ?? hMM >= wMM,
      aspectRatio: ratio ?? wPt / hPt,
      coverDataUrl, backDataUrl,
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
