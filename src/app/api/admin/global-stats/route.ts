import { NextRequest, NextResponse } from "next/server";
import { db, ensureDb } from "@/lib/db";
import { withRateLimit } from "@/lib/rate-limit";

export const maxDuration = 30;

/// إحصائيات شاملة لصاحب المشروع (جميع المتاجر) — محسّنة بـ Raw SQL
export async function GET(req: NextRequest) {
  const rl = withRateLimit(req, "global-stats");
  if (!rl.ok) return rl.response;

  try {
    await ensureDb();
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);

    // استعلامان raw SQL متوازيان بدلاً من 18 استعلام Prisma
    const [statsResult, shopsResult] = await Promise.all([
      // استعلام واحد يجلب: الإجماليات + توزيع الحالات + آخر 20 طلب
      db.$queryRaw<Array<{
        total_orders: number;
        total_revenue: number;
        today_orders: number;
        status: string | null;
        status_count: number;
        order_id: string | null;
        order_ref: string | null;
        order_service_type: string | null;
        order_service_name: string | null;
        order_status: string | null;
        order_total: number | null;
        order_customer: string | null;
        order_created_at: string | null;
        order_shop_name: string | null;
      }>>`
        WITH counts AS (
          SELECT
            (SELECT COUNT(*) FROM "PrintOrder") AS total_orders,
            (SELECT COALESCE(SUM("total"), 0) FROM "PrintOrder") AS total_revenue,
            (SELECT COUNT(*) FROM "PrintOrder" WHERE "createdAt" >= ${todayStr}) AS today_orders
        ),
        status_dist AS (
          SELECT "status", COUNT(*) AS status_count
          FROM "PrintOrder"
          GROUP BY "status"
        ),
        recent AS (
          SELECT
            po.id AS order_id,
            po.reference AS order_ref,
            po."serviceType" AS order_service_type,
            po."serviceName" AS order_service_name,
            po.status AS order_status,
            po.total AS order_total,
            po.customer AS order_customer,
            po."createdAt" AS order_created_at,
            s.name AS order_shop_name
          FROM "PrintOrder" po
          LEFT JOIN "Shop" s ON po."shopId" = s.id
          ORDER BY po."createdAt" DESC
          LIMIT 20
        )
        SELECT
          c.total_orders, c.total_revenue, c.today_orders,
          sd.status, sd.status_count,
          r.order_id, r.order_ref, r.order_service_type, r.order_service_name,
          r.order_status, r.order_total, r.order_customer, r.order_created_at, r.order_shop_name
        FROM counts c
        CROSS JOIN status_dist sd
        LEFT JOIN recent r ON TRUE
      `,

      // استعلام واحد للمتاجر مع عدد الطلبات والإيرادات
      db.$queryRaw<Array<{
        id: string;
        name: string;
        slug: string;
        "ownerName": string | null;
        "ownerPhone": string | null;
        phone: string | null;
        whatsapp: string | null;
        email: string | null;
        address: string | null;
        "primaryColor": string | null;
        "isActive": number;
        "trialDays": number | null;
        "trialStartsAt": string | null;
        plan: string | null;
        features: string | null;
        "paymentInfo": string | null;
        "ownerNotes": string | null;
        "adminPin": string | null;
        country: string | null;
        language: string | null;
        order_count: number;
        revenue: number;
        today_orders: number;
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

    // معالجة النتائج
    const totalOrders = statsResult[0]?.total_orders ?? 0;
    const totalRevenue = statsResult[0]?.total_revenue ?? 0;
    const todayOrders = statsResult[0]?.today_orders ?? 0;

    // توزيع الحالات
    const statusCounts: Record<string, number> = {};
    for (const row of statsResult) {
      if (row.status) {
        statusCounts[row.status] = row.status_count;
      }
    }

    // آخر الطلبات (فقط الصفوف الفريدة)
    const seenIds = new Set<string>();
    const recentOrders: Array<{
      id: string; reference: string; serviceType: string; serviceName: string;
      status: string; total: number; customer: unknown; createdAt: string; shopName: string;
    }> = [];
    for (const row of statsResult) {
      if (row.order_id && !seenIds.has(row.order_id)) {
        seenIds.add(row.order_id);
        let parsedCustomer: unknown = {};
        try { parsedCustomer = JSON.parse(row.order_customer || "{}"); } catch { /* */ }
        recentOrders.push({
          id: row.order_id,
          reference: row.order_ref || "",
          serviceType: row.order_service_type || "",
          serviceName: row.order_service_name || "",
          status: row.order_status || "",
          total: row.order_total || 0,
          customer: parsedCustomer,
          createdAt: row.order_created_at || "",
          shopName: row.order_shop_name || "—",
        });
      }
    }

    // إحصائيات المتاجر
    const shopStats = shopsResult.map((s) => ({
      id: s.id,
      name: s.name,
      slug: s.slug,
      ownerName: s.ownerName,
      ownerPhone: s.ownerPhone,
      phone: s.phone,
      whatsapp: s.whatsapp,
      email: s.email,
      address: s.address,
      primaryColor: s.primaryColor,
      isActive: Boolean(s.isActive),
      trialDays: s.trialDays,
      trialStartsAt: s.trialStartsAt || null,
      plan: s.plan || "free",
      features: s.features || null,
      paymentInfo: s.paymentInfo || null,
      ownerNotes: s.ownerNotes || null,
      adminPin: s.adminPin,
      country: s.country,
      language: s.language,
      orders: s.order_count,
      revenue: s.revenue,
      todayOrders: s.today_orders,
    }));

    return NextResponse.json({
      totalOrders,
      totalRevenue,
      todayOrders,
      shopCount: shopsResult.length,
      activeShopCount: shopsResult.filter((s) => s.isActive).length,
      statusCounts,
      shopStats,
      recentOrders,
    });
  } catch (e) {
    console.error("[admin/global-stats]", e);
    return NextResponse.json({ error: "حدث خطأ أثناء جلب الإحصائيات" }, { status: 500 });
  }
}
