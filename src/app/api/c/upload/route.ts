import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import crypto from "crypto";

const MAX_FILE_SIZE = 100 * 1024 * 1024;
const ACCEPTED_EXTENSIONS = [
  "pdf", "jpg", "jpeg", "png", "webp", "gif", "bmp", "tiff", "tif", "avif", "svg",
  "docx", "doc", "xlsx", "xls", "pptx", "ppt", "txt", "rtf", "csv",
  "ai", "eps", "psd", "indd",
];

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

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "لم يتم إرسال ملف" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `حجم الملف ${(file.size / (1024 * 1024)).toFixed(1)} ميغابايت يتجاوز الحد الأقصى (100 ميغابايت)` },
        { status: 413 },
      );
    }

    const originalName = file.name || "unknown";
    const ext = originalName.split(".").pop()?.toLowerCase() || "";

    if (!ACCEPTED_EXTENSIONS.includes(ext)) {
      return NextResponse.json(
        { error: `صيغة الملف ".${ext}" غير مدعومة. الصيغ المدعومة: ${ACCEPTED_EXTENSIONS.join(", ")}` },
        { status: 400 },
      );
    }

    const uploadsDir = getUploadsDir();
    const randomSuffix = crypto.randomBytes(8).toString("hex");
    const timestamp = Date.now();
    const storedFileName = `file_${timestamp}_${randomSuffix}.${ext}`;
    const finalPath = path.join(uploadsDir, storedFileName);

    const buffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(finalPath, buffer);

    return NextResponse.json({
      storedFileName,
      originalName,
      size: file.size,
      type: ext,
    });
  } catch (e) {
    console.error("Upload error:", e);
    return NextResponse.json(
      { error: "فشل في رفع الملف" },
      { status: 500 },
    );
  }
}
