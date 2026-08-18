import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import crypto from "crypto";

/**
 * Universal File Upload Endpoint
 * Accepts any supported file type and saves it to disk.
 * Returns a unique storedFileName that can be referenced by other endpoints.
 *
 * Accepted: PDF, JPG, JPEG, PNG, WebP, GIF, BMP, TIFF, AVIF, SVG,
 *            DOCX, DOC, XLSX, XLS, PPTX, PPT, TXT, RTF, CSV,
 *            AI, EPS, PSD, INDD
 * Max size: 100 MB
 */

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB

const ACCEPTED_EXTENSIONS = new Set([
  // Images
  "pdf", "jpg", "jpeg", "png", "webp", "gif", "bmp", "tiff", "tif", "avif", "svg",
  // Documents
  "docx", "doc", "xlsx", "xls", "pptx", "ppt", "txt", "rtf", "csv",
  // Design/Print files
  "ai", "eps", "psd", "indd",
]);

// MIME type to extension mapping for validation
const MIME_TO_EXT: Record<string, string> = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/bmp": "bmp",
  "image/tiff": "tiff",
  "image/avif": "avif",
  "image/svg+xml": "svg",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
  "application/vnd.ms-excel": "xls",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
  "application/vnd.ms-powerpoint": "ppt",
  "text/plain": "txt",
  "text/rtf": "rtf",
  "text/csv": "csv",
  "application/postscript": "eps",
  "image/x-photoshop": "psd",
  "application/illustrator": "ai",
};

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "لم يتم إرسال ملف" }, { status: 400 });
    }

    // Determine extension from filename
    const originalName = file.name || "upload";
    const ext = originalName.split(".").pop()?.toLowerCase() || "";

    // Validate extension
    if (!ext || !ACCEPTED_EXTENSIONS.has(ext)) {
      return NextResponse.json(
        { error: `صيغة الملف ".${ext || "?"}" غير مدعومة. الصيغ المدعومة: PDF, JPG, PNG, WebP, GIF, BMP, TIFF, AVIF, SVG, DOCX, XLSX, PPTX, AI, EPS, PSD` },
        { status: 400 },
      );
    }

    // Validate size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `حجم الملف ${(file.size / (1024 * 1024)).toFixed(1)} ميغابايت يتجاوز الحد الأقصى (100 ميغابايت)` },
        { status: 413 },
      );
    }

    // Ensure uploads directory exists
    const uploadsDir = path.join(process.cwd(), "uploads");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Generate unique filename: file_<timestamp>_<random>.<ext>
    const timestamp = Date.now();
    const randomSuffix = crypto.randomBytes(6).toString("hex");
    const storedFileName = `file_${timestamp}_${randomSuffix}.${ext}`;
    const filePath = path.join(uploadsDir, storedFileName);

    // Write file to disk
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(filePath, fileBuffer);

    const elapsed = Date.now() - startTime;
    console.log(
      `[upload] ${originalName} (${(file.size / (1024 * 1024)).toFixed(1)}MB, .${ext}) → ${storedFileName} in ${elapsed}ms`,
    );

    return NextResponse.json({
      storedFileName,
      originalName,
      size: file.size,
      type: ext,
      mimeType: file.type,
    });
  } catch (e) {
    console.error("[upload] Fatal error:", e);
    return NextResponse.json(
      { error: "فشل في رفع الملف على الخادم" },
      { status: 500 },
    );
  }
}
