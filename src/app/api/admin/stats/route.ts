import { NextRequest, NextResponse } from "next/server";
import { requireShopOrGlobalAdmin } from "@/lib/admin-auth";
import { tursoQuery, toNum, safeJson } from "@/lib/turso-lite";

// الرد ديناميكي (يستخدم searchParams) لكن يُسمح بـ edge cache قصير
export const revalidate = 0;

/// إحصائيات التاجر/الإدارة عبر turso-lite
/// مُحسَّن: يستخدم الفهرس على shopId بدلاً من OR IS NULL (كان يسبب 504)
export async function GET(request: NextRequest) {
  const shopId = request.nextUrl.searchParams.get("shopId");
  const { authorized, error: authError } = await requireShopOrGlobalAdmin(request, shopId);
  if (!authorized) return authError;

  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayISO = todayStart.toISOString();

    type StatsRow = Record<string, unknown>;

    if (shopId) {
      // ─── إحصائيات متجر محدد ───
      // تحسين: استخدام shopId = ? مباشرة (يستخدم الفهرس) بدلاً من OR IS NULL
      // الطلبات القديمة بدون shopId ستُظهر في لوحة الإدارة العامة فقط
      const [statsRows, serviceAndStatusRows, recentOrders, todayRows, expenseRows] = await Promise.all([
        // الاستعلام 1: إجمالي الطلبات والإيرادات (استعلام واحد بدلاً من 4 subqueries)
        tursoQuery<StatsRow>(
          `SELECT COUNT(*) as total, COALESCE(SUM(total), 0) as revenue
           FROM "PrintOrder" WHERE "shopId" = ?`,
          [shopId]
        ).catch((e): StatsRow[] => {
          console.error("[admin/stats] stats query failed:", e);
          return [{ total: 0, revenue: 0 }];
        }),

        // الاستعلام 2: توزيع الحالات + أنواع الخدمات
        tursoQuery<StatsRow>(
          `SELECT status, "serviceType", COUNT(*) as count, COALESCE(SUM(total), 0) as revenue
           FROM "PrintOrder" WHERE "shopId" = ?
           GROUP BY status, "serviceType"`,
          [shopId]
        ).catch((): StatsRow[] => []),

        // الاستعلام 3: آخر الطلبات (بدون fileData لتسريع الاستجابة)
        tursoQuery<StatsRow>(
          `SELECT id, reference, "serviceType", "serviceName", status, total, pages, copies,
                  "createdAt", "fileName", "fileType", options, customer, delivery, pricing, "adminNotes", tags
           FROM "PrintOrder" WHERE "shopId" = ?
           ORDER BY "createdAt" DESC LIMIT 5`,
          [shopId]
        ).catch((): StatsRow[] => []),

        // الاستعلام 4: طلبات اليوم
        tursoQuery<StatsRow>(
          `SELECT COUNT(*) as today FROM "PrintOrder" WHERE "shopId" = ? AND "createdAt" >= ?`,
          [shopId, todayISO]
        ).catch((): StatsRow[] => [{ today: 0 }]),

        // الاستعلام 5: المصاريف
        tursoQuery<StatsRow>(
          `SELECT COALESCE(SUM(amount), 0) as expenses FROM "Expense" WHERE "shopId" = ?`,
          [shopId]
        ).catch((): StatsRow[] => [{ expenses: 0 }]),
      ]);

      const stats: StatsRow = statsRows[0] || {};
      const todayStats: StatsRow = todayRows[0] || {};
      const expenseStats: StatsRow = expenseRows[0] || {};

      const total = toNum(stats.total);
      const today = toNum(todayStats.today);
      const revenueSum = toNum(stats.revenue);
      const expensesSum = toNum(expenseStats.expenses);

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
      }, {
        headers: {
          "Cache-Control": "no-store",
        },
      });
    } else {
      // ─── إحصائيات عامة (لوحة الإدارة) ───
      const [statsRows, serviceAndStatusRows, recentOrders] = await Promise.all([
        tursoQuery<StatsRow>(
          `SELECT
            (SELECT COUNT(*) FROM "PrintOrder") as total,
            (SELECT COUNT(*) FROM "PrintOrder" WHERE "createdAt" >= ?) as today,
            (SELECT COALESCE(SUM(total), 0) FROM "PrintOrder") as revenue,
            (SELECT COALESCE(SUM(amount), 0) FROM "Expense") as expenses
          `,
          [todayISO]
        ).catch((e): StatsRow[] => {
          console.error("[admin/stats] global stats failed:", e);
          return [{ total: 0, today: 0, revenue: 0, expenses: 0 }];
        }),

        tursoQuery<StatsRow>(
          `SELECT status, "serviceType", COUNT(*) as count, COALESCE(SUM(total), 0) as revenue
           FROM "PrintOrder"
           GROUP BY status, "serviceType"`,
          []
        ).catch((): StatsRow[] => []),

        tursoQuery<StatsRow>(
          `SELECT id, reference, "serviceType", "serviceName", status, total, pages, copies,
                  "createdAt", "fileName", "fileType", options, customer, delivery, pricing, "adminNotes", tags
           FROM "PrintOrder"
           ORDER BY "createdAt" DESC LIMIT 5`,
          []
        ).catch((): StatsRow[] => []),
      ]);

      const stats: StatsRow = statsRows[0] || {};
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
      }, {
        headers: {
          "Cache-Control": "no-store",
        },
      });
    }
  } catch (e) {
    console.error("[admin/stats] fatal error:", e);
    return NextResponse.json(
      { totalOrders: 0, totalRevenue: 0, totalExpenses: 0, profit: 0, todayOrders: 0, statusCounts: {}, serviceCounts: [], recentOrders: [] },
      { status: 500 }
    );
  }
}
