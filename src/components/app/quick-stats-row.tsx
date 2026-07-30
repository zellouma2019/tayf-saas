"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";

// ===== QuickStatsRow =====
// صف إحصائيات سريع قابل للتمرير أفقياً — للوحة التحكم

interface StatItem {
  /** نص العنوان */
  label: string;
  /** قيمة الإحصائية */
  value: string | number;
  /** أيقونة React */
  icon: React.ReactNode;
  /** نص الاتجاه (مثال: "+12%") */
  trend?: string;
  /** لون خلفية الأيقونة */
  color?: string;
}

interface QuickStatsRowProps {
  /** مصفوفة الإحصائيات */
  stats: StatItem[];
  className?: string;
}

export function QuickStatsRow({ stats, className }: QuickStatsRowProps) {
  return (
    <div
      className={cn("mobile-swipeable", className)}
      dir="rtl"
    >
      {stats.map((stat, index) => {
        // تحديد اتجاه الاتجاه
        const isUp = stat.trend?.startsWith("+");
        const isDown = stat.trend?.startsWith("-");

        return (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              delay: index * 0.06,
              type: "spring",
              stiffness: 260,
              damping: 20,
            }}
            className="touch-feedback widget-glass rounded-xl p-3 sm:p-4 min-w-[140px] sm:min-w-[160px] flex flex-col gap-2"
          >
            {/* صندوق الأيقونة */}
            <div
              className={cn(
                "w-9 h-9 rounded-lg flex items-center justify-center",
                stat.color || "bg-primary/15 text-primary"
              )}
            >
              {stat.icon}
            </div>

            {/* القيمة الكبيرة */}
            <div className="flex items-end gap-1.5">
              <span className="text-lg font-extrabold text-foreground leading-tight tabular-nums">
                {typeof stat.value === "number"
                  ? stat.value.toLocaleString("ar-SA-u-nu-latn")
                  : stat.value}
              </span>

              {/* شارة الاتجاه */}
              {stat.trend && (
                <span
                  className={cn(
                    "trend-badge text-[10px] px-1.5 py-0.5",
                    isUp ? "up" : isDown ? "down" : "neutral"
                  )}
                >
                  {isUp && <TrendingUp className="h-2.5 w-2.5" />}
                  {isDown && <TrendingDown className="h-2.5 w-2.5" />}
                  {stat.trend}
                </span>
              )}
            </div>

            {/* التسمية */}
            <span className="text-[11px] text-muted-foreground font-medium leading-tight">
              {stat.label}
            </span>
          </motion.div>
        );
      })}
    </div>
  );
}
