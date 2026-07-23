import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { withRateLimit } from "@/lib/rate-limit";

export const maxDuration = 30;

export async function GET(req: NextRequest) {
  const rl = withRateLimit(req, "global-stats");
  if (!rl.ok) return rl.response;

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // تسلسلي لتجنب ضغط الاتصال على Turso
    const totalOrders = await db.printOrder.count();
    const totalRev = await db.printOrder.aggregate({ _sum: { total: true } });
    const todayOrders = await db.printOrder.count({ where: { createdAt: { gte: today } } });

    const statusDist = await db.printOrder.groupBy({ by: ["status"], _count: true });
    const statusCounts: Record<string, number> = {};
    for (const s of statusDist) statusCounts[s.status] = s._count;

    const shops = await db.shop.findMany({
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, slug: true, "ownerName": true, "ownerPhone": true, phone: true, "isActive": true, "trialDays": true, "trialStartsAt": true, plan: true, "adminPin": true, country: true, language: true },
    });

    const recentOrdersRaw = await db.printOrder.findMany({
      orderBy: { createdAt: "desc" }, take: 20,
      select: { id: true, reference: true, "serviceType": true, "serviceName": true, status: true, total: true, customer: true, createdAt: true, shop: { select: { name: true } } },
    });

    const recentOrders = recentOrdersRaw.map((o) => ({
      id: o.id, reference: o.reference, serviceType: o.serviceType, serviceName: o.serviceName,
      status: o.status, total: o.total, customer: JSON.parse(o.customer),
      createdAt: o.createdAt.toISOString(), shopName: o.shop?.name || "—",
    }));

    return NextResponse.json({
      totalOrders, totalRevenue: totalRev._sum.total || 0, todayOrders,
      shopCount: shops.length,
      activeShopCount: shops.filter((s) => s.isActive).length,
      statusCounts,
      shopStats: shops.map((s) => ({ id: s.id, name: s.name, slug: s.slug, ownerName: s.ownerName, ownerPhone: s.ownerPhone, phone: s.phone, isActive: s.isActive, trialDays: s.trialDays, trialStartsAt: s.trialStartsAt?.toISOString() || null, plan: s.plan || "free", adminPin: s.adminPin, country: s.country, language: s.language, orders: 0, revenue: 0, todayOrders: 0 })),
      recentOrders,
    });
  } catch (e) {
    console.error("[admin/global-stats]", e);
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}
