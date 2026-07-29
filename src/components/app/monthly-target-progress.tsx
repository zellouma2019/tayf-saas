"use client";

import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { Clock, TrendingUp } from "lucide-react";

const targets = [
  { label: "إيرادات", current: "1.2M", target: "1.5M", unit: "د.ج", percent: 80, color: "#f59e0b", bgColor: "bg-amber-500/10" },
  { label: "الطلبات", current: "186", target: "200", unit: "", percent: 93, color: "#10b981", bgColor: "bg-emerald-500/10" },
  { label: "عملاء جدد", current: "18", target: "25", unit: "", percent: 72, color: "#f59e0b", bgColor: "bg-amber-500/10" },
  { label: "رضا العملاء", current: "4.5", target: "5.0", unit: "", percent: 90, color: "#10b981", bgColor: "bg-emerald-500/10" },
];

function useCounter(target: number, duration = 1000) {
  const [val, setVal] = useState(0);
  const raf = useRef<number>(0);
  useEffect(() => {
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const ease = p === 1 ? 1 : 1 - Math.pow(2, -10 * p);
      setVal(Math.round(target * ease));
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [target, duration]);
  return val;
}

function CircularProgress({ percent, color, size = 64, stroke = 5 }: { percent: number; color: string; size?: number; stroke?: number }) {
  const r = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (percent / 100) * circ;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} className="fill-none stroke-border" strokeWidth={stroke} />
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        className="transition-all duration-1000 ease-out"
      />
    </svg>
  );
}

export default function MonthlyTargetProgress() {
  const animPct = useCounter(84, 1200);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="rounded-2xl border border-border bg-card p-6 shadow-sm"
    >
      {/* Header */}
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-foreground">أهداف الشهر</h3>
          <p className="text-sm text-muted-foreground">يوليو 2026</p>
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-600 dark:text-amber-400">
          <Clock className="h-3.5 w-3.5" />
          <span>2 أيام متبقية</span>
        </div>
      </div>

      {/* Overall progress */}
      <div className="mb-6 rounded-xl bg-muted/50 p-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-sm font-medium text-foreground">
            <TrendingUp className="h-4 w-4 text-emerald-500" />
            إجمالي التقدم
          </span>
          <span className="text-lg font-bold text-foreground">{animPct}%</span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-border">
          <motion.div
            className="h-full rounded-full bg-gradient-to-l from-emerald-500 to-emerald-400"
            initial={{ width: 0 }}
            animate={{ width: `${84}%` }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Target cards */}
      <div className="grid grid-cols-2 gap-4">
        {targets.map((t, i) => (
          <motion.div
            key={t.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 + i * 0.1 }}
            className={`rounded-xl ${t.bgColor} p-4`}
          >
            <div className="flex items-center gap-3">
              <CircularProgress percent={t.percent} color={t.color} />
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">{t.label}</p>
                <p className="text-xs text-muted-foreground">
                  {t.current} / {t.target} {t.unit}
                </p>
                <p className="mt-1 text-lg font-bold" style={{ color }}>{t.percent}%</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
