"use client";

import { useState, useEffect, useCallback } from "react";
import { Target, TrendingUp, CheckCircle2, Flame, Edit3, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

// ===== Revenue Goal Widget =====
// مكون هدف الإيرادات اليومية

interface RevenueGoalWidgetProps {
  todayRevenue: number;
  todayOrders: number;
  currency?: string;
  className?: string;
}

const GOAL_KEY = "tayf-revenue-goal";

function getStoredGoal(): number {
  if (typeof window === "undefined") return 0;
  try {
    const d = localStorage.getItem(GOAL_KEY);
    return d ? JSON.parse(d) : 0;
  } catch {
    return 0;
  }
}

function setStoredGoal(val: number) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(GOAL_KEY, JSON.stringify(val));
  } catch {}
}

// ===== Motivational messages based on progress =====
function getMotivation(pct: number): { emoji: string; message: string; color: string } {
  if (pct >= 100) return { emoji: "🎉", message: "هدف اليوم محقق!", color: "text-emerald-500" };
  if (pct >= 80) return { emoji: "🔥", message: "اقتربت! استمر", color: "text-amber-500" };
  if (pct >= 60) return { emoji: "💪", message: "تقدم جيد", color: "text-violet-500" };
  if (pct >= 40) return { emoji: "📈", message: "في الطريق الصحيح", color: "text-sky-500" };
  if (pct >= 20) return { emoji: "🌱", message: "بداية جيدة", color: "text-emerald-400" };
  if (pct > 0) return { emoji: "📋", message: "لنبدأ اليوم", color: "text-muted-foreground" };
  return { emoji: "🎯", message: "حدد هدفك اليومي", color: "text-muted-foreground" };
}

export function RevenueGoalWidget({ todayRevenue, todayOrders, currency = "د.ج", className }: RevenueGoalWidgetProps) {
  const [goal, setGoal] = useState(0);
  const [editing, setEditing] = useState(false);
  const [inputVal, setInputVal] = useState("");
  const [showConfetti, setShowConfetti] = useState(false);
  const [prevPct, setPrevPct] = useState(0);

  useEffect(() => {
    setGoal(getStoredGoal());
  }, []);

  const pct = goal > 0 ? Math.min((todayRevenue / goal) * 100, 100) : 0;
  const isComplete = pct >= 100;

  // Trigger confetti when goal is first reached
  useEffect(() => {
    if (isComplete && prevPct < 100) {
      setShowConfetti(true);
      const t = setTimeout(() => setShowConfetti(false), 2000);
      return () => clearTimeout(t);
    }
    setPrevPct(pct);
  }, [isComplete, pct, prevPct]);

  const handleSaveGoal = useCallback(() => {
    const val = parseInt(inputVal, 10);
    if (val > 0 && val <= 999999) {
      setGoal(val);
      setStoredGoal(val);
      setEditing(false);
    }
  }, [inputVal]);

  const motivation = getMotivation(pct);

  return (
    <div className={cn(
      "bg-card rounded-xl border border-border shadow-sm overflow-hidden card-tilt-3d group",
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 sm:px-5 pt-4 pb-3">
        <div className="flex items-center gap-2">
          <div className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center",
            isComplete ? "bg-emerald-500/15" : "bg-violet-500/15"
          )}>
            {isComplete ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            ) : (
              <Target className="h-4 w-4 text-violet-500" />
            )}
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">هدف الإيرادات</h3>
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <span className={motivation.color}>{motivation.emoji} {motivation.message}</span>
            </div>
          </div>
        </div>

        {/* Goal amount + edit */}
        <div className="flex items-center gap-2">
          {editing ? (
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                placeholder="المبلغ"
                className="w-24 h-8 text-sm rounded-lg border border-border bg-background px-2 text-center tabular-nums focus-visible:ring-2 focus-visible:ring-violet-500/30 focus-visible:outline-none"
                dir="ltr"
                autoFocus
                onKeyDown={(e) => { if (e.key === "Enter") handleSaveGoal(); if (e.key === "Escape") setEditing(false); }}
              />
              <button
                onClick={handleSaveGoal}
                className="h-8 w-8 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center transition-colors"
              >
                <Save className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => { setEditing(true); setInputVal(goal > 0 ? String(goal) : ""); }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium hover:bg-secondary transition-colors group/edit"
            >
              <span className="text-foreground tabular-nums">
                {goal > 0 ? `${goal.toLocaleString()} ${currency}` : "حدد هدف"}
              </span>
              <Edit3 className="h-3 w-3 text-muted-foreground opacity-0 group-hover/edit:opacity-100 transition-opacity" />
            </button>
          )}
        </div>
      </div>

      {/* Progress section */}
      {goal > 0 && (
        <div className="px-4 sm:px-5 pb-4 space-y-3">
          {/* Progress bar */}
          <div className="relative">
            <div className={cn("goal-progress-bar", isComplete && "complete")}>
              <div className="fill" style={{ width: `${pct}%` }} />
            </div>
          </div>

          {/* Stats row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-center">
                <div className="text-lg font-bold tabular-nums text-foreground">{Math.round(pct)}%</div>
                <div className="text-[10px] text-muted-foreground">محقق</div>
              </div>
              <div className="w-px h-8 bg-border" />
              <div className="text-center">
                <div className="text-lg font-bold tabular-nums text-foreground">{todayRevenue.toLocaleString()}</div>
                <div className="text-[10px] text-muted-foreground">من {goal.toLocaleString()}</div>
              </div>
            </div>

            {/* Confetti effect */}
            <AnimatePresence>
              {showConfetti && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="text-2xl"
                >
                  🎊
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex items-center gap-1">
              {pct >= 80 && !isComplete && (
                <Flame className="h-4 w-4 text-amber-500 animate-pulse" />
              )}
              {isComplete && (
                <TrendingUp className="h-4 w-4 text-emerald-500" />
              )}
              <span className={cn("text-xs font-medium", motivation.color)}>
                {todayOrders} طلب
              </span>
            </div>
          </div>

          {/* Mini milestones */}
          <div className="flex items-center gap-1">
            {[25, 50, 75, 100].map((m) => {
              const reached = pct >= m;
              return (
                <div
                  key={m}
                  className={cn(
                    "flex-1 h-1 rounded-full transition-all duration-500",
                    reached
                      ? isComplete
                        ? "bg-emerald-400"
                        : "bg-violet-400"
                      : "bg-border"
                  )}
                  title={`${m}%`}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* No goal set state */}
      {goal === 0 && (
        <div className="px-4 sm:px-5 pb-4">
          <button
            onClick={() => setEditing(true)}
            className="w-full py-6 rounded-xl border-2 border-dashed border-border hover:border-violet-400/50 hover:bg-violet-50/50 dark:hover:bg-violet-950/20 transition-all duration-300 flex flex-col items-center gap-2 group/set"
          >
            <Target className="h-6 w-6 text-muted-foreground group-hover/set:text-violet-500 transition-colors" />
            <span className="text-xs text-muted-foreground group-hover/set:text-foreground font-medium">اضغط لتحديد هدف اليوم</span>
          </button>
        </div>
      )}
    </div>
  );
}
