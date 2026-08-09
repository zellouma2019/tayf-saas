"use client";

import { useMemo } from "react";
import { Zap, TrendingUp, Clock, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import type { GlobalStats } from "@/lib/admin-types";

// ===== Shop Performance Score =====
// حساب درجة أداء المتجر بناءً على عدة عوامل

interface PerformanceScoreProps {
  stats: GlobalStats;
  className?: string;
}

interface ShopScore {
  id: string;
  name: string;
  score: number; // 0-100
  grade: "A+" | "A" | "B" | "C" | "D";
  factors: {
    fulfillment: number;  // سرعة الإنجاز
    revenue: number;      // مستوى الإيرادات
    volume: number;       // حجم الطلبات
    recency: number;      // حداثة النشاط
  };
}

function calculateShopScore(shop: GlobalStats["shopStats"][0], allShops: GlobalStats["shopStats"]): ShopScore {
  const maxRevenue = Math.max(...allShops.map(s => s.revenue), 1);
  const maxOrders = Math.max(...allShops.map(s => s.orderCount || 0), 1);

  // Revenue score (0-30)
  const revenueScore = Math.min((shop.revenue / maxRevenue) * 30, 30);

  // Volume score (0-25)
  const volumeScore = Math.min(((shop.orderCount || 0) / maxOrders) * 25, 25);

  // Fulfillment score (0-25) — based on completed vs total
  const fulfilled = shop.orderCount || 0;
  const fulfillmentScore = fulfilled > 0 ? Math.min((fulfilled / Math.max(fulfilled, 1)) * 25, 25) : 0;

  // Recency score (0-20) — based on today orders
  const todayOrders = shop.todayOrders || 0;
  const recencyScore = todayOrders > 0 ? Math.min(todayOrders * 5, 20) : 2;

  const totalScore = Math.round(Math.min(revenueScore + volumeScore + fulfillmentScore + recencyScore, 100));

  // Grade
  let grade: ShopScore["grade"] = "D";
  if (totalScore >= 90) grade = "A+";
  else if (totalScore >= 75) grade = "A";
  else if (totalScore >= 55) grade = "B";
  else if (totalScore >= 35) grade = "C";

  return {
    id: shop.id,
    name: shop.name,
    score: totalScore,
    grade,
    factors: {
      fulfillment: Math.round(fulfillmentScore),
      revenue: Math.round(revenueScore),
      volume: Math.round(volumeScore),
      recency: Math.round(recencyScore),
    },
  };
}

function getScoreColor(score: number): { ring: string; text: string; bg: string } {
  if (score >= 75) return { ring: "#10b981", text: "text-emerald-500", bg: "bg-emerald-500/10" };
  if (score >= 55) return { ring: "#3b82f6", text: "text-sky-500", bg: "bg-sky-500/10" };
  if (score >= 35) return { ring: "#f59e0b", text: "text-amber-500", bg: "bg-amber-500/10" };
  return { ring: "#ef4444", text: "text-rose-500", bg: "bg-rose-500/10" };
}

function ScoreRing({ score, size = 56 }: { score: number; size?: number }) {
  const colors = getScoreColor(score);
  const strokeWidth = 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="score-ring" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-border"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={colors.ring}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out progress-ring-glow"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={cn("text-sm font-bold tabular-nums", colors.text)}>{score}</span>
      </div>
    </div>
  );
}

export function PerformanceScoreWidget({ stats, className }: PerformanceScoreProps) {
  const shops = stats.shopStats ?? [];
  const scores = useMemo(
    () => shops.map(s => calculateShopScore(s, shops)).sort((a, b) => b.score - a.score),
    [shops]
  );

  if (shops.length === 0) return null;

  const avgScore = scores.length > 0
    ? Math.round(scores.reduce((s, sc) => s + sc.score, 0) / scores.length)
    : 0;

  return (
    <div className={cn("bg-card rounded-xl border border-border shadow-sm", className)}>
      <div className="px-4 sm:px-5 pt-4 pb-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold flex items-center gap-2 text-foreground">
            <Zap className="h-4 w-4 text-gold-500" />
            أداء المتاجر
          </h3>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-muted-foreground">المعدل</span>
            <ScoreRing score={avgScore} size={32} />
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-5 pb-4 space-y-3">
        {scores.map((shop) => {
          const colors = getScoreColor(shop.score);
          return (
            <div
              key={shop.id}
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-secondary/50 transition-colors group/score"
            >
              <ScoreRing score={shop.score} size={44} />

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-foreground truncate">{shop.name}</span>
                  <span className={cn(
                    "inline-flex items-center justify-center w-8 h-6 rounded-md text-[11px] font-bold",
                    colors.bg,
                    colors.text
                  )}>
                    {shop.grade}
                  </span>
                </div>

                {/* Factor bars */}
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { icon: Clock, label: "الإنجاز", val: shop.factors.fulfillment, max: 25 },
                    { icon: TrendingUp, label: "الإيرادات", val: shop.factors.revenue, max: 30 },
                    { icon: Package, label: "الحجم", val: shop.factors.volume, max: 25 },
                    { icon: Zap, label: "النشاط", val: shop.factors.recency, max: 20 },
                  ].map((f) => {
                    const pct = (f.val / f.max) * 100;
                    return (
                      <div key={f.label} className="text-center">
                        <div className="h-1 rounded-full bg-border overflow-hidden mb-0.5">
                          <div
                            className="h-full rounded-full bg-primary/50 transition-all duration-700"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-[9px] text-muted-foreground">{f.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
