"use client";

import { motion, type Variants } from "framer-motion";
import { useState, useEffect } from "react";

interface SentimentBar {
  emoji: string;
  label: string;
  pct: number;
  color: string;
  trackLight: string;
  trackDark: string;
}

const SENTIMENTS: SentimentBar[] = [
  {
    emoji: "😊",
    label: "إيجابي",
    pct: 82,
    color: "bg-emerald-500 dark:bg-emerald-400",
    trackLight: "bg-emerald-100",
    trackDark: "dark:bg-emerald-900/30",
  },
  {
    emoji: "😐",
    label: "محايد",
    pct: 12,
    color: "bg-amber-500 dark:bg-amber-400",
    trackLight: "bg-amber-100",
    trackDark: "dark:bg-amber-900/30",
  },
  {
    emoji: "😞",
    label: "سلبي",
    pct: 6,
    color: "bg-rose-500 dark:bg-rose-400",
    trackLight: "bg-rose-100",
    trackDark: "dark:bg-rose-900/30",
  },
];

interface FeedbackSnippet {
  text: string;
  emoji: string;
  bgLight: string;
  bgDark: string;
}

const FEEDBACKS: FeedbackSnippet[] = [
  { text: "خدمة ممتازة", emoji: "😊", bgLight: "bg-emerald-50", bgDark: "dark:bg-emerald-900/15" },
  { text: "أسعار معقولة", emoji: "😊", bgLight: "bg-emerald-50", bgDark: "dark:bg-emerald-900/15" },
  { text: "تأخر قليلاً", emoji: "😐", bgLight: "bg-amber-50", bgDark: "dark:bg-amber-900/15" },
  { text: "جودة تحتاج تحسين", emoji: "😞", bgLight: "bg-rose-50", bgDark: "dark:bg-rose-900/15" },
];

const stagger: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.07 } },
};

const slideIn: Variants = {
  hidden: { opacity: 0, x: 18 },
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

export default function FeedbackSentimentWidget() {
  const dark = useDark();

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className="rounded-2xl border border-zinc-200 dark:border-zinc-700/60 bg-white dark:bg-zinc-900 p-5 shadow-sm"
    >
      {/* Title */}
      <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-100 mb-4 flex items-center gap-2">
        <span className="text-lg">💬</span>
        تحليل المشاعر
      </h3>

      {/* Overall sentiment */}
      <motion.div
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.15, type: "spring", stiffness: 280, damping: 22 }}
        className="flex justify-center mb-5"
      >
        <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl px-10 py-4 text-center ring-1 ring-emerald-200 dark:ring-emerald-800/60">
          <div className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums">
            82% إيجابي
          </div>
          <div className="text-[11px] font-semibold text-emerald-500 dark:text-emerald-400 mt-1">
            إجمالي رضا العملاء
          </div>
        </div>
      </motion.div>

      {/* Sentiment bars */}
      <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-3 mb-5">
        {SENTIMENTS.map((s) => (
          <motion.div key={s.label} variants={slideIn} className="space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-base">{s.emoji}</span>
                <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">{s.label}</span>
              </div>
              <span className="text-xs font-extrabold text-zinc-600 dark:text-zinc-400 tabular-nums">
                {s.pct}%
              </span>
            </div>
            <div className={`h-3 ${s.trackLight} ${s.trackDark} rounded-full overflow-hidden`}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${s.pct}%` }}
                transition={{ duration: 0.65, ease: "easeOut" }}
                className={`h-full ${s.color} rounded-full`}
              />
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Feedback snippets */}
      <div className="mb-4">
        <p className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 mb-2">أحدث التقييمات</p>
        <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-2">
          {FEEDBACKS.map((fb, idx) => (
            <motion.div
              key={idx}
              variants={slideIn}
              whileHover={{ x: -3, transition: { duration: 0.12 } }}
              className={`flex items-center gap-2.5 ${fb.bgLight} ${fb.bgDark} rounded-xl px-3 py-2.5 cursor-default`}
            >
              <span className="text-lg shrink-0">{fb.emoji}</span>
              <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300 leading-relaxed">
                {fb.text}
              </span>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Trend */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="border-t border-zinc-100 dark:border-zinc-800 pt-3"
      >
        <div className="flex items-center gap-2 text-[11px] text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl px-3 py-2.5">
          <span>📈</span>
          <span className="font-semibold">الرضا ارتفع 5% هذا الشهر</span>
        </div>
      </motion.div>
    </motion.div>
  );
}
