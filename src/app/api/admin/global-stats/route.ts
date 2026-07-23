import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { withRateLimit } from "@/lib/rate-limit";

export const maxDuration = 30;

/// إحصائيات شاملة — 2 استعلامات فقط (المتاجر بشكل منفصل لاحقاً)
export async function GET(req: NextRequest) {
  const rl = withRateLimit(req, "global-stats");
  if (!rl.ok) return rl.response;

  try {
    // استعلامان فقط
    const [countRows, statusRows] = await Promise.all([
      db.$queryRaw<Array<{ total_orders: number; total_revenue: number }>>`
        SELECT COUNT(*) AS total_orders, COALESCE(SUM("total"), 0) AS total_revenue FROM "PrintOrder"
      `,
      db.$queryRaw<Array<{ status: string; cnt: number }>>`
        SELECT "status", COUNT(*) AS cnt FROM "PrintOrder" GROUP BY "status"
      `,
    ]);

    const totalOrders = countRows[0]?.total_orders ?? 0;
    const totalRevenue = countRows[0]?.total_revenue ?? 0;

    const statusCounts: Record<string, number> = {};
    for (const r of statusRows) {
      statusCounts[r.status] = r.cnt;
    }

    // المتاجر — استعلام بسيط بدون JOIN
    const shopRows = await db.$queryRaw<Array<{
      id: string; name: string; slug: string; "ownerName": string | null;
      "ownerPhone": string | null; phone: string | null; "isActive": number;
      "trialDays": number | null; "trialStartsAt": string | null;
      plan: string | null; "adminPin": string | null; country: string | null; language: string | null;
    }>>`SELECT id, name, slug, "ownerName", "ownerPhone", phone, "isActive", "trialDays", "trialStartsAt", plan, "adminPin", country, language FROM "Shop" ORDER BY "createdAt" DESC`;

    // آخر الطلبات
    const recentRows = await db.$queryRaw<Array<{
      id: string; reference: string; status: string; total: number;
      customer: string; "createdAt": string; shop_name: string;
    }>>`
      SELECT po.id, po.reference, po.status, po.total, po.customer, po."createdAt",
        COALESCE(s.name, '—') AS shop_name
      FROM "PrintOrder" po
      LEFT JOIN "Shop" s ON po."shopId" = s.id
      ORDER BY po."createdAt" DESC LIMIT 20
    `;

    const recentOrders = recentRows.map((r) => {
      let customer: unknown = {};
      try { customer = JSON.parse(r.customer || "{}"); } catch { /* */ }
      return {
        id: r.id, reference: r.reference, serviceType: "", serviceName: "",
        status: r.status, total: r.total, customer,
        createdAt: r.createdAt, shopName: r.shop_name,
      };
    });

    const shopStats = shopRows.map((s) => ({
      id: s.id, name: s.name, slug: s.slug,
      ownerName: s.ownerName, ownerPhone: s.ownerPhone,
      phone: s.phone, isActive: Boolean(s.isActive),
      trialDays: s.trialDays, trialStartsAt: s.trialStartsAt || null,
      plan: s.plan || "free", adminPin: s.adminPin,
      country: s.country, language: s.language,
      orders: 0, revenue: 0, todayOrders: 0,
    }));

    return NextResponse.json({
      totalOrders, totalRevenue, todayOrders: 0,
      shopCount: shopRows.length,
      activeShopCount: shopRows.filter((s) => s.isActive).length,
      statusCounts, shopStats, recentOrders,
    });
  } catch (e) {
    console.error("[admin/global-stats]", e);
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}
