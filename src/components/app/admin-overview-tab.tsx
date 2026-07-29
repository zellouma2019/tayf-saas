"use client";

import { Store, Package, DollarSign, TrendingUp, Clock, BarChart3, Activity, UserCheck, ShoppingBag, ArrowUpRight, Sparkles, Users, CalendarDays, Zap, ArrowDownRight, Globe, Crown, Wallet, BarChart2, Flame, ArrowUpLeft, ArrowDownLeft, Settings, Star, FileText, Printer, PackageSearch, ClipboardList, Timer } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";

import {
  STATUS_META, STATUS_FLOW, formatDA,
} from "@/lib/print-config";
import {
  PieChart, Pie, Cell,
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer,
} from "recharts";
import { formatNumber, STATUS_COLORS, getTimeAgo } from "@/lib/admin-utils";
import type { GlobalStats } from "@/lib/admin-types";
import { ShopOverviewCard } from "@/components/app/admin-shop-card";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { cn } from "@/lib/utils";
import { ActivityFeed } from "@/components/app/activity-feed";
import { QuickStatsOverview } from "@/components/app/quick-stats-overview";
import { PerformanceScoreWidget } from "@/components/app/performance-score-widget";
import { StaleOrdersWidget } from "@/components/app/stale-orders-widget";
import { AuditTrail } from "@/components/app/audit-trail";
import { OrdersHeatmap } from "@/components/app/orders-heatmap";
import { DailyTargetRing } from "@/components/app/daily-target-ring";
import type { ShopStat } from "@/lib/admin-types";

// ===== Sparkline Mini Chart =====
function SparklineMini({ values, color, height = 24 }: { values: number[]; color: string; height?: number }) {
  const w = 60;
  const h = height;
  const gradId = `spark-${color.replace(/[^a-z0-9]/gi, '')}-${Math.random().toString(36).slice(2, 6)}`;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 2) - 1;
    return `${x},${y}`;
  });
  const polyStr = pts.join(' ');
  const fillStr = `0,${h} ${polyStr} ${w},${h}`;
  return (
    <svg width={w} height={h} className="block mt-2 opacity-80" aria-hidden="true">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <polygon points={fillStr} fill={`url(#${gradId})`} />
      <polyline points={polyStr} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ===== Weekly Revenue Mini Bar Chart =====
function WeeklyRevenueChart({ stats }: { stats: GlobalStats }) {
  const recentOrders = stats.recentOrders || [];
  const today = new Date();
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (6 - i));
    return d;
  });
  const dayLabels = ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];
  const dailyRevenue = days.map(d => {
    const dayStart = new Date(d); dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(d); dayEnd.setHours(23, 59, 59, 999);
    return recentOrders
      .filter(o => { const t = new Date(o.createdAt); return t >= dayStart && t <= dayEnd; })
      .reduce((s, o) => s + (o.total || 0), 0);
  });
  const maxRev = Math.max(...dailyRevenue, 1);
  const totalWeek = dailyRevenue.reduce((s, v) => s + v, 0);
  if (totalWeek === 0) return null;
  return (
    <Card className="bg-card rounded-xl border border-border shadow-sm card-glow">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2 text-foreground/80">
          <CalendarDays className="h-4 w-4 text-gold-500" />
          إيرادات الأسبوع
          <span className="text-xs text-muted-foreground font-normal mr-auto tabular-nums">{formatDA(totalWeek)}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-end gap-2 h-28">
          {dailyRevenue.map((rev, i) => {
            const height = Math.max(8, (rev / maxRev) * 100);
            const isToday = i === 6;
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                <span className="text-[9px] text-muted-foreground tabular-nums">{rev > 0 ? (rev >= 1000 ? `${(rev / 1000).toFixed(1)}k` : String(rev)) : ''}</span>
                <div className="w-full flex justify-center">
                  <div
                    className={cn(
                      "rounded-t-lg transition-all duration-700 ease-out w-full max-w-[30px] cursor-default",
                      isToday
                        ? "bg-gradient-to-t from-gold-500 to-gold-300 shadow-sm shadow-gold-500/20 hover:shadow-gold-500/40"
                        : "bg-gradient-to-t from-primary/25 to-primary/15 hover:from-primary/35 hover:to-primary/25"
                    )}
                    style={{ height: `${height}%` }}
                  />
                </div>
                <span className={cn("text-[9px]", isToday ? "font-bold text-gold-600 dark:text-gold-400" : "text-muted-foreground")}>{dayLabels[i].slice(0, 3)}</span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// ===== Peak Hours Chart =====
function PeakHoursChart({ stats }: { stats: GlobalStats }) {
  const recentOrders = stats.recentOrders || [];
  const hourlyBuckets = Array.from({ length: 24 }, (_, h) => ({
    hour: h,
    count: 0,
    revenue: 0,
  }));
  recentOrders.forEach(o => {
    const hour = new Date(o.createdAt).getHours();
    hourlyBuckets[hour].count++;
    hourlyBuckets[hour].revenue += o.total || 0;
  });
  const maxCount = Math.max(...hourlyBuckets.map(b => b.count), 1);
  const hasData = hourlyBuckets.some(b => b.count > 0);
  if (!hasData) return null;

  const peakHour = hourlyBuckets.reduce((max, b) => b.count > max.count ? b : max, hourlyBuckets[0]);
  const hourLabels = ['12ص', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12م', '1م', '2م', '3م', '4م', '5م', '6م', '7م', '8م', '9م', '10م', '11م'];

  return (
    <Card className="bg-card rounded-xl border border-border shadow-sm card-elevated">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2 text-foreground/80">
          <Clock className="h-4 w-4 text-violet-500" />
          ذروة الطلب
          <span className="text-xs text-muted-foreground font-normal mr-auto">
            الأكثر: {hourLabels[peakHour.hour]} ({peakHour.count} طلب)
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-end gap-[2px] h-20">
          {hourlyBuckets.map((b, i) => {
            const height = Math.max(4, (b.count / maxCount) * 100);
            const isPeak = i === peakHour.hour;
            const isNow = i === new Date().getHours();
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-0.5 group relative">
                {isPeak && (
                  <div className="absolute -top-4 text-[8px] font-bold text-violet-500 tabular-nums">
                    🔥
                  </div>
                )}
                <div className="w-full flex justify-center">
                  <div
                    className={cn(
                      "rounded-sm transition-all duration-500 w-full max-w-[14px] cursor-default",
                      isPeak
                        ? "bg-gradient-to-t from-violet-500 to-violet-300 shadow-sm shadow-violet-500/20"
                        : isNow
                          ? "bg-gradient-to-t from-gold-500 to-gold-300 shadow-sm shadow-gold-500/20"
                          : "bg-gradient-to-t from-primary/20 to-primary/10"
                    )}
                    style={{ height: `${height}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex justify-between mt-1 text-[8px] text-muted-foreground/50">
          <span>12ص</span>
          <span>12م</span>
        </div>
      </CardContent>
    </Card>
  );
}

// ===== مكون بطاقة المقياس الواحد (للإيرادات) =====
function RevenueMetricCard({ icon: Icon, label, value, change, bgColor, textColor }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  change: number;
  bgColor: string;
  textColor: string;
}) {
  const isPositive = change > 0;
  const isNeutral = change === 0;
  return (
    <div className="metric-card bg-card rounded-xl border border-border shadow-sm p-4 sm:p-5 card-hover-lift card-glow group">
      <div className="flex items-start justify-between mb-3">
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform", bgColor)}>
          <Icon className={cn("h-5 w-5", textColor)} />
        </div>
        <span className={cn(
          "text-[11px] font-semibold px-2 py-0.5 rounded-full inline-flex items-center gap-0.5",
          isPositive && "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400",
          !isPositive && !isNeutral && "bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400",
          isNeutral && "bg-muted text-muted-foreground"
        )}>
          {isPositive ? <ArrowUpLeft className="h-3 w-3" /> : !isNeutral ? <ArrowDownLeft className="h-3 w-3" /> : null}
          {isNeutral ? "\u2014" : `${Math.abs(change)}%`}
        </span>
      </div>
      <div className="text-xl sm:text-2xl font-bold text-foreground tabular-nums mb-1">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

// ===== بطاقة إحصائيات الإيرادات مع مخطط شريطي صغير =====
function RevenueAnalyticsWidget({ stats }: { stats: GlobalStats }) {
  const recentOrders = stats.recentOrders || [];
  const today = new Date();

  // حساب إيرادات آخر 7 أيام
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (6 - i));
    return d;
  });
  const dayLabels = ['سبت', 'أحد', 'اثن', 'ثلا', 'أرب', 'خمي', 'جمع'];
  const dailyRevenue = days.map(d => {
    const dayStart = new Date(d); dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(d); dayEnd.setHours(23, 59, 59, 999);
    return recentOrders
      .filter(o => { const t = new Date(o.createdAt); return t >= dayStart && t <= dayEnd; })
      .reduce((s, o) => s + (o.total || 0), 0);
  });
  const maxDailyRev = Math.max(...dailyRevenue, 1);
  const totalRevenue = stats.totalRevenue ?? 0;
  const totalOrders = stats.totalOrders ?? 0;
  const avgOrder = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;
  const peakDailyRev = Math.max(...dailyRevenue);

  // حساب نسب التغير (مقارنة آخر 3 أيام بأول 3 أيام)
  const last3 = dailyRevenue.slice(4).reduce((s, v) => s + v, 0);
  const first3 = dailyRevenue.slice(0, 3).reduce((s, v) => s + v, 0);
  const revChange = first3 > 0 ? Math.round(((last3 - first3) / first3) * 100) : 0;

  // نسبة متوسط الطلب
  const avgAll = dailyRevenue.reduce((s, v) => s + v, 0) / Math.max(dailyRevenue.filter(v => v > 0).length, 1);
  const avgChange = avgAll > 0 ? Math.round(((avgOrder - avgAll) / avgAll) * 100) : 0;

  const hasData = totalRevenue > 0 || dailyRevenue.some(v => v > 0);
  if (!hasData) return null;

  return (
    <Card className="bg-card rounded-xl border border-border shadow-sm card-glow overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2 text-foreground/80">
          <BarChart2 className="h-4 w-4 text-gold-500" />
          إحصائيات الإيرادات
          <span className="text-[10px] text-muted-foreground font-normal mr-auto">آخر 7 أيام</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* صف المقاييس الثلاثة */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <RevenueMetricCard icon={Wallet} label="إجمالي الإيرادات" value={formatDA(totalRevenue)} change={revChange} bgColor="bg-primary/10" textColor="text-primary" />
          <RevenueMetricCard icon={ShoppingBag} label="متوسط الطلب" value={formatDA(avgOrder)} change={avgChange} bgColor="bg-gold-500/10" textColor="text-gold-600 dark:text-gold-400" />
          <RevenueMetricCard icon={Flame} label="أعلى إيراد يومي" value={formatDA(peakDailyRev)} change={0} bgColor="bg-amber-500/10" textColor="text-amber-600 dark:text-amber-400" />
        </div>

        {/* مخطط شريطي صغير (CSS فقط) */}
        <div className="flex items-end gap-1.5 sm:gap-2 h-20 px-1">
          {dailyRevenue.map((rev, i) => {
            const height = Math.max(6, (rev / maxDailyRev) * 100);
            const isToday = i === 6;
            const isPeak = rev === peakDailyRev && rev > 0;
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                <div className="absolute -top-7 left-1/2 -translate-x-1/2 text-[10px] font-bold text-foreground bg-popover border border-border rounded-md px-2 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-sm z-10 tabular-nums pointer-events-none">
                  {rev > 0 ? formatDA(rev) : '0'}
                </div>
                <div className="w-full flex justify-center flex-1 items-end">
                  <div
                    className={cn(
                      "rounded-t-md transition-all duration-700 ease-out w-full max-w-[36px] cursor-default",
                      isToday
                        ? "bg-gradient-to-t from-gold-500 to-gold-300 dark:from-gold-600 dark:to-gold-400 shadow-sm shadow-gold-500/25"
                        : isPeak
                          ? "bg-gradient-to-t from-emerald-500 to-emerald-300 dark:from-emerald-600 dark:to-emerald-400 shadow-sm shadow-emerald-500/20"
                          : "bg-gradient-to-t from-primary/20 to-primary/10 dark:from-primary/30 dark:to-primary/15 hover:from-primary/30 hover:to-primary/20"
                    )}
                    style={{ height: `${height}%` }}
                  />
                </div>
                <span className={cn("text-[9px] tabular-nums leading-none", isToday ? "font-bold text-gold-600 dark:text-gold-400" : "text-muted-foreground/60")}>
                  {dayLabels[i]}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// ===== لوحة الإجراءات السريعة =====
function QuickActionsPanel({ onOpenCreate, onRefresh, onExport, onSwitchToSettings }: {
  onOpenCreate: () => void;
  onRefresh?: () => void;
  onExport?: () => void;
  onSwitchToSettings?: () => void;
}) {
  const actions = [
    {
      label: "إنشاء متجر جديد",
      icon: Store,
      color: "bg-primary/10 text-primary",
      hoverColor: "hover:bg-primary/15",
      onClick: onOpenCreate,
    },
    {
      label: "تصدير التقرير",
      icon: ArrowDownRight,
      color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
      hoverColor: "hover:bg-emerald-500/15",
      onClick: onExport,
    },
    {
      label: "تحديث البيانات",
      icon: Zap,
      color: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
      hoverColor: "hover:bg-amber-500/15",
      onClick: onRefresh,
    },
    {
      label: "إعدادات المنصة",
      icon: Settings,
      color: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
      hoverColor: "hover:bg-sky-500/15",
      onClick: onSwitchToSettings,
    },
  ];

  return (
    <Card className="bg-card rounded-xl border border-border shadow-sm card-glow">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2 text-foreground/80">
          <Zap className="h-4 w-4 text-amber-500" />
          إجراءات سريعة
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.label}
                onClick={action.onClick}
                disabled={!action.onClick}
                className={cn(
                  "group flex flex-col items-center gap-3 rounded-xl border border-border bg-background p-4 sm:p-5",
                  "card-hover-lift btn-3d transition-all duration-200",
                  "hover:border-primary/30 dark:hover:border-primary/40",
                  "disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                )}
              >
                <div className={cn(
                  "w-11 h-11 rounded-xl flex items-center justify-center transition-transform duration-200 group-hover:scale-110",
                  action.color,
                  action.hoverColor
                )}>
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-xs font-semibold text-foreground text-center leading-relaxed">{action.label}</span>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export function OverviewTab({ stats, lastUpdated, onOpenCreate, adminName, onRefresh, onExport, onSwitchToSettings }: {
  stats: GlobalStats;
  lastUpdated: string;
  onOpenCreate: () => void;
  adminName?: string;
  onRefresh?: () => void;
  onExport?: () => void;
  onSwitchToSettings?: () => void;
}) {
  const s = stats ?? {} as GlobalStats;
  const safeStats: GlobalStats = {
    totalOrders: s.totalOrders ?? 0,
    totalRevenue: s.totalRevenue ?? 0,
    todayOrders: s.todayOrders ?? 0,
    shopCount: s.shopCount ?? 0,
    activeShopCount: s.activeShopCount ?? 0,
    statusCounts: s.statusCounts ?? {},
    shopStats: s.shopStats ?? [],
    recentOrders: s.recentOrders ?? [],
  };
  return (
    <div className="space-y-6">
      {/* شريط الترحيب */}
      <div className="aurora-bg rounded-2xl overflow-hidden fade-in-up" style={{ background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.85), rgba(212, 168, 83, 0.7))', backdropFilter: 'blur(16px)' }}>
        <div className="dot-pattern-gold absolute inset-0 opacity-20 pointer-events-none" />
        <div className="absolute -left-10 -top-10 w-40 h-40 rounded-full bg-white/10 morph-blob pointer-events-none" />
        <div className="absolute -right-6 -bottom-6 w-28 h-28 rounded-full bg-white/5 morph-blob pointer-events-none" style={{ animationDelay: '-2s' }} />
        <div className="absolute left-1/3 top-1/4 w-16 h-16 rounded-full bg-white/5 morph-blob pointer-events-none" style={{ animationDelay: '-4s' }} />
        <div className="relative z-10 p-6 sm:p-8 text-white">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold mb-1 flex items-center gap-2 text-shadow-sm"><span className="online-dot" /><span className="gradient-primary text-gradient-animated">مرحباً بك {adminName || "في طيف"}</span> <Sparkles className="h-5 w-5 text-white/80" /></h2>
              <p className="text-white/80 text-sm max-w-lg">منصة إدارة المطبع — أنشئ متاجرك الأول وابدأ في استقبال طلبات الطباعة أونلاين</p>
            </div>
            {safeStats.totalOrders > 0 && (
              <div className="flex gap-4 sm:gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold tabular-nums number-pop"><AnimatedCounter value={safeStats.todayOrders} formatFn={formatNumber} /></div>
                  <div className="text-[11px] text-white/60">طلبات اليوم</div>
                  <span className={cn("comparison-badge mt-1.5 inline-block text-[10px] px-2 py-0.5 rounded-full font-medium", safeStats.todayOrders > 0 ? "comparison-up" : "comparison-neutral")}>
                    {safeStats.todayOrders > 0 ? "نشاط جيد" : "لا طلبات"}
                  </span>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold tabular-nums number-pop"><AnimatedCounter value={safeStats.totalRevenue} formatFn={formatDA} /></div>
                  <div className="text-[11px] text-white/60">إجمالي الإيرادات</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {lastUpdated && (
        <div className="flex items-center justify-end gap-1.5 text-[11px] text-muted-foreground -mt-3">
          <Clock className="h-3 w-3" />
          <span>آخر تحديث: {lastUpdated}</span>
        </div>
      )}

      {/* بطاقات الإحصائيات */}
      <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-4 stagger-children page-enter">
        <div className="stat-tile card-glow metric-glow group card-rotate-3d card-spotlight">
          <div className="flex items-start justify-between">
            <div className="min-w-0">
              <div className="text-2xl font-bold text-foreground tabular-nums metric-large-number"><AnimatedCounter value={safeStats.totalOrders ?? 0} formatFn={formatNumber} /></div>
              <div className="text-xs text-muted-foreground mt-1">إجمالي الطلبات</div>
            </div>
            <div className="icon-container-gold metric-icon-box group-hover:scale-110 transition-transform shrink-0"><Package className="h-5 w-5" /></div>
          </div>
          <SparklineMini values={[20, 23, 25, 28, 31, 35, 38]} color="#d4a853" />
          {(safeStats.todayOrders ?? 0) > 0 && <div className="flex items-center gap-1 mt-1 text-[11px] text-emerald-500 dark:text-emerald-400"><ArrowUpRight className="h-3 w-3" /><span>{formatNumber(safeStats.todayOrders)} اليوم</span></div>}
        </div>
        <div className="stat-tile card-glow metric-glow group card-rotate-3d card-spotlight">
          <div className="flex items-start justify-between">
            <div className="min-w-0">
              <div className="text-2xl font-bold text-foreground tabular-nums metric-large-number"><AnimatedCounter value={safeStats.totalRevenue ?? 0} formatFn={formatDA} /></div>
              <div className="text-xs text-muted-foreground mt-1">إجمالي الإيرادات</div>
            </div>
            <div className="icon-container-emerald metric-icon-box group-hover:scale-110 transition-transform shrink-0"><DollarSign className="h-5 w-5" /></div>
          </div>
          <SparklineMini values={[17200, 17800, 17400, 17900, 17100, 17600, 18000]} color="#10b981" />
        </div>
        <div className="stat-tile card-glow metric-glow group card-rotate-3d card-spotlight">
          <div className="flex items-start justify-between">
            <div className="min-w-0">
              <div className="text-2xl font-bold text-foreground tabular-nums metric-large-number"><AnimatedCounter value={safeStats.todayOrders ?? 0} formatFn={formatNumber} /></div>
              <div className="text-xs text-muted-foreground mt-1">طلبات اليوم</div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 dark:bg-amber-500/15 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform border border-amber-500/15 metric-icon-box"><TrendingUp className="h-5 w-5 text-amber-600 dark:text-amber-400" /></div>
          </div>
          <SparklineMini values={[0, 1, 0, 0, 3, 0, 2]} color="#f59e0b" />
        </div>
        <div className="stat-tile card-glow metric-glow group card-rotate-3d card-spotlight">
          <div className="flex items-start justify-between">
            <div className="min-w-0">
              <div className="text-2xl font-bold text-foreground tabular-nums metric-large-number">
                <AnimatedCounter value={safeStats.activeShopCount ?? 0} formatFn={formatNumber} />
                <span className="text-muted-foreground/40 text-lg font-normal">/<AnimatedCounter value={safeStats.shopCount ?? 0} formatFn={formatNumber} /></span>
              </div>
              <div className="text-xs text-muted-foreground mt-1">متجر نشط</div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 dark:bg-sky-500/15 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform border border-sky-500/15 metric-icon-box"><Store className="h-5 w-5 text-sky-600 dark:text-sky-400" /></div>
          </div>
          <SparklineMini values={[3, 3, 4, 4, 4, 5, 5]} color="#0ea5e9" />
        </div>
      </div>

      {/* إحصائيات الإيرادات مع مخطط شريطي صغير */}
      <RevenueAnalyticsWidget stats={safeStats} />

      {/* سجل الإجراءات (Audit Trail) */}
      <AuditTrail />

      {/* إجراءات سريعة */}
      {(safeStats.shopStats.length ?? 0) > 0 && (
        <QuickActionsPanel onOpenCreate={onOpenCreate} onRefresh={onRefresh} onExport={onExport} onSwitchToSettings={onSwitchToSettings} />
      )}

      {/* توزيع الحالات */}
      <Card className="bg-muted/50 rounded-xl border border-border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2 text-foreground/80">
            <BarChart3 className="h-4 w-4 text-primary" />
            توزيع حالات الطلبات
          </CardTitle>
        </CardHeader>
        <CardContent>
          {(() => {
            const totalOrders = safeStats.totalOrders ?? 0;
            if (totalOrders === 0) {
              return (
                <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                  <div className="empty-state-icon"><Clock className="h-8 w-8 text-primary/60" /></div>
                  <p className="text-sm font-medium">لا توجد طلبات بعد لعرض التوزيع</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">ستظهر هنا بمجرد وصول أول طلب</p>
                </div>
              );
            }
            const allStatuses = [...STATUS_FLOW, "cancelled"];
            const statusEntries = allStatuses.map((s) => ({
              key: s,
              emoji: s === "cancelled" ? "❌" : STATUS_META[s].emoji,
              label: s === "cancelled" ? "ملغي" : STATUS_META[s].label,
              count: safeStats.statusCounts?.[s] ?? 0,
            }));
            return (
              <div className="w-full flex gap-4">
                {statusEntries.map((entry) => {
                  const pct = totalOrders > 0 ? (entry.count / totalOrders) * 100 : 0;
                  return (
                    <div key={entry.key} className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <span className="text-sm">{entry.emoji}</span>
                        <span className="text-xs text-foreground/60 truncate">{entry.label}</span>
                        <span className="text-xs font-bold text-foreground tabular-nums mr-auto">{entry.count}</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-border overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            entry.key === "pending" ? "bg-amber-400" :
                            entry.key === "printing" ? "bg-primary/60" :
                            entry.key === "ready" ? "bg-emerald-400" :
                            entry.key === "delivered" ? "bg-muted-foreground/70" :
                            "bg-rose-400"
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-1 text-left" dir="ltr">{pct.toFixed(1)}%</div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </CardContent>
      </Card>

      {/* رسوم بيانية تحليلية */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <PieChartCard stats={stats} />
        <RevenueBarChart stats={stats} />
      </div>

      {/* مخطط إيرادات الأسبوع + ذروة الطلب */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <WeeklyRevenueChart stats={stats} />
        <PeakHoursChart stats={stats} />
      </div>

      {/* خريطة كثافة الطلبات */}
      <OrdersHeatmap />

      {/* أفضل الزبائن */}
      {(() => {
        const customerMap = new Map<string, { name: string; count: number; total: number }>();
        (safeStats.recentOrders || []).forEach((order) => {
          const name = order.customer?.name || "—";
          const existing = customerMap.get(name);
          if (existing) {
            existing.count += 1;
            existing.total += order.total || 0;
          } else {
            customerMap.set(name, { name, count: 1, total: order.total || 0 });
          }
        });
        const topCustomers = Array.from(customerMap.values())
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);
        return (
          <Card className="bg-card rounded-xl border border-border shadow-sm card-glow card-tilt-3d">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2 text-foreground/80">
                <Crown className="h-4 w-4 text-gold-500" />
                أفضل الزبائن
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {topCustomers.length === 0 ? (
                <div className="py-10 flex flex-col items-center text-muted-foreground">
                  <Users className="h-8 w-8 text-muted-foreground/30 mb-2" />
                  <p className="text-sm font-medium">لا يوجد زبائن بعد</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">ستظهر هنا أفضل الزبائن بناءً على عدد الطلبات</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {topCustomers.map((customer, index) => (
                    <div key={customer.name} className="flex items-center justify-between px-4 sm:px-5 py-3 table-row-hover">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className={cn(
                          "inline-flex items-center justify-center w-7 h-7 rounded-full text-[11px] font-bold shrink-0 shadow-sm",
                          index === 0 ? "rank-1" : index === 1 ? "rank-2" : index === 2 ? "rank-3" : "rank-default"
                        )}>
                          {index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : index + 1}
                        </span>
                        <span className="text-sm font-medium text-foreground truncate">{customer.name}</span>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-xs px-2 py-0.5 rounded-lg bg-primary/10 text-primary font-semibold tabular-nums status-pill">{customer.count} طلب</span>
                        <span className="text-sm font-bold text-foreground/80 tabular-nums">{formatDA(customer.total)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })()}

      {/* ملخص المتاجر */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {safeStats.shopStats.map((shop) => (
          <ShopQuickStatsPopover key={shop.id} shop={shop} />
        ))}
      </div>

      {/* بطاقات الإجراءات السريعة */}
      {(safeStats.shopStats.length ?? 0) === 0 && (
        <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 gap-4 fade-in-up fade-in-up-delay-1">
          <button onClick={onOpenCreate} className="group bg-card rounded-xl border border-border shadow-sm p-5 text-right hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 border-glow-subtle">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform"><Store className="h-5 w-5 text-primary" /></div>
            <h3 className="text-sm font-bold text-foreground mb-1">إنشاء متجرك الأول</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">ابدأ بتسجيل مطبعتك وشارك الرابط مع زبائنك</p>
          </button>
          <div className="bg-card rounded-xl border border-border shadow-sm p-5 text-right border-glow-subtle">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3"><UserCheck className="h-5 w-5 text-primary" /></div>
            <h3 className="text-sm font-bold text-foreground mb-1">إدارة الفريق</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">أضف أعضاء الفريق وحدد صلاحياتهم من صفحة الأمان</p>
          </div>
          <div className="bg-card rounded-xl border border-border shadow-sm p-5 text-right border-glow-subtle">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3"><ShoppingBag className="h-5 w-5 text-primary" /></div>
            <h3 className="text-sm font-bold text-foreground mb-1">تخصيص الإعدادات</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">عيّن الخدمات والأسعار الافتراضية لكل متجر جديد</p>
          </div>
        </div>
      )}

      {/* إحصائيات سريعة مع SVG Progress Rings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <QuickStatsOverview
          totalOrders={safeStats.totalOrders ?? 0}
          completedOrders={(safeStats.statusCounts?.delivered ?? 0) + (safeStats.statusCounts?.completed ?? 0)}
          pendingOrders={safeStats.statusCounts?.pending ?? 0}
          totalRevenue={safeStats.totalRevenue ?? 0}
          className="fade-in-up fade-in-up-delay-1"
        />
        <DailyTargetRing
          currentRevenue={(() => {
            const today = new Date();
            return (safeStats.recentOrders || []).filter(o => {
              const d = new Date(o.createdAt);
              return d.toDateString() === today.toDateString();
            }).reduce((s, o) => s + (o.total || 0), 0);
          })()}
          targetRevenue={5000}
          yesterdayTrend={12}
        />
      </div>

      {/* أداء المتاجر */}
      <PerformanceScoreWidget stats={stats} className="fade-in-up fade-in-up-delay-2 card-glow" />

      {/* تنبيه الطلبات المتأخرة */}
      <StaleOrdersWidget stats={stats} onRefresh={() => {}} />

      {/* أشهر الخدمات */}
      <ServicePopularityWidget stats={safeStats} />

      {/* ترتيب المتاجر حسب الأداء */}
      {safeStats.shopStats && safeStats.shopStats.length > 1 && <ShopRankingWidget shops={safeStats.shopStats} />}

      {/* آخر الطلبات + النشاط */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card className="bg-card rounded-xl border border-border shadow-sm chart-container">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2 text-foreground/80">
              <Activity className="h-4 w-4 text-primary" />
              النشاطات الأخيرة
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="px-4 py-2">
              <ActivityFeed orders={safeStats.recentOrders || []} />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card rounded-xl border border-border shadow-sm lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2 text-foreground/80">
              <Clock className="h-4 w-4 text-primary" />
              آخر الطلبات عبر المتاجر
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {(safeStats.recentOrders || []).slice(0, 10).map((order, idx) => (
                <div key={order.id} className={cn(
                  "flex items-center justify-between px-4 sm:px-5 py-3.5 gap-3 table-row-hover table-row-accent feed-item",
                  idx % 2 === 0 ? "table-row-even" : "table-row-odd"
                )}>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-foreground">{order.reference}</span>
                        <span className="text-xs px-2 py-0.5 rounded-lg bg-muted text-muted-foreground">{order.shopName || "—"}</span>
                      </div>
                      <div className="text-xs text-muted-foreground truncate mt-0.5">{order.customer?.name || "—"} · {order.serviceName || "—"}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-sm font-bold text-foreground">{formatDA(order.total)}</span>
                    <span className={cn("text-xs px-2.5 py-1 rounded-lg flex items-center gap-1.5", STATUS_COLORS[order.status] || "")}>
                      <span className={cn("status-dot", `status-dot-${order.status}`)} />
                      {STATUS_META[order.status]?.label || order.status}
                    </span>
                  </div>
                </div>
              ))}
              {!(safeStats.recentOrders?.length) && (
                <div className="empty-state py-14">
                  <div className="empty-state-icon">
                    <Package className="h-8 w-8 text-muted-foreground/40" />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">لا توجد طلبات بعد</p>
                  <p className="text-[11px] text-muted-foreground/50 mt-1">ستظهر هنا آخر الطلبات من جميع المتاجر</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}



// ===== مخطط دائري =====
function PieChartCard({ stats }: { stats: GlobalStats }) {
  const total = stats.totalOrders ?? 0;
  if (total === 0) {
    return (
      <Card className="bg-card rounded-xl border border-border shadow-sm chart-container">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2 text-foreground/80">
            <Activity className="h-4 w-4 text-primary" />
            توزيع حالات الطلبات - مخطط دائري
          </CardTitle>
        </CardHeader>
        <CardContent dir="rtl">
          <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
            <Clock className="h-10 w-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm">لا توجد طلبات بعد لعرض المخطط</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  const PIE_COLORS: Record<string, string> = { pending: "#F59E0B", printing: "#0891B2", ready: "#10B981", delivered: "#059669", cancelled: "#EF4444" };
  const allStatuses = [...STATUS_FLOW, "cancelled"];
  const pieData = allStatuses.map((s) => ({ name: STATUS_META[s]?.label ?? "ملغي", value: stats.statusCounts?.[s] ?? 0, key: s })).filter((d) => d.value > 0);
  return (
    <Card className="bg-card rounded-xl border border-border shadow-sm chart-container">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2 text-foreground/80">
          <Activity className="h-4 w-4 text-primary" />
          توزيع حالات الطلبات - مخطط دائري
        </CardTitle>
      </CardHeader>
      <CardContent dir="rtl">
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={3} dataKey="value" stroke="none">
              {pieData.map((entry) => (<Cell key={entry.key} fill={PIE_COLORS[entry.key] ?? "#94A3B8"} />))}
            </Pie>
            <Tooltip
              contentStyle={{ backgroundColor: "var(--popover)", border: "1px solid var(--border)", borderRadius: "10px", fontSize: "13px", direction: "rtl", fontFamily: "inherit", color: "var(--popover-foreground)" }}
              formatter={(value: number, name: string) => [`${formatNumber(value)} طلب`, name]}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 mt-1">
          {pieData.map((entry) => {
            const pct = total > 0 ? ((entry.value / total) * 100).toFixed(1) : "0.0";
            return (
              <div key={entry.key} className="flex items-center gap-1.5 text-xs text-foreground/60">
                <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[entry.key] ?? "#94A3B8" }} />
                <span>{entry.name}</span>
                <span className="font-semibold text-foreground tabular-nums">{formatNumber(entry.value)} ({pct}%)</span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// ===== مخطط أعمدة =====
function RevenueBarChart({ stats }: { stats: GlobalStats }) {
  const shops = stats.shopStats ?? [];
  if (shops.length === 0) {
    return (
      <Card className="bg-card rounded-xl border border-border shadow-sm chart-container">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2 text-foreground/80">
            <TrendingUp className="h-4 w-4 text-primary" />
            مقارنة إيرادات المتاجر
          </CardTitle>
        </CardHeader>
        <CardContent dir="rtl">
          <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
            <Store className="h-10 w-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm">لا توجد متاجر بعد لعرض المقارنة</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  const barData = shops.slice().sort((a, b) => b.revenue - a.revenue).slice(0, 10).map((s) => ({ name: s.name, revenue: s.revenue }));
  return (
    <Card className="bg-card rounded-xl border border-border shadow-sm chart-container">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2 text-foreground/80">
          <TrendingUp className="h-4 w-4 text-primary" />
          مقارنة إيرادات المتاجر
        </CardTitle>
      </CardHeader>
      <CardContent dir="rtl">
        <ResponsiveContainer width="100%" height={Math.max(220, barData.length * 36 + 40)}>
          <BarChart data={barData} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <XAxis type="number" tick={{ fontSize: 11, fill: "#64748b" }} tickFormatter={(v: number) => formatDA(v)} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: "#334155" }} width={100} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ backgroundColor: "var(--popover)", border: "1px solid var(--border)", borderRadius: "10px", fontSize: "13px", direction: "rtl", fontFamily: "inherit", color: "var(--popover-foreground)" }}
              formatter={(value: number) => [formatDA(value), "الإيرادات"]}
              labelFormatter={(label: string) => `المتجر: ${label}`}
            />
            <Bar dataKey="revenue" fill="#d4a853" radius={[0, 6, 6, 0]} barSize={22} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// ===== أشهر الخدمات المطلوبة =====
function ServicePopularityWidget({ stats }: { stats: GlobalStats }) {
  const recentOrders = stats.recentOrders || [];
  const serviceMap = new Map<string, { name: string; count: number; revenue: number }>();

  recentOrders.forEach((o) => {
    const name = o.serviceName || "أخرى";
    const existing = serviceMap.get(name);
    if (existing) {
      existing.count += 1;
      existing.revenue += o.total || 0;
    } else {
      serviceMap.set(name, { name, count: 1, revenue: o.total || 0 });
    }
  });

  const topServices = Array.from(serviceMap.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  if (topServices.length === 0) return null;

  const maxCount = topServices[0].count;
  const SERVICE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
    "طباعة مستند": FileText,
    "طباعة صور": Printer,
  };

  return (
    <Card className="bg-card rounded-xl border border-border shadow-sm card-gradient-top fade-in-up">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2 text-foreground/80">
          <Star className="h-4 w-4 text-gold-500" />
          أشهر الخدمات المطلوبة
          <span className="text-[10px] text-muted-foreground font-normal mr-auto">آخر {recentOrders.length} طلب</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {topServices.map((service, index) => {
            const Icon = SERVICE_ICONS[service.name] || FileText;
            const pct = maxCount > 0 ? Math.round((service.count / maxCount) * 100) : 0;
            return (
              <div key={service.name} className="group flex items-center gap-3">
                <div className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-lg shrink-0 transition-transform group-hover:scale-110",
                  index === 0 ? "bg-gold-500/15 text-gold-500 border border-gold-500/20" :
                  "bg-muted text-muted-foreground border border-border"
                )}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-foreground truncate">{service.name}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="chip chip-gold text-[10px] py-0 px-1.5">{service.count} طلب</span>
                      <span className="text-xs font-bold text-foreground tabular-nums">{formatDA(service.revenue)}</span>
                    </div>
                  </div>
                  <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-700 ease-out",
                        index === 0 ? "bg-gradient-to-l from-gold-400 to-gold-500" :
                        "bg-gradient-to-l from-primary/40 to-primary/25"
                      )}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// ===== ترتيب المتاجر حسب الأداء =====
const MEDAL_STYLES = [
  { emoji: "🥇", label: "الأول", ring: "ring-amber-400/40", bg: "bg-amber-50 dark:bg-amber-950/20" },
  { emoji: "🥈", label: "الثاني", ring: "ring-slate-400/40", bg: "bg-slate-50 dark:bg-slate-800/30" },
  { emoji: "🥉", label: "الثالث", ring: "ring-orange-400/40", bg: "bg-orange-50 dark:bg-orange-950/20" },
];

function ShopRankingWidget({ shops }: { shops: GlobalStats["shopStats"] }) {
  // ترتيب حسب عدد الطلبات (ثم الإيرادات كـ tiebreaker)
  const ranked = [...shops]
    .sort((a, b) => (b.orders ?? 0) - (a.orders ?? 0) || (b.revenue ?? 0) - (a.revenue ?? 0))
    .slice(0, 5);

  if (ranked.length < 2) return null;

  return (
    <Card className="bg-card rounded-xl border border-border shadow-sm fade-in-up">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2 text-foreground/80">
          <Crown className="h-4 w-4 text-amber-500" />
          ترتيب المتاجر حسب الأداء
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-border stagger-list">
          {ranked.map((shop, idx) => {
            const medal = MEDAL_STYLES[idx];
            const maxOrders = ranked[0].orders ?? 1;
            const pct = Math.round(((shop.orders ?? 0) / maxOrders) * 100);
            return (
              <div key={shop.id} className={cn(
                "flex items-center gap-3 px-4 sm:px-5 py-3.5 table-row-hover transition-colors",
                idx === 0 && medal?.bg
              )}>
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm font-bold",
                  medal?.ring && `ring-2 ${medal.ring}`,
                  idx === 0 ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400" :
                  idx === 1 ? "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300" :
                  idx === 2 ? "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400" :
                  "bg-muted text-muted-foreground"
                )}>
                  {medal?.emoji || idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-foreground truncate">{shop.name}</span>
                    {shop.isActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-700",
                          idx === 0 ? "bg-amber-500" : idx === 1 ? "bg-slate-400" : "bg-muted-foreground/30"
                        )}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-[11px] text-muted-foreground tabular-nums shrink-0">
                      {shop.orders ?? 0} طلب
                    </span>
                  </div>
                </div>
                {(shop.revenue ?? 0) > 0 && (
                  <div className="text-left shrink-0">
                    <div className="text-sm font-bold text-foreground tabular-nums">{formatDA(shop.revenue ?? 0)}</div>
                    <div className="text-[10px] text-muted-foreground">إيرادات</div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// ===== Shop Quick Stats Popover =====
function ShopQuickStatsPopover({ shop }: { shop: ShopStat }) {
  const pendingCount = (shop.recentOrders || []).filter(o => o.status === "pending").length;
  const lastOrder = (shop.recentOrders || []).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <div className="cursor-pointer">
          <ShopOverviewCard shop={shop} onRefresh={() => {}} />
        </div>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="center"
        className="w-64 p-4 space-y-3 tooltip-premium border-border/80 dark:border-border/60"
        dir="rtl"
      >
        <div className="flex items-center gap-2 mb-1">
          <Store className="h-4 w-4 text-primary" />
          <span className="text-sm font-bold text-foreground">{shop.name}</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="kpi-badge rounded-lg bg-background border border-border p-2.5 text-center">
            <div className="flex items-center justify-center gap-1 text-[10px] text-muted-foreground mb-1">
              <PackageSearch className="h-3 w-3" />
              <span>طلبات اليوم</span>
            </div>
            <div className="text-lg font-bold tabular-nums text-foreground">{shop.todayOrders}</div>
          </div>
          <div className="kpi-badge rounded-lg bg-background border border-border p-2.5 text-center">
            <div className="flex items-center justify-center gap-1 text-[10px] text-muted-foreground mb-1">
              <Wallet className="h-3 w-3" />
              <span>إيرادات اليوم</span>
            </div>
            <div className="text-lg font-bold tabular-nums text-emerald-600 dark:text-emerald-400">{formatDA(shop.revenue)}</div>
          </div>
          <div className="kpi-badge rounded-lg bg-background border border-border p-2.5 text-center">
            <div className="flex items-center justify-center gap-1 text-[10px] text-muted-foreground mb-1">
              <ClipboardList className="h-3 w-3" />
              <span>معلّقة</span>
            </div>
            <div className="text-lg font-bold tabular-nums text-amber-600 dark:text-amber-400">{pendingCount}</div>
          </div>
          <div className="kpi-badge rounded-lg bg-background border border-border p-2.5 text-center">
            <div className="flex items-center justify-center gap-1 text-[10px] text-muted-foreground mb-1">
              <Timer className="h-3 w-3" />
              <span>آخر طلب</span>
            </div>
            <div className="text-[11px] font-medium text-foreground tabular-nums truncate">{lastOrder ? getTimeAgo(lastOrder.createdAt) : "—"}</div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}