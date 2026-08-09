"use client";

import { motion, type Variants } from "framer-motion";
import { useState, useEffect } from "react";

interface SeasonData {
  emoji: string;
  name: string;
  orders: number;
  growth: number;
  color: string;
  darkColor: string;
  bgLight: string;
  bgDark: string;
}

const SEASONS: SeasonData[] = [
  {
    emoji: "🌸",
    name: "الربيع",
    orders: 280,
    growth: 15,
    color: "#ec4899",
    darkColor: "#f472b6",
    bgLight: "bg-pink-50",
    bgDark: "dark:bg-pink-900/20",
  },
  {
    emoji: "☀️",
    name: "الصيف",
    orders: 350,
    growth: 25,
    color: "#f97316",
    darkColor: "#fb923c",
    bgLight: "bg-orange-50",
    bgDark: "dark:bg-orange-900/20",
  },
  {
    emoji: "🍂",
    name: "الخريف",
    orders: 310,
    growth: 10,
    color: "#eab308",
    darkColor: "#facc15",
    bgLight: "bg-yellow-50",
    bgDark: "dark:bg-yellow-900/20",
  },
  {
    emoji: "❄️",
    name: "الشتاء",
    orders: 420,
    growth: 40,
    color: "#06b6d4",
    darkColor: "#22d3ee",
    bgLight: "bg-cyan-50",
    bgDark: "dark:bg-cyan-900/20",
  },
];

const listVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.09 } },
};

const barVariants: Variants = {
  hidden: { opacity: 0, scaleX: 0 },
  visible: { opacity: 1, scaleX: 1, transition: { duration: 0.5, ease: "easeOut" } },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } },
};

function useDark() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const el = document.documentElement;
    const check = () => setDark(el.classList.contains("dark"));
    check();
    const obs = new MutationObserver(check);
    obs.observe(el, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);
  return dark;
}

export default function SeasonalDemandWidget() {
  const dark = useDark();
  const peak = Math.max(...SEASONS.map((s) => s.orders));
  const highestSeason = SEASONS.reduce((a, b) => (a.orders > b.orders ? a : b));

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className="rounded-2xl border border-zinc-200 dark:border-zinc-700/60 bg-white dark:bg-zinc-900 p-5 shadow-sm"
    >
      {/* Title */}
      <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-100 mb-4 flex items-center gap-2">
        <span className="text-lg">📊</span>
        الطلب الموسمي
      </h3>

      {/* Season cards */}
      <motion.div
        variants={listVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5"
      >
        {SEASONS.map((season) => {
          const isHighest = season.name === highestSeason.name;
          return (
            <motion.div
              key={season.name}
              variants={cardVariants}
              whileHover={{ y: -3, transition: { duration: 0.15 } }}
              className={`rounded-xl p-3 text-center transition-shadow ${
                isHighest
                  ? `ring-2 ring-emerald-400 dark:ring-emerald-500 ${season.bgLight} ${season.bgDark} shadow-sm`
                  : `border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40`
              }`}
            >
              <div className="text-2xl mb-1">{season.emoji}</div>
              <div className="text-xs font-bold text-zinc-800 dark:text-zinc-200 mb-0.5">{season.name}</div>
              <div className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100 tabular-nums">
                {season.orders}
              </div>
              <div className="flex items-center justify-center gap-0.5 mt-1">
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400">↑</span>
                <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                  {season.growth}%
                </span>
              </div>
              {isHighest && (
                <span className="mt-1 inline-block text-[9px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/40 px-2 py-0.5 rounded-full">
                  الأعلى
                </span>
              )}
            </motion.div>
          );
        })}
      </motion.div>

      {/* Bar comparison */}
      <div className="space-y-3 mb-4">
        <p className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">مقارنة الطلبات حسب الموسم</p>
        <motion.div variants={listVariants} initial="hidden" animate="visible" className="space-y-2.5">
          {SEASONS.map((season, idx) => {
            const pct = (season.orders / peak) * 100;
            const barColor = dark ? season.darkColor : season.color;
            return (
              <motion.div key={season.name} variants={barVariants} className="flex items-center gap-3" style={{ originX: 1 }}>
                <span className="text-sm w-6 text-center shrink-0">{season.emoji}</span>
                <span className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400 w-14 shrink-0">
                  {season.name}
                </span>
                <div className="flex-1 h-5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ delay: 0.4 + idx * 0.1, duration: 0.6, ease: "easeOut" }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: barColor }}
                  />
                </div>
                <span className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 w-8 text-left tabular-nums">
                  {season.orders}
                </span>
              </motion.div>
            );
          })}
        </motion.div>
      </div>

      {/* Insights */}
      <div className="border-t border-zinc-100 dark:border-zinc-800 pt-3 space-y-2">
        <div className="flex items-center gap-2 text-[11px] text-zinc-600 dark:text-zinc-400">
          <span>🗓️</span>
          <span className="font-semibold">أعلى شهر:</span>
          <span className="font-bold text-zinc-800 dark:text-zinc-200">ديسمبر</span>
        </div>
        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
          className="flex items-start gap-2 text-[11px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-xl px-3 py-2.5"
        >
          <span className="shrink-0">📈</span>
          <span className="font-medium">الطلب يزداد 22% في فترة الامتحانات</span>
        </motion.div>
      </div>
    </motion.div>
  );
}
