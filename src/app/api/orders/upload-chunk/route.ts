import { NextRequest, NextResponse } from "next/server";
import { createClient, type Client } from "@libsql/client";

// حجم الملف الأقصى: 50 ميغابايت
const MAX_FILE_SIZE = 50 * 1024 * 1024;
const ACCEPTED_EXTENSIONS = ["pdf", "docx", "jpg", "jpeg", "png", "webp"];

const MIME_MAP: Record<string, string> = {
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

/**
 * عميل مباشر بدون مهلة — لجميع عمليات الرفع
 * (يتجاوز turso-lite التي لها مهلة 12 ثانية + Prisma fallback البطيء)
 */
let _directClient: Client | null = null;
function getDirectClient(): Client {
  if (_directClient) return _directClient;
  const rawUrl = process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL;
  const token = process.env.TURSO_AUTH_TOKEN;
  if (!rawUrl) throw new Error("No database URL configured");
  const url = rawUrl.startsWith("libsql://")
    ? rawUrl.replace("libsql://", "https://")
    : rawUrl.startsWith("libsql+http://")
    ? rawUrl.replace("libsql+http://", "https://")
    : rawUrl;
  _directClient = createClient({ url, authToken: token, intMode: "number" });
  return _directClient;
}

/** تنفيذ استعلام مباشر بدون مهلة — أسرع وأكثر موثوقية على Vercel */
async function directExecute(sql: string, args: unknown[] = []) {
  const client = getDirectClient();
  return client.execute({ sql, args: args as never[] });
}

/** تنفيذ استعلام قراءة مباشر */
async function directQuery<T = Record<string, unknown>>(sql: string, args: unknown[] = []): Promise<T[]> {
  const client = getDirectClient();
  const result = await client.execute({ sql, args: args as never[] });
  return result.rows as unknown as T[];
}

/**
 * إنشاء جداول الأجزاء إن لم تكن موجودة — يُستخدم العميل المباشر فقط
 */
let _tablesEnsured = false;
async function ensureUploadTables() {
  if (_tablesEnsured) return;

  try {
    // تنفيذ موازي لإنشاء الجداول
    await Promise.all([
      directExecute(`CREATE TABLE IF NOT EXISTS "FileUpload" (
        id TEXT PRIMARY KEY,
        "fileName" TEXT NOT NULL,
        "fileSize" INTEGER NOT NULL,
        "fileExt" TEXT NOT NULL,
        "totalChunks" INTEGER NOT NULL,
        "receivedCount" INTEGER NOT NULL DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'uploading',
        "assembledBase64" TEXT,
        "createdAt" TEXT NOT NULL
      )`),
      directExecute(`CREATE TABLE IF NOT EXISTS "FileChunk" (
        id TEXT PRIMARY KEY,
        "uploadId" TEXT NOT NULL,
        "chunkIndex" INTEGER NOT NULL,
        data TEXT NOT NULL,
        "createdAt" TEXT NOT NULL
      )`),
    ]);
    try {
      await directExecute(`CREATE INDEX IF NOT EXISTS "idx_filechunk_uploadId" ON "FileChunk"("uploadId")`);
    } catch { /* index may exist */ }
    _tablesEnsured = true;
  } catch (e) {
    console.error("[upload-chunk] Table creation failed:", (e as Error).message);
    throw new Error("فشل إنشاء جداول التخزين المؤقت — يرجى المحاولة لاحقاً");
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureUploadTables();

    const formData = await req.formData();
    const chunk = formData.get("chunk") as File | null;
    const fileId = formData.get("fileId") as string | null;
    const chunkIndex = parseInt(formData.get("chunkIndex") as string, 10);
    const totalChunks = parseInt(formData.get("totalChunks") as string, 10);
    const fileName = formData.get("fileName") as string | null;
    const fileSize = parseInt(formData.get("fileSize") as string, 10);
    const fileExt = formData.get("fileExt") as string | null;

    if (!chunk || fileId == null || isNaN(chunkIndex) || isNaN(totalChunks) || !fileName || isNaN(fileSize) || !fileExt) {
      return NextResponse.json({ error: "بيانات غير مكتملة" }, { status: 400 });
    }

    if (fileSize > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `حجم الملف ${(fileSize / (1024 * 1024)).toFixed(1)} ميغابايت يتجاوز الحد الأقصى (50 ميغابايت)` },
        { status: 413 },
      );
    }

    if (!ACCEPTED_EXTENSIONS.includes(fileExt)) {
      return NextResponse.json(
        { error: `صيغة الملف ".${fileExt}" غير مدعومة` },
        { status: 400 },
      );
    }

    // ─── تحقق مما إذا كان الرفع مكتمل مسبقاً (إعادة المحاولة) ───
    const existingRows = await directQuery<{ status: string; receivedCount: number; totalChunks: number }>(
      `SELECT status, "receivedCount", "totalChunks" FROM "FileUpload" WHERE id = ?`,
      [fileId]
    );
    if (existingRows.length > 0) {
      const existing = existingRows[0];
      if (existing.status === "complete" || existing.status === "chunks_ready") {
        return NextResponse.json({
          chunkIndex,
          received: existing.receivedCount,
          total: existing.totalChunks,
          complete: true,
          storedFileName: fileId,
        });
      }
    }

    // ─── استعلام واحد: INSERT OR IGNORE لجلسة الرفع ───
    await directExecute(
      `INSERT OR IGNORE INTO "FileUpload" (id, "fileName", "fileSize", "fileExt", "totalChunks", "receivedCount", status, "createdAt") VALUES (?, ?, ?, ?, ?, 0, 'uploading', ?)`,
      [fileId, fileName, fileSize, fileExt, totalChunks, new Date().toISOString()]
    );

    // ─── تحويل الجزء إلى base64 ───
    const chunkBuffer = Buffer.from(await chunk.arrayBuffer());
    const chunkBase64 = chunkBuffer.toString("base64");
    const chunkId = `${fileId}_c${chunkIndex}`;

    // ─── استعلام واحد: INSERT OR IGNORE للجزء ───
    const insertResult = await directExecute(
      `INSERT OR IGNORE INTO "FileChunk" (id, "uploadId", "chunkIndex", data, "createdAt") VALUES (?, ?, ?, ?, ?)`,
      [chunkId, fileId, chunkIndex, chunkBase64, new Date().toISOString()]
    );

    // ─── تحديث العداد فقط إذا كان الجزء جديداً (استعلام واحد بدلاً من اثنين) ───
    if (insertResult.rowsAffected > 0) {
      // UPDATE + RETURNING في استعلام واحد — يحل محل UPDATE منفصل + SELECT منفصل
      const updateRows = await directQuery<{ receivedCount: number; totalChunks: number; fileExt: string }>(
        `UPDATE "FileUpload" SET "receivedCount" = "receivedCount" + 1 WHERE id = ? AND "receivedCount" < "totalChunks" RETURNING "receivedCount", "totalChunks", "fileExt"`,
        [fileId]
      );

      if (updateRows.length > 0) {
        const row = updateRows[0];
        const newCount = row.receivedCount;
        const totalCount = row.totalChunks;

        if (newCount >= totalCount) {
          // ─── تجاوز التجميع! وضع chunks_ready فقط ───
          // التجميع يتم بشكل كسول عند أول وصول للملف (في file-resolver.ts)
          // هذا يوفر 20-60+ ثانية من عمليات القراءة/الكتابة الضخمة على Turso
          await directExecute(
            `UPDATE "FileUpload" SET status = 'chunks_ready' WHERE id = ?`,
            [fileId]
          );

          return NextResponse.json({
            storedFileName: fileId,
            originalName: fileName,
            size: fileSize,
            type: fileExt,
            complete: true,
            received: totalCount,
            total: totalCount,
          });
        }
      }

      // ─── إرجاع التقدم الحالي ───
      const progressRows = await directQuery<{ receivedCount: number; totalChunks: number }>(
        `SELECT "receivedCount", "totalChunks" FROM "FileUpload" WHERE id = ?`,
        [fileId]
      );
      const p = progressRows[0];

      return NextResponse.json({
        chunkIndex,
        received: p?.receivedCount || 0,
        total: p?.totalChunks || totalChunks,
        complete: false,
      });
    }

    // ─── الجزء مكرر (تم رفعه سابقاً) ───
    const dupRows = await directQuery<{ receivedCount: number; totalChunks: number; status: string }>(
      `SELECT "receivedCount", "totalChunks", status FROM "FileUpload" WHERE id = ?`,
      [fileId]
    );
    const d = dupRows[0];

    return NextResponse.json({
      chunkIndex,
      received: d?.receivedCount || 0,
      total: d?.totalChunks || totalChunks,
      complete: d?.status === "complete" || d?.status === "chunks_ready",
      storedFileName: d?.status === "complete" || d?.status === "chunks_ready" ? fileId : undefined,
    });
  } catch (e) {
    const errMsg = (e as Error)?.message || String(e);
    console.error("[upload-chunk] Error:", errMsg, e);
    return NextResponse.json(
      { error: "فشل في حفظ الجزء على الخادم", detail: errMsg },
      { status: 500 },
    );
  }
}
