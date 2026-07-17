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
const SERVICE_NAMES: Record<string,string> = { document:"طباعة مستند", photo:"طباعة صور", binding:"تجليد", copy:"نسخ مستندات", card:"بطاقات", poster:"ملصقات" };
const SERVICE_ICONS: Record<string,string> = { document:"🖨️", photo:"🖼️", binding:"📚", copy:"📄", card:"🪪", poster:"📜" };

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
    let currencySymbol = "";
    if (shopId) {
      const shop = await db.shop.findUnique({ where: { id: shopId } });
      if (shop) {
        shopName = shop.name;
        shopPhone = shop.phone || "";
        shopEmail = shop.email || "";
        shopAddress = shop.address || "";
        currencySymbol = getCountry(shop.country)?.currencySymbol || "";
      }
    }

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
    priceRows.push(`<div class="prow"><span>${sName} (${order.pages > 0 ? order.pages + " × " : ""}${order.copies} نسخة)</span><span class="pamt">${pricing.copiesCost} ${cur}</span></div>`);
    if (pricing.sidesSaving > 0) priceRows.push(`<div class="prow disc"><span>توفير الوجهين</span><span class="pamt">−${pricing.sidesSaving} ${cur}</span></div>`);
    const finishCost = (pricing.finishingCost || 0) + (pricing.paperTypeSurcharge || 0) + (pricing.bindingCost || 0) + (pricing.extrasCost || 0);
      if (finishCost > 0) priceRows.push(`<div class="prow"><span>التشطيب والتغليف</span><span class="pamt">${finishCost} ${cur}</span></div>`);
    if (pricing.deliveryCost > 0) priceRows.push(`<div class="prow"><span>توصيل عاجل ⚡</span><span class="pamt">${pricing.deliveryCost} ${cur}</span></div>`);
    if (pricing.discount > 0) priceRows.push(`<div class="prow disc"><span>خصم الكمية</span><span class="pamt">−${pricing.discount} ${cur}</span></div>`);

    const delivLabels: Record<string,string> = { hour:"خلال ساعة ⚡", today:"اليوم", tomorrow:"غداً", scheduled:"تاريخ محدد" };
    const countLabel = (st === "photo" || st === "card" || st === "poster")
      ? `<div class="opt-row"><span class="opt-key">العدد</span><span class="opt-val">${order.copies}</span></div>`
      : `<div class="opt-row"><span class="opt-key">عدد الصفحات</span><span class="opt-val">${order.pages}</span></div><div class="opt-row"><span class="opt-key">عدد النسخ</span><span class="opt-val">${order.copies}</span></div>`;

    const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>فاتورة ${order.reference} — طيف</title>
<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap" rel="stylesheet">
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:"Cairo","Segoe UI",Tahoma,sans-serif;background:linear-gradient(135deg,#0a0a0a 0%,#1a1a1a 50%,#0a0a0a 100%);min-height:100vh;padding:24px;display:flex;justify-content:center;align-items:flex-start}
  .invoice{width:100%;max-width:820px;background:#fff;border-radius:24px;overflow:hidden;box-shadow:0 24px 80px rgba(0,0,0,.4),0 0 0 1px rgba(212,175,55,.2)}
  .hero{background:linear-gradient(135deg,#1a1a1a 0%,#2a2a2a 100%);padding:40px 40px 32px;position:relative;overflow:hidden}
  .hero::before{content:"";position:absolute;top:-50%;right:-20%;width:400px;height:400px;background:radial-gradient(circle,rgba(212,175,55,.15) 0%,transparent 70%);border-radius:50%}
  .hero::after{content:"";position:absolute;bottom:-30%;left:-10%;width:300px;height:300px;background:radial-gradient(circle,rgba(212,175,55,.08) 0%,transparent 70%);border-radius:50%}
  .hero-inner{position:relative;z-index:1;display:flex;justify-content:space-between;align-items:center}
  .brand{display:flex;align-items:center;gap:16px}
  .brand-icon{width:56px;height:56px;background:linear-gradient(135deg,#D4AF37,#E8C547);border-radius:16px;display:flex;align-items:center;justify-content:center;font-size:28px;box-shadow:0 8px 24px rgba(212,175,55,.3)}
  .brand-text h1{color:#fff;font-size:22px;font-weight:800;letter-spacing:-.5px}
  .brand-text p{color:rgba(255,255,255,.5);font-size:12px;margin-top:4px}
  .invoice-badge{text-align:left}
  .invoice-badge .label{color:rgba(255,255,255,.4);font-size:11px;text-transform:uppercase;letter-spacing:2px}
  .invoice-badge .title{color:#D4AF37;font-size:28px;font-weight:900;margin-top:4px}
  .invoice-badge .date{color:rgba(255,255,255,.5);font-size:11px;margin-top:6px}
  .ref-strip{background:linear-gradient(90deg,#D4AF37 0%,#E8C547 100%);padding:14px 40px;display:flex;justify-content:space-between;align-items:center}
  .ref-strip .ref-label{color:rgba(0,0,0,.6);font-size:12px;font-weight:600}
  .ref-strip .ref-num{color:#1a1a1a;font-size:20px;font-weight:900;font-family:monospace;letter-spacing:1px}
  .ref-strip .status{background:#1a1a1a;color:#D4AF37;padding:6px 16px;border-radius:24px;font-size:12px;font-weight:700}
  .content{padding:36px 40px}
  .grid{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:28px}
  .card{background:#fafafa;border-radius:16px;overflow:hidden;border:1px solid #f0f0f0}
  .card-head{padding:14px 20px;font-size:13px;font-weight:800;color:#D4AF37;border-bottom:1px solid #f0f0f0;display:flex;align-items:center;gap:8px}
  .card-body{padding:8px 20px 16px}
  .opt-row{display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid #f5f5f5}
  .opt-row:last-child{border-bottom:none}
  .opt-key{color:#888;font-size:13px}
  .opt-val{color:#1a1a1a;font-size:13px;font-weight:700}
  .price-section{margin-bottom:24px}
  .price-head{background:#1a1a1a;color:#D4AF37;padding:12px 20px;border-radius:12px 12px 0 0;font-size:13px;font-weight:800;display:flex;justify-content:space-between}
  .price-body{border:1px solid #f0f0f0;border-top:none;border-radius:0 0 12px 12px;overflow:hidden}
  .prow{display:flex;justify-content:space-between;align-items:center;padding:12px 20px;border-bottom:1px solid #f5f5f5;font-size:13px;color:#333}
  .prow:last-child{border-bottom:none}
  .prow.disc .pamt{color:#16a34a;font-weight:700}
  .pamt{font-weight:700;color:#1a1a1a}
  .total-box{background:linear-gradient(135deg,#1a1a1a 0%,#2a2a2a 100%);border-radius:16px;padding:24px 28px;display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;position:relative;overflow:hidden}
  .total-box::before{content:"";position:absolute;top:0;left:0;right:0;height:3px;background:linear-gradient(90deg,#D4AF37,#E8C547,#D4AF37)}
  .total-label{color:rgba(255,255,255,.6);font-size:14px;font-weight:600}
  .total-amount{color:#D4AF37;font-size:32px;font-weight:900}
  .notes-box{background:#fffbe6;border:1px solid #f0e0a0;border-radius:12px;padding:16px 20px;margin-bottom:20px}
  .notes-box p{font-size:12px;color:#7a6a20;line-height:1.8}
  .notes-box p::before{content:"› "}
  .footer{background:#1a1a1a;padding:20px 40px;text-align:center}
  .footer-info{color:rgba(255,255,255,.4);font-size:11px;line-height:1.8}
  .footer-info strong{color:#D4AF37}
  .print-btn{position:fixed;top:24px;left:24px;background:linear-gradient(135deg,#D4AF37,#E8C547);color:#1a1a1a;border:none;padding:12px 24px;border-radius:12px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;box-shadow:0 8px 24px rgba(212,175,55,.3);z-index:100;transition:transform .2s}
  .print-btn:hover{transform:translateY(-2px);box-shadow:0 12px 32px rgba(212,175,55,.4)}
  @media(max-width:640px){
    .grid{grid-template-columns:1fr}
    .hero{padding:28px 24px 24px}
    .content{padding:24px 20px}
    .hero-inner{flex-direction:column;gap:16px;align-items:flex-start}
    .ref-strip{padding:12px 24px;flex-wrap:wrap;gap:8px}
    .total-amount{font-size:26px}
  }
  @media print{
    body{background:#fff;padding:0}
    .invoice{box-shadow:none;border-radius:0;max-width:100%}
    .no-print{display:none}
    @page{margin:8mm}
  }
</style>
</head>
<body>
<button class="print-btn no-print" onclick="window.print()">🖨️ طباعة / حفظ PDF</button>
<div class="invoice">
  <div class="hero">
    <div class="hero-inner">
      <div class="brand">
        <div class="brand-icon">🖨️</div>
        <div class="brand-text">
          <h1>${shopName}</h1>
          <p>خدمة طباعة احترافية</p>
        </div>
      </div>
      <div class="invoice-badge">
        <div class="label">فاتورة</div>
        <div class="title">فاتورة</div>
        <div class="date">${formatDateTimeAr(order.createdAt.toISOString())}</div>
      </div>
    </div>
  </div>

  <div class="ref-strip">
    <div>
      <div class="ref-label">رقم الطلب</div>
      <div class="ref-num">${order.reference}</div>
    </div>
    <div class="status">${meta.label}</div>
  </div>

  <div class="content">
    <div class="grid">
      <div class="card">
        <div class="card-head">👤 بيانات العميل</div>
        <div class="card-body">
          <div class="opt-row"><span class="opt-key">الاسم</span><span class="opt-val">${customer.name || "—"}</span></div>
          <div class="opt-row"><span class="opt-key">الهاتف</span><span class="opt-val" dir="ltr">${customer.phone || "—"}</span></div>
          ${customer.whatsapp ? `<div class="opt-row"><span class="opt-key">واتساب</span><span class="opt-val" dir="ltr">${customer.whatsapp}</span></div>` : ""}
          ${customer.email ? `<div class="opt-row"><span class="opt-key">البريد</span><span class="opt-val" dir="ltr" style="font-size:11px">${customer.email}</span></div>` : ""}
          <div class="opt-row"><span class="opt-key">الاستلام</span><span class="opt-val">${customer.deliveryMethod === "delivery" ? "🛵 توصيل" : "🏪 من المطبعة"}</span></div>
          ${customer.address ? `<div class="opt-row"><span class="opt-key">العنوان</span><span class="opt-val" style="font-size:11px">${customer.address}</span></div>` : ""}
        </div>
      </div>

      <div class="card">
        <div class="card-head">${sIcon} ${st === "photo" ? "مواصفات الصورة" : st === "card" ? "مواصفات البطاقة" : st === "poster" ? "مواصفات الملصق" : st === "binding" ? "مواصفات التجليد" : "مواصفات الطباعة"}</div>
        <div class="card-body">
          <div class="opt-row"><span class="opt-key">نوع الخدمة</span><span class="opt-val">${sName}</span></div>
          ${countLabel}
          ${optionRows}
          <div class="opt-row"><span class="opt-key">التسليم</span><span class="opt-val">${delivLabels[delivery.mode] || delivery.mode}</span></div>
          <div class="opt-row"><span class="opt-key">الوقت المتوقع</span><span class="opt-val">${order.estimatedHours} ساعة</span></div>
          ${order.fileName ? `<div class="opt-row"><span class="opt-key">الملف</span><span class="opt-val" style="font-size:10px;max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${order.fileName}</span></div>` : ""}
        </div>
      </div>
    </div>

    <div class="price-section">
      <div class="price-head"><span>البيان</span><span>المبلغ</span></div>
      <div class="price-body">
        ${priceRows.join("")}
      </div>
    </div>

    <div class="total-box">
      <span class="total-label">المجموع الإجمالي</span>
      <span class="total-amount">${pricing.total.toLocaleString("en-US")} ${cur}</span>
    </div>

    ${options.notes ? `<div class="notes-box"><p><strong>📝 ملاحظات العميل:</strong> ${options.notes}</p></div>` : ""}

    <div class="notes-box">
      <p>هذا سعر تقديري — سيتم تأكيد السعر النهائي بعد مراجعة الملف</p>
      <p>سيتم الاتصال بك قبل بدء الطباعة لتأكيد التفاصيل النهائية</p>
      <p>احتفظ برقم الطلب (${order.reference}) لتتبع حالته في أي وقت</p>
    </div>
  </div>

  <div class="footer">
    <div class="footer-info">
      <strong>${shopName}</strong>${shopAddress ? ` · ${shopAddress}` : ""}${shopPhone ? ` · ${shopPhone}` : ""}${shopEmail ? ` · ${shopEmail}` : ""}
    </div>
  </div>
</div>
<script>window.onload=function(){setTimeout(function(){window.print()},600)}</script>
</body>
</html>`;

    return new NextResponse(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
  } catch (e) {
    console.error('[orders/[id]/invoice]', e);
    return NextResponse.json({ error: "حدث خطأ أثناء إنشاء الفاتورة" }, { status: 500 });
  }
}