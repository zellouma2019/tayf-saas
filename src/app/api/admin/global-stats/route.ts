import { NextResponse } from "next/server";
import { tursoQuery, toNum, safeJson } from "@/lib/turso-lite";

// Dynamic — no edge caching (Turso DB returns stale/empty results intermittently)
export const dynamic = 'force-dynamic';
// Vercel Hobby: max 10s default, extend to 30s for slow Turso queries
export const maxDuration = 30;

export async function GET() {
  const startTime = Date.now();

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayISO = today.toISOString();

    // === استعلامات مُحسّنة — 3 دفعات متوازية بدلاً من 4 متسلسلة ===

    // الدفعة 1: توزيع الحالات + إحصائيات عامة (بسيط — لا LEFT JOIN)
    const [statusRows, statsResult] = await Promise.all([
      tursoQuery(`SELECT status, COUNT(*) as count FROM "PrintOrder" GROUP BY status`),
      tursoQuery(`
        SELECT 
          COUNT(*) as totalOrders,
          COALESCE(SUM(total), 0) as totalRevenue,
          COUNT(CASE WHEN "createdAt" >= ? THEN 1 END) as todayOrders
        FROM "PrintOrder"
      `, [todayISO]),
    ]);

    // الدفعة 2: آخر الطلبات + بيانات المتاجر (متوازيان)
    const [recentOrdersRaw, shopsRaw] = await Promise.all([
      tursoQuery(`
        SELECT 
          o.id, o.reference, o."serviceType", o."serviceName",
          o.status, o.total, o.customer, o."createdAt",
          o."shopId", s.name as shopName, s.slug as shopSlug
        FROM "PrintOrder" o
        LEFT JOIN "Shop" s ON o."shopId" = s.id
        ORDER BY o."createdAt" DESC LIMIT 20
      `),
      tursoQuery(`
        SELECT 
          s.id, s.name, s.slug, s."ownerName", s."ownerPhone", s.phone,
          s."isActive", s."trialDays", s."trialStartsAt", s.plan, s."adminPin",
          s.country, s.language
        FROM "Shop" s
        ORDER BY s."createdAt" DESC
      `),
    ]);

    const elapsed = Date.now() - startTime;
    console.log(`[global-stats] loaded in ${elapsed}ms — statusRows:${statusRows.length}, orders:${recentOrdersRaw.length}, shops:${shopsRaw.length}`);

    // تجهيز البيانات — statusCounts first (needed by fallbacks)
    const statusCounts: Record<string, number> = {};
    for (const s of statusRows) {
      statusCounts[String(s.status)] = toNum(s.count);
    }

    const statsRow = statsResult[0] || {};
    let totalOrders = toNum(statsRow.totalOrders);
    let totalRevenue = toNum(statsRow.totalRevenue);
    let todayOrders = toNum(statsRow.todayOrders);

    // Fallback 1: إذا كان totalOrders أرجع 0
    if (totalOrders === 0 && (statusRows.length > 0 || recentOrdersRaw.length > 0)) {
      const fromStatus = Object.values(statusCounts).reduce((s, v) => s + v, 0);
      if (fromStatus > 0) totalOrders = fromStatus;
      else if (recentOrdersRaw.length > 0) totalOrders = recentOrdersRaw.length;
    }

    // Fallback 2: إذا كان totalRevenue أرجع 0 (مشكلة CAST/aggregate في Turso)
    if (totalRevenue === 0 && recentOrdersRaw.length > 0) {
      const fromOrders = recentOrdersRaw.reduce((sum, o) => sum + toNum(o.total), 0);
      if (fromOrders > 0) totalRevenue = Math.round(fromOrders);
    }

    // Fallback 2b: لو كلاهما صفر → revenue يبقى 0 (لا بيانات كافية)

    // Fallback 3: إذا كان todayOrders أرجع 0 (مشكلة منطقة زمنية)
    if (todayOrders === 0 && recentOrdersRaw.length > 0) {
      const todayOrdersList = recentOrdersRaw.filter(o => {
        const created = String(o.createdAt || "");
        return created >= todayISO;
      });
      todayOrders = todayOrdersList.length;
    }

    // تجهيز shopStats: دمج بيانات المتاجر مع إحصائيات الطلبات (من recentOrders)
    const shopOrderMap = new Map<string, { orders: number; revenue: number; today: number }>();
    for (const o of recentOrdersRaw) {
      const sid = String(o.shopId || "");
      if (!sid) continue;
      const existing = shopOrderMap.get(sid) || { orders: 0, revenue: 0, today: 0 };
      existing.orders += 1;
      existing.revenue += toNum(o.total);
      const created = String(o.createdAt || "");
      if (created >= todayISO) existing.today += 1;
      shopOrderMap.set(sid, existing);
    }

    const shopStats = shopsRaw.length > 0
      ? shopsRaw.map((s) => {
          const id = String(s.id);
          const orderInfo = shopOrderMap.get(id) || { orders: 0, revenue: 0, today: 0 };
          return {
            id,
            name: String(s.name),
            slug: String(s.slug),
            ownerName: s.ownerName ? String(s.ownerName) : null,
            ownerPhone: s.ownerPhone ? String(s.ownerPhone) : null,
            phone: s.phone ? String(s.phone) : null,
            isActive: Boolean(s.isActive),
            trialDays: s.trialDays != null ? toNum(s.trialDays) : null,
            trialStartsAt: s.trialStartsAt ? String(s.trialStartsAt) : null,
            plan: String(s.plan || "free"),
            adminPin: String(s.adminPin),
            country: String(s.country || "DZ"),
            language: String(s.language || "ar"),
            orders: orderInfo.orders,
            revenue: Math.round(orderInfo.revenue),
            todayOrders: orderInfo.today,
            recentOrders: [] as never[],
          };
        })
      : buildShopStatsFromOrders(recentOrdersRaw);

    const recentOrders = recentOrdersRaw.map((o) => {
      const order = o as Record<string, unknown>;
      const c = safeJson(String(order.customer || ""), { name: "—", phone: "" });
      return {
        id: String(order.id),
        reference: String(order.reference),
        serviceType: String(order.serviceType),
        serviceName: String(order.serviceName),
        status: String(order.status),
        total: toNum(order.total),
        customer: { name: String(c.name || "—"), phone: String(c.phone || "") },
        createdAt: String(order.createdAt),
        shopName: order.shopName ? String(order.shopName) : "—",
        shopSlug: order.shopSlug ? String(order.shopSlug) : "",
        shopId: order.shopId ? String(order.shopId) : "",
      };
    });

    return NextResponse.json({
      totalOrders,
      totalRevenue,
      todayOrders,
      shopCount: shopStats.length,
      activeShopCount: shopStats.filter((s) => Boolean(s.isActive)).length,
      statusCounts,
      shopStats,
      recentOrders,
    });
  } catch (e) {
    const elapsed = Date.now() - startTime;
    console.error(`[global-stats] error after ${elapsed}ms:`, e);
    return NextResponse.json(
      { error: true, message: "DB query failed", totalOrders: 0, totalRevenue: 0, todayOrders: 0, shopCount: 0, activeShopCount: 0, statusCounts: {}, shopStats: [], recentOrders: [] },
      { status: 500 }
    );
  }
}

/**
 * Fallback: بناء قائمة المتاجر من بيانات الطلبات عندما يفشل استعلام Shop
 */
function buildShopStatsFromOrders(orders: Record<string, unknown>[]) {
  const shopMap = new Map<string, {
    id: string; name: string; slug: string; orders: number; revenue: number;
    shopId: string; isActive: boolean;
  }>();

  for (const o of orders) {
    const shopId = String(o.shopId || "");
    const shopName = o.shopName ? String(o.shopName) : "—";
    const shopSlug = o.shopSlug ? String(o.shopSlug) : "";
    if (!shopId) continue;

    const existing = shopMap.get(shopId);
    if (existing) {
      existing.orders += 1;
      existing.revenue += toNum(o.total);
    } else {
      shopMap.set(shopId, {
        id: shopId,
        name: shopName,
        slug: shopSlug,
        orders: 1,
        revenue: toNum(o.total),
        isActive: true,
      });
    }
  }

  return Array.from(shopMap.values()).map(s => ({
    id: s.id,
    name: s.name,
    slug: s.slug,
    ownerName: null,
    ownerPhone: null,
    phone: null,
    isActive: s.isActive,
    trialDays: null,
    trialStartsAt: null,
    plan: "free" as string,
    adminPin: "" as string,
    country: "DZ" as string,
    language: "ar" as string,
    orders: s.orders,
    revenue: Math.round(s.revenue),
    todayOrders: 0,
    recentOrders: [] as never[],
  }));
}
