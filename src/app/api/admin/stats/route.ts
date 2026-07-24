import { NextRequest, NextResponse } from "next/server";
import { db, ensureDb } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

export const maxDuration = 15;

function toNum(v: unknown): number { return v == null ? 0 : Number(v); }
function safeJson<T = Record<string, unknown>>(str: string, fallback: T): T {
  try { return JSON.parse(str); } catch { return fallback; }
}
async function safeQuery<T>(label: string, fn: () => Promise<T>, fallback: T): Promise<T> {
  try { return await fn(); }
  catch (e) { console.error(`[admin/stats] ${label} failed:`, e instanceof Error ? e.message : e); return fallback; }
}

export async function GET(request: NextRequest) {
  const { authorized, error: authError } = await requireAdmin(request);
  if (!authorized) return authError;

  try {
    await ensureDb();

    const shopId = request.nextUrl.searchParams.get("shopId");
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayISO = todayStart.toISOString();

    const shopWhere = shopId ? ` WHERE "shopId" = '${shopId}'` : "";

    const [orderStats, expensesRow, revenueRow, statusRows, serviceRows, recentOrders] = await Promise.all([
      safeQuery("order-stats", async () => {
        const rows = await db.$queryRawUnsafe<Array<Record<string, unknown>>>(`
          SELECT COUNT(*) as total, COUNT(CASE WHEN "createdAt" >= ? THEN 1 END) as today
          FROM "PrintOrder"${shopWhere}
        `, todayISO);
        const r = rows[0] || {};
        return { total: toNum(r.total), today: toNum(r.today) };
      }, { total: 0, today: 0 }),

      safeQuery("expenses", async () => {
        const rows = await db.$queryRawUnsafe<Array<Record<string, unknown>>>(`
          SELECT COALESCE(SUM(amount), 0) as total FROM "Expense"${shopWhere}
        `);
        return toNum(rows[0]?.total);
      }, 0),

      safeQuery("revenue", async () => {
        const rows = await db.$queryRawUnsafe<Array<Record<string, unknown>>>(`
          SELECT COALESCE(SUM(total), 0) as total FROM "PrintOrder"${shopWhere}
        `);
        return toNum(rows[0]?.total);
      }, 0),

      safeQuery("status-dist", async () => {
        return db.$queryRawUnsafe<Array<Record<string, unknown>>>(`
          SELECT status, COUNT(*) as count FROM "PrintOrder"${shopWhere} GROUP BY status
        `);
      }, []),

      safeQuery("service-dist", async () => {
        return db.$queryRawUnsafe<Array<Record<string, unknown>>>(`
          SELECT "serviceType", COUNT(*) as count, COALESCE(SUM(total), 0) as revenue
          FROM "PrintOrder"${shopWhere} GROUP BY "serviceType"
        `);
      }, []),

      safeQuery("recent-orders", async () => {
        return db.$queryRawUnsafe<Array<Record<string, unknown>>>(`
          SELECT id, reference, "serviceType", "serviceName", status, total, pages, copies,
                 "createdAt", "fileName", "fileType", options, customer, delivery, pricing, "adminNotes", tags
          FROM "PrintOrder"${shopWhere}
          ORDER BY "createdAt" DESC LIMIT 5
        `);
      }, []),
    ]);

    const revenueSum = revenueRow;
    const expensesSum = expensesRow;

    const statusMap: Record<string, number> = {};
    for (const s of statusRows) statusMap[String(s.status)] = toNum(s.count);

    return NextResponse.json({
      totalOrders: orderStats.total,
      totalRevenue: revenueSum,
      totalExpenses: expensesSum,
      profit: revenueSum - expensesSum,
      todayOrders: orderStats.today,
      statusCounts: statusMap,
      serviceCounts: (serviceRows as Array<Record<string, unknown>>).map((s) => ({
        serviceType: String(s.serviceType),
        count: toNum(s.count),
        revenue: toNum(s.revenue),
      })),
      recentOrders: (recentOrders as Array<Record<string, unknown>>).map((o) => ({
        ...o,
        total: toNum(o.total),
        pages: toNum(o.pages),
        copies: toNum(o.copies),
        options: safeJson(String(o.options || "{}"), {}),
        customer: safeJson(String(o.customer || "{}"), { name: "", phone: "" }),
        delivery: safeJson(String(o.delivery || "{}"), {}),
        pricing: safeJson(String(o.pricing || "{}"), {}),
      })),
    });
  } catch (e) {
    console.error("[admin/stats] fatal error:", e);
    return NextResponse.json(
      { totalOrders: 0, totalRevenue: 0, totalExpenses: 0, profit: 0, todayOrders: 0, statusCounts: {}, serviceCounts: [], recentOrders: [] },
      { status: 500 }
    );
  }
}
