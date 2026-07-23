import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import * as XLSX from "xlsx";
import { STATUS_META } from "@/lib/print-config";

export const maxDuration = 60;

const SERVICE_NAMES: Record<string, string> = {
  document: "وثائق",
  photo: "صور",
  binding: "تجليد",
  copy: "نسخ",
  card: "بطاقات",
  poster: "ملصقات",
};

export async function POST(request: Request) {
  const { authorized, error: authError } = await requireAdmin(request);
  if (!authorized) return authError;

  try {
    const { searchParams } = new URL(request.url);
    const shopId = searchParams.get("shopId");

    const where: Record<string, unknown> = {};
    if (shopId) where.shopId = shopId;

    // استثناء fileData و smartAnalysis من التصدير
    const orders = await db.printOrder.findMany({
      where,
      orderBy: { createdAt: "desc" },
      select: {
        id: true, reference: true, serviceType: true, serviceName: true,
        fileName: true, fileType: true, pages: true, copies: true,
        total: true, status: true, createdAt: true, adminNotes: true,
        customer: true,
      },
    });

    // === Sheet 1: Orders ===
    const orderRows = orders.map((o) => {
      let customerName = "—";
      let customerPhone = "—";
      try {
        const c = JSON.parse(o.customer);
        customerName = c.name || "—";
        customerPhone = c.phone || "—";
      } catch { /* skip */ }

      return {
        "المرجع": o.reference,
        "الخدمة": o.serviceName || SERVICE_NAMES[o.serviceType] || o.serviceType,
        "العميل": customerName,
        "الهاتف": customerPhone,
        "الصفحات": o.pages,
        "النسخ": o.copies,
        "المبلغ": o.total,
        "الحالة": STATUS_META[o.status]?.label || o.status,
        "التاريخ": o.createdAt.toLocaleDateString("ar-SA-u-nu-latn"),
        "ملاحظات": o.adminNotes || "",
      };
    });

    // === Sheet 2: Statistics ===
    const totalRevenue = orders.reduce((s, o) => s + o.total, 0);
    const delivered = orders.filter((o) => o.status === "delivered").length;
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayCount = orders.filter((o) => new Date(o.createdAt) >= todayStart).length;

    const statusStats: Record<string, number> = {};
    orders.forEach((o) => { statusStats[o.status] = (statusStats[o.status] || 0) + 1; });

    const statsRows = [
      { "المقياس": "إجمالي الطلبات", "القيمة": orders.length },
      { "المقياس": "إجمالي الإيرادات", "القيمة": totalRevenue },
      { "المقياس": "تم التسليم", "القيمة": delivered },
      { "المقياس": "طلبات اليوم", "القيمة": todayCount },
      { "المقياس": "متوسط قيمة الطلب", "القيمة": orders.length > 0 ? Math.round(totalRevenue / orders.length) : 0 },
      { "المقياس": "نسبة التسليم %", "القيمة": orders.length > 0 ? Math.round((delivered / orders.length) * 100) : 0 },
      { "المقياس": "", "القيمة": "" },
      { "المقياس": "حسب الحالة", "القيمة": "" },
      ...Object.entries(statusStats).map(([status, count]) => ({
        "المقياس": STATUS_META[status]?.label || status,
        "القيمة": count,
      })),
    ];

    const wb = XLSX.utils.book_new();

    const ws1 = XLSX.utils.json_to_sheet(orderRows);
    ws1["!cols"] = [
      { wch: 12 }, { wch: 14 }, { wch: 20 }, { wch: 14 },
      { wch: 8 }, { wch: 8 }, { wch: 14 }, { wch: 12 },
      { wch: 14 }, { wch: 20 },
    ];
    XLSX.utils.book_append_sheet(wb, ws1, "الطلبات");

    const ws2 = XLSX.utils.json_to_sheet(statsRows);
    ws2["!cols"] = [{ wch: 25 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(wb, ws2, "إحصائيات");

    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": "attachment; filename*=UTF-8''" + encodeURIComponent("تقرير-الطلبات.xlsx"),
      },
    });
  } catch (e) {
    console.error('[orders/export]', e);
    return NextResponse.json({ error: "حدث خطأ أثناء تصدير الطلبات" }, { status: 500 });
  }
}
