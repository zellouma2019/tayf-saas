"use client";

import { useMemo } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDA } from "@/lib/admin-utils";
import type { GlobalOrder } from "@/lib/admin-types";

interface RevenueTrendMiniProps {
  orders: GlobalOrder[];
  days?: number;
}

/**
 * Mini revenue trend widget showing daily revenue bars + trend indicator
 * Used in admin overview tab
 */
export function RevenueTrendMini({ orders, days = 14 }: RevenueTrendMiniProps) {
  const data = useMemo(() => {
    const now = new Date();
    const dailyRev: Record<string, number> = {};
    
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      dailyRev[key] = 0;
    }
    
    for (const o of orders) {
      const key = o.createdAt?.split('T')[0];
      if (key && key in dailyRev) {
        dailyRev[key] += o.total || 0;
      }
    }
    
    const entries = Object.entries(dailyRev).map(([date, rev]) => ({ date, rev }));
    const maxRev = Math.max(...entries.map(e => e.rev), 1);
    
    // Calculate trend: compare second half vs first half
    const mid = Math.floor(entries.length / 2);
    const firstHalf = entries.slice(0, mid).reduce((s, e) => s + e.rev, 0);
    const secondHalf = entries.slice(mid).reduce((s, e) => s + e.rev, 0);
    const trendPct = firstHalf > 0 ? ((secondHalf - firstHalf) / firstHalf * 100) : 0;
    
    const totalRev = entries.reduce((s, e) => s + e.rev, 0);
    const avgRev = totalRev / entries.length;
    const activeDays = entries.filter(e => e.rev > 0).length;
    
    return { entries, maxRev, trendPct, totalRev, avgRev, activeDays };
  }, [orders, days]);
  
  const trendIcon = data.trendPct > 5 ? TrendingUp : data.trendPct < -5 ? TrendingDown : Minus;
  const TrendIcon = trendIcon;
  const trendColor = data.trendPct > 5 ? 'text-emerald-600 dark:text-emerald-400' : data.trendPct < -5 ? 'text-rose-600 dark:text-rose-400' : 'text-amber-600 dark:text-amber-400';
  const barColor = data.trendPct > 5 ? 'bg-emerald-500' : data.trendPct < -5 ? 'bg-rose-400' : 'bg-amber-400';
  
  const dayLabels = ['أحد', 'إثن', 'ثلا', 'أرب', 'خمي', 'جمع', 'سبت'];
  
  return (
    <div className="stat-card-violet rounded-2xl p-4 space-y-3 card-hover-interactive">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
          <TrendingUp className="h-4 w-4 text-violet-500" />
          اتجاه الإيرادات
        </h3>
        <div className={cn("flex items-center gap-1 text-xs font-bold", trendColor)}>
          <TrendIcon className="h-3.5 w-3.5" />
          {data.trendPct > 0 ? '+' : ''}{data.trendPct.toFixed(0)}%
        </div>
      </div>
      
      {/* Sparkline bars */}
      <div className="sparkline-container" style={{ height: '40px' }}>
        {data.entries.map((entry, i) => {
          const h = Math.max((entry.rev / data.maxRev) * 100, 3);
          const isToday = i === data.entries.length - 1;
          return (
            <div
              key={entry.date}
              className={cn(
                "sparkline-bar rounded-sm",
                isToday ? 'bg-violet-500' : barColor,
                isToday && 'opacity-100',
                !isToday && 'opacity-50 hover:opacity-80'
              )}
              style={{
                height: `${h}%`,
                animationDelay: `${i * 30}ms`,
              }}
              title={`${entry.date}: ${formatDA(entry.rev)}`}
            />
          );
        })}
      </div>
      
      {/* Summary row */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div>
          <div className="text-xs font-bold text-foreground count-animate">{formatDA(data.totalRev)}</div>
          <div className="text-[10px] text-muted-foreground">إجمالي {days} يوم</div>
        </div>
        <div>
          <div className="text-xs font-bold text-foreground count-animate">{formatDA(Math.round(data.avgRev))}</div>
          <div className="text-[10px] text-muted-foreground">متوسط/يوم</div>
        </div>
        <div>
          <div className="text-xs font-bold text-foreground count-animate">{data.activeDays}/{days}</div>
          <div className="text-[10px] text-muted-foreground">أيام نشطة</div>
        </div>
      </div>
      
      {/* Day-of-week labels */}
      <div className="flex justify-between text-[9px] text-muted-foreground/50 px-0.5">
        {data.entries.slice(0, 7).map((e, i) => {
          const dayName = dayLabels[new Date(e.date).getDay()];
          return <span key={i}>{dayName}</span>;
        })}
      </div>
    </div>
  );
}
