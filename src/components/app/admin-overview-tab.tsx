"use client";

import { Store, Package, DollarSign, TrendingUp, Clock, BarChart3, Activity, UserCheck, ShoppingBag, ArrowUpRight, Sparkles, Users, CalendarDays, Zap, ArrowDownRight, Globe, Crown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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

export function OverviewTab({ stats, lastUpdated, onOpenCreate, adminName }: {
  stats: GlobalStats;
  lastUpdated: string;
  onOpenCreate: () => void;
  adminName?: string;
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
      <div className="gradient-border-animated relative overflow-hidden rounded-2xl bg-gradient-to-l from-primary via-primary/80 to-primary/60 p-6 sm:p-8 text-white fade-in-up glass-card" style={{ backgroundColor: 'rgba(124, 58, 237, 0.85)', backdropFilter: 'blur(16px)' }}>
        <div className="absolute -left-10 -top-10 w-40 h-40 rounded-full bg-white/10 animate-[pulse_4s_ease-in-out_infinite]" />
        <div className="absolute -right-6 -bottom-6 w-28 h-28 rounded-full bg-white/5 animate-[pulse_5s_ease-in-out_infinite_1s]" />
        <div className="absolute left-1/3 top-1/4 w-16 h-16 rounded-full bg-white/5 animate-[pulse_6s_ease-in-out_infinite_2s]" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold mb-1 flex items-center gap-2"><span className="online-dot" /><span>مرحباً بك {adminName || "في طيف"}</span> <Sparkles className="h-5 w-5 text-white/80" /></h2>
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

      {lastUpdated && (
        <div className="flex items-center justify-end gap-1.5 text-[11px] text-muted-foreground -mt-3">
          <Clock className="h-3 w-3" />
          <span>آخر تحديث: {lastUpdated}</span>
        </div>
      )}

      {/* بطاقات الإحصائيات */}
      <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-4 stagger-grid">
        <div className="bg-card rounded-xl border border-border shadow-sm border-t-2 border-t-primary p-5 sm:p-6 card-glow group card-tilt-3d gradient-border-animated">
          <div className="flex items-start justify-between"><div className="min-w-0"><div className="text-2xl font-bold text-foreground tabular-nums"><AnimatedCounter value={safeStats.totalOrders ?? 0} formatFn={formatNumber} /></div><div className="text-xs text-muted-foreground mt-1">إجمالي الطلبات</div></div><div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform"><Package className="h-5 w-5 text-primary" /></div></div>
          {(safeStats.todayOrders ?? 0) > 0 && <div className="flex items-center gap-1 mt-3 text-[11px] text-emerald-500 dark:text-emerald-400"><ArrowUpRight className="h-3 w-3" /><span>{formatNumber(safeStats.todayOrders)} اليوم</span></div>}
        </div>
        <div className="bg-card rounded-xl border border-border shadow-sm border-t-2 border-t-emerald-400 p-5 sm:p-6 card-glow group card-tilt-3d gradient-border-animated">
          <div className="flex items-start justify-between"><div className="min-w-0"><div className="text-2xl font-bold text-foreground tabular-nums"><AnimatedCounter value={safeStats.totalRevenue ?? 0} formatFn={formatDA} /></div><div className="text-xs text-muted-foreground mt-1">إجمالي الإيرادات</div></div><div className="w-11 h-11 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/15 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform"><DollarSign className="h-5 w-5 text-emerald-600 dark:text-emerald-400" /></div></div>
        </div>
        <div className="bg-card rounded-xl border border-border shadow-sm border-t-2 border-t-amber-400 p-5 sm:p-6 card-glow group card-tilt-3d gradient-border-animated">
          <div className="flex items-start justify-between"><div className="min-w-0"><div className="text-2xl font-bold text-foreground tabular-nums"><AnimatedCounter value={safeStats.todayOrders ?? 0} formatFn={formatNumber} /></div><div className="text-xs text-muted-foreground mt-1">طلبات اليوم</div></div><div className="w-11 h-11 rounded-xl bg-amber-500/10 dark:bg-amber-500/15 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform"><TrendingUp className="h-5 w-5 text-amber-600 dark:text-amber-400" /></div></div>
        </div>
        <div className="bg-card rounded-xl border border-border shadow-sm border-t-2 border-t-sky-400 p-5 sm:p-6 card-glow group card-tilt-3d gradient-border-animated">
          <div className="flex items-start justify-between"><div className="min-w-0"><div className="text-2xl font-bold text-foreground tabular-nums"><AnimatedCounter value={safeStats.activeShopCount ?? 0} formatFn={formatNumber} /><span className="text-muted-foreground/40 text-lg font-normal">/<AnimatedCounter value={safeStats.shopCount ?? 0} formatFn={formatNumber} /></span></div><div className="text-xs text-muted-foreground mt-1">متجر نشط</div></div><div className="w-11 h-11 rounded-xl bg-sky-500/10 dark:bg-sky-500/15 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform"><Store className="h-5 w-5 text-sky-600 dark:text-sky-400" /></div></div>
        </div>
      </div>

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

      {/* مخطط إيرادات الأسبوع */}
      <WeeklyRevenueChart stats={stats} />

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
          <ShopOverviewCard key={shop.id} shop={shop} onRefresh={() => {}} />
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
      <QuickStatsOverview
        totalOrders={safeStats.totalOrders ?? 0}
        completedOrders={(safeStats.statusCounts?.delivered ?? 0) + (safeStats.statusCounts?.completed ?? 0)}
        pendingOrders={safeStats.statusCounts?.pending ?? 0}
        totalRevenue={safeStats.totalRevenue ?? 0}
        className="fade-in-up fade-in-up-delay-1"
      />

      {/* أداء المتاجر */}
      <PerformanceScoreWidget stats={stats} className="fade-in-up fade-in-up-delay-2 card-glow" />

      {/* تنبيه الطلبات المتأخرة */}
      <StaleOrdersWidget stats={stats} onRefresh={() => {}} />

      {/* آخر الطلبات + النشاط */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card className="bg-card rounded-xl border border-border shadow-sm">
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
                  "flex items-center justify-between px-4 sm:px-5 py-3.5 gap-3 table-row-hover table-row-accent",
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
      <Card className="bg-card rounded-xl border border-border shadow-sm">
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
    <Card className="bg-card rounded-xl border border-border shadow-sm">
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
      <Card className="bg-card rounded-xl border border-border shadow-sm">
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
    <Card className="bg-card rounded-xl border border-border shadow-sm">
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