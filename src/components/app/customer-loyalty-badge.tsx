"use client";

import { useMemo } from "react";
import {
  Star, Crown, Trophy, Medal, Award, Heart, Gift, Flame, Zap, Shield
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type LoyaltyTier = "bronze" | "silver" | "gold" | "platinum" | "diamond";

interface CustomerLoyaltyBadgeProps {
  orderCount: number;
  totalSpent?: number;
  sinceDate?: string;
  className?: string;
}

const TIER_CONFIG: Record<LoyaltyTier, {
  label: string;
  labelAr: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
  minOrders: number;
  description: string;
}> = {
  bronze: {
    label: "Bronze",
    labelAr: "برونزي",
    icon: <Medal className="h-4 w-4" />,
    color: "bg-amber-700",
    bgColor: "bg-amber-50 dark:bg-amber-950/50",
    borderColor: "border-amber-300 dark:border-amber-700",
    textColor: "text-amber-700 dark:text-amber-400",
    minOrders: 0,
    description: "زبون جديد",
  },
  silver: {
    label: "Silver",
    labelAr: "فضي",
    icon: <Shield className="h-4 w-4" />,
    color: "bg-gray-400",
    bgColor: "bg-gray-50 dark:bg-gray-900/50",
    borderColor: "border-gray-300 dark:border-gray-600",
    textColor: "text-gray-600 dark:text-gray-300",
    minOrders: 5,
    description: "زبون منتظم",
  },
  gold: {
    label: "Gold",
    labelAr: "ذهبي",
    icon: <Trophy className="h-4 w-4" />,
    color: "bg-yellow-500",
    bgColor: "bg-yellow-50 dark:bg-yellow-950/50",
    borderColor: "border-yellow-300 dark:border-yellow-700",
    textColor: "text-yellow-600 dark:text-yellow-400",
    minOrders: 15,
    description: "زبون مميز",
  },
  platinum: {
    label: "Platinum",
    labelAr: "بلاتيني",
    icon: <Award className="h-4 w-4" />,
    color: "bg-cyan-500",
    bgColor: "bg-cyan-50 dark:bg-cyan-950/50",
    borderColor: "border-cyan-300 dark:border-cyan-700",
    textColor: "text-cyan-600 dark:text-cyan-400",
    minOrders: 30,
    description: "زبون مميز",
  },
  diamond: {
    label: "Diamond",
    labelAr: "ألماسي",
    icon: <Crown className="h-4 w-4" />,
    color: "bg-violet-500",
    bgColor: "bg-violet-50 dark:bg-violet-950/50",
    borderColor: "border-violet-300 dark:border-violet-700",
    textColor: "text-violet-600 dark:text-violet-400",
    minOrders: 50,
    description: "زبون ملكي",
  },
};

const TIER_ORDER: LoyaltyTier[] = ["bronze", "silver", "gold", "platinum", "diamond"];

export function getLoyaltyTier(orderCount: number): LoyaltyTier {
  for (let i = TIER_ORDER.length - 1; i >= 0; i--) {
    if (orderCount >= TIER_CONFIG[TIER_ORDER[i]].minOrders) {
      return TIER_ORDER[i];
    }
  }
  return "bronze";
}

export function CustomerLoyaltyBadge({
  orderCount, totalSpent, sinceDate, className,
}: CustomerLoyaltyBadgeProps) {
  const tier = useMemo(() => getLoyaltyTier(orderCount), [orderCount]);
  const config = TIER_CONFIG[tier];
  const nextTierIndex = TIER_ORDER.indexOf(tier) + 1;
  const nextTier = nextTierIndex < TIER_ORDER.length ? TIER_ORDER[nextTierIndex] : null;
  const nextConfig = nextTier ? TIER_CONFIG[nextTier] : null;

  const progressToNext = useMemo(() => {
    if (!nextConfig) return 100;
    const currentMin = config.minOrders;
    const nextMin = nextConfig.minOrders;
    const range = nextMin - currentMin;
    const progress = ((orderCount - currentMin) / range) * 100;
    return Math.min(Math.max(progress, 0), 100);
  }, [orderCount, config.minOrders, nextConfig]);

  return (
    <div className={cn("space-y-2", className)} dir="rtl">
      {/* الشارة الرئيسية */}
      <div className={cn(
        "flex items-center gap-2.5 px-3 py-2.5 rounded-xl border",
        config.bgColor, config.borderColor,
        "animate-fade-up"
      )}>
        <div className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center",
          config.bgColor, config.textColor
        )}>
          {config.icon}
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-sm font-bold text-foreground">{config.labelAr}</span>
          <p className="text-[11px] text-muted-foreground">{config.description}</p>
        </div>
        <div className="text-left">
          <div className="text-lg font-bold tabular-nums text-foreground">{orderCount}</div>
          <div className="text-[10px] text-muted-foreground">طلب</div>
        </div>
      </div>

      {/* شريط التقدم للمستوى التالي */}
      {nextConfig && (
        <div className="px-1 space-y-1.5">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-muted-foreground">
              الترقية إلى <span className={cn("font-medium", nextConfig.textColor)}>{nextConfig.labelAr}</span>
            </span>
            <span className="text-muted-foreground tabular-nums">
              {orderCount}/{nextConfig.minOrders}
            </span>
          </div>
          <div className="progress-bar-animated h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-700",
                progressToNext >= 80
                  ? "bg-gradient-to-r from-primary to-violet-500"
                  : progressToNext >= 50
                    ? "bg-gradient-to-r from-amber-400 to-amber-500"
                    : "bg-muted-foreground/30"
              )}
              style={{ width: `${progressToNext}%` }}
            />
          </div>
        </div>
      )}

      {/* إحصائيات إضافية */}
      <div className="grid grid-cols-2 gap-2">
        {totalSpent !== undefined && totalSpent > 0 && (
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Gift className="h-3 w-3" />
            <span>إجمالي: <span className="font-medium text-foreground tabular-nums">{totalSpent.toLocaleString('ar-DZ')} د.ج</span></span>
          </div>
        )}
        {sinceDate && (
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Flame className="h-3 w-3" />
            <span>منذ: <span className="font-medium text-foreground">{sinceDate}</span></span>
          </div>
        )}
      </div>
    </div>
  );
}
