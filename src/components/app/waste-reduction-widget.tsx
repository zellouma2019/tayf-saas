"use client";

import { motion } from "framer-motion";

const METRICS = [
  {
    label: "نسبة الهدر",
    value: "8.2%",
    sub: "كانت 12.5%",
    icon: "📉",
    accent: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-900/20",
  },
  {
    label: "المواد الموفّرة",
    value: "15,200",
    sub: "ورقة",
    icon: "📄",
    accent: "text-sky-600 dark:text-sky-400",
    bg: "bg-sky-50 dark:bg-sky-900/20",
  },
  {
    label: "التوفير المالي",
    value: "45,600",
    sub: "د.ج",
    icon: "💰",
    accent: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-900/20",
  },
];

const WASTE_SOURCES = [
  { name: "أخطاء الطباعة", pct: 42, color: "bg-rose-500 dark:bg-rose-400" },
  { name: "إلغاء الطلبات", pct: 28, color: "bg-amber-500 dark:bg-amber-400" },
  { name: "أضرار المواد", pct: 18, color: "bg-orange-500 dark:bg-orange-400" },
  { name: "أخطاء القطع", pct: 12, color: "bg-zinc-400 dark:bg-zinc-500" },
];

const CHART_POINTS = [
  { label: "يناير", value: 14 },
  { label: "فبراير", value: 12.8 },
  { label: "مارس", value: 11.5 },
  { label: "أبريل", value: 10.2 },
  { label: "مايو", value: 9.1 },
  { label: "يونيو", value: 8.2 },
];

function MiniChart() {
  const w = 280;
  const h = 60;
  const padX = 4;
  const padY = 6;
  const maxVal = Math.max(...CHART_POINTS.map((p) => p.value));
  const minVal = Math.min(...CHART_POINTS.map((p) => p.value)) - 1;
  const range = maxVal - minVal;

  const pts = CHART_POINTS.map((p, i) => {
    const x = padX + (i / (CHART_POINTS.length - 1)) * (w - padX * 2);
    const y = padY + (1 - (p.value - minVal) / range) * (h - padY * 2);
    return { x, y, ...p };
  });

  const pathD = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaD = `${pathD} L ${pts[pts.length - 1].x} ${h} L ${pts[0].x} ${h} Z`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto">
      <defs>
        <linearGradient id="wasteGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#10b981" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={areaD} fill="url(#wasteGrad)" />
      <path d={pathD} fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3" fill="#10b981" className="stroke-white dark:stroke-zinc-900" strokeWidth="1.5" />
      ))}
      <text x={w / 2} y={h - 1} textAnchor="middle" className="fill-zinc-400 dark:fill-zinc-500" fontSize="7">
        الاتجاه الشهري لنسبة الهدر %
      </text>
    </svg>
  );
}

export default function WasteReductionWidget() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-5 shadow-sm"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-100 flex items-center gap-2">
          <span className="text-base">♻️</span>
          تقليل الهدر
        </h3>
        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300">
          تحسّن
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-5">
        {METRICS.map((m, i) => (
          <motion.div
            key={m.label}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.08 }}
            className={`rounded-lg p-3 ${m.bg}`}
          >
            <div className="text-base mb-1">{m.icon}</div>
            <div className={`text-base font-bold ${m.accent}`}>{m.value}</div>
            <div className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">{m.label}</div>
            <div className="text-[9px] text-zinc-400 dark:text-zinc-500">{m.sub} ↓</div>
          </motion.div>
        ))}
      </div>

      <div className="mb-5">
        <MiniChart />
      </div>

      <div className="space-y-3">
        <h4 className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">أهم مصادر الهدر</h4>
        {WASTE_SOURCES.map((src, i) => (
          <motion.div
            key={src.name}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.06 + 0.2 }}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-zinc-700 dark:text-zinc-300">{src.name}</span>
              <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400">{src.pct}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${src.pct}%` }}
                transition={{ duration: 0.5, delay: i * 0.06 + 0.3, ease: "easeOut" }}
                className={`h-full rounded-full ${src.color}`}
              />
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
