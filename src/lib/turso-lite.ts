/**
 * عميل Turso خفيف الوزن — يتجاوز Prisma بالكامل لعمليات القراءة والكتابة
 * أسرع من PrismaLibSQL على Vercel serverless (لا يُحمّل Prisma runtime)
 *
 * الاستراتيجية:
 * - تحويل libsql:// إلى https:// لإجبار HTTP mode (أسرع من WebSocket على Vercel)
 * - اتصال واحد قابل لإعادة الاستخدام عبر module-level cache
 * - معاملات positional فقط
 * - يدعم SQLite المحلي تلقائياً عند غياب TURSO_DATABASE_URL
 */
import { createClient, type Client } from "@libsql/client";

let _client: Client | null = null;

/**
 * تحويل رابط Turso إلى HTTPS لإجبار HTTP mode
 * - libsql://  → https://  (HTTP mode — أسرع وأكثر موثوقية على Vercel)
 * - libsql+ws:// → wss://  (WebSocket — نتجنبه)
 * - libsql+http:// → https:// (صريح)
 * - file:// يبقى كما هو (SQLite محلي)
 */
function normalizeTursoUrl(url: string): string {
  if (url.startsWith("libsql+ws://")) return url.replace("libsql+ws://", "wss://");
  if (url.startsWith("libsql+http://")) return url.replace("libsql+http://", "https://");
  if (url.startsWith("libsql://")) return url.replace("libsql://", "https://");
  return url;
}

function getTursoClient(): Client {
  if (_client) return _client;

  const rawUrl = process.env.TURSO_DATABASE_URL;
  const token = process.env.TURSO_AUTH_TOKEN;

  // 1) إذا وُجدت إعدادات Turso — استخدمها (الإنتاج على Vercel)
  // نحوّل libsql:// إلى https:// لإجبار HTTP mode (أسرع من WebSocket على Vercel)
  if (rawUrl) {
    const httpUrl = normalizeTursoUrl(rawUrl);
    _client = createClient({
      url: httpUrl,
      authToken: token,
      // إعدادات HTTP لتحسين الأداء على Vercel serverless
      intMode: "number",
    });
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
      client.execute({ sql, args: (args || []) as never[] }),
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
      const result = await client.execute({ sql, args: (args || []) as never[] });
      return result.rows as unknown as T;
    })
  );
}

/**
 * تنفيذ عملية كتابة (INSERT/UPDATE/DELETE) مباشرة على Turso — بدون Prisma
 * يُرجع ResultSet الكامل مع lastInsertRowid و rowsAffected
 *
 * @param sql استعلام SQL مع معاملات ? للمواقع (يمكن استخدام RETURNING *)
 * @param args مصفوفة المعاملات (ترتيبية)
 */
export async function tursoExecute<T = Record<string, unknown>>(
  sql: string,
  args?: unknown[]
): Promise<{ rows: T[]; lastInsertRowid: bigint | null; rowsAffected: number }> {
  try {
    const client = getTursoClient();
    const result = await Promise.race([
      client.execute({ sql, args: (args || []) as never[] }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("turso-lite execute timeout")), 12000)
      ),
    ]);
    return {
      rows: result.rows as unknown as T[],
      lastInsertRowid: result.lastInsertRowid ?? null,
      rowsAffected: result.rowsAffected,
    };
  } catch (e) {
    // fallback إلى Prisma عند فشل turso-lite
    console.warn("[turso-lite] execute falling back to Prisma:", (e as Error).message);
    try {
      const { db } = await import("@/lib/db");
      const rows = await db.$executeRawUnsafe(sql, ...(args || []));
      return { rows: [], lastInsertRowid: null, rowsAffected: rows };
    } catch (prismaErr) {
      console.error("[turso-lite] Prisma execute fallback also failed:", prismaErr);
      throw prismaErr;
    }
  }
}
