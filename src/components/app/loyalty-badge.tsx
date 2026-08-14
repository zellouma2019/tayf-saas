"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, TrendingUp, Crown, Star, Award, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { shopApi } from "@/lib/shop-api";

interface LoyaltyData {
  phone: string;
  name: string;
  totalOrders: number;
  totalSpent: number;
  tier: string;
  tierName: string;
  tierIcon: string;
  tierColor: string;
  discountPercent: number;
  nextTier: string | null;
  nextTierIcon: string | null;
  nextTierAmount: number | null;
  pointsToNext: number;
  lastOrderAt: string | null;
}

const TIER_STYLES: Record<string, {
  gradient: string;
  border: string;
  bg: string;
  text: string;
  darkBg: string;
  darkBorder: string;
  progressColor: string;
}> = {
  bronze: {
    gradient: "from-oklch-[0.7_0.1_55] to-oklch-[0.6_0.08_50]",
    border: "border-oklch-[0.7_0.1_55]/30",
    bg: "bg-oklch-[0.7_0.1_55]/8",
    text: "text-oklch-[0.5_0.1_50]",
    darkBg: "dark:bg-oklch-[0.5_0.08_50]/15",
    darkBorder: "dark:border-oklch-[0.6_0.08_50]/30",
    progressColor: "bg-oklch-[0.7_0.1_55]",
  },
  silver: {
    gradient: "from-oklch-[0.85_0.005_260] to-oklch-[0.75_0.01_260]",
    border: "border-oklch-[0.85_0.005_260]/30",
    bg: "bg-oklch-[0.85_0.005_260]/8",
    text: "text-oklch-[0.55_0.01_260]",
    darkBg: "dark:bg-oklch-[0.55_0.01_260]/15",
    darkBorder: "dark:border-oklch-[0.65_0.01_260]/30",
    progressColor: "bg-oklch-[0.75_0.01_260]",
  },
  gold: {
    gradient: "from-oklch-[0.82_0.13_85] to-oklch-[0.7_0.12_80]",
    border: "border-oklch-[0.82_0.13_85]/30",
    bg: "bg-oklch-[0.82_0.13_85]/8",
    text: "text-oklch-[0.65_0.13_80]",
    darkBg: "dark:bg-oklch-[0.65_0.12_80]/15",
    darkBorder: "dark:border-oklch-[0.7_0.12_80]/30",
    progressColor: "bg-oklch-[0.78_0.13_85]",
  },
  platinum: {
    gradient: "from-oklch-[0.78_0.08_220] to-oklch-[0.68_0.1_230]",
    border: "border-oklch-[0.78_0.08_220]/30",
    bg: "bg-oklch-[0.78_0.08_220]/8",
    text: "text-oklch-[0.6_0.08_230]",
    darkBg: "dark:bg-oklch-[0.5_0.08_220]/15",
    darkBorder: "dark:border-oklch-[0.6_0.08_230]/30",
    progressColor: "bg-oklch-[0.75_0.08_220]",
  },
};

const TIER_THRESHOLDS = [
  { tier: "bronze", min: 0 },
  { tier: "silver", min: 5000 },
  { tier: "gold", min: 15000 },
  { tier: "platinum", min: 30000 },
];

const TIER_ICONS: Record<string, typeof Shield> = {
  bronze: Shield,
  silver: Award,
  gold: Crown,
  platinum: Star,
};

function formatDA(amount: number): string {
  return new Intl.NumberFormat("ar-DZ").format(amount) + " دج";
}

interface LoyaltyBadgeProps {
  phone: string;
  compact?: boolean;
}

export function LoyaltyBadge({ phone, compact = false }: LoyaltyBadgeProps) {
  const [data, setData] = useState<LoyaltyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!phone) return;
    const clean = phone.replace(/[\s\-+]/g, "");
    if (clean.length < 8) return;

    let cancelled = false;
    const controller = new AbortController();

    // Reset state via microtask to avoid synchronous setState in effect
    const resetPromise = Promise.resolve().then(() => {
      if (!cancelled) {
        setLoading(true);
        setError(null);
        setData(null);
      }
    });

    const fetchPromise = resetPromise.then(async () => {
      try {
        const r = await shopApi(`/api/loyalty/check?phone=${encodeURIComponent(clean)}`, { signal: controller.signal });
        if (!r.ok) throw new Error("خطأ في البحث");
        const d = await r.json();
        if (!cancelled) setData(d);
      } catch (e) {
        if (!cancelled && !(e instanceof DOMException && e.name === "AbortError")) {
          setError((e as Error).message);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [phone]);

  if (loading) {
    if (compact) {
      return (
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin" />
          جارٍ التحميل...
        </span>
      );
    }
    return (
      <Card className="overflow-hidden">
        <CardContent className="p-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          جارٍ التحقق من مستوى الولاء...
        </CardContent>
      </Card>
    );
  }

  if (error || !data) return null;

  const style = TIER_STYLES[data.tier] || TIER_STYLES.bronze;
  const IconComp = TIER_ICONS[data.tier] || Shield;

  // === الوضع المضغوط (للوحة الإدارة) ===
  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="inline-flex items-center gap-1.5"
      >
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold border ${style.bg} ${style.border} ${style.darkBg} ${style.darkBorder} ${style.text}`}
        >
          <span className="text-xs">{data.tierIcon}</span>
          {data.tierName}
          {data.discountPercent > 0 && (
            <span className="opacity-80">({data.discountPercent}%)</span>
          )}
        </span>
      </motion.div>
    );
  }

  // === الوضع الكامل ===
  // حساب نسبة التقدم للمستوى التالي
  let progressPercent = 100;
  let currentTierMin = 0;
  let nextTierMin = 0;

  if (data.nextTier && data.nextTierAmount) {
    const currentIdx = TIER_THRESHOLDS.findIndex((t) => t.tier === data.tier);
    currentTierMin = TIER_THRESHOLDS[currentIdx]?.min || 0;
    nextTierMin = data.nextTierAmount;
    const range = nextTierMin - currentTierMin;
    const progress = data.totalSpent - currentTierMin;
    progressPercent = Math.min(100, Math.max(0, Math.round((progress / range) * 100)));
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <Card className={`overflow-hidden border ${style.border} ${style.darkBorder}`}>
        {/* الشريط العلوي المتدرج */}
        <div className={`h-1.5 bg-gradient-to-l ${style.gradient}`} />

        <CardContent className="p-4 space-y-3">
          {/* رأس الشارة */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <motion.div
                initial={{ rotate: -15, scale: 0.8 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ duration: 0.5, type: "spring", bounce: 0.4 }}
                className={`w-10 h-10 rounded-xl bg-gradient-to-br ${style.gradient} flex items-center justify-center shadow-md`}
              >
                <IconComp className="h-5 w-5 text-white" />
              </motion.div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-lg">{data.tierIcon}</span>
                  <h3 className="font-bold text-sm">{data.tierName}</h3>
                </div>
                <p className="text-[11px] text-muted-foreground">{data.name}</p>
              </div>
            </div>

            {data.discountPercent > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.4, delay: 0.2, type: "spring" }}
                className={`px-3 py-1.5 rounded-xl bg-gradient-to-br ${style.gradient} text-white text-sm font-bold shadow-sm`}
              >
                خصم {data.discountPercent}%
              </motion.div>
            )}
          </div>

          {/* الإحصائيات */}
          <div className="grid grid-cols-2 gap-2">
            <div className={`rounded-lg ${style.bg} ${style.darkBg} p-2.5 text-center`}>
              <div className="text-xs text-muted-foreground mb-0.5">إجمالي الإنفاق</div>
              <div className={`text-sm font-bold ${style.text}`}>{formatDA(data.totalSpent)}</div>
            </div>
            <div className={`rounded-lg ${style.bg} ${style.darkBg} p-2.5 text-center`}>
              <div className="text-xs text-muted-foreground mb-0.5">عدد الطلبات</div>
              <div className={`text-sm font-bold ${style.text}`}>{data.totalOrders}</div>
            </div>
          </div>

          {/* شريط التقدم للمستوى التالي */}
          <AnimatePresence mode="wait">
            {data.nextTier && data.nextTierAmount ? (
              <motion.div
                key="progress"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-2"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    التقدم للمستوى التالي
                  </span>
                  <span className="font-medium">
                    {data.tierIcon} {data.tierName}
                    <span className="text-muted-foreground mx-1">→</span>
                    {data.nextTierIcon} {data.nextTier}
                  </span>
                </div>

                <div className="relative">
                  <Progress
                    value={progressPercent}
                    className="h-2.5 [&>div]:rounded-full"
                  />
                  <style>{`
                    [data-slot="progress-indicator"] {
                      background: linear-gradient(to left, ${style.progressColor.replace('bg-', '')}, var(--primary)) !important;
                    }
                  `}</style>
                </div>

                <div className="text-center text-[11px] text-muted-foreground">
                  متبقّي <span className="font-bold text-foreground">{formatDA(data.pointsToNext)}</span> للوصول إلى مستوى{" "}
                  <span className="font-bold">{data.nextTier}</span>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="max"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-1"
              >
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-l from-oklch-[0.78_0.08_220]/10 to-oklch-[0.78_0.08_220]/5 dark:from-oklch-[0.5_0.08_220]/15 dark:to-oklch-[0.5_0.08_220]/5 border border-oklch-[0.78_0.08_220]/20 dark:border-oklch-[0.5_0.08_220]/20">
                  <Crown className="h-3.5 w-3.5 text-oklch-[0.7_0.1_220] dark:text-oklch-[0.75_0.08_220]" />
                  <span className="text-xs font-bold">وصلت أعلى مستوى — شكراً لولائك!</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
}