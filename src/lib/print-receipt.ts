import type { PrintOrderLite } from "@/lib/order-types";

export function printReceipt(
  order: PrintOrderLite,
  shopName: string,
  shopPhone: string,
  shopAddress: string | null,
) {
  const w = window.open("", "_blank", "width=350,height=600");
  if (!w) return;

  const meta = getStatusMeta(order.status);
  const optionsSummary = buildOptionsSummary(order);
  const dateStr = new Date(order.createdAt).toLocaleString("ar-SA", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  w.document.write(`<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Courier New', 'Menlo', monospace;
    max-width: 300px;
    margin: 0 auto;
    padding: 12px 8px;
    font-size: 12px;
    line-height: 1.6;
    color: #000;
    direction: rtl;
  }
  .center { text-align: center; }
  .bold { font-weight: 700; }
  .sep { border-top: 1px dashed #000; margin: 8px 0; }
  .row { display: flex; justify-content: space-between; margin: 2px 0; }
  .status-badge {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 11px;
    font-weight: 600;
  }
  .status-pending { background: #fef3c7; color: #92400e; }
  .status-confirmed { background: #dbeafe; color: #1e40af; }
  .status-printing { background: #e0e7ff; color: #3730a3; }
  .status-ready { background: #d1fae5; color: #065f46; }
  .status-delivered { background: #f0fdf4; color: #166534; }
  .status-cancelled { background: #fee2e2; color: #991b1b; }
  .qr-placeholder {
    text-align: center;
    font-size: 10px;
    color: #666;
    border: 1px dashed #999;
    padding: 8px;
    margin: 6px auto;
    width: fit-content;
  }
  @media print {
    body { margin: 0; padding: 8px 4px; }
  }
</style></head><body>
  <div class="center bold" style="font-size:16px;">${esc(shopName)}</div>
  ${shopPhone ? `<div class="center" style="font-size:11px;">${esc(shopPhone)}</div>` : ""}
  ${shopAddress ? `<div class="center" style="font-size:11px;">${esc(shopAddress)}</div>` : ""}
  <div class="sep"></div>

  <div class="row"><span>الرقم:</span><span class="bold">${esc(order.reference)}</span></div>
  <div class="row"><span>العميل:</span><span>${esc(order.customer.name)}</span></div>
  <div class="row"><span>الهاتف:</span><span dir="ltr">${esc(order.customer.phone)}</span></div>
  <div class="sep"></div>

  <div class="bold" style="margin-bottom:4px;">${esc(order.serviceName)}</div>
  ${optionsSummary}
  <div class="sep"></div>

  <div class="row"><span>الصفحات:</span><span>${order.pages} × ${order.copies} نسخة</span></div>
  ${order.pricing.discount ? `<div class="row"><span>الخصم:</span><span>-${order.pricing.discount} ر.س</span></div>` : ""}
  ${order.pricing.deliveryCost ? `<div class="row"><span>التوصيل:</span><span>${order.pricing.deliveryCost} ر.س</span></div>` : ""}
  <div class="row bold"><span>الإجمالي:</span><span>${order.total} ر.س</span></div>
  <div class="sep"></div>

  <div class="center">
    <span class="status-badge ${meta.cls}">${meta.label}</span>
  </div>
  <div class="center" style="font-size:11px; margin-top:4px;">${dateStr}</div>
  <div class="sep"></div>

  <div class="center bold" style="font-size:13px;">شكراً لزيارتكم</div>
  <div class="qr-placeholder">QR</div>

  <script>window.onload=function(){window.print();}</script>
</body></html>`);
  w.document.close();
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

interface StatusInfo {
  label: string;
  cls: string;
}

function getStatusMeta(status: string): StatusInfo {
  const map: Record<string, StatusInfo> = {
    pending: { label: "⏳ قيد الانتظار", cls: "status-pending" },
    confirmed: { label: "✅ مؤكد", cls: "status-confirmed" },
    printing: { label: "🖨️ قيد الطباعة", cls: "status-printing" },
    ready: { label: "📦 جاهز", cls: "status-ready" },
    delivered: { label: "🎉 تم التسليم", cls: "status-delivered" },
    cancelled: { label: "❌ ملغي", cls: "status-cancelled" },
  };
  return map[status] || { label: status, cls: "" };
}

function buildOptionsSummary(order: PrintOrderLite): string {
  const labels: Record<string, string> = {
    color: "اللون",
    paperSize: "حجم الورق",
    sides: "الوجهين",
    binding: "التجليد",
    paperType: "نوع الورق",
  };
  const parts: string[] = [];
  for (const [key, label] of Object.entries(labels)) {
    const val = (order.options as Record<string, unknown>)[key];
    if (val && String(val)) {
      parts.push(`<div class="row"><span>${label}:</span><span>${esc(String(val))}</span></div>`);
    }
  }
  return parts.join("");
}