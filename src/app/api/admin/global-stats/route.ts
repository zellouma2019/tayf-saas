import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// Vercel: Cache response at edge for 30 seconds, revalidate in background
export const revalidate = 30;

// دالة مساعدة: تحويل JSON string بأمان
function safeJson<T = Record<string, unknown>>(str: string | null, fallback: T): T {
  try { return str ? JSON.parse(str) : fallback; } catch { return fallback; }
}

// دالة مساعدة: تحويل BigInt إلى Number (مطلوب لـ libSQL/Turso)
function toNum(v: unknown): number {
  return v == null ? 0 : Number(v);
}

export async function GET(req: NextRequest) {
  const startTime = Date.now();

  try {
    // لا نستخدم ensureDb() هنا — Prisma يتصل تلقائياً
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayISO = today.toISOString();

    // === استعلامان فقط بدلاً من أربعة — تقليل عدد جولات الاتصال بـ Turso ===

    const [combinedStats, shopsRaw] = await Promise.all([
      // الاستعلام 1: إحصائيات الطلبات + توزيع الحالات (استعلام واحد)
      db.$queryRawUnsafe<Array<Record<string, unknown>>>(`
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
      `, todayISO).catch((e) => {
        console.error("[global-stats] stats query failed:", e instanceof Error ? e.message : e);
        return [];
      }),

      // الاستعلام 2: المتاجر مع إحصائياتها (JOIN واحد)
      db.$queryRawUnsafe<Array<Record<string, unknown>>>(`
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
      `, todayISO).catch((e) => {
        console.error("[global-stats] shops query failed:", e instanceof Error ? e.message : e);
        return [];
      }),
    ]);

    // الاستعلام 3: آخر الطلبات (يبدأ بعد الأولين)
    const recentOrdersRaw = await db.$queryRawUnsafe<Array<Record<string, unknown>>>(`
      SELECT 
        o.id, o.reference, o."serviceType", o."serviceName",
        o.status, o.total, o.customer, o."createdAt",
        o."shopId", s.name as shopName, s.slug as shopSlug
      FROM "PrintOrder" o
      LEFT JOIN "Shop" s ON o."shopId" = s.id
      ORDER BY o."createdAt" DESC LIMIT 20
    `).catch((e) => {
      console.error("[global-stats] recent-orders failed:", e instanceof Error ? e.message : e);
      return [];
    });

    const elapsed = Date.now() - startTime;
    console.log(`[global-stats] loaded in ${elapsed}ms`);

    // تحليل النتائج المجمعة
    let totalOrders = 0;
    let totalRevenue = 0;
    let todayOrders = 0;
    const statusCounts: Record<string, number> = {};

    for (const row of combinedStats) {
      if (row._rowType === "stats") {
        totalOrders = toNum(row.totalOrders);
        totalRevenue = toNum(row.totalRevenue);
        todayOrders = toNum(row.todayOrders);
      } else if (row._rowType === "status" && row.status) {
        statusCounts[String(row.status)] = toNum(row.statusCount);
      }
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

    const recentOrders = (recentOrdersRaw || []).map((o) => {
      const c = safeJson(String(o.customer || ""), { name: "—", phone: "" });
      return {
        id: String(o.id),
        reference: String(o.reference),
        serviceType: String(o.serviceType),
        serviceName: String(o.serviceName),
        status: String(o.status),
        total: toNum(o.total),
        customer: { name: String(c.name || "—"), phone: String(c.phone || "") },
        createdAt: String(o.createdAt),
        shopName: o.shopName ? String(o.shopName) : "—",
        shopSlug: o.shopSlug ? String(o.shopSlug) : "",
        shopId: o.shopId ? String(o.shopId) : "",
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
    console.error(`[global-stats] fatal error after ${elapsed}ms:`, e);
    return NextResponse.json(
      { totalOrders: 0, totalRevenue: 0, todayOrders: 0, shopCount: 0, activeShopCount: 0, statusCounts: {}, shopStats: [], recentOrders: [] },
      { status: 500 }
    );
  }
}
