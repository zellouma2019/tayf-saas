"use client";

import { toast } from "sonner";
import { useAppStore } from "@/lib/store";

/**
 * فتح فاتورة HTML في تبويب جديد — النص العربي يعرض بشكل صحيح مع خط Cairo
 */
export async function downloadInvoicePDF(orderId: string, reference?: string): Promise<boolean> {
  try {
    toast.loading("جارٍ فتح الفاتورة...", { id: "pdf-invoice" });
    const shopId = useAppStore.getState().shopId;
    const sep = shopId ? "?" : "";
    const query = shopId ? `shopId=${encodeURIComponent(shopId)}` : "";
    window.open(`/api/orders/${orderId}/invoice${sep}${query}`, "_blank");
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