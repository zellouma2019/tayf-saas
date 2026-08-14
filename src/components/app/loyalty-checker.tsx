"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, Search, Shield, Award, Crown, Star, TrendingUp, Gift, Sparkles, ChevronLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
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

const ALL_TIERS = [
  { tier: "bronze", tierName: "برونزي", minAmount: 0, discountPercent: 0, icon: "🥉", color: "oklch(0.7 0.1 55)", iconComp: Shield },
  { tier: "silver", tierName: "فضي", minAmount: 5000, discountPercent: 5, icon: "🥈", color: "oklch(0.8 0.01 260)", iconComp: Award },
  { tier: "gold", tierName: "ذهبي", minAmount: 15000, discountPercent: 10, icon: "🥇", color: "oklch(0.78 0.13 85)", iconComp: Crown },
  { tier: "platinum", tierName: "بلاتيني", minAmount: 30000, discountPercent: 15, icon: "💎", color: "oklch(0.75 0.08 220)", iconComp: Star },
];

const TIER_STYLES: Record<string, { gradient: string; border: string; bg: string; text: string; darkBg: string; darkBorder: string }> = {
  bronze: {
    gradient: "from-oklch-[0.7_0.1_55] to-oklch-[0.6_0.08_50]",
    border: "border-oklch-[0.7_0.1_55]/30",
    bg: "bg-oklch-[0.7_0.1_55]/8",
    text: "text-oklch-[0.5_0.1_50]",
    darkBg: "dark:bg-oklch-[0.5_0.08_50]/15",
    darkBorder: "dark:border-oklch-[0.6_0.08_50]/30",
  },
  silver: {
    gradient: "from-oklch-[0.85_0.005_260] to-oklch-[0.75_0.01_260]",
    border: "border-oklch-[0.85_0.005_260]/30",
    bg: "bg-oklch-[0.85_0.005_260]/8",
    text: "text-oklch-[0.55_0.01_260]",
    darkBg: "dark:bg-oklch-[0.55_0.01_260]/15",
    darkBorder: "dark:border-oklch-[0.65_0.01_260]/30",
  },
  gold: {
    gradient: "from-oklch-[0.82_0.13_85] to-oklch-[0.7_0.12_80]",
    border: "border-oklch-[0.82_0.13_85]/30",
    bg: "bg-oklch-[0.82_0.13_85]/8",
    text: "text-oklch-[0.65_0.13_80]",
    darkBg: "dark:bg-oklch-[0.65_0.12_80]/15",
    darkBorder: "dark:border-oklch-[0.7_0.12_80]/30",
  },
  platinum: {
    gradient: "from-oklch-[0.78_0.08_220] to-oklch-[0.68_0.1_230]",
    border: "border-oklch-[0.78_0.08_220]/30",
    bg: "bg-oklch-[0.78_0.08_220]/8",
    text: "text-oklch-[0.6_0.08_230]",
    darkBg: "dark:bg-oklch-[0.5_0.08_220]/15",
    darkBorder: "dark:border-oklch-[0.6_0.08_230]/30",
  },
};

function formatDA(amount: number): string {
  return new Intl.NumberFormat("ar-DZ").format(amount) + " دج";
}

export function LoyaltyChecker() {
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<LoyaltyData | null>(null);

  async function handleCheck(e?: React.FormEvent) {
    e?.preventDefault();
    const clean = phone.replace(/[\s\-+]/g, "");
    if (clean.length < 8) {
      toast.error("رقم الهاتف غير صحيح");
      return;
    }
    setLoading(true);
    setData(null);
    try {
      const res = await shopApi("/api/loyalty/check?phone=" + encodeURIComponent(clean));
      if (!res.ok) throw new Error();
      const d = await res.json();
      setData(d);
    } catch {
      toast.error("خطأ في البحث عن مستوى الولاء");
    } finally {
      setLoading(false);
    }
  }

  const style = data ? (TIER_STYLES[data.tier] || TIER_STYLES.bronze) : null;

  // حساب نسبة التقدم
  function getProgressPercent(): number {
    if (!data || !data.nextTierAmount) return 100;
    const currentMin = ALL_TIERS.find(function(t) { return t.tier === data.tier; })?.minAmount || 0;
    const range = data.nextTierAmount - currentMin;
    const progress = data.totalSpent - currentMin;
    return Math.min(100, Math.max(0, Math.round((progress / range) * 100)));
  }

  function getNextTierDiscount(): number {
    if (!data || !data.nextTier) return 0;
    return ALL_TIERS.find(function(t) { return t.tier === data.nextTier; })?.discountPercent || 0;
  }

  return (
    <div className="space-y-4">
      {/* بطاقة البحث */}
      <Card className="overflow-hidden">
        <div className="h-1 bg-gradient-to-l from-oklch-[0.78_0.13_85] via-oklch-[0.75_0.08_220] to-oklch-[0.85_0.005_260]" />
        <CardContent className="p-4">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-oklch-[0.78_0.13_85] to-oklch-[0.65_0.12_80] flex items-center justify-center shadow-md">
              <Gift className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-sm">برنامج الولاء</h3>
              <p className="text-[11px] text-muted-foreground">تحقّق من مستواك واستفد من الخصومات</p>
            </div>
          </div>

          <form onSubmit={handleCheck} className="flex gap-2">
            <div className="relative flex-1">
              <Phone className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="05XX XX XX XX"
                className="pr-9 h-11 text-sm"
                dir="ltr"
                type="tel"
              />
            </div>
            <Button
              type="submit"
              size="lg"
              className="h-11 px-5 bg-neutral-900 hover:bg-neutral-800 text-white"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              <span className="mr-1.5">تحقّق</span>
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* النتيجة */}
      <AnimatePresence mode="wait">
        {loading && (
          <motion.div
            key="loading"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <Card>
              <CardContent className="p-6 flex flex-col items-center justify-center gap-3 text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="text-sm">جارٍ التحقق من مستوى الولاء...</span>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {data && style && !loading && (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, type: "spring", bounce: 0.2 }}
            className="space-y-4"
          >
            {/* بطاقة المستوى الحالي */}
            <Card className={"overflow-hidden border-2 " + style.border + " " + style.darkBorder}>
              <div className={"h-2 bg-gradient-to-l " + style.gradient} />
              <CardContent className="p-5 space-y-4">
                {/* الرأس */}
                <div className="flex items-center gap-3">
                  <motion.div
                    initial={{ rotate: -20, scale: 0.5 }}
                    animate={{ rotate: 0, scale: 1 }}
                    transition={{ duration: 0.6, delay: 0.1, type: "spring", bounce: 0.5 }}
                    className={"w-14 h-14 rounded-2xl bg-gradient-to-br " + style.gradient + " flex items-center justify-center shadow-lg"}
                  >
                    <span className="text-2xl">{data.tierIcon}</span>
                  </motion.div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold">{data.tierName}</h3>
                      {data.discountPercent > 0 && (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.3, type: "spring" }}
                          className={"inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-gradient-to-l " + style.gradient + " text-white shadow-sm"}
                        >
                          <Sparkles className="h-3 w-3" />
                          <span>{"خصم " + data.discountPercent + "%"}</span>
                        </motion.span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      <span>{data.name}</span>
                      <span>{" \u00B7 " + data.totalOrders + " طلب"}</span>
                    </p>
                  </div>
                </div>

                {/* إحصائيات */}
                <div className="grid grid-cols-3 gap-2">
                  <StatCell label="الإنفاق الكلي" value={formatDA(data.totalSpent)} style={style} />
                  <StatCell label="الطلبات" value={String(data.totalOrders)} style={style} />
                  <StatCell
                    label="خصمك الحالي"
                    value={data.discountPercent > 0 ? data.discountPercent + "%" : "\u2014"}
                    style={style}
                  />
                </div>

                {/* التقدم للمستوى التالي */}
                {data.nextTier && data.nextTierAmount ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <TrendingUp className="h-3.5 w-3.5" />
                        التقدم للمستوى التالي
                      </span>
                      <span className="font-medium">
                        {data.tierIcon} {data.tierName}
                        <ChevronLeft className="inline h-3 w-3 mx-0.5" />
                        {data.nextTierIcon} {data.nextTier}
                      </span>
                    </div>

                    <Progress value={getProgressPercent()} className="h-3" />

                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.4 }}
                      className={"text-center text-xs p-2.5 rounded-xl border " + style.border + " " + style.darkBorder + " " + style.bg + " " + style.darkBg}
                    >
                      <Gift className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        {"أتمّ طلبات بقيمة "}
                        <span className={"font-bold " + style.text}>{formatDA(data.pointsToNext)}</span>
                        {" للحصول على خصم "}
                        <span className={"font-bold " + style.text}>{getNextTierDiscount()}%</span>
                        {" في مستوى "}
                        <span className="font-bold">{data.nextTier}</span>
                      </span>
                    </motion.div>
                  </div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                    className="text-center py-2"
                  >
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-l from-oklch-[0.78_0.08_220]/10 to-oklch-[0.78_0.08_220]/5 dark:from-oklch-[0.5_0.08_220]/15 dark:to-oklch-[0.5_0.08_220]/5 border border-oklch-[0.78_0.08_220]/20 dark:border-oklch-[0.5_0.08_220]/20">
                      <Crown className="h-4 w-4 text-oklch-[0.7_0.1_220] dark:text-oklch-[0.75_0.08_220]" />
                      <span className="text-sm font-bold">وصلت أعلى مستوى — شكراً لولائك! 🎉</span>
                    </div>
                  </motion.div>
                )}
              </CardContent>
            </Card>

            {/* جدول المستويات */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Card>
                <CardHeader className="pb-2 px-4 pt-4">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-amber-500" />
                    مستويات الولاء
                  </CardTitle>
                  <CardDescription className="text-[11px]">كلما أنفقت أكثر، حصلت على خصم أكبر</CardDescription>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {ALL_TIERS.map(function(t, i) {
                      const tStyle = TIER_STYLES[t.tier];
                      const isCurrent = t.tier === data.tier;
                      const isLocked = data.totalSpent < t.minAmount;
                      const cellClass = isCurrent
                        ? tStyle.bg + " " + tStyle.darkBg + " " + tStyle.border + " " + tStyle.darkBorder + " border-2 shadow-sm"
                        : isLocked
                          ? "opacity-50 bg-muted/30 border-border/50"
                          : "bg-muted/40 border-border/50";
                      return (
                        <motion.div
                          key={t.tier}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.6 + i * 0.1 }}
                          className={"relative rounded-xl p-3 text-center border transition-all " + cellClass}
                        >
                          {isCurrent && (
                            <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-foreground text-background text-[9px] font-bold">
                              مستواك
                            </div>
                          )}
                          <div className="text-xl mb-1">{t.icon}</div>
                          <div className={"text-xs font-bold " + (isCurrent ? tStyle.text : "")}>{t.tierName}</div>
                          <div className="text-[10px] text-muted-foreground mt-0.5">
                            {t.discountPercent > 0 ? t.discountPercent + "% خصم" : "البدء"}
                          </div>
                          <div className="text-[10px] text-muted-foreground">
                            {"من " + formatDA(t.minAmount)}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatCell({ label, value, style }: { label: string; value: string; style: { bg: string; darkBg: string; text: string } }) {
  return (
    <div className={"rounded-xl " + style.bg + " " + style.darkBg + " p-3 text-center"}>
      <div className="text-[11px] text-muted-foreground mb-1">{label}</div>
      <div className={"text-sm font-bold " + style.text}>{value}</div>
    </div>
  );
}