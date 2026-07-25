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

    // === استعلامان فقط إلى Turso مباشرة (بدون Prisma) ===
    const [statsResult, shopsResult] = await tursoQueries([
      {
        // الاستعلام 1: إحصائيات الطلبات + توزيع الحالات
        sql: `
          SELECT 
            COUNT(*) as totalOrders,
            COALESCE(SUM(total), 0) as totalRevenue,
            COUNT(CASE WHEN "createdAt" >= ? THEN 1 END) as todayOrders,
            NULL as status,
            0 as statusCount,
            'stats' as _rowType
          FROM "PrintOrder"
          UNION ALL
          SELECT 
            0, 0, 0,
            status as status,
            COUNT(*) as statusCount,
            'status' as _rowType
          FROM "PrintOrder"
          GROUP BY status
        `,
        params: { p1: todayISO },
      },
      {
        // الاستعلام 2: المتاجر مع إحصائياتها
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
        params: { p1: todayISO },
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

    // تحليل النتائج المجمعة
    let totalOrders = 0;
    let totalRevenue = 0;
    let todayOrders = 0;
    const statusCounts: Record<string, number> = {};

    for (const row of statsResult) {
      const r = row as Record<string, unknown>;
      if (r._rowType === "stats") {
        totalOrders = toNum(r.totalOrders);
        totalRevenue = toNum(r.totalRevenue);
        todayOrders = toNum(r.todayOrders);
      } else if (r._rowType === "status" && r.status) {
        statusCounts[String(r.status)] = toNum(r.statusCount);
      }
    }

    const shopStats = shopsResult.map((s) => {
      const shop = s as Record<string, unknown>;
      return {
        id: String(shop.id),
        name: String(shop.name),
        slug: String(shop.slug),
        ownerName: shop.ownerName ? String(shop.ownerName) : null,
        ownerPhone: shop.ownerPhone ? String(shop.ownerPhone) : null,
        phone: shop.phone ? String(shop.phone) : null,
        isActive: Boolean(shop.isActive),
        trialDays: shop.trialDays != null ? toNum(shop.trialDays) : null,
        trialStartsAt: shop.trialStartsAt ? String(shop.trialStartsAt) : null,
        plan: String(shop.plan || "free"),
        adminPin: String(shop.adminPin),
        country: String(shop.country || "DZ"),
        language: String(shop.language || "ar"),
        orders: toNum(shop.orderCount),
        revenue: toNum(shop.shopRevenue),
        todayOrders: toNum(shop.todayCount),
        recentOrders: [] as never[],
      };
    });

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
