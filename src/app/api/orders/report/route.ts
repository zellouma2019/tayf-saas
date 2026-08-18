import { NextRequest, NextResponse } from "next/server";
import { tursoQuery, toNum, safeJson } from "@/lib/turso-lite";
import { requireShopOrGlobalAdmin } from "@/lib/admin-auth";

export const revalidate = 0;

/**
 * GET /api/orders/report?shopId=xxx&from=2025-01-01&to=2025-12-31
 *
 * إرجاع بيانات التقرير الإحصائي لفترة محددة:
 * - إجمالي الطلبات، الإيرادات، الأرباح، التكاليف
 * - توزيع الحالات
 * - أكثر 5 خدمات طلباً
 * - الإيرادات اليومية
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const shopId = searchParams.get("shopId");
  const { authorized, error: authError } = await requireShopOrGlobalAdmin(request, shopId);
  if (!authorized) return authError;

  try {
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    if (!shopId) {
      return NextResponse.json({ error: "shopId مطلوب" }, { status: 400 });
    }

    // حساب الفترة الافتراضية: آخر 30 يوماً
    const now = new Date();
    const defaultFrom = new Date(now);
    defaultFrom.setDate(defaultFrom.getDate() - 30);
    const defaultTo = now;

    const fromDate = from ? new Date(from) : defaultFrom;
    const toDate = to ? new Date(to + "T23:59:59") : defaultTo;
    const fromISO = fromDate.toISOString();
    const toISO = toDate.toISOString();

    // استعلامات موازية
    const [summaryRows, statusRows, serviceRows, ordersByDay, expenseRows, shopRows] =
      await Promise.all([
        // 1: إجمالي الطلبات والإيرادات والتكاليف
        tursoQuery<{ total: unknown; revenue: unknown; cost: unknown }>(
          `SELECT COUNT(*) as total, COALESCE(SUM(total), 0) as revenue, COALESCE(SUM(cost), 0) as cost
           FROM "PrintOrder" WHERE "shopId" = ? AND "createdAt" >= ? AND "createdAt" <= ?`,
          [shopId, fromISO, toISO]
        ),

        // 2: توزيع الحالات
        tursoQuery<{ status: string; cnt: number }>(
          `SELECT status, COUNT(*) as cnt
           FROM "PrintOrder" WHERE "shopId" = ? AND "createdAt" >= ? AND "createdAt" <= ?
           GROUP BY status`,
          [shopId, fromISO, toISO]
        ),

        // 3: أكثر الخدمات طلباً
        tursoQuery<{ "serviceType": string; "serviceName": string; cnt: number; rev: unknown }>(
          `SELECT "serviceType", "serviceName", COUNT(*) as cnt, COALESCE(SUM(total), 0) as rev
           FROM "PrintOrder" WHERE "shopId" = ? AND "createdAt" >= ? AND "createdAt" <= ?
           GROUP BY "serviceType", "serviceName"
           ORDER BY cnt DESC
           LIMIT 10`,
          [shopId, fromISO, toISO]
        ),

        // 4: الإيرادات اليومية
        tursoQuery<{ day: string; cnt: unknown; rev: unknown }>(
          `SELECT DATE("createdAt") as day, COUNT(*) as cnt, COALESCE(SUM(total), 0) as rev
           FROM "PrintOrder" WHERE "shopId" = ? AND "createdAt" >= ? AND "createdAt" <= ?
           GROUP BY DATE("createdAt")
           ORDER BY day ASC`,
          [shopId, fromISO, toISO]
        ),

        // 5: المصاريف
        tursoQuery<{ exp: unknown }>(
          `SELECT COALESCE(SUM(amount), 0) as exp FROM "Expense" WHERE "shopId" = ? AND date >= ? AND date <= ?`,
          [shopId, fromISO, toISO]
        ),

        // 6: بيانات المتجر
        tursoQuery<{ name: string; country: string; "customCurrency": string | null }>(
          `SELECT name, country, "customCurrency" FROM "Shop" WHERE id = ? LIMIT 1`,
          [shopId]
        ),
      ]);

    const summary = summaryRows[0] || {};
    const totalOrders = toNum(summary.total);
    const totalRevenue = toNum(summary.revenue);
    const totalCost = toNum(summary.cost);
    const totalExpenses = toNum(expenseRows[0]?.exp);
    const totalProfit = totalRevenue - totalCost - totalExpenses;

    const shop = shopRows[0];
    const shopName = shop?.name || "متجر";
    const countryCode = shop?.country || "DZ";
    const customCurrency = shop?.customCurrency;

    // رمز العملة
    let currencySymbol = "د.ج";
    if (countryCode === "SA") currencySymbol = "ر.س";
    else if (countryCode === "AE") currencySymbol = "د.إ";
    else if (countryCode === "MA") currencySymbol = "د.م";
    else if (countryCode === "TN") currencySymbol = "د.ت";
    else if (countryCode === "IQ") currencySymbol = "د.ع";
    else if (countryCode === "TR") currencySymbol = "₺";
    if (customCurrency) currencySymbol = customCurrency;

    // توزيع الحالات
    const statusCounts: Record<string, number> = {};
    for (const row of statusRows) {
      statusCounts[String(row.status)] = toNum(row.cnt);
    }

    // أكثر الخدمات
    const topServices = serviceRows.map((row) => ({
      serviceType: String(row.serviceType),
      serviceName: String(row.serviceName),
      count: toNum(row.cnt),
      revenue: toNum(row.rev),
    }));

    // الإيرادات اليومية
    const dailyRevenue = ordersByDay.map((row) => ({
      date: String(row.day),
      orders: toNum(row.cnt),
      revenue: toNum(row.rev),
    }));

    return NextResponse.json({
      shopName,
      fromDate: fromDate.toISOString().slice(0, 10),
      toDate: toDate.toISOString().slice(0, 10),
      totalOrders,
      totalRevenue,
      totalProfit,
      totalCost,
      totalExpenses,
      statusCounts,
      topServices,
      dailyRevenue,
      currencySymbol,
    });
  } catch (e) {
    console.error("[orders/report]", e);
    return NextResponse.json(
      { error: "حدث خطأ أثناء جلب التقرير" },
      { status: 500 }
    );
  }
}
