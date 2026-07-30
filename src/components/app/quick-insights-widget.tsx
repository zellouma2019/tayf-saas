"use client";

import { useMemo } from "react";
import { Lightbulb, Clock, Users, Zap, TrendingUp, AlertTriangle, Award, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDA, getTimeAgo } from "@/lib/admin-utils";
import type { GlobalOrder, ShopStat } from "@/lib/admin-types";

interface QuickInsightsWidgetProps {
  orders: GlobalOrder[];
  shops: ShopStat[];
}

interface Insight {
  icon: typeof Lightbulb;
  text: string;
  color: string;
  bgClass: string;
  type: 'info' | 'warning' | 'success' | 'action';
}

/**
 * AI-like quick insights widget that analyzes order/shop data
 * and surfaces actionable patterns for the admin.
 */
export function QuickInsightsWidget({ orders, shops }: QuickInsightsWidgetProps) {
  const insights = useMemo<Insight[]>(() => {
    const result: Insight[] = [];
    if (!orders.length) return result;
    
    const now = Date.now();
    const HOUR = 3600000;
    
    // 1. Pending orders insight
    const pendingOrders = orders.filter(o => o.status === 'pending');
    if (pendingOrders.length > 0) {
      const oldestPending = pendingOrders.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())[0];
      const age = now - new Date(oldestPending.createdAt).getTime();
      if (age > 2 * HOUR) {
        result.push({
          icon: AlertTriangle,
          text: `${pendingOrders.length} طلب معلّق · أقدمها منذ ${getTimeAgo(oldestPending.createdAt)}`,
          color: 'text-amber-600 dark:text-amber-400',
          bgClass: 'stat-card-amber',
          type: 'warning',
        });
      } else {
        result.push({
          icon: Clock,
          text: `${pendingOrders.length} طلب معلّق بانتظار المراجعة`,
          color: 'text-sky-600 dark:text-sky-400',
          bgClass: 'stat-card-sky',
          type: 'info',
        });
      }
    }
    
    // 2. High-value orders
    const highValue = orders.filter(o => o.total >= 3000);
    if (highValue.length > 0) {
      const total = highValue.reduce((s, o) => s + o.total, 0);
      result.push({
        icon: Zap,
        text: `${highValue.length} طلب عالي القيمة (≥ 3,000 د.ج) بإجمالي ${formatDA(total)}`,
        color: 'text-rose-600 dark:text-rose-400',
        bgClass: 'stat-card-rose',
        type: 'action',
      });
    }
    
    // 3. Top performing shop
    if (shops.length > 1) {
      const topShop = [...shops].sort((a, b) => (b.revenue || 0) - (a.revenue || 0))[0];
      if (topShop?.revenue > 0) {
        result.push({
          icon: Award,
          text: `"${topShop.name}" الأفضل بإيرادات ${formatDA(topShop.revenue)}`,
          color: 'text-emerald-600 dark:text-emerald-400',
          bgClass: 'stat-card-emerald',
          type: 'success',
        });
      }
    }
    
    // 4. Today's activity
    const todayOrders = orders.filter(o => {
      const d = new Date(o.createdAt);
      const today = new Date();
      return d.toDateString() === today.toDateString();
    });
    if (todayOrders.length > 0) {
      const todayRev = todayOrders.reduce((s, o) => s + o.total, 0);
      result.push({
        icon: TrendingUp,
        text: `اليوم: ${todayOrders.length} طلب بإيرادات ${formatDA(todayRev)}`,
        color: 'text-violet-600 dark:text-violet-400',
        bgClass: 'stat-card-violet',
        type: 'success',
      });
    }
    
    // 5. Repeat customers
    const phoneCounts: Record<string, number> = {};
    for (const o of orders) {
      const p = o.customer?.phone;
      if (p) phoneCounts[p] = (phoneCounts[p] || 0) + 1;
    }
    const repeatCustomers = Object.values(phoneCounts).filter(c => c > 1).length;
    if (repeatCustomers > 0) {
      result.push({
        icon: Users,
        text: `${repeatCustomers} زبون تكراري من أصل ${Object.keys(phoneCounts).length} زبون`,
        color: 'text-sky-600 dark:text-sky-400',
        bgClass: 'stat-card-sky',
        type: 'info',
      });
    }
    
    // 6. Delivery rate
    const delivered = orders.filter(o => o.status === 'delivered').length;
    const deliveryRate = orders.length > 0 ? Math.round((delivered / orders.length) * 100) : 0;
    if (orders.length >= 5) {
      result.push({
        icon: BarChart3,
        text: `معدل التسليم: ${deliveryRate}% (${delivered} من ${orders.length})`,
        color: deliveryRate >= 50 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400',
        bgClass: deliveryRate >= 50 ? 'stat-card-emerald' : 'stat-card-amber',
        type: deliveryRate >= 50 ? 'success' : 'warning',
      });
    }
    
    return result.slice(0, 6);
  }, [orders, shops]);
  
  if (insights.length === 0) return null;
  
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
        <Lightbulb className="h-4 w-4 text-amber-500" />
        رؤى سريعة
      </h3>
      <div className="grid gap-2 stagger-grid-6">
        {insights.map((insight, i) => {
          const Icon = insight.icon;
          return (
            <div
              key={i}
              className={cn(
                "rounded-xl px-3.5 py-2.5 flex items-start gap-2.5 anim-smooth-in",
                insight.bgClass
              )}
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <Icon className={cn("h-4 w-4 shrink-0 mt-0.5", insight.color)} />
              <p className="text-xs leading-relaxed text-foreground/90">{insight.text}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
