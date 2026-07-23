import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { withRateLimit } from "@/lib/rate-limit";

export const maxDuration = 30;

/// إحصائيات شاملة — 3 استعلامات فقط
export async function GET(req: NextRequest) {
  const rl = withRateLimit(req, "global-stats");
  if (!rl.ok) return rl.response;

  try {
    const todayStr = new Date().toISOString().slice(0, 10);

    // 3 استعلامات raw SQL متوازية
    const [countRows, statusRows, recentRows, shopRows] = await Promise.all([
      // 1) الإجماليات
      db.$queryRaw<Array<{ total_orders: number; total_revenue: number; today_orders: number }>>`
        SELECT
          (SELECT COUNT(*) FROM "PrintOrder") AS total_orders,
          (SELECT COALESCE(SUM("total"), 0) FROM "PrintOrder") AS total_revenue,
          (SELECT COUNT(*) FROM "PrintOrder" WHERE "createdAt" >= ${todayStr}) AS today_orders
      `,

      // 2) توزيع الحالات
      db.$queryRaw<Array<{ status: string; cnt: number }>>`
        SELECT "status", COUNT(*) AS cnt FROM "PrintOrder" GROUP BY "status"
      `,

      // 3) آخر 20 طلب مع اسم المتجر
      db.$queryRaw<Array<{
        id: string; reference: string; "serviceType": string; "serviceName": string;
        status: string; total: number; customer: string; "createdAt": string;
        shop_name: string;
      }>>`
        SELECT
          po.id, po.reference, po."serviceType", po."serviceName",
          po.status, po.total, po.customer, po."createdAt",
          COALESCE(s.name, '—') AS shop_name
        FROM "PrintOrder" po
        LEFT JOIN "Shop" s ON po."shopId" = s.id
        ORDER BY po."createdAt" DESC
        LIMIT 20
      `,

      // 4) المتاجر مع إحصائيات
      db.$queryRaw<Array<{
        id: string; name: string; slug: string; "ownerName": string | null;
        "ownerPhone": string | null; phone: string | null; whatsapp: string | null;
        email: string | null; address: string | null; "primaryColor": string | null;
        "isActive": number; "trialDays": number | null; "trialStartsAt": string | null;
        plan: string | null; features: string | null; "paymentInfo": string | null;
        "ownerNotes": string | null; "adminPin": string | null; country: string | null;
        language: string | null; order_count: number; revenue: number; today_orders: number;
      }>>`
        SELECT
          s.id, s.name, s.slug, s."ownerName", s."ownerPhone",
          s.phone, s.whatsapp, s.email, s.address, s."primaryColor",
          s."isActive", s."trialDays", s."trialStartsAt", s.plan,
          s.features, s."paymentInfo", s."ownerNotes", s."adminPin",
          s.country, s.language,
          COALESCE(oc.cnt, 0) AS order_count,
          COALESCE(os.rev, 0) AS revenue,
          COALESCE(ot.cnt, 0) AS today_orders
        FROM "Shop" s
        LEFT JOIN (SELECT "shopId", COUNT(*) AS cnt FROM "PrintOrder" GROUP BY "shopId") oc ON oc."shopId" = s.id
        LEFT JOIN (SELECT "shopId", SUM("total") AS rev FROM "PrintOrder" GROUP BY "shopId") os ON os."shopId" = s.id
        LEFT JOIN (SELECT "shopId", COUNT(*) AS cnt FROM "PrintOrder" WHERE "createdAt" >= ${todayStr} GROUP BY "shopId") ot ON ot."shopId" = s.id
        ORDER BY s."createdAt" DESC
      `,
    ]);

    const totalOrders = countRows[0]?.total_orders ?? 0;
    const totalRevenue = countRows[0]?.total_revenue ?? 0;
    const todayOrders = countRows[0]?.today_orders ?? 0;

    const statusCounts: Record<string, number> = {};
    for (const r of statusRows) {
      statusCounts[r.status] = r.cnt;
    }

    const recentOrders = recentRows.map((r) => {
      let customer: unknown = {};
      try { customer = JSON.parse(r.customer || "{}"); } catch { /* */ }
      return {
        id: r.id, reference: r.reference,
        serviceType: r.serviceType, serviceName: r.serviceName,
        status: r.status, total: r.total, customer,
        createdAt: r.createdAt, shopName: r.shop_name,
      };
    });

    const shopStats = shopRows.map((s) => ({
      id: s.id, name: s.name, slug: s.slug,
      ownerName: s.ownerName, ownerPhone: s.ownerPhone,
      phone: s.phone, whatsapp: s.whatsapp, email: s.email,
      address: s.address, primaryColor: s.primaryColor,
      isActive: Boolean(s.isActive),
      trialDays: s.trialDays, trialStartsAt: s.trialStartsAt || null,
      plan: s.plan || "free",
      features: s.features || null, paymentInfo: s.paymentInfo || null,
      ownerNotes: s.ownerNotes || null, adminPin: s.adminPin,
      country: s.country, language: s.language,
      orders: s.order_count, revenue: s.revenue, todayOrders: s.today_orders,
    }));

    return NextResponse.json({
      totalOrders, totalRevenue, todayOrders,
      shopCount: shopRows.length,
      activeShopCount: shopRows.filter((s) => s.isActive).length,
      statusCounts, shopStats, recentOrders,
    });
  } catch (e) {
    console.error("[admin/global-stats]", e);
    return NextResponse.json({ error: "حدث خطأ أثناء جلب الإحصائيات" }, { status: 500 });
  }
}
