/**
 * عميل Turso خفيف الوزن — يتجاوز Prisma بالكامل لعمليات القراءة
 * أسرع 10x من PrismaLibSQL على Vercel serverless
 * 
 * الاستراتيجية:
 * - تحويل libsql:// إلى https:// لإجبار HTTP mode (بدون WebSocket)
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
  if (rawUrl) {
    // تحويل libsql:// إلى https:// لإجبار HTTP mode (أسرع على Vercel serverless)
    // libsql:// يحاول WebSocket أولاً مما يسبب تأخير كبير على Vercel
    const url = rawUrl.startsWith("libsql://")
      ? rawUrl.replace("libsql://", "https://")
      : rawUrl;

    _client = createClient({ url, authToken: token });
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
 * @param sql استعلام SQL مع معاملات ? للمواقع
 * @param args مصفوفة المعاملات (ترتيبية)
 */
export async function tursoQuery<T = Record<string, unknown>>(
  sql: string,
  args?: unknown[]
): Promise<T[]> {
  const client = getTursoClient();
  const result = await client.execute({ sql, args: args || [] });
  return result.rows as unknown as T[];
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
