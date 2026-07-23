import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

export const maxDuration = 30;

export async function GET(request: NextRequest) {
  const { authorized, error: authError } = await requireAdmin(request);
  if (!authorized) return authError;

  try {
    const shopId = request.nextUrl.searchParams.get("shopId");
    const baseWhere: Record<string, unknown> = {};
    if (shopId) baseWhere.shopId = shopId;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    // 7 استعلامات متوازية
    const [
      totalOrders,
      totalRevenue,
      totalExpenses,
      todayOrders,
      statusCounts,
      serviceCounts,
      recentOrders,
    ] = await Promise.all([
      db.printOrder.count({ where: baseWhere }),
      db.printOrder.aggregate({ _sum: { total: true }, where: baseWhere }),
      db.expense.aggregate({ _sum: { amount: true }, where: baseWhere }),
      db.printOrder.count({ where: { ...baseWhere, createdAt: { gte: todayStart } } }),
      db.printOrder.groupBy({ by: ["status"], _count: true, where: baseWhere }),
      db.printOrder.groupBy({ by: ["serviceType"], _count: true, _sum: { total: true }, where: baseWhere }),
      db.printOrder.findMany({
        where: baseWhere,
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true, reference: true, serviceType: true, serviceName: true,
          status: true, total: true, pages: true, copies: true,
          createdAt: true, fileName: true, fileType: true,
          options: true, customer: true, delivery: true, pricing: true,
          adminNotes: true, tags: true,
        },
      }),
    ]);

    const expensesSum = totalExpenses._sum.amount || 0;
    const revenueSum = totalRevenue._sum.total || 0;

    const statusMap: Record<string, number> = {};
    statusCounts.forEach((s) => (statusMap[s.status] = s._count));

    return NextResponse.json({
      totalOrders,
      totalRevenue: revenueSum,
      totalExpenses: expensesSum,
      profit: revenueSum - expensesSum,
      todayOrders,
      statusCounts: statusMap,
      serviceCounts: serviceCounts.map((s) => ({
        serviceType: s.serviceType,
        count: s._count,
        revenue: s._sum.total || 0,
      })),
      recentOrders: recentOrders.map((o) => ({
        ...o,
        options: JSON.parse(o.options),
        customer: JSON.parse(o.customer),
        delivery: JSON.parse(o.delivery),
        pricing: JSON.parse(o.pricing),
      })),
    });
  } catch (e) {
    console.error('[admin/stats]', e);
    return NextResponse.json({ error: "حدث خطأ أثناء جلب الإحصائيات" }, { status: 500 });
  }
}
