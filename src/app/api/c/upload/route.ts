import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import crypto from "crypto";

// الحد الأقصى: 100 ميغابايت
const MAX_FILE_SIZE = 100 * 1024 * 1024;

const ACCEPTED_EXTENSIONS = [
  "pdf", "docx", "doc", "xlsx", "xls", "pptx", "ppt", "txt", "rtf", "csv",
  "jpg", "jpeg", "png", "webp", "gif", "bmp", "tiff", "tif", "avif", "svg",
  "ai", "eps", "psd", "indd",
];

const MIME_MAP: Record<string, string> = {
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  doc: "application/msword",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  xls: "application/vnd.ms-excel",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ppt: "application/vnd.ms-powerpoint",
  txt: "text/plain",
  rtf: "application/rtf",
  csv: "text/csv",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  bmp: "image/bmp",
  tiff: "image/tiff",
  tif: "image/tiff",
  avif: "image/avif",
  svg: "image/svg+xml",
  ai: "application/illustrator",
  eps: "application/postscript",
  psd: "image/vnd.adobe.photoshop",
  indd: "application/x-indesign",
};

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "لم يتم إرسال ملف" }, { status: 400 });
    }

    // التحقق من الحجم
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `حجم الملف ${(file.size / (1024 * 1024)).toFixed(1)} ميغابايت يتجاوز الحد الأقصى (100 ميغابايت)` },
        { status: 413 },
      );
    }

    // استخراج الامتداد والتحقق منه
    const originalName = file.name || "upload";
    const ext = originalName.split(".").pop()?.toLowerCase() || "";

    if (!ext || !ACCEPTED_EXTENSIONS.includes(ext)) {
      return NextResponse.json(
        { error: `صيغة الملف ".${ext}" غير مدعومة` },
        { status: 400 },
      );
    }

    // إنشاء اسم ملف فريد
    const uniqueId = crypto.randomBytes(12).toString("hex");
    const timestamp = Date.now().toString(36);
    const storedFileName = `file_${timestamp}_${uniqueId}.${ext}`;

    // التأكد من وجود مجلد uploads
    const uploadsDir = path.join(process.cwd(), "uploads");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // حفظ الملف
    const filePath = path.join(uploadsDir, storedFileName);
    const buffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(filePath, buffer);

    return NextResponse.json({
      storedFileName,
      originalName,
      size: file.size,
      type: ext,
      mimeType: MIME_MAP[ext] || "application/octet-stream",
    });
  } catch (e) {
    console.error("[c/upload] Error:", (e as Error).message, e);
    return NextResponse.json(
      { error: "فشل في رفع الملف على الخادم" },
      { status: 500 },
    );
  }
}
