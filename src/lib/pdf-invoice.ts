"use client";

import { toast } from "sonner";

/**
 * تحويل فاتورة HTML إلى ملف PDF وتنزيلها مباشرة
 * 
 * الملاحظة: jsPDF.html() يعتمد على html2canvas الذي لا يدعم النص العربي والخطوط
 * الخارجية بشكل موثوق. لذلك نستخدم نهج iframe + html2canvas مع إعدادات محسّنة.
 * 
 * إذا فشل التحويل، نعود لفتح صفحة HTML مباشرة (التي تعمل بشكل مثالي).
 */
export async function downloadInvoicePDF(orderId: string, reference?: string): Promise<boolean> {
  const toastId = "pdf-invoice";
  try {
    toast.loading("جارٍ إنشاء ملف PDF...", { id: toastId });

    // 1. جلب HTML الفاتورة
    const res = await fetch(`/api/orders/${orderId}/invoice`);
    if (!res.ok) throw new Error("فشل في جلب الفاتورة");
    let html = await res.text();

    // 2. تنظيف HTML
    html = html.replace(/<button class="print-btn[^"]*">[^<]*<\/button>/g, "");
    html = html.replace(/<script>[\s\S]*?<\/script>/g, "");
    html = html.replace(/@media\s*print\s*\{[^}]*\}/g, "");
    html = html.replace(/no-print/g, "");

    // 3. إنشاء iframe مخفي لتقديم HTML بشكل صحيح
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.left = "-10000px";
    iframe.style.top = "0";
    iframe.style.width = "820px";
    iframe.style.height = "1200px";
    iframe.style.visibility = "hidden";
    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentDocument!;
    iframeDoc.open();
    iframeDoc.write(html);
    iframeDoc.close();

    // 4. انتظار تحميل الخطوط والعرض
    await new Promise((resolve) => setTimeout(resolve, 800));

    // 5. استخدام html2canvas مباشرة على محتوى iframe
    const html2canvas = (await import("html2canvas")).default;
    const invoiceEl = iframeDoc.querySelector(".invoice") as HTMLElement;
    if (!invoiceEl) throw new Error("لم يتم العثور على عنصر الفاتورة");

    const canvas = await html2canvas(invoiceEl, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: "#f0f2f5",
      width: 800,
      windowWidth: 820,
      onclone: (clonedDoc) => {
        // التأكد من أن الخطوط البديلة متاحة
        const style = clonedDoc.createElement("style");
        style.textContent = `
          * {
            font-family: "Segoe UI", Tahoma, "Noto Sans Arabic", Arial, sans-serif !important;
          }
          .header, .total-box, .footer, .pricing-header {
            background: #1a1a2e !important;
          }
          .status-bar {
            background: #D4AF37 !important;
          }
        `;
        clonedDoc.head.appendChild(style);
      },
    });

    // 6. تحويل Canvas إلى PDF
    const jsPDF = (await import("jspdf")).default;
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const imgData = canvas.toDataURL("image/jpeg", 0.95);
    const pdfWidth = 210;
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    doc.addImage(imgData, "JPEG", 0, 0, pdfWidth, Math.min(pdfHeight, 297));

    const fileName = reference
      ? `فاتورة-${reference}.pdf`
      : `فاتورة-${orderId.slice(0, 8)}.pdf`;
    doc.save(fileName);

    // تنظيف
    document.body.removeChild(iframe);

    toast.success("تم تنزيل الفاتورة بنجاح", {
      id: toastId,
      description: "ملف PDF جاهز للطباعة والمشاركة",
    });
    return true;
  } catch (error) {
    console.error("[PDF Invoice Error]", error);

    // تنظيف أي iframe متبقي
    const existingIframe = document.querySelector('iframe[style*="-10000px"]');
    if (existingIframe) document.body.removeChild(existingIframe);

    toast.error("سيتم فتح الفاتورة في نافذة جديدة", {
      id: toastId,
      description: "احفظها كـ PDF من خلال خيار الطباعة في المتصفح",
    });
    // العودة للطريقة الموثوقة: فتح HTML مباشرة
    window.open(`/api/orders/${orderId}/invoice`, "_blank");
    return false;
  }
}
