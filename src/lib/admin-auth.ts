import { tursoQuery } from "@/lib/turso-lite";
import { DEFAULT_SETTINGS } from "@/lib/default-settings";

let cachedCode: string | null = null;
let cacheTime = 0;
const CACHE_TTL = 30_000; // 30 seconds

export async function getAdminCode(): Promise<string> {
  const now = Date.now();
  if (cachedCode && now - cacheTime < CACHE_TTL) return cachedCode;

  try {
    const rows = await tursoQuery<{ value: string }>(
      `SELECT value FROM "Setting" WHERE key = 'general' AND ("shopId" IS NULL) LIMIT 1`
    );
    if (rows.length > 0) {
      const parsed = JSON.parse(rows[0].value);
      cachedCode = parsed.adminCode || DEFAULT_SETTINGS.general.adminCode;
    } else {
      cachedCode = DEFAULT_SETTINGS.general.adminCode;
    }
  } catch {
    cachedCode = DEFAULT_SETTINGS.general.adminCode;
  }
  cacheTime = now;
  return cachedCode;
}

/**
 * تحقّق من رمز الإدارة المُرسل في الطلب
 * يُستخدم في API routes لحماية مسارات الإدارة العامة
 */
export async function verifyAdminRequest(request: Request): Promise<boolean> {
  const authHeader = request.headers.get("x-admin-code");
  if (!authHeader) return false;

  const correctCode = await getAdminCode();
  return authHeader === correctCode;
}

/**
 * تحقّق من رمز إدارة متجر محدد (استخدام adminPin الخاص بالمتجر)
 */
async function verifyShopAdmin(request: Request, shopId: string): Promise<boolean> {
  const authHeader = request.headers.get("x-admin-code");
  if (!authHeader) return false;

  try {
    const rows = await tursoQuery<{ adminPin: string }>(
      `SELECT "adminPin" FROM "Shop" WHERE id = ? LIMIT 1`,
      [shopId]
    );
    if (rows.length > 0 && String(rows[0].adminPin) === authHeader) {
      return true;
    }
  } catch {
    // ignore DB errors
  }
  return false;
}

const UNAUTHORIZED_RESPONSE = new Response(
  JSON.stringify({ error: "غير مصرح" }),
  { status: 401, headers: { "Content-Type": "application/json" } }
);

/**
 * Middleware helper — يُرجع 401 إذا لم يكن الطلب مُصدَّقاً
 * يتحقق من الرمز العام فقط
 */
export async function requireAdmin(request: Request): Promise<{ authorized: boolean; error?: Response }> {
  const isAuthorized = await verifyAdminRequest(request);
  if (!isAuthorized) {
    return { authorized: false, error: UNAUTHORIZED_RESPONSE };
  }
  return { authorized: true };
}

/**
 * Middleware helper — يتحقق من رمز الإدارة العامة أو رمز المتجر
 * يُستخدم في نقاط النهاية التي يمكن الوصول إليها من لوحة تحكم التاجر
 * @param request الطلب
 * @param shopId معرّف المتجر (اختياري - من query params)
 */
export async function requireShopOrGlobalAdmin(
  request: Request,
  shopId?: string | null
): Promise<{ authorized: boolean; error?: Response }> {
  const authHeader = request.headers.get("x-admin-code");
  if (!authHeader) {
    return { authorized: false, error: UNAUTHORIZED_RESPONSE };
  }

  // تحقق من الرمز العام أولاً
  const globalCode = await getAdminCode();
  if (authHeader === globalCode) {
    return { authorized: true };
  }

  // إذا لم يُطابق الرمز العام ووجد shopId، تحقق من رمز المتجر
  if (shopId) {
    const isShopAdmin = await verifyShopAdmin(request, shopId);
    if (isShopAdmin) {
      return { authorized: true };
    }
  }

  return { authorized: false, error: UNAUTHORIZED_RESPONSE };
}
