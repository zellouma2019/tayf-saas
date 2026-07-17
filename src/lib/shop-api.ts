import { useAppStore } from "@/lib/store";

/**
 * shopApi — نسخة مخصّصة من fetch تُلحق shopId تلقائياً بجميع طلبات API.
 * تُستخدم بدلاً من fetch المباشر في مكونات واجهة الزبون.
 */
export function shopApi(url: string, init?: RequestInit): Promise<Response> {
  const shopId = useAppStore.getState().shopId;
  if (shopId) {
    const sep = url.includes("?") ? "&" : "?";
    url = `${url}${sep}shopId=${encodeURIComponent(shopId)}`;
  }
  return fetch(url, init);
}