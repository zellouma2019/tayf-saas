import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const { fileId } = await req.json();

    if (!fileId) {
      return NextResponse.json({ error: "بيانات غير كافية" }, { status: 400 });
    }

    const chunksDir = getUploadsDir();
    const sessionDir = path.join(chunksDir, fileId);
    const metaPath = path.join(sessionDir, ".meta.json");

    if (!fs.existsSync(metaPath)) {
      return NextResponse.json({ error: "جلسة الرفع غير موجودة" }, { status: 404 });
    }

    const meta = JSON.parse(fs.readFileSync(metaPath, "utf-8"));

    // Verify all chunks uploaded
    const missing = [];
    for (let i = 0; i < meta.totalChunks; i++) {
      if (!fs.existsSync(path.join(sessionDir, `chunk_${i}`))) {
        missing.push(i);
      }
    }
    if (missing.length > 0) {
      return NextResponse.json({
        error: `أجزاء مفقودة: ${missing.join(", ")}`,
        missingChunks: missing,
        completedChunks: meta.completedChunks,
      }, { status: 400 });
    }

    // Assemble final file
    const finalDir = getUploadsDir();
    const finalFileName = `file_${Date.now()}_${crypto.randomBytes(8).toString("hex")}.${meta.ext}`;
    const finalPath = path.join(finalDir, finalFileName);

    const writeStream = fs.createWriteStream(finalPath);
    for (let i = 0; i < meta.totalChunks; i++) {
      const chunkPath = path.join(sessionDir, `chunk_${i}`);
      const chunkData = fs.readFileSync(chunkPath);
      writeStream.write(chunkData);
      fs.unlinkSync(chunkPath); // Delete chunk after writing
    }
    writeStream.end();

    await new Promise<void>((res) => writeStream.on("finish", res));

    // Cleanup session directory
    try {
      fs.unlinkSync(metaPath);
      fs.rmdirSync(sessionDir);
    } catch {
      // Non-critical
    }

    return NextResponse.json({
      storedFileName: finalFileName,
      originalName: meta.originalName,
      size: meta.size,
      type: meta.ext,
    });
  } catch (e) {
    console.error("[upload-complete] Error:", e);
    return NextResponse.json({ error: "فشل في تجميع الملف" }, { status: 500 });
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
