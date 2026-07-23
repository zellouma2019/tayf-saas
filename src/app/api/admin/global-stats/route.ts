import { NextRequest, NextResponse } from "next/server";
import { db, ensureDb } from "@/lib/db";
import { withRateLimit } from "@/lib/rate-limit";

export const maxDuration = 30;

/// إحصائيات شاملة لصاحب المشروع (جميع المتاجر)
export async function GET(req: NextRequest) {
  const rl = withRateLimit(req, "global-stats");
  if (!rl.ok) return rl.response;

  try {
    await ensureDb();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 3 استعلامات متوازية بدلاً من N+1
    const [totalOrders, totalRevenueResult, todayOrdersResult, shops] = await Promise.all([
      db.printOrder.count(),
      db.printOrder.aggregate({ _sum: { total: true } }),
      db.printOrder.count({ where: { createdAt: { gte: today } } }),
      db.shop.findMany({
        orderBy: { createdAt: "desc" },
        select: {
          id: true, name: true, slug: true, ownerName: true, ownerPhone: true,
          phone: true, whatsapp: true, email: true, address: true, primaryColor: true,
          isActive: true, trialDays: true, trialStartsAt: true, plan: true,
          features: true, paymentInfo: true, ownerNotes: true, adminPin: true, country: true, language: true,
          _count: { select: { orders: true } },
        },
      }),
    ]);

    const totalRevenue = totalRevenueResult._sum.total || 0;

    // إحصائيات لكل متجر (استعلامات متوازية)
    const shopStats = await Promise.all(
      shops.map(async (shop) => {
        const [shopRevenue, shopToday, recentShopOrders] = await Promise.all([
          db.printOrder.aggregate({
            where: { shopId: shop.id },
            _sum: { total: true },
          }),
          db.printOrder.count({
            where: { shopId: shop.id, createdAt: { gte: today } },
          }),
          db.printOrder.findMany({
            where: { shopId: shop.id },
            orderBy: { createdAt: "desc" },
            take: 3,
            select: { id: true, reference: true, serviceName: true, status: true, total: true, customer: true, createdAt: true },
          }),
        ]);

        return {
          id: shop.id,
          name: shop.name,
          slug: shop.slug,
          ownerName: shop.ownerName,
          ownerPhone: shop.ownerPhone,
          phone: shop.phone,
          whatsapp: shop.whatsapp,
          email: shop.email,
          address: shop.address,
          primaryColor: shop.primaryColor,
          isActive: shop.isActive,
          trialDays: shop.trialDays,
          trialStartsAt: shop.trialStartsAt?.toISOString() || null,
          plan: shop.plan || "free",
          features: shop.features || null,
          paymentInfo: shop.paymentInfo || null,
          ownerNotes: shop.ownerNotes || null,
          adminPin: shop.adminPin,
          country: shop.country,
          language: shop.language,
          orders: shop._count.orders,
          revenue: shopRevenue._sum.total || 0,
          todayOrders: shopToday,
          recentOrders: recentShopOrders.map((o) => ({
            ...o,
            customer: JSON.parse(o.customer),
            createdAt: o.createdAt.toISOString(),
          })),
        };
      })
    );

    // توزيع الحالات
    const [statusDistribution, allRecentOrders] = await Promise.all([
      db.printOrder.groupBy({
        by: ["status"],
        _count: true,
      }),
      db.printOrder.findMany({
        orderBy: { createdAt: "desc" },
        take: 20,
        select: {
          id: true, reference: true, serviceType: true, serviceName: true,
          status: true, total: true, createdAt: true,
          customer: true,
          shop: { select: { name: true } },
        },
      }),
    ]);

    const statusCounts: Record<string, number> = {};
    for (const s of statusDistribution) {
      statusCounts[s.status] = s._count;
    }

    return NextResponse.json({
      totalOrders,
      totalRevenue,
      todayOrders: todayOrdersResult,
      shopCount: shops.length,
      activeShopCount: shops.filter((s) => s.isActive).length,
      statusCounts,
      shopStats,
      recentOrders: allRecentOrders.map((o) => ({
        id: o.id,
        reference: o.reference,
        serviceType: o.serviceType,
        serviceName: o.serviceName,
        status: o.status,
        total: o.total,
        customer: JSON.parse(o.customer),
        createdAt: o.createdAt.toISOString(),
        shopName: o.shop?.name || "—",
      })),
    });
  } catch (e) {
    console.error('[admin/global-stats]', e);
    return NextResponse.json({ error: "حدث خطأ أثناء جلب الإحصائيات" }, { status: 500 });
  }
}