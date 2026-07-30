"use client";

import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { TrendingUp, useEffect, useState } from "react";
import { DollarSign } from "lucide-react";

const SERVICES = [
  { name: "طباعة مستندات", profit: 65, price: 50, cost: 17.5 },
  { name: "طباعة صور", profit: 45, price: 200, cost: 110 },
  { name: "طباعة بانرات", profit: 70, price: 500, cost: 150 },
  { name: "طباعة كروت", profit: 55, price: 30, cost: 13.5 },
  { name: "طباعة ملصقات", profit: 60, price: 80, cost: 32 },
];

const avgProfit = Math.round(
  SERVICES.reduce((a, s) => a + s.profit, 0) / SERVICES.length
);

function AnimatedCounter({ target }: { target: number }) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (v) => Math.round(v));
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const unsub = rounded.on("change", (v) => setDisplay(v));
    animate(count, target, { duration: 1.2, ease: "easeOut" });
    return unsub;
  }, [target, count, rounded]);

  return <span>{display}%</span>;
}

function barGradient(pct: number) {
  if (pct >= 65) return "from-emerald-400 to-emerald-600 dark:from-emerald-500 dark:to-emerald-700";
  if (pct >= 50) return "from-amber-400 to-amber-600 dark:from-amber-500 dark:to-amber-700";
  return "from-rose-400 to-rose-600 dark:from-rose-500 dark:to-rose-700";
}

export default function ProfitMarginChart() {
  return (
    <div className="rounded-xl border border-border bg-card shadow-sm p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-bold text-foreground">هوامش الربح</h3>
        </div>
        <div className="text-xs bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2.5 py-1 rounded-full font-bold">
          متوسط: <AnimatedCounter target={avgProfit} />
        </div>
      </div>

      {/* Services */}
      <div className="space-y-4" dir="rtl">
        {SERVICES.map((service, i) => (
          <motion.div
            key={service.name}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1, duration: 0.4 }}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm font-medium text-foreground">{service.name}</span>
              <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-0.5">
                  <DollarSign className="h-3 w-3" />
                  تكلفة {service.cost} د.ج
                </span>
                <span className="flex items-center gap-0.5 font-semibold text-foreground">
                  <DollarSign className="h-3 w-3" />
                  {service.price} د.ج
                </span>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  {service.profit}% ربح
                </span>
              </div>
            </div>
            {/* Profit bar */}
            <div className="h-3 rounded-full bg-muted/50 overflow-hidden">
              <motion.div
                className={cn(
                  "h-full rounded-full bg-gradient-to-l",
                  barGradient(service.profit)
                )}
                initial={{ width: 0 }}
                animate={{ width: `${service.profit}%` }}
                transition={{ delay: i * 0.1 + 0.3, duration: 0.8, ease: "easeOut" }}
              />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(" ");
}
