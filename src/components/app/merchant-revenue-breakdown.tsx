"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface Category {
  name: string;
  percentage: number;
  amount: string;
  color: string;
  drawLength: number;
  offset: number;
}

const RAW_CATEGORIES = [
  { name: "طباعة مستندات", percentage: 35, amount: "437,500", color: "#d4a853" },
  { name: "طباعة صور", percentage: 25, amount: "312,500", color: "#10b981" },
  { name: "طباعة بانرات", percentage: 20, amount: "250,000", color: "#6366f1" },
  { name: "طباعة كروت", percentage: 12, amount: "150,000", color: "#f43f5e" },
  { name: "خدمات أخرى", percentage: 8, amount: "100,000", color: "#8b5cf6" },
];

const TOTAL = 1250000;
const RADIUS = 70;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const GAP = 3;

const CATEGORIES: Category[] = RAW_CATEGORIES.map((cat, idx) => {
  const segmentLength = (cat.percentage / 100) * CIRCUMFERENCE;
  const prevLength = RAW_CATEGORIES.slice(0, idx).reduce(
    (sum, c) => sum + (c.percentage / 100) * CIRCUMFERENCE,
    0
  );
  const drawLength = Math.max(segmentLength - GAP, 0);
  return { ...cat, drawLength, offset: prevLength };
});

function AnimatedCounter({ target, duration = 1500 }: { target: number; duration?: number }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);

  return <>{count.toLocaleString("ar-DZ")}</>;
}

export default function MerchantRevenueBreakdown() {
  return (
    <div className="bg-card border border-border rounded-2xl p-5 space-y-5">
      <div className="flex items-center gap-2.5">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-lg">
          💵
        </div>
        <h3 className="font-bold text-foreground text-sm">تفصيل الإيرادات</h3>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-6">
        <div className="relative w-44 h-44 shrink-0">
          <svg viewBox="0 0 180 180" className="w-full h-full -rotate-90">
            {CATEGORIES.map((cat, idx) => (
              <motion.circle
                key={cat.name}
                cx="90"
                cy="90"
                r={RADIUS}
                fill="none"
                stroke={cat.color}
                strokeWidth="18"
                strokeDasharray={`${cat.drawLength} ${CIRCUMFERENCE - cat.drawLength}`}
                strokeDashoffset={-cat.offset}
                strokeLinecap="round"
                initial={{ opacity: 0, strokeDasharray: `0 ${CIRCUMFERENCE}` }}
                animate={{
                  opacity: 1,
                  strokeDasharray: `${cat.drawLength} ${CIRCUMFERENCE - cat.drawLength}`,
                }}
                transition={{ duration: 0.8, delay: idx * 0.15, ease: "easeOut" }}
              />
            ))}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[10px] text-muted-foreground">إجمالي الإيرادات</span>
            <span className="text-sm font-black text-foreground">
              <AnimatedCounter target={TOTAL} />{" "}
              <span className="text-xs font-medium text-muted-foreground">د.ج</span>
            </span>
          </div>
        </div>

        <div className="flex-1 w-full space-y-2.5">
          {CATEGORIES.map((cat, idx) => (
            <motion.div
              key={cat.name}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.3 + idx * 0.1 }}
              className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2"
            >
              <div className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: cat.color }}
                />
                <span className="text-xs font-medium text-foreground">{cat.name}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">{cat.amount} د.ج</span>
                <span className="text-xs font-bold text-foreground">{cat.percentage}%</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
