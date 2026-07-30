"use client";

import { motion } from "framer-motion";
import { FileText, Clock, Package, Hash, Layers, Copy } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { STATUS_COLORS } from "@/lib/admin-utils";
import { STATUS_META } from "@/lib/print-config";
import { formatDA, formatDateTimeAr } from "@/lib/print-config";

// ===== OrderSummaryCard =====
// بطاقة ملخص الطلب — عرض مُدمج لتفاصيل الطلب في لوحة الإدارة

interface OrderSummaryCardProps {
  order: {
    reference: string;
    customerName: string;
    serviceName: string;
    total: number;
    status: string;
    createdAt: string;
    pages?: number;
    copies?: number;
  };
  className?: string;
}

/** ألوان الخدمة حسب نوعها */
function getServiceColor(serviceName: string): string {
  if (serviceName.includes("مستند") || serviceName.includes("طباعة")) {
    return "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950 dark:text-sky-300 dark:border-sky-800";
  }
  if (serviceName.includes("صور") || serviceName.includes("صورة")) {
    return "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950 dark:text-violet-300 dark:border-violet-800";
  }
  if (serviceName.includes("تجليد") || serviceName.includes("لولب")) {
    return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800";
  }
  if (serviceName.includes("نسخ")) {
    return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800";
  }
  if (serviceName.includes("بطاقة") || serviceName.includes("دعوة")) {
    return "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800";
  }
  if (serviceName.includes("ملصق")) {
    return "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-800";
  }
  return "bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-900 dark:text-gray-300 dark:border-gray-700";
}

export function OrderSummaryCard({ order, className }: OrderSummaryCardProps) {
  const statusMeta = STATUS_META[order.status];
  const statusColors = STATUS_COLORS[order.status] || STATUS_COLORS.pending;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, type: "spring" }}
      whileHover={{ y: -2 }}
      className={cn("order-summary hover-lift", className)}
    >
      <Card className="card-glass-morphism overflow-hidden">
        <CardContent className="p-3.5">
          {/* الشريط العلوي: المرجع + الحالة */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Hash className="h-3.5 w-3.5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold font-mono text-foreground truncate">
                  {order.reference}
                </p>
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Clock className="h-2.5 w-2.5" />
                  <span>{formatDateTimeAr(order.createdAt)}</span>
                </div>
              </div>
            </div>
            <Badge
              className={cn(
                "text-[10px] border shrink-0",
                statusMeta?.bg || statusColors
              )}
            >
              {statusMeta?.label || order.status}
            </Badge>
          </div>

          {/* تفاصيل الطلب */}
          <div className="order-item space-y-2.5">
            {/* اسم الخدمة */}
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-accent/50 flex items-center justify-center shrink-0">
                <FileText className="h-3 w-3 text-muted-foreground" />
              </div>
              <Badge
                variant="outline"
                className={cn(
                  "service-badge text-[10px] border",
                  getServiceColor(order.serviceName)
                )}
              >
                {order.serviceName}
              </Badge>
            </div>

            {/* اسم العميل */}
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-accent/50 flex items-center justify-center shrink-0">
                <Package className="h-3 w-3 text-muted-foreground" />
              </div>
              <span className="text-xs text-foreground truncate">
                {order.customerName}
              </span>
            </div>

            {/* الصفحات × النسخ (إن وُجد) */}
            {order.pages != null && order.copies != null && (
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-accent/50 flex items-center justify-center shrink-0">
                  <Layers className="h-3 w-3 text-muted-foreground" />
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground tabular-nums">
                    {order.pages}
                  </span>
                  <span>صفحة</span>
                  <span className="text-muted-foreground/50">×</span>
                  <Copy className="h-2.5 w-2.5" />
                  <span className="font-medium text-foreground tabular-nums">
                    {order.copies}
                  </span>
                  <span>نسخة</span>
                </div>
              </div>
            )}

            {/* السعر */}
            <div className="flex items-center justify-between pt-2 border-t border-border/30">
              <span className="text-[10px] text-muted-foreground">الإجمالي</span>
              <span className="price-tag text-sm font-bold text-primary tabular-nums">
                {formatDA(order.total)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
