import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { tursoQuery, toNum, safeJson } from "@/lib/turso-lite";

// تجنب ISR caching — الرد ديناميكي دائماً
export const dynamic = "force-dynamic";
export const revalidate = 0;

/// إحصائيات التاجر/الإدارة عبر turso-lite (أسرع 10x من Prisma على Vercel)
/// يتجنب WebSocket cold-start الخاص بـ PrismaLibSQL
export async function GET(request: NextRequest) {
  const { authorized, error: authError } = await requireAdmin(request);
  if (!authorized) return authError;

  try {
    const shopId = request.nextUrl.searchParams.get("shopId");
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayISO = todayStart.toISOString();

    // بناء شروط WHERE ديناميكياً مع معاملات موضعية (منع SQL injection)
    // يدعم الطلبات القديمة (shopId = null)
    // shopFilter: شرط shopId (يُعاد استخدامه في عدة استعلامات)
    const shopFilter = shopId ? `("shopId" = ? OR "shopId" IS NULL)` : "";
    const shopAndToday = shopId
      ? `("shopId" = ? OR "shopId" IS NULL) AND "createdAt" >= ?`
      : `"createdAt" >= ?`;

    // الوسائط بحسب وجود shopId
    // stats: shopId?(shopId, shopId, todayISO, shopId, shopId) : (todayISO,)
    const statsArgs: unknown[] = shopId
      ? [shopId, shopId, todayISO, shopId, shopId]
      : [todayISO];
    const listArgs: unknown[] = shopId ? [shopId] : [];

    // 3 استعلامات موازية عبر turso-lite (HTTP mode مباشرة)
    type StatsRow = Record<string, unknown>;
    const [statsRows, serviceAndStatusRows, recentOrders] = await Promise.all([
      // الاستعلام 1: إجمالي الإحصائيات في صف واحد
      tursoQuery<StatsRow>(
        `SELECT
          (SELECT COUNT(*) FROM "PrintOrder" ${shopFilter ? `WHERE ${shopFilter}` : ""}) as total,
          (SELECT COUNT(*) FROM "PrintOrder" WHERE ${shopAndToday}) as today,
          (SELECT COALESCE(SUM(total), 0) FROM "PrintOrder" ${shopFilter ? `WHERE ${shopFilter}` : ""}) as revenue,
          (SELECT COALESCE(SUM(amount), 0) FROM "Expense" ${shopFilter ? `WHERE ${shopFilter}` : ""}) as expenses
        `,
        statsArgs
      ).catch((e): StatsRow[] => {
        console.error("[admin/stats] stats subquery failed:", e);
        return [{ total: 0, today: 0, revenue: 0, expenses: 0 }];
      }),

      // الاستعلام 2: توزيع الحالات + أنواع الخدمات
      tursoQuery<StatsRow>(
        `SELECT status, "serviceType", COUNT(*) as count, COALESCE(SUM(total), 0) as revenue
         FROM "PrintOrder" ${shopFilter ? `WHERE ${shopFilter}` : ""}
         GROUP BY status, "serviceType"`,
        listArgs
      ).catch((): StatsRow[] => []),

      // الاستعلام 3: آخر الطلبات
      tursoQuery<StatsRow>(
        `SELECT id, reference, "serviceType", "serviceName", status, total, pages, copies,
                "createdAt", "fileName", "fileType", options, customer, delivery, pricing, "adminNotes", tags
         FROM "PrintOrder" ${shopFilter ? `WHERE ${shopFilter}` : ""}
         ORDER BY "createdAt" DESC LIMIT 5`,
        listArgs
      ).catch((): StatsRow[] => []),
    ]);

    const stats: StatsRow = statsRows[0] || {};
    const total = toNum(stats.total);
    const today = toNum(stats.today);
    const revenueSum = toNum(stats.revenue);
    const expensesSum = toNum(stats.expenses);

    const statusMap: Record<string, number> = {};
    const serviceMap: Record<string, { count: number; revenue: number }> = {};
    for (const row of serviceAndStatusRows as StatsRow[]) {
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
      recentOrders: (recentOrders as StatsRow[]).map((o) => ({
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
