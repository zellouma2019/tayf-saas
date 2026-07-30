"use client";

import { CheckCircle2, Package, Printer, Clock, Truck, X } from "lucide-react";
import { motion } from "framer-motion";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "printing"
  | "ready"
  | "delivered"
  | "cancelled";

export interface OrderProgressBarProps {
  status: OrderStatus;
}

/* ------------------------------------------------------------------ */
/*  Step definitions                                                   */
/* ------------------------------------------------------------------ */

const STEPS = [
  { key: "pending", label: "تم الاستلام", icon: Package, gradientClass: "badge-gradient-violet", activeColor: "text-violet-500 dark:text-violet-400", ringColor: "ring-violet-400/40 dark:ring-violet-500/30", bgColor: "bg-violet-500", borderColor: "border-violet-500" },
  { key: "confirmed", label: "تم التأكيد", icon: Clock, gradientClass: "badge-gradient-sky", activeColor: "text-sky-500 dark:text-sky-400", ringColor: "ring-sky-400/40 dark:ring-sky-500/30", bgColor: "bg-sky-500", borderColor: "border-sky-500" },
  { key: "printing", label: "قيد الطباعة", icon: Printer, gradientClass: "badge-gradient-amber", activeColor: "text-amber-500 dark:text-amber-400", ringColor: "ring-amber-400/40 dark:ring-amber-500/30", bgColor: "bg-amber-500", borderColor: "border-amber-500" },
  { key: "ready", label: "جاهز", icon: Package, gradientClass: "badge-gradient-emerald", activeColor: "text-emerald-500 dark:text-emerald-400", ringColor: "ring-emerald-400/40 dark:ring-emerald-500/30", bgColor: "bg-emerald-500", borderColor: "border-emerald-500" },
  { key: "delivered", label: "تم التسليم", icon: Truck, gradientClass: "badge-gradient-emerald", activeColor: "text-emerald-500 dark:text-emerald-400", ringColor: "ring-emerald-400/40 dark:ring-emerald-500/30", bgColor: "bg-emerald-500", borderColor: "border-emerald-500" },
] as const;

/* Map status → active step index (0-based) */
const STATUS_ACTIVE_INDEX: Record<OrderStatus, number> = {
  pending: 0,
  confirmed: 1,
  printing: 2,
  ready: 3,
  delivered: 4,
  cancelled: -1,
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function OrderProgressBar({ status }: OrderProgressBarProps) {
  const isCancelled = status === "cancelled";
  const activeIndex = STATUS_ACTIVE_INDEX[status];
  const completedCount = isCancelled ? 0 : activeIndex; // number of fully-completed steps
  const progressPct = isCancelled ? 0 : (completedCount / (STEPS.length - 1)) * 100;

  return (
    <div dir="rtl" className="stagger-entrance">
      <div className="card-border-glow rounded-2xl p-4 sm:p-6 bg-gradient-to-br from-slate-50/80 to-white dark:from-slate-900/60 dark:to-slate-950/80 border border-slate-200/70 dark:border-slate-700/50">

        {/* ---- cancelled badge ---- */}
        {isCancelled && (
          <div className="flex items-center justify-center mb-4">
            <span className="badge-gradient-rose inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-bold text-rose-600 dark:text-rose-400 shadow-sm">
              <X className="h-4 w-4" />
              ملغى
            </span>
          </div>
        )}

        {/* ---- progress bar ---- */}
        {!isCancelled && (
          <div className="mb-6">
            <div className="h-2.5 bg-slate-200/80 dark:bg-slate-700/60 rounded-full overflow-hidden">
              <motion.div
                className="progress-animate h-full rounded-full bg-gradient-to-l from-violet-500 via-blue-500 to-cyan-400 shadow-sm shadow-violet-300/40 dark:shadow-violet-500/20"
                initial={{ width: 0 }}
                animate={{ width: `${progressPct}%` }}
                transition={{ duration: 0.9, ease: "easeOut", delay: 0.2 }}
              />
            </div>
            <div className="flex items-center justify-between mt-1.5 px-0.5">
              <span className="text-[11px] text-muted-foreground font-medium">
                {progressPct === 100 ? "اكتمل" : "التقدم"}
              </span>
              <span className="text-[11px] font-bold text-violet-600 dark:text-violet-400 tabular-nums">
                {Math.round(progressPct)}%
              </span>
            </div>
          </div>
        )}

        {/* ---- steps ---- */}
        <div className="relative flex items-start justify-between">
          {/* connector line (background) */}
          <div className="absolute top-5 right-[10%] left-[10%] h-[3px] bg-slate-200/70 dark:bg-slate-700/50 rounded-full" />

          {/* connector line (fill) */}
          {!isCancelled && (
            <motion.div
              className="absolute top-5 right-[10%] h-[3px] bg-gradient-to-l from-violet-500 via-blue-500 to-cyan-400 rounded-full shadow-sm shadow-violet-300/30 dark:shadow-violet-500/15"
              initial={{ width: 0 }}
              animate={{
                width: `${
                  STEPS.length > 1
                    ? (completedCount / (STEPS.length - 1)) * 80
                    : 0
                }%`,
              }}
              transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
            />
          )}

          {STEPS.map((step, i) => {
            const isCompleted = !isCancelled && i < activeIndex;
            const isActive = !isCancelled && i === activeIndex;
            const isFuture = isCancelled || (!isCompleted && !isActive);
            const StepIcon = step.icon;

            return (
              <motion.div
                key={step.key}
                className="fade-scale-in relative z-10 flex flex-col items-center min-w-0 flex-1"
                initial={{ opacity: 0, y: 12, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.15 + i * 0.08, ease: "easeOut" }}
              >
                {/* ---- circle ---- */}
                <motion.div
                  className={`relative w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center border-2 transition-colors duration-300 ${
                    isCancelled
                      ? "bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-400 dark:text-slate-500"
                      : isCompleted
                        ? `${step.bgColor} ${step.borderColor} text-white shadow-lg ${step.ringColor}`
                        : isActive
                          ? `bg-white dark:bg-slate-900 ${step.borderColor} ${step.activeColor} shadow-lg ring-4 ${step.ringColor}`
                          : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500"
                  }`}
                  animate={
                    isActive
                      ? {
                          scale: [1, 1.08, 1],
                        }
                      : undefined
                  }
                  transition={
                    isActive
                      ? { repeat: Infinity, duration: 2.5, ease: "easeInOut" }
                      : undefined
                  }
                >
                  {/* pulse ring for active step */}
                  {isActive && (
                    <span className="glow-pulse absolute inset-0 rounded-full" />
                  )}

                  {/* live dot for active step */}
                  {isActive && (
                    <span className="status-dot-live absolute -top-0.5 -left-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900" />
                  )}

                  {isCompleted ? (
                    <CheckCircle2 className="h-5 w-5 sm:h-5.5 sm:w-5.5" />
                  ) : isCancelled ? (
                    <X className="h-4 w-4 sm:h-5 sm:w-5" />
                  ) : (
                    <StepIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                  )}
                </motion.div>

                {/* ---- label ---- */}
                <span
                  className={`mt-2 text-[10px] sm:text-xs text-center leading-tight font-medium transition-colors duration-300 ${
                    isCancelled
                      ? "text-slate-400 dark:text-slate-500 line-through decoration-slate-300 dark:decoration-slate-600"
                      : isCompleted
                        ? "text-foreground font-semibold"
                        : isActive
                          ? `${step.activeColor} font-bold`
                          : "text-muted-foreground/60"
                  }`}
                >
                  {step.label}
                </span>

                {/* ---- section divider (between steps, not after last) ---- */}
                {i < STEPS.length - 1 && (
                  <div className="section-divider absolute top-5 -left-1/2 translate-x-1/2 w-px h-0 hidden" aria-hidden="true" />
                )}
              </motion.div>
            );
          })}
        </div>

        {/* ---- bottom status badge ---- */}
        {!isCancelled && (
          <motion.div
            className="mt-5 flex items-center justify-center"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.7 }}
          >
            <span
              className={`${STEPS[activeIndex].gradientClass} inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-bold shadow-sm`}
            >
              {(() => {
                const ActiveIcon = STEPS[activeIndex].icon;
                return <ActiveIcon className="h-3.5 w-3.5" />;
              })()}
              {STEPS[activeIndex].label}
            </span>
          </motion.div>
        )}
      </div>
    </div>
  );
}
