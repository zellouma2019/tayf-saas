import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { withRateLimit } from "@/lib/rate-limit";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB
const ACCEPTED_EXTENSIONS = [
  // Images
  "pdf", "jpg", "jpeg", "png", "webp", "gif", "svg", "bmp", "tiff", "tif", "avif",
  // Documents (accepted for upload, processed as needed)
  "docx", "doc", "xlsx", "xls", "pptx", "ppt", "txt", "rtf", "csv",
  // Design/Print files
  "ai", "eps", "psd", "indd",
];

/** Map MIME types to safe extensions */
const MIME_TO_EXT: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/svg+xml": "svg",
  "image/bmp": "bmp",
  "image/tiff": "tiff",
  "image/avif": "avif",
  "image/heic": "heic",
  "image/heif": "heif",
  "application/pdf": "pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
  "application/vnd.ms-excel": "xls",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
  "application/vnd.ms-powerpoint": "ppt",
  "text/plain": "txt",
  "text/csv": "csv",
  "application/rtf": "rtf",
  "application/postscript": "eps",
  "application/illustrator": "ai",
  "image/vnd.adobe.photoshop": "psd",
};

export async function POST(req: NextRequest) {
  const rl = withRateLimit(req, "c-upload");
  if (!rl.ok) return rl.response;

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "لم يتم إرسال ملف" }, { status: 400 });
    }

    if (file.size === 0) {
      return NextResponse.json({ error: "الملف فارغ" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `حجم الملف ${(file.size / (1024 * 1024)).toFixed(1)} ميغابايت يتجاوز الحد الأقصى (50 ميغابايت)` },
        { status: 413 },
      );
    }

    // Determine extension from MIME type first, then from name
    let ext = MIME_TO_EXT[file.type] || "";
    if (!ext) {
      const nameExt = file.name.split(".").pop()?.toLowerCase() || "";
      if (nameExt && ACCEPTED_EXTENSIONS.includes(nameExt)) {
        ext = nameExt;
      }
    }

    if (!ext || !ACCEPTED_EXTENSIONS.includes(ext)) {
      return NextResponse.json(
        { error: `صيغة الملف غير مدعومة. الأنواع المدعومة: ${ACCEPTED_EXTENSIONS.join(", ")}` },
        { status: 400 },
      );
    }

    // Ensure uploads directory exists
    const uploadsDir = path.join(process.cwd(), "uploads");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Generate a unique filename to avoid collisions
    const randomSuffix = crypto.randomBytes(8).toString("hex");
    const timestamp = Date.now();
    const storedFileName = `file_${timestamp}_${randomSuffix}.${ext}`;
    const finalPath = path.join(uploadsDir, storedFileName);

    // Write file to disk
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    fs.writeFileSync(finalPath, buffer);

    return NextResponse.json({ storedFileName });
  } catch (e) {
    console.error("[c/upload] error:", e);
    return NextResponse.json(
      { error: "فشل في رفع الملف" },
      { status: 500 },
    );
  }
}
