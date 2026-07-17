import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { withRateLimit } from "@/lib/rate-limit";

/// إحصائيات شاملة لصاحب المشروع (جميع المتاجر) — محسّنة
export async function GET(req: NextRequest) {
  const rl = withRateLimit(req, "global-stats");
  if (!rl.ok) return rl.response;

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // جلب كل البيانات بالتوازي (بدون N+1)
    const [totalOrders, totalRevenueResult, todayOrdersResult, shops, allStatuses] = await Promise.all([
      db.printOrder.count(),
      db.printOrder.aggregate({ _sum: { total: true } }),
      db.printOrder.count({ where: { createdAt: { gte: today } } }),
      db.shop.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          _count: { select: { orders: true } },
        },
      }),
      db.printOrder.groupBy({ by: ["status"], _count: true }),
    ]);

    const totalRevenue = totalRevenueResult._sum.total || 0;

    // توزيع الحالات
    const statusCounts: Record<string, number> = {};
    for (const s of allStatuses) {
      statusCounts[s.status] = s._count;
    }

    // آخر 30 طلب
    const recentOrders = await db.printOrder.findMany({
      orderBy: { createdAt: "desc" },
      take: 30,
      include: { shop: { select: { name: true, slug: true } } },
    });

    // إحصائيات كل متجر — استعلام واحد مجمّع بدل N+1
    const shopIds = shops.map(s => s.id);

    // إجمالي ربح كل متجر
    const revenueByShop = shopIds.length > 0
      ? await db.printOrder.groupBy({
          by: ["shopId"],
          _sum: { total: true },
          where: { shopId: { in: shopIds } },
        })
      : [];

    // طلبات اليوم لكل متجر
    const todayByShop = shopIds.length > 0
      ? await db.printOrder.groupBy({
          by: ["shopId"],
          _count: true,
          where: { shopId: { in: shopIds }, createdAt: { gte: today } },
        })
      : [];

    const revenueMap = new Map(revenueByShop.map(r => [r.shopId, r._sum.total || 0]));
    const todayMap = new Map(todayByShop.map(r => [r.shopId, r._count]));

    const shopStats = shops.map(shop => ({
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
      orders: shop._count.orders,
      revenue: revenueMap.get(shop.id) || 0,
      todayOrders: todayMap.get(shop.id) || 0,
      recentOrders: [] as unknown[],
    }));

    return NextResponse.json({
      totalOrders,
      totalRevenue,
      todayOrders: todayOrdersResult,
      shopCount: shops.length,
      activeShopCount: shops.filter((s) => s.isActive).length,
      statusCounts,
      shopStats,
      recentOrders: recentOrders.map((o) => ({
        ...o,
        options: JSON.parse(o.options),
        customer: JSON.parse(o.customer),
        delivery: JSON.parse(o.delivery),
        pricing: JSON.parse(o.pricing),
        smartAnalysis: o.smartAnalysis ? JSON.parse(o.smartAnalysis) : null,
        shopName: o.shop?.name || "—",
        shopSlug: o.shop?.slug || "",
      })),
    });
  } catch (e) {
    console.error('[admin/global-stats]', e);
    return NextResponse.json({ error: "حدث خطأ أثناء جلب الإحصائيات" }, { status: 500 });
  }
}