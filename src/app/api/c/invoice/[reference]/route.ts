import { NextRequest, NextResponse } from "next/server";
import { tursoQuery, toNum, safeJson } from "@/lib/turso-lite";
import {
  translateOptionKey,
  translateOptionValue,
} from "@/lib/option-translations";
import { STATUS_META, formatDateTimeAr } from "@/lib/print-config";
import { getCountry } from "@/lib/countries";

const EXCLUDED_KEYS = ["notes", "printRange", "pageRange", "totalPages", "appliedOffer", "pages", "copies"];
const SERVICE_NAMES: Record<string, string> = {
  document: "طباعة مستندات",
  photo: "طباعة صور",
  binding: "تجليد",
  copy: "نسخ مستندات",
  card: "طباعة بطاقات",
  poster: "طباعة ملصقات",
  "custom-design": "تصميم مخصص",
};
const SERVICE_ICONS: Record<string, string> = { document: "📄", photo: "🖼️", binding: "📚", copy: "📋", card: "🪪", poster: "📜", "custom-design": "🎨" };

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ reference: string }> }
) {
  try {
    const { reference } = await params;
    const format = req.nextUrl.searchParams.get("format"); // ?format=json for API consumers

    const rows = await tursoQuery<Record<string, unknown>>(
      `SELECT
        id, reference, "serviceType", "serviceName",
        "fileName", "fileType", "fileSize",
        options, customer, delivery, pricing,
        "estimatedHours", status, pages, copies, total, cost,
        "createdAt", "updatedAt", "readyAt", "deliveredAt",
        "startedPrintingAt", "completedPrintingAt",
        tags, "adminNotes", "shopId"
      FROM "PrintOrder" WHERE reference = ?`,
      [reference]
    );

    if (rows.length === 0) {
      if (format === "json") {
        return NextResponse.json({ error: "الطلب غير موجود" }, { status: 404 });
      }
      return new NextResponse(`
        <!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="UTF-8">
        <meta name="viewport" content="width=device-width,initial-scale=1.0">
        <title>فاتورة غير موجودة</title>
        <style>
          body{font-family:'Cairo','Tajawal',sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#f8f9fa;color:#6b7280;}
          .box{text-align:center;padding:48px;background:#fff;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,0.08);}
          .icon{font-size:48px;margin-bottom:16px;}
          h2{margin:0 0 8px;font-size:20px;color:#1a1a2e;}
          p{margin:0;font-size:14px;}
        </style></head><body><div class="box"><div class="icon">📝</div><h2>الطلب غير موجود</h2><p>رقم المرجع: <strong>${reference}</strong></p></div></body></html>
      `, { headers: { "Content-Type": "text/html; charset=utf-8" } });
    }

    const o = rows[0];

    // If JSON format requested, return JSON
    if (format === "json") {
      return NextResponse.json({
        order: {
          id: o.id,
          reference: o.reference,
          serviceType: o.serviceType,
          serviceName: o.serviceName,
          fileName: (o.fileName as string) || null,
          fileType: (o.fileType as string) || null,
          fileSize: o.fileSize != null ? toNum(o.fileSize) : null,
          options: safeJson(o.options as string, {}),
          customer: safeJson(o.customer as string, {}),
          delivery: safeJson((o as Record<string, unknown>).delivery as string, {}),
          pricing: safeJson((o as Record<string, unknown>).pricing as string, {}),
          estimatedHours: toNum(o.estimatedHours),
          status: o.status,
          pages: toNum(o.pages),
          copies: toNum(o.copies),
          total: toNum(o.total),
          createdAt: o.createdAt,
          shopId: o.shopId,
        },
      });
    }

    // ─── Build beautiful HTML invoice ───
    const shopId = o.shopId as string | null;
    let shopName = "طيف";
    let shopPhone = "";
    let shopEmail = "";
    let shopAddress = "";
    let shopLogoUrl = "";
    let currencySymbol = "";

    if (shopId) {
      const shopRows = await tursoQuery<Record<string, unknown>>(
        `SELECT name, phone, email, address, "logoUrl", country, "customCurrency" FROM "Shop" WHERE id = ? LIMIT 1`,
        [shopId]
      );
      const shop = shopRows[0];
      if (shop) {
        shopName = String(shop.name || "طيف");
        shopPhone = String(shop.phone || "");
        shopEmail = String(shop.email || "");
        shopAddress = String(shop.address || "");
        shopLogoUrl = String(shop.logoUrl || "");
        const cc = String(shop.country || "DZ");
        currencySymbol = getCountry(cc)?.currencySymbol || "";
        const customCur = shop.customCurrency as string | null;
        if (customCur) currencySymbol = customCur;
      }
    }

    const options = safeJson<Record<string, unknown>>(o.options as string, {});
    const customer = safeJson<Record<string, string>>(o.customer as string, {});
    const delivery = safeJson<Record<string, string>>(
      (o as Record<string, unknown>).delivery as string,
      {}
    );
    const pricing = safeJson<Record<string, number>>(
      (o as Record<string, unknown>).pricing as string,
      {}
    );
    const meta = STATUS_META[String(o.status)] || { label: "جديد" };
    const st = String(o.serviceType);
    const sName = SERVICE_NAMES[st] || String(o.serviceName) || "طباعة";
    const sIcon = SERVICE_ICONS[st] || "🖨️";

    const optionRows = Object.entries(options)
      .filter(([k, v]) => v !== undefined && v !== null && v !== "" && !EXCLUDED_KEYS.includes(k))
      .map(
        ([k, v]) =>
          `<div class="opt-row"><span class="opt-key">${translateOptionKey(k)}</span><span class="opt-val">${translateOptionValue(String(v))}</span></div>`
      )
      .join("");

    const cur = currencySymbol;
    const pages = Number(o.pages) || 0;
    const copies = Number(o.copies) || 0;
    const priceRows: string[] = [];
    priceRows.push(
      `<div class="prow"><span>${sName} (${pages > 0 ? pages + " صفحة × " : ""}${copies} نسخة)</span><span class="pamt">${Number(pricing.copiesCost || pricing.pagesCost || 0).toFixed(2)} ${cur}</span></div>`
    );
    if (Number(pricing.sidesSaving) > 0)
      priceRows.push(
        `<div class="prow disc"><span>توفير الطباعة على الوجهين</span><span class="pamt">−${Number(pricing.sidesSaving).toFixed(2)} ${cur}</span></div>`
      );
    const finishCost =
      (Number(pricing.finishingCost) || 0) +
      (Number(pricing.paperTypeSurcharge) || 0) +
      (Number(pricing.bindingCost) || 0) +
      (Number(pricing.extrasCost) || 0);
    if (finishCost > 0)
      priceRows.push(
        `<div class="prow"><span>التشطيب والتغليف</span><span class="pamt">${finishCost.toFixed(2)} ${cur}</span></div>`
      );
    if (Number(pricing.deliveryCost) > 0)
      priceRows.push(
        `<div class="prow"><span>رسوم التوصيل</span><span class="pamt">${Number(pricing.deliveryCost).toFixed(2)} ${cur}</span></div>`
      );
    if (Number(pricing.discount) > 0)
      priceRows.push(
        `<div class="prow disc"><span>خصم الكمية</span><span class="pamt">−${Number(pricing.discount).toFixed(2)} ${cur}</span></div>`
      );

    const delivLabels: Record<string, string> = {
      hour: "خلال ساعة ⚡",
      today: "اليوم",
      tomorrow: "غداً",
      scheduled: "في موعد محدد",
      pickup: "من المتجر",
    };
    const countLabel =
      st === "photo" || st === "card" || st === "poster"
        ? `<div class="opt-row"><span class="opt-key">العدد</span><span class="opt-val">${copies}</span></div>`
        : `<div class="opt-row"><span class="opt-key">عدد الصفحات</span><span class="opt-val">${pages}</span></div><div class="opt-row"><span class="opt-key">عدد النسخ</span><span class="opt-val">${copies}</span></div>`;

    const createdAt = String(o.createdAt || new Date().toISOString());
    const estimatedHours = Number(o.estimatedHours) || 0;
    const total = Number(o.total) || 0;
    const fileName = String(o.fileName || "");
    const fileSizeNum = Number(o.fileSize) || 0;

    const logoSrc = shopLogoUrl;

    const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>فاتورة ${o.reference} — ${shopName}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap" rel="stylesheet">
<style>
  @page { margin: 10mm; size: A4; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Cairo', 'Tajawal', 'Segoe UI', 'Noto Sans Arabic', Tahoma, sans-serif;
    background: #f0f2f5;
    min-height: 100vh;
    display: flex;
    justify-content: center;
    padding: 20px;
    -webkit-font-smoothing: antialiased;
    text-rendering: optimizeLegibility;
  }

  .invoice {
    width: 100%;
    max-width: 800px;
    background: #ffffff;
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 4px 24px rgba(0,0,0,0.08);
  }

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
    font-family: 'Cairo', monospace;
    letter-spacing: 0.5px;
  }
  .invoice-meta .date {
    color: rgba(255,255,255,0.45);
    font-size: 11px;
    margin-top: 4px;
  }

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
  <div class="header">
    <div class="brand">
      ${logoSrc ? `<div class="brand-logo"><img src="${logoSrc}" alt="${shopName}" onerror="this.parentElement.classList.add('fallback');this.remove();" /></div>` : `<div class="brand-logo fallback">🖨️</div>`}
      <div class="brand-text">
        <h1>${shopName}</h1>
        <p>${shopAddress || "خدمة طباعة احترافية"}</p>
      </div>
    </div>
    <div class="invoice-meta">
      <div class="tag">فاتورة</div>
      <div class="ref">${o.reference}</div>
      <div class="date">${formatDateTimeAr(createdAt)}</div>
    </div>
  </div>

  <div class="status-bar">
    <div>
      <span class="label">رقم الطلب: </span>
      <strong>${o.reference}</strong>
    </div>
    <div class="status-badge">${meta.label}</div>
  </div>

  <div class="content">
    <div class="cards-grid">
      <div class="card">
        <div class="card-header">👤 بيانات العميل</div>
        <div class="card-body">
          <div class="opt-row"><span class="opt-key">الاسم</span><span class="opt-val">${customer.name || "—"}</span></div>
          <div class="opt-row"><span class="opt-key">الهاتف</span><span class="opt-val" dir="ltr">${customer.phone || "—"}</span></div>
          <div class="opt-row"><span class="opt-key">طريقة الاستلام</span><span class="opt-val">${delivery.mode === "delivery" ? "🛵 توصيل" : "🏪 من المتجر"}</span></div>
          ${delivery.date ? `<div class="opt-row"><span class="opt-key">موعد التوصيل</span><span class="opt-val">${delivery.date}</span></div>` : ""}
        </div>
      </div>

      <div class="card">
        <div class="card-header">${sIcon} ${st === "photo" ? "مواصفات الصورة" : st === "card" ? "مواصفات البطاقة" : st === "poster" ? "مواصفات الملصق" : st === "binding" ? "مواصفات التجليد" : "مواصفات الطباعة"}</div>
        <div class="card-body">
          <div class="opt-row"><span class="opt-key">نوع الخدمة</span><span class="opt-val">${sName}</span></div>
          ${countLabel}
          ${optionRows}
          ${fileName ? `<div class="opt-row"><span class="opt-key">اسم الملف</span><span class="opt-val" style="font-size:10px;max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${fileName}</span></div>` : ""}
          ${fileSizeNum > 0 ? `<div class="opt-row"><span class="opt-key">حجم الملف</span><span class="opt-val">${(fileSizeNum / 1024).toFixed(1)} KB</span></div>` : ""}
          <div class="opt-row"><span class="opt-key">موعد التسليم</span><span class="opt-val">${delivLabels[delivery.mode] || delivery.mode || "—"}</span></div>
          ${estimatedHours > 0 ? `<div class="opt-row"><span class="opt-key">الوقت المتوقع</span><span class="opt-val">${estimatedHours} ساعة</span></div>` : ""}
        </div>
      </div>
    </div>

    <div class="pricing-section">
      <div class="pricing-header">
        <span>البيان</span>
        <span>المبلغ</span>
      </div>
      <div class="pricing-body">
        ${priceRows.join("")}
      </div>
    </div>

    <div class="total-box">
      <span class="total-label">المجموع الإجمالي</span>
      <span class="total-amount">${total.toLocaleString("ar-SA")} ${cur}</span>
    </div>

    <div class="notes-box">
      <p>• هذا السعر تقديري وسيتم تأكيده النهائي بعد مراجعة الملف</p>
      <p>• سيتم التواصل معك قبل بدء الطباعة لتأكيد التفاصيل</p>
      <p>• احتفظ برقم الطلب (${o.reference}) لتتبع حالته في أي وقت</p>
    </div>
  </div>

  <div class="footer">
    <div class="footer-info">
      <strong>${shopName}</strong>${shopAddress ? ` · ${shopAddress}` : ""}${shopPhone ? ` · ${shopPhone}` : ""}${shopEmail ? ` · ${shopEmail}` : ""}
    </div>
  </div>
</div>

</body>
</html>`;

    return new NextResponse(html, {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  } catch (e) {
    console.error("[c/invoice/GET]", e);
    return new NextResponse(
      `<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="UTF-8">
      <meta name="viewport" content="width=device-width,initial-scale=1.0"><title>خطأ</title>
      <style>body{font-family:'Cairo',sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#fef2f2;color:#991b1b;}.box{text-align:center;padding:48px;background:#fff;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,0.08);}.icon{font-size:48px;margin-bottom:16px;}h2{margin:0 0 8px;font-size:20px;}p{margin:0;font-size:14px;opacity:0.8;}</style></head><body><div class="box"><div class="icon">⚠️</div><h2>حدث خطأ</h2><p>حدث خطأ أثناء إنشاء الفاتورة، يرجى المحاولة لاحقاً</p></div></body></html>`,
      { headers: { "Content-Type": "text/html; charset=utf-8" }, status: 500 }
    );
  }
}
