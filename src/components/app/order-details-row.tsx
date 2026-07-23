"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TableCell } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronDown, ChevronLeft, Download, FileText, Phone, MapPin, Clock, User, Package, RotateCcw, Copy, Printer } from "lucide-react";
import {
  STATUS_META,
  formatDA,
  formatDateTimeAr,
} from "@/lib/print-config";
import { useAppStore } from "@/lib/store";
import type { PrintOrderLite } from "@/lib/order-types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { STATUS_FLOW } from "@/lib/print-config";
import {
  translateOptionKey,
  translateOptionValue,
  HIDDEN_OPTION_KEYS,
} from "@/lib/option-translations";

/// هل الملف من نوع صورة؟
function isImageFile(fileType: string | null): boolean {
  if (!fileType) return false;
  const t = fileType.toUpperCase();
  return ["JPG", "JPEG", "PNG", "WEBP", "GIF"].includes(t);
}

/// هل الملف PDF؟
function isPdfFile(fileType: string | null): boolean {
  if (!fileType) return false;
  return fileType.toUpperCase() === "PDF";
}

/// تنزيل ملف من رابط
function downloadFile(url: string, fileName: string) {
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

interface OrderDetailsRowProps {
  order: PrintOrderLite;
  onStatusChange?: (order: PrintOrderLite, status: string) => void;
  onClone?: () => void;
  selected?: boolean;
  onToggleSelect?: () => void;
  onClick?: (order: PrintOrderLite) => void;
  onPrintReceipt?: () => void;
  canPrintReceipt?: boolean;
}

export function OrderDetailsRow({ order, onStatusChange, onClone, selected, onToggleSelect, onClick, onPrintReceipt, canPrintReceipt }: OrderDetailsRowProps) {
  const [expanded, setExpanded] = useState(false);
  const meta = STATUS_META[order.status];

  const serviceEmoji: Record<string, string> = {
    document: "🖨️",
    photo: "🖼️",
    binding: "📚",
    copy: "📄",
    card: "🪪",
    poster: "📜",
  };

  function handleDownloadFile() {
    // تنزيل بيانات الطلب كملف نصي (لأن الملف الأصلي لا يُرفع للخادم)
    const orderData = `طيف - تفاصيل الطلب
================================
رقم الطلب: ${order.reference}
التاريخ: ${formatDateTimeAr(order.createdAt)}
الحالة: ${meta.label}

الخدمة: ${order.serviceName}
الملف: ${order.fileName || "بدون ملف"}
نوع الملف: ${order.fileType || "—"}
حجم الملف: ${order.fileSize ? Math.round(order.fileSize / 1024) + " ك.ب" : "—"}

مواصفات الطباعة:
${Object.entries(order.options)
  .filter(([k]) => !HIDDEN_OPTION_KEYS.includes(k))
  .map(([k, v]) => `  - ${translateOptionKey(k)}: ${translateOptionValue(String(v))}`)
  .join("\n")}
${order.options.printRange === "custom" ? `  - نطاق الطباعة: صفحات ${order.options.pageRange}` : "  - نطاق الطباعة: الملف كامل"}
  - إجمالي الصفحات: ${order.options.totalPages || order.pages}
  - الصفحات المطبوعة: ${order.pages}
  - عدد النسخ: ${order.copies}

العميل:
  - الاسم: ${order.customer?.name || "—"}
  - الهاتف: ${order.customer?.phone || "—"}
  ${order.customer?.whatsapp ? `- واتساب: ${order.customer.whatsapp}` : ""}
  ${order.customer?.email ? `- البريد: ${order.customer.email}` : ""}
  - طريقة الاستلام: ${order.customer?.deliveryMethod === "delivery" ? "توصيل" : "استلام من المطبعة"}
  ${order.customer?.address ? `- العنوان: ${order.customer.address}` : ""}
  ${order.options.notes ? `\nملاحظات: ${order.options.notes}` : ""}

التسليم:
  - الوقت: ${order.delivery.mode}
  ${order.delivery.date ? `- التاريخ: ${order.delivery.date}` : ""}
  - الوقت المتوقع: ${order.estimatedHours} ساعة

الأسعار:
  - سعر الصفحة: ${order.pricing.perPage}
  - تكلفة الصفحات: ${order.pricing.pagesCost}
  - تكلفة النسخ: ${order.pricing.copiesCost}
  ${order.pricing.finishingCost != null && order.pricing.finishingCost > 0 ? `- التشطيب: ${order.pricing.finishingCost}` : ""}
  ${order.pricing.bindingCost != null && order.pricing.bindingCost > 0 ? `- التجليد: ${order.pricing.bindingCost}` : ""}
  ${order.pricing.deliveryCost > 0 ? `- التوصيل: ${order.pricing.deliveryCost}` : ""}
  ${order.pricing.discount > 0 ? `- الخصم: -${order.pricing.discount}` : ""}
  - المجموع: ${order.pricing.total}

================================
طيف
`;

    const blob = new Blob([orderData], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `order-${order.reference}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function handleDownloadInvoice() {
    const shopId = useAppStore.getState().shopId;
    const q = shopId ? `?shopId=${encodeURIComponent(shopId)}` : "";
    window.open(`/api/orders/${order.id}/invoice${q}`, "_blank");
  }

  // تجميع خيارات الطباعة للعرض - باستخدام الترجمات العربية
  const printOptions = Object.entries(order.options)
    .filter(([k, v]) => v !== undefined && v !== null && v !== "" && !HIDDEN_OPTION_KEYS.includes(k))
    .map(([k, v]) => ({ key: k, label: translateOptionKey(k), value: translateOptionValue(String(v)) }));

  return (
    <>
      <TableRow
        order={order}
        meta={meta}
        serviceEmoji={serviceEmoji[order.serviceType] || "🖨️"}
        expanded={expanded}
        onToggle={() => setExpanded(!expanded)}
        selected={selected}
        onToggleSelect={onToggleSelect}
        onClick={onClick}
        onClone={onClone}
        onPrintReceipt={onPrintReceipt}
        canPrintReceipt={canPrintReceipt}
      />
      {expanded && (
        <tr className="bg-amber-50/40 dark:bg-amber-950/20">
          <td colSpan={11} className="p-0">
            <div className="p-4 md:p-6 border-t border-amber-200 dark:border-amber-800/40">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
                {/* ===== مواصفات الطباعة ===== */}
                <div className="md:col-span-2 space-y-4">
                  <div>
                    <h4 className="font-bold text-sm mb-2 flex items-center gap-2">
                      <Package className="h-4 w-4 text-amber-600" />
                      متطلبات الطباعة المطلوبة من الزبون
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {printOptions.map(({ key, label, value }) => (
                        <div key={key} className="rounded-lg bg-white dark:bg-card border border-amber-100 dark:border-amber-800/30 p-2.5">
                          <div className="text-xs text-muted-foreground">{label}</div>
                          <div className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 mt-0.5">
                            {value}
                          </div>
                        </div>
                      ))}
                      {order.options.printRange === "custom" && (
                        <div className="rounded-lg bg-amber-100 dark:bg-amber-900/30 border border-amber-300 dark:border-amber-700 p-2.5">
                          <div className="text-xs text-amber-700 dark:text-amber-400">نطاق الطباعة</div>
                          <div className="text-xs font-semibold text-amber-900 dark:text-amber-300 mt-0.5">
                            صفحات: {order.options.pageRange}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* معلومات الملف + معاينة حقيقية */}
                  {order.fileName && (
                    <div>
                      <h4 className="font-bold text-sm mb-2 flex items-center gap-2">
                        <FileText className="h-4 w-4 text-amber-600" />
                        ملف الزبون
                      </h4>
                      <div className="rounded-lg bg-white dark:bg-card border border-amber-100 dark:border-amber-800/30 p-3">
                        <div className="flex items-start gap-3 flex-col sm:flex-row">
                          {/* معاينة الملف الحقيقية */}
                          <div className="shrink-0 mx-auto sm:mx-0">
                            {isImageFile(order.fileType) && order.filePreview ? (
                              <div className="relative w-24 h-28 rounded-lg overflow-hidden border-2 border-amber-200 dark:border-amber-800/50 shadow-sm">
                                <img
                                  src={order.filePreview}
                                  alt={order.fileName}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ) : isPdfFile(order.fileType) && order.fileData ? (
                              <div className="relative w-24 h-28 rounded-lg overflow-hidden border-2 border-amber-200 dark:border-amber-800/50 shadow-sm bg-white dark:bg-card">
                                <img
                                  src={`/api/orders/${order.id}/thumbnail${(() => { const s = useAppStore.getState().shopId; return s ? `?shopId=${encodeURIComponent(s)}` : ""; })()}`}
                                  alt={order.fileName}
                                  className="w-full h-full object-contain bg-white"
                                />
                                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-1">
                                  <span className="text-[9px] font-bold text-white">PDF</span>
                                </div>
                              </div>
                            ) : order.fileData && order.fileData.startsWith("file_") ? (
                              <div className="relative w-24 h-28 rounded-lg overflow-hidden border-2 border-amber-200 dark:border-amber-800/50 shadow-sm bg-neutral-50 dark:bg-neutral-900/50 flex items-center justify-center">
                                <div className="text-center">
                                  <FileText className="h-8 w-8 text-amber-500 mx-auto" />
                                  <span className="text-[9px] font-bold text-neutral-600 dark:text-neutral-400 mt-1 block">{order.fileType}</span>
                                </div>
                              </div>
                            ) : (
                              <div className="w-16 h-20 rounded-lg bg-neutral-900 dark:bg-neutral-100 flex flex-col items-center justify-center text-amber-400 shrink-0">
                                <FileText className="h-6 w-6" />
                                <span className="text-[9px] font-bold mt-1">{order.fileType}</span>
                              </div>
                            )}
                          </div>
                          {/* تفاصيل الملف */}
                          <div className="flex-1 min-w-0 w-full">
                            <div className="text-sm font-medium truncate break-all">{order.fileName}</div>
                            <div className="flex flex-wrap gap-1.5 mt-1.5 text-xs">
                              {order.fileType && (
                                <span className="px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-900/30 border border-amber-100 dark:border-amber-800/30 text-amber-700 dark:text-amber-400 font-medium">
                                  {order.fileType}
                                </span>
                              )}
                              {order.fileSize ? (
                                <span className="px-2 py-0.5 rounded bg-muted text-muted-foreground">
                                  📦 {Math.round(order.fileSize / 1024)} ك.ب
                                </span>
                              ) : null}
                              {order.fileData && (
                                <span className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-100 dark:border-emerald-800/30 text-emerald-700 dark:text-emerald-400 font-medium">
                                  ✓ متاح للتنزيل
                                </span>
                              )}
                            </div>
                            <div className="flex gap-2 mt-2.5 flex-wrap">
                              {order.fileData && (
                                <Button
                                  size="sm"
                                  className="bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-100 dark:hover:bg-neutral-200 dark:text-neutral-900 text-white h-8 text-xs"
                                  onClick={() => { const s = useAppStore.getState().shopId; const fUrl = `/api/orders/${order.id}/file${s ? `?shopId=${encodeURIComponent(s)}` : ""}`; downloadFile(fUrl, order.fileName || "file"); }}
                                >
                                  <Download className="h-3.5 w-3.5" />
                                  تنزيل الملف الأصلي
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 text-xs"
                                onClick={handleDownloadFile}
                                >
                                <Download className="h-3.5 w-3.5" />
                                تنزيل التفاصيل
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ملاحظات الزبون */}
                  {order.options.notes && (
                    <div>
                      <h4 className="font-bold text-sm mb-2">ملاحظات الزبون</h4>
                      <div className="rounded-lg bg-white dark:bg-card border border-amber-100 dark:border-amber-800/30 p-3 text-sm text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap">
                        {order.options.notes}
                      </div>
                    </div>
                  )}

                  {/* الأسعار التفصيلية */}
                  <div>
                    <h4 className="font-bold text-sm mb-2">تفاصيل التسعير</h4>
                    <div className="rounded-lg bg-white dark:bg-card border border-amber-100 dark:border-amber-800/30 p-3 space-y-1.5 text-xs">
                      <PriceRow label="سعر الصفحة" value={order.pricing.perPage} />
                      <PriceRow label="تكلفة الصفحات" value={order.pricing.pagesCost} />
                      <PriceRow label="تكلفة النسخ" value={order.pricing.copiesCost} />
                      {(order.pricing.finishingCost != null && order.pricing.finishingCost > 0) && (
                        <PriceRow label="التشطيب/التجليد" value={order.pricing.finishingCost} />
                      )}
                      {(order.pricing.bindingCost != null && order.pricing.bindingCost > 0) && (
                        <PriceRow label="التجليد" value={order.pricing.bindingCost} />
                      )}
                      {(order.pricing.extrasCost != null && order.pricing.extrasCost > 0) && (
                        <PriceRow label="إضافات" value={order.pricing.extrasCost} />
                      )}
                      {order.pricing.deliveryCost > 0 && (
                        <PriceRow label="التوصيل العاجل" value={order.pricing.deliveryCost} />
                      )}
                      {order.pricing.discount > 0 && (
                        <PriceRow label="خصم الكمية" value={-order.pricing.discount} green />
                      )}
                      <div className="flex items-center justify-between pt-2 border-t border-amber-100 dark:border-amber-800/30">
                        <span className="font-bold">المجموع</span>
                        <span className="font-bold text-amber-700 dark:text-amber-400 text-base">{formatDA(order.pricing.total)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ===== معلومات العميل والتسليم ===== */}
                <div className="space-y-4">
                  <div>
                    <h4 className="font-bold text-sm mb-2 flex items-center gap-2">
                      <User className="h-4 w-4 text-amber-600" />
                      معلومات العميل
                    </h4>
                    <div className="rounded-lg bg-white dark:bg-card border border-amber-100 dark:border-amber-800/30 p-3 space-y-2 text-xs">
                      <InfoRow icon={<User className="h-3.5 w-3.5" />} label="الاسم" value={order.customer?.name || "—"} />
                      <InfoRow icon={<Phone className="h-3.5 w-3.5" />} label="الهاتف" value={order.customer?.phone || "—"} ltr />
                      {order.customer?.whatsapp && (
                        <InfoRow icon={<Phone className="h-3.5 w-3.5" />} label="واتساب" value={order.customer.whatsapp} ltr />
                      )}
                      {order.customer?.email && (
                        <InfoRow icon={<FileText className="h-3.5 w-3.5" />} label="البريد" value={order.customer.email} ltr />
                      )}
                      <InfoRow
                        icon={<MapPin className="h-3.5 w-3.5" />}
                        label="الاستلام"
                        value={order.customer?.deliveryMethod === "delivery" ? "توصيل للعنوان" : "من المطبعة"}
                      />
                      {order.customer?.address && (
                        <div className="pt-1 border-t border-amber-50 dark:border-amber-900/30">
                          <div className="text-muted-foreground mb-0.5">العنوان</div>
                          <div className="text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap">{order.customer.address}</div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-bold text-sm mb-2 flex items-center gap-2">
                      <Clock className="h-4 w-4 text-amber-600" />
                      التسليم
                    </h4>
                    <div className="rounded-lg bg-white dark:bg-card border border-amber-100 dark:border-amber-800/30 p-3 space-y-1.5 text-xs">
                      <InfoRow label="الوقت" value={deliveryLabel(order.delivery.mode)} />
                      {order.delivery.date && <InfoRow label="التاريخ" value={order.delivery.date} />}
                      <InfoRow label="الوقت المتوقع" value={`${order.estimatedHours} ساعة`} />
                    </div>
                  </div>

                  {/* أزرار الإجراءات */}
                  <div className="space-y-2">
                    {/* زر تغيير الحالة */}
                    {onStatusChange && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="sm" className="w-full bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-100 dark:hover:bg-neutral-200 dark:text-neutral-900 text-white">
                            <RotateCcw className="h-4 w-4" />
                            تغيير الحالة
                            <ChevronDown className="h-3 w-3 mr-auto" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-48">
                          <div className="px-2 py-1.5 text-xs text-muted-foreground">الحالة الحالية: {meta.label}</div>
                          {STATUS_FLOW.filter((s) => s !== order.status).map((s) => (
                            <DropdownMenuItem key={s} onClick={() => onStatusChange(order, s)}>
                              <span className="mr-2">{STATUS_META[s].emoji}</span>
                              {STATUS_META[s].label}
                            </DropdownMenuItem>
                          ))}
                          <DropdownMenuItem onClick={() => onStatusChange(order, "cancelled")} className="text-rose-600">
                            <span className="mr-2">❌</span>
                            إلغاء الطلب
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                    <Button size="sm" variant="outline" className="w-full" onClick={handleDownloadInvoice}>
                      <Download className="h-4 w-4" />
                      تنزيل الفاتورة
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function deliveryLabel(mode: string): string {
  const labels: Record<string, string> = {
    hour: "خلال ساعة ⚡",
    today: "اليوم",
    tomorrow: "غداً",
    scheduled: "تاريخ محدد",
  };
  return labels[mode] || mode;
}

function TableRow({
  order,
  meta,
  serviceEmoji,
  expanded,
  onToggle,
  selected,
  onToggleSelect,
  onClick,
  onClone,
  onPrintReceipt,
  canPrintReceipt,
}: {
  order: PrintOrderLite;
  meta: { label: string; bg: string };
  serviceEmoji: string;
  expanded: boolean;
  onToggle: () => void;
  selected?: boolean;
  onToggleSelect?: () => void;
  onClick?: (order: PrintOrderLite) => void;
  onClone?: () => void;
  onPrintReceipt?: () => void;
  canPrintReceipt?: boolean;
}) {
  return (
    <TableRowInner
      order={order}
      meta={meta}
      serviceEmoji={serviceEmoji}
      expanded={expanded}
      onToggle={onToggle}
      selected={selected}
      onToggleSelect={onToggleSelect}
      onClick={onClick}
      onClone={onClone}
      onPrintReceipt={onPrintReceipt}
      canPrintReceipt={canPrintReceipt}
    />
  );
}

function TableRowInner({
  order,
  meta,
  serviceEmoji,
  expanded,
  onToggle,
  selected,
  onToggleSelect,
  onClick,
  onClone,
  onPrintReceipt,
  canPrintReceipt,
}: {
  order: PrintOrderLite;
  meta: { label: string; bg: string };
  serviceEmoji: string;
  expanded: boolean;
  onToggle: () => void;
  selected?: boolean;
  onToggleSelect?: () => void;
  onClick?: (order: PrintOrderLite) => void;
  onClone?: () => void;
  onPrintReceipt?: () => void;
  canPrintReceipt?: boolean;
}) {
  return (
    <tr
      className={`hover:bg-amber-50/30 dark:hover:bg-amber-950/20 cursor-pointer transition-colors ${expanded ? "bg-amber-50/50 dark:bg-amber-950/20" : ""} ${selected ? "bg-rose-50/40 dark:bg-rose-950/20" : ""}`}
      onClick={() => {
        if (onClick) onClick(order);
        else onToggle();
      }}
    >
      <TableCell className="w-10 text-center" onClick={(e) => e.stopPropagation()}>
        {onToggleSelect ? (
          <Checkbox
            checked={selected || false}
            onCheckedChange={() => onToggleSelect()}
            className="cursor-pointer"
          />
        ) : null}
      </TableCell>
      <TableCell className="font-mono text-xs whitespace-nowrap">{order.reference}</TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <span className="text-lg">{serviceEmoji}</span>
          <span className="text-xs hidden sm:inline">{order.serviceName}</span>
        </div>
      </TableCell>
      <TableCell className="text-sm">{order.customer?.name || <span className="text-muted-foreground/50">—</span>}</TableCell>
      <TableCell className="text-xs font-mono hidden md:table-cell" dir="ltr">{order.customer?.phone || <span className="text-muted-foreground/50">—</span>}</TableCell>
      <TableCell className="text-xs text-muted-foreground hidden lg:table-cell">
        {order.pages}ص × {order.copies}ن
      </TableCell>
      <TableCell className="text-sm whitespace-nowrap">
        <div className="font-bold text-amber-700">{formatDA(order.total)}</div>
        {(order.cost || 0) > 0 && (
          <div className="text-[10px] text-muted-foreground">تكلفة: {formatDA(order.cost || 0)}</div>
        )}
      </TableCell>
      <TableCell className="text-sm whitespace-nowrap hidden lg:table-cell">
        {(() => {
          const profit = order.total - (order.cost || 0);
          if (profit > 0) return <span className="text-emerald-600 font-semibold">{formatDA(profit)}</span>;
          if (profit < 0) return <span className="text-red-600 font-semibold">{formatDA(profit)}</span>;
          return <span className="text-muted-foreground">{formatDA(0)}</span>;
        })()}
      </TableCell>
      <TableCell>
        <Badge variant="outline" className={`text-xs ${meta.bg}`}>
          {meta.label}
        </Badge>
      </TableCell>
      <TableCell className="text-xs text-muted-foreground whitespace-nowrap hidden sm:table-cell">
        {formatDateTimeAr(order.createdAt)}
      </TableCell>
      <TableCell className="text-center">
        <div className="flex items-center justify-center gap-1">
          {canPrintReceipt && onPrintReceipt && (
            <button
              className="p-1 rounded hover:bg-muted transition-colors"
              onClick={(e) => { e.stopPropagation(); onPrintReceipt(); }}
              title="طباعة إيصال"
            >
              <Printer className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
            </button>
          )}
          {onClone && (
            <button
              className="p-1 rounded hover:bg-muted transition-colors"
              onClick={(e) => { e.stopPropagation(); onClone(); }}
              title="نسخ الطلب"
            >
              <Copy className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
            </button>
          )}
          <div className={`inline-flex transition-transform ${expanded ? "rotate-90" : ""}`}>
            <ChevronLeft className="h-4 w-4 text-amber-600" />
          </div>
        </div>
      </TableCell>
    </tr>
  );
}

function PriceRow({ label, value, green }: { label: string; value: number; green?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={green ? "text-emerald-600 font-medium" : "font-medium"}>
        {value > 0 ? formatDA(value) : value < 0 ? `−${formatDA(Math.abs(value))}` : "مجاني"}
      </span>
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
  ltr,
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
  ltr?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-muted-foreground flex items-center gap-1.5">
        {icon}
        {label}
      </span>
      <span className="font-medium" dir={ltr ? "ltr" : "rtl"}>
        {value}
      </span>
    </div>
  );
}
