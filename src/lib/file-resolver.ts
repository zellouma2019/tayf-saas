/**
 * file-resolver.ts — حلّ بيانات الملف من أي صيغة
 *
 * الصيغ المدعومة:
 * 1. data:...;base64,... → base64 data URL (تمرير مباشر)
 * 2. file_...            → مسار ملف على القرص (التطوير المحلي فقط)
 * 3. __chunked__:<id>    → ملف مخزن كأجزاء في قاعدة البيانات (يُقرأ ويُجمع)
 *
 * يُستخدم في جميع نقاط النهاية التي تتعامل مع ملفات الطلبات:
 * - /api/orders/[id]/file     (تنزيل)
 * - /api/orders/[id]/preview   (معاينة)
 * - /api/orders/[id]/thumbnail (صورة مصغّرة)
 * - /api/orders/[id]/verify-print
 */
import { tursoQuery, tursoExecute } from "@/lib/turso-lite";
import { createClient, type Client } from "@libsql/client";

let _directClient: Client | null = null;

/**
 * عميل مباشر بدون مهلة — لعمليات القراءة الكبيرة (ملفات مجمّعة)
 */
function getDirectClient(): Client {
  if (_directClient) return _directClient;
  const rawUrl = process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL;
  const token = process.env.TURSO_AUTH_TOKEN;
  if (!rawUrl) throw new Error("No database URL");
  const url = rawUrl.startsWith("libsql://")
    ? rawUrl.replace("libsql://", "https://")
    : rawUrl.startsWith("libsql+http://")
    ? rawUrl.replace("libsql+http://", "https://")
    : rawUrl;
  _directClient = createClient({ url, authToken: token, intMode: "number" });
  return _directClient;
}

/**
 * حلّ بيانات الملف من أي صيغة إلى data URL كامل (أو null)
 */
export async function resolveFileData(fileData: string | null | undefined): Promise<string | null> {
  if (!fileData) return null;

  // 1. بالفعل data URL — تمرير مباشر
  if (fileData.startsWith("data:")) return fileData;

  // 2. ملف مجزأ في قاعدة البيانات
  if (fileData.startsWith("__chunked__:")) {
    const uploadId = fileData.replace("__chunked__:", "");

    try {
      // محاولة قراءة البيانات المجتمعة أولاً
      const rows = await tursoQuery<{ assembledBase64: string | null; status: string }>(
        `SELECT "assembledBase64", status FROM "FileUpload" WHERE id = ?`,
        [uploadId]
      );
      const upload = rows[0];

      if (upload?.assembledBase64 && upload.status === "complete") {
        return upload.assembledBase64;
      }

      // إذا لم تكن مجمعة — اجمع الأجزاء (حالة نادرة: الفشل أثناء التجميع)
      if (upload?.status === "uploading") {
        const chunkRows = await tursoQuery<{ data: string }>(
          `SELECT data FROM "FileChunk" WHERE "uploadId" = ? ORDER BY "chunkIndex"`,
          [uploadId]
        );

        if (chunkRows.length > 0) {
          const ext = uploadId.includes("pdf") ? "pdf" : "bin";
          const MIME_MAP: Record<string, string> = {
            pdf: "application/pdf",
            docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            jpg: "image/jpeg", jpeg: "image/jpeg",
            png: "image/png", webp: "image/webp",
          };

          // احصل على الامتداد من بيانات الرفع
          const uploadRows = await tursoQuery<{ fileExt: string }>(
            `SELECT "fileExt" FROM "FileUpload" WHERE id = ?`,
            [uploadId]
          );
          const fileExt = uploadRows[0]?.fileExt || ext;
          const mime = MIME_MAP[fileExt] || "application/octet-stream";

          const fullBase64 = chunkRows.map(r => r.data).join("");
          const dataUrl = `data:${mime};base64,${fullBase64}`;

          // خزّن البيانات المجتمعة لاستخدامها لاحقاً
          try {
            const client = getDirectClient();
            await client.execute({
              sql: `UPDATE "FileUpload" SET status = 'complete', "assembledBase64" = ? WHERE id = ?`,
              args: [dataUrl, uploadId] as never[],
            });
            await tursoExecute(`DELETE FROM "FileChunk" WHERE "uploadId" = ?`, [uploadId]);
          } catch {
            // تجاهل أخطاء التنظيف
          }

          return dataUrl;
        }
      }

      return null;
    } catch (e) {
      console.error("[file-resolver] Failed to resolve chunked file:", e);
      return null;
    }
  }

  // 3. مسار ملف على القرص (التطوير المحلي)
  if (fileData.startsWith("file_")) {
    return fileData; // سيتعامل معه الـ endpoint مباشرة عبر fs
  }

  // 4. قيمة غير معروفة — أرجعها كما هي
  return fileData;
}

/**
 * تنظيف جلسة رفع قديمة (أقدم من ساعة)
 */
export async function cleanupOldUploads(): Promise<void> {
  try {
    await tursoExecute(
      `DELETE FROM "FileChunk" WHERE "uploadId" IN (SELECT id FROM "FileUpload" WHERE status = 'uploading' AND datetime("createdAt") < datetime('now', '-1 hour'))`
    );
    await tursoExecute(
      `DELETE FROM "FileUpload" WHERE status = 'uploading' AND datetime("createdAt") < datetime('now', '-1 hour')`
    );
    // تنظيف الملفات المكتملة الأقدم من 7 أيام
    await tursoExecute(
      `DELETE FROM "FileUpload" WHERE status = 'complete' AND datetime("createdAt") < datetime('now', '-7 days')`
    );
  } catch {
    // تجاهل أخطاء التنظيف
  }
}
