"use client";

import { motion } from "framer-motion";
import { FileText, Check, XCircle, Printer, CalendarDays, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDA, formatDateTimeAr } from "@/lib/print-config";

interface OrderInvoiceCardProps {
  order: {
    reference: string;
    customerName: string;
    customerPhone: string;
    serviceName: string;
    pages: number;
    copies: number;
    total: number;
    tax: number;
    discount: number;
    createdAt: string;
    status: string;
    shopName: string;
  };
}

export function OrderInvoiceCard({
  order: { reference, customerName, customerPhone, serviceName, pages, copies, total, tax, discount, createdAt, status, shopName },
}: OrderInvoiceCardProps) {
  const subtotal = total - tax + discount;
  const isPaid = status === "delivered" || status === "ready";
  const isCancelled = status === "cancelled";

  return (
    <div className="invoice-card relative rounded-xl border border-border bg-card overflow-hidden" dir="rtl">
      {/* ختم الحالة */}
      {(isPaid || isCancelled) && (
        <div className={cn(
          "invoice-stamp absolute top-8 left-8 -rotate-12 px-4 py-2 rounded-lg border-2 font-bold text-sm opacity-60",
          isPaid ? "border-emerald-400 text-emerald-600 dark:text-emerald-400 bg-emerald-50/80 dark:bg-emerald-950/40" : "border-rose-400 text-rose-600 dark:text-rose-400 bg-rose-50/80 dark:bg-rose-950/40"
        )}>
          {isPaid ? "✓ مدفوع" : "✕ ملغي"}
        </div>
      )}

      <div className="p-5 space-y-4">
        {/* رأس الفاتورة */}
        <div className="invoice-header flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Printer className="h-5 w-5 text-primary" />
              <h3 className="text-base font-bold text-foreground">{shopName}</h3>
            </div>
            <div className="text-[11px] text-muted-foreground">فاتورة طباعة</div>
          </div>
          <div className="text-left">
            <div className="text-xs font-mono font-bold text-foreground">{reference}</div>
            <div className="text-[10px] text-muted-foreground flex items-center gap-1 justify-end">
              <CalendarDays className="h-3 w-3" />
              {formatDateTimeAr(createdAt)}
            </div>
          </div>
        </div>

        {/* فاصل */}
        <div className="receipt-divider border-t border-dashed border-border" />

        {/* معلومات الزبون */}
        <div className="flex items-center justify-between text-sm">
          <div>
            <div className="text-[10px] text-muted-foreground">الزبون</div>
            <div className="font-medium text-foreground">{customerName}</div>
            <div className="text-xs text-muted-foreground" dir="ltr">{customerPhone}</div>
          </div>
          <div className="text-left">
            <div className="text-[10px] text-muted-foreground">الخدمة</div>
            <div className="text-sm font-medium text-foreground flex items-center gap-1">
              <Package className="h-3 w-3 text-primary" />
              {serviceName}
            </div>
          </div>
        </div>

        {/* فاصل */}
        <div className="receipt-divider border-t border-dashed border-border" />

        {/* بنود الفاتورة */}
        <div className="space-y-2">
          <div className="invoice-line-item flex items-center justify-between text-sm">
            <span className="text-muted-foreground">الخدمة: {serviceName}</span>
            <span className="font-medium text-foreground tabular-nums">{formatDA(subtotal)}</span>
          </div>
          <div className="invoice-line-item flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{pages} صفحة × {copies} نسخة</span>
            <span className="font-medium text-foreground tabular-nums">{formatDA(subtotal)}</span>
          </div>
        </div>

        {/* فاصل */}
        <div className="receipt-divider border-t border-dashed border-border" />

        {/* المجاميع */}
        <div className="space-y-1.5">
          {discount > 0 && (
            <div className="invoice-subtotal flex items-center justify-between text-sm">
              <span className="text-muted-foreground">الخصم</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-medium tabular-nums">-{formatDA(discount)}</span>
            </div>
          )}
          <div className="invoice-tax flex items-center justify-between text-sm">
            <span className="text-muted-foreground">الضريبة (9%)</span>
            <span className="font-medium text-foreground tabular-nums">{formatDA(tax)}</span>
          </div>
          <div className="invoice-total border-t border-border pt-2 flex items-center justify-between">
            <span className="text-sm font-bold text-foreground">المجموع</span>
            <motion.div
              key={total}
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="text-xl font-bold text-primary tabular-nums"
            >
              {formatDA(total)}
            </motion.div>
          </div>
        </div>

        {/* فاصل */}
        <div className="receipt-divider border-t border-dashed border-border" />

        {/* تذييل */}
        <div className="invoice-footer text-center">
          <p className="text-[10px] text-muted-foreground">شكراً لاختيارك {shopName}</p>
          <p className="text-[9px] text-muted-foreground/50 mt-0.5">هذه الفاتورة تلقائية من منصة طيف</p>
        </div>
      </div>
    </div>
  );
}
