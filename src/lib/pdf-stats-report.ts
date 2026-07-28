/**
 * توليد تقرير إحصائيات PDF كصفحة HTML قابلة للطباعة
 * يتبع نفس نهج print-receipt.ts و pdf-invoice.ts
 */

export interface StatsReportData {
  shopName: string;
  fromDate: string;
  toDate: string;
  totalOrders: number;
  totalRevenue: number;
  totalProfit: number;
  totalCost: number;
  totalExpenses: number;
  statusCounts: Record<string, number>;
  topServices: { serviceType: string; serviceName: string; count: number; revenue: number }[];
  dailyRevenue: { date: string; orders: number; revenue: number }[];
  currencySymbol: string;
}

/** ألوان حالات الطلبات */
const STATUS_COLORS: Record<string, string> = {
  pending: "#f59e0b",
  confirmed: "#0ea5e9",
  printing: "#6366f1",
  ready: "#10b981",
  delivered: "#22c55e",
  cancelled: "#ef4444",
};

/** أسماء حالات الطلبات بالعربية */
const STATUS_LABELS: Record<string, string> = {
  pending: "قيد الانتظار",
  confirmed: "مؤكد",
  printing: "قيد الطباعة",
  ready: "جاهز",
  delivered: "تم التسليم",
  cancelled: "ملغي",
};

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatNumber(n: number): string {
  return n.toLocaleString("ar-DZ");
}

function generateDailyChart(dailyRevenue: StatsReportData["dailyRevenue"], currencySymbol: string): string {
  if (dailyRevenue.length === 0) return '<p style="color:#888;text-align:center;">لا توجد بيانات</p>';

  const maxRevenue = Math.max(...dailyRevenue.map((d) => d.revenue), 1);
  const barWidth = Math.floor(600 / dailyRevenue.length);

  const bars = dailyRevenue
    .map((d) => {
      const height = Math.round((d.revenue / maxRevenue) * 150);
      const dayLabel = new Date(d.date + "T00:00:00").toLocaleDateString("ar-SA", {
        weekday: "short",
        day: "numeric",
      });
      return `
        <div style="display:flex;flex-direction:column;align-items:center;gap:4px;width:${barWidth}px;">
          <div style="font-size:10px;color:#666;">${formatNumber(d.revenue)} ${esc(currencySymbol)}</div>
          <div style="width:${Math.max(barWidth - 8, 20)}px;height:${height}px;background:linear-gradient(to top,#d4a853,#b8860b);border-radius:4px 4px 0 0;"></div>
          <div style="font-size:9px;color:#888;">${esc(dayLabel)}</div>
        </div>`;
    })
    .join("");

  return `
    <div style="display:flex;align-items:flex-end;justify-content:center;gap:4px;padding:16px 0;border-bottom:1px solid #e5e5e5;border-top:1px solid #e5e5e5;">
      ${bars}
    </div>`;
}

function generateStatusChart(statusCounts: Record<string, number>, totalOrders: number): string {
  const entries = Object.entries(statusCounts).filter(([, count]) => count > 0);
  if (entries.length === 0) return '<p style="color:#888;text-align:center;">لا توجد بيانات</p>';

  const total = entries.reduce((sum, [, count]) => sum + count, 0) || 1;
  const segments = entries
    .map(([status, count]) => {
      const pct = (count / total) * 100;
      const color = STATUS_COLORS[status] || "#888";
      const label = STATUS_LABELS[status] || status;
      return `
        <div style="flex:${pct};height:24px;background:${color};min-width:2px;" title="${esc(label)}: ${count}"></div>`;
    })
    .join("");

  const legend = entries
    .map(([status, count]) => {
      const pct = Math.round((count / total) * 100);
      const color = STATUS_COLORS[status] || "#888";
      const label = STATUS_LABELS[status] || status;
      return `
        <div style="display:flex;align-items:center;gap:6px;margin-left:16px;">
          <div style="width:12px;height:12px;border-radius:3px;background:${color};"></div>
          <span style="font-size:11px;">${esc(label)}</span>
          <span style="font-size:11px;color:#666;">(${count} — ${pct}%)</span>
        </div>`;
    })
    .join("");

  return `
    <div style="margin:8px 0;border-radius:6px;overflow:hidden;">
      <div style="display:flex;border-radius:6px;overflow:hidden;">${segments}</div>
      <div style="display:flex;flex-wrap:wrap;margin-top:8px;">${legend}</div>
    </div>`;
}

/**
 * فتح تقرير الإحصائيات في نافذة جديدة للطباعة أو الحفظ كـ PDF
 */
export function generateStatsReport(data: StatsReportData): void {
  const w = window.open("", "_blank", "width=800,height=1000");
  if (!w) return;

  const topServices = data.topServices.slice(0, 5);
  const topServicesHtml = topServices
    .map((s, i) => `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;font-weight:600;">${i + 1}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;">${esc(s.serviceName)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;text-align:center;">${s.count}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;text-align:center;">${formatNumber(s.revenue)} ${esc(data.currencySymbol)}</td>
      </tr>`)
    .join("");

  w.document.write(`<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="UTF-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Cairo', 'Segoe UI', sans-serif;
    max-width: 780px;
    margin: 0 auto;
    padding: 24px;
    color: #1a1a1a;
    direction: rtl;
  }
  .header {
    text-align: center;
    padding: 20px;
    background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
    border-radius: 12px;
    color: #d4a853;
    margin-bottom: 20px;
  }
  .header h1 { font-size: 22px; margin-bottom: 4px; }
  .header .subtitle { font-size: 13px; color: #aaa; }
  .header .date-range { font-size: 12px; color: #999; margin-top: 8px; }
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
    margin-bottom: 20px;
  }
  .stat-card {
    background: #fafafa;
    border: 1px solid #e5e5e5;
    border-radius: 10px;
    padding: 14px;
    text-align: center;
  }
  .stat-card .value { font-size: 20px; font-weight: 700; color: #1a1a1a; }
  .stat-card .label { font-size: 11px; color: #666; margin-top: 4px; }
  .stat-card.revenue .value { color: #059669; }
  .stat-card.profit .value { color: #d4a853; }
  .section {
    margin-bottom: 20px;
    background: #fff;
    border: 1px solid #e5e5e5;
    border-radius: 10px;
    padding: 16px;
  }
  .section h2 {
    font-size: 15px;
    color: #1a1a1a;
    margin-bottom: 12px;
    padding-bottom: 8px;
    border-bottom: 2px solid #d4a853;
  }
  table { width: 100%; border-collapse: collapse; }
  th {
    padding: 8px 12px;
    text-align: right;
    font-size: 12px;
    color: #666;
    border-bottom: 2px solid #e5e5e5;
  }
  th.center { text-align: center; }
  .footer {
    text-align: center;
    margin-top: 24px;
    padding: 12px;
    font-size: 11px;
    color: #999;
    border-top: 1px solid #e5e5e5;
  }
  .footer .brand { color: #d4a853; font-weight: 600; }
  @media print {
    body { margin: 0; padding: 16px; }
    .no-print { display: none; }
  }
  @media (max-width: 600px) {
    .stats-grid { grid-template-columns: repeat(2, 1fr); }
  }
</style></head><body>

  <div class="header">
    <h1>📊 تقرير الإحصائيات</h1>
    <div class="subtitle">${esc(data.shopName)}</div>
    <div class="date-range">الفترة: ${esc(data.fromDate)} ← ${esc(data.toDate)}</div>
  </div>

  <div class="stats-grid">
    <div class="stat-card">
      <div class="value">${formatNumber(data.totalOrders)}</div>
      <div class="label">إجمالي الطلبات</div>
    </div>
    <div class="stat-card revenue">
      <div class="value">${formatNumber(data.totalRevenue)}</div>
      <div class="label">الإيرادات (${esc(data.currencySymbol)})</div>
    </div>
    <div class="stat-card profit">
      <div class="value">${formatNumber(data.totalProfit)}</div>
      <div class="label">صافي الربح (${esc(data.currencySymbol)})</div>
    </div>
    <div class="stat-card">
      <div class="value">${formatNumber(data.totalCost)}</div>
      <div class="label">التكاليف (${esc(data.currencySymbol)})</div>
    </div>
  </div>

  <div class="section">
    <h2>توزيع حالات الطلبات</h2>
    ${generateStatusChart(data.statusCounts, data.totalOrders)}
  </div>

  <div class="section">
    <h2>الإيرادات اليومية</h2>
    ${generateDailyChart(data.dailyRevenue, data.currencySymbol)}
  </div>

  ${topServices.length > 0 ? `
  <div class="section">
    <h2>أكثر 5 خدمات طلباً</h2>
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>الخدمة</th>
          <th class="center">عدد الطلبات</th>
          <th class="center">الإيرادات</th>
        </tr>
      </thead>
      <tbody>
        ${topServicesHtml}
      </tbody>
    </table>
  </div>` : ""}

  <div class="footer">
    <span class="brand">طيف</span> — منصة إدارة المطابع الذكية | تم إنشاء هذا التقرير تلقائياً
  </div>

  <div class="no-print" style="text-align:center;margin-top:16px;">
    <button onclick="window.print()" style="
      padding: 10px 28px;
      background: linear-gradient(135deg, #d4a853, #b8860b);
      color: #fff;
      border: none;
      border-radius: 8px;
      font-family: Cairo, sans-serif;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
    ">🖨️ طباعة / حفظ كـ PDF</button>
  </div>

  <script>window.onload=function(){setTimeout(()=>{window.print()},500);}</script>
</body></html>`);
  w.document.close();
}
