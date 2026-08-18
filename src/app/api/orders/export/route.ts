import { NextRequest, NextResponse } from "next/server";
import { tursoQuery, toNum, safeJson } from "@/lib/turso-lite";
import { requireShopOrGlobalAdmin } from "@/lib/admin-auth";
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

/// تصدير الطلبات عبر turso-lite (أسرع 10x من Prisma على Vercel)
export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const shopId = searchParams.get("shopId");
  const { authorized, error: authError } = await requireShopOrGlobalAdmin(request, shopId);
  if (!authorized) return authError;

  try {

    const shopFilter = shopId ? `("shopId" = ? OR "shopId" IS NULL)` : "";
    const args: unknown[] = shopId ? [shopId] : [];

    const orders = await tursoQuery(
      `SELECT
        id, reference, "serviceType", "serviceName",
        "fileName", "fileType", pages, copies,
        total, status, "createdAt", "adminNotes", customer
      FROM "PrintOrder"
      ${shopFilter ? `WHERE ${shopFilter}` : ""}
      ORDER BY "createdAt" DESC`,
      args
    );

    // === Sheet 1: Orders ===
    const orderRows = orders.map((o) => {
      const customer = safeJson(String(o.customer || "{}"), { name: "", phone: "" });
      return {
        "المرجع": o.reference,
        "الخدمة": o.serviceName || SERVICE_NAMES[String(o.serviceType)] || o.serviceType,
        "العميل": customer.name || "—",
        "الهاتف": customer.phone || "—",
        "الصفحات": toNum(o.pages),
        "النسخ": toNum(o.copies),
        "المبلغ": toNum(o.total),
        "الحالة": STATUS_META[String(o.status)]?.label || o.status,
        "التاريخ": new Date(String(o.createdAt)).toLocaleDateString("ar-SA-u-nu-latn"),
        "ملاحظات": o.adminNotes || "",
      };
    });

    // === Sheet 2: Statistics ===
    const totalRevenue = orders.reduce((s, o) => s + toNum(o.total), 0);
    const delivered = orders.filter((o) => String(o.status) === "delivered").length;
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayCount = orders.filter((o) => new Date(String(o.createdAt)) >= todayStart).length;

    const statusStats: Record<string, number> = {};
    for (const o of orders) {
      const st = String(o.status);
      statusStats[st] = (statusStats[st] || 0) + 1;
    }

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
