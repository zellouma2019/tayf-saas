"use client";

import { useState } from "react";
import {
  Medal, Shield, Trophy, Award, Crown, Search, Loader2, Percent, ShoppingBag,
} from "lucide-react";
import { useShop } from "@/lib/shop-context";
import { getLoyaltyTier } from "@/components/app/customer-loyalty-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

type LoyaltyTier = "bronze" | "silver" | "gold" | "platinum" | "diamond";

interface TierInfo {
  key: LoyaltyTier;
  labelAr: string;
  labelEn: string;
  icon: React.ReactNode;
  discount: number;
  minOrders: number;
  gradient: string;
  border: string;
  badgeBg: string;
  badgeText: string;
  description: string;
}

const TIERS: TierInfo[] = [
  {
    key: "bronze",
    labelAr: "برونزي",
    labelEn: "Bronze",
    icon: <Medal className="h-5 w-5" />,
    discount: 0,
    minOrders: 0,
    gradient: "from-amber-100 to-amber-50 dark:from-amber-950/40 dark:to-amber-900/20",
    border: "border-amber-200 dark:border-amber-800/50",
    badgeBg: "bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300",
    badgeText: "text-amber-700 dark:text-amber-300",
    description: "زبون جديد",
  },
  {
    key: "silver",
    labelAr: "فضي",
    labelEn: "Silver",
    icon: <Shield className="h-5 w-5" />,
    discount: 5,
    minOrders: 5,
    gradient: "from-gray-100 to-slate-50 dark:from-gray-900/40 dark:to-slate-900/20",
    border: "border-gray-300 dark:border-gray-700/50",
    badgeBg: "bg-gray-100 dark:bg-gray-800/50 text-gray-600 dark:text-gray-300",
    badgeText: "text-gray-600 dark:text-gray-300",
    description: "زبون منتظم",
  },
  {
    key: "gold",
    labelAr: "ذهبي",
    labelEn: "Gold",
    icon: <Trophy className="h-5 w-5" />,
    discount: 10,
    minOrders: 15,
    gradient: "from-yellow-100 to-amber-50 dark:from-yellow-950/40 dark:to-amber-900/20",
    border: "border-yellow-300 dark:border-yellow-700/50",
    badgeBg: "bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300",
    badgeText: "text-yellow-700 dark:text-yellow-300",
    description: "زبون مميز",
  },
  {
    key: "platinum",
    labelAr: "بلاتيني",
    labelEn: "Platinum",
    icon: <Award className="h-5 w-5" />,
    discount: 15,
    minOrders: 30,
    gradient: "from-cyan-100 to-sky-50 dark:from-cyan-950/40 dark:to-sky-900/20",
    border: "border-cyan-300 dark:border-cyan-700/50",
    badgeBg: "bg-cyan-100 dark:bg-cyan-900/50 text-cyan-700 dark:text-cyan-300",
    badgeText: "text-cyan-700 dark:text-cyan-300",
    description: "زبون مميز",
  },
  {
    key: "diamond",
    labelAr: "ألماسي",
    labelEn: "Diamond",
    icon: <Crown className="h-5 w-5" />,
    discount: 20,
    minOrders: 50,
    gradient: "from-violet-100 to-fuchsia-50 dark:from-violet-950/40 dark:to-fuchsia-900/20",
    border: "border-violet-300 dark:border-violet-700/50",
    badgeBg: "bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-300",
    badgeText: "text-violet-700 dark:text-violet-300",
    description: "زبون ملكي",
  },
];

const ALGERIAN_PHONE_REGEX = /^0[5-7]\d{8}$/;

interface CheckResult {
  orderCount: number;
  totalSpent: number;
}

export function LoyaltyChecker() {
  const { shop } = useShop();
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CheckResult | null>(null);

  const phoneValid = ALGERIAN_PHONE_REGEX.test(phone);

  const handleCheck = async () => {
    if (!phoneValid || !shop?.id) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch(
        `/api/loyalty/check?phone=${encodeURIComponent(phone)}&shopId=${shop.id}`
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "فشل التحقق");
      }
      const data = await res.json();
      setResult({
        orderCount: data.totalOrders ?? 0,
        totalSpent: data.totalSpent ?? 0,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ");
    } finally {
      setLoading(false);
    }
  };

  const currentTier = result ? getLoyaltyTier(result.orderCount) : null;
  const currentTierInfo = currentTier
    ? TIERS.find((t) => t.key === currentTier)
    : null;
  const nextTierIdx = currentTier ? TIERS.findIndex((t) => t.key === currentTier) + 1 : -1;
  const nextTier = nextTierIdx < TIERS.length ? TIERS[nextTierIdx] : null;

  const progressValue =
    result && currentTierInfo && nextTier
      ? ((result.orderCount - currentTierInfo.minOrders) /
          (nextTier.minOrders - currentTierInfo.minOrders)) *
        100
      : 0;

  return (
    <div className="space-y-6" dir="rtl">
      {/* Input card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <ShoppingBag className="h-5 w-5 text-primary" />
            تحقق من مستوى ولائك
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              type="tel"
              placeholder="0XXXXXXXXX"
              value={phone}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9]/g, "").slice(0, 10);
                setPhone(val);
                setError(null);
              }}
              dir="ltr"
              className={cn(
                "flex-1 text-center text-lg tracking-widest font-mono",
                phone && !phoneValid && "border-destructive focus-visible:border-destructive"
              )}
              maxLength={10}
            />
            <Button
              onClick={handleCheck}
              disabled={!phoneValid || loading}
              className="gap-2 min-w-[120px]"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              تحقق
            </Button>
          </div>
          {phone && !phoneValid && (
            <p className="text-destructive text-xs mt-2">
              أدخل رقم هاتف جزائري صحيح (يبدأ بـ 05 أو 06 أو 07)
            </p>
          )}
          {error && (
            <p className="text-destructive text-xs mt-2">{error}</p>
          )}
        </CardContent>
      </Card>

      {/* Current tier result */}
      {result && currentTierInfo && (
        <Card className={cn("bg-gradient-to-br", currentTierInfo.gradient, currentTierInfo.border)}>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", currentTierInfo.badgeBg)}>
                  {currentTierInfo.icon}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-lg text-foreground">
                      مستواك: {currentTierInfo.labelAr}
                    </h3>
                    <Badge className={cn("text-xs", currentTierInfo.badgeBg)} variant="secondary">
                      {currentTierInfo.discount}% خصم
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{currentTierInfo.description}</p>
                </div>
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2 text-sm">
                <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">الطلبات:</span>
                <span className="font-bold tabular-nums">{result.orderCount}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">الإنفاق:</span>
                <span className="font-bold tabular-nums">
                  {result.totalSpent.toLocaleString("ar-DZ")} د.ج
                </span>
              </div>
            </div>

            {/* Progress to next tier */}
            {nextTier && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    الترقية إلى{" "}
                    <span className={cn("font-semibold", nextTier.badgeText)}>
                      {nextTier.labelAr}
                    </span>
                  </span>
                  <span className="text-muted-foreground tabular-nums">
                    {result.orderCount} / {nextTier.minOrders}
                  </span>
                </div>
                <Progress value={Math.min(progressValue, 100)} className="h-2.5" />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tier comparison grid */}
      <div>
        <h3 className="text-base font-bold text-foreground mb-3 px-1">
          مستويات الولاء
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {TIERS.map((tier) => {
            const isActive = tier.key === currentTier;
            return (
              <Card
                key={tier.key}
                className={cn(
                  "bg-gradient-to-br transition-all duration-300 relative overflow-hidden",
                  tier.gradient,
                  tier.border,
                  isActive && "ring-2 ring-primary shadow-md scale-[1.02]"
                )}
              >
                {isActive && (
                  <div className="absolute top-2 left-2">
                    <Badge variant="default" className="text-[10px] px-1.5 py-0">
                      مستواك الحالي
                    </Badge>
                  </div>
                )}
                <CardContent className="p-4 flex flex-col items-center gap-2 text-center">
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", tier.badgeBg)}>
                    {tier.icon}
                  </div>
                  <span className={cn("font-bold text-sm", tier.badgeText)}>
                    {tier.labelAr}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {tier.description}
                  </span>
                  <div className="flex flex-col gap-1 w-full mt-1 pt-2 border-t border-border/50">
                    <div className="flex items-center justify-center gap-1 text-xs">
                      <ShoppingBag className="h-3 w-3 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        {tier.minOrders === 0 ? "من أول طلب" : `${tier.minOrders}+ طلب`}
                      </span>
                    </div>
                    <div className="flex items-center justify-center gap-1 text-xs">
                      <Percent className="h-3 w-3 text-muted-foreground" />
                      <span className={cn("font-semibold", tier.badgeText)}>
                        {tier.discount > 0 ? `${tier.discount}% خصم` : "بدون خصم"}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
