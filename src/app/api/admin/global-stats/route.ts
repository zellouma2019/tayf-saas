import { NextRequest, NextResponse } from "next/server";
import { db, ensureDb } from "@/lib/db";
import { withRateLimit } from "@/lib/rate-limit";

export const maxDuration = 30;

export async function GET(req: NextRequest) {
  const rl = withRateLimit(req, "global-stats");
  if (!rl.ok) return rl.response;

  try {
    await ensureDb({ runMigrations: true });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // تشغيل الاستعلامات المستقلة بالتوازي لتسريع الاستجابة
    const [totalOrders, totalRev, todayOrders, statusDist, shops, recentOrdersRaw] =
      await Promise.all([
        db.printOrder.count(),
        db.printOrder.aggregate({ _sum: { total: true } }),
        db.printOrder.count({ where: { createdAt: { gte: today } } }),
        db.printOrder.groupBy({ by: ["status"], _count: true }),
        db.shop.findMany({
          orderBy: { createdAt: "desc" },
          select: { id: true, name: true, slug: true, ownerName: true, ownerPhone: true, phone: true, isActive: true, trialDays: true, trialStartsAt: true, plan: true, adminPin: true, country: true, language: true },
        }),
        db.printOrder.findMany({
          orderBy: { createdAt: "desc" }, take: 20,
          select: { id: true, reference: true, serviceType: true, serviceName: true, status: true, total: true, customer: true, shopId: true, shop: { select: { name: true, slug: true } } },
        }),
      ]);

    const statusCounts: Record<string, number> = {};
    for (const s of statusDist) statusCounts[s.status] = s._count;

    const recentOrders = recentOrdersRaw.map((o) => {
      let customer: { name: string; phone: string } = { name: "—", phone: "" };
      try {
        const parsed = o.customer ? JSON.parse(o.customer) : null;
        if (parsed && typeof parsed === "object") {
          customer = { name: parsed.name || "—", phone: parsed.phone || "" };
        }
      } catch { /* استخدم القيم الافتراضية */ }
      return {
        id: o.id, reference: o.reference, serviceType: o.serviceType, serviceName: o.serviceName,
        status: o.status, total: o.total, customer,
        createdAt: o.createdAt.toISOString(), shopName: o.shop?.name || "—",
        shopSlug: o.shop?.slug || "", shopId: o.shopId || "",
      };
    });

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
