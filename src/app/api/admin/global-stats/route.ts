import { NextRequest, NextResponse } from "next/server";
import { db, ensureDb } from "@/lib/db";
import { withRateLimit } from "@/lib/rate-limit";

export const maxDuration = 15;

// دالة مساعدة: تحويل JSON string بأمان
function safeJson<T = Record<string, unknown>>(str: string | null, fallback: T): T {
  try { return str ? JSON.parse(str) : fallback; } catch { return fallback; }
}

// دالة مساعدة: تحويل BigInt إلى Number (مطلوب لـ libSQL/Turso)
function toNum(v: unknown): number {
  return v == null ? 0 : Number(v);
}

// دالة مساعدة: استعلام مع catch و fallback
async function safeQuery<T>(label: string, fn: () => Promise<T>, fallback: T): Promise<T> {
  try { return await fn(); }
  catch (e) {
    console.error(`[global-stats] ${label} failed:`, e instanceof Error ? e.message : e);
    return fallback;
  }
}

export async function GET(req: NextRequest) {
  const rl = withRateLimit(req, "global-stats");
  if (!rl.ok) return rl.response;

  const startTime = Date.now();

  try {
    await ensureDb();

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayISO = today.toISOString();

    // === 4 استعلامات raw SQL موازية (أسرع على Turso من Prisma ORM) ===

    // 1. إحصائيات الطلبات الكلية
    const orderStats = await safeQuery("order-stats", async () => {
      const rows = await db.$queryRawUnsafe<Array<Record<string, unknown>>>(`
        SELECT 
          COUNT(*) as totalOrders,
          COALESCE(SUM(total), 0) as totalRevenue,
          COUNT(CASE WHEN "createdAt" >= ? THEN 1 END) as todayOrders
        FROM "PrintOrder"
      `, todayISO);
      const r = rows[0] || {};
      return { totalOrders: toNum(r.totalOrders), totalRevenue: toNum(r.totalRevenue), todayOrders: toNum(r.todayOrders) };
    }, { totalOrders: 0, totalRevenue: 0, todayOrders: 0 });

    // 2. توزيع حالات الطلبات
    const statusRows = await safeQuery("status-dist", async () => {
      return db.$queryRawUnsafe<Array<Record<string, unknown>>>(`
        SELECT status, COUNT(*) as count FROM "PrintOrder" GROUP BY status
      `);
    }, []);

    // 3. المتاجر مع إحصائيات لكل متجر (JOIN واحد)
    const shops = await safeQuery("shops", async () => {
      return db.$queryRawUnsafe<Array<Record<string, unknown>>>(`
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
      `, todayISO);
    }, []);

    // 4. آخر 20 طلب مع اسم المتجر
    const recentOrdersRaw = await safeQuery("recent-orders", async () => {
      return db.$queryRawUnsafe<Array<Record<string, unknown>>>(`
        SELECT 
          o.id, o.reference, o."serviceType", o."serviceName",
          o.status, o.total, o.customer, o."createdAt",
          o."shopId", s.name as shopName, s.slug as shopSlug
        FROM "PrintOrder" o
        LEFT JOIN "Shop" s ON o."shopId" = s.id
        ORDER BY o."createdAt" DESC LIMIT 20
      `);
    }, []);

    const elapsed = Date.now() - startTime;
    console.log(`[global-stats] loaded in ${elapsed}ms — ${shops.length} shops, ${orderStats.totalOrders} orders`);

    // تجهيز البيانات
    const statusCounts: Record<string, number> = {};
    for (const s of statusRows) {
      statusCounts[String(s.status)] = toNum(s.count);
    }

    const shopStats = shops.map((s) => ({
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
      recentOrders: [],
    }));

    const recentOrders = recentOrdersRaw.map((o) => {
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
      totalOrders: orderStats.totalOrders,
      totalRevenue: orderStats.totalRevenue,
      todayOrders: orderStats.todayOrders,
      shopCount: shops.length,
      activeShopCount: shops.filter((s) => Boolean(s.isActive)).length,
      statusCounts,
      shopStats,
      recentOrders,
    });
  } catch (e) {
    const elapsed = Date.now() - startTime;
    console.error(`[global-stats] fatal error after ${elapsed}ms:`, e);
    return NextResponse.json(
      { error: "حدث خطأ", totalOrders: 0, totalRevenue: 0, todayOrders: 0, shopCount: 0, activeShopCount: 0, statusCounts: {}, shopStats: [], recentOrders: [] },
      { status: 500 }
    );
  }
}
