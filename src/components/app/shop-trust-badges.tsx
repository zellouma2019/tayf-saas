"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Shield, Lock, Award, Zap, Star, CheckCircle2, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { AnimatedCounter } from "@/components/ui/animated-counter";

// ===== ShopTrustBadges =====
// شارات الثقة والأمان للمتجر — تعرض مؤشرات الموثوقية

interface ShopTrustBadgesProps {
  shopName: string;
  totalOrders: number;
  avgRating: number;
  yearsActive: number;
  className?: string;
}

/** تعريف الشارات */
interface TrustBadgeConfig {
  id: string;
  icon: React.ReactNode;
  label: string;
  subtitle: string;
  color: string;
  bgColor: string;
  borderColor: string;
  iconColor: string;
}

/** توليد نجوم صغيرة */
function MiniStars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5" dir="ltr">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={cn(
            "h-3 w-3",
            i < Math.round(rating)
              ? "text-amber-400 fill-amber-400"
              : "text-muted-foreground/25"
          )}
        />
      ))}
    </div>
  );
}

/** حاوية الشارات الاجتماعية */
function SocialProofBar({ value, label, suffix }: { value: number; label: string; suffix: string }) {
  return (
    <div className="social-proof-bar flex items-center gap-1.5 text-xs text-muted-foreground">
      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
      <span className="font-medium text-foreground tabular-nums">
        {value.toLocaleString("ar-SA-u-nu-latn")}
      </span>
      <span>
        {suffix} {label}
      </span>
    </div>
  );
}

export function ShopTrustBadges({
  shopName,
  totalOrders,
  avgRating,
  yearsActive,
  className,
}: ShopTrustBadgesProps) {
  // شارات الثقة الأربعة
  const badges = useMemo<TrustBadgeConfig[]>(
    () => [
      {
        id: "verified",
        icon: <Shield className="h-5 w-5" />,
        label: "متجر موثّق",
        subtitle: `${yearsActive} ${yearsActive > 2 ? "سنوات" : yearsActive === 2 ? "سنتين" : "سنة"} من الخبرة`,
        color: "text-emerald-600 dark:text-emerald-400",
        bgColor: "bg-emerald-50 dark:bg-emerald-950/30",
        borderColor: "border-emerald-200 dark:border-emerald-800",
        iconColor: "text-emerald-500",
      },
      {
        id: "secure",
        icon: <Lock className="h-5 w-5" />,
        label: "دفع آمن",
        subtitle: "حماية كاملة لبياناتك",
        color: "text-sky-600 dark:text-sky-400",
        bgColor: "bg-sky-50 dark:bg-sky-950/30",
        borderColor: "border-sky-200 dark:border-sky-800",
        iconColor: "text-sky-500",
      },
      {
        id: "quality",
        icon: <Award className="h-5 w-5" />,
        label: "ضمان الجودة",
        subtitle: `${avgRating.toFixed(1)} من 5 تقييم`,
        color: "text-amber-600 dark:text-amber-400",
        bgColor: "bg-amber-50 dark:bg-amber-950/30",
        borderColor: "border-amber-200 dark:border-amber-800",
        iconColor: "text-amber-500",
      },
      {
        id: "fast",
        icon: <Zap className="h-5 w-5" />,
        label: "تنفيذ سريع",
        subtitle: `${totalOrders.toLocaleString("ar-SA-u-nu-latn")} طلب مُنجز`,
        color: "text-violet-600 dark:text-violet-400",
        bgColor: "bg-violet-50 dark:bg-violet-950/30",
        borderColor: "border-violet-200 dark:border-violet-800",
        iconColor: "text-violet-500",
      },
    ],
    [yearsActive, avgRating, totalOrders]
  );

  return (
    <div className={cn("space-y-4", className)} dir="rtl">
      {/* شبكة الشارات */}
      <div className="grid grid-cols-2 gap-3">
        {badges.map((badge, index) => (
          <motion.div
            key={badge.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              duration: 0.35,
              delay: index * 0.1,
              type: "spring",
              stiffness: 120,
            }}
            whileHover={{ scale: 1.03 }}
            className={cn(
              "trust-badge guarantee-badge flex flex-col items-center gap-2 p-4 rounded-xl border text-center",
              badge.bgColor,
              badge.borderColor
            )}
          >
            {/* أيقونة الشارة */}
            <div
              className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center",
                badge.bgColor,
                badge.iconColor
              )}
            >
              {badge.icon}
            </div>
            {/* النص */}
            <div>
              <p className={cn("text-xs font-bold", badge.color)}>
                {badge.label}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {badge.subtitle}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* شريط الإثبات الاجتماعي */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.5 }}
        className="flex items-center justify-center gap-4 p-3 rounded-xl bg-background border border-border/50"
      >
        <SocialProofBar value={totalOrders} label="طلب" suffix="أكثر من" />
        <div className="w-px h-4 bg-border/50" />
        <SocialProofBar value={yearsActive} label="سنوات" suffix="" />
        <div className="w-px h-4 bg-border/50" />
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
          <span className="font-medium text-foreground">
            <AnimatedCounter value={Math.round(avgRating * 10)} formatFn={(n) => (n / 10).toFixed(1)} />
          </span>
          <MiniStars rating={avgRating} />
        </div>
      </motion.div>
    </div>
  );
}
