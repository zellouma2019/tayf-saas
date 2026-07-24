import { NextRequest, NextResponse } from "next/server";
import { db, ensureDb } from "@/lib/db";
import { withRateLimit } from "@/lib/rate-limit";

export const maxDuration = 15;

export async function GET(req: NextRequest) {
  const rl = withRateLimit(req, "global-stats");
  if (!rl.ok) return rl.response;

  try {
    // التأكد من جاهزية قاعدة البيانات (بدون ميجريشن - غير مطلوب هنا)
    await ensureDb();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const safeJson = (str: string | null, fallback: Record<string, unknown> = {}) => {
      try { return str ? JSON.parse(str) : fallback; } catch { return fallback; }
    };

    // تنفيذ الاستعلامات بالتوازي لتسريع الاستجابة
    const [totalOrders, totalRev, todayOrders, statusDist, shops, recentOrdersRaw] =
      await Promise.all([
        db.printOrder.count().catch(() => 0),
        db.printOrder.aggregate({ _sum: { total: true } }).catch(() => ({ _sum: { total: 0 } })),
        db.printOrder.count({ where: { createdAt: { gte: today } } }).catch(() => 0),
        db.printOrder.groupBy({ by: ["status"], _count: true }).catch(() => []),
        db.shop.findMany({
          orderBy: { createdAt: "desc" },
          select: { id: true, name: true, slug: true, ownerName: true, ownerPhone: true, phone: true, isActive: true, trialDays: true, trialStartsAt: true, plan: true, adminPin: true, country: true, language: true },
        }).catch(() => []),
        db.printOrder.findMany({
          orderBy: { createdAt: "desc" }, take: 20,
          select: { id: true, reference: true, serviceType: true, serviceName: true, status: true, total: true, customer: true, shopId: true, shop: { select: { name: true, slug: true } } },
        }).catch(() => []),
      ]);

    const statusCounts: Record<string, number> = {};
    for (const s of statusDist) statusCounts[s.status] = s._count;

    const recentOrders = recentOrdersRaw.map((o) => {
      const c = safeJson(o.customer, { name: "—", phone: "" });
      return {
        id: o.id, reference: o.reference, serviceType: o.serviceType, serviceName: o.serviceName,
        status: o.status, total: Number(o.total) || 0,
        customer: { name: String(c.name || "—"), phone: String(c.phone || "") },
        createdAt: o.createdAt.toISOString(), shopName: o.shop?.name || "—",
        shopSlug: o.shop?.slug || "", shopId: o.shopId || "",
      };
    });

    return NextResponse.json({
      totalOrders: Number(totalOrders) || 0,
      totalRevenue: Number(totalRev._sum?.total) || 0,
      todayOrders: Number(todayOrders) || 0,
      shopCount: shops.length,
      activeShopCount: shops.filter((s) => s.isActive).length,
      statusCounts,
      shopStats: shops.map((s) => ({
        id: s.id, name: s.name, slug: s.slug, ownerName: s.ownerName, ownerPhone: s.ownerPhone,
        phone: s.phone, isActive: s.isActive, trialDays: s.trialDays,
        trialStartsAt: s.trialStartsAt?.toISOString() || null, plan: s.plan || "free",
        adminPin: s.adminPin, country: s.country, language: s.language,
        orders: 0, revenue: 0, todayOrders: 0,
      })),
      recentOrders,
    });
  } catch (e) {
    console.error("[admin/global-stats]", e);
    return NextResponse.json({ error: "حدث خطأ", totalOrders: 0, totalRevenue: 0, todayOrders: 0, shopCount: 0, activeShopCount: 0, statusCounts: {}, shopStats: [], recentOrders: [] }, { status: 500 });
  }
}
