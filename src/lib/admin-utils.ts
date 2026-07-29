import { toast } from "sonner";
import { formatDateTimeAr } from "@/lib/print-config";

// ===== مساعدات الجلسة =====
export const SESSION_KEY = "sa_auth";
export const SESSION_HOURS = 4; // 4 ساعات فقط (كانت 24)

/** إنشاء تجزئة بسيطة من نص */
async function simpleHash(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function isAuthenticated(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return false;
    const { ts, token } = JSON.parse(raw);
    // صلاحية 4 ساعات
    if (Date.now() - ts > SESSION_HOURS * 60 * 60 * 1000) {
      localStorage.removeItem(SESSION_KEY);
      return false;
    }
    // يجب وجود الرمز المُصدَّق من الخادم
    if (!token) return false;
    return true;
  } catch {
    return false;
  }
}

// التحقق من الجلسة يُخزَّن مؤقتاً لمدة 5 دقائق في sessionStorage
// لتجنّب إعادة التحقق على كل تحديث للصفحة (تسريع التحميل)
const VERIFY_CACHE_KEY = "sa_verify_cache";
const VERIFY_CACHE_TTL = 5 * 60 * 1000; // 5 دقائق

interface VerifyCache {
  valid: boolean;
  adminName?: string;
  cachedAt: number;
}

function getCachedVerify(): VerifyCache | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(VERIFY_CACHE_KEY);
    if (!raw) return null;
    const c = JSON.parse(raw) as VerifyCache;
    if (Date.now() - c.cachedAt > VERIFY_CACHE_TTL) return null;
    return c;
  } catch {
    return null;
  }
}

function setCachedVerify(valid: boolean, adminName?: string) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(
      VERIFY_CACHE_KEY,
      JSON.stringify({ valid, adminName, cachedAt: Date.now() } as VerifyCache)
    );
  } catch {
    /* ignore */
  }
}

/** مسح كاش التحقق (يُستدعى بعد تغيير كلمة المرور أو تسجيل الخروج) */
export function clearVerifyCache() {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(VERIFY_CACHE_KEY);
  } catch {
    /* ignore */
  }
}

/**
 * التحقق من الجلسة مع الخادم — يُرجع { valid, adminName }.
 * يستخدم كاش sessionStorage لمدة 5 دقائق لتجنّب الطلبات المتكررة على كل تحديث.
 * مرر `force: true` لتجاوز الكاش (بعد تغيير كلمة المرور مثلاً).
 */
export async function verifySession(force = false): Promise<{ valid: boolean; adminName?: string }> {
  if (typeof window === "undefined") return { valid: false };

  // 1) تحقق سريع من localStorage أولاً — إن لم توجد جلسة لا داعي للشبكة
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return { valid: false };
  let token: string | undefined;
  let ts: number | undefined;
  try {
    const parsed = JSON.parse(raw);
    token = parsed.token;
    ts = parsed.ts;
  } catch {
    return { valid: false };
  }
  if (!token) return { valid: false };

  // 2) تحقق من صلاحية الجلسة محلياً (4 ساعات) قبل أي طلب شبكة
  if (Date.now() - (ts || 0) > SESSION_HOURS * 60 * 60 * 1000) {
    localStorage.removeItem(SESSION_KEY);
    clearVerifyCache();
    return { valid: false };
  }

  // 3) استخدم الكاش إن وُجد وغير منتهٍ (تسريع التحميل < 1 ثانية)
  if (!force) {
    const cached = getCachedVerify();
    if (cached) {
      return { valid: cached.valid, adminName: cached.adminName };
    }
  }

  // 4) اطلب التحقق من الخادم
  try {
    const res = await fetch("/api/super-admin/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ts, token }),
    });
    if (res.ok) {
      const data = await res.json();
      const valid = data.valid === true;
      setCachedVerify(valid, data.adminName);
      return { valid, adminName: data.adminName };
    }
    setCachedVerify(false);
    return { valid: false };
  } catch {
    // في حالة فشل الشبكة، نسمح بالوصول مؤقتاً (التحقق السابق يكفي)
    return { valid: isAuthenticated() };
  }
}

export function markAuthenticated(token: string, ts?: number) {
  localStorage.setItem(SESSION_KEY, JSON.stringify({ ts: ts || Date.now(), token: token || "" }));
}

/** مسح الجلسة */
export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
  clearVerifyCache();
}

// طلبات بسيطة بدون مفتاح (بعد التحقق من الجلسة)
export function adminFetch(url: string, options: RequestInit = {}): Promise<Response> {
  return fetch(url, options);
}

// ===== أدوات مساعدة =====
export async function robustCopy(text: string, successMsg: string, successDesc: string) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      toast.success(successMsg, { description: successDesc });
      return;
    }
  } catch {
    // Fall through to fallback
  }
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    ta.style.top = "-9999px";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    if (ok) {
      toast.success(successMsg, { description: successDesc });
    } else {
      throw new Error("execCommand failed");
    }
  } catch {
    toast.error("فشل نسخ النص", { description: "حاول مرة أخرى أو انسخ يدوياً" });
  }
}

export function openInNewTab(url: string) {
  const w = window.open(url, "_blank");
  if (!w || w.closed) {
    window.location.href = url;
    toast.warning("تم فتح الرابط في نفس النافذة", { description: "قد يكون حظر النوافذ المنبثقة مفعّلاً في المتصفح" });
  }
}

export function formatNumber(n: number): string {
  return n.toLocaleString("ar-SA-u-nu-latn");
}

export function getTimeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "الآن";
  if (diffMin < 60) return `منذ ${diffMin} دقيقة`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `منذ ${diffHr} ساعة`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `منذ ${diffDay} يوم`;
  return formatDateTimeAr(dateStr);
}

// ===== أيقونات الخدمات =====
export const SERVICE_EMOJI: Record<string, string> = {
  document: "🖨️",
  photo: "🖼️",
  binding: "📚",
  copy: "📄",
  card: "🪪",
  poster: "📜",
};

export const STATUS_DOT_COLORS: Record<string, string> = {
  pending: "#f59e0b",
  printing: "#3b82f6",
  ready: "#10b981",
  delivered: "#059669",
  cancelled: "#f43f5e",
};

// ===== حالة الطلبات =====
export const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800",
  printing: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800",
  ready: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800",
  delivered: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800",
  cancelled: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800",
};

export const STATUS_BORDER_COLORS: Record<string, string> = {
  pending: "border-r-amber-400",
  printing: "border-r-blue-400",
  ready: "border-r-emerald-400",
  delivered: "border-r-emerald-400",
  cancelled: "border-r-rose-400",
};

// ===== عناوين التبويبات =====
export const TAB_TITLES: Record<string, string> = {
  overview: "نظرة عامة",
  orders: "الطلبات",
  shops: "المتاجر",
  platformSettings: "إعدادات المنصة",
  settings: "إعدادات المتاجر",
  security: "الأمان والفريق",
};

// ===== Favicon Badge — رقم على أيقونة التبويب =====
let _faviconCanvas: HTMLCanvasElement | null = null;
export function setFaviconBadge(count: number) {
  if (typeof document === "undefined") return;
  try {
    if (!_faviconCanvas) {
      _faviconCanvas = document.createElement("canvas");
    }
    const canvas = _faviconCanvas;
    const size = 32;
    canvas.width = size;
    canvas.height = size;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // رسم الأيقونة الأصلية
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      ctx.clearRect(0, 0, size, size);
      ctx.drawImage(img, 0, 0, size, size);

      // رسم الشارة
      if (count > 0) {
        const text = count > 99 ? "99+" : String(count);
        const badgeSize = count > 9 ? 18 : 15;
        const x = size - badgeSize / 2 - 1;
        const y = badgeSize / 2 + 1;

        // خلفية الشارة (دائرة حمراء)
        ctx.beginPath();
        ctx.arc(x, y, badgeSize / 2, 0, Math.PI * 2);
        ctx.fillStyle = "#ef4444";
        ctx.fill();

        // نص الشارة
        ctx.fillStyle = "#ffffff";
        ctx.font = `bold ${count > 9 ? 9 : 10}px sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(text, x, y + 0.5);
      }

      // تحديث الـ favicon
      const link = document.querySelector<HTMLLinkElement>("link[rel*='icon']");
      if (link) {
        link.href = canvas.toDataURL("image/png");
      }
    };
    img.src = "/favicon.png";
  } catch {
    // صامت — لا يُعطّل التطبيق
  }
}