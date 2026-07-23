import { db } from "@/lib/db";
import { DEFAULT_SETTINGS } from "@/lib/default-settings";
import { NextRequest } from "next/server";

const codeCache = new Map<string, { code: string; time: number }>();
const CACHE_TTL = 30_000; // 30 seconds

export async function getAdminCode(shopId?: string | null): Promise<string> {
  const now = Date.now();
  const cacheKey = shopId || "__global__";

  const cached = codeCache.get(cacheKey);
  if (cached && now - cached.time < CACHE_TTL) return cached.code;

  try {
    const where = shopId
      ? { shopId_key: { shopId, key: "general" } }
      : { shopId_key: { shopId: null as string | null, key: "general" } };
    const setting = await db.setting.findFirst({ where });
    let code: string;
    if (setting) {
      const parsed = JSON.parse(setting.value);
      code = parsed.adminCode || DEFAULT_SETTINGS.general.adminCode;
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
  // من query params
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