"use client";

import { useMemo } from "react";
import {
  BarChart3, TrendingUp, TrendingDown, Minus, Calendar, ArrowUpRight, ArrowDownRight
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Line, ComposedChart,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { GlobalStats } from "@/lib/admin-types";

interface WeeklyReportChartProps {
  stats: GlobalStats | null;
  className?: string;
}

const ARABIC_DAYS = ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];
const ARABIC_MONTHS = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

function TrendIcon({ value }: { value: number }) {
  if (value > 0) return <ArrowUpRight className="h-3 w-3 text-emerald-500" />;
  if (value < 0) return <ArrowDownRight className="h-3 w-3 text-red-500" />;
  return <Minus className="h-3 w-3 text-muted-foreground" />;
}

export function WeeklyReportChart({ stats, className }: WeeklyReportChartProps) {
  const { weeklyData, summary, monthComparison } = useMemo(() => {
    if (!stats) return { weeklyData: [], summary: null, monthComparison: null };

    const recentOrders = stats.recentOrders || [];
    const today = new Date();

    // بيانات آخر 7 أيام
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() - (6 - i));
      return d;
    });

    const weeklyData = days.map(d => {
      const dayStart = new Date(d); dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(d); dayEnd.setHours(23, 59, 59, 999);
      const dayOrders = recentOrders.filter(o => {
        const t = new Date(o.createdAt);
        return t >= dayStart && t <= dayEnd;
      });
      return {
        day: ARABIC_DAYS[d.getDay()],
        date: d.toLocaleDateString('ar-DZ'),
        orders: dayOrders.length,
        revenue: dayOrders.reduce((s, o) => s + (o.total || 0), 0),
        avgOrder: dayOrders.length > 0
          ? dayOrders.reduce((s, o) => s + (o.total || 0), 0) / dayOrders.length
          : 0,
        completed: dayOrders.filter(o => o.status === "delivered" || o.status === "ready").length,
        cancelled: dayOrders.filter(o => o.status === "cancelled").length,
      };
    });

    // ملخص الأسبوع
    const totalOrders = weeklyData.reduce((s, d) => s + d.orders, 0);
    const totalRevenue = weeklyData.reduce((s, d) => s + d.revenue, 0);
    const avgDailyOrders = totalOrders / 7;
    const peakDay = weeklyData.reduce((max, d) => d.orders > max.orders ? d : max, weeklyData[0]);
    const completionRate = totalOrders > 0
      ? Math.round((weeklyData.reduce((s, d) => s + d.completed, 0) / totalOrders) * 100)
      : 0;

    const summary = { totalOrders, totalRevenue, avgDailyOrders, peakDay, completionRate };

    // مقارنة مع الأسبوع السابق
    const prevWeekDays = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() - (13 - i));
      return d;
    });
    const prevTotal = prevWeekDays.reduce((s, d) => {
      const dayStart = new Date(d); dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(d); dayEnd.setHours(23, 59, 59, 999);
      const dayOrders = recentOrders.filter(o => {
        const t = new Date(o.createdAt);
        return t >= dayStart && t <= dayEnd;
      });
      return s + dayOrders.reduce((acc, o) => acc + (o.total || 0), 0);
    }, 0);

    const prevOrdersCount = prevWeekDays.reduce((s, d) => {
      const dayStart = new Date(d); dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(d); dayEnd.setHours(23, 59, 59, 999);
      const dayOrders = recentOrders.filter(o => {
        const t = new Date(o.createdAt);
        return t >= dayStart && t <= dayEnd;
      });
      return s + dayOrders.length;
    }, 0);

    const revenueChange = prevTotal > 0
      ? Math.round(((totalRevenue - prevTotal) / prevTotal) * 100)
      : 0;
    const ordersChange = prevOrdersCount > 0
      ? Math.round(((totalOrders - prevOrdersCount) / prevOrdersCount) * 100)
      : 0;

    const monthComparison = { revenueChange, ordersChange, prevTotal, prevOrdersCount };

    return { weeklyData, summary, monthComparison };
  }, [stats]);

  if (!stats || weeklyData.length === 0) {
    return (
      <Card className={cn("widget", className)} dir="rtl">
        <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <BarChart3 className="h-8 w-8 mb-2 opacity-50" />
          <p className="text-sm">لا توجد بيانات كافية للتقرير الأسبوعي</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn("space-y-4", className)} dir="rtl">
      {/* ملخص الأسبوع */}
      {summary && monthComparison && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="stat-card p-3 rounded-xl border border-border/50 bg-card animate-fade-up">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-muted-foreground">إجمالي الطلبات</span>
              <Badge variant="secondary" className={cn(
                "text-[10px] gap-0.5 px-1.5",
                monthComparison.ordersChange > 0 && "text-emerald-600 bg-emerald-50 dark:bg-emerald-950",
                monthComparison.ordersChange < 0 && "text-red-600 bg-red-50 dark:bg-red-950",
              )}>
                <TrendIcon value={monthComparison.ordersChange} />
                {Math.abs(monthComparison.ordersChange)}%
              </Badge>
            </div>
            <div className="text-xl font-bold tabular-nums metric-large-number">{summary.totalOrders}</div>
          </div>

          <div className="stat-card p-3 rounded-xl border border-border/50 bg-card animate-fade-up" style={{ animationDelay: "50ms" }}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-muted-foreground">إجمالي الإيرادات</span>
              <Badge variant="secondary" className={cn(
                "text-[10px] gap-0.5 px-1.5",
                monthComparison.revenueChange > 0 && "text-emerald-600 bg-emerald-50 dark:bg-emerald-950",
                monthComparison.revenueChange < 0 && "text-red-600 bg-red-50 dark:bg-red-950",
              )}>
                <TrendIcon value={monthComparison.revenueChange} />
                {Math.abs(monthComparison.revenueChange)}%
              </Badge>
            </div>
            <div className="text-xl font-bold tabular-nums metric-large-number text-emerald-600 dark:text-emerald-400">
              {summary.totalRevenue.toLocaleString('ar-DZ')} د.ج
            </div>
          </div>

          <div className="stat-card p-3 rounded-xl border border-border/50 bg-card animate-fade-up" style={{ animationDelay: "100ms" }}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-muted-foreground">متوسط يومي</span>
            </div>
            <div className="text-xl font-bold tabular-nums metric-large-number">{summary.avgDailyOrders.toFixed(1)}</div>
            <div className="text-[10px] text-muted-foreground">طلب/يوم</div>
          </div>

          <div className="stat-card p-3 rounded-xl border border-border/50 bg-card animate-fade-up" style={{ animationDelay: "150ms" }}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-muted-foreground">يوم الذروة</span>
              <TrendingUp className="h-3 w-3 text-primary" />
            </div>
            <div className="text-xl font-bold metric-large-number">{summary.peakDay.day}</div>
            <div className="text-[10px] text-muted-foreground">{summary.peakDay.orders} طلب</div>
          </div>

          <div className="stat-card p-3 rounded-xl border border-border/50 bg-card animate-fade-up" style={{ animationDelay: "200ms" }}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-muted-foreground">نسبة الإنجاز</span>
            </div>
            <div className="text-xl font-bold tabular-nums metric-large-number text-primary">{summary.completionRate}%</div>
            <div className="progress-bar-animated mt-1.5 h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary to-violet-500 transition-all duration-700"
                style={{ width: `${summary.completionRate}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* الرسم البياني */}
      <Card className="widget chart-container" dir="rtl">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            التقرير الأسبوعي — الطلبات والإيرادات
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <ResponsiveContainer width="100%" height={260}>
            <ComposedChart data={weeklyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border, #e5e7eb)" opacity={0.4} />
              <XAxis
                dataKey="day"
                tick={{ fontSize: 11, fill: 'var(--muted-foreground, #888)' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                yAxisId="left"
                tick={{ fontSize: 10, fill: 'var(--muted-foreground, #888)' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                yAxisId="right"
                orientation="left"
                tick={{ fontSize: 10, fill: 'var(--muted-foreground, #888)' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                contentStyle={{
                  background: 'var(--card, #fff)',
                  border: '1px solid var(--border, #e5e7eb)',
                  borderRadius: '12px',
                  fontSize: '12px',
                  direction: 'rtl',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                }}
                formatter={(value: number, name: string) => {
                  if (name === 'revenue') return [`${value.toLocaleString('ar-DZ')} د.ج`, 'الإيرادات'];
                  if (name === 'orders') return [value, 'الطلبات'];
                  return [value, name];
                }}
              />
              <Bar
                yAxisId="left"
                dataKey="orders"
                fill="var(--primary, #8b5cf6)"
                radius={[6, 6, 0, 0]}
                maxBarSize={40}
                opacity={0.85}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="revenue"
                stroke="var(--chart-line, #10b981)"
                strokeWidth={2.5}
                dot={{ fill: 'var(--chart-line, #10b981)', r: 4, strokeWidth: 0 }}
                activeDot={{ r: 6, strokeWidth: 2, stroke: 'var(--card, #fff)' }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
