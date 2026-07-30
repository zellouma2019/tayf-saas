"use client";

import { motion, type Variants } from "framer-motion";
import { useState, useEffect } from "react";

interface DayInfo {
  name: string;
  short: string;
  open: string;
  close: string;
  active: boolean;
}

const DAYS: DayInfo[] = [
  { name: "السبت", short: "سبت", open: "8:00 ص", close: "6:00 م", active: true },
  { name: "الأحد", short: "أحد", open: "8:00 ص", close: "6:00 م", active: true },
  { name: "الاثنين", short: "اثن", open: "8:00 ص", close: "6:00 م", active: true },
  { name: "الثلاثاء", short: "ثلا", open: "8:00 ص", close: "6:00 م", active: true },
  { name: "الأربعاء", short: "أرب", open: "8:00 ص", close: "8:00 م", active: true },
  { name: "الخميس", short: "خمي", open: "8:00 ص", close: "4:00 م", active: true },
  { name: "الجمعة", short: "جمع", open: "—", close: "—", active: false },
];

const container: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.07 } },
};

const item: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 320, damping: 26 } },
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

function getTodayIndex(): number {
  const jsDay = new Date().getDay();
  return jsDay === 0 ? 6 : jsDay - 1;
}

export default function BusinessHoursWidget() {
  const dark = useDark();
  const todayIdx = getTodayIndex();
  const today = DAYS[todayIdx];
  const isOpen = today.active;
  const hoursRemaining = isOpen ? 4 : 0;

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
          <span className="text-lg">🕐</span>
          ساعات العمل
        </h3>
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 300, damping: 20 }}
          className={`flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-full ${
            isOpen
              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400"
              : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${isOpen ? "bg-emerald-500 dark:bg-emerald-400 animate-pulse" : "bg-zinc-400 dark:bg-zinc-500"}`}
          />
          {isOpen ? "مفتوح الآن" : "مغلق"}
        </motion.div>
      </div>

      {/* Hours remaining */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          transition={{ delay: 0.15 }}
          className="mb-4 flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl px-3 py-2.5"
        >
          <span>⏳</span>
          <span>{hoursRemaining} ساعات متبقية حتى الإغلاق</span>
        </motion.div>
      )}

      {/* Days list */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="visible"
        className="space-y-2"
      >
        {DAYS.map((day, idx) => {
          const isToday = idx === todayIdx;
          return (
            <motion.div
              key={day.name}
              variants={item}
              whileHover={{ scale: 1.01, transition: { duration: 0.12 } }}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors ${
                isToday
                  ? "bg-emerald-50/80 dark:bg-emerald-900/25 ring-1 ring-emerald-400/50 dark:ring-emerald-600/40"
                  : "bg-zinc-50 dark:bg-zinc-800/40 hover:bg-zinc-100 dark:hover:bg-zinc-800/60"
              }`}
            >
              {/* Status dot */}
              <span
                className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                  day.active
                    ? "bg-emerald-500 dark:bg-emerald-400 shadow-sm shadow-emerald-500/30"
                    : "bg-zinc-300 dark:bg-zinc-600"
                }`}
              />
              {/* Day name */}
              <span
                className={`text-xs font-bold w-16 shrink-0 ${
                  isToday
                    ? "text-emerald-700 dark:text-emerald-300"
                    : "text-zinc-700 dark:text-zinc-300"
                }`}
              >
                {day.name}
                {isToday && (
                  <span className="block text-[10px] font-normal text-emerald-500 dark:text-emerald-400">
                    (اليوم)
                  </span>
                )}
              </span>
              {/* Times */}
              {day.active ? (
                <span className="flex-1 text-[11px] font-medium text-zinc-600 dark:text-zinc-400 tabular-nums text-left">
                  {day.open} — {day.close}
                </span>
              ) : (
                <span className="flex-1 text-[11px] text-zinc-400 dark:text-zinc-500 font-medium text-left">
                  مغلق
                </span>
              )}
            </motion.div>
          );
        })}
      </motion.div>

      {/* Ramadan note */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800"
      >
        <div className="flex items-center gap-2 text-[11px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-xl px-3 py-2.5">
          <span>🌙</span>
          <span>رمضان: 9AM - 3PM</span>
        </div>
      </motion.div>
    </motion.div>
  );
}
