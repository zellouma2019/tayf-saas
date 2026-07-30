"use client";

import { motion, type Variants } from "framer-motion";
import { useState, useEffect, useMemo } from "react";

interface CostCategory {
  name: string;
  amount: number;
  pct: number;
  color: string;
  darkColor: string;
  icon: string;
}

const CATEGORIES: CostCategory[] = [
  { name: "المواد الخام", amount: 140000, pct: 44, color: "#10b981", darkColor: "#34d399", icon: "🧵" },
  { name: "الرواتب", amount: 95000, pct: 30, color: "#3b82f6", darkColor: "#60a5fa", icon: "👥" },
  { name: "الإيجار", amount: 40000, pct: 12, color: "#8b5cf6", darkColor: "#a78bfa", icon: "🏠" },
  { name: "الكهرباء", amount: 25000, pct: 8, color: "#f59e0b", darkColor: "#fbbf24", icon: "⚡" },
  { name: "صيانة", amount: 20000, pct: 6, color: "#ef4444", darkColor: "#f87171", icon: "🔧" },
];

const TOTAL_COST = 320000;
const REVENUE = 1200000;

const stagger: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.07 } },
};

const rowAnim: Variants = {
  hidden: { opacity: 0, x: 16 },
  visible: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 300, damping: 26 } },
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

function PieChart({ dark }: { dark: boolean }) {
  const r = 38;
  const circ = 2 * Math.PI * r;
  const cx = 50;
  const cy = 50;
  let cumulative = 0;

  const arcs = useMemo(() => {
    const result: { name: string; len: number; offset: number; color: string }[] = [];
    let off = 0;
    for (const cat of CATEGORIES) {
      const len = (cat.pct / 100) * circ;
      result.push({
        name: cat.name,
        len,
        offset: -(off / 100) * circ,
        color: dark ? cat.darkColor : cat.color,
      });
      off += cat.pct;
    }
    return result;
  }, [dark]);

  return (
    <svg viewBox="0 0 100 100" className="w-28 h-28 shrink-0">
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        strokeWidth={12}
        className="stroke-zinc-100 dark:stroke-zinc-800"
      />
      {arcs.map((arc) => (
        <motion.circle
          key={arc.name}
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={arc.color}
          strokeWidth={12}
          strokeDasharray={`${arc.len} ${circ}`}
          strokeDashoffset={arc.offset}
          strokeLinecap="butt"
          transform={`rotate(-90 ${cx} ${cy})`}
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      ))}
      <text
        x={cx}
        y={cy - 3}
        textAnchor="middle"
        className="fill-zinc-800 dark:fill-zinc-200"
        fontSize="10"
        fontWeight="800"
      >
        {CATEGORIES.length}
      </text>
      <text
        x={cx}
        y={cy + 9}
        textAnchor="middle"
        className="fill-zinc-400 dark:fill-zinc-500"
        fontSize="6"
      >
        فئات
      </text>
    </svg>
  );
}

export default function CostBreakdownWidget() {
  const dark = useDark();
  const profitMargin = Math.round(((REVENUE - TOTAL_COST) / REVENUE) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className="rounded-2xl border border-zinc-200 dark:border-zinc-700/60 bg-white dark:bg-zinc-900 p-5 shadow-sm"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-100 flex items-center gap-2">
          <span className="text-lg">💰</span>
          تحليل التكاليف
        </h3>
        <motion.button
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.95 }}
          className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 px-3 py-1.5 rounded-lg transition-colors"
        >
          تحليل شهري
        </motion.button>
      </div>

      {/* Total */}
      <div className="text-center mb-5">
        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mb-0.5">إجمالي التكاليف الشهرية</p>
        <p className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-100 tabular-nums">
          {TOTAL_COST.toLocaleString("ar-DZ")} د.ج
        </p>
      </div>

      {/* Cost bars */}
      <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-3 mb-5">
        {CATEGORIES.map((cat) => {
          const col = dark ? cat.darkColor : cat.color;
          const label = cat.amount >= 1000 ? `${Math.round(cat.amount / 1000)}K` : cat.amount;
          return (
            <motion.div key={cat.name} variants={rowAnim} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm">{cat.icon}</span>
                  <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">{cat.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400 tabular-nums">
                    {label} د.ج
                  </span>
                  <span
                    className="text-[10px] font-bold px-1.5 py-0.5 rounded-md"
                    style={{ backgroundColor: `${col}1a`, color: col }}
                  >
                    {cat.pct}%
                  </span>
                </div>
              </div>
              <div className="h-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${cat.pct}%` }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className="h-full rounded-full"
                  style={{ backgroundColor: col }}
                />
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Cost vs Revenue + Pie */}
      <div className="border-t border-zinc-100 dark:border-zinc-800 pt-4">
        <div className="flex items-center gap-4">
          <div className="flex-1 space-y-2">
            {/* Cost pill */}
            <div className="flex items-center justify-between bg-rose-50 dark:bg-rose-900/15 rounded-xl px-4 py-2.5">
              <span className="text-[10px] font-semibold text-rose-500 dark:text-rose-400">التكاليف</span>
              <span className="text-sm font-extrabold text-rose-600 dark:text-rose-400 tabular-nums">320K</span>
            </div>
            {/* Revenue pill */}
            <div className="flex items-center justify-between bg-emerald-50 dark:bg-emerald-900/15 rounded-xl px-4 py-2.5">
              <span className="text-[10px] font-semibold text-emerald-500 dark:text-emerald-400">الإيرادات</span>
              <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums">1.2M</span>
            </div>
            {/* Profit margin */}
            <div className="text-center">
              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                هامش ربح: {profitMargin}%
              </span>
            </div>
          </div>
          {/* Pie chart */}
          <PieChart dark={dark} />
        </div>
      </div>
    </motion.div>
  );
}
