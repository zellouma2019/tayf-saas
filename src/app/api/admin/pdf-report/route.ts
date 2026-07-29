import { NextRequest, NextResponse } from "next/server";
import { tursoQuery, toNum } from "@/lib/turso-lite";

export const revalidate = 0;

/** HTML escape utility */
function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function formatNumber(n: number): string {
  return n.toLocaleString("ar-DZ");
}

const STATUS_LABELS: Record<string, string> = {
  pending: "قيد الانتظار", confirmed: "مؤكد", printing: "قيد الطباعة",
  ready: "جاهز", delivered: "تم التسليم", cancelled: "ملغي",
};

/**
 * GET /api/admin/pdf-report?from=YYYY-MM-DD&to=YYYY-MM-DD
 * Generates a printable HTML statistics report (opens in new tab for print/save)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const toDate = to ? new Date(to) : new Date();
    const fromDate = from ? new Date(from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const fromISO = fromDate.toISOString();
    const toISO = toDate.toISOString();

    const [statsRows, statusRows, serviceRows, dailyRows, expenseRows] = await Promise.all([
      tursoQuery(
        `SELECT COUNT(*) as total, COALESCE(SUM(total), 0) as revenue, COALESCE(SUM(cost), 0) as cost
         FROM "PrintOrder" WHERE "createdAt" >= ? AND "createdAt" <= ?`,
        [fromISO, toISO]
      ),
      tursoQuery(
        `SELECT status, COUNT(*) as count FROM "PrintOrder"
         WHERE "createdAt" >= ? AND "createdAt" <= ? GROUP BY status`,
        [fromISO, toISO]
      ),
      tursoQuery(
        `SELECT "serviceType", "serviceName", COUNT(*) as count, COALESCE(SUM(total), 0) as revenue
         FROM "PrintOrder" WHERE "createdAt" >= ? AND "createdAt" <= ?
         GROUP BY "serviceType", "serviceName" ORDER BY count DESC LIMIT 10`,
        [fromISO, toISO]
      ),
      tursoQuery(
        `SELECT DATE("createdAt") as date, COUNT(*) as orders, COALESCE(SUM(total), 0) as revenue
         FROM "PrintOrder" WHERE "createdAt" >= ? AND "createdAt" <= ?
         GROUP BY DATE("createdAt") ORDER BY date`,
        [fromISO, toISO]
      ),
      tursoQuery(
        `SELECT COALESCE(SUM(amount), 0) as expenses FROM "Expense" WHERE "createdAt" >= ? AND "createdAt" <= ?`,
        [fromISO, toISO]
      ),
    ]);

    const stats = statsRows[0] || {};
    const totalOrders = toNum(stats.total);
    const totalRevenue = toNum(stats.revenue);
    const totalCost = toNum(stats.cost);
    const totalExpenses = toNum((expenseRows[0] || {}).expenses);
    const profit = totalRevenue - totalCost - totalExpenses;

    const statusHtml = statusRows.map(r => `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;">${esc(STATUS_LABELS[String(r.status)] || String(r.status))}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;text-align:center;font-weight:600;">${toNum(r.count)}</td>
      </tr>`).join("");

    const servicesHtml = serviceRows.slice(0, 5).map((s, i) => `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;font-weight:600;">${i + 1}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;">${esc(String(s.serviceName || s.serviceType))}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;text-align:center;">${toNum(s.count)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;text-align:center;">${formatNumber(toNum(s.revenue))} د.ج</td>
      </tr>`).join("");

    const dailyHtml = dailyRows.map(r => `
      <tr>
        <td style="padding:6px 10px;border-bottom:1px solid #f0f0f0;font-size:12px;">${String(r.date)}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #f0f0f0;text-align:center;font-size:12px;">${toNum(r.orders)}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #f0f0f0;text-align:center;font-size:12px;">${formatNumber(toNum(r.revenue))} د.ج</td>
      </tr>`).join("");

    const html = `<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="UTF-8">
<title>تقرير الإحصائيات — طيف</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Cairo', 'Segoe UI', sans-serif; max-width: 780px; margin: 0 auto; padding: 24px; color: #1a1a1a; }
  .header { text-align: center; padding: 20px 0; border-bottom: 2px solid #d4a853; margin-bottom: 20px; }
  .header h1 { font-size: 22px; color: #1a1a1a; margin-bottom: 4px; }
  .header p { font-size: 13px; color: #666; }
  .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px; }
  .stat-card { background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 10px; padding: 16px; text-align: center; }
  .stat-card .value { font-size: 22px; font-weight: 700; color: #1a1a1a; }
  .stat-card .label { font-size: 11px; color: #666; margin-top: 4px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 20px; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.06); }
  th { background: #f8f9fa; padding: 10px 12px; font-size: 12px; font-weight: 600; color: #444; border-bottom: 2px solid #e9ecef; text-align: right; }
  .section-title { font-size: 15px; font-weight: 700; margin: 20px 0 10px; padding-right: 8px; border-right: 3px solid #d4a853; }
  .footer { margin-top: 30px; padding-top: 15px; border-top: 1px solid #e9ecef; text-align: center; font-size: 11px; color: #999; }
  @media print { body { padding: 0; } .no-print { display: none; } }
</style></head><body>
<div class="header">
  <h1>تقرير الإحصائيات — منصة طيف</h1>
  <p>الفترة: ${esc(fromDate.toLocaleDateString("ar-DZ"))} — ${esc(toDate.toLocaleDateString("ar-DZ"))}</p>
</div>
<div class="stats-grid">
  <div class="stat-card"><div class="value">${totalOrders}</div><div class="label">إجمالي الطلبات</div></div>
  <div class="stat-card"><div class="value">${formatNumber(totalRevenue)}</div><div class="label">الإيرادات (د.ج)</div></div>
  <div class="stat-card"><div class="value">${formatNumber(profit)}</div><div class="label">صافي الربح (د.ج)</div></div>
  <div class="stat-card"><div class="value">${formatNumber(totalExpenses)}</div><div class="label">المصاريف (د.ج)</div></div>
</div>
<div class="section-title">توزيع الحالات</div>
<table><thead><tr><th>الحالة</th><th style="text-align:center">العدد</th></tr></thead><tbody>${statusHtml || '<tr><td colspan="2" style="padding:12px;text-align:center;color:#999;">لا توجد بيانات</td></tr>'}</tbody></table>
<div class="section-title">أكثر الخدمات طلباً</div>
<table><thead><tr><th>#</th><th>الخدمة</th><th style="text-align:center">الطلبات</th><th style="text-align:center">الإيرادات</th></tr></thead><tbody>${servicesHtml || '<tr><td colspan="4" style="padding:12px;text-align:center;color:#999;">لا توجد بيانات</td></tr>'}</tbody></table>
<div class="section-title">الإيرادات اليومية</div>
<table><thead><tr><th>التاريخ</th><th style="text-align:center">الطلبات</th><th style="text-align:center">الإيرادات</th></tr></thead><tbody>${dailyHtml || '<tr><td colspan="3" style="padding:12px;text-align:center;color:#999;">لا توجد بيانات</td></tr>'}</tbody></table>
<div class="footer">
  <p>تم إنشاء هذا التقرير تلقائياً بواسطة منصة طيف — ${new Date().toLocaleString("ar-DZ")}</p>
</div>
<div class="no-print" style="text-align:center;margin-top:20px;">
  <button onclick="window.print()" style="padding:10px 24px;background:#d4a853;color:white;border:none;border-radius:8px;font-family:Cairo;font-size:14px;font-weight:600;cursor:pointer;">طباعة أو حفظ كـ PDF</button>
</div>
</body></html>`;

    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `inline; filename="tayf-report-${fromDate.toISOString().slice(0, 10)}.html"`,
      },
    });
  } catch (e) {
    console.error("[admin/pdf-report] error:", e);
    return NextResponse.json({ error: "فشل في إنشاء التقرير" }, { status: 500 });
  }
}
