import { NextRequest, NextResponse } from "next/server";
import { tursoQuery, tursoExecute } from "@/lib/turso-lite";
import { createClient, type Client } from "@libsql/client";
import { cleanupOldUploads } from "@/lib/file-resolver";

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
 * عميل مباشر بدون مهلة — لعمليات الكتابة/القراءة الكبيرة
 * (تجميع الأجزاء قد يستغرق أكثر من 12 ثانية)
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

/**
 * إنشاء جداول الأجزاء إن لم تكن موجودة — محسّن: 2 استعلامات فقط
 * يُستخدم turso-lite مباشرة (بدون Prisma — أسرع وأخف)
 */
let _tablesEnsured = false;
async function ensureUploadTables() {
  if (_tablesEnsured) return;

  try {
    await tursoExecute(`CREATE TABLE IF NOT EXISTS "FileUpload" (
      id TEXT PRIMARY KEY,
      "fileName" TEXT NOT NULL,
      "fileSize" INTEGER NOT NULL,
      "fileExt" TEXT NOT NULL,
      "totalChunks" INTEGER NOT NULL,
      "receivedCount" INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'uploading',
      "assembledBase64" TEXT,
      "createdAt" TEXT NOT NULL
    )`);
    await tursoExecute(`CREATE TABLE IF NOT EXISTS "FileChunk" (
      id TEXT PRIMARY KEY,
      "uploadId" TEXT NOT NULL,
      "chunkIndex" INTEGER NOT NULL,
      data TEXT NOT NULL,
      "createdAt" TEXT NOT NULL
    )`);
    try {
      await tursoExecute(`CREATE INDEX IF NOT EXISTS "idx_filechunk_uploadId" ON "FileChunk"("uploadId")`);
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
    const existingUpload = await tursoQuery<{ status: string; receivedCount: string; totalChunks: string }>(
      `SELECT status, "receivedCount", "totalChunks" FROM "FileUpload" WHERE id = ?`,
      [fileId]
    );
    if (existingUpload.length > 0 && existingUpload[0].status === "complete") {
      return NextResponse.json({
        chunkIndex,
        received: parseInt(existingUpload[0].receivedCount || "0", 10),
        total: parseInt(existingUpload[0].totalChunks || String(totalChunks), 10),
        complete: true,
        storedFileName: fileId,
      });
    }

    // ─── إنشاء جلسة الرفع إن لم تكن موجودة (استعلام واحد: INSERT OR IGNORE) ───
    await tursoExecute(
      `INSERT OR IGNORE INTO "FileUpload" (id, "fileName", "fileSize", "fileExt", "totalChunks", "receivedCount", status, "createdAt") VALUES (?, ?, ?, ?, ?, 0, 'uploading', ?)`,
      [fileId, fileName, fileSize, fileExt, totalChunks, new Date().toISOString()]
    );

    // ─── حفظ الجزء (استعلام واحد: INSERT OR IGNORE — يتجاهل التكرار للموازية) ───
    const chunkBuffer = Buffer.from(await chunk.arrayBuffer());
    const chunkBase64 = chunkBuffer.toString("base64");
    const chunkId = `${fileId}_c${chunkIndex}`;

    const insertResult = await tursoExecute(
      `INSERT OR IGNORE INTO "FileChunk" (id, "uploadId", "chunkIndex", data, "createdAt") VALUES (?, ?, ?, ?, ?)`,
      [chunkId, fileId, chunkIndex, chunkBase64, new Date().toISOString()]
    );

    // ─── تحديث العداد فقط إذا كان الجزء جديداً ───
    if (insertResult.rowsAffected > 0) {
      // تحديث العداد (بشرط عدم تجاوز المجموع — يمنع التجاوز في الموازية)
      await tursoExecute(
        `UPDATE "FileUpload" SET "receivedCount" = "receivedCount" + 1 WHERE id = ? AND "receivedCount" < "totalChunks"`,
        [fileId]
      );

      // ─── هل اكتمل الملف؟ ───
      const upload = await tursoQuery<{ receivedCount: string; totalChunks: string; fileExt: string }>(
        `SELECT "receivedCount", "totalChunks", "fileExt" FROM "FileUpload" WHERE id = ?`,
        [fileId]
      );
      const receivedCount = parseInt(upload[0]?.receivedCount || "0", 10);
      const totalCount = parseInt(upload[0]?.totalChunks || String(totalChunks), 10);

      if (receivedCount >= totalCount) {
        // ─── تجميع الأجزاء ───
        const ext = upload[0]?.fileExt || fileExt;
        const mime = MIME_MAP[ext] || "application/octet-stream";

        try {
          const client = getDirectClient();
          const chunkRows = await client.execute({
            sql: `SELECT data FROM "FileChunk" WHERE "uploadId" = ? ORDER BY "chunkIndex"`,
            args: [fileId] as never[],
          });

          const fullBase64 = chunkRows.rows.map(r => r.data as string).join("");
          const dataUrl = `data:${mime};base64,${fullBase64}`;

          await client.execute({
            sql: `UPDATE "FileUpload" SET status = 'complete', "assembledBase64" = ? WHERE id = ?`,
            args: [dataUrl, fileId] as never[],
          });

          // حذف الأجزاء الفردية
          await tursoExecute(`DELETE FROM "FileChunk" WHERE "uploadId" = ?`, [fileId]);

          // تنظيف الجلسات القديمة بشكل عشوائي (10% من المرات)
          if (Math.random() < 0.1) {
            cleanupOldUploads().catch(() => {});
          }

          return NextResponse.json({
            storedFileName: fileId,
            originalName: fileName,
            size: fileSize,
            type: ext,
            complete: true,
            received: totalCount,
            total: totalCount,
          });
        } catch (assemblyErr) {
          console.error("[upload-chunk] Assembly failed:", assemblyErr);
          return NextResponse.json(
            { error: "فشل تجميع الملف — يرجى المحاولة مرة أخرى" },
            { status: 500 },
          );
        }
      }
    }

    // ─── إرجاع التقدم الحالي ───
    const current = await tursoQuery<{ receivedCount: string; totalChunks: string; status: string }>(
      `SELECT "receivedCount", "totalChunks", status FROM "FileUpload" WHERE id = ?`,
      [fileId]
    );
    const u = current[0];
    const isComplete = u?.status === "complete";

    return NextResponse.json({
      chunkIndex,
      received: parseInt(u?.receivedCount || "0", 10),
      total: parseInt(u?.totalChunks || String(totalChunks), 10),
      complete: isComplete,
      storedFileName: isComplete ? fileId : undefined,
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
