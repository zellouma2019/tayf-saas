import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// ------------------------------------------------------------------
// Types
// ------------------------------------------------------------------

type TargetFormat = "PDF" | "DOCX" | "XLSX" | "JPG" | "PNG";

const UPLOADS_DIR = () => path.join(process.cwd(), "uploads");

function getFileExtension(filename: string): string {
  return path.extname(filename).replace(/^\./, "").toLowerCase();
}

function generateOutputName(originalName: string, targetFormat: TargetFormat): string {
  const stem = path.basename(originalName, path.extname(originalName));
  const ts = Date.now();
  const rand = Math.random().toString(36).substring(2, 10);
  return `conv_${ts}_${rand}_${stem}.${targetFormat.toLowerCase()}`;
}

// ------------------------------------------------------------------
// Image → Image (using sharp)
// ------------------------------------------------------------------

async function convertImage(
  sourcePath: string,
  targetFormat: "JPG" | "PNG",
  outputName: string,
): Promise<{ newStoredFileName: string; newFileType: string }> {
  // Dynamic import for sharp (may not be available)
  const sharp = (await import("sharp")).default;

  let pipeline = sharp(sourcePath);
  if (targetFormat === "JPG") {
    pipeline = pipeline.flatten({ background: "#ffffff" });
  }

  const format = targetFormat === "JPG" ? "jpeg" : "png";
  const buffer = await pipeline
    .toFormat(format, { quality: targetFormat === "JPG" ? 92 : undefined })
    .toBuffer();

  const outputPath = path.join(UPLOADS_DIR(), outputName);
  fs.writeFileSync(outputPath, buffer);

  return { newStoredFileName: outputName, newFileType: targetFormat };
}

// ------------------------------------------------------------------
// POST handler
// ------------------------------------------------------------------

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { storedFileName, targetFormat } = body;

    if (!storedFileName || typeof storedFileName !== "string") {
      return NextResponse.json({ success: false, error: "Missing storedFileName" }, { status: 400 });
    }

    const validFormats: TargetFormat[] = ["PDF", "DOCX", "XLSX", "JPG", "PNG"];
    if (!targetFormat || !validFormats.includes(targetFormat)) {
      return NextResponse.json({ success: false, error: `Invalid targetFormat` }, { status: 400 });
    }

    // Sanitise path
    const sanitisedName = path.basename(storedFileName).replace(/\.{2,}/g, "");
    const sourcePath = path.join(UPLOADS_DIR(), sanitisedName);

    if (!fs.existsSync(sourcePath)) {
      return NextResponse.json({ success: false, error: "الملف غير موجود" }, { status: 404 });
    }

    const srcExt = getFileExtension(sanitisedName);
    const isImage = ["jpg", "jpeg", "png", "webp", "gif", "bmp"].includes(srcExt);
    const isPdf = srcExt === "pdf";

    // Image → Image conversion
    if (isImage && (targetFormat === "JPG" || targetFormat === "PNG")) {
      const outputName = generateOutputName(sanitisedName, targetFormat);
      const result = await convertImage(sourcePath, targetFormat, outputName);
      return NextResponse.json({ success: true, ...result });
    }

    // PDF → Image (not supported without canvas — return helpful error)
    if (isPdf && (targetFormat === "JPG" || targetFormat === "PNG")) {
      return NextResponse.json({
        success: false,
        error: "تحويل PDF إلى صورة غير متاح حالياً. يمكنك رفع الصورة مباشرة.",
      }, { status: 400 });
    }

    // Same format or unsupported
    if (srcExt === getFileExtension(targetFormat)) {
      return NextResponse.json({ success: false, error: "الملف بالفعل بهذا التنسيق" }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      error: `تحويل ${srcExt.toUpperCase()} إلى ${targetFormat} غير مدعوم حالياً`,
    }, { status: 400 });
  } catch (error) {
    console.error("[convert] Error:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "خطأ في التحويل",
    }, { status: 500 });
  }
}
