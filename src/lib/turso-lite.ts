/**
 * عميل Turso خفيف الوزن — يتجاوز Prisma بالكامل لعمليات القراءة والكتابة
 * أسرع من PrismaLibSQL على Vercel serverless (لا يُحمّل Prisma runtime)
 *
 * الاستراتيجية:
 * - تحويل libsql:// إلى https:// لإجبار HTTP mode (أسرع من WebSocket على Vercel)
 * - اتصال واحد قابل لإعادة الاستخدام عبر module-level cache
 * - مهلة 8 ثواني (بدلاً من 12) لتجنب تجاوز حد Vercel 30s
 * - لا يوجد Prisma fallback — Prisma تستخدم نفس Turso DB، لا فائدة منها
 * - إرجاع فارغ عند الفشل بدلاً من التسبب في 504
 */
import { createClient, type Client } from "@libsql/client";

let _client: Client | null = null;

/**
 * تحويل رابط Turso إلى HTTPS لإجبار HTTP mode
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

  if (rawUrl) {
    const httpUrl = normalizeTursoUrl(rawUrl);
    _client = createClient({
      url: httpUrl,
      authToken: token,
      intMode: "number",
    });
    return _client;
  }

  const localUrl = process.env.DATABASE_URL;
  if (localUrl) {
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
 * استعلام SQL مباشر على Turso — بدون Prisma fallback
 * مهلة 8 ثواني — تُرجع مصفوفة فارغة عند الفشل (degradation graciosa)
 * ⚠️ يحتوي على retry تلقائي (محاولة واحدة إضافية) لمعالجة فشل Turso المتقطع
 */
export async function tursoQuery<T = Record<string, unknown>>(
  sql: string,
  args?: unknown[]
): Promise<T[]> {
  const client = getTursoClient();
  const tryQuery = async (): Promise<T[]> => {
    const result = await Promise.race([
      client.execute({ sql, args: (args || []) as never[] }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("turso-lite timeout (8s)")), 8000)
      ),
    ]);
    return result.rows as unknown as T[];
  };

  // المحاولة الأولى
  try {
    return await tryQuery();
  } catch (e1) {
    console.warn("[turso-lite] query attempt 1 failed:", (e1 as Error).message);
    // Retry مرة واحدة بعد تأخير قصير (مشكلة Turso HTTP المتقطعة)
    await new Promise(r => setTimeout(r, 300));
    try {
      const rows = await tryQuery();
      console.log("[turso-lite] query retry succeeded, rows:", rows.length);
      return rows;
    } catch (e2) {
      console.error("[turso-lite] query attempt 2 failed:", (e2 as Error).message);
      return [];
    }
  }
}

/**
 * استعلام SQL مع تمييز الخطأ عن النتيجة الفارغة
 * يُرجع { rows, error } بدلاً من مصفوفة فقط
 * عند انتهاء المهلة أو الخطأ، يُرجع error:true لتمييزه عن Array(0)
 */
export async function tursoQuerySafe<T = Record<string, unknown>>(
  sql: string,
  args?: unknown[],
  timeoutMs = 10000
): Promise<{ rows: T[]; error?: string }> {
  try {
    const client = getTursoClient();
    const result = await Promise.race([
      client.execute({ sql, args: (args || []) as never[] }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`turso-lite timeout (${timeoutMs}ms)`)), timeoutMs)
      ),
    ]);
    return { rows: result.rows as unknown as T[] };
  } catch (e) {
    const msg = (e as Error).message || "unknown";
    console.error("[turso-lite] safe query failed:", msg);
    return { rows: [], error: msg };
  }
}

/**
 * استعلام SQL مع إمكانية تحديد مهلة مخصصة
 */
export async function tursoQueryWithTimeout<T = Record<string, unknown>>(
  sql: string,
  args: unknown[],
  timeoutMs: number
): Promise<T[]> {
  try {
    const client = getTursoClient();
    const result = await Promise.race([
      client.execute({ sql, args: args as never[] }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`turso-lite timeout (${timeoutMs}ms)`)), timeoutMs)
      ),
    ]);
    return result.rows as unknown as T[];
  } catch (e) {
    console.error("[turso-lite] query failed:", (e as Error).message);
    return [];
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
      try {
        const result = await Promise.race([
          client.execute({ sql, args: (args || []) as never[] }),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("turso-lite parallel timeout")), 8000)
          ),
        ]);
        return result.rows as unknown as T;
      } catch (e) {
        console.error("[turso-lite] parallel query failed:", (e as Error).message);
        return [] as unknown as T;
      }
    })
  );
}

/**
 * تنفيذ عملية كتابة (INSERT/UPDATE/DELETE) مباشرة على Turso
 * ⚠️ يحتوي على retry تلقائي (محاولة واحدة إضافية) لمعالجة فشل Turso المتقطع
 */
export async function tursoExecute<T = Record<string, unknown>>(
  sql: string,
  args?: unknown[]
): Promise<{ rows: T[]; lastInsertRowid: bigint | null; rowsAffected: number }> {
  const client = getTursoClient();
  const tryExec = async () => {
    const result = await Promise.race([
      client.execute({ sql, args: (args || []) as never[] }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("turso-lite execute timeout (8s)")), 8000)
      ),
    ]);
    return {
      rows: result.rows as unknown as T[],
      lastInsertRowid: result.lastInsertRowid ?? null,
      rowsAffected: result.rowsAffected,
    };
  };
  try {
    return await tryExec();
  } catch (e1) {
    console.warn("[turso-lite] execute attempt 1 failed:", (e1 as Error).message);
    await new Promise(r => setTimeout(r, 300));
    try {
      return await tryExec();
    } catch (e2) {
      console.error("[turso-lite] execute attempt 2 failed:", (e2 as Error).message);
      return { rows: [], lastInsertRowid: null, rowsAffected: 0 };
    }
  }
}
