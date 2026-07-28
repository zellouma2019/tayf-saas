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
 * إنشاء جداول الأجزاء إن لم تكن موجودة
 * يُستخدم العميل المباشر (بدون مهلة) لضمان نجاح الإنشاء حتى مع cold start
 */
let _tablesEnsured = false;
async function ensureUploadTables() {
  if (_tablesEnsured) return;
  
  const createUploadTable = `CREATE TABLE IF NOT EXISTS FileUpload (
    id TEXT PRIMARY KEY,
    fileName TEXT NOT NULL,
    fileSize INTEGER NOT NULL,
    fileExt TEXT NOT NULL,
    totalChunks INTEGER NOT NULL,
    receivedCount INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'uploading',
    assembledBase64 TEXT,
    createdAt TEXT NOT NULL
  )`;
  const createChunkTable = `CREATE TABLE IF NOT EXISTS FileChunk (
    id TEXT PRIMARY KEY,
    uploadId TEXT NOT NULL,
    chunkIndex INTEGER NOT NULL,
    data TEXT NOT NULL,
    createdAt TEXT NOT NULL
  )`;
  const createIndex = `CREATE INDEX IF NOT EXISTS idx_filechunk_uploadId ON FileChunk(uploadId)`;

  // الاستراتيجية 1: العميل المباشر (بدون مهلة — مناسب لـ cold start)
  try {
    const client = getDirectClient();
    await client.execute({ sql: createUploadTable, args: [] });
    await client.execute({ sql: createChunkTable, args: [] });
    try { await client.execute({ sql: createIndex, args: [] }); } catch { /* index may exist */ }
    _tablesEnsured = true;
    return;
  } catch (directErr) {
    console.warn("[upload-chunk] Direct client failed, trying Prisma:", (directErr as Error).message);
  }

  // الاستراتيجية 2: Prisma fallback
  try {
    const { db } = await import("@/lib/db");
    await db.$executeRawUnsafe(createUploadTable);
    await db.$executeRawUnsafe(createChunkTable);
    try { await db.$executeRawUnsafe(createIndex); } catch { /* index may exist */ }
    _tablesEnsured = true;
    return;
  } catch (prismaErr) {
    console.error("[upload-chunk] Prisma fallback also failed:", (prismaErr as Error).message);
    // الاستراتيجية 3: turso-lite (مع مهلة أطول نسبياً)
    try {
      await tursoExecute(createUploadTable);
      await tursoExecute(createChunkTable);
      _tablesEnsured = true;
      return;
    } catch (tursoErr) {
      console.error("[upload-chunk] All table creation strategies failed:", tursoErr);
      throw new Error("فشل إنشاء جداول التخزين المؤقت — يرجى المحاولة لاحقاً");
    }
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

    if (!file || fileId == null || isNaN(chunkIndex) || isNaN(totalChunks) || !fileName || isNaN(fileSize) || !fileExt) {
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

    // ─── التحقق من وجود الجزء مسبقاً ───
    const existingChunk = await tursoQuery<{ id: string }>(
      `SELECT id FROM "FileChunk" WHERE "uploadId" = ? AND "chunkIndex" = ? LIMIT 1`,
      [fileId, chunkIndex]
    );

    if (existingChunk.length > 0) {
      // الجزء موجود — أرجع التقدم الحالي
      const upload = await tursoQuery<{ receivedCount: number; totalChunks: number; status: string }>(
        `SELECT "receivedCount", "totalChunks", status FROM "FileUpload" WHERE id = ?`,
        [fileId]
      );
      const u = upload[0];
      const isComplete = u?.status === "complete";
      return NextResponse.json({
        chunkIndex,
        received: Number(u?.receivedCount || 0),
        total: Number(u?.totalChunks || totalChunks),
        complete: isComplete,
        storedFileName: isComplete ? fileId : undefined,
      });
    }

    // ─── إنشاء جلسة الرفع إن لم تكن موجودة ───
    const existingUpload = await tursoQuery<{ id: string }>(
      `SELECT id FROM "FileUpload" WHERE id = ?`,
      [fileId]
    );

    if (existingUpload.length === 0) {
      await tursoExecute(
        `INSERT INTO "FileUpload" (id, "fileName", "fileSize", "fileExt", "totalChunks", "receivedCount", status, "createdAt") VALUES (?, ?, ?, ?, ?, 0, 'uploading', ?)`,
        [fileId, fileName, fileSize, fileExt, totalChunks, new Date().toISOString()]
      );
    }

    // ─── قراءة الجزء وتحويله إلى base64 ───
    const chunkBuffer = Buffer.from(await chunk.arrayBuffer());
    const chunkBase64 = chunkBuffer.toString("base64");
    const chunkId = `${fileId}_c${chunkIndex}`;

    // ─── حفظ الجزء في قاعدة البيانات ───
    await tursoExecute(
      `INSERT INTO "FileChunk" (id, "uploadId", "chunkIndex", data, "createdAt") VALUES (?, ?, ?, ?, ?)`,
      [chunkId, fileId, chunkIndex, chunkBase64, new Date().toISOString()]
    );

    // ─── تحديث عدد الأجزاء المستلمة ───
    await tursoExecute(
      `UPDATE "FileUpload" SET "receivedCount" = "receivedCount" + 1 WHERE id = ?`,
      [fileId]
    );

    // ─── هل اكتمل الملف؟ ───
    const updated = await tursoQuery<{ receivedCount: string; totalChunks: string; fileExt: string }>(
      `SELECT "receivedCount", "totalChunks", "fileExt" FROM "FileUpload" WHERE id = ?`,
      [fileId]
    );
    const upload = updated[0];
    const receivedCount = parseInt(upload?.receivedCount || "0", 10);
    const totalCount = parseInt(upload?.totalChunks || String(totalChunks), 10);

    if (receivedCount >= totalCount) {
      // ─── تجميع الأجزاء ───
      const ext = upload?.fileExt || fileExt;
      const mime = MIME_MAP[ext] || "application/octet-stream";

      try {
        // استخدم العميل المباشر بدون مهلة للتجميع
        const client = getDirectClient();
        const chunkRows = await client.execute({
          sql: `SELECT data FROM "FileChunk" WHERE "uploadId" = ? ORDER BY "chunkIndex"`,
          args: [fileId] as never[],
        });

        // دمج كل أجزاء base64 في سلسلة واحدة
        const fullBase64 = chunkRows.rows.map(r => r.data as string).join("");
        const dataUrl = `data:${mime};base64,${fullBase64}`;

        // حفظ البيانات المجتمعة
        await client.execute({
          sql: `UPDATE "FileUpload" SET status = 'complete', "assembledBase64" = ? WHERE id = ?`,
          args: [dataUrl, fileId] as never[],
        });

        // حذف الأجزاء الفردية (لم تعد ضرورية)
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

    return NextResponse.json({
      chunkIndex,
      received: receivedCount,
      total: totalCount,
      complete: false,
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
