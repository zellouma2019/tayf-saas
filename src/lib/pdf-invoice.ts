"use client";

import jsPDF from "jspdf";
import { toast } from "sonner";
import { shopApi } from "@/lib/shop-api";

/**
 * تحويل فاتورة إلى ملف PDF خفيف وتنزيلها مباشرة
 * يستخدم jsPDF مباشرةً بدون html2canvas لتجنب التهنيق والتجمد
 */
export async function downloadInvoicePDF(orderId: string, reference?: string): Promise<boolean> {
  try {
    toast.loading("جارٍ إنشاء ملف PDF...", { id: "pdf-invoice" });

    // 1. جلب بيانات الطلب
    const res = await shopApi(`/api/orders/${orderId}`);
    if (!res.ok) throw new Error("فشل في جلب بيانات الطلب");
    const order = await res.json();

    // 2. جلب بيانات المتجر
    let shopData: { name?: string; phone?: string; address?: string; email?: string; primaryColor?: string; whatsapp?: string; country?: string } = {};
    try {
      const shopRes = await shopApi("/api/settings");
      if (shopRes.ok) {
        const settings = await shopRes.json();
        shopData = settings.shop || {};
      }
    } catch {}

    // 3. تحليل بيانات العميل والطلب
    const customer = typeof order.customer === "string" ? JSON.parse(order.customer) : order.customer;
    const pricing = typeof order.pricing === "string" ? JSON.parse(order.pricing) : order.pricing;
    const delivery = typeof order.delivery === "string" ? JSON.parse(order.delivery) : order.delivery;
    const options = typeof order.options === "string" ? JSON.parse(order.options) : order.options;

    // 4. إنشاء مستند PDF مباشر
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const pageWidth = 210;
    const margin = 15;
    const contentWidth = pageWidth - margin * 2;
    let y = margin;

    // === الرأس ===
    const primaryColor = shopData.primaryColor || "#1a1a1a";
    doc.setFillColor(primaryColor);
    doc.rect(0, 0, pageWidth, 40, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.text(shopData.name || "مطبعة", pageWidth - margin, y + 8, { align: "right" });

    doc.setFontSize(9);
    doc.text("فاتورة طلب طباعة", pageWidth - margin, y + 16, { align: "right" });

    if (shopData.phone) {
      doc.setFontSize(8);
      doc.text(`هاتف: ${shopData.phone}`, pageWidth - margin, y + 24, { align: "right" });
    }
    if (shopData.address) {
      doc.text(`العنوان: ${shopData.address}`, pageWidth - margin, y + 30, { align: "right" });
    }

    y = 50;

    // === معلومات الطلب ===
    doc.setTextColor(60, 60, 60);
    doc.setFontSize(10);

    // عنوان: رقم الفاتورة - التاريخ
    doc.setFont(undefined, "bold");
    doc.text("رقم الطلب:", pageWidth - margin, y, { align: "right" });
    doc.setFont(undefined, "normal");
    doc.text(order.reference || orderId.slice(0, 8), margin, y, { align: "left" });
    y += 7;

    doc.setFont(undefined, "bold");
    doc.text("التاريخ:", pageWidth - margin, y, { align: "right" });
    doc.setFont(undefined, "normal");
    const orderDate = order.createdAt ? new Date(order.createdAt).toLocaleDateString("ar-SA") : "---";
    doc.text(orderDate, margin, y, { align: "left" });
    y += 7;

    doc.setFont(undefined, "bold");
    doc.text("الحالة:", pageWidth - margin, y, { align: "right" });
    doc.setFont(undefined, "normal");
    const statusMap: Record<string, string> = {
      pending: "جديد", confirmed: "مؤكد", printing: "قيد الطباعة",
      ready: "جاهز", delivered: "تم التسليم", cancelled: "ملغي",
    };
    doc.text(statusMap[order.status] || order.status, margin, y, { align: "left" });
    y += 12;

    // === خط فاصل ===
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);
    y += 8;

    // === معلومات العميل ===
    doc.setFontSize(11);
    doc.setFont(undefined, "bold");
    doc.setTextColor(primaryColor);
    doc.text("بيانات العميل", pageWidth - margin, y, { align: "right" });
    y += 8;

    doc.setFontSize(9);
    doc.setTextColor(60, 60, 60);
    doc.setFont(undefined, "normal");

    const customerFields = [
      { label: "الاسم", value: customer?.name || "---" },
      { label: "الهاتف", value: customer?.phone || "---" },
      { label: "البريد الإلكتروني", value: customer?.email || "" },
    ];

    for (const field of customerFields) {
      if (!field.value) continue;
      doc.setFont(undefined, "bold");
      doc.text(`${field.label}:`, pageWidth - margin, y, { align: "right" });
      doc.setFont(undefined, "normal");
      doc.text(field.value, margin, y, { align: "left" });
      y += 6;
    }

    y += 6;

    // === تفاصيل الطلب ===
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, y, pageWidth - margin, y);
    y += 8;

    doc.setFontSize(11);
    doc.setFont(undefined, "bold");
    doc.setTextColor(primaryColor);
    doc.text("تفاصيل الطلب", pageWidth - margin, y, { align: "right" });
    y += 8;

    doc.setFontSize(9);
    doc.setTextColor(60, 60, 60);
    doc.setFont(undefined, "normal");

    const orderDetails = [
      { label: "نوع الخدمة", value: order.serviceName || order.serviceType || "---" },
      { label: "اسم الملف", value: order.fileName || "---" },
      { label: "عدد الصفحات", value: String(order.pages || 1) },
      { label: "عدد النسخ", value: String(order.copies || 1) },
    ];

    if (options?.paperSize) orderDetails.push({ label: "حجم الورق", value: options.paperSize });
    if (options?.colorMode) orderDetails.push({ label: "نوع الطباعة", value: options.colorMode === "color" ? "ملوّنة" : "أبيض وأسود" });
    if (options?.sides) orderDetails.push({ label: "الوجه", value: options.sides === "duplex" ? "وجهين" : "وجه واحد" });
    if (delivery?.method) orderDetails.push({ label: "طريقة التسليم", value: delivery.method === "delivery" ? "توصيل" : "استلام يدوي" });

    for (const field of orderDetails) {
      doc.setFont(undefined, "bold");
      doc.text(`${field.label}:`, pageWidth - margin, y, { align: "right" });
      doc.setFont(undefined, "normal");
      doc.text(field.value, margin, y, { align: "left" });
      y += 6;
    }

    y += 6;

    // === خط فاصل قبل التكلفة ===
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, y, pageWidth - margin, y);
    y += 10;

    // === التكلفة ===
    doc.setFillColor(245, 245, 245);
    doc.roundedRect(margin, y - 4, contentWidth, 30, 3, 3, "F");

    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);

    if (pricing) {
      if (pricing.unitPrice != null) {
        doc.text(`سعر الوحدة: ${pricing.unitPrice}`, pageWidth - margin, y + 5, { align: "right" });
      }
      if (pricing.subtotal != null) {
        doc.text(`المجموع الفرعي: ${pricing.subtotal}`, pageWidth - margin, y + 12, { align: "right" });
      }
    }

    doc.setFontSize(14);
    doc.setFont(undefined, "bold");
    doc.setTextColor(primaryColor);
    const total = order.total || pricing?.total || 0;
    doc.text(`الإجمالي: ${total}`, pageWidth - margin, y + 22, { align: "right" });

    y += 40;

    // === التذييل ===
    if (y > 260) {
      doc.addPage();
      y = margin;
    }

    doc.setDrawColor(200, 200, 200);
    doc.line(margin, y, pageWidth - margin, y);
    y += 8;

    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.text("شكراً لتعاملكم معنا", pageWidth / 2, y, { align: "center" });
    y += 5;
    doc.text(`© ${new Date().getFullYear()} ${shopData.name || "طيف"} — جميع الحقوق محفوظة`, pageWidth / 2, y, { align: "center" });

    // 5. حفظ الملف
    const fileName = reference
      ? `فاتورة-${reference}.pdf`
      : `فاتورة-${orderId.slice(0, 8)}.pdf`;
    doc.save(fileName);

    toast.success("تم تنزيل الفاتورة بنجاح", {
      id: "pdf-invoice",
      description: "ملف PDF جاهز للطباعة والمشاركة",
    });
    return true;
  } catch (error) {
    console.error("[PDF Invoice Error]", error);
    toast.error("فشل في إنشاء PDF", {
      id: "pdf-invoice",
      description: "سيتم فتح صفحة الطباعة بدلاً من ذلك",
    });
    // العودة للطريقة القديمة
    const shopId = (await import("@/lib/store")).useAppStore.getState().shopId;
    const sep = shopId ? "?" : "";
    const query = shopId ? `shopId=${encodeURIComponent(shopId)}` : "";
    window.open(`/api/orders/${orderId}/invoice${sep}${query}`, "_blank");
    return false;
  }
}