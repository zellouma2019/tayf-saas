import { useAppStore } from "@/lib/store";

/**
 * shopApi — نسخة مخصّصة من fetch تُلحق shopId تلقائياً بجميع طلبات API.
 * كما تُلحق x-admin-code للطلبات المحمية.
 * تُستخدم بدلاً من fetch المباشر في مكونات واجهة التاجر والزبون.
 */
export function shopApi(url: string, init?: RequestInit): Promise<Response> {
  const { shopId, adminCode } = useAppStore.getState();
  if (shopId) {
    const sep = url.includes("?") ? "&" : "?";
    url = `${url}${sep}shopId=${encodeURIComponent(shopId)}`;
  }
  // ألحق رمز الإدارة إن وُجد (للطلبات المحمية مثل /api/settings)
  const headers = new Headers(init?.headers);
  if (adminCode && !headers.has("x-admin-code")) {
    headers.set("x-admin-code", adminCode);
  }
  return fetch(url, { ...init, headers });
}
