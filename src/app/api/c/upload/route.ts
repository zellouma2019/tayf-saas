import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import crypto from "crypto";

/**
 * Universal File Upload Endpoint
 * Accepts any supported file type.
 * Tries /tmp/uploads first (Vercel), then cwd/uploads (local dev).
 * Returns storedFileName for reference.
 *
 * Note: On Vercel, /tmp is not shared between function invocations.
 * The client should always send the file directly to analysis endpoints as fallback.
 */

const MAX_FILE_SIZE = 100 * 1024 * 1024;

const ACCEPTED_EXTENSIONS = new Set([
  "pdf", "jpg", "jpeg", "png", "webp", "gif", "bmp", "tiff", "tif", "avif", "svg",
  "docx", "doc", "xlsx", "xls", "pptx", "ppt", "txt", "rtf", "csv",
  "ai", "eps", "psd", "indd",
]);

function getUploadsDir(): string {
  // On Vercel, only /tmp is writable
  const tmpDir = "/tmp/uploads";
  if (fs.existsSync(tmpDir) || process.env.VERCEL) {
    return tmpDir;
  }
  return path.join(process.cwd(), "uploads");
}

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "لم يتم إرسال ملف" }, { status: 400 });
    }

    const originalName = file.name || "upload";
    const ext = originalName.split(".").pop()?.toLowerCase() || "";

    if (!ext || !ACCEPTED_EXTENSIONS.has(ext)) {
      return NextResponse.json(
        { error: `صيغة الملف ".${ext || "?"}" غير مدعومة` },
        { status: 400 },
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `حجم الملف ${(file.size / (1024 * 1024)).toFixed(1)} ميغابايت يتجاوز 100 ميغابايت` },
        { status: 413 },
      );
    }

    const uploadsDir = getUploadsDir();
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const timestamp = Date.now();
    const randomSuffix = crypto.randomBytes(6).toString("hex");
    const storedFileName = `file_${timestamp}_${randomSuffix}.${ext}`;
    const filePath = path.join(uploadsDir, storedFileName);

    const fileBuffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(filePath, fileBuffer);

    const elapsed = Date.now() - startTime;
    console.log(
      `[upload] ${originalName} (${(file.size / (1024 * 1024)).toFixed(1)}MB, .${ext}) → ${storedFileName} in ${elapsed}ms [dir: ${uploadsDir}]`,
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
