"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Inbox, Printer, CheckCircle2, Package, Truck, Clock, LucideIcon } from "lucide-react";
import { AlertTriangle } from "lucide-react";

interface OrderTimelineProps {
  status: string;
  createdAt: string;
  startedPrintingAt?: string | null;
  completedPrintingAt?: string | null;
  readyAt?: string | null;
  deliveredAt?: string | null;
  estimatedHours: number;
  reference: string;
}

interface TimelineStep {
  key: string;
  label: string;
  description: string;
  icon: LucideIcon;
  timestampField: keyof Pick<
    OrderTimelineProps,
    "createdAt" | "startedPrintingAt" | "completedPrintingAt" | "readyAt" | "deliveredAt"
  >;
}

const STEPS: TimelineStep[] = [
  {
    key: "received",
    label: "تم الاستلام",
    description: "تم استلام الطلب بنجاح",
    icon: Inbox,
    timestampField: "createdAt",
  },
  {
    key: "printing",
    label: "جارٍ الطباعة",
    description: "جارٍ طباعة طلبك الآن",
    icon: Printer,
    timestampField: "startedPrintingAt",
  },
  {
    key: "completed",
    label: "طباعة مكتملة",
    description: "تم الانتهاء من الطباعة",
    icon: CheckCircle2,
    timestampField: "completedPrintingAt",
  },
  {
    key: "ready",
    label: "جاهز للاستلام",
    description: "طلبك جاهز يمكنك استلامه",
    icon: Package,
    timestampField: "readyAt",
  },
  {
    key: "delivered",
    label: "تم التسليم",
    description: "تم تسليم الطلب بنجاح",
    icon: Truck,
    timestampField: "deliveredAt",
  },
];

const ACTIVE_STEP_MAP: Record<string, number> = {
  pending: 0,
  confirmed: 0,
  printing: 1,
  quality_check: 1,
  ready: 3,
  delivered: 4,
  cancelled: -1,
};

type StepState = "completed" | "active" | "future";

function getStepState(stepIndex: number, status: string): StepState {
  if (status === "cancelled") return "future";
  const active = ACTIVE_STEP_MAP[status] ?? 0;
  if (status === "delivered") return "completed";
  if (stepIndex < active) return "completed";
  if (stepIndex === active) return "active";
  return "future";
}

function formatArabicDate(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = d.toDateString() === yesterday.toDateString();

  const time = d.toLocaleTimeString("ar-DZ", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  if (isToday) return `اليوم ${time}`;
  if (isYesterday) return `أمس ${time}`;
  return (
    d.toLocaleDateString("ar-DZ", { day: "numeric", month: "short" }) +
    ` ${time}`
  );
}

function getEstimatedLabel(status: string, estimatedHours: number): string | null {
  if (status === "cancelled" || status === "delivered") return null;
  const h = estimatedHours;
  const hours = Math.floor(h);
  const minutes = Math.round((h - hours) * 60);
  const timeStr = minutes > 0 ? `${hours} ساعة و ${minutes} دقيقة` : `${hours} ساعة`;

  switch (status) {
    case "pending":
    case "confirmed":
      return `الوقت المتبقي للطباعة: ~${timeStr}`;
    case "printing":
    case "quality_check":
      return `الوقت المتوقع للانتهاء: ~${timeStr}`;
    case "ready":
      return "بانتظار استلامك للطلب";
    default:
      return null;
  }
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: 20, filter: "blur(4px)" },
  visible: {
    opacity: 1,
    x: 0,
    filter: "blur(0px)",
    transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

export function OrderTimeline({
  status,
  createdAt,
  startedPrintingAt,
  completedPrintingAt,
  readyAt,
  deliveredAt,
  estimatedHours,
  reference,
}: OrderTimelineProps) {
  const isCancelled = status === "cancelled";

  const timestamps = useMemo(
    () => ({
      createdAt,
      startedPrintingAt,
      completedPrintingAt,
      readyAt,
      deliveredAt,
    }),
    [createdAt, startedPrintingAt, completedPrintingAt, readyAt, deliveredAt]
  );

  const estimatedLabel = getEstimatedLabel(status, estimatedHours);

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="h-px flex-1 bg-gradient-to-l from-amber-400/60 to-transparent" />
        <h3 className="text-sm font-semibold text-muted-foreground whitespace-nowrap flex items-center gap-2">
          <Clock className="h-4 w-4" />
          مسار الطلب — {reference}
        </h3>
        <div className="h-px flex-1 bg-gradient-to-r from-amber-400/60 to-transparent" />
      </div>

      {/* Cancelled Banner */}
      {isCancelled && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 flex items-center gap-3 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800"
        >
          <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-900/50 flex items-center justify-center shrink-0">
            <AlertTriangle className="h-5 w-5 text-rose-600 dark:text-rose-400" />
          </div>
          <div>
            <p className="font-bold text-rose-700 dark:text-rose-300 text-sm">
              تم إلغاء هذا الطلب
            </p>
            <p className="text-xs text-rose-600/80 dark:text-rose-400/70 mt-0.5">
              تم إلغاء الطلب ولن يتم متابعته
            </p>
          </div>
        </motion.div>
      )}

      {/* Timeline */}
      <motion.div
        className="relative"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Vertical line on the RIGHT side (RTL) */}
        <div
          className={`absolute top-0 bottom-0 right-[19px] w-0.5 z-0 transition-colors duration-500 ${
            isCancelled ? "bg-muted" : "bg-emerald-400/40"
          }`}
          style={{
            // Dynamic height based on completed steps
            top: 20,
            bottom: 20,
          }}
        />

        {STEPS.map((step, index) => {
          const state = isCancelled ? "future" : getStepState(index, status);
          const Icon = step.icon;
          const timestamp = timestamps[step.timestampField];
          const isLast = index === STEPS.length - 1;
          const isActive = state === "active";
          const isCompleted = state === "completed";

          return (
            <motion.div
              key={step.key}
              variants={itemVariants}
              className={`relative flex items-start gap-4 pb-6 ${isLast ? "pb-0" : ""}`}
            >
              {/* Spacer for the line area */}
              <div className="w-10 shrink-0 flex justify-center relative z-10">
                {/* Icon circle */}
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 ${
                    isCompleted
                      ? "bg-emerald-500 shadow-lg shadow-emerald-500/20"
                      : isActive
                        ? "bg-amber-500 animate-glow-pulse ring-4 ring-amber-500/20 shadow-lg shadow-amber-500/25"
                        : "bg-muted"
                  }`}
                >
                  <Icon
                    className={`h-5 w-5 transition-colors duration-300 ${
                      isCompleted
                        ? "text-white"
                        : isActive
                          ? "text-white"
                          : "text-muted-foreground/50"
                    }`}
                  />
                </div>
              </div>

              {/* Connector line segment between icons (on the RIGHT) */}
              {!isLast && (
                <div className="absolute right-[19px] top-10 w-0.5 z-0">
                  <div
                    className={`w-full transition-all duration-700 ${
                      isCompleted
                        ? "bg-emerald-400 h-6"
                        : isActive
                          ? "bg-gradient-to-b from-amber-400 to-muted h-6"
                          : "bg-muted h-6"
                    }`}
                  />
                </div>
              )}

              {/* Text content */}
              <div className="flex-1 min-w-0 pt-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`font-semibold text-sm transition-colors duration-300 ${
                      isCompleted
                        ? "text-foreground"
                        : isActive
                          ? "text-foreground"
                          : "text-muted-foreground/60"
                    }`}
                  >
                    {step.label}
                  </span>
                  {isActive && !isCancelled && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                      الآن
                    </span>
                  )}
                </div>
                <p
                  className={`text-xs mt-0.5 transition-colors duration-300 ${
                    isActive
                      ? "text-muted-foreground"
                      : isCompleted
                        ? "text-muted-foreground/70"
                        : "text-muted-foreground/40"
                  }`}
                >
                  {isCancelled
                    ? "—"
                    : isActive
                      ? step.description
                      : isCompleted
                        ? "تم بنجاح"
                        : "في انتظار الدور"}
                </p>
                {timestamp && isCompleted && (
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 font-medium">
                    {formatArabicDate(timestamp)}
                  </p>
                )}
                {timestamp && isActive && (
                  <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1 font-medium">
                    {formatArabicDate(timestamp)}
                  </p>
                )}
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Estimated time footer */}
      {estimatedLabel && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.4 }}
          className="mt-5 flex items-center justify-center gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/40"
        >
          <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <span className="text-xs font-medium text-amber-700 dark:text-amber-300">
            {estimatedLabel}
          </span>
        </motion.div>
      )}
    </div>
  );
}