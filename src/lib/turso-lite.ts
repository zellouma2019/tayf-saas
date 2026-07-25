/**
 * عميل Turso خفيف الوزن — يتجاوز Prisma بالكامل لعمليات القراءة
 * أسرع 10x من PrismaLibSQL على Vercel serverless
 */
import { createClient, type Client } from "@libsql/client";

let _client: Client | null = null;

function getTursoClient(): Client {
  if (_client) return _client;

  const url = process.env.TURSO_DATABASE_URL;
  const token = process.env.TURSO_AUTH_TOKEN;

  if (!url) {
    throw new Error("TURSO_DATABASE_URL not set");
  }

  _client = createClient({
    url,
    authToken: token,
    // استخدام HTTP لـ Turso السحابي (أسرع من WebSocket على serverless)
  });

  return _client;
}

/** تحويل BigInt إلى Number */
function toNum(v: unknown): number {
  return v == null ? 0 : Number(v);
}

/** تحويل JSON string بأمان */
function safeJson<T = Record<string, unknown>>(str: string | null, fallback: T): T {
  try { return str ? JSON.parse(str) : fallback; } catch { return fallback; }
}

/**
 * استعلام SQL مباشر على Turso (بدون Prisma)
 * @returns صفوف النتائج كمصفوفة من الكائنات
 */
export async function tursoQuery<T = Record<string, unknown>>(
  sql: string,
  params?: Record<string, unknown>[]
): Promise<T[]> {
  const client = getTursoClient();
  const result = await client.execute({
    sql,
    args: params ? Object.values(params) : [],
  });
  return result.rows as unknown as T[];
}

/**
 * استعلامات موازية متعددة إلى Turso
 */
export async function tursoQueries<T extends unknown[]>(
  queries: { sql: string; params?: Record<string, unknown>[] }[]
): Promise<T[]> {
  const client = getTursoClient();
  return Promise.all(
    queries.map(async ({ sql, params }) => {
      const result = await client.execute({
        sql,
        args: params ? Object.values(params) : [],
      });
      return result.rows as unknown as T;
    })
  );
}

export { toNum, safeJson };
