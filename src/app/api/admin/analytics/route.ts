import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET(request: Request) {
  const { authorized, error: authError } = await requireAdmin(request);
  if (!authorized) return authError;

  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "30"; // days
    const shopId = searchParams.get("shopId");

    const since = new Date();
    since.setDate(since.getDate() - parseInt(period, 10));
    since.setHours(0, 0, 0, 0);

    const now = new Date();

    const baseWhere: Record<string, unknown> = {};
    if (shopId) baseWhere.shopId = shopId;

    // 1. Monthly revenue & orders (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyOrders = await db.printOrder.findMany({
      where: { ...baseWhere, createdAt: { gte: sixMonthsAgo } },
      select: { total: true, createdAt: true, status: true },
    });

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

    // 2. Daily revenue (last 14 days)
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    const dailyOrders = await db.printOrder.findMany({
      where: { ...baseWhere, createdAt: { gte: fourteenDaysAgo } },
      select: { total: true, createdAt: true },
    });

    const dailyMap: Record<string, number> = {};
    dailyOrders.forEach((o) => {
      const key = o.createdAt.toISOString().split("T")[0];
      dailyMap[key] = (dailyMap[key] || 0) + o.total;
    });
    const dailyData = Object.entries(dailyMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, revenue]) => ({ date, revenue }));

    // 3. Service distribution
    const serviceStats = await db.printOrder.groupBy({
      by: ["serviceType"],
      _count: true,
      _sum: { total: true },
      where: baseWhere,
    });
    const serviceDistribution = serviceStats.map((s) => ({
      serviceType: s.serviceType,
      count: s._count,
      revenue: s._sum.total || 0,
    }));

    // 4. Status distribution
    const statusStats = await db.printOrder.groupBy({
      by: ["status"],
      _count: true,
      where: baseWhere,
    });
    const statusDistribution = statusStats.map((s) => ({
      status: s.status,
      count: s._count,
    }));

    // 5. Top customers
    const allOrders = await db.printOrder.findMany({
      where: baseWhere,
      select: { customer: true, total: true, createdAt: true },
    });
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
      } catch {
        /* skip bad data */
      }
    });
    const topCustomers = Object.values(customerMap)
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);

    // 6. Weekly heatmap (4 weeks × 7 days)
    const fourWeeksAgo = new Date();
    fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);
    const recentForHeatmap = await db.printOrder.findMany({
      where: { ...baseWhere, createdAt: { gte: fourWeeksAgo } },
      select: { createdAt: true },
    });
    const heatmap: number[][] = Array.from({ length: 4 }, () => Array(7).fill(0));
    recentForHeatmap.forEach((o) => {
      const diff = Math.floor((now.getTime() - o.createdAt.getTime()) / (1000 * 60 * 60 * 24));
      if (diff < 28) {
        const week = Math.floor(diff / 7);
        const day = o.createdAt.getDay();
        heatmap[week][day] += 1;
      }
    });

    // 7. Period summary
    const periodOrders = await db.printOrder.findMany({
      where: { ...baseWhere, createdAt: { gte: since } },
      select: { total: true, status: true, pages: true, copies: true, createdAt: true },
    });
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

    // 8. Previous period for comparison
    const prevSince = new Date(since);
    prevSince.setDate(prevSince.getDate() - parseInt(period, 10));
    const prevOrders = await db.printOrder.findMany({
      where: { ...baseWhere, createdAt: { gte: prevSince, lt: since } },
      select: { total: true, status: true },
    });
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