"use client";

import { motion, AnimatePresence, type Variants } from "framer-motion";
import { useState, useEffect } from "react";

interface PipelineStage {
  emoji: string;
  name: string;
  count: number;
  isBottleneck: boolean;
}

const STAGES: PipelineStage[] = [
  { emoji: "📥", name: "الاستقبال", count: 12, isBottleneck: false },
  { emoji: "👁️", name: "المراجعة", count: 8, isBottleneck: false },
  { emoji: "🖨️", name: "الطباعة", count: 15, isBottleneck: true },
  { emoji: "✅", name: "التحقق", count: 5, isBottleneck: false },
  { emoji: "📦", name: "التجهيز", count: 3, isBottleneck: false },
  { emoji: "🚚", name: "التسليم", count: 7, isBottleneck: false },
];

const TOTAL_IN_PIPELINE = 50;

const timelineVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const stageVariants: Variants = {
  hidden: { opacity: 0, scale: 0.7, y: 8 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 22 },
  },
};

const lineVariants: Variants = {
  hidden: { scaleX: 0 },
  visible: { scaleX: 1, transition: { duration: 0.4, ease: "easeOut" } },
};

function cn(...classes: (string | false | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

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

export default function OrderFulfillmentTimeline() {
  const dark = useDark();
  const [activeStage, setActiveStage] = useState<number | null>(null);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className="rounded-2xl border border-zinc-200 dark:border-zinc-700/60 bg-white dark:bg-zinc-900 p-5 shadow-sm"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-100 flex items-center gap-2">
          <span className="text-lg">🔄</span>
          مسار تنفيذ الطلبات
        </h3>
        <motion.span
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 rounded-full px-3 py-1.5"
        >
          {TOTAL_IN_PIPELINE} طلب في المسار
        </motion.span>
      </div>

      {/* Timeline stages */}
      <AnimatePresence>
        <motion.div
          variants={timelineVariants}
          initial="hidden"
          animate="visible"
          className="flex items-start overflow-x-auto pb-3 -mx-1 px-1"
        >
          {STAGES.map((stage, idx) => {
            const isLast = idx === STAGES.length - 1;
            const isActive = activeStage === idx;
            const isBn = stage.isBottleneck;
            const totalOrders = STAGES.reduce((sum, s) => sum + s.count, 0);
            const stagePct = Math.round((stage.count / totalOrders) * 100);

            return (
              <motion.div
                key={stage.name}
                variants={stageVariants}
                onMouseEnter={() => setActiveStage(idx)}
                onMouseLeave={() => setActiveStage(null)}
                className="flex items-center shrink-0"
              >
                {/* Stage card */}
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.96 }}
                  className={cn(
                    "relative flex flex-col items-center gap-2 rounded-xl px-4 py-3 min-w-[85px] cursor-default transition-all duration-200",
                    isBn
                      ? "bg-amber-50 dark:bg-amber-900/25 ring-2 ring-amber-400/60 dark:ring-amber-500/50 shadow-sm shadow-amber-200/40 dark:shadow-amber-900/20"
                      : isActive
                        ? "bg-zinc-100 dark:bg-zinc-800 shadow-sm"
                        : "bg-zinc-50 dark:bg-zinc-800/40"
                  )}
                >
                  {/* Bottleneck badge */}
                  {isBn && (
                    <motion.span
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                      className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[9px] font-bold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-800/80 px-2 py-0.5 rounded-full whitespace-nowrap"
                    >
                      اختناق ⚠️
                    </motion.span>
                  )}

                  {/* Emoji */}
                  <span className="text-2xl">{stage.emoji}</span>

                  {/* Name */}
                  <span className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 whitespace-nowrap">
                    {stage.name}
                  </span>

                  {/* Count badge */}
                  <span
                    className={cn(
                      "text-[11px] font-extrabold tabular-nums rounded-full px-2.5 py-0.5",
                      isBn
                        ? "bg-amber-400 text-white dark:bg-amber-500"
                        : "bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300"
                    )}
                  >
                    {stage.count}
                  </span>

                  {/* Percentage tooltip on hover */}
                  <AnimatePresence>
                    {isActive && (
                      <motion.span
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 whitespace-nowrap"
                      >
                        {stagePct}%
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.div>

                {/* Connector line */}
                {!isLast && (
                  <div className="flex items-center px-1.5 self-center mt-1">
                    <motion.div
                      variants={lineVariants}
                      className="w-8 h-[2px] relative overflow-hidden"
                    >
                      {/* Base line */}
                      <div className="absolute inset-0 bg-zinc-200 dark:bg-zinc-700 rounded-full" />
                      {/* Animated fill */}
                      <motion.div
                        initial={{ scaleX: 0, originX: 0 }}
                        animate={{ scaleX: 1, originX: 0 }}
                        transition={{ delay: 0.5 + idx * 0.12, duration: 0.35 }}
                        className="absolute inset-0 bg-zinc-400 dark:bg-zinc-500 rounded-full"
                      />
                    </motion.div>
                    {/* Arrow */}
                    <svg
                      viewBox="0 0 8 8"
                      className="w-2 h-2 text-zinc-400 dark:text-zinc-500 -mr-0.5"
                    >
                      <path
                        d="M0 0L8 4L0 8Z"
                        fill="currentColor"
                        transform="rotate(0)"
                      />
                    </svg>
                  </div>
                )}
              </motion.div>
            );
          })}
        </motion.div>
      </AnimatePresence>

      {/* Bottleneck warning */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800"
      >
        <div className="flex items-start gap-2 text-[11px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-xl px-3 py-2.5">
          <span className="shrink-0">⚠️</span>
          <span className="font-medium">
            مرحلة الطباعة تعاني من ضغط كبير — {STAGES[2].count} طلب في الانتظار
          </span>
        </div>
      </motion.div>
    </motion.div>
  );
}
