"use client";

import { Store, Package, DollarSign, TrendingUp, Clock, BarChart3, Activity, UserCheck, ShoppingBag } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
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

export function OverviewTab({ stats, lastUpdated, onOpenCreate }: {
  stats: GlobalStats;
  lastUpdated: string;
  onOpenCreate: () => void;
}) {
  return (
    <div className="space-y-6">
      {/* شريط الترحيب */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-l from-teal-600 via-teal-500 to-cyan-600 p-6 sm:p-8 text-white">
        <div className="relative z-10">
          <h2 className="text-xl sm:text-2xl font-bold mb-1">مرحباً بك في طيف 👋</h2>
          <p className="text-teal-100 text-sm max-w-lg">
            منصة إدارة المطابع — أنشئ متاجرك الأول وابدأ في استقبال طلبات الطباعة أونلاين
          </p>
        </div>
        <div className="absolute -left-10 -top-10 w-40 h-40 rounded-full bg-white/10" />
        <div className="absolute -right-6 -bottom-6 w-28 h-28 rounded-full bg-white/5" />
        <div className="absolute left-1/2 -bottom-8 w-20 h-20 rounded-full bg-white/5" />
      </div>

      {lastUpdated && (
        <div className="flex items-center justify-end gap-1.5 text-[11px] text-slate-400 -mt-3">
          <Clock className="h-3 w-3" />
          <span>آخر تحديث: {lastUpdated}</span>
        </div>
      )}

      {/* بطاقات الإحصائيات */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-background rounded-xl border border-slate-200/60 dark:border-slate-700/60 shadow-[0_1px_3px_rgba(0,0,0,0.06)] border-t-2 border-t-teal-500 p-5 sm:p-6 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
          <div className="flex items-start justify-between"><div className="min-w-0"><div className="text-2xl font-bold text-foreground tabular-nums">{formatNumber(stats.totalOrders ?? 0)}</div><div className="text-xs text-muted-foreground mt-1">إجمالي الطلبات</div></div><div className="w-11 h-11 rounded-xl bg-gradient-to-br from-teal-50 to-teal-100/50 dark:from-teal-950 dark:to-teal-900/50 flex items-center justify-center shrink-0"><Package className="h-5 w-5 text-teal-600" /></div></div>
        </div>
        <div className="bg-background rounded-xl border border-slate-200/60 dark:border-slate-700/60 shadow-[0_1px_3px_rgba(0,0,0,0.06)] border-t-2 border-t-emerald-500 p-5 sm:p-6 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
          <div className="flex items-start justify-between"><div className="min-w-0"><div className="text-2xl font-bold text-foreground tabular-nums">{formatDA(stats.totalRevenue ?? 0)}</div><div className="text-xs text-muted-foreground mt-1">إجمالي الإيرادات</div></div><div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950 dark:to-emerald-900/50 flex items-center justify-center shrink-0"><DollarSign className="h-5 w-5 text-emerald-600" /></div></div>
        </div>
        <div className="bg-background rounded-xl border border-slate-200/60 dark:border-slate-700/60 shadow-[0_1px_3px_rgba(0,0,0,0.06)] border-t-2 border-t-amber-500 p-5 sm:p-6 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
          <div className="flex items-start justify-between"><div className="min-w-0"><div className="text-2xl font-bold text-foreground tabular-nums">{formatNumber(stats.todayOrders ?? 0)}</div><div className="text-xs text-muted-foreground mt-1">طلبات اليوم</div></div><div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950 dark:to-amber-900/50 flex items-center justify-center shrink-0"><TrendingUp className="h-5 w-5 text-amber-600" /></div></div>
        </div>
        <div className="bg-background rounded-xl border border-slate-200/60 dark:border-slate-700/60 shadow-[0_1px_3px_rgba(0,0,0,0.06)] border-t-2 border-t-sky-500 p-5 sm:p-6 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
          <div className="flex items-start justify-between"><div className="min-w-0"><div className="text-2xl font-bold text-foreground tabular-nums">{formatNumber(stats.activeShopCount ?? 0)}<span className="text-slate-300 text-lg font-normal">/{formatNumber(stats.shopCount ?? 0)}</span></div><div className="text-xs text-muted-foreground mt-1">متجر نشط</div></div><div className="w-11 h-11 rounded-xl bg-gradient-to-br from-sky-50 to-sky-100/50 dark:from-sky-950 dark:to-sky-900/50 flex items-center justify-center shrink-0"><Store className="h-5 w-5 text-sky-600" /></div></div>
        </div>
      </div>

      {/* توزيع الحالات */}
      <Card className="bg-slate-50/50 dark:bg-slate-900/50 rounded-xl border border-slate-200/60 dark:border-slate-700/60 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2 text-slate-700">
            <BarChart3 className="h-4 w-4 text-teal-600" />
            توزيع حالات الطلبات
          </CardTitle>
        </CardHeader>
        <CardContent>
          {(() => {
            const totalOrders = stats.totalOrders ?? 0;
            if (totalOrders === 0) {
              return (
                <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                  <Clock className="h-10 w-10 text-slate-200 mb-3" />
                  <p className="text-sm">لا توجد طلبات بعد لعرض التوزيع</p>
                </div>
              );
            }
            const allStatuses = [...STATUS_FLOW, "cancelled"];
            const statusEntries = allStatuses.map((s) => ({
              key: s,
              emoji: s === "cancelled" ? "❌" : STATUS_META[s].emoji,
              label: s === "cancelled" ? "ملغي" : STATUS_META[s].label,
              count: stats.statusCounts?.[s] ?? 0,
            }));
            return (
              <div className="w-full flex gap-4">
                {statusEntries.map((entry) => {
                  const pct = totalOrders > 0 ? (entry.count / totalOrders) * 100 : 0;
                  return (
                    <div key={entry.key} className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <span className="text-sm">{entry.emoji}</span>
                        <span className="text-xs text-slate-600 truncate">{entry.label}</span>
                        <span className="text-xs font-bold text-slate-800 tabular-nums mr-auto">{entry.count}</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-200/60 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            entry.key === "pending" ? "bg-amber-400" :
                            entry.key === "printing" ? "bg-blue-400" :
                            entry.key === "ready" ? "bg-emerald-400" :
                            entry.key === "delivered" ? "bg-slate-400" :
                            "bg-rose-400"
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1 text-left" dir="ltr">{pct.toFixed(1)}%</div>
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

      {/* ملخص المتاجر */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {stats.shopStats.map((shop) => (
          <ShopOverviewCard key={shop.id} shop={shop} onRefresh={() => {}} />
        ))}
      </div>

      {/* بطاقات الإجراءات السريعة */}
      {(stats.shopStats.length ?? 0) === 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button onClick={onOpenCreate} className="group bg-background rounded-xl border border-slate-200/60 dark:border-slate-700/60 shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-5 text-right hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-50 to-teal-100/50 dark:from-teal-950 dark:to-teal-900/50 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Store className="h-5 w-5 text-teal-600" />
            </div>
            <h3 className="text-sm font-bold text-foreground mb-1">إنشاء متجرك الأول</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">ابدأ بتسجيل مطبعتك وشارك الرابط مع زبائنك</p>
          </button>
          <div className="bg-background rounded-xl border border-slate-200/60 dark:border-slate-700/60 shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-5 text-right">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950 dark:to-emerald-900/50 flex items-center justify-center mb-3">
              <UserCheck className="h-5 w-5 text-emerald-600" />
            </div>
            <h3 className="text-sm font-bold text-foreground mb-1">إدارة الفريق</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">أضف أعضاء الفريق وحدد صلاحياتهم من صفحة الأمان</p>
          </div>
          <div className="bg-background rounded-xl border border-slate-200/60 dark:border-slate-700/60 shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-5 text-right">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950 dark:to-amber-900/50 flex items-center justify-center mb-3">
              <ShoppingBag className="h-5 w-5 text-amber-600" />
            </div>
            <h3 className="text-sm font-bold text-foreground mb-1">تخصيص الإعدادات</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">عيّن الخدمات والأسعار الافتراضية لكل متجر جديد</p>
          </div>
        </div>
      )}

      {/* آخر الطلبات */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card className="bg-background rounded-xl border border-slate-200/60 dark:border-slate-700/60 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2 text-slate-700">
              <Activity className="h-4 w-4 text-teal-600" />
              النشاطات الأخيرة
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100">
              {stats.recentOrders.slice(0, 6).map((order) => {
                const timeAgo = getTimeAgo(order.createdAt);
                const activityIcon = order.status === "pending" ? "📝" : order.status === "printing" ? "🖨️" : order.status === "ready" ? "✅" : order.status === "delivered" ? "📦" : "❌";
                return (
                  <div key={order.id} className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50/50 transition-colors">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 text-sm mt-0.5">{activityIcon}</div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-slate-700 truncate">
                        <span className="font-semibold">{order.customer.name}</span>
                        <span className="text-slate-400 mx-1">·</span>
                        {order.serviceName}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] text-slate-400">{order.shopName}</span>
                        <span className="text-[11px] text-slate-300">·</span>
                        <span className="text-[11px] text-slate-400">{timeAgo}</span>
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-slate-700 shrink-0">{formatDA(order.total)}</span>
                  </div>
                );
              })}
              {(!stats.recentOrders.length) && (
                <div className="py-8 flex flex-col items-center">
                  <Activity className="h-8 w-8 text-slate-200 mb-2" />
                  <p className="text-slate-400 text-xs">لا توجد نشاطات بعد</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-background rounded-xl border border-slate-200/60 dark:border-slate-700/60 shadow-[0_1px_3px_rgba(0,0,0,0.06)] lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2 text-slate-700">
              <Clock className="h-4 w-4 text-teal-600" />
              آخر الطلبات عبر المتاجر
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100">
              {stats.recentOrders.slice(0, 10).map((order) => (
                <div key={order.id} className="flex items-center justify-between px-4 sm:px-5 py-3.5 gap-3 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-800">{order.reference}</span>
                        <span className="text-xs px-2 py-0.5 rounded-lg bg-slate-100 text-slate-500">{order.shopName}</span>
                      </div>
                      <div className="text-xs text-slate-400 truncate mt-0.5">{order.customer.name} · {order.serviceName}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-sm font-bold text-slate-800">{formatDA(order.total)}</span>
                    <span className={`text-xs px-2.5 py-1 rounded-lg ${STATUS_COLORS[order.status] || ""}`}>
                      {STATUS_META[order.status]?.label || order.status}
                    </span>
                  </div>
                </div>
              ))}
              {(!stats.recentOrders.length) && (
                <div className="py-14 flex flex-col items-center justify-center">
                  <Package className="h-10 w-10 text-slate-200 mb-3" />
                  <p className="text-slate-400 text-sm font-medium">لا توجد طلبات بعد</p>
                  <p className="text-slate-300 text-xs mt-1">ستظهر هنا آخر الطلبات من جميع المتاجر</p>
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
      <Card className="bg-background rounded-xl border border-slate-200/60 dark:border-slate-700/60 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2 text-slate-700">
            <Activity className="h-4 w-4 text-teal-600" />
            توزيع حالات الطلبات - مخطط دائري
          </CardTitle>
        </CardHeader>
        <CardContent dir="rtl">
          <div className="flex flex-col items-center justify-center py-10 text-slate-400">
            <Clock className="h-10 w-10 text-slate-200 mb-3" />
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
    <Card className="bg-background rounded-xl border border-slate-200/60 dark:border-slate-700/60 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2 text-slate-700">
          <Activity className="h-4 w-4 text-teal-600" />
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
              contentStyle={{ backgroundColor: "#fff", border: "1px solid #e2e8f0", borderRadius: "10px", fontSize: "13px", direction: "rtl", fontFamily: "inherit", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
              formatter={(value: number, name: string) => [`${formatNumber(value)} طلب`, name]}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 mt-1">
          {pieData.map((entry) => {
            const pct = total > 0 ? ((entry.value / total) * 100).toFixed(1) : "0.0";
            return (
              <div key={entry.key} className="flex items-center gap-1.5 text-xs text-slate-600">
                <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[entry.key] ?? "#94A3B8" }} />
                <span>{entry.name}</span>
                <span className="font-semibold text-slate-800 tabular-nums">{formatNumber(entry.value)} ({pct}%)</span>
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
      <Card className="bg-background rounded-xl border border-slate-200/60 dark:border-slate-700/60 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2 text-slate-700">
            <TrendingUp className="h-4 w-4 text-teal-600" />
            مقارنة إيرادات المتاجر
          </CardTitle>
        </CardHeader>
        <CardContent dir="rtl">
          <div className="flex flex-col items-center justify-center py-10 text-slate-400">
            <Store className="h-10 w-10 text-slate-200 mb-3" />
            <p className="text-sm">لا توجد متاجر بعد لعرض المقارنة</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  const barData = shops.slice().sort((a, b) => b.revenue - a.revenue).slice(0, 10).map((s) => ({ name: s.name, revenue: s.revenue }));
  return (
    <Card className="bg-background rounded-xl border border-slate-200/60 dark:border-slate-700/60 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2 text-slate-700">
          <TrendingUp className="h-4 w-4 text-teal-600" />
          مقارنة إيرادات المتاجر
        </CardTitle>
      </CardHeader>
      <CardContent dir="rtl">
        <ResponsiveContainer width="100%" height={Math.max(220, barData.length * 36 + 40)}>
          <BarChart data={barData} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <XAxis type="number" tick={{ fontSize: 11, fill: "#64748b" }} tickFormatter={(v: number) => formatDA(v)} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: "#334155" }} width={100} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ backgroundColor: "#fff", border: "1px solid #e2e8f0", borderRadius: "10px", fontSize: "13px", direction: "rtl", fontFamily: "inherit", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
              formatter={(value: number) => [formatDA(value), "الإيرادات"]}
              labelFormatter={(label: string) => `المتجر: ${label}`}
            />
            <Bar dataKey="revenue" fill="#0d7377" radius={[0, 6, 6, 0]} barSize={22} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}