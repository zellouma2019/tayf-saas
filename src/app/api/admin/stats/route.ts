import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

// Vercel: Cache response at edge for 30 seconds
export const revalidate = 30;

function toNum(v: unknown): number { return v == null ? 0 : Number(v); }
function safeJson<T = Record<string, unknown>>(str: string, fallback: T): T {
  try { return JSON.parse(str); } catch { return fallback; }
}

export async function GET(request: NextRequest) {
  const { authorized, error: authError } = await requireAdmin(request);
  if (!authorized) return authError;

  try {
    // لا نستخدم ensureDb() — Prisma يتصل تلقائياً
    const shopId = request.nextUrl.searchParams.get("shopId");
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayISO = todayStart.toISOString();

    const shopWhere = shopId ? ` WHERE "shopId" = '${shopId}'` : "";

    // 3 استعلامات فقط بدلاً من 6
    const [statsRow, serviceAndStatusRows, recentOrders] = await Promise.all([
      // الاستعلام 1: إجمالي الإحصائيات في صف واحد
      db.$queryRawUnsafe<Array<Record<string, unknown>>>(`
        SELECT 
          (SELECT COUNT(*) FROM "PrintOrder"${shopWhere}) as total,
          (SELECT COUNT(*) FROM "PrintOrder"${shopWhere} WHERE "createdAt" >= ?) as today,
          (SELECT COALESCE(SUM(total), 0) FROM "PrintOrder"${shopWhere}) as revenue,
          (SELECT COALESCE(SUM(amount), 0) FROM "Expense"${shopWhere}) as expenses
      `, todayISO).catch(() => [{ total: 0, today: 0, revenue: 0, expenses: 0 }]),

      // الاستعلام 2: توزيع الحالات + أنواع الخدمات
      db.$queryRawUnsafe<Array<Record<string, unknown>>>(`
        SELECT status, "serviceType", COUNT(*) as count, COALESCE(SUM(total), 0) as revenue
        FROM "PrintOrder"${shopWhere}
        GROUP BY status, "serviceType"
      `).catch(() => []),

      // الاستعلام 3: آخر الطلبات
      db.$queryRawUnsafe<Array<Record<string, unknown>>>(`
        SELECT id, reference, "serviceType", "serviceName", status, total, pages, copies,
               "createdAt", "fileName", "fileType", options, customer, delivery, pricing, "adminNotes", tags
        FROM "PrintOrder"${shopWhere}
        ORDER BY "createdAt" DESC LIMIT 5
      `).catch(() => []),
    ]);

    const stats = statsRow[0] || {};
    const total = toNum(stats.total);
    const today = toNum(stats.today);
    const revenueSum = toNum(stats.revenue);
    const expensesSum = toNum(stats.expenses);

    const statusMap: Record<string, number> = {};
    const serviceMap: Record<string, { count: number; revenue: number }> = {};
    for (const row of serviceAndStatusRows) {
      const st = String(row.status);
      statusMap[st] = (statusMap[st] || 0) + toNum(row.count);
      const svc = String(row.serviceType);
      if (!serviceMap[svc]) serviceMap[svc] = { count: 0, revenue: 0 };
      serviceMap[svc].count += toNum(row.count);
      serviceMap[svc].revenue += toNum(row.revenue);
    }

    return NextResponse.json({
      totalOrders: total,
      totalRevenue: revenueSum,
      totalExpenses: expensesSum,
      profit: revenueSum - expensesSum,
      todayOrders: today,
      statusCounts: statusMap,
      serviceCounts: Object.entries(serviceMap).map(([serviceType, v]) => ({ serviceType, ...v })),
      recentOrders: recentOrders.map((o) => ({
        ...o,
        total: toNum(o.total),
        pages: toNum(o.pages),
        copies: toNum(o.copies),
        options: safeJson(String(o.options || "{}"), {}),
        customer: safeJson(String(o.customer || "{}"), { name: "", phone: "" }),
        delivery: safeJson(String(o.delivery || "{}"), {}),
        pricing: safeJson(String(o.pricing || "{}"), {}),
      })),
    });
  } catch (e) {
    console.error("[admin/stats] fatal error:", e);
    return NextResponse.json(
      { totalOrders: 0, totalRevenue: 0, totalExpenses: 0, profit: 0, todayOrders: 0, statusCounts: {}, serviceCounts: [], recentOrders: [] },
      { status: 500 }
    );
  }
}
