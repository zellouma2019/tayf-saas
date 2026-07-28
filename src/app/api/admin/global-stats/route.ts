import { NextResponse } from "next/server";
import { tursoQueries, tursoQuery, toNum, safeJson } from "@/lib/turso-lite";

// Vercel: Cache response at edge for 30 seconds, revalidate in background
export const revalidate = 30;

export async function GET() {
  const startTime = Date.now();

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayISO = today.toISOString();

    // === 3 استعلامات بسيطة إلى Turso مباشرة (HTTP mode, بدون Prisma) ===

    // الاستعلام 1: إجمالي الإحصائيات
    const statsResult = await tursoQuery(`
      SELECT 
        COUNT(*) as totalOrders,
        COALESCE(SUM(total), 0) as totalRevenue,
        COUNT(CASE WHEN "createdAt" >= ? THEN 1 END) as todayOrders
      FROM "PrintOrder"
    `, [todayISO]);

    // الاستعلام 2: توزيع الحالات + المتاجر (موازي)
    const [statusRows, shopsRaw] = await tursoQueries<Record<string, unknown>[]>([
      { sql: `SELECT status, COUNT(*) as count FROM "PrintOrder" GROUP BY status` },
      {
        sql: `
          SELECT 
            s.id, s.name, s.slug, s."ownerName", s."ownerPhone", s.phone,
            s."isActive", s."trialDays", s."trialStartsAt", s.plan, s."adminPin",
            s.country, s.language,
            COALESCE(o.cnt, 0) as orderCount,
            COALESCE(o.rev, 0) as shopRevenue,
            COALESCE(o.tod, 0) as todayCount
          FROM "Shop" s
          LEFT JOIN (
            SELECT "shopId", COUNT(*) as cnt, COALESCE(SUM(total), 0) as rev,
                   COUNT(CASE WHEN "createdAt" >= ? THEN 1 END) as tod
            FROM "PrintOrder" GROUP BY "shopId"
          ) o ON o."shopId" = s.id
          ORDER BY s."createdAt" DESC
        `,
        args: [todayISO],
      },
    ]);

    // الاستعلام 3: آخر الطلبات
    const recentOrdersRaw = await tursoQuery(`
      SELECT 
        o.id, o.reference, o."serviceType", o."serviceName",
        o.status, o.total, o.customer, o."createdAt",
        o."shopId", s.name as shopName, s.slug as shopSlug
      FROM "PrintOrder" o
      LEFT JOIN "Shop" s ON o."shopId" = s.id
      ORDER BY o."createdAt" DESC LIMIT 20
    `);

    const elapsed = Date.now() - startTime;
    console.log(`[global-stats] loaded in ${elapsed}ms`);

    // تجهيز البيانات
    const statsRow = statsResult[0] || {};
    let totalOrders = toNum(statsRow.totalOrders);
    const totalRevenue = toNum(statsRow.totalRevenue);
    let todayOrders = toNum(statsRow.todayOrders);

    // Fallback: إذا كان الاستعلام الأساسي أرجع 0، نحسب من statusCounts أو recentOrders
    if (totalOrders === 0 && (statusRows.length > 0 || recentOrdersRaw.length > 0)) {
      const fromStatus = Object.values(statusCounts).reduce((s, v) => s + v, 0);
      if (fromStatus > 0) totalOrders = fromStatus;
      else if (recentOrdersRaw.length > 0) totalOrders = recentOrdersRaw.length;
    }
    if (todayOrders === 0 && recentOrdersRaw.length > 0) {
      const todayOrdersList = recentOrdersRaw.filter(o => {
        const created = String(o.createdAt || "");
        return created >= todayISO;
      });
      todayOrders = todayOrdersList.length;
    }

    const statusCounts: Record<string, number> = {};
    for (const s of statusRows) {
      statusCounts[String(s.status)] = toNum(s.count);
    }

    const shopStats = shopsRaw.map((s) => ({
      id: String(s.id),
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
      orders: toNum(s.orderCount),
      revenue: toNum(s.shopRevenue),
      todayOrders: toNum(s.todayCount),
      recentOrders: [] as never[],
    }));

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
      { totalOrders: 0, totalRevenue: 0, todayOrders: 0, shopCount: 0, activeShopCount: 0, statusCounts: {}, shopStats: [], recentOrders: [] },
      { status: 500 }
    );
  }
}
