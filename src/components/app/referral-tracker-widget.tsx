"use client";

import { motion } from "framer-motion";

interface Source {
  name: string;
  pct: number;
  count: number;
  color: string;
  dotColor: string;
  trend: string;
}

const SOURCES: Source[] = [
  { name: "وسائل التواصل", pct: 35, count: 120, color: "bg-emerald-500 dark:bg-emerald-400", dotColor: "bg-emerald-500", trend: "↑ 5%" },
  { name: "الموقع الإلكتروني", pct: 25, count: 86, color: "bg-sky-500 dark:bg-sky-400", dotColor: "bg-sky-500", trend: "↑ 3%" },
  { name: "توصيات العملاء", pct: 20, count: 69, color: "bg-amber-500 dark:bg-amber-400", dotColor: "bg-amber-500", trend: "↓ 2%" },
  { name: "الإعلانات المدفوعة", pct: 12, count: 41, color: "bg-rose-500 dark:bg-rose-400", dotColor: "bg-rose-500", trend: "↑ 1%" },
  { name: "البريد الإلكتروني", pct: 5, count: 17, color: "bg-violet-500 dark:bg-violet-400", dotColor: "bg-violet-500", trend: "— 0%" },
  { name: "أخرى", pct: 3, count: 10, color: "bg-zinc-400 dark:bg-zinc-500", dotColor: "bg-zinc-400", trend: "↓ 1%" },
];

const COLOR_MAP: Record<string, string> = {
  "bg-emerald-500": "#10b981",
  "bg-sky-500": "#0ea5e9",
  "bg-amber-500": "#f59e0b",
  "bg-rose-500": "#f43f5e",
  "bg-violet-500": "#8b5cf6",
  "bg-zinc-400": "#a1a1aa",
};

const STROKE_COLORS = SOURCES.map((s) => {
  const base = s.dotColor.replace("bg-", "");
  return COLOR_MAP[`bg-${base}`] || "#a1a1aa";
});

function MiniDonut() {
  const size = 80;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * radius;

  const arcs = SOURCES.reduce<Array<{ offset: number; length: number; color: string }>>((acc, src) => {
    const prev = acc.length > 0 ? acc[acc.length - 1] : null;
    const offset = prev ? prev.offset + prev.length : 0;
    const length = (src.pct / 100) * circumference;
    acc.push({ offset, length, color: STROKE_COLORS[SOURCES.indexOf(src)] });
    return acc;
  }, []);

  return (
    <svg width={size} height={size} className="flex-shrink-0">
      <circle cx={cx} cy={cy} r={radius} fill="none" stroke="currentColor" strokeWidth={strokeWidth} className="text-zinc-100 dark:text-zinc-800" />
      {arcs.map((arc, i) => (
        <circle
          key={SOURCES[i].name}
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke={arc.color}
          strokeWidth={strokeWidth}
          strokeDasharray={`${arc.length} ${circumference - arc.length}`}
          strokeDashoffset={-arc.offset}
          strokeLinecap="butt"
          className="opacity-90"
        />
      ))}
      <text x={cx} y={cy - 4} textAnchor="middle" className="fill-zinc-800 dark:fill-zinc-200" fontSize="14" fontWeight="800">
        343
      </text>
      <text x={cx} y={cy + 10} textAnchor="middle" className="fill-zinc-400 dark:fill-zinc-500" fontSize="7">
        إحالة
      </text>
    </svg>
  );
}

export default function ReferralTrackerWidget() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-5 shadow-sm"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-100 flex items-center gap-2">
          <span className="text-base">🔗</span>
          مصادر الإحالة
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300">
            343 إحالة
          </span>
          <span className="text-[10px] font-medium px-2.5 py-1 rounded-full bg-sky-50 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300">
            28% معدل التحويل
          </span>
        </div>
      </div>

      <div className="flex gap-5 items-start mb-4">
        <MiniDonut />
        <div className="flex-1 space-y-2.5">
          {SOURCES.slice(0, 3).map((src) => (
            <div key={src.name} className="flex items-center gap-2 text-[11px]">
              <span className={`w-2 h-2 rounded-full ${src.dotColor} flex-shrink-0`} />
              <span className="text-zinc-600 dark:text-zinc-400 flex-1 truncate">{src.name}</span>
              <span className="text-zinc-400 dark:text-zinc-500 font-medium tabular-nums">{src.pct}%</span>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {SOURCES.map((src, i) => (
          <motion.div
            key={src.name}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.07 }}
            className="group"
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${src.dotColor} flex-shrink-0`} />
                <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">{src.name}</span>
              </div>
              <div className="flex items-center gap-2 text-[10px]">
                <span className="text-zinc-400 dark:text-zinc-500">{src.count} إحالة</span>
                <span className={`font-bold tabular-nums ${src.trend.startsWith("↑") ? "text-emerald-600 dark:text-emerald-400" : src.trend.startsWith("↓") ? "text-rose-500 dark:text-rose-400" : "text-zinc-400 dark:text-zinc-500"}`}>
                  {src.trend}
                </span>
              </div>
            </div>
            <div className="w-full h-2.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${src.pct}%` }}
                transition={{ duration: 0.7, delay: i * 0.07 + 0.15, ease: "easeOut" }}
                className={`h-full rounded-full ${src.color} group-hover:opacity-80 transition-opacity duration-200`}
              />
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800">
        <p className="text-[10px] text-zinc-400 dark:text-zinc-500 text-center">البيانات محدّثة حتى يونيو 2025</p>
      </div>
    </motion.div>
  );
}
