"use client";

import { motion } from "framer-motion";
import { Heart, UserPlus, UserCheck, Crown, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

const RETENTION_RATE = 78;

const METRICS = [
  { label: "عملاء جدد", value: "24", icon: UserPlus, color: "text-sky-500 dark:text-sky-400", bg: "bg-sky-500/10 dark:bg-sky-400/10" },
  { label: "عملاء عائدون", value: "156", icon: UserCheck, color: "text-emerald-500 dark:text-emerald-400", bg: "bg-emerald-500/10 dark:bg-emerald-400/10" },
  { label: "عملاء مخلصون", value: "89", icon: Crown, color: "text-amber-500 dark:text-amber-400", bg: "bg-amber-500/10 dark:bg-amber-400/10" },
  { label: "معدل المغادرة", value: "4.2%", icon: Clock, color: "text-rose-500 dark:text-rose-400", bg: "bg-rose-500/10 dark:bg-rose-400/10" },
];

const SEGMENTS = [
  { label: "VIP", count: 12, color: "bg-amber-500 dark:bg-amber-400" },
  { label: "نشط", count: 45, color: "bg-emerald-500 dark:bg-emerald-400" },
  { label: "عادي", count: 89, color: "bg-sky-500 dark:bg-sky-400" },
  { label: "خامل", count: 23, color: "bg-muted-foreground/40 dark:bg-muted-foreground/30" },
];

const TREND = [62, 65, 68, 72, 75, 78];
const TREND_LABELS = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو"];

function ProgressRing({ pct, size = 100, strokeWidth = 8 }: { pct: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={radius} stroke="currentColor" className="text-muted/50 dark:text-muted/30" strokeWidth={strokeWidth} fill="none" />
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="currentColor"
        className="text-emerald-500 dark:text-emerald-400"
        strokeWidth={strokeWidth}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={circumference}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1.2, ease: "easeOut" }}
      />
    </svg>
  );
}

function MiniTrendChart() {
  const w = 200, h = 50, pad = 4;
  const maxVal = Math.max(...TREND);
  const minVal = Math.min(...TREND);
  const range = maxVal - minVal || 1;
  const points = TREND.map((v, i) => {
    const x = pad + (i / (TREND.length - 1)) * (w - pad * 2);
    const y = h - pad - ((v - minVal) / range) * (h - pad * 2);
    return `${x},${y}`;
  }).join(" ");

  const areaPath = `M${points} L${w - pad},${h - pad} L${pad},${h - pad} Z`;

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="w-full">
      <path d={areaPath} className="fill-emerald-500/10 dark:fill-emerald-400/10" />
      <motion.path
        d={`M${points}`}
        fill="none"
        className="stroke-emerald-500 dark:stroke-emerald-400"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1, ease: "easeOut" }}
      />
      {TREND.map((v, i) => (
        <circle
          key={i}
          cx={pad + (i / (TREND.length - 1)) * (w - pad * 2)}
          cy={h - pad - ((v - minVal) / range) * (h - pad * 2)}
          r={3}
          className="fill-emerald-500 dark:fill-emerald-400"
        />
      ))}
    </svg>
  );
}

export default function CustomerRetentionWidget() {
  return (
    <div className="rounded-xl border border-border bg-card shadow-sm p-5">
      {/* Header */}
      <div className="flex items-center gap-2 mb-5">
        <Heart className="h-4 w-4 text-rose-500 dark:text-rose-400" />
        <h3 className="text-sm font-bold text-foreground">الاحتفاظ بالعملاء</h3>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5" dir="rtl">
        {/* Ring + Rate */}
        <div className="flex flex-col items-center justify-center">
          <div className="relative">
            <ProgressRing pct={RETENTION_RATE} />
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.span
                className="text-2xl font-black text-foreground"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                {RETENTION_RATE}%
              </motion.span>
            </div>
          </div>
          <span className="text-xs text-muted-foreground mt-2">معدل الاحتفاظ</span>
        </div>

        {/* Metrics + Segments */}
        <div className="space-y-3">
          {/* Metric cards */}
          <div className="grid grid-cols-2 gap-2">
            {METRICS.map((m, i) => (
              <motion.div
                key={m.label}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={cn("rounded-lg p-3 text-center", m.bg)}
              >
                <m.icon className={cn("h-4 w-4 mx-auto mb-1", m.color)} />
                <span className={cn("text-lg font-black block", m.color)}>{m.value}</span>
                <span className="text-[10px] text-muted-foreground">{m.label}</span>
              </motion.div>
            ))}
          </div>

          {/* Segments */}
          <div className="space-y-2 mt-3">
            <span className="text-[10px] text-muted-foreground font-medium">شرائح العملاء</span>
            {SEGMENTS.map((seg) => (
              <div key={seg.label} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className={cn("w-2 h-2 rounded-full shrink-0", seg.color)} />
                  <span className="text-foreground font-medium">{seg.label}</span>
                </div>
                <span className="text-muted-foreground tabular-nums">{seg.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Trend chart */}
        <div className="space-y-2">
          <span className="text-[10px] text-muted-foreground font-medium">اتجاه شهري</span>
          <MiniTrendChart />
          <div className="flex justify-between text-[9px] text-muted-foreground">
            {TREND_LABELS.map((l) => (
              <span key={l}>{l}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
