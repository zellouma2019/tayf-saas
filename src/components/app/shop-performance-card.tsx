"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Star, ShoppingBag, DollarSign, Receipt, Store } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatNumber } from "@/lib/admin-utils";
import { STATUS_COLORS } from "@/lib/admin-utils";

// ===== ShopPerformanceCard =====
// بطاقة أداء المتجر — تعرض مؤشرات الأداء الرئيسية لكل متجر

interface ShopPerformanceCardProps {
  /** اسم المتجر */
  shopName: string;
  /** الرمز الفريد */
  slug: string;
  /** عدد الطلبات */
  ordersCount: number;
  /** إجمالي الإيرادات */
  revenue: number;
  /** التقييم (من 5) */
  rating: number;
  /** حالة المتجر */
  status: string;
  className?: string;
}

// خريطة حالات المتجر
const SHOP_STATUS_MAP: Record<string, string> = {
  active:    "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800",
  inactive:  "bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-900 dark:text-gray-400 dark:border-gray-700",
  suspended: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800",
};

const SHOP_STATUS_LABEL: Record<string, string> = {
  active: "نشط",
  inactive: "غير نشط",
  suspended: "معلّق",
};

// توليد نجوم التقييم
function RatingStars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5" dir="ltr">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={cn(
            "h-3.5 w-3.5",
            i < Math.round(rating)
              ? "text-amber-400 fill-amber-400"
              : "text-muted-foreground/30"
          )}
        />
      ))}
      <span className="text-[11px] font-bold text-foreground mr-1 tabular-nums">
        {rating.toFixed(1)}
      </span>
    </div>
  );
}

export function ShopPerformanceCard({
  shopName,
  slug,
  ordersCount,
  revenue,
  rating,
  status,
  className,
}: ShopPerformanceCardProps) {
  // حساب متوسط قيمة الطلب
  const avgOrderValue = useMemo(() => {
    return ordersCount > 0 ? Math.round(revenue / ordersCount) : 0;
  }, [ordersCount, revenue]);

  // المؤشرات المصغرة
  const metrics = useMemo(() => [
    {
      icon: ShoppingBag,
      label: "الطلبات",
      value: formatNumber(ordersCount),
      color: "bg-sky-100 text-sky-600 dark:bg-sky-950 dark:text-sky-400",
    },
    {
      icon: DollarSign,
      label: "الإيرادات",
      value: `${formatNumber(revenue)} د.ج`,
      color: "bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400",
    },
    {
      icon: Receipt,
      label: "متوسط الطلب",
      value: `${formatNumber(avgOrderValue)} د.ج`,
      color: "bg-violet-100 text-violet-600 dark:bg-violet-950 dark:text-violet-400",
    },
    {
      icon: Star,
      label: "التقييم",
      value: null, // يُعرض كنجوم
      color: "bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400",
    },
  ], [ordersCount, revenue, avgOrderValue]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, type: "spring" }}
      whileHover={{ y: -4 }}
      className={cn("hover-lift", className)}
    >
      <Card className="card-glass-morphism overflow-hidden">
        <CardContent className="p-4">
          {/* رأس البطاقة: اسم المتجر + شارة الحالة */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Store className="h-4.5 w-4.5 text-primary" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-foreground truncate">
                  {shopName}
                </h3>
                <span className="text-[10px] font-mono text-muted-foreground truncate block">
                  {slug}
                </span>
              </div>
            </div>
            <Badge
              className={cn(
                "text-[10px] border",
                SHOP_STATUS_MAP[status] || SHOP_STATUS_MAP.inactive
              )}
            >
              {SHOP_STATUS_LABEL[status] || status}
            </Badge>
          </div>

          {/* شبكة المقاييس */}
          <div className="grid grid-cols-2 gap-2.5">
            {metrics.map((metric, i) => {
              const Icon = metric.icon;
              return (
                <div
                  key={metric.label}
                  className="flex items-center gap-2 p-2 rounded-lg bg-background/50 border border-border/30"
                >
                  <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center shrink-0", metric.color)}>
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0">
                    {metric.value ? (
                      <p className="text-xs font-bold text-foreground tabular-nums truncate">
                        {metric.value}
                      </p>
                    ) : (
                      <RatingStars rating={rating} />
                    )}
                    <p className="text-[9px] text-muted-foreground">{metric.label}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
