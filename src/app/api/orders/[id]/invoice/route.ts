import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  translateOptionKey,
  translateOptionValue,
} from "@/lib/option-translations";
import { STATUS_META, formatDateTimeAr } from "@/lib/print-config";
import { getCountry, formatCurrency } from "@/lib/countries";
import { orderFindWhere } from "@/lib/order-lookup";

const EXCLUDED_KEYS = ["notes","printRange","pageRange","totalPages","appliedOffer","pages","copies"];
const SERVICE_NAMES: Record<string,string> = { document:"طباعة مستندات", photo:"طباعة صور", binding:"تجليد", copy:"نسخ مستندات", card:"طباعة بطاقات", poster:"طباعة ملصقات" };
const SERVICE_ICONS: Record<string,string> = { document:"📄", photo:"🖼️", binding:"📚", copy:"📋", card:"🪪", poster:"📜" };

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const shopId = req.nextUrl.searchParams.get("shopId");
    const findWhere = orderFindWhere(id, shopId);
    const order = await db.printOrder.findFirst({ where: findWhere });
    if (!order) return NextResponse.json({ error: "الطلب غير موجود" }, { status: 404 });

    // جلب بيانات المتجر إن وجد shopId
    let shopName = "طيف";
    let shopPhone = "";
    let shopEmail = "";
    let shopAddress = "";
    let shopLogoUrl = "";
    let currencySymbol = "";
    if (shopId) {
      const shop = await db.shop.findUnique({ where: { id: shopId } });
      if (shop) {
        shopName = shop.name || "طيف";
        shopPhone = shop.phone || "";
        shopEmail = shop.email || "";
        shopAddress = shop.address || "";
        shopLogoUrl = shop.logoUrl || "";
        currencySymbol = getCountry(shop.country)?.currencySymbol || "";
      }
    }

    // جلب شعار المنصة كـ fallback
    let platformLogo = "";
    try {
      const rows = await db.$queryRawUnsafe<Array<{ platformSettings: string }>>`
        SELECT platformSettings FROM "SuperAdmin" WHERE key = 'main' LIMIT 1
      `;
      if (rows[0]?.platformSettings) {
        const s = JSON.parse(rows[0].platformSettings);
        platformLogo = s.platformLogo || "";
      }
    } catch {}

    const logoSrc = shopLogoUrl || platformLogo || "";

    const options = JSON.parse(order.options);
    const customer = JSON.parse(order.customer);
    const delivery = JSON.parse(order.delivery);
    const pricing = JSON.parse(order.pricing);
    const meta = STATUS_META[order.status] || { label: "—" };
    const st = order.serviceType;
    const sName = SERVICE_NAMES[st] || order.serviceName;
    const sIcon = SERVICE_ICONS[st] || "🖨️";

    const optionRows = Object.entries(options)
      .filter(([k,v]) => v !== undefined && v !== null && v !== "" && !EXCLUDED_KEYS.includes(k))
      .map(([k,v]) => `<div class="opt-row"><span class="opt-key">${translateOptionKey(k)}</span><span class="opt-val">${translateOptionValue(String(v))}</span></div>`)
      .join("");

    const cur = currencySymbol;
    const priceRows: string[] = [];
    priceRows.push(`<div class="prow"><span>${sName} (${order.pages > 0 ? order.pages + " صفحة × " : ""}${order.copies} نسخة)</span><span class="pamt">${pricing.copiesCost} ${cur}</span></div>`);
    if (pricing.sidesSaving > 0) priceRows.push(`<div class="prow disc"><span>توفير الطباعة على الوجهين</span><span class="pamt">−${pricing.sidesSaving} ${cur}</span></div>`);
    const finishCost = (pricing.finishingCost || 0) + (pricing.paperTypeSurcharge || 0) + (pricing.bindingCost || 0) + (pricing.extrasCost || 0);
      if (finishCost > 0) priceRows.push(`<div class="prow"><span>التشطيب والتغليف</span><span class="pamt">${finishCost} ${cur}</span></div>`);
    if (pricing.deliveryCost > 0) priceRows.push(`<div class="prow"><span>رسوم التوصيل</span><span class="pamt">${pricing.deliveryCost} ${cur}</span></div>`);
    if (pricing.discount > 0) priceRows.push(`<div class="prow disc"><span>خصم الكمية</span><span class="pamt">−${pricing.discount} ${cur}</span></div>`);

    const delivLabels: Record<string,string> = { hour:"خلال ساعة ⚡", today:"اليوم", tomorrow:"غداً", scheduled:"في موعد محدد" };
    const countLabel = (st === "photo" || st === "card" || st === "poster")
      ? `<div class="opt-row"><span class="opt-key">العدد</span><span class="opt-val">${order.copies}</span></div>`
      : `<div class="opt-row"><span class="opt-key">عدد الصفحات</span><span class="opt-val">${order.pages}</span></div><div class="opt-row"><span class="opt-key">عدد النسخ</span><span class="opt-val">${order.copies}</span></div>`;

    const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>فاتورة ${order.reference} — ${shopName}</title>
<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
<style>
  @page { margin: 10mm; size: A4; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: "Cairo", "Segoe UI", Tahoma, sans-serif;
    background: #f0f2f5;
    min-height: 100vh;
    display: flex;
    justify-content: center;
    padding: 20px;
    -webkit-font-smoothing: antialiased;
  }

  .invoice {
    width: 100%;
    max-width: 800px;
    background: #ffffff;
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 4px 24px rgba(0,0,0,0.08);
  }

  /* === الرأس === */
  .header {
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
    padding: 32px 36px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    position: relative;
    overflow: hidden;
  }
  .header::after {
    content: "";
    position: absolute;
    top: -40%;
    left: -10%;
    width: 300px;
    height: 300px;
    background: radial-gradient(circle, rgba(212,175,55,0.1) 0%, transparent 70%);
    border-radius: 50%;
  }

  .brand {
    display: flex;
    align-items: center;
    gap: 14px;
    position: relative;
    z-index: 1;
  }
  .brand-logo {
    width: 52px;
    height: 52px;
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    overflow: hidden;
    flex-shrink: 0;
  }
  .brand-logo img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    padding: 4px;
  }
  .brand-logo.fallback {
    background: linear-gradient(135deg, #D4AF37, #E8C547);
    box-shadow: 0 4px 16px rgba(212,175,55,0.3);
  }
  .brand-text h1 {
    color: #ffffff;
    font-size: 20px;
    font-weight: 800;
    letter-spacing: -0.3px;
  }
  .brand-text p {
    color: rgba(255,255,255,0.5);
    font-size: 11px;
    margin-top: 2px;
  }

  .invoice-meta {
    text-align: left;
    position: relative;
    z-index: 1;
  }
  .invoice-meta .tag {
    display: inline-block;
    color: rgba(255,255,255,0.4);
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 2px;
    margin-bottom: 4px;
  }
  .invoice-meta .ref {
    color: #D4AF37;
    font-size: 22px;
    font-weight: 900;
    font-family: "Cairo", monospace;
    letter-spacing: 0.5px;
  }
  .invoice-meta .date {
    color: rgba(255,255,255,0.45);
    font-size: 11px;
    margin-top: 4px;
  }

  /* === شريط الحالة === */
  .status-bar {
    background: linear-gradient(90deg, #D4AF37 0%, #E8C547 100%);
    padding: 12px 36px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .status-bar .label {
    color: rgba(0,0,0,0.5);
    font-size: 12px;
    font-weight: 600;
  }
  .status-badge {
    background: #1a1a2e;
    color: #D4AF37;
    padding: 5px 14px;
    border-radius: 20px;
    font-size: 11px;
    font-weight: 700;
  }

  /* === المحتوى === */
  .content {
    padding: 28px 36px;
  }

  .cards-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
    margin-bottom: 24px;
  }

  .card {
    background: #fafafa;
    border-radius: 14px;
    overflow: hidden;
    border: 1px solid #f0f0f0;
  }
  .card-header {
    padding: 12px 18px;
    font-size: 12px;
    font-weight: 700;
    color: #D4AF37;
    background: #fff;
    border-bottom: 1px solid #f0f0f0;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .card-body {
    padding: 6px 18px 14px;
  }

  .opt-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 7px 0;
    border-bottom: 1px solid #f5f5f5;
  }
  .opt-row:last-child { border-bottom: none; }
  .opt-key {
    color: #888;
    font-size: 12px;
    font-weight: 500;
  }
  .opt-val {
    color: #1a1a2e;
    font-size: 12px;
    font-weight: 700;
  }

  /* === التسعير === */
  .pricing-section { margin-bottom: 20px; }
  .pricing-header {
    background: #1a1a2e;
    color: #D4AF37;
    padding: 10px 18px;
    border-radius: 10px 10px 0 0;
    font-size: 12px;
    font-weight: 700;
    display: flex;
    justify-content: space-between;
  }
  .pricing-body {
    border: 1px solid #f0f0f0;
    border-top: none;
    border-radius: 0 0 10px 10px;
    overflow: hidden;
  }
  .prow {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 18px;
    border-bottom: 1px solid #f5f5f5;
    font-size: 12px;
    color: #444;
  }
  .prow:last-child { border-bottom: none; }
  .prow.disc .pamt { color: #16a34a; font-weight: 700; }
  .pamt { font-weight: 700; color: #1a1a2e; }

  /* === المجموع === */
  .total-box {
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
    border-radius: 14px;
    padding: 20px 24px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    position: relative;
    overflow: hidden;
  }
  .total-box::before {
    content: "";
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 3px;
    background: linear-gradient(90deg, #D4AF37, #E8C547, #D4AF37);
  }
  .total-label {
    color: rgba(255,255,255,0.6);
    font-size: 13px;
    font-weight: 600;
  }
  .total-amount {
    color: #D4AF37;
    font-size: 28px;
    font-weight: 900;
  }

  /* === ملاحظات === */
  .notes-box {
    background: #fffbe6;
    border: 1px solid #f0e0a0;
    border-radius: 10px;
    padding: 14px 18px;
    margin-bottom: 16px;
  }
  .notes-box p {
    font-size: 11px;
    color: #7a6a20;
    line-height: 1.9;
  }

  /* === التذييل === */
  .footer {
    background: #1a1a2e;
    padding: 18px 36px;
    text-align: center;
  }
  .footer-info {
    color: rgba(255,255,255,0.4);
    font-size: 10px;
    line-height: 1.8;
  }
  .footer-info strong {
    color: #D4AF37;
  }

  /* === زر الطباعة === */
  .print-btn {
    position: fixed;
    top: 20px;
    left: 20px;
    background: linear-gradient(135deg, #D4AF37, #E8C547);
    color: #1a1a2e;
    border: none;
    padding: 10px 20px;
    border-radius: 10px;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    font-family: inherit;
    box-shadow: 0 4px 16px rgba(212,175,55,0.3);
    z-index: 100;
    transition: transform 0.2s;
  }
  .print-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(212,175,55,0.4);
  }

  @media (max-width: 640px) {
    .cards-grid { grid-template-columns: 1fr; }
    .header { padding: 24px 20px; flex-direction: column; gap: 14px; align-items: flex-start; }
    .invoice-meta { text-align: right; }
    .content { padding: 20px; }
    .status-bar { padding: 10px 20px; flex-wrap: wrap; gap: 8px; }
    .total-amount { font-size: 24px; }
  }

  @media print {
    body { background: #fff; padding: 0; }
    .invoice { box-shadow: none; border-radius: 0; max-width: 100%; }
    .no-print { display: none !important; }
  }
</style>
</head>
<body>
<button class="print-btn no-print" onclick="window.print()">🖨️ طباعة / حفظ PDF</button>

<div class="invoice">
  <!-- الرأس -->
  <div class="header">
    <div class="brand">
      ${logoSrc ? `<div class="brand-logo"><img src="${logoSrc}" alt="${shopName}" /></div>` : `<div class="brand-logo fallback">🖨️</div>`}
      <div class="brand-text">
        <h1>${shopName}</h1>
        <p>${shopAddress || "خدمة طباعة احترافية"}</p>
      </div>
    </div>
    <div class="invoice-meta">
      <div class="tag">فاتورة</div>
      <div class="ref">${order.reference}</div>
      <div class="date">${formatDateTimeAr(order.createdAt.toISOString())}</div>
    </div>
  </div>

  <!-- شريط الحالة -->
  <div class="status-bar">
    <div>
      <span class="label">رقم الطلب: </span>
      <strong>${order.reference}</strong>
    </div>
    <div class="status-badge">${meta.label}</div>
  </div>

  <!-- المحتوى -->
  <div class="content">
    <div class="cards-grid">
      <!-- بطاقة العميل -->
      <div class="card">
        <div class="card-header">👤 بيانات العميل</div>
        <div class="card-body">
          <div class="opt-row"><span class="opt-key">الاسم</span><span class="opt-val">${customer.name || "—"}</span></div>
          <div class="opt-row"><span class="opt-key">الهاتف</span><span class="opt-val" dir="ltr">${customer.phone || "—"}</span></div>
          ${customer.whatsapp ? `<div class="opt-row"><span class="opt-key">واتساب</span><span class="opt-val" dir="ltr">${customer.whatsapp}</span></div>` : ""}
          ${customer.email ? `<div class="opt-row"><span class="opt-key">البريد الإلكتروني</span><span class="opt-val" dir="ltr" style="font-size:11px">${customer.email}</span></div>` : ""}
          <div class="opt-row"><span class="opt-key">طريقة الاستلام</span><span class="opt-val">${customer.deliveryMethod === "delivery" ? "🛵 توصيل" : "🏪 من المتجر"}</span></div>
          ${customer.address ? `<div class="opt-row"><span class="opt-key">العنوان</span><span class="opt-val" style="font-size:11px">${customer.address}</span></div>` : ""}
        </div>
      </div>

      <!-- بطاقة المواصفات -->
      <div class="card">
        <div class="card-header">${sIcon} ${st === "photo" ? "مواصفات الصورة" : st === "card" ? "مواصفات البطاقة" : st === "poster" ? "مواصفات الملصق" : st === "binding" ? "مواصفات التجليد" : "مواصفات الطباعة"}</div>
        <div class="card-body">
          <div class="opt-row"><span class="opt-key">نوع الخدمة</span><span class="opt-val">${sName}</span></div>
          ${countLabel}
          ${optionRows}
          <div class="opt-row"><span class="opt-key">موعد التسليم</span><span class="opt-val">${delivLabels[delivery.mode] || delivery.mode || "—"}</span></div>
          <div class="opt-row"><span class="opt-key">الوقت المتوقع</span><span class="opt-val">${order.estimatedHours} ساعة</span></div>
          ${order.fileName ? `<div class="opt-row"><span class="opt-key">اسم الملف</span><span class="opt-val" style="font-size:10px;max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${order.fileName}</span></div>` : ""}
        </div>
      </div>
    </div>

    <!-- التسعير -->
    <div class="pricing-section">
      <div class="pricing-header">
        <span>البيان</span>
        <span>المبلغ</span>
      </div>
      <div class="pricing-body">
        ${priceRows.join("")}
      </div>
    </div>

    <!-- المجموع الإجمالي -->
    <div class="total-box">
      <span class="total-label">المجموع الإجمالي</span>
      <span class="total-amount">${pricing.total.toLocaleString("ar-DZ")} ${cur}</span>
    </div>

    <!-- ملاحظات -->
    ${options.notes ? `<div class="notes-box"><p><strong>📝 ملاحظات:</strong> ${options.notes}</p></div>` : ""}

    <div class="notes-box">
      <p>• هذا السعر تقديري وسيتم تأكيده النهائي بعد مراجعة الملف</p>
      <p>• سيتم التواصل معك قبل بدء الطباعة لتأكيد التفاصيل</p>
      <p>• احتفظ برقم الطلب (${order.reference}) لتتبع حالته في أي وقت</p>
    </div>
  </div>

  <!-- التذييل -->
  <div class="footer">
    <div class="footer-info">
      <strong>${shopName}</strong>${shopAddress ? ` · ${shopAddress}` : ""}${shopPhone ? ` · ${shopPhone}` : ""}${shopEmail ? ` · ${shopEmail}` : ""}
    </div>
  </div>
</div>

<script>
  window.onload = function() {
    setTimeout(function() { window.print(); }, 500);
  };
</script>
</body>
</html>`;

    return new NextResponse(html, {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  } catch (e) {
    console.error("[orders/[id]/invoice]", e);
    return NextResponse.json(
      { error: "حدث خطأ أثناء إنشاء الفاتورة" },
      { status: 500 }
    );
  }
}