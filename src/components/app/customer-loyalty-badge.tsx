"use client";

import { Crown, Star } from "lucide-react";

interface CustomerLoyaltyBadgeProps {
  orderCount: number;
  totalSpent: number;
  sinceDate: string;
}

export function CustomerLoyaltyBadge({ orderCount, totalSpent, sinceDate }: CustomerLoyaltyBadgeProps) {
  const level = orderCount >= 20 ? "ذهبي" : orderCount >= 10 ? "فضي" : orderCount >= 5 ? "برونزي" : "جديد";
  const levelColor = orderCount >= 20 ? "text-amber-500" : orderCount >= 10 ? "text-slate-400" : orderCount >= 5 ? "text-orange-600" : "text-muted-foreground";

  return (
    <div className="flex items-center gap-3">
      <div className={`p-2 rounded-full bg-muted/50 ${levelColor}`}>
        <Crown className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="font-semibold text-sm truncate">عميل {level}</span>
          <div className="flex gap-0.5">
            {Array.from({ length: Math.min(5, Math.ceil(orderCount / 4)) }).map((_, i) => (
              <Star key={i} className="h-3 w-3 text-amber-400 fill-amber-400" />
            ))}
          </div>
        </div>
        <div className="text-xs text-muted-foreground">
          <span>{orderCount} طلب</span>
          <span className="mx-1.5">•</span>
          <span>{totalSpent.toLocaleString()} د.ج</span>
          <span className="mx-1.5">•</span>
          <span>منذ {sinceDate}</span>
        </div>
      </div>
    </div>
  );
}
