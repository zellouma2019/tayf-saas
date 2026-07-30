import { NextRequest, NextResponse } from "next/server";
import { tursoQuery, toNum, safeJson } from "@/lib/turso-lite";
import { requireAdmin } from "@/lib/admin-auth";

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

/**
 * GET /api/admin/pdf-report
 * 
 * Generates a printable HTML stats report for the admin dashboard.
 * Returns HTML content-type for browser print.
 */
export async function GET(request: NextRequest) {
  const { authorized, error: authError } = await requireAdmin(request);
  if (!authorized) return authError;

  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") || "7", 10);
    const now = new Date();
    const fromDate = new Date(now);
    fromDate.setDate(fromDate.getDate() - days);
    const fromISO = fromDate.toISOString();
    const toISO = now.toISOString();

    // Fetch all stats in parallel
    const [summaryRows, statusRows, shopRows, recentOrders] = await Promise.all([
      tursoQuery(`SELECT COUNT(*) as totalOrders, COALESCE(SUM(total), 0) as totalRevenue FROM "PrintOrder" WHERE "createdAt" >= ?`, [fromISO]),
      tursoQuery(`SELECT status, COUNT(*) as count FROM "PrintOrder" WHERE "createdAt" >= ? GROUP BY status`, [fromISO]),
      tursoQuery(`SELECT id, name, slug, "isActive" FROM "Shop" ORDER BY name`),
      tursoQuery(`SELECT id, reference, "serviceType", "serviceName", status, total, customer, "shopId", "createdAt" FROM "PrintOrder" ORDER BY "createdAt" DESC LIMIT 50`),
    ]);

    const summary = summaryRows[0] || {};
    const totalOrders = toNum(summary.totalOrders);
    const totalRevenue = toNum(summary.totalRevenue);

    // Status counts
    const statusCounts: Record<string, number> = {};
    for (const s of statusRows) {
      statusCounts[String(s.status)] = toNum(s.count);
    }

    // Shop stats from recent orders
    const shopOrderMap = new Map<string, { orders: number; revenue: number }>();
    for (const o of recentOrders) {
      const sid = String(o.shopId || "");
      if (!sid) continue;
      const existing = shopOrderMap.get(sid) || { orders: 0, revenue: 0 };
      existing.orders += 1;
      existing.revenue += toNum(o.total);
      shopOrderMap.set(sid, existing);
    }

    const shopStats = shopRows.map((s) => {
      const info = shopOrderMap.get(String(s.id)) || { orders: 0, revenue: 0 };
      return { name: String(s.name), slug: String(s.slug), orders: info.orders, revenue: Math.round(info.revenue), isActive: Boolean(s.isActive) };
    });

    // Revenue from all orders (not just recent)
    const allRevenueRows = await tursoQuery(`SELECT COALESCE(SUM(total), 0) as total FROM "PrintOrder" WHERE total > 0`);
    const allTimeRevenue = allRevenueRows[0] ? toNum(allRevenueRows[0].total) : totalRevenue;

    const fmt = (n: number) => n.toLocaleString("ar-DZ");
    const fmtDate = (d: string) => new Date(d).toLocaleDateString("ar-DZ", { year: "numeric", month: "long", day: "numeric" });
    const fmtTime = (d: string) => new Date(d).toLocaleTimeString("ar-DZ", { hour: "2-digit", minute: "2-digit" });

    const statusLabels: Record<string, string> = {
      pending: "قيد الانتظار", confirmed: "مؤكد", printing: "قيد الطباعة",
      ready: "جاهز", delivered: "تم التسليم", cancelled: "ملغي",
    };
    const statusColors: Record<string, string> = {
      pending: "#f59e0b", confirmed: "#0ea5e9", printing: "#6366f1",
      ready: "#10b981", delivered: "#22c55e", cancelled: "#ef4444",
    };

    const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <title>تقرير إحصائيات طيف</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; color: #1a1a2e; background: #fff; padding: 32px; }
    .header { text-align: center; margin-bottom: 32px; border-bottom: 3px solid #7c3aed; padding-bottom: 20px; }
    .header h1 { font-size: 28px; color: #7c3aed; margin-bottom: 4px; }
    .header p { color: #666; font-size: 13px; }
    .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 32px; }
    .stat-card { background: #f8f9fa; border-radius: 12px; padding: 20px; text-align: center; border: 1px solid #e5e7eb; }
    .stat-card .value { font-size: 32px; font-weight: 800; color: #7c3aed; }
    .stat-card .label { font-size: 12px; color: #666; margin-top: 4px; }
    .section { margin-bottom: 28px; }
    .section h2 { font-size: 18px; color: #333; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 2px solid #e5e7eb; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th { background: #7c3aed; color: #fff; padding: 10px 12px; text-align: right; font-weight: 600; }
    td { padding: 8px 12px; border-bottom: 1px solid #f0f0f0; }
    tr:hover { background: #f8f9fa; }
    .status-badge { display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 11px; font-weight: 600; color: #fff; }
    .revenue { font-weight: 700; color: #7c3aed; }
    .footer { text-align: center; margin-top: 40px; padding-top: 16px; border-top: 1px solid #e5e7eb; font-size: 11px; color: #999; }
    @media print { body { padding: 16px; } .stat-card { break-inside: avoid; } }
  </style>
</head>
<body>
  <div class="header">
    <h1>📊 تقرير إحصائيات طيف</h1>
    <p>آخر ${days} أيام — من ${fmtDate(fromISO)} إلى ${fmtDate(toISO)}</p>
    <p>تاريخ التقرير: ${fmtDate(new Date().toISOString())} الساعة ${fmtTime(new Date().toISOString())}</p>
  </div>

  <div class="stats-grid">
    <div class="stat-card">
      <div class="value">${fmt(totalOrders)}</div>
      <div class="label">إجمالي الطلبات</div>
    </div>
    <div class="stat-card">
      <div class="value">${fmt(totalRevenue)} د.ج</div>
      <div class="label">إيرادات الفترة</div>
    </div>
    <div class="stat-card">
      <div class="value">${fmt(shopStats.length)}</div>
      <div class="label">المتاجر النشطة</div>
    </div>
  </div>

  <div class="section">
    <h2>توزيع حالات الطلبات</h2>
    <table>
      <tr><th>الحالة</th><th>العدد</th><th>النسبة</th></tr>
      ${Object.entries(statusCounts).sort((a, b) => b[1] - a[1]).map(([status, count]) => {
        const pct = totalOrders > 0 ? ((count / totalOrders) * 100).toFixed(1) : "0.0";
        const color = statusColors[status] || "#6b7280";
        const label = statusLabels[status] || status;
        return `<tr><td><span class="status-badge" style="background:${color}">${label}</span></td><td>${fmt(count)}</td><td>${pct}%</td></tr>`;
      }).join("")}
    </table>
  </div>

  <div class="section">
    <h2>أداء المتاجر</h2>
    <table>
      <tr><th>المتجر</th><th>الطلبات</th><th>الإيرادات</th><th>الحالة</th></tr>
      ${shopStats.sort((a, b) => b.revenue - a.revenue).map(s => `
        <tr>
          <td><strong>${s.name}</strong></td>
          <td>${fmt(s.orders)}</td>
          <td class="revenue">${fmt(s.revenue)} د.ج</td>
          <td>${s.isActive ? "🟢 نشط" : "🔴 معطل"}</td>
        </tr>
      `).join("")}
    </table>
  </div>

  <div class="section">
    <h2>آخر الطلبات (أحدث 50)</h2>
    <table>
      <tr><th>الرقم</th><th>الزبون</th><th>الخدمة</th><th>الحالة</th><th>المبلغ</th><th>التاريخ</th></tr>
      ${recentOrders.slice(0, 50).map(o => {
        const c = safeJson(String(o.customer || ""), { name: "—", phone: "" });
        const color = statusColors[String(o.status)] || "#6b7280";
        const label = statusLabels[String(o.status)] || String(o.status);
        return `<tr>
          <td style="font-family:monospace;font-size:11px">${o.reference || o.id.slice(0, 12)}</td>
          <td>${c.name || "—"}</td>
          <td>${o.serviceName || o.serviceType || "—"}</td>
          <td><span class="status-badge" style="background:${color}">${label}</span></td>
          <td class="revenue">${toNum(o.total) > 0 ? fmt(toNum(o.total)) + " د.ج" : "—"}</td>
          <td style="font-size:11px">${fmtDate(String(o.createdAt))}</td>
        </tr>`;
      }).join("")}
    </table>
  </div>

  <div class="footer">
    <p>منصة طيف — منصة إدارة المطابع الذكية | تقرير آلي | v5.5</p>
    <p>إجمالي الإيرادات (كل الأوقات): ${fmt(allTimeRevenue)} د.ج</p>
  </div>

  <script>window.onload = function() { window.print(); };</script>
</body>
</html>`;

    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `inline; filename="tayf-report-${new Date().toISOString().slice(0, 10)}.html"`,
      },
    });
  } catch (e) {
    console.error("[pdf-report] error:", e);
    return NextResponse.json({ error: "Failed to generate report" }, { status: 500 });
  }
}
