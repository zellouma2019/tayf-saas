import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayOrders = await db.printOrder.count({
      where: { createdAt: { gte: todayStart } },
    });

    const todayRevenue = await db.printOrder.aggregate({
      _sum: { total: true },
      where: { createdAt: { gte: todayStart } },
    });

    const statusCounts = await db.printOrder.groupBy({
      by: ["status"],
      _count: true,
    });

    const statusMap: Record<string, number> = {};
    statusCounts.forEach((s) => (statusMap[s.status] = s._count));

    // إحصائيات عامة حقيقية
    const totalDelivered = await db.printOrder.count({
      where: { status: "delivered" },
    });

    const uniqueCustomers = await db.printOrder.groupBy({
      by: ["customer"],
    });
    // حساب العملاء الفريدين من بيانات الهاتف
    const phoneSet = new Set<string>();
    uniqueCustomers.forEach((r) => {
      try {
        const c = JSON.parse(r.customer);
        if (c.phone) phoneSet.add(c.phone);
      } catch {}
    });

    // أيام التشغيل (من أول طلب)
    const firstOrder = await db.printOrder.findFirst({
      orderBy: { createdAt: "asc" },
      select: { createdAt: true },
    });
    const activeDays = firstOrder
      ? Math.max(1, Math.ceil((Date.now() - firstOrder.createdAt.getTime()) / (1000 * 60 * 60 * 24)))
      : 0;

    return NextResponse.json({
      pending: statusMap["pending"] || 0,
      printing: statusMap["printing"] || 0,
      ready: statusMap["ready"] || 0,
      todayOrders,
      todayRevenue: todayRevenue._sum.total || 0,
      totalDelivered,
      uniqueCustomers: phoneSet.size,
      activeDays,
    });
  } catch {
    return NextResponse.json(
      { pending: 0, printing: 0, ready: 0, todayOrders: 0, todayRevenue: 0, totalDelivered: 0, uniqueCustomers: 0, activeDays: 0 },
      { status: 200 }
    );
  }
}
