import { NextRequest, NextResponse } from "next/server";
import { createClient, type Client } from "@libsql/client";

// ------------------------------------------------------------------
// Types
// ------------------------------------------------------------------

type TargetFormat = "PDF" | "DOCX" | "XLSX" | "JPG" | "PNG";

const VALID_FORMATS: TargetFormat[] = ["PDF", "DOCX", "XLSX", "JPG", "PNG"];

// ------------------------------------------------------------------
// Database client (direct — no timeout)
// ------------------------------------------------------------------

let _client: Client | null = null;
function getClient(): Client {
  if (_client) return _client;
  const rawUrl = process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL;
  const token = process.env.TURSO_AUTH_TOKEN;
  if (!rawUrl) throw new Error("No database URL configured");
  const url = rawUrl.startsWith("libsql://")
    ? rawUrl.replace("libsql://", "https://")
    : rawUrl.startsWith("libsql+http://")
    ? rawUrl.replace("libsql+http://", "https://")
    : rawUrl;
  _client = createClient({ url, authToken: token, intMode: "number" });
  return _client;
}

async function dbQuery<T = Record<string, unknown>>(sql: string, args: unknown[] = []): Promise<T[]> {
  const client = getClient();
  const result = await client.execute({ sql, args: args as never[] });
  return result.rows as unknown as T[];
}

// ------------------------------------------------------------------
// Retrieve file from database (assembled base64)
// ------------------------------------------------------------------

async function getFileFromDatabase(fileId: string): Promise<{ buffer: Buffer; fileName: string; fileExt: string } | null> {
  try {
    // Check upload status
    const uploads = await dbQuery<{ id: string; fileName: string; fileExt: string; status: string; assembledBase64: string }>(
      `SELECT id, "fileName", "fileExt", status, "assembledBase64" FROM "FileUpload" WHERE id = ?`,
      [fileId]
    );

    if (uploads.length === 0) return null;
    const upload = uploads[0];

    // If already assembled, use that
    if (upload.assembledBase64) {
      return {
        buffer: Buffer.from(upload.assembledBase64, "base64"),
        fileName: upload.fileName,
        fileExt: upload.fileExt,
      };
    }

    // Assemble from chunks
    const chunks = await dbQuery<{ chunkIndex: number; data: string }>(
      `SELECT "chunkIndex", data FROM "FileChunk" WHERE "uploadId" = ? ORDER BY "chunkIndex" ASC`,
      [fileId]
    );

    if (chunks.length === 0) return null;

    // Concatenate all chunks
    const fullBase64 = chunks.map(c => c.data).join("");
    const buffer = Buffer.from(fullBase64, "base64");

    // Cache assembled data back to upload row (for future requests)
    try {
      const client = getClient();
      await client.execute({
        sql: `UPDATE "FileUpload" SET status = 'complete', "assembledBase64" = ? WHERE id = ?`,
        args: [fullBase64, fileId] as never[],
      });
    } catch { /* ignore cache write failure */ }

    return { buffer, fileName: upload.fileName, fileExt: upload.fileExt };
  } catch (e) {
    console.error("[convert] DB file retrieval error:", e);
    return null;
  }
}

// ------------------------------------------------------------------
// Image → Image conversion (using sharp in memory)
// ------------------------------------------------------------------

async function convertImageInMemory(
  sourceBuffer: Buffer,
  sourceExt: string,
  targetFormat: "JPG" | "PNG",
): Promise<{ convertedBuffer: Buffer; newExt: string }> {
  const sharp = (await import("sharp")).default;

  let pipeline = sharp(sourceBuffer);

  // Handle source formats
  if (sourceExt === "webp") {
    pipeline = pipeline.webp();
  }

  if (targetFormat === "JPG") {
    pipeline = pipeline.flatten({ background: "#ffffff" });
    const buf = await pipeline.jpeg({ quality: 92 }).toBuffer();
    return { convertedBuffer: buf, newExt: "jpg" };
  } else {
    const buf = await pipeline.png().toBuffer();
    return { convertedBuffer: buf, newExt: "png" };
  }
}

// ------------------------------------------------------------------
// Store converted file back as new upload
// ------------------------------------------------------------------

async function storeConvertedFile(
  convertedBuffer: Buffer,
  originalName: string,
  newExt: string,
): Promise<string> {
  const newFileId = `conv_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const base64 = convertedBuffer.toString("base64");
  const newFileName = originalName.replace(/\.[^.]+$/, `.${newExt}`);

  const client = getClient();

  // Store as single-chunk upload
  await client.execute({
    sql: `INSERT INTO "FileUpload" (id, "fileName", "fileSize", "fileExt", "totalChunks", "receivedCount", status, "assembledBase64", "createdAt") VALUES (?, ?, ?, ?, 1, 1, 'complete', ?, ?)`,
    args: [newFileId, newFileName, convertedBuffer.length, newExt, base64, new Date().toISOString()] as never[],
  });

  return newFileId;
}

// ------------------------------------------------------------------
// POST handler
// ------------------------------------------------------------------

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { storedFileName, targetFormat, fileDataUrl } = body;

    // Accept either storedFileName (DB fileId) or direct base64 data
    const fileId = storedFileName || "";

    if (!fileId && !fileDataUrl) {
      return NextResponse.json({ success: false, error: "لم يتم تحديد ملف" }, { status: 400 });
    }

    if (!targetFormat || !VALID_FORMATS.includes(targetFormat)) {
      return NextResponse.json({ success: false, error: "تنسيق الهدف غير صالح" }, { status: 400 });
    }

    // Get source buffer
    let sourceBuffer: Buffer;
    let sourceExt: string;
    let originalName: string;

    if (fileDataUrl) {
      // Direct base64 data URL
      const base64Match = fileDataUrl.match(/^data:[^;]+;base64,(.+)$/);
      if (!base64Match) {
        return NextResponse.json({ success: false, error: "صيغة بيانات الملف غير صالحة" }, { status: 400 });
      }
      sourceBuffer = Buffer.from(base64Match[1], "base64");
      sourceExt = ""; // unknown from data URL
      originalName = "file";
    } else {
      // Database file
      const fileData = await getFileFromDatabase(fileId);
      if (!fileData) {
        return NextResponse.json({ success: false, error: "الملف غير موجود" }, { status: 404 });
      }
      sourceBuffer = fileData.buffer;
      sourceExt = fileData.fileExt;
      originalName = fileData.fileName;
    }

    const isImage = ["jpg", "jpeg", "png", "webp", "gif", "bmp"].includes(sourceExt);
    const isPdf = sourceExt === "pdf";

    // Image → Image conversion
    if ((isImage || sourceExt === "") && (targetFormat === "JPG" || targetFormat === "PNG")) {
      try {
        const { convertedBuffer, newExt } = await convertImageInMemory(sourceBuffer, sourceExt, targetFormat);
        const newFileId = await storeConvertedFile(convertedBuffer, originalName, newExt);

        return NextResponse.json({
          success: true,
          newStoredFileName: newFileId,
          newFileType: newExt.toUpperCase(),
          newFileName: originalName.replace(/\.[^.]+$/, `.${newExt}`),
        });
      } catch (e) {
        console.error("[convert] Image conversion error:", e);
        return NextResponse.json({
          success: false,
          error: "فشل تحويل الصورة — تأكد من أن الملف صورة صالحة",
        }, { status: 500 });
      }
    }

    // PDF → Image (not supported server-side without canvas)
    if (isPdf && (targetFormat === "JPG" || targetFormat === "PNG")) {
      return NextResponse.json({
        success: false,
        error: "تحويل PDF إلى صورة غير متاح. يمكنك رفع الصورة مباشرة.",
      }, { status: 400 });
    }

    // Same format check
    if (sourceExt && sourceExt === targetFormat.toLowerCase()) {
      return NextResponse.json({ success: false, error: "الملف بالفعل بهذا التنسيق" }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      error: `تحويل ${sourceExt ? sourceExt.toUpperCase() : "هذا"} إلى ${targetFormat} غير مدعوم حالياً`,
    }, { status: 400 });
  } catch (error) {
    console.error("[convert] Error:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "خطأ في التحويل",
    }, { status: 500 });
  }
}
