import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const fileId = formData.get("fileId") as string;
    const chunkIndex = parseInt(formData.get("chunkIndex") as string, 10);
    const totalChunks = parseInt(formData.get("totalChunks") as string, 10);
    const chunk = formData.get("chunk") as File | null;

    if (!fileId || isNaN(chunkIndex) || !chunk) {
      return NextResponse.json({ error: "بيانات غير كافية" }, { status: 400 });
    }

    const chunksDir = getUploadsDir();
    const sessionDir = path.join(chunksDir, fileId);
    const metaPath = path.join(sessionDir, ".meta.json");

    if (!fs.existsSync(metaPath)) {
      return NextResponse.json({ error: "جلسة الرفع غير موجودة" }, { status: 404 });
    }

    // Write chunk
    const chunkPath = path.join(sessionDir, `chunk_${chunkIndex}`);
    const buffer = Buffer.from(await chunk.arrayBuffer());
    fs.writeFileSync(chunkPath, buffer);

    // Update metadata with completed chunk
    const meta = JSON.parse(fs.readFileSync(metaPath, "utf-8"));
    if (!meta.completedChunks.includes(chunkIndex)) {
      meta.completedChunks.push(chunkIndex);
    }
    fs.writeFileSync(metaPath, JSON.stringify(meta));

    const uploadedBytes = meta.completedChunks.length * meta.chunkSize;
    const progress = Math.min(Math.round((uploadedBytes / meta.size) * 100), 99);

    return NextResponse.json({
      chunkIndex,
      completedChunks: meta.completedChunks,
      progress,
    });
  } catch (e) {
    console.error("[upload-chunk] Error:", e);
    return NextResponse.json({ error: "فشل في رفع الجزء" }, { status: 500 });
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
