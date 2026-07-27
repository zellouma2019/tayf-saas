import { NextRequest, NextResponse } from "next/server";
import { tursoQuery, tursoExecute, toNum, safeJson } from "@/lib/turso-lite";
import { requireAdmin } from "@/lib/admin-auth";

/// إحصائيات يومية عبر turso-lite (أسرع 10x من Prisma على Vercel)
export async function GET(request: NextRequest) {
  const { authorized, error: authError } = await requireAdmin(request);
  if (!authorized) return authError;

  const shopId = request.nextUrl.searchParams.get("shopId");
  if (!shopId) {
    return NextResponse.json({ error: "shopId مطلوب" }, { status: 400 });
  }

  try {
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);

    // آخر 7 أيام
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);
    const sevenDaysISO = sevenDaysAgo.toISOString();

    // جلب الطلبات اليومية من آخر 7 أيام
    const orders = await tursoQuery<{ createdAt: string; total: number }>(
      `SELECT "createdAt", total FROM "PrintOrder"
       WHERE ("shopId" = ? OR "shopId" IS NULL)
       AND "createdAt" >= ?
       AND status != 'cancelled'
       ORDER BY "createdAt" DESC`,
      [shopId, sevenDaysISO]
    );

    // تجميع البيانات باليوم
    const dailyMap: Record<string, { orders: number; revenue: number }> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      dailyMap[key] = { orders: 0, revenue: 0 };
    }

    for (const o of orders) {
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
    let weekOrders = 0;
    let weekRevenue = 0;
    for (const day of days) {
      weekOrders += dailyMap[day].orders;
      weekRevenue += dailyMap[day].revenue;
    }

    return NextResponse.json({
      daily,
      todayOrders: todayData.orders,
      todayRevenue: todayData.revenue,
      weekOrders,
      weekRevenue,
    });
  } catch (e) {
    console.error('[admin/daily-stats]', e);
    return NextResponse.json({ error: "حدث خطأ أثناء جلب الإحصائيات اليومية" }, { status: 500 });
  }
}
