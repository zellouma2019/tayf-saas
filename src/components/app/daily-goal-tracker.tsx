"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Target, Flame, Award, Star, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface DailyGoalTrackerProps {
  target: number;
  current: number;
  unit?: string;
  streak?: number;
}

export function DailyGoalTracker({ target, current, unit = "طلب", streak = 0 }: DailyGoalTrackerProps) {
  const [showConfetti, setShowConfetti] = useState(false);
  const percentage = Math.min(100, Math.round((current / Math.max(1, target)) * 100));
  const isComplete = current >= target;
  const remaining = Math.max(0, target - current);

  const handleCelebrate = () => {
    if (isComplete && !showConfetti) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-5" dir="rtl" onClick={handleCelebrate}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={cn(
            "w-9 h-9 rounded-lg flex items-center justify-center",
            isComplete ? "bg-emerald-100 dark:bg-emerald-900/30" :
            percentage >= 50 ? "bg-amber-100 dark:bg-amber-900/30" :
            "bg-zinc-100 dark:bg-zinc-800/30"
          )}>
            {isComplete ? <Award className="h-5 w-5 text-emerald-600" /> : <Target className="h-5 w-5 text-foreground" />}
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">هدف اليوم</h3>
            <p className="text-[10px] text-muted-foreground">{target} {unit} يومياً</p>
          </div>
        </div>
        {streak > 0 && (
          <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2.5 py-1 rounded-full">
            <Flame className="h-3.5 w-3.5" />
            <span className="text-xs font-bold">{streak} يوم</span>
          </div>
        )}
      </div>

      {/* Circular progress */}
      <div className="flex items-center justify-center mb-4">
        <div className="relative">
          <svg width="140" height="140" viewBox="0 0 140 140">
            <circle cx="70" cy="70" r="58" fill="none" stroke="currentColor" strokeWidth="8" className="text-muted/15" />
            <motion.circle
              cx="70" cy="70" r="58"
              fill="none"
              stroke={isComplete ? "#10b981" : percentage >= 50 ? "#f59e0b" : "#8b5cf6"}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 58}
              initial={{ strokeDashoffset: 2 * Math.PI * 58 }}
              animate={{ strokeDashoffset: 2 * Math.PI * 58 * (1 - percentage / 100) }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              style={{ transform: "rotate(-90deg)", transformOrigin: "50% 50%" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.span
              key={percentage}
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="text-3xl font-bold text-foreground tabular-nums"
            >
              {percentage}%
            </motion.span>
            <span className="text-[10px] text-muted-foreground">{current}/{target}</span>
          </div>
        </div>
      </div>

      {/* Status message */}
      <AnimatePresence mode="wait">
        <motion.div
          key={isComplete ? "done" : remaining > 0 ? "remaining" : "zero"}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -5 }}
          className="text-center"
        >
          {isComplete ? (
            <div className="flex items-center justify-center gap-1.5 text-emerald-600 dark:text-emerald-400">
              <Star className="h-4 w-4 fill-current" />
              <span className="text-sm font-bold">تم تحقيق الهدف!</span>
              <Star className="h-4 w-4 fill-current" />
            </div>
          ) : remaining > 0 ? (
            <p className="text-xs text-muted-foreground">
              متبقي <span className="font-bold text-foreground">{remaining}</span> {unit}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">ابدأ يومك!</p>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Confetti effect */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl">
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ y: -10, x: "50%", opacity: 1, scale: 1 }}
              animate={{ y: 150, x: `${30 + Math.random() * 40}%`, opacity: 0, scale: 0.5, rotate: Math.random() * 360 }}
              transition={{ duration: 1.5 + Math.random(), delay: i * 0.05 }}
              className="absolute w-2 h-2 rounded-full"
              style={{
                backgroundColor: ["#10b981", "#f59e0b", "#8b5cf6", "#ef4444", "#3b82f6"][i % 5],
                top: 0,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
