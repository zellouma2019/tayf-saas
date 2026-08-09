"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, TrendingDown, Minus, BarChart3, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatNumber } from "@/lib/admin-utils";

interface MetricComparisonItem {
  label: string;
  current: number;
  previous: number;
  icon: React.ReactNode;
  format?: "number" | "currency";
}

export function MetricComparisonGrid({ metrics }: { metrics: MetricComparisonItem[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3" dir="rtl">
      {metrics.map((m, i) => (
        <MetricComparisonCard key={m.label} metric={m} index={i} />
      ))}
    </div>
  );
}

function MetricComparisonCard({ metric: m, index }: { metric: MetricComparisonItem; index: number }) {
  const change = m.previous > 0 ? ((m.current - m.previous) / m.previous) * 100 : 0;
  const isUp = change > 0;
  const isDown = change < 0;
  const isFlat = Math.abs(change) < 0.5;

  const formatted = useMemo(() => {
    if (m.format === "currency") return formatNumber(m.current);
    return m.current.toLocaleString("ar-DZ");
  }, [m.current, m.format]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, type: "spring", stiffness: 200 }}
      className={cn(
        "rounded-xl border p-4 transition-all duration-200 hover:shadow-lg dark-elevated",
        isUp ? "border-emerald-200/60 dark:border-emerald-800/30" :
        isDown ? "border-rose-200/60 dark:border-rose-800/30" :
        "border-border"
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <div className={cn(
          "w-9 h-9 rounded-lg flex items-center justify-center",
          isUp ? "bg-emerald-100 dark:bg-emerald-900/30" :
          isDown ? "bg-rose-100 dark:bg-rose-900/30" :
          "bg-zinc-100 dark:bg-zinc-800/30"
        )}>
          {m.icon}
        </div>
        <div className={cn(
          "flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full",
          isUp ? "text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20" :
          isDown ? "text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20" :
          "text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800/20"
        )}>
          {isUp && <TrendingUp className="h-3 w-3" />}
          {isDown && <TrendingDown className="h-3 w-3" />}
          {isFlat && <Minus className="h-3 w-3" />}
          {isFlat ? "0%" : `${isUp ? "+" : ""}${change.toFixed(1)}%`}
        </div>
      </div>
      <div className="text-2xl font-bold text-foreground tabular-nums mb-0.5">{formatted}</div>
      <div className="text-[11px] text-muted-foreground">{m.label}</div>

      {/* Mini bar comparison */}
      <div className="mt-3 flex items-center gap-1.5">
        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-muted-foreground/20 rounded-full" style={{ width: "100%" }} />
        </div>
        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
          <motion.div
            className={cn("h-full rounded-full", isUp ? "bg-emerald-500" : isDown ? "bg-rose-500" : "bg-zinc-400")}
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, Math.max(5, Math.abs(change) + 50))}%` }}
            transition={{ delay: index * 0.08 + 0.3, duration: 0.6 }}
          />
        </div>
      </div>
      <div className="flex justify-between text-[9px] text-muted-foreground/50 mt-0.5">
        <span>الأسبوع الماضي</span>
        <span>هذا الأسبوع</span>
      </div>
    </motion.div>
  );
}
