import { tursoQuery, safeJson } from "@/lib/turso-lite";
import { DEFAULT_SETTINGS } from "@/lib/default-settings";
import { NextRequest } from "next/server";

const codeCache = new Map<string, { code: string; time: number }>();
const CACHE_TTL = 60_000; // 60 ثانية

export async function getAdminCode(shopId?: string | null): Promise<string> {
  const now = Date.now();
  const cacheKey = shopId || "__global__";

  const cached = codeCache.get(cacheKey);
  if (cached && now - cached.time < CACHE_TTL) return cached.code;

  try {
    let row: Record<string, unknown> | undefined;
    if (shopId) {
      const rows = await tursoQuery(
        `SELECT value FROM "Setting" WHERE key = 'general' AND "shopId" = ? LIMIT 1`,
        [shopId]
      );
      row = rows[0];
    } else {
      const rows = await tursoQuery(
        `SELECT value FROM "Setting" WHERE key = 'general' AND "shopId" IS NULL LIMIT 1`,
        []
      );
      row = rows[0];
    }

    let code: string;
    if (row?.value) {
      const parsed = safeJson(row.value as string, {});
      code = (parsed as Record<string, unknown>).adminCode as string || DEFAULT_SETTINGS.general.adminCode;
    } else {
      code = DEFAULT_SETTINGS.general.adminCode;
    }
    codeCache.set(cacheKey, { code, time: now });
    return code;
  } catch {
    return DEFAULT_SETTINGS.general.adminCode;
  }
}

/**
 * تحقّق من رمز الإدارة المُرسل في الطلب
 * يُستخدم في API routes لحماية مسارات الإدارة
 */
export async function verifyAdminRequest(request: Request): Promise<boolean> {
  const authHeader = request.headers.get("x-admin-code");
  if (!authHeader) return false;

  const correctCode = await getAdminCode();
  return authHeader === correctCode;
}

/**
 * التحقّق من أن الطلب قادم من لوحة التاجر (بعد التحقّق من PIN)
 * يكتشف shopId من query params أو body
 */
function extractShopId(request: Request): string | null {
  const url = request instanceof NextRequest ? request.nextUrl : new URL(request.url);
  const shopId = url.searchParams.get("shopId");
  if (shopId) return shopId;

  return null;
}

/**
 * Middleware helper — يُرجع 401 إذا لم يكن الطلب مُصدَّقاً
 * يقبل إمّا x-admin-code أو shopId (لوحة التاجر)
 */
export async function requireAdmin(request: Request): Promise<{ authorized: boolean; error?: Response }> {
  // الطريقة 1: رمز الإدارة (x-admin-code) — النظام القديم
  const authHeader = request.headers.get("x-admin-code");
  if (authHeader) {
    const correctCode = await getAdminCode();
    if (authHeader === correctCode) {
      return { authorized: true };
    }
  }

  // الطريقة 2: shopId في query params — لوحة التاجر (تم التحقق من PIN سابقاً)
  const shopId = extractShopId(request);
  if (shopId) {
    return { authorized: true };
  }

  return {
    authorized: false,
    error: new Response(JSON.stringify({ error: "غير مصرح" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    }),
  };
}
