"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";

const DAYS = ["السبت", "الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة"];

const TIME_SLOTS = ["8 ص", "10 ص", "12 م", "2 م", "4 م", "6 م"];

const MOCK_DATA: number[][] = [
  [2, 5, 10, 8, 4, 1],
  [3, 7, 14, 11, 5, 2],
  [4, 9, 16, 13, 7, 3],
  [3, 8, 13, 12, 6, 2],
  [5, 11, 18, 15, 9, 4],
  [3, 6, 11, 9, 5, 1],
  [1, 2, 4, 3, 2, 0],
];

function getCellStyle(value: number): string {
  if (value <= 2) return "bg-white dark:bg-zinc-800/50";
  if (value <= 5) return "bg-emerald-100 dark:bg-emerald-900/40";
  if (value <= 8) return "bg-emerald-300 dark:bg-emerald-700/60";
  if (value <= 11) return "bg-emerald-500 dark:bg-emerald-600/80";
  return "bg-emerald-700 dark:bg-emerald-500";
}

function getTextColor(value: number): string {
  if (value <= 5) return "text-zinc-600 dark:text-zinc-300";
  return "text-white";
}

export default function PeakHoursHeatmap() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const el = document.documentElement;
    setIsDark(el.classList.contains("dark"));
    const obs = new MutationObserver(() => setIsDark(el.classList.contains("dark")));
    obs.observe(el, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);

  let maxVal = 0;
  let maxDay = 0;
  let maxSlot = 0;
  MOCK_DATA.forEach((row, di) =>
    row.forEach((val, si) => {
      if (val > maxVal) {
        maxVal = val;
        maxDay = di;
        maxSlot = si;
      }
    })
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-5 shadow-sm"
    >
      <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-100 mb-4 flex items-center gap-2">
        <span className="text-base">🔥</span>
        ساعات الذروة
      </h3>

      <div className="overflow-x-auto">
        <div className="min-w-[440px]">
          {/* Time slot headers */}
          <div className="grid gap-1.5 mb-1.5" style={{ gridTemplateColumns: "72px repeat(6, 1fr)" }}>
            <div />
            {TIME_SLOTS.map((slot) => (
              <div key={slot} className="text-[10px] font-medium text-zinc-400 dark:text-zinc-500 text-center">
                {slot}
              </div>
            ))}
          </div>

          {/* Grid rows */}
          <div className="space-y-1.5">
            {DAYS.map((day, di) => (
              <motion.div
                key={day}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: di * 0.04 }}
                className="grid gap-1.5"
                style={{ gridTemplateColumns: "72px repeat(6, 1fr)" }}
              >
                <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400 flex items-center">
                  {day}
                </div>
                {TIME_SLOTS.map((_, si) => {
                  const val = MOCK_DATA[di][si];
                  const isMax = di === maxDay && si === maxSlot;
                  return (
                    <div
                      key={si}
                      className={`${
                        getCellStyle(val)
                      } h-9 rounded-md flex items-center justify-center text-[11px] font-semibold tabular-nums transition-transform duration-150 hover:scale-110 cursor-default ${
                        getTextColor(val)
                      } ${
                        isMax ? "ring-2 ring-emerald-500 ring-offset-1 ring-offset-white dark:ring-offset-zinc-900" : ""
                      }`}
                      title={`${day} — ${TIME_SLOTS[si]}: ${val} طلب`}
                    >
                      {val}
                    </div>
                  );
                })}
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-2 mt-5 text-[10px] text-zinc-500 dark:text-zinc-400">
        <span>قليل</span>
        <div className="w-5 h-3.5 rounded-sm bg-white dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700" />
        <div className="w-5 h-3.5 rounded-sm bg-emerald-100 dark:bg-emerald-900/40" />
        <div className="w-5 h-3.5 rounded-sm bg-emerald-300 dark:bg-emerald-700/60" />
        <div className="w-5 h-3.5 rounded-sm bg-emerald-500 dark:bg-emerald-600/80" />
        <div className="w-5 h-3.5 rounded-sm bg-emerald-700 dark:bg-emerald-500" />
        <span>مزدحم</span>
      </div>

      {/* Peak label */}
      <div className="text-center mt-2 text-[10px] text-zinc-400 dark:text-zinc-500">
        الأكثر ازدحاماً: {DAYS[maxDay]} {TIME_SLOTS[maxSlot]} — {maxVal} طلب
      </div>
    </motion.div>
  );
}
