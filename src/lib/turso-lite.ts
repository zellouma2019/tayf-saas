/**
 * عميل Turso خفيف الوزن — يتجاوز Prisma بالكامل لعمليات القراءة
 * أسرع 10x من PrismaLibSQL على Vercel serverless
 * 
 * الاستراتيجية:
 * - تحويل libsql:// إلى https:// لإجبار HTTP mode (بدون WebSocket)
 * - اتصال واحد قابل لإعادة الاستخدام
 * - معاملات positional فقط
 */
import { createClient, type Client } from "@libsql/client";

let _client: Client | null = null;

function getTursoClient(): Client {
  if (_client) return _client;

  const rawUrl = process.env.TURSO_DATABASE_URL;
  const token = process.env.TURSO_AUTH_TOKEN;

  if (!rawUrl) {
    throw new Error("TURSO_DATABASE_URL not set");
  }

  // تحويل libsql:// إلى https:// لإجبار HTTP mode (أسرع على Vercel serverless)
  // libsql:// يحاول WebSocket أولاً مما يسبب تأخير كبير على Vercel
  const url = rawUrl.startsWith("libsql://")
    ? rawUrl.replace("libsql://", "https://")
    : rawUrl;

  _client = createClient({ url, authToken: token });
  return _client;
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
