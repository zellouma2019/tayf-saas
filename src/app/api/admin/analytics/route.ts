import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { tursoQuery, tursoQueries, toNum, safeJson } from "@/lib/turso-lite";

export const maxDuration = 30;

/// تحليلات متقدمة عبر turso-lite (أسرع 10x من Prisma على Vercel)
/// يُستدعى من لوحة التحكم الإدارية + لوحة التاجر
export async function GET(request: Request) {
  const { authorized, error: authError } = await requireAdmin(request);
  if (!authorized) return authError;

  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "30";
    const shopId = searchParams.get("shopId");

    const since = new Date();
    since.setDate(since.getDate() - parseInt(period, 10));
    since.setHours(0, 0, 0, 0);
    const sinceISO = since.toISOString();

    const now = new Date();

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const sixMonthsISO = sixMonthsAgo.toISOString();

    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
    const fourteenDaysISO = fourteenDaysAgo.toISOString();

    const fourWeeksAgo = new Date();
    fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);
    const fourWeeksISO = fourWeeksAgo.toISOString();

    const prevSince = new Date(since);
    prevSince.setDate(prevSince.getDate() - parseInt(period, 10));
    const prevSinceISO = prevSince.toISOString();

    // شرط shopId
    const shopFilter = shopId
      ? `("shopId" = ? OR "shopId" IS NULL)`
      : "";

    // 4 استعلامات موازية عبر turso-lite (HTTP mode مباشرة)
    type Row = Record<string, unknown>;

    // الاستعلام 1: بيانات شهرية (آخر 6 أشهر)
    const monthlySQL = `
      SELECT
        strftime('%Y-%m', "createdAt") as month,
        COUNT(*) as count,
        COALESCE(SUM(total), 0) as revenue,
        COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered
      FROM "PrintOrder"
      WHERE "createdAt" >= ?
      ${shopFilter ? `AND ${shopFilter}` : ""}
      GROUP BY strftime('%Y-%m', "createdAt")
      ORDER BY month DESC
      LIMIT 6
    `;
    const monthlyArgs = shopId ? [sixMonthsISO, shopId] : [sixMonthsISO];

    // الاستعلام 2: بيانات يومية (آخر 14 يوم)
    const dailySQL = `
      SELECT
        date("createdAt") as day,
        COALESCE(SUM(total), 0) as revenue
      FROM "PrintOrder"
      WHERE "createdAt" >= ?
      ${shopFilter ? `AND ${shopFilter}` : ""}
      GROUP BY date("createdAt")
      ORDER BY day ASC
    `;
    const dailyArgs = shopId ? [fourteenDaysISO, shopId] : [fourteenDaysISO];

    // الاستعلام 3: خريطة حرارية (آخر 4 أسابيع)
    const heatmapSQL = `
      SELECT "createdAt"
      FROM "PrintOrder"
      WHERE "createdAt" >= ?
      ${shopFilter ? `AND ${shopFilter}` : ""}
    `;
    const heatmapArgs = shopId ? [fourWeeksISO, shopId] : [fourWeeksISO];

    // الاستعلام 4: جميع البيانات للفترة المحددة (للتحليل الشامل)
    const allOrdersSQL = `
      SELECT customer, total, "createdAt", status, pages, copies, "serviceType"
      FROM "PrintOrder"
      ${shopFilter ? `WHERE ${shopFilter}` : ""}
    `;
    const allOrdersArgs: unknown[] = shopId ? [shopId] : [];

    const [monthlyRows, dailyRows, heatmapRows, allOrdersRows] = await Promise.all([
      tursoQuery<Row>(monthlySQL, monthlyArgs).catch((): Row[] => []),
      tursoQuery<Row>(dailySQL, dailyArgs).catch((): Row[] => []),
      tursoQuery<Row>(heatmapSQL, heatmapArgs).catch((): Row[] => []),
      tursoQuery<Row>(allOrdersSQL, allOrdersArgs).catch((): Row[] => []),
    ]);

    // 1. Monthly data
    const monthlyData = monthlyRows
      .reverse()
      .map((r) => ({
        month: String(r.month),
        revenue: toNum(r.revenue),
        count: toNum(r.count),
        delivered: toNum(r.delivered),
      }));

    // 2. Daily data
    const dailyData = dailyRows.map((r) => ({
      date: String(r.day),
      revenue: toNum(r.revenue),
    }));

    // 3. Service distribution (in-memory from allOrders)
    const serviceMap: Record<string, { count: number; revenue: number }> = {};
    for (const o of allOrdersRows) {
      const svc = String(o.serviceType);
      if (!serviceMap[svc]) serviceMap[svc] = { count: 0, revenue: 0 };
      serviceMap[svc].count += 1;
      serviceMap[svc].revenue += toNum(o.total);
    }
    const serviceDistribution = Object.entries(serviceMap).map(([serviceType, d]) => ({
      serviceType, count: d.count, revenue: d.revenue,
    }));

    // 4. Status distribution (in-memory from allOrders)
    const statusMap: Record<string, number> = {};
    for (const o of allOrdersRows) {
      const st = String(o.status);
      statusMap[st] = (statusMap[st] || 0) + 1;
    }
    const statusDistribution = Object.entries(statusMap).map(([status, count]) => ({
      status, count,
    }));

    // 5. Top customers (in-memory from allOrders)
    const customerMap: Record<string, { name: string; phone: string; orders: number; total: number; lastOrder: string }> = {};
    for (const o of allOrdersRows) {
      try {
        const c = safeJson(String(o.customer || "{}"), { name: "", phone: "" });
        const phone = c.phone || "unknown";
        if (!customerMap[phone]) {
          customerMap[phone] = { name: c.name || "—", phone, orders: 0, total: 0, lastOrder: "" };
        }
        customerMap[phone].orders += 1;
        customerMap[phone].total += toNum(o.total);
        if (!customerMap[phone].lastOrder || String(o.createdAt) > customerMap[phone].lastOrder) {
          customerMap[phone].lastOrder = String(o.createdAt);
        }
      } catch { /* skip bad data */ }
    }
    const topCustomers = Object.values(customerMap)
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);

    // 6. Weekly heatmap (in-memory)
    const heatmap: number[][] = Array.from({ length: 4 }, () => Array(7).fill(0));
    for (const o of heatmapRows) {
      try {
        const diff = Math.floor((now.getTime() - new Date(String(o.createdAt)).getTime()) / (1000 * 60 * 60 * 24));
        if (diff >= 0 && diff < 28) {
          const week = Math.floor(diff / 7);
          const day = new Date(String(o.createdAt)).getDay();
          if (week >= 0 && week < 4 && day >= 0 && day < 7) {
            heatmap[week][day] += 1;
          }
        }
      } catch { /* skip */ }
    }

    // 7. Period summary — فلترة بالذاكرة من allOrdersRows
    let periodSummary = {
      totalRevenue: 0,
      totalOrders: 0,
      deliveredOrders: 0,
      cancelledOrders: 0,
      avgOrderValue: 0,
      totalPages: 0,
      totalCopies: 0,
      deliveryRate: 0,
    };
    const periodOrders: Row[] = [];
    for (const o of allOrdersRows) {
      try {
        const created = new Date(String(o.createdAt));
        if (created >= since) periodOrders.push(o);
      } catch { /* skip */ }
    }
    periodSummary.totalRevenue = periodOrders.reduce((s, o) => s + toNum(o.total), 0);
    periodSummary.totalOrders = periodOrders.length;
    periodSummary.deliveredOrders = periodOrders.filter((o) => String(o.status) === "delivered").length;
    periodSummary.cancelledOrders = periodOrders.filter((o) => String(o.status) === "cancelled").length;
    periodSummary.avgOrderValue = periodOrders.length > 0
      ? Math.round(periodSummary.totalRevenue / periodOrders.length)
      : 0;
    periodSummary.totalPages = periodOrders.reduce((s, o) => s + toNum(o.pages), 0);
    periodSummary.totalCopies = periodOrders.reduce((s, o) => s + toNum(o.copies), 0);
    const nonCancelled = periodOrders.filter((o) => String(o.status) !== "cancelled");
    periodSummary.deliveryRate = nonCancelled.length > 0
      ? Math.round((periodSummary.deliveredOrders / nonCancelled.length) * 100)
      : 0;

    // 8. Previous period comparison
    const prevOrders: Row[] = [];
    for (const o of allOrdersRows) {
      try {
        const created = new Date(String(o.createdAt));
        if (created >= prevSince && created < since) prevOrders.push(o);
      } catch { /* skip */ }
    }
    const prevTotalRevenue = prevOrders.reduce((s, o) => s + toNum(o.total), 0);
    const prevTotalOrders = prevOrders.length;
    const revenueChange = prevTotalRevenue > 0
      ? Math.round(((periodSummary.totalRevenue - prevTotalRevenue) / prevTotalRevenue) * 100)
      : 0;
    const ordersChange = prevTotalOrders > 0
      ? Math.round(((periodSummary.totalOrders - prevTotalOrders) / prevTotalOrders) * 100)
      : 0;

    return NextResponse.json({
      periodSummary,
      comparison: { revenueChange, ordersChange },
      monthlyData,
      dailyData,
      serviceDistribution,
      statusDistribution,
      topCustomers,
      heatmap,
    });
  } catch (e) {
    console.error('[admin/analytics]', e);
    return NextResponse.json({ error: "حدث خطأ أثناء جلب التحليلات" }, { status: 500 });
  }
}
