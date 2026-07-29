"use client";

import { motion } from "framer-motion";

interface KpiData {
  label: string;
  value: string;
  trend: string;
  trendDir: "up" | "down";
  trendColor: string;
  sparkline: string;
}

const KPIS: KpiData[] = [
  {
    label: "إجمالي الطلبات",
    value: "156",
    trend: "+12.5% مقارنة بالشهر السابق",
    trendDir: "up",
    trendColor: "text-emerald-500 dark:text-emerald-400",
    sparkline: "M0 40 L20 35 L40 30 L60 32 L80 20 L100 15 L120 18 L140 10",
  },
  {
    label: "معدل الإنجاز",
    value: "94%",
    trend: "+3.2% مقارنة بالشهر السابق",
    trendDir: "up",
    trendColor: "text-emerald-500 dark:text-emerald-400",
    sparkline: "M0 35 L20 30 L40 28 L60 25 L80 22 L100 18 L120 15 L140 12",
  },
  {
    label: "متوسط القيمة",
    value: "850 د.ج",
    trend: "-2.1% مقارنة بالشهر السابق",
    trendDir: "down",
    trendColor: "text-red-500 dark:text-red-400",
    sparkline: "M0 15 L20 18 L40 22 L60 20 L80 25 L100 28 L120 30 L140 35",
  },
  {
    label: "وقت الاستجابة",
    value: "12 دقيقة",
    trend: "-8.4% مقارنة بالشهر السابق",
    trendDir: "down",
    trendColor: "text-emerald-500 dark:text-emerald-400",
    sparkline: "M0 38 L20 35 L40 32 L60 28 L80 25 L100 22 L120 18 L140 12",
  },
];

const DAYS = [
  { name: "السبت", value: 18 },
  { name: "الأحد", value: 25 },
  { name: "الاثنين", value: 30 },
  { name: "الثلاثاء", value: 28 },
  { name: "الأربعاء", value: 22 },
  { name: "الخميس", value: 20 },
  { name: "الجمعة", value: 13 },
];

const MAX_DAY = Math.max(...DAYS.map((d) => d.value));

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

export default function OrderAnalyticsDeepDive() {
  return (
    <div className="bg-card border border-border rounded-2xl p-5 space-y-5">
      <div className="flex items-center gap-2.5">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-lg">
          📊
        </div>
        <h3 className="font-bold text-foreground text-sm">تحليل الطلبات التفصيلي</h3>
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 lg:grid-cols-4 gap-3"
      >
        {KPIS.map((kpi) => (
          <motion.div
            key={kpi.label}
            variants={itemVariants}
            className="bg-muted/50 rounded-xl p-3 space-y-2"
          >
            <p className="text-xs text-muted-foreground">{kpi.label}</p>
            <p className="text-lg font-black text-foreground">{kpi.value}</p>
            <svg width="80" height="30" viewBox="0 0 140 40" className="opacity-60">
              <path
                d={kpi.sparkline}
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className={kpi.trendColor}
              />
            </svg>
            <div className={`flex items-center gap-1 text-[11px] ${kpi.trendColor}`}>
              <span>{kpi.trendDir === "up" ? "↑" : "↓"}</span>
              <span>{kpi.trend}</span>
            </div>
          </motion.div>
        ))}
      </motion.div>

      <div className="border-t border-border pt-4 space-y-3">
        <h4 className="text-xs font-semibold text-muted-foreground">حجم الطلبات حسب اليوم</h4>
        <div className="space-y-2.5">
          {DAYS.map((day, idx) => (
            <motion.div
              key={day.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.5 + idx * 0.08 }}
              className="flex items-center gap-3"
            >
              <span className="text-xs text-muted-foreground w-16 text-start shrink-0">
                {day.name}
              </span>
              <div className="flex-1 h-6 rounded-lg bg-muted overflow-hidden relative">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(day.value / MAX_DAY) * 100}%` }}
                  transition={{
                    duration: 0.7,
                    delay: 0.6 + idx * 0.08,
                    ease: "easeOut",
                  }}
                  className="absolute inset-y-0 start-0 rounded-lg bg-primary"
                />
                <span className="absolute inset-y-0 start-0 ps-2 text-[11px] font-semibold text-primary-foreground flex items-center">
                  {day.value}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
