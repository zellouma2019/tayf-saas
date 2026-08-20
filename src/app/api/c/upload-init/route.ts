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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { fileName, fileSize, mimeType, chunkSize } = body;

    if (!fileName || !fileSize) {
      return NextResponse.json({ error: "بيانات غير كافية" }, { status: 400 });
    }

    if (fileSize > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `حجم الملف ${(fileSize / (1024 * 1024)).toFixed(1)} ميغابايت يتجاوز الحد (100 ميغابايت)` },
        { status: 413 },
      );
    }

    const ext = fileName.split(".").pop()?.toLowerCase() || "";
    if (!ACCEPTED_EXTENSIONS.includes(ext)) {
      return NextResponse.json(
        { error: `صيغة ".${ext}" غير مدعومة` },
        { status: 400 },
      );
    }

    const fileId = `up_${Date.now()}_${crypto.randomBytes(6).toString("hex")}`;
    const effectiveChunkSize = chunkSize || 2 * 1024 * 1024; // 2MB default
    const totalChunks = Math.ceil(fileSize / effectiveChunkSize);

    // Create temp directory for chunks
    const chunksDir = getUploadsDir();
    const sessionDir = path.join(chunksDir, fileId);
    fs.mkdirSync(sessionDir, { recursive: true });

    // Write metadata
    fs.writeFileSync(
      path.join(sessionDir, ".meta.json"),
      JSON.stringify({
        fileId,
        originalName: fileName,
        size: fileSize,
        mimeType,
        ext,
        chunkSize: effectiveChunkSize,
        totalChunks,
        createdAt: Date.now(),
        completedChunks: [],
      }),
    );

    return NextResponse.json({
      fileId,
      chunkSize: effectiveChunkSize,
      totalChunks,
    });
  } catch (e) {
    console.error("[upload-init] Error:", e);
    return NextResponse.json({ error: "فشل في تهيئة الرفع" }, { status: 500 });
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
