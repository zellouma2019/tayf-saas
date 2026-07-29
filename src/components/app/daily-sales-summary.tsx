"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface HourlySlot {
  range: string;
  amount: number;
}

const HOURLY_SLOTS: HourlySlot[] = [
  { range: "8:00 - 10:00", amount: 3200 },
  { range: "10:00 - 12:00", amount: 6800 },
  { range: "12:00 - 2:00", amount: 5500 },
  { range: "2:00 - 4:00", amount: 8200 },
  { range: "4:00 - 6:00", amount: 7500 },
  { range: "6:00 - 8:00", amount: 4300 },
  { range: "8:00 - 10:00", amount: 2000 },
  { range: "10:00 - 12:00", amount: 1000 },
];

const TOP_SERVICES = [
  { name: "طباعة مستندات", orders: 15 },
  { name: "طباعة صور", orders: 8 },
  { name: "طباعة كروت", orders: 5 },
];

const MAX_HOURLY = Math.max(...HOURLY_SLOTS.map((s) => s.amount));
const TOTAL_SALES = 38500;

function AnimatedCounter({ target, duration = 1200 }: { target: number; duration?: number }) {
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

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

export default function DailySalesSummary() {
  return (
    <div className="bg-card border border-border rounded-2xl p-5 space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-lg">
            📈
          </div>
          <div>
            <h3 className="font-bold text-foreground text-sm">ملخص المبيعات اليوم</h3>
            <p className="text-[11px] text-muted-foreground">الثلاثاء، 29 يوليو 2026</p>
          </div>
        </div>
      </div>

      {/* Total + comparison */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center space-y-1 py-2"
      >
        <p className="text-3xl font-black text-foreground">
          <AnimatedCounter target={TOTAL_SALES} />{" "}
          <span className="text-sm font-medium text-muted-foreground">د.ج</span>
        </p>
        <p className="text-xs text-emerald-500 dark:text-emerald-400 font-semibold">
          +15.2% ↑ مقارنة بالأمس
        </p>
      </motion.div>

      {/* Hourly breakdown */}
      <div className="space-y-3">
        <h4 className="text-xs font-semibold text-muted-foreground">المبيعات حسب الفترة</h4>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-2"
        >
          {HOURLY_SLOTS.map((slot) => {
            const isHighest = slot.amount === MAX_HOURLY;
            const pct = (slot.amount / MAX_HOURLY) * 100;
            return (
              <motion.div key={slot.range} variants={itemVariants} className="flex items-center gap-3">
                <span className="text-[11px] text-muted-foreground w-24 text-start shrink-0">
                  {slot.range}
                </span>
                <div className="flex-1 h-5 rounded-md bg-muted overflow-hidden relative">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className={`absolute inset-y-0 start-0 rounded-md ${isHighest ? "bg-primary" : "bg-primary/40"}`}
                  />
                </div>
                <span className={`text-[11px] font-semibold w-20 text-end shrink-0 ${isHighest ? "text-primary" : "text-muted-foreground"}`}>
                  {slot.amount.toLocaleString("ar-DZ")} د.ج
                </span>
              </motion.div>
            );
          })}
        </motion.div>
      </div>

      {/* Top services */}
      <div className="border-t border-border pt-4 space-y-3">
        <h4 className="text-xs font-semibold text-muted-foreground">أكثر الخدمات مبيعاً</h4>
        <div className="space-y-2">
          {TOP_SERVICES.map((svc, idx) => (
            <motion.div
              key={svc.name}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.8 + idx * 0.1 }}
              className="flex items-center justify-between bg-muted/40 rounded-lg px-3 py-2"
            >
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-primary/10 text-[10px] font-bold text-primary flex items-center justify-center">
                  {idx + 1}
                </span>
                <span className="text-xs font-medium text-foreground">{svc.name}</span>
              </div>
              <span className="text-xs text-muted-foreground">{svc.orders} طلب</span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="w-full text-center text-xs font-semibold text-primary hover:underline py-1"
      >
        عرض التقرير الكامل
      </motion.button>
    </div>
  );
}
