"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  PlusCircle, CheckCircle2, Printer,
  ClipboardCheck, Package, Truck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDateTimeAr } from "@/lib/print-config";

// ===== OrderTimelineVisualizer =====
// متتبع بصري لمراحل الطلب — يعرض رحلة الطلب من الإنشاء حتى التسليم

interface OrderTimelineVisualizerProps {
  /** رقم الطلب */
  orderId: string;
  /** الحالة الحالية للطلب */
  currentStatus: string;
  /** تاريخ الإنشاء */
  createdAt: string;
  /** تاريخ آخر تحديث */
  updatedAt: string;
  className?: string;
}

// تعريف المراحل الست بترتيب RTL (من اليمين لليسار)
const STEPS = [
  { key: "new",           label: "طلب جديد",      icon: PlusCircle,     color: "text-sky-500"     },
  { key: "confirmed",     label: "مؤكد",           icon: CheckCircle2,   color: "text-violet-500"  },
  { key: "printing",      label: "جارٍ الطباعة",    icon: Printer,        color: "text-blue-500"    },
  { key: "quality_check", label: "فحص الجودة",     icon: ClipboardCheck, color: "text-amber-500"   },
  { key: "ready",         label: "جاهز",           icon: Package,        color: "text-emerald-500" },
  { key: "delivered",     label: "تم التسليم",     icon: Truck,          color: "text-emerald-600" },
] as const;

// خريطة الحالات الحالية إلى فهرس المرحلة
const STATUS_STEP_MAP: Record<string, number> = {
  pending:   0,
  confirmed: 1,
  printing:  2,
  ready:     4,
  delivered: 5,
  cancelled: -1,
};

export function OrderTimelineVisualizer({
  orderId,
  currentStatus,
  createdAt,
  updatedAt,
  className,
}: OrderTimelineVisualizerProps) {
  // تحديد الفهرس الحالي بناءً على الحالة
  const currentStepIndex = useMemo(() => {
    return STATUS_STEP_MAP[currentStatus] ?? 0;
  }, [currentStatus]);

  // توليد أوقات افتراضية لكل مرحلة بناءً على createdAt
  const stepTimestamps = useMemo(() => {
    const base = new Date(createdAt).getTime();
    const intervals = [0, 30, 90, 180, 300, 500]; // دقائق تقريبية
    return intervals.map((m) => new Date(base + m * 60_000));
  }, [createdAt]);

  const isCancelled = currentStatus === "cancelled";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={cn(
        "widget-glass rounded-2xl p-4 sm:p-5",
        className
      )}
      dir="rtl"
    >
      {/* رأس المكون */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Truck className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-bold text-foreground">مسار الطلب</h3>
        </div>
        <span className="text-[10px] font-mono text-muted-foreground">
          #{orderId}
        </span>
      </div>

      {/* حالة الإلغاء */}
      {isCancelled && (
        <div className="text-center py-3">
          <span className="text-xs font-semibold text-rose-500 bg-rose-50 dark:bg-rose-950 px-3 py-1.5 rounded-lg">
            ❌ هذا الطلب ملغي
          </span>
        </div>
      )}

      {/* خط زمني بصري */}
      <div className="relative flex items-start justify-between gap-1">
        {/* خط الموصل (خلفية) */}
        <div className="absolute top-5 right-[10%] left-[10%] h-0.5 bg-border rounded-full" />
        {/* خط الموصل (التقدم) */}
        {!isCancelled && (
          <div
            className="absolute top-5 right-[10%] h-0.5 bg-primary rounded-full transition-all duration-700"
            style={{
              width: currentStepIndex >= 5 ? "80%" : `${(currentStepIndex / 5) * 80}%`,
            }}
          />
        )}

        {STEPS.map((step, index) => {
          const Icon = step.icon;
          const isCompleted = !isCancelled && index < currentStepIndex;
          const isCurrent = !isCancelled && index === currentStepIndex;
          const isPending = isCancelled || index > currentStepIndex;

          return (
            <div
              key={step.key}
              className="relative z-10 flex flex-col items-center gap-1.5"
              style={{ width: `${100 / STEPS.length}%` }}
            >
              {/* دائرة الخطوة */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: index * 0.08, type: "spring" }}
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all",
                  isCompleted && "bg-primary border-primary text-primary-foreground",
                  isCurrent && "bg-primary/15 border-primary text-primary animate-pulse",
                  isPending && "bg-background border-border text-muted-foreground"
                )}
              >
                {isCompleted ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <Icon className="h-4 w-4" />
                )}
              </motion.div>

              {/* التسمية */}
              <span
                className={cn(
                  "text-[10px] sm:text-[11px] font-medium text-center leading-tight",
                  isCompleted && "text-primary",
                  isCurrent && "text-foreground font-bold",
                  isPending && "text-muted-foreground/60"
                )}
              >
                {step.label}
              </span>

              {/* الطابع الزمني */}
              {isCompleted && stepTimestamps[index] && (
                <span className="text-[9px] text-muted-foreground/50 text-center leading-tight">
                  {formatDateTimeAr(stepTimestamps[index].toISOString())}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* معلومات التاريخ في الأسفل */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/50">
        <span className="text-[10px] text-muted-foreground">
          الإنشاء: {formatDateTimeAr(createdAt)}
        </span>
        <span className="text-[10px] text-muted-foreground">
          آخر تحديث: {formatDateTimeAr(updatedAt)}
        </span>
      </div>
    </motion.div>
  );
}
