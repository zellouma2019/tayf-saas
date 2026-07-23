import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

export const maxDuration = 30;

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

    const now = new Date();
    const baseWhere: Record<string, unknown> = {};
    if (shopId) baseWhere.shopId = shopId;

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
    const fourWeeksAgo = new Date();
    fourWeeksAgo.setDate(fourteenDaysAgo.getDate() - 28);
    const prevSince = new Date(since);
    prevSince.setDate(prevSince.getDate() - parseInt(period, 10));

    // 4 استعلامات متوازية بدلاً من 8 تسلسلية
    const [monthlyOrders, dailyOrders, recentForHeatmap, allOrders] = await Promise.all([
      db.printOrder.findMany({
        where: { ...baseWhere, createdAt: { gte: sixMonthsAgo } },
        select: { total: true, createdAt: true, status: true },
      }),
      db.printOrder.findMany({
        where: { ...baseWhere, createdAt: { gte: fourteenDaysAgo } },
        select: { total: true, createdAt: true },
      }),
      db.printOrder.findMany({
        where: { ...baseWhere, createdAt: { gte: fourWeeksAgo } },
        select: { createdAt: true },
      }),
      db.printOrder.findMany({
        where: baseWhere,
        select: { customer: true, total: true, createdAt: true, status: true, pages: true, copies: true, serviceType: true },
      }),
    ]);

    // 1. Monthly data (in-memory from allOrders)
    const monthlyMap: Record<string, { revenue: number; count: number; delivered: number }> = {};
    monthlyOrders.forEach((o) => {
      const key = `${o.createdAt.getFullYear()}-${String(o.createdAt.getMonth() + 1).padStart(2, "0")}`;
      if (!monthlyMap[key]) monthlyMap[key] = { revenue: 0, count: 0, delivered: 0 };
      monthlyMap[key].revenue += o.total;
      monthlyMap[key].count += 1;
      if (o.status === "delivered") monthlyMap[key].delivered += 1;
    });
    const monthlyData = Object.entries(monthlyMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([month, data]) => ({ month, ...data }));

    // 2. Daily data
    const dailyMap: Record<string, number> = {};
    dailyOrders.forEach((o) => {
      const key = o.createdAt.toISOString().split("T")[0];
      dailyMap[key] = (dailyMap[key] || 0) + o.total;
    });
    const dailyData = Object.entries(dailyMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, revenue]) => ({ date, revenue }));

    // 3. Service distribution (in-memory)
    const serviceMap: Record<string, { count: number; revenue: number }> = {};
    allOrders.forEach((o) => {
      if (!serviceMap[o.serviceType]) serviceMap[o.serviceType] = { count: 0, revenue: 0 };
      serviceMap[o.serviceType].count += 1;
      serviceMap[o.serviceType].revenue += o.total;
    });
    const serviceDistribution = Object.entries(serviceMap).map(([serviceType, d]) => ({
      serviceType, count: d.count, revenue: d.revenue,
    }));

    // 4. Status distribution (in-memory)
    const statusMap: Record<string, number> = {};
    allOrders.forEach((o) => {
      statusMap[o.status] = (statusMap[o.status] || 0) + 1;
    });
    const statusDistribution = Object.entries(statusMap).map(([status, count]) => ({
      status, count,
    }));

    // 5. Top customers (in-memory)
    const customerMap: Record<string, { name: string; phone: string; orders: number; total: number; lastOrder: Date }> = {};
    allOrders.forEach((o) => {
      try {
        const c = JSON.parse(o.customer);
        const phone = c.phone || "unknown";
        if (!customerMap[phone]) {
          customerMap[phone] = { name: c.name || "—", phone, orders: 0, total: 0, lastOrder: o.createdAt };
        }
        customerMap[phone].orders += 1;
        customerMap[phone].total += o.total;
        if (o.createdAt > customerMap[phone].lastOrder) customerMap[phone].lastOrder = o.createdAt;
      } catch { /* skip bad data */ }
    });
    const topCustomers = Object.values(customerMap)
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);

    // 6. Weekly heatmap (in-memory)
    const heatmap: number[][] = Array.from({ length: 4 }, () => Array(7).fill(0));
    recentForHeatmap.forEach((o) => {
      const diff = Math.floor((now.getTime() - o.createdAt.getTime()) / (1000 * 60 * 60 * 24));
      if (diff < 28) {
        const week = Math.floor(diff / 7);
        const day = o.createdAt.getDay();
        heatmap[week][day] += 1;
      }
    });

    // 7. Period summary (in-memory from allOrders)
    const periodOrders = allOrders.filter((o) => o.createdAt >= since);
    const periodSummary = {
      totalRevenue: periodOrders.reduce((s, o) => s + o.total, 0),
      totalOrders: periodOrders.length,
      deliveredOrders: periodOrders.filter((o) => o.status === "delivered").length,
      cancelledOrders: periodOrders.filter((o) => o.status === "cancelled").length,
      avgOrderValue:
        periodOrders.length > 0
          ? Math.round(periodOrders.reduce((s, o) => s + o.total, 0) / periodOrders.length)
          : 0,
      totalPages: periodOrders.reduce((s, o) => s + (o.pages || 0), 0),
      totalCopies: periodOrders.reduce((s, o) => s + (o.copies || 0), 0),
      deliveryRate:
        periodOrders.length > 0
          ? Math.round(
              (periodOrders.filter((o) => o.status === "delivered").length /
                periodOrders.filter((o) => o.status !== "cancelled").length) *
                100
            )
          : 0,
    };

    // 8. Previous period comparison (in-memory)
    const prevOrders = allOrders.filter((o) => o.createdAt >= prevSince && o.createdAt < since);
    const prevSummary = {
      totalRevenue: prevOrders.reduce((s, o) => s + o.total, 0),
      totalOrders: prevOrders.length,
    };
    const revenueChange =
      prevSummary.totalRevenue > 0
        ? Math.round(((periodSummary.totalRevenue - prevSummary.totalRevenue) / prevSummary.totalRevenue) * 100)
        : 0;
    const ordersChange =
      prevSummary.totalOrders > 0
        ? Math.round(((periodSummary.totalOrders - prevSummary.totalOrders) / prevSummary.totalOrders) * 100)
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