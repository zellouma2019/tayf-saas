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

/** التحقق من الجلسة مع الخادم (يُستدعى عند تحميل الصفحة) */
export async function verifySession(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return false;
    const { ts, token } = JSON.parse(raw);
    if (!token) return false;

    const res = await fetch("/api/super-admin/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ts, token }),
    });
    if (res.ok) {
      const data = await res.json();
      return data.valid === true;
    }
    return false;
  } catch {
    // في حالة فشل الشبكة، نسمح بالوصول مؤقتاً (التحقق السابق يكفي)
    return isAuthenticated();
  }
}

export function markAuthenticated(token: string, ts?: number) {
  localStorage.setItem(SESSION_KEY, JSON.stringify({ ts: ts || Date.now(), token: token || "" }));
}

/** مسح الجلسة */
export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
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