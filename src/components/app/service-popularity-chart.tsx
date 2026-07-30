"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { TrendingUp, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatNumber } from "@/lib/admin-utils";

// ===== ServicePopularityChart =====
// رسم بياني أفقي لشعبية الخدمات حسب عدد الطلبات

interface ServicePopularityChartProps {
  services: Array<{
    name: string;
    count: number;
    percentage: number;
  }>;
  className?: string;
}

/** ألوان متدرجة حسب الترتيب */
function getBarGradientColor(index: number, total: number): string {
  // تدرج من أساسي إلى لهجة حسب الموقع
  const palette = [
    "from-primary to-primary/70",
    "from-violet-500 to-violet-400",
    "from-amber-500 to-amber-400",
    "from-emerald-500 to-emerald-400",
    "from-rose-500 to-rose-400",
    "from-sky-500 to-sky-400",
    "from-orange-500 to-orange-400",
    "from-teal-500 to-teal-400",
  ];
  return palette[index % palette.length];
}

/** لون خلفية شريط التقدم */
function getBarBgColor(index: number): string {
  const palette = [
    "bg-primary/10",
    "bg-violet-500/10",
    "bg-amber-500/10",
    "bg-emerald-500/10",
    "bg-rose-500/10",
    "bg-sky-500/10",
    "bg-orange-500/10",
    "bg-teal-500/10",
  ];
  return palette[index % palette.length];
}

export function ServicePopularityChart({
  services,
  className,
}: ServicePopularityChartProps) {
  // أكبر عدد لتحديد عرض الأشرطة
  const maxCount = useMemo(
    () => Math.max(...services.map((s) => s.count), 1),
    [services]
  );

  return (
    <Card className={cn("card-glass-morphism overflow-hidden", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-primary" />
          الخدمات الأكثر طلباً
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-3">
        {services.map((service, index) => {
          const barWidth = (service.count / maxCount) * 100;
          const gradientColor = getBarGradientColor(index, services.length);
          const bgColor = getBarBgColor(index);

          return (
            <motion.div
              key={service.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                duration: 0.4,
                delay: index * 0.1,
                type: "spring",
                stiffness: 80,
              }}
              className="stats-bar group"
            >
              {/* رأس الشريط: اسم الخدمة + الأرقام */}
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2 min-w-0">
                  {/* رقم الترتيب */}
                  <span
                    className={cn(
                      "w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold shrink-0",
                      index === 0
                        ? "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400"
                        : index === 1
                          ? "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                          : index === 2
                            ? "bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-400"
                            : "bg-accent text-muted-foreground"
                    )}
                  >
                    {index + 1}
                  </span>
                  <span className="text-xs font-medium text-foreground truncate">
                    {service.name}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-bold text-foreground tabular-nums">
                    {formatNumber(service.count)}
                  </span>
                  <span className="text-[10px] text-muted-foreground tabular-nums">
                    {service.percentage}%
                  </span>
                </div>
              </div>

              {/* الشريط الأفقي */}
              <div
                className={cn(
                  "progress-feedback h-2.5 rounded-full overflow-hidden",
                  bgColor
                )}
              >
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${barWidth}%` }}
                  transition={{
                    duration: 0.8,
                    delay: index * 0.1 + 0.2,
                    ease: "easeOut",
                  }}
                  className={cn(
                    "h-full rounded-full bg-gradient-to-l",
                    gradientColor
                  )}
                />
              </div>
            </motion.div>
          );
        })}

        {/* ملخص إجمالي */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: services.length * 0.1 + 0.5 }}
          className="flex items-center justify-center gap-1.5 pt-2 border-t border-border/30 text-[10px] text-muted-foreground"
        >
          <TrendingUp className="h-3 w-3" />
          <span>
            إجمالي:{" "}
            <span className="font-bold text-foreground tabular-nums">
              {formatNumber(services.reduce((sum, s) => sum + s.count, 0))}
            </span>{" "}
            طلب
          </span>
        </motion.div>
      </CardContent>
    </Card>
  );
}
