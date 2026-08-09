import { NextResponse } from "next/server";
import { tursoQuery, toNum } from "@/lib/turso-lite";

/// إحصائيات يومية شاملة لجميع المتاجر
export async function GET() {
  try {
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);

    // آخر 7 أيام
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);
    const sevenDaysISO = sevenDaysAgo.toISOString();

    // آخر 30 يوم
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
    thirtyDaysAgo.setHours(0, 0, 0, 0);
    const thirtyDaysISO = thirtyDaysAgo.toISOString();

    const [weekOrders, monthOrders, monthShops, statusDist] = await Promise.all([
      tursoQuery<{ createdAt: string; total: number }>(
        `SELECT "createdAt", total, status FROM "PrintOrder"
         WHERE "createdAt" >= ?
         ORDER BY "createdAt" DESC`,
        [sevenDaysISO]
      ),
      tursoQuery<{ createdAt: string; total: number }>(
        `SELECT "createdAt", total FROM "PrintOrder"
         WHERE "createdAt" >= ? AND status != 'cancelled'
         ORDER BY "createdAt" DESC`,
        [thirtyDaysISO]
      ),
      tursoQuery<{ createdAt: string; id: string }>(
        `SELECT "createdAt", id FROM "Shop"
         ORDER BY "createdAt" DESC`
      ),
      tursoQuery<{ status: string; count: number }>(
        `SELECT status, COUNT(*) as count FROM "PrintOrder" GROUP BY status`
      ),
    ]);

    // Daily map for 7 days
    const dailyMap: Record<string, { orders: number; revenue: number }> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      dailyMap[key] = { orders: 0, revenue: 0 };
    }

    for (const o of weekOrders) {
      const dateStr = String(o.createdAt).slice(0, 10);
      if (dailyMap[dateStr]) {
        dailyMap[dateStr].orders += 1;
        dailyMap[dateStr].revenue += toNum(o.total);
      }
    }

    const days = Object.keys(dailyMap).sort();
    const daily = days.map((date) => ({
      date,
      orders: dailyMap[date].orders,
      revenue: dailyMap[date].revenue,
    }));

    const todayData = dailyMap[todayStr] || { orders: 0, revenue: 0 };
    let weekOrdersCount = 0;
    let weekRevenue = 0;
    for (const day of days) {
      weekOrdersCount += dailyMap[day].orders;
      weekRevenue += dailyMap[day].revenue;
    }

    // Monthly totals
    const monthTotal = monthOrders.reduce((s, o) => s + toNum(o.total), 0);
    const monthOrdersCount = monthOrders.length;

    // Shop count and new shops this month
    const totalShops = monthShops.length;
    const newShopsThisMonth = monthShops.filter(s => String(s.createdAt) >= thirtyDaysISO).length;

    // Status distribution
    const statusCounts: Record<string, number> = {};
    for (const s of statusDist) {
      statusCounts[String(s.status)] = toNum(s.count);
    }

    return NextResponse.json({
      daily,
      todayOrders: todayData.orders,
      todayRevenue: todayData.revenue,
      weekOrders: weekOrdersCount,
      weekRevenue,
      monthOrders: monthOrdersCount,
      monthRevenue: monthTotal,
      totalShops,
      newShopsThisMonth,
      statusCounts,
    });
  } catch (e) {
    console.error('[admin/global-daily-stats]', e);
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}
