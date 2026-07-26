/**
 * عميل Turso خفيف الوزن — يتجاوز Prisma بالكامل لعمليات القراءة
 * أسرع من PrismaLibSQL على Vercel serverless (لا يُحمّل Prisma runtime)
 *
 * الاستراتيجية:
 * - استخدام نفس URL الخاص بـ PrismaLibSQL (libsql://) — يعمل بشكل موثوق
 * - اتصال واحد قابل لإعادة الاستخدام
 * - معاملات positional فقط
 * - يدعم SQLite المحلي تلقائياً عند غياب TURSO_DATABASE_URL
 */
import { createClient, type Client } from "@libsql/client";

let _client: Client | null = null;

function getTursoClient(): Client {
  if (_client) return _client;

  const rawUrl = process.env.TURSO_DATABASE_URL;
  const token = process.env.TURSO_AUTH_TOKEN;

  // 1) إذا وُجدت إعدادات Turso — استخدمها (الإنتاج على Vercel)
  // نستخدم libsql:// مباشرة (نفس ما يستخدمه PrismaLibSQL ويعمل بشكل موثوق)
  if (rawUrl) {
    _client = createClient({ url: rawUrl, authToken: token });
    return _client;
  }

  // 2) fallback إلى SQLite المحلي (التطوير المحلي بدون Turso)
  const localUrl = process.env.DATABASE_URL;
  if (localUrl) {
    // Prisma تستخدم file: prefix — @libsql/client يتوقع file: أيضاً
    _client = createClient({ url: localUrl });
    return _client;
  }

  throw new Error("No database configured: set TURSO_DATABASE_URL or DATABASE_URL");
}

/** تحويل BigInt إلى Number */
export function toNum(v: unknown): number {
  return v == null ? 0 : Number(v);
}

/** تحويل JSON string بأمان */
export function safeJson<T = Record<string, unknown>>(str: string | null, fallback: T): T {
  try { return str ? JSON.parse(str) : fallback; } catch { return fallback; }
}

/**
 * استعلام SQL مباشر على Turso (بدون Prisma)
 * مع fallback تلقائي إلى Prisma عند الفشل (safety net)
 * @param sql استعلام SQL مع معاملات ? للمواقع
 * @param args مصفوفة المعاملات (ترتيبية)
 */
export async function tursoQuery<T = Record<string, unknown>>(
  sql: string,
  args?: unknown[]
): Promise<T[]> {
  try {
    const client = getTursoClient();
    // مهلة 12 ثانية — إذا تجاوزها، ننتقل إلى Prisma fallback
    const result = await Promise.race([
      client.execute({ sql, args: args || [] }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("turso-lite timeout")), 12000)
      ),
    ]);
    return result.rows as unknown as T[];
  } catch (e) {
    // fallback إلى Prisma عند فشل turso-lite
    console.warn("[turso-lite] falling back to Prisma:", (e as Error).message);
    try {
      const { db } = await import("@/lib/db");
      const rows = await db.$queryRawUnsafe(sql, ...(args || []));
      return rows as unknown as T[];
    } catch (prismaErr) {
      console.error("[turso-lite] Prisma fallback also failed:", prismaErr);
      throw prismaErr;
    }
  }
}

/**
 * استعلامات موازية متعددة إلى Turso
 */
export async function tursoQueries<T extends unknown[]>(
  queries: { sql: string; args?: unknown[] }[]
): Promise<T[]> {
  const client = getTursoClient();
  return Promise.all(
    queries.map(async ({ sql, args }) => {
      const result = await client.execute({ sql, args: args || [] });
      return result.rows as unknown as T;
    })
  );
}
