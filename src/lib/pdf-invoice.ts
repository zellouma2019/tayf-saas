/**
 * تنزيل فاتورة كصفحة HTML قابلة للطباعة بدلاً من ملف PDF
 *
 * تم استبدال نهج jsPDF لأنه ينتج نصاً عربياً مشوّهاً (Mojibake)
 * بسبب مشاكل في ترميز الخطوط. النهج الجديد يفتح صفحة HTML
 * مصممة باحترافية مع خط Cairo العربي، ويقوم المتصفح بتحويلها
 * لـ PDF عند الطباعة مع دعم كامل للعربية و RTL.
 */
import { toast } from "sonner";

/**
 * فتح فاتورة HTML في نافذة جديدة للطباعة أو الحفظ كـ PDF
 */
export async function downloadInvoicePDF(orderId: string, reference?: string): Promise<boolean> {
  try {
    toast.loading("جارٍ فتح الفاتورة...", { id: "pdf-invoice" });

    const shopId = (await import("@/lib/store")).useAppStore.getState().shopId;
    const sep = shopId ? "?" : "";
    const query = shopId ? `shopId=${encodeURIComponent(shopId)}` : "";
    const url = `/api/orders/${orderId}/invoice${sep}${query}`;

    window.open(url, "_blank");

    toast.success("تم فتح الفاتورة", {
      id: "pdf-invoice",
      description: "استخدم زر الطباعة في النافذة الجديدة لحفظها كـ PDF",
    });
    return true;
  } catch (error) {
    console.error("[Invoice Error]", error);
    toast.error("فشل في فتح الفاتورة", {
      id: "pdf-invoice",
    });
    return false;
  }
}

// إبقاء التصديرات القديمة لمنع أخطاء الاستيراد
export { initArabicPdf, ar, arFont, hasArabic } from "@/lib/pdf-arabic";