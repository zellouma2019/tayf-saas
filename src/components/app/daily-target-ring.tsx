"use client";

import { useState, useEffect, useRef } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface DailyTargetRingProps {
  currentRevenue: number;
  targetRevenue?: number;
  yesterdayTrend?: number; // النسبة المئوية للتغير مقارنة بالأمس
}

// ===== Animated Counter =====
function useAnimatedCounter(target: number, duration = 1200) {
  const [display, setDisplay] = useState(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const start = performance.now();
    const from = 0;

    function animate(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutExpo
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setDisplay(Math.round(from + (target - from) * eased));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    }
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration]);

  return display;
}

// ===== الحلقة الرئيسية =====
export function DailyTargetRing({
  currentRevenue,
  targetRevenue = 5000,
  yesterdayTrend = 12,
}: DailyTargetRingProps) {
  const percentage = targetRevenue > 0
    ? Math.min((currentRevenue / targetRevenue) * 100, 999)
    : 0;
  const clampedPercentage = Math.min(percentage, 100);
  const animatedPercent = useAnimatedCounter(Math.round(clampedPercentage));

  // ألوان الترميز
  const ringColor =
    percentage >= 100
      ? "text-gold-500"
      : percentage >= 60
        ? "text-emerald-500"
        : percentage >= 30
          ? "text-amber-500"
          : "text-rose-500";

  const ringStroke =
    percentage >= 100
      ? "#d4a853"
      : percentage >= 60
        ? "#10b981"
        : percentage >= 30
          ? "#f59e0b"
          : "#ef4444";

  const ringBg =
    percentage >= 100
      ? "stroke-gold-500/15"
      : percentage >= 60
        ? "stroke-emerald-500/15"
        : percentage >= 30
          ? "stroke-amber-500/15"
          : "stroke-rose-500/15";

  // أبعاد SVG
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clampedPercentage / 100) * circumference;
  const center = 64;
  const strokeWidth = 8;

  const isPositiveTrend = yesterdayTrend >= 0;
  const TrendIcon = isPositiveTrend ? TrendingUp : TrendingDown;
  const trendColor = isPositiveTrend
    ? "text-emerald-500 dark:text-emerald-400"
    : "text-rose-500 dark:text-rose-400";

  return (
    <div className="neu-raised rounded-xl p-4 sm:p-5 card-glow">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-foreground">هدف اليوم</h3>
        <span className={cn("text-[11px] font-medium flex items-center gap-1", trendColor)}>
          <TrendIcon className="h-3 w-3" />
          <span dir="ltr">{isPositiveTrend ? "+" : ""}{yesterdayTrend}%</span>
          <span className="text-muted-foreground">vs أمس</span>
        </span>
      </div>

      <div className="flex items-center gap-4">
        {/* حلقة التقدم */}
        <div className="sparkline-wrap relative shrink-0">
          <svg
            width={center * 2}
            height={center * 2}
            viewBox={`0 0 ${center * 2} ${center * 2}`}
            className="transform -rotate-90"
          >
            {/* الخلفية */}
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              strokeWidth={strokeWidth}
              className={ringBg}
            />
            {/* التقدم */}
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              stroke={ringStroke}
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              className="transition-all duration-1000 ease-out"
              style={{
                filter: percentage >= 100 ? "drop-shadow(0 0 6px rgba(212,168,83,0.4))" : "none",
              }}
            />
          </svg>
          {/* النسبة في المركز */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={cn("text-2xl font-bold tabular-nums leading-none", ringColor)}>
              {animatedPercent}
            </span>
            <span className="text-[10px] text-muted-foreground mt-0.5">%</span>
          </div>
        </div>

        {/* التفاصيل */}
        <div className="flex-1 min-w-0 space-y-2">
          <div>
            <div className="text-[11px] text-muted-foreground">الحالي</div>
            <div className="text-lg font-bold tabular-nums text-foreground">
              {currentRevenue.toLocaleString("ar-DZ")}
            </div>
          </div>
          <div>
            <div className="text-[11px] text-muted-foreground">الهدف</div>
            <div className="text-sm font-semibold tabular-nums text-muted-foreground">
              {targetRevenue.toLocaleString("ar-DZ")}
            </div>
          </div>
          {percentage >= 100 && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-gold-500/10 text-gold-600 dark:text-gold-400 border border-gold-500/20">
              ✨ تم تحقيق الهدف!
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
