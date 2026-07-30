"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Clock, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

const MAX_HOURS = 8;

const SERVICES = [
  { name: "طباعة مستندات", hours: 2, fast: true },
  { name: "طباعة صور", hours: 4, fast: false },
  { name: "طباعة بانرات", hours: 8, fast: false },
  { name: "طباعة كروت", hours: 1, fast: true },
  { name: "طباعة ملصقات", hours: 3, fast: false },
  { name: "تجليد", hours: 6, fast: false },
];

const avgHours = Math.round(SERVICES.reduce((a, s) => a + s.hours, 0) / SERVICES.length);
const fastestService = SERVICES.reduce((a, s) => (s.hours < a.hours ? s : a));

function timeColor(hours: number) {
  if (hours <= 2) return "bg-emerald-500 dark:bg-emerald-400";
  if (hours <= 4) return "bg-amber-500 dark:bg-amber-400";
  return "bg-rose-500 dark:bg-rose-400";
}

function timeGradient(hours: number) {
  if (hours <= 2) return "from-emerald-400 to-emerald-600 dark:from-emerald-500 dark:to-emerald-700";
  if (hours <= 4) return "from-amber-400 to-amber-600 dark:from-amber-500 dark:to-amber-700";
  return "from-rose-400 to-rose-600 dark:from-rose-500 dark:to-rose-700";
}

function timeBadgeBg(hours: number) {
  if (hours <= 2) return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";
  if (hours <= 4) return "bg-amber-500/10 text-amber-600 dark:text-amber-400";
  return "bg-rose-500/10 text-rose-600 dark:text-rose-400";
}

function hoursLabel(hours: number) {
  return hours === 1 ? `${hours} ساعة` : `${hours} ساعات`;
}

export default function ServiceTimeTracker() {
  return (
    <div className="rounded-xl border border-border bg-card shadow-sm p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-bold text-foreground">زمن الخدمات</h3>
        </div>
        <div className="text-xs bg-muted px-2.5 py-1 rounded-full text-muted-foreground font-medium">
          متوسط: <span className="font-bold text-foreground">{avgHours} ساعات</span>
        </div>
      </div>

      {/* Fastest highlight */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex items-center gap-2 mb-4 px-3 py-2 rounded-lg bg-emerald-500/10 dark:bg-emerald-400/10 border border-emerald-500/20 dark:border-emerald-400/20"
      >
        <Zap className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />
        <span className="text-xs text-emerald-700 dark:text-emerald-300">
          أسرع خدمة: <span className="font-bold">{fastestService.name}</span> — {hoursLabel(fastestService.hours)}
        </span>
      </motion.div>

      {/* Service list */}
      <div className="space-y-3" dir="rtl">
        <AnimatePresence>
          {SERVICES.map((service, i) => {
            const pct = (service.hours / MAX_HOURS) * 100;
            return (
              <motion.div
                key={service.name}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ delay: i * 0.08, duration: 0.35 }}
                className="group"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">{service.name}</span>
                    {service.fast && (
                      <span className={cn("text-[9px] px-1.5 py-0.5 rounded-full font-bold", timeBadgeBg(service.hours))}>
                        سريع
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-bold tabular-nums text-foreground">{hoursLabel(service.hours)}</span>
                </div>
                {/* Time bar */}
                <div className="h-2.5 rounded-full bg-muted/50 overflow-hidden">
                  <motion.div
                    className={cn("h-full rounded-full bg-gradient-to-l", timeGradient(service.hours))}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ delay: i * 0.08 + 0.2, duration: 0.7, ease: "easeOut" }}
                  />
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-4 pt-3 border-t border-border">
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400" />
          سريع (≤2س)
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <span className="w-2 h-2 rounded-full bg-amber-500 dark:bg-amber-400" />
          متوسط (3-4س)
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <span className="w-2 h-2 rounded-full bg-rose-500 dark:bg-rose-400" />
          بطيء (5+س)
        </div>
      </div>
    </div>
  );
}
