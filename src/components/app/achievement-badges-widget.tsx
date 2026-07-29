"use client";

import { motion } from "framer-motion";
import { Trophy, Target, Flame, Award, Gift, Package, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  progress: number;
  target: number;
  unlocked: boolean;
  category: "orders" | "revenue" | "streak" | "special";
}

const ACHIEVEMENTS: Achievement[] = [
  { id: "1", title: "أول طلب", description: "أكمل أول طلب", icon: <Package className="h-5 w-5" />, progress: 1, target: 1, unlocked: true, category: "orders" },
  { id: "2", title: "مئة طلب", description: "أكمل 100 طلب", icon: <Target className="h-5 w-5" />, progress: 38, target: 100, unlocked: false, category: "orders" },
  { id: "3", title: "ألف طلب", description: "أكمل 1,000 طلب", icon: <Trophy className="h-5 w-5" />, progress: 38, target: 1000, unlocked: false, category: "orders" },
  { id: "4", title: "مليون د.ج", description: "اجمع إيرادات 1,000,000 د.ج", icon: <Award className="h-5 w-5" />, progress: 1700000, target: 1000000, unlocked: true, category: "revenue" },
  { id: "5", title: "7 أيام متتالية", description: "طلبات يومية لمدة أسبوع", icon: <Flame className="h-5 w-5" />, progress: 5, target: 7, unlocked: false, category: "streak" },
  { id: "6", title: "30 يوم متتالية", description: "طلبات يومية لمدة شهر", icon: <Flame className="h-5 w-5" />, progress: 5, target: 30, unlocked: false, category: "streak" },
  { id: "7", title: "عميل VIP", description: "خدم 10 عملاء VIP", icon: <Gift className="h-5 w-5" />, progress: 3, target: 10, unlocked: false, category: "special" },
  { id: "8", title: "خمس نجوم", description: "احصل على 5 تقييمات 5 نجوم", icon: <Trophy className="h-5 w-5" />, progress: 3, target: 5, unlocked: false, category: "special" },
];

const CATEGORY_COLORS = {
  orders: { bg: "bg-indigo-100 dark:bg-indigo-900/30", text: "text-indigo-600 dark:text-indigo-400", icon: "bg-indigo-500" },
  revenue: { bg: "bg-emerald-100 dark:bg-emerald-900/30", text: "text-emerald-600 dark:text-emerald-400", icon: "bg-emerald-500" },
  streak: { bg: "bg-amber-100 dark:bg-amber-900/30", text: "text-amber-600 dark:text-amber-400", icon: "bg-amber-500" },
  special: { bg: "bg-rose-100 dark:bg-rose-900/30", text: "text-rose-600 dark:text-rose-400", icon: "bg-rose-500" },
};

function formatNum(n: number) {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(0)}K`;
  return String(n);
}

export function AchievementBadgesWidget() {
  const unlocked = ACHIEVEMENTS.filter((a) => a.unlocked).length;
  return (
    <Card className="bg-card rounded-xl border border-border shadow-sm fade-in-up">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2 text-foreground/80">
            <Trophy className="h-4 w-4 text-amber-500" />
            الإنجازات والأوسمة
          </CardTitle>
          <Badge className="text-[10px] bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
            {unlocked}/{ACHIEVEMENTS.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3" dir="rtl">
          {ACHIEVEMENTS.map((ach, i) => {
            const colors = CATEGORY_COLORS[ach.category];
            const pct = Math.min(100, Math.round((ach.progress / ach.target) * 100));
            return (
              <motion.div
                key={ach.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.06 }}
                className={cn(
                  "relative rounded-xl border p-3 text-center transition-all",
                  ach.unlocked
                    ? "border-amber-300 dark:border-amber-600/40 bg-amber-50/50 dark:bg-amber-950/10"
                    : "border-border bg-muted/20"
                )}
              >
                {ach.unlocked && (
                  <div className="absolute -top-1 -left-1 w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center">
                    <CheckCircle2 className="h-3 w-3 text-white" />
                  </div>
                )}
                <div className={cn(
                  "w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center",
                  ach.unlocked ? colors.icon + " text-white" : "bg-muted text-muted-foreground"
                )}>
                  {ach.icon}
                </div>
                <p className="text-xs font-bold text-foreground mb-0.5 truncate">{ach.title}</p>
                <p className="text-[10px] text-muted-foreground leading-tight mb-2 truncate">{ach.description}</p>
                <div className="relative h-1.5 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    className={cn("h-full rounded-full", ach.unlocked ? "bg-amber-500" : colors.icon.replace("bg-", "bg-"))}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ delay: i * 0.06 + 0.3, duration: 0.6, ease: "easeOut" }}
                  />
                </div>
                <p className="text-[9px] text-muted-foreground mt-1 tabular-nums">
                  {formatNum(ach.progress)}/{formatNum(ach.target)}
                </p>
              </motion.div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
