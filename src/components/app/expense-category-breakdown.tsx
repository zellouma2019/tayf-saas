"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";

interface ExpenseCategory {
  name: string;
  nameAr: string;
  amount: number;
  color: string;
}

const categories: ExpenseCategory[] = [
  { name: "Paper", nameAr: "ورق", amount: 42000, color: "#6366f1" },
  { name: "Ink", nameAr: "حبر", amount: 28500, color: "#f59e0b" },
  { name: "Labor", nameAr: "عمالة", amount: 55000, color: "#10b981" },
  { name: "Equipment", nameAr: "معدات", amount: 18000, color: "#ef4444" },
  { name: "Other", nameAr: "أخرى", amount: 12500, color: "#8b5cf6" },
];

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
};
const itemVariants = {
  hidden: { opacity: 0, x: 20 },
  show: { opacity: 1, x: 0, transition: { duration: 0.4 } },
};

function formatDZD(amount: number): string {
  return `${amount.toLocaleString("ar-DZ")} د.ج`;
}

export default function ExpenseCategoryBreakdown() {
  const [animated, setAnimated] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const total = useMemo(() => categories.reduce((s, c) => s + c.amount, 0), []);

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 300);
    return () => clearTimeout(timer);
  }, []);

  // SVG donut chart calculations
  const size = 200;
  const strokeWidth = 32;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const segments = useMemo(() => {
    return categories.reduce<Array<ExpenseCategory & { percent: number; dashLength: number; gap: number; offset: number }>>(
      (acc, cat) => {
        const percent = cat.amount / total;
        const dashLength = percent * circumference;
        const gap = circumference - dashLength;
        const offset = acc.length > 0
          ? acc[acc.length - 1].offset + acc[acc.length - 1].dashLength
          : 0;
        acc.push({ ...cat, percent, dashLength, gap, offset });
        return acc;
      },
      []
    );
  }, [total, circumference]);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
        توزيع المصاريف
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
        {/* Donut Chart */}
        <motion.div
          className="flex justify-center"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <div className="relative">
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
              {/* Track */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke="#f1f5f9"
                strokeWidth={strokeWidth}
                className="dark:stroke-neutral-700"
              />

              {/* Segments */}
              {segments.map((seg, i) => (
                <motion.circle
                  key={seg.name}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="none"
                  stroke={seg.color}
                  strokeWidth={hoveredIndex === i || hoveredIndex === null ? strokeWidth : strokeWidth + 4}
                  strokeLinecap="round"
                  strokeDasharray={`${animated ? seg.dashLength : 0} ${seg.gap}`}
                  strokeDashoffset={-seg.offset}
                  transform={`rotate(-90 ${size / 2} ${size / 2})`}
                  style={{
                    transition: "stroke-dasharray 1s ease, stroke-width 0.2s ease",
                    cursor: "pointer",
                  }}
                  onMouseEnter={() => setHoveredIndex(i)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 + i * 0.15 }}
                />
              ))}
            </svg>

            {/* Center Text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <motion.p
                className="text-2xl font-bold text-neutral-900 dark:text-neutral-100"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
              >
                {formatDZD(total)}
              </motion.p>
              <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-0.5">إجمالي المصاريف</p>
            </div>
          </div>
        </motion.div>

        {/* Legend */}
        <motion.div
          className="space-y-3"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          {segments.map((seg, i) => (
            <motion.div
              key={seg.name}
              variants={itemVariants}
              className={`flex items-center justify-between p-3 rounded-xl transition-all cursor-default ${
                hoveredIndex === i
                  ? "bg-neutral-50 dark:bg-neutral-700/50 scale-[1.02]"
                  : ""
              }`}
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: seg.color }}
                />
                <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  {seg.nameAr}
                </span>
              </div>
              <div className="text-left">
                <p className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                  {formatDZD(seg.amount)}
                </p>
                <p className="text-xs text-neutral-400 dark:text-neutral-500">
                  {(seg.percent * 100).toFixed(1)}%
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
