"use client";

import { toast } from "sonner";
import { useAppStore } from "@/lib/store";

/**
 * فتح فاتورة HTML في تبويب جديد — النص العربي يعرض بشكل صحيح مع خط Cairo
 */
export async function downloadInvoicePDF(orderId: string, reference?: string): Promise<boolean> {
  try {
    toast.loading("جارٍ فتح الفاتورة...", { id: "pdf-invoice" });
    let shopId = useAppStore.getState().shopId;
    // Customer view: derive shopId from URL slug
    if (!shopId) {
      const pathMatch = window.location.pathname.match(/^\/s\/([^/]+)/);
      if (pathMatch) {
        try {
          const res = await fetch(`/api/shops/${encodeURIComponent(pathMatch[1])}`);
          if (res.ok) {
            const data = await res.json();
            shopId = data.shop?.id || null;
          }
        } catch { /* ignore */ }
      }
    }
    const params = shopId ? `?shopId=${encodeURIComponent(shopId)}` : "";
    window.open(`/api/orders/${orderId}/invoice${params}`, "_blank");
    toast.success("تم فتح الفاتورة", {
      id: "pdf-invoice",
      description: "استخدم زر الطباعة لحفظ كـ PDF",
    });
    return true;
  } catch (error) {
    console.error("[PDF Invoice Error]", error);
    toast.error("فشل في فتح الفاتورة", { id: "pdf-invoice" });
    return false;
  }
}