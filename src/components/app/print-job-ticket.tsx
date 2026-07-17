"use client";

import type { PrintOrderLite } from "@/lib/order-types";
import {
  translateOptionKey,
  translateOptionValue,
  HIDDEN_OPTION_KEYS,
} from "@/lib/option-translations";
import { formatDA, STATUS_META, formatDateTimeAr } from "@/lib/print-config";

const SERVICE_EMOJI: Record<string, string> = {
  document: "🖨️",
  photo: "🖼️",
  binding: "📚",
  copy: "📄",
  card: "🪪",
  poster: "📜",
};

interface PrintJobTicketProps {
  order: PrintOrderLite;
  shopName: string;
  shopPhone: string;
  shopAddress: string | null;
  shopLogo?: string | null;
}

export function PrintJobTicket({
  order,
  shopName,
  shopPhone,
  shopAddress,
  shopLogo,
}: PrintJobTicketProps) {
  const meta = STATUS_META[order.status];
  const serviceEmoji = SERVICE_EMOJI[order.serviceType] || "🖨️";
  const dateStr = formatDateTimeAr(order.createdAt);

  const visibleOptions = Object.entries(order.options).filter(
    ([k, v]) =>
      v !== undefined &&
      v !== null &&
      v !== "" &&
      !HIDDEN_OPTION_KEYS.includes(k),
  );

  return (
    <div
      id="print-content"
      className="print-job-ticket"
      dir="rtl"
      lang="ar"
    >
      {/* Shop Header */}
      <div className="pjt-header">
        {shopLogo && (
          <img
            src={shopLogo}
            alt={shopName}
            className="pjt-logo"
          />
        )}
        <div className="pjt-shop-info">
          <h1 className="pjt-shop-name">{shopName}</h1>
          {shopPhone && <p className="pjt-shop-phone" dir="ltr">{shopPhone}</p>}
          {shopAddress && <p className="pjt-shop-address">{shopAddress}</p>}
        </div>
      </div>

      {/* Divider */}
      <div className="pjt-divider" />

      {/* Order Reference & Status */}
      <div className="pjt-ref-row">
        <div className="pjt-ref-box">
          <span className="pjt-ref-label">رقم الطلب</span>
          <span className="pjt-ref-value">{order.reference}</span>
        </div>
        <div className="pjt-status-box">
          <span className="pjt-status-badge">
            {meta.emoji} {meta.label}
          </span>
        </div>
      </div>

      <div className="pjt-divider" />

      {/* Customer Info */}
      <div className="pjt-section">
        <h2 className="pjt-section-title">معلومات العميل</h2>
        <div className="pjt-grid-2">
          <div className="pjt-field">
            <span className="pjt-field-label">الاسم</span>
            <span className="pjt-field-value">{order.customer.name}</span>
          </div>
          <div className="pjt-field">
            <span className="pjt-field-label">الهاتف</span>
            <span className="pjt-field-value" dir="ltr">{order.customer.phone}</span>
          </div>
          {order.customer.whatsapp && (
            <div className="pjt-field">
              <span className="pjt-field-label">واتساب</span>
              <span className="pjt-field-value" dir="ltr">{order.customer.whatsapp}</span>
            </div>
          )}
          {order.customer.address && (
            <div className="pjt-field pjt-field-full">
              <span className="pjt-field-label">العنوان</span>
              <span className="pjt-field-value">{order.customer.address}</span>
            </div>
          )}
        </div>
      </div>

      {/* File Info */}
      {order.fileName && (
        <div className="pjt-section">
          <h2 className="pjt-section-title">الملف</h2>
          <div className="pjt-file-row">
            <span className="pjt-file-name">{order.fileName}</span>
            <span className="pjt-file-meta">
              {order.fileType || ""}
              {order.fileSize ? ` • ${Math.round(order.fileSize / 1024)} ك.ب` : ""}
            </span>
          </div>
        </div>
      )}

      {/* Service & Print Settings */}
      <div className="pjt-section">
        <h2 className="pjt-section-title">
          {serviceEmoji} {order.serviceName}
        </h2>
        <div className="pjt-grid-3">
          {visibleOptions.map(([k, v]) => (
            <div key={k} className="pjt-field">
              <span className="pjt-field-label">{translateOptionKey(k)}</span>
              <span className="pjt-field-value">{translateOptionValue(String(v))}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="pjt-divider" />

      {/* Quantities & Pricing */}
      <div className="pjt-section">
        <h2 className="pjt-section-title">الكميات والسعر</h2>
        <div className="pjt-grid-4">
          <div className="pjt-field">
            <span className="pjt-field-label">الصفحات</span>
            <span className="pjt-field-value">{order.pages}</span>
          </div>
          <div className="pjt-field">
            <span className="pjt-field-label">النسخ</span>
            <span className="pjt-field-value">{order.copies}</span>
          </div>
          <div className="pjt-field">
            <span className="pjt-field-label">التسليم</span>
            <span className="pjt-field-value">
              {order.delivery.mode === "pickup" ? "استلام" : "توصيل"}
            </span>
          </div>
          <div className="pjt-field">
            <span className="pjt-field-label">الموعد</span>
            <span className="pjt-field-value">
              {order.delivery.date || "—"} (≈{order.estimatedHours} س)
            </span>
          </div>
        </div>

        {/* Pricing breakdown */}
        <div className="pjt-pricing-breakdown">
          <div className="pjt-price-row">
            <span>سعر الصفحة</span>
            <span>{formatDA(order.pricing.perPage)}</span>
          </div>
          <div className="pjt-price-row">
            <span>تكلفة الصفحات</span>
            <span>{formatDA(order.pricing.pagesCost)}</span>
          </div>
          <div className="pjt-price-row">
            <span>تكلفة النسخ</span>
            <span>{formatDA(order.pricing.copiesCost)}</span>
          </div>
          {order.pricing.sidesSaving > 0 && (
            <div className="pjt-price-row pjt-price-saving">
              <span>توفير الوجهين</span>
              <span>-{formatDA(order.pricing.sidesSaving)}</span>
            </div>
          )}
          {order.pricing.paperTypeSurcharge != null && order.pricing.paperTypeSurcharge > 0 && (
            <div className="pjt-price-row">
              <span>رسوم الورق</span>
              <span>{formatDA(order.pricing.paperTypeSurcharge)}</span>
            </div>
          )}
          {order.pricing.bindingCost != null && order.pricing.bindingCost > 0 && (
            <div className="pjt-price-row">
              <span>التجليد</span>
              <span>{formatDA(order.pricing.bindingCost)}</span>
            </div>
          )}
          {order.pricing.extrasCost != null && order.pricing.extrasCost > 0 && (
            <div className="pjt-price-row">
              <span>إضافات</span>
              <span>{formatDA(order.pricing.extrasCost)}</span>
            </div>
          )}
          {order.pricing.finishingCost != null && order.pricing.finishingCost > 0 && (
            <div className="pjt-price-row">
              <span>التشطيب</span>
              <span>{formatDA(order.pricing.finishingCost)}</span>
            </div>
          )}
          <div className="pjt-price-row">
            <span>التوصيل</span>
            <span>{formatDA(order.pricing.deliveryCost)}</span>
          </div>
          {order.pricing.discount > 0 && (
            <div className="pjt-price-row pjt-price-saving">
              <span>الخصم</span>
              <span>-{formatDA(order.pricing.discount)}</span>
            </div>
          )}
        </div>

        {/* Total */}
        <div className="pjt-total-row">
          <span>الإجمالي</span>
          <span>{formatDA(order.total)}</span>
        </div>
      </div>

      {/* Footer */}
      <div className="pjt-divider" />
      <div className="pjt-footer">
        <span>{dateStr}</span>
        <span>طباعة مباشرة — {shopName}</span>
      </div>
    </div>
  );
}