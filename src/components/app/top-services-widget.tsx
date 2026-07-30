"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Trophy, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ServiceItem {
  rank: number;
  name: string;
  orders: number;
  revenue: number;
  maxRevenue: number;
}

const SERVICES_DATA: Omit<ServiceItem, "maxRevenue">[] = [
  { rank: 1, name: "طباعة مستندات", orders: 45, revenue: 85000 },
  { rank: 2, name: "طباعة صور", orders: 32, revenue: 64000 },
  { rank: 3, name: "طباعة ملصقات", orders: 28, revenue: 42000 },
  { rank: 4, name: "طباعة كروت شخصية", orders: 22, revenue: 55000 },
  { rank: 5, name: "طباعة بانرات", orders: 15, revenue: 75000 },
];

const TOTAL_REVENUE = SERVICES_DATA.reduce((s, i) => s + i.revenue, 0);
const MAX_REVENUE = Math.max(...SERVICES_DATA.map((s) => s.revenue));

const RANK_STYLES: Record<
  number,
  { bg: string; text: string; border: string }
> = {
  1: {
    bg: "bg-amber-50 dark:bg-amber-900/20",
    text: "text-amber-700 dark:text-amber-300",
    border: "border-amber-200 dark:border-amber-800/50",
  },
  2: {
    bg: "bg-neutral-50 dark:bg-neutral-800/50",
    text: "text-neutral-600 dark:text-neutral-300",
    border: "border-neutral-200 dark:border-neutral-700/50",
  },
  3: {
    bg: "bg-orange-50 dark:bg-orange-900/20",
    text: "text-orange-700 dark:text-orange-300",
    border: "border-orange-200 dark:border-orange-800/50",
  },
};

function AnimatedCounter({
  target,
  prefix = "",
  suffix = "",
  duration = 1.2,
}: {
  target: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
}) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (hasAnimated.current) return;
    hasAnimated.current = true;

    const startTime = performance.now();
    const durationMs = duration * 1000;

    function tick(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / durationMs, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(target * eased));
      if (progress < 1) requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  }, [target, duration]);

  const formatted = count.toLocaleString("ar-DZ");

  return (
    <span ref={ref}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}

function formatDZD(amount: number) {
  return amount.toLocaleString("ar-DZ") + " د.ج";
}

export function TopServicesWidget() {
  return (
    <Card className="w-full" dir="rtl">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            <CardTitle className="text-base font-bold">
              أفضل الخدمات
            </CardTitle>
          </div>
          <div className="flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1.5 rounded-lg">
            <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="text-sm font-bold text-emerald-700 dark:text-emerald-300">
              <AnimatedCounter target={TOTAL_REVENUE} suffix=" د.ج" />
            </span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          إجمالي الإيرادات من الخدمات الأعلى أداءً
        </p>
      </CardHeader>

      <CardContent className="pt-0">
        <motion.div
          className="space-y-2.5"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
          }}
        >
          {SERVICES_DATA.map((service) => {
            const style = RANK_STYLES[service.rank];
            const barWidth = (service.revenue / MAX_REVENUE) * 100;

            return (
              <motion.div
                key={service.rank}
                variants={{
                  hidden: { opacity: 0, x: 16 },
                  visible: { opacity: 1, x: 0 },
                }}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-xl border transition-colors hover:bg-muted/30",
                  service.rank <= 3 && style?.bg,
                  service.rank <= 3 && style?.border
                )}
              >
                {/* Rank */}
                <div
                  className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black shrink-0",
                    service.rank === 1 &&
                      "bg-amber-500 text-white shadow-sm shadow-amber-200 dark:shadow-amber-900/50",
                    service.rank === 2 &&
                      "bg-neutral-400 text-white",
                    service.rank === 3 &&
                      "bg-orange-500 text-white",
                    service.rank > 3 &&
                      "bg-muted text-muted-foreground"
                  )}
                >
                  {service.rank}
                </div>

                {/* Info + bar */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1.5">
                    <span
                      className={cn(
                        "text-sm font-bold truncate",
                        service.rank <= 3 && style?.text
                      )}
                    >
                      {service.name}
                    </span>
                    <span className="text-xs text-muted-foreground shrink-0 mr-2">
                      <AnimatedCounter target={service.orders} suffix=" طلب" />
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                      <motion.div
                        className={cn(
                          "h-full rounded-full",
                          service.rank === 1 && "bg-amber-500",
                          service.rank === 2 && "bg-neutral-400",
                          service.rank === 3 && "bg-orange-500",
                          service.rank === 4 && "bg-sky-500",
                          service.rank === 5 && "bg-violet-500"
                        )}
                        initial={{ width: 0 }}
                        animate={{ width: `${barWidth}%` }}
                        transition={{
                          duration: 0.7,
                          delay: 0.2,
                          ease: "easeOut",
                        }}
                      />
                    </div>
                    <span className="text-xs font-bold text-foreground min-w-[6rem] text-left">
                      {formatDZD(service.revenue)}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </CardContent>
    </Card>
  );
}
