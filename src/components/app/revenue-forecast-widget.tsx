"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, CalendarDays, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

// ===== RevenueForecastWidget =====
// ويدجت توقعات الإيرادات الشهرية مع رسم بياني مصغر

interface RevenueForecastWidgetProps {
  /** إيرادات الشهر الحالية حتى الآن */
  currentMonthRevenue: number;
  /** الأيام المتبقية في الشهر */
  daysRemaining: number;
  /** متوسط الإيرادات اليومية */
  dailyAverage: number;
  className?: string;
}

export function RevenueForecastWidget({
  currentMonthRevenue,
  daysRemaining,
  dailyAverage,
  className,
}: RevenueForecastWidgetProps) {
  // حساب الإيرادات المتوقعة نهاية الشهر
  const projectedTotal = useMemo(() => {
    return currentMonthRevenue + (daysRemaining * dailyAverage);
  }, [currentMonthRevenue, daysRemaining, dailyAverage]);

  // حساب اتجاه النمو (محاكاة: مقارنة بمتوسط افتراضي)
  const lastMonthDailyAvg = dailyAverage * 0.9; // محاكاة: الشهر الماضي أقل 10%
  const trendPercent = useMemo(() => {
    if (lastMonthDailyAvg === 0) return 0;
    return Math.round(((dailyAverage - lastMonthDailyAvg) / lastMonthDailyAvg) * 100);
  }, [dailyAverage, lastMonthDailyAvg]);

  const isPositive = trendPercent >= 0;

  // توليد نقاط الرسم البياني المصغر
  const sparklinePoints = useMemo(() => {
    const daysElapsed = 30 - daysRemaining;
    const actualDays = Math.max(daysElapsed, 5);
    const width = 200;
    const height = 50;
    const maxVal = Math.max(projectedTotal, currentMonthRevenue) * 1.1;

    const actual: string[] = [];
    const forecast: string[] = [];

    for (let i = 0; i < 30; i++) {
      const x = (i / 29) * width;
      if (i < actualDays) {
        // بيانات فعلية — نمو تدريجي
        const y = height - ((currentMonthRevenue / maxVal) * (i / actualDays) * height);
        actual.push(`${x},${y}`);
      } else {
        // بيانات متوقعة
        const progress = (i - actualDays) / Math.max(daysRemaining, 1);
        const y = height - (
          (currentMonthRevenue / maxVal) * height +
          ((projectedTotal - currentMonthRevenue) / maxVal) * height * progress
        );
        forecast.push(`${x},${y}`);
      }
    }

    // نقطة الانتقال
    const transitionX = (actualDays / 29) * width;
    const transitionY = height - (currentMonthRevenue / maxVal) * height;

    return {
      actual: actual.join(" "),
      forecast: [
        `${transitionX},${transitionY}`,
        ...forecast,
      ].join(" "),
      transitionX,
      transitionY,
    };
  }, [currentMonthRevenue, projectedTotal, daysRemaining]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={cn(
        "widget-glass rounded-2xl p-4 sm:p-5 overflow-hidden",
        className
      )}
      dir="rtl"
    >
      {/* الرأس */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
            <CalendarDays className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">توقعات الإيرادات</h3>
            <p className="text-[10px] text-muted-foreground">
              {daysRemaining > 0 ? `${daysRemaining} يوم متبقي` : "انتهى الشهر"}
            </p>
          </div>
        </div>

        {/* شارة الاتجاه */}
        <div className={cn("trend-badge text-xs", isPositive ? "up" : "down")}>
          {isPositive ? (
            <TrendingUp className="h-3.5 w-3.5" />
          ) : (
            <TrendingDown className="h-3.5 w-3.5" />
          )}
          <span>{isPositive ? "+" : ""}{trendPercent}%</span>
        </div>
      </div>

      {/* الرقم الكبير المتوقع */}
      <div className="mb-1">
        <span className="metric-large-number">
          {Math.round(projectedTotal).toLocaleString("ar-SA-u-nu-latn")}
        </span>
        <span className="text-xs text-muted-foreground mr-1.5">د.ج متوقع</span>
      </div>

      {/* رسم بياني مصغر SVG */}
      <div className="relative mt-2 mb-3">
        <svg
          viewBox="0 0 200 50"
          className="w-full h-12"
          preserveAspectRatio="none"
        >
          {/* خط الإيرادات الفعلية (متصل) */}
          {sparklinePoints.actual && (
            <polyline
              points={sparklinePoints.actual}
              fill="none"
              stroke={isPositive ? "#10b981" : "#f43f5e"}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
          {/* خط التوقع (متقطع) */}
          {sparklinePoints.forecast && (
            <polyline
              points={sparklinePoints.forecast}
              fill="none"
              stroke={isPositive ? "#10b981" : "#f43f5e"}
              strokeWidth="2"
              strokeDasharray="4 3"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.5"
            />
          )}
        </svg>
        {/* وسيلة إيضاح */}
        <div className="flex items-center gap-3 mt-1">
          <div className="flex items-center gap-1">
            <div className="w-3 h-0.5 rounded bg-emerald-500" />
            <span className="text-[9px] text-muted-foreground">فعلي</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-0.5 rounded bg-emerald-500 opacity-50" style={{ borderTop: "1px dashed #10b981" }} />
            <span className="text-[9px] text-muted-foreground">متوقع</span>
          </div>
        </div>
      </div>

      {/* مقاييس صغيرة */}
      <div className="flex items-center justify-between pt-3 border-t border-border/50">
        <div className="text-center">
          <p className="text-xs font-bold text-foreground tabular-nums">
            {currentMonthRevenue.toLocaleString("ar-SA-u-nu-latn")}
          </p>
          <p className="text-[9px] text-muted-foreground">الفعلي</p>
        </div>
        <div className="w-px h-6 bg-border" />
        <div className="flex items-center gap-1">
          <Zap className="h-3 w-3 text-amber-500" />
          <p className="text-xs font-bold text-foreground tabular-nums">
            {dailyAverage.toLocaleString("ar-SA-u-nu-latn")}
          </p>
          <span className="text-[9px] text-muted-foreground">يومياً</span>
        </div>
      </div>
    </motion.div>
  );
}
