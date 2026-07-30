"use client";

import { useMemo } from "react";
import { TrendingUp, Package, Users, Clock, Zap, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDA } from "@/lib/print-config";
import type { GlobalOrder } from "@/lib/admin-types";

interface DailyPerformanceBarProps {
  orders: GlobalOrder[];
}

export function DailyPerformanceBar({ orders }: DailyPerformanceBarProps) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const stats = useMemo(() => {
    const todayOrders = orders.filter(o => {
      const t = new Date(o.createdAt);
      return t >= today && t < tomorrow;
    });

    const totalToday = todayOrders.reduce((s, o) => s + (o.total || 0), 0);
    const completedToday = todayOrders.filter(o => o.status === 'delivered').length;
    const pendingToday = todayOrders.filter(o => o.status === 'pending').length;
    const printingToday = todayOrders.filter(o => o.status === 'printing' || o.status === 'confirmed').length;
    const readyToday = todayOrders.filter(o => o.status === 'ready').length;
    const uniqueCustomers = new Set(todayOrders.map(o => o.customer?.phone).filter(Boolean)).size;
    const avgOrder = todayOrders.length > 0 ? Math.round(totalToday / todayOrders.length) : 0;

    // Completion rate
    const completionRate = todayOrders.length > 0
      ? Math.round((completedToday / todayOrders.length) * 100)
      : 0;

    // Urgent orders (≥5000)
    const urgentCount = todayOrders.filter(o => (o.total || 0) >= 5000).length;

    return {
      count: todayOrders.length,
      totalRevenue: totalToday,
      completed: completedToday,
      pending: pendingToday,
      printing: printingToday,
      ready: readyToday,
      uniqueCustomers,
      avgOrder,
      completionRate,
      urgentCount,
    };
  }, [orders, today, tomorrow]);

  const metrics = [
    {
      icon: Package,
      label: "طلبات اليوم",
      value: String(stats.count),
      color: "text-violet-500",
      bg: "bg-violet-100 dark:bg-violet-900/30",
      highlight: "number-highlight-violet",
    },
    {
      icon: TrendingUp,
      label: "إيرادات اليوم",
      value: formatDA(stats.totalRevenue),
      color: "text-emerald-500",
      bg: "bg-emerald-100 dark:bg-emerald-900/30",
      highlight: "number-highlight-emerald",
    },
    {
      icon: CheckCircle2,
      label: "مكتمل",
      value: `${stats.completed}/${stats.count}`,
      color: "text-green-500",
      bg: "bg-green-100 dark:bg-green-900/30",
      highlight: "",
      bar: { current: stats.completed, total: stats.count, color: "bg-green-500" },
    },
    {
      icon: Users,
      label: "زبون فريد",
      value: String(stats.uniqueCustomers),
      color: "text-sky-500",
      bg: "bg-sky-100 dark:bg-sky-900/30",
      highlight: "",
    },
    {
      icon: Clock,
      label: "متوسط الطلب",
      value: formatDA(stats.avgOrder),
      color: "text-amber-500",
      bg: "bg-amber-100 dark:bg-amber-900/30",
      highlight: "number-highlight-amber",
    },
    {
      icon: Zap,
      label: "عاجل",
      value: String(stats.urgentCount),
      color: stats.urgentCount > 0 ? "text-rose-500" : "text-muted-foreground",
      bg: stats.urgentCount > 0 ? "bg-rose-100 dark:bg-rose-900/30" : "bg-muted/50",
      highlight: stats.urgentCount > 0 ? "neon-text-rose" : "",
      pulse: stats.urgentCount > 0,
    },
  ];

  return (
    <div className="glass-card-v4 rounded-xl p-4 space-y-3 fade-in-up-d1">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-foreground section-title-underline">
          أداء اليوم
        </h3>
        <div className="flex items-center gap-1.5">
          <span className={cn(
            "text-[10px] font-bold px-2 py-0.5 rounded-full",
            stats.completionRate >= 50
              ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
              : stats.completionRate >= 25
                ? "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                : "bg-muted text-muted-foreground border border-border"
          )}>
            {stats.completionRate}% إنجاز
          </span>
        </div>
      </div>

      <div className="gradient-line-animated" />

      {/* Completion progress bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>معدل الإنجاز</span>
          <span className="tabular-nums">{stats.completed} من {stats.count}</span>
        </div>
        <div className="h-2 bg-muted/50 rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-700 ease-out shimmer-bar",
              stats.completionRate >= 50 ? "bg-gradient-to-l from-emerald-400 to-green-500" :
              stats.completionRate >= 25 ? "bg-gradient-to-l from-amber-400 to-yellow-500" :
              "bg-gradient-to-l from-violet-400 to-violet-500"
            )}
            style={{ width: `${Math.max(stats.completionRate, 2)}%` }}
          />
        </div>
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {metrics.map((m, i) => {
          const Icon = m.icon;
          return (
            <div
              key={m.label}
              className={cn(
                "rounded-lg p-2.5 text-center transition-all hover-scale-subtle soft-hover-bg",
                m.pulse && "breathing-border",
                `fade-in-up-d${Math.min(i + 2, 5)}`
              )}
            >
              <div className={cn(
                "w-7 h-7 rounded-lg flex items-center justify-center mx-auto mb-1.5",
                m.bg
              )}>
                <Icon className={cn("h-3.5 w-3.5", m.color)} />
              </div>
              <div className={cn(
                "text-sm font-bold tabular-nums leading-tight",
                m.highlight || "text-foreground"
              )}>
                {m.value}
              </div>
              <div className="text-[10px] text-muted-foreground mt-0.5">{m.label}</div>
            </div>
          );
        })}
      </div>

      {/* Status breakdown mini bar */}
      {stats.count > 0 && (
        <div className="space-y-1.5">
          <div className="text-[10px] text-muted-foreground">توزيع الحالات</div>
          <div className="flex h-2 rounded-full overflow-hidden gap-0.5">
            {stats.pending > 0 && (
              <div
                className="bg-amber-400 rounded-full transition-all duration-500"
                style={{ width: `${(stats.pending / stats.count) * 100}%` }}
                title={`معلّق: ${stats.pending}`}
              />
            )}
            {stats.printing > 0 && (
              <div
                className="bg-blue-400 rounded-full transition-all duration-500"
                style={{ width: `${(stats.printing / stats.count) * 100}%` }}
                title={`قيد التنفيذ: ${stats.printing}`}
              />
            )}
            {stats.ready > 0 && (
              <div
                className="bg-violet-400 rounded-full transition-all duration-500"
                style={{ width: `${(stats.ready / stats.count) * 100}%` }}
                title={`جاهز: ${stats.ready}`}
              />
            )}
            {stats.completed > 0 && (
              <div
                className="bg-green-500 rounded-full transition-all duration-500"
                style={{ width: `${(stats.completed / stats.count) * 100}%` }}
                title={`مكتمل: ${stats.completed}`}
              />
            )}
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[10px]">
            {stats.pending > 0 && <span className="status-dot-label pending">معلّق {stats.pending}</span>}
            {stats.printing > 0 && <span className="status-dot-label printing">قيد التنفيذ {stats.printing}</span>}
            {stats.ready > 0 && <span className="status-dot-label ready">جاهز {stats.ready}</span>}
            {stats.completed > 0 && <span className="status-dot-label delivered">مكتمل {stats.completed}</span>}
          </div>
        </div>
      )}
    </div>
  );
}
