import { NextRequest, NextResponse } from "next/server";
import { db, ensureDb } from "@/lib/db";
import { withRateLimit } from "@/lib/rate-limit";

/// إحصائيات شاملة — محسّنة (3 استعلامات فقط بدل 8)
export async function GET(req: NextRequest) {
  const rl = withRateLimit(req, "global-stats");
  if (!rl.ok) return rl.response;

  try {
    await ensureDb();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // استعلام واحد فقط: إجمالي الطلبات + الإيرادات + طلبات اليوم
    const [counts, shops, statusGroups] = await Promise.all([
      db.printOrder.aggregate({
        _count: true,
        _sum: { total: true },
        where: { createdAt: { gte: today } },
      }),
      db.shop.findMany({
        orderBy: { createdAt: "desc" },
        include: { _count: { select: { orders: true } } },
      }),
      db.printOrder.groupBy({ by: ["status"], _count: true }),
    ]);

    // إجمالي الطلبات والإيرادات (استعلام منفصل لأنه يحتاج filter مختلف)
    const [allCounts] = await Promise.all([
      db.printOrder.aggregate({ _count: true, _sum: { total: true } }),
    ]);

    const totalOrders = allCounts._count;
    const totalRevenue = allCounts._sum.total || 0;
    const todayOrders = counts._count;

    // توزيع الحالات
    const statusCounts: Record<string, number> = {};
    for (const s of statusGroups) {
      statusCounts[s.status] = s._count;
    }

    // إحصائيات مبسطة لكل متجر (بدون استعلامات إضافية)
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
      revenue: 0,
      todayOrders: 0,
      recentOrders: [] as unknown[],
    }));

    return NextResponse.json({
      totalOrders,
      totalRevenue,
      todayOrders,
      shopCount: shops.length,
      activeShopCount: shops.filter((s) => s.isActive).length,
      statusCounts,
      shopStats,
      recentOrders: [],
    }, {
      headers: {
        "Cache-Control": "public, s-maxage=5, stale-while-revalidate=30",
      },
    });
  } catch (e) {
    console.error('[admin/global-stats]', e);
    return NextResponse.json({ error: "حدث خطأ أثناء جلب الإحصائيات" }, { status: 500 });
  }
}