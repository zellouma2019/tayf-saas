import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import { orderListWhere } from "@/lib/order-lookup";

export async function GET(request: NextRequest) {
  const { authorized, error: authError } = await requireAdmin(request);
  if (!authorized) return authError;

  const shopId = request.nextUrl.searchParams.get("shopId");
  if (!shopId) {
    return NextResponse.json({ error: "shopId مطلوب" }, { status: 400 });
  }

  try {
    // حساب بداية آخر 7 أيام
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const days: string[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      days.push(d.toISOString().slice(0, 10));
    }

    // جلب كل الطلبات من آخر 7 أيام لهذا المتجر
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const baseWhere = orderListWhere(shopId, {
      createdAt: { gte: sevenDaysAgo },
      status: { not: "cancelled" },
    });

    const orders = await db.printOrder.findMany({
      where: baseWhere,
      select: {
        createdAt: true,
        total: true,
      },
    });

    // تجميع البيانات باليوم (JS-based grouping)
    const dailyMap: Record<string, { orders: number; revenue: number }> = {};
    for (const day of days) {
      dailyMap[day] = { orders: 0, revenue: 0 };
    }

    for (const o of orders) {
      const dateStr = o.createdAt.toISOString().slice(0, 10);
      if (dailyMap[dateStr]) {
        dailyMap[dateStr].orders += 1;
        dailyMap[dateStr].revenue += o.total || 0;
      }
    }

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
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}