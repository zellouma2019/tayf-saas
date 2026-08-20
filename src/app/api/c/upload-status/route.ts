import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET(req: NextRequest) {
  try {
    const fileId = req.nextUrl.searchParams.get("fileId");
    if (!fileId) {
      return NextResponse.json({ error: "fileId مطلوب" }, { status: 400 });
    }

    const chunksDir = getUploadsDir();
    const sessionDir = path.join(chunksDir, fileId);
    const metaPath = path.join(sessionDir, ".meta.json");

    if (!fs.existsSync(metaPath)) {
      return NextResponse.json({ error: "جلسة غير موجودة" }, { status: 404 });
    }

    const meta = JSON.parse(fs.readFileSync(metaPath, "utf-8"));

    // Verify which chunks actually exist on disk
    const completedChunks: number[] = [];
    for (const idx of meta.completedChunks) {
      if (fs.existsSync(path.join(sessionDir, `chunk_${idx}`))) {
        completedChunks.push(idx);
      }
    }

    return NextResponse.json({
      fileId,
      totalChunks: meta.totalChunks,
      completedChunks,
      progress: Math.min(Math.round((completedChunks.length / meta.totalChunks) * 100), 99),
      originalName: meta.originalName,
      size: meta.size,
    });
  } catch (e) {
    console.error("[upload-status] Error:", e);
    return NextResponse.json({ error: "فشل في التحقق" }, { status: 500 });
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
