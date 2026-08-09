"use client";

import { useState, useCallback } from "react";
import { Download, Loader2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface OrderReceiptProps {
  orderId: string;
  trigger?: React.ReactNode;
}

interface OrderData {
  id: string;
  reference: string;
  serviceName: string;
  serviceType: string;
  customer: { name: string; phone: string };
  options: {
    colorMode?: string;
    paperSize?: string;
    paperType?: string;
    sides?: string;
    binding?: string;
    [key: string]: unknown;
  };
  pricing: {
    perPage?: number;
    pagesPrice?: number;
    copiesPrice?: number;
    extras?: { label: string; amount: number }[];
    subtotal?: number;
    discount?: number;
    total?: number;
    [key: string]: unknown;
  };
  pages: number;
  copies: number;
  total: number;
  status: string;
  createdAt: string;
  delivery: { mode: string; date?: string };
}

interface ShopSettings {
  shopName: string;
  shopLogo?: string;
  phone?: string;
  address?: string;
}

export function OrderReceipt({ orderId, trigger }: OrderReceiptProps) {
  const [loading, setLoading] = useState(false);

  const generatePDF = useCallback(async () => {
    setLoading(true);
    try {
      // جلب بيانات الطلب
      const orderRes = await fetch(`/api/orders/${orderId}`);
      if (!orderRes.ok) throw new Error("فشل في جلب بيانات الطلب");
      const order: OrderData = await orderRes.json();

      // جلب إعدادات المحل
      let shop: ShopSettings = { shopName: "مطبعة الذكي" };
      try {
        const settingsRes = await fetch("/api/settings");
        if (settingsRes.ok) {
          const data = await settingsRes.json();
          const g = data.general || {};
          shop = {
            shopName: g.shopName || "مطبعة الذكي",
            shopLogo: g.shopLogo || "",
            phone: g.phone || "0560 00 00 00",
            address: g.address || "",
          };
        }
      } catch {
        /* استخدم القيم الافتراضية */
      }

      const { jsPDF } = await import("jspdf");
      const QRCode = await import("qrcode");

      // إنشاء رمز QR
      const trackingUrl = `${window.location.origin}?track=${order.reference}`;
      const qrDataUrl = await QRCode.toDataURL(trackingUrl, {
        width: 120,
        margin: 1,
        color: { dark: "#1a1a1a", light: "#ffffff" },
      });

      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: [80, 200], // حجم حرارة Receipt
      });

      const pageWidth = 80;
      const margin = 5;
      const contentWidth = pageWidth - margin * 2;
      let y = 8;

      // ─── الشعار والاسم ───
      if (shop.shopLogo && shop.shopLogo.length <= 4 && !shop.shopLogo.startsWith("http")) {
        doc.setFontSize(20);
        doc.text(shop.shopLogo, pageWidth / 2, y + 3, { align: "center" });
        y += 8;
      }

      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text(shop.shopName, pageWidth / 2, y, { align: "center" });
      y += 4;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      if (shop.phone) {
        doc.text(`Tel: ${shop.phone}`, pageWidth / 2, y, { align: "center" });
        y += 3;
      }
      if (shop.address) {
        doc.text(shop.address, pageWidth / 2, y, { align: "center" });
        y += 3;
      }

      // ─── خط فاصل ───
      y += 1;
      drawDashedLine(doc, margin, y, pageWidth - margin, y);
      y += 4;

      // ─── عنوان الوصل ───
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.text("RECEIPT / WASL", pageWidth / 2, y, { align: "center" });
      y += 6;

      // ─── رقم المرجع ───
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.text("Reference:", margin, y);
      doc.setFont("helvetica", "normal");
      doc.text(order.reference, pageWidth - margin, y, { align: "right" });
      y += 4;

      // ─── التاريخ ───
      const date = new Date(order.createdAt);
      const dateStr = date.toLocaleDateString("ar-DZ", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
      doc.setFont("helvetica", "bold");
      doc.text("Date:", margin, y);
      doc.setFont("helvetica", "normal");
      doc.text(dateStr, pageWidth - margin, y, { align: "right" });
      y += 5;

      drawDashedLine(doc, margin, y, pageWidth - margin, y);
      y += 4;

      // ─── بيانات العميل ───
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.text("Customer Info", margin, y);
      y += 4;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.text(`Name: ${order.customer?.name || "—"}`, margin + 1, y);
      y += 3;
      doc.text(`Phone: ${order.customer?.phone || "—"}`, margin + 1, y);
      y += 5;

      drawDashedLine(doc, margin, y, pageWidth - margin, y);
      y += 4;

      // ─── تفاصيل الخدمة ───
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.text("Service Details", margin, y);
      y += 4;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);

      const serviceRows = [
        ["Service", order.serviceName],
        ["Pages", String(order.pages)],
        ["Copies", String(order.copies)],
      ];

      if (order.options?.colorMode) {
        serviceRows.push(["Color", order.options.colorMode]);
      }
      if (order.options?.paperSize) {
        serviceRows.push(["Paper", order.options.paperSize]);
      }
      if (order.options?.sides) {
        serviceRows.push(["Sides", order.options.sides]);
      }
      if (order.options?.binding) {
        serviceRows.push(["Binding", order.options.binding]);
      }

      for (const [label, value] of serviceRows) {
        doc.setFont("helvetica", "bold");
        doc.text(`${label}:`, margin + 1, y);
        doc.setFont("helvetica", "normal");
        doc.text(String(value), pageWidth - margin - 1, y, { align: "right" });
        y += 3.5;
      }

      y += 1;
      drawDashedLine(doc, margin, y, pageWidth - margin, y);
      y += 4;

      // ─── تفصيل الأسعار ───
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.text("Price Breakdown", margin, y);
      y += 4;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);

      const pricing = order.pricing || {};
      if (pricing.perPage) {
        doc.text(`Price/page: ${pricing.perPage} DA`, margin + 1, y);
        y += 3.5;
      }
      if (pricing.pagesPrice) {
        doc.text(`Pages total: ${pricing.pagesPrice} DA`, margin + 1, y);
        y += 3.5;
      }
      if (pricing.copiesPrice) {
        doc.text(`Copies total: ${pricing.copiesPrice} DA`, margin + 1, y);
        y += 3.5;
      }

      // إضافات
      if (pricing.extras && Array.isArray(pricing.extras)) {
        for (const extra of pricing.extras) {
          doc.text(
            `+ ${extra.label}: ${extra.amount} DA`,
            margin + 1,
            y
          );
          y += 3.5;
        }
      }

      if (pricing.discount && Number(pricing.discount) > 0) {
        doc.text(`Discount: -${pricing.discount} DA`, margin + 1, y);
        y += 3.5;
      }

      y += 2;

      // ─── المجموع ───
      drawDashedLine(doc, margin, y, pageWidth - margin, y);
      y += 5;
      doc.setFillColor(30, 30, 30);
      doc.roundedRect(margin, y - 4, contentWidth, 8, 2, 2, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(255, 255, 255);
      doc.text("TOTAL:", margin + 3, y + 1);
      doc.text(`${order.total || pricing.total || 0} DA`, pageWidth - margin - 3, y + 1, {
        align: "right",
      });
      doc.setTextColor(0, 0, 0);
      y += 8;

      drawDashedLine(doc, margin, y, pageWidth - margin, y);
      y += 5;

      // ─── رمز QR ───
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.text("Scan to track your order", pageWidth / 2, y, { align: "center" });
      y += 2;
      const qrSize = 28;
      doc.addImage(
        qrDataUrl,
        "PNG",
        (pageWidth - qrSize) / 2,
        y,
        qrSize,
        qrSize
      );
      y += qrSize + 3;

      doc.setFontSize(6);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(120, 120, 120);
      doc.text(order.reference, pageWidth / 2, y, { align: "center" });
      doc.setTextColor(0, 0, 0);
      y += 6;

      // ─── رسالة شكر ───
      drawDashedLine(doc, margin, y, pageWidth - margin, y);
      y += 5;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.text("Thank you for your trust!", pageWidth / 2, y, { align: "center" });
      y += 4;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.5);
      doc.text(shop.shopName, pageWidth / 2, y, { align: "center" });

      // تنزيل الملف
      doc.save(`receipt-${order.reference}.pdf`);
      toast.success("تم تحميل الوصل بنجاح");
    } catch (error) {
      console.error("PDF generation error:", error);
      toast.error("فشل في إنشاء الوصل", {
        description: "حاول مرة أخرى لاحقاً",
      });
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  if (trigger) {
    return (
      <span onClick={generatePDF} className="cursor-pointer">
        {loading ? (
          <span className="flex items-center gap-2 opacity-70">
            <Loader2 className="h-4 w-4 animate-spin" />
            جارٍ التحميل...
          </span>
        ) : (
          trigger
        )}
      </span>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={generatePDF}
      disabled={loading}
      className="gap-2"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Download className="h-4 w-4" />
      )}
      تحميل الوصل
    </Button>
  );
}

/** رسم خط متقطع أفقي */
function drawDashedLine(
  doc: import("jspdf").jsPDF,
  x1: number,
  y1: number,
  x2: number,
  y2: number
) {
  doc.setLineDashPattern([1.5, 1.5], 0);
  doc.setDrawColor(180, 180, 180);
  doc.line(x1, y1, x2, y2);
  doc.setLineDashPattern([], 0);
}