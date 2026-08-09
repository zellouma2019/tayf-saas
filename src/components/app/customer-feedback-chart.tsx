"use client";

import { motion } from "framer-motion";

const OVERALL_RATING = 4.7;
const TOTAL_REVIEWS = 324;

const RATING_DISTRIBUTION = [
  { stars: 5, percentage: 65 },
  { stars: 4, percentage: 22 },
  { stars: 3, percentage: 8 },
  { stars: 2, percentage: 3 },
  { stars: 1, percentage: 2 },
];

const FEEDBACK_CATEGORIES = [
  { name: "جودة الطباعة", percentage: 92, color: "text-emerald-500" },
  { name: "السرعة", percentage: 78, color: "text-amber-500" },
  { name: "خدمة العملاء", percentage: 85, color: "text-sky-500" },
];

function CircularProgress({ percentage, color }: { percentage: number; color: string }) {
  const radius = 32;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative w-20 h-20">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
        <circle cx="40" cy="40" r={radius} fill="none" stroke="currentColor"
          className="text-muted/50" strokeWidth="6" />
        <motion.circle
          cx="40" cy="40" r={radius} fill="none"
          stroke="currentColor"
          className={color}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-bold text-foreground">{percentage}%</span>
      </div>
    </div>
  );
}

function StarDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className="w-5 h-5"
          viewBox="0 0 20 20"
          fill={star <= Math.floor(rating) ? "currentColor" : star - rating <= 0.5 ? "currentColor" : "none"}
          stroke={star <= Math.floor(rating) ? "none" : "currentColor"}
          strokeWidth="1.5"
        >
          <path d="M10 1.5l2.47 5.01 5.53.8-4 3.9.94 5.49L10 14.27l-4.94 2.43L6 11.21l-4-3.9 5.53-.8L10 1.5z" />
        </svg>
      ))}
    </div>
  );
}

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function CustomerFeedbackChart() {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="bg-card border border-border rounded-2xl p-5 space-y-5"
    >
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-lg">
          ⭐
        </div>
        <div>
          <h3 className="font-bold text-foreground text-sm">تقييمات العملاء</h3>
          <p className="text-xs text-muted-foreground">{TOTAL_REVIEWS} تقييم</p>
        </div>
      </div>

      {/* Overall rating */}
      <motion.div variants={itemVariants} className="flex items-center gap-4 p-4 rounded-xl bg-muted/40">
        <div className="text-center">
          <span className="text-3xl font-black text-foreground">{OVERALL_RATING}</span>
          <span className="text-lg text-muted-foreground">/5</span>
          <div className="mt-1">
            <StarDisplay rating={OVERALL_RATING} className="text-amber-400" />
          </div>
        </div>
        <div className="border-s border-border pe-4 ms-4 w-full space-y-1.5">
          {RATING_DISTRIBUTION.map((item) => (
            <div key={item.stars} className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground w-3">{item.stars}</span>
              <svg className="w-3 h-3 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 1.5l2.47 5.01 5.53.8-4 3.9.94 5.49L10 14.27l-4.94 2.43L6 11.21l-4-3.9 5.53-.8L10 1.5z" />
              </svg>
              <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${item.percentage}%` }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className="h-full rounded-full bg-amber-400"
                />
              </div>
              <span className="text-[11px] text-muted-foreground w-8 text-start">{item.percentage}%</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Feedback categories */}
      <div className="grid grid-cols-3 gap-3">
        {FEEDBACK_CATEGORIES.map((cat) => (
          <motion.div
            key={cat.name}
            variants={itemVariants}
            className="flex flex-col items-center gap-2 p-3 rounded-xl border border-border bg-background"
          >
            <CircularProgress percentage={cat.percentage} color={cat.color} />
            <span className="text-xs font-medium text-foreground text-center">{cat.name}</span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
