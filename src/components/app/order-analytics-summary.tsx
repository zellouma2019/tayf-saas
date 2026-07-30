"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";

type Period = "today" | "week" | "month" | "year";

interface MetricData {
  label: string;
  value: string;
  change: number;
  data: number[];
  color: string;
}

const periods: { key: Period; label: string }[] = [
  { key: "today", label: "اليوم" },
  { key: "week", label: "هذا الأسبوع" },
  { key: "month", label: "هذا الشهر" },
  { key: "year", label: "هذه السنة" },
];

const seed = 42;
const pseudoRandom = (i: number) => {
  const x = Math.sin(seed + i) * 10000;
  return x - Math.floor(x);
};

function generateMetrics(period: Period): MetricData[] {
  const multipliers: Record<Period, number> = { today: 1, week: 7, month: 30, year: 365 };
  const m = multipliers[period];
  return [
    {
      label: "إجمالي الطلبات",
      value: `${Math.round(38 * m * (0.8 + pseudoRandom(1) * 0.4))}`,
      change: pseudoRandom(2) > 0.5 ? Math.round(pseudoRandom(3) * 25) : -Math.round(pseudoRandom(4) * 15),
      data: Array.from({ length: 12 }, (_, i) => 20 + pseudoRandom(i * 7 + 1) * 60),
      color: "#6366f1",
    },
    {
      label: "الإيرادات",
      value: `${(Math.round(17808 * m * (0.7 + pseudoRandom(5) * 0.6)) / 1000).toFixed(1)}k د.ج`,
      change: Math.round(pseudoRandom(6) * 30),
      data: Array.from({ length: 12 }, (_, i) => 30 + pseudoRandom(i * 7 + 2) * 50),
      color: "#10b981",
    },
    {
      label: "متوسط قيمة الطلب",
      value: `${(400 + Math.round(pseudoRandom(7) * 200)).toLocaleString()} د.ج`,
      change: pseudoRandom(8) > 0.5 ? Math.round(pseudoRandom(9) * 12) : -Math.round(pseudoRandom(10) * 8),
      data: Array.from({ length: 12 }, (_, i) => 40 + pseudoRandom(i * 7 + 3) * 40),
      color: "#f59e0b",
    },
    {
      label: "نسبة الإنجاز",
      value: `${(75 + Math.round(pseudoRandom(11) * 20))}%`,
      change: Math.round(pseudoRandom(12) * 10),
      data: Array.from({ length: 12 }, (_, i) => 50 + pseudoRandom(i * 7 + 4) * 40),
      color: "#8b5cf6",
    },
  ];
}

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 80;
  const h = 32;
  const step = w / (data.length - 1);
  const points = data
    .map((v, i) => `${i * step},${h - ((v - min) / range) * (h - 4) - 2}`)
    .join(" ");

  return (
    <svg width={w} height={h} className="opacity-60" aria-hidden="true">
      <polyline fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points={points} />
    </svg>
  );
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

export default function OrderAnalyticsSummary() {
  const [period, setPeriod] = useState<Period>("week");
  const metrics = useMemo(() => generateMetrics(period), [period]);

  return (
    <div className="space-y-4">
      {/* Period Selector */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">ملخص التحليلات</h3>
        <div className="nav-tabs-pill">
          {periods.map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={`nav-tabs-pill__tab ${period === p.key ? "nav-tabs-pill__tab--active" : ""}`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Metrics Grid */}
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        variants={container}
        initial="hidden"
        animate="show"
        key={period}
      >
        {metrics.map((metric, idx) => (
          <motion.div key={metric.label} variants={item}>
            <div className="data-summary hover-card-lift cursor-default">
              <div className="flex items-center justify-between mb-2">
                <span className="data-summary__label">{metric.label}</span>
                <Sparkline data={metric.data} color={metric.color} />
              </div>
              <div className="data-summary__value">{metric.value}</div>
              <span
                className={`data-summary__trend ${
                  metric.change > 0
                    ? "data-summary__trend--up"
                    : metric.change < 0
                      ? "data-summary__trend--down"
                      : "data-summary__trend--neutral"
                }`}
              >
                {metric.change > 0 ? "↑" : metric.change < 0 ? "↓" : "–"}{" "}
                {Math.abs(metric.change)}%
              </span>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
