"use client";

import { useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  AreaChart,
  Area,
  CartesianGrid,
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  CalendarDays,
  Clock,
  Package,
} from "lucide-react";
import { STATUS_META, SERVICE_MAP, formatDA } from "@/lib/print-config";
import type { PrintOrderLite } from "@/lib/order-types";
import { cn } from "@/lib/utils";

// ===== الأنواع =====
interface AdminStats {
  totalOrders: number;
  totalRevenue: number;
  todayOrders: number;
  statusCounts: Record<string, number>;
  serviceCounts: { serviceType: string; count: number; revenue: number }[];
  recentOrders: PrintOrderLite[];
  totalExpenses?: number;
  profit?: number;
}

export interface MerchantAnalyticsProps {
  stats: AdminStats | null;
  orders: PrintOrderLite[];
}

// ===== ثوابت =====
const STATUS_PIE_COLORS: Record<string, string> = {
  pending: "#F59E0B",
  printing: "#0891B2",
  ready: "#10B981",
  delivered: "#059669",
  cancelled: "#EF4444",
};

const SERVICE_BAR_COLORS = [
  "#0d7377",
  "#D97706",
  "#059669",
  "#0891B2",
  "#DC2626",
  "#EA580C",
];

const SERVICE_LABELS: Record<string, string> = {
  document: "طباعة مستندات",
  photo: "طباعة صور",
  binding: "تجليد",
  copy: "نسخ",
  card: "بطاقات",
  poster: "ملصقات",
  banner: "لافتات",
  stamp: "ختم",
  booklet: "كتيبات",
  envelope: "أظرف",
  sticker: "ملصقات ورقية",
  certificate: "شهادات",
  invitation: "دعوات",
};

const DAY_NAMES_AR = [
  "الأحد",
  "الاثنين",
  "الثلاثاء",
  "الأربعاء",
  "الخميس",
  "الجمعة",
  "السبت",
];

// ===== تلميح مخصص بالعربية =====
function ArabicTooltip({
  active,
  payload,
  label,
  valueLabel = "القيمة",
}: {
  active?: boolean;
  payload?: { name: string; value: number; fill?: string }[];
  label?: string;
  valueLabel?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 shadow-lg text-sm" dir="rtl">
      {label && <p className="text-slate-500 dark:text-slate-400 text-xs font-medium mb-1.5">{label}</p>}
      {payload.map((p, i) => (
        <p key={i} className="flex items-center gap-2 text-xs">
          <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: p.fill || "#0d7377" }} />
          <span className="text-slate-600 dark:text-slate-300">{p.name}:</span>
          <span className="font-bold text-slate-800 dark:text-slate-100 tabular-nums">{valueLabel === "إيرادات" ? formatDA(p.value) : p.value}</span>
        </p>
      ))}
    </div>
  );
}

// ===== تلميح للإيرادات =====
function RevenueTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { name: string; value: number; fill?: string }[];
  label?: string;
}) {
  return <ArabicTooltip active={active} payload={payload} label={label} valueLabel="إيرادات" />;
}

// ===== عنوان القسم =====
function SectionHeader({ title }: { title: string }) {
  return (
    <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 border-r-4 border-teal-500 pr-3 mb-4">
      {title}
    </h3>
  );
}

// ===== المكون الرئيسي =====
export function MerchantAnalytics({ stats, orders }: MerchantAnalyticsProps) {
  // ---- حسابات مشتقة ----

  // إيراد الأسبوع الحالي
  const weekRevenue = useMemo(() => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - ((dayOfWeek + 1) % 7));
    weekStart.setHours(0, 0, 0, 0);
    return orders
      .filter((o) => new Date(o.createdAt) >= weekStart)
      .reduce((s, o) => s + o.total, 0);
  }, [orders]);

  // إيراد الأسبوع السابق للمقارنة
  const prevWeekRevenue = useMemo(() => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const thisWeekStart = new Date(now);
    thisWeekStart.setDate(now.getDate() - ((dayOfWeek + 1) % 7));
    thisWeekStart.setHours(0, 0, 0, 0);
    const prevWeekStart = new Date(thisWeekStart);
    prevWeekStart.setDate(prevWeekStart.getDate() - 7);
    return orders
      .filter((o) => {
        const d = new Date(o.createdAt);
        return d >= prevWeekStart && d < thisWeekStart;
      })
      .reduce((s, o) => s + o.total, 0);
  }, [orders]);

  const weekTrendPercent = useMemo(() => {
    if (prevWeekRevenue === 0) return weekRevenue > 0 ? 100 : 0;
    return Math.round(((weekRevenue - prevWeekRevenue) / prevWeekRevenue) * 100);
  }, [weekRevenue, prevWeekRevenue]);

  // إيراد اليوم
  const todayRevenue = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return orders
      .filter((o) => new Date(o.createdAt) >= today)
      .reduce((s, o) => s + o.total, 0);
  }, [orders]);

  // إيراد الأمس للمقارنة
  const yesterdayRevenue = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayEnd = new Date(today);
    return orders
      .filter((o) => {
        const d = new Date(o.createdAt);
        return d >= yesterday && d < yesterdayEnd;
      })
      .reduce((s, o) => s + o.total, 0);
  }, [orders]);

  const todayTrendPercent = useMemo(() => {
    if (yesterdayRevenue === 0) return todayRevenue > 0 ? 100 : 0;
    return Math.round(((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100);
  }, [todayRevenue, yesterdayRevenue]);

  // ---- 1. بيانات دائرة الطلبات حسب الحالة ----
  const statusPieData = useMemo(() => {
    const counts = stats?.statusCounts ?? {};
    const statuses = ["pending", "printing", "ready", "delivered", "cancelled"];
    return statuses
      .filter((s) => (counts[s] ?? 0) > 0)
      .map((s) => ({
        name: STATUS_META[s]?.label ?? s,
        value: counts[s] ?? 0,
        status: s,
      }));
  }, [stats?.statusCounts]);

  // ---- 2. بيانات الطلبات اليومية (آخر 7 أيام) ----
  const dailyOrdersData = useMemo(() => {
    const result: { label: string; orders: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const next = new Date(d);
      next.setDate(next.getDate() + 1);
      const count = orders.filter((o) => {
        const od = new Date(o.createdAt);
        return od >= d && od < next;
      }).length;
      result.push({
        label: DAY_NAMES_AR[d.getDay()],
        orders: count,
      });
    }
    return result;
  }, [orders]);

  // ---- 3. بيانات أفضل الخدمات ----
  const topServicesData = useMemo(() => {
    const serviceMap: Record<string, { count: number; revenue: number; name: string }> = {};
    orders.forEach((o) => {
      const key = o.serviceType || "document";
      if (!serviceMap[key]) {
        serviceMap[key] = {
          count: 0,
          revenue: 0,
          name: o.serviceName || SERVICE_MAP[key]?.name || SERVICE_LABELS[key] || key,
        };
      }
      serviceMap[key].count += 1;
      serviceMap[key].revenue += o.total;
    });
    return Object.values(serviceMap)
      .sort((a, b) => b.count - a.count)
      .slice(0, 6)
      .map((s) => ({ name: s.name, count: s.count }));
  }, [orders]);

  // ---- 4. بيانات الإيرادات اليومية (آخر 7 أيام) ----
  const dailyRevenueData = useMemo(() => {
    const result: { label: string; إيرادات: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const next = new Date(d);
      next.setDate(next.getDate() + 1);
      const revenue = orders
        .filter((o) => {
          const od = new Date(o.createdAt);
          return od >= d && od < next;
        })
        .reduce((s, o) => s + o.total, 0);
      result.push({
        label: DAY_NAMES_AR[d.getDay()],
        إيرادات: revenue,
      });
    }
    return result;
  }, [orders]);

  const totalRevenue = stats?.totalRevenue ?? 0;

  return (
    <div className="space-y-6" dir="rtl">
      {/* ===== 1. نظرة عامة على الإيرادات ===== */}
      <section>
        <SectionHeader title="نظرة عامة على الإيرادات" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* إجمالي الإيرادات */}
          <Card className="rounded-xl border border-slate-200/60 dark:border-slate-700/60 shadow-[0_1px_3px_rgba(0,0,0,0.06)] bg-white dark:bg-slate-900">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100/60 flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-emerald-600" />
                </div>
              </div>
              <div className="text-2xl font-bold text-slate-800 dark:text-slate-100 tabular-nums">
                {formatDA(totalRevenue)}
              </div>
              <p className="text-xs text-slate-400 mt-1">إجمالي الإيرادات</p>
            </CardContent>
          </Card>

          {/* إيراد اليوم */}
          <Card className="rounded-xl border border-slate-200/60 dark:border-slate-700/60 shadow-[0_1px_3px_rgba(0,0,0,0.06)] bg-white dark:bg-slate-900">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-50 to-sky-100/60 flex items-center justify-center">
                  <CalendarDays className="h-5 w-5 text-sky-600" />
                </div>
                {todayTrendPercent !== 0 && (
                  <span
                    className={cn(
                      "flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded-full",
                      todayTrendPercent > 0
                        ? "bg-emerald-50 text-emerald-600"
                        : "bg-rose-50 text-rose-600",
                    )}
                  >
                    {todayTrendPercent > 0 ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                    {Math.abs(todayTrendPercent)}%
                  </span>
                )}
              </div>
              <div className="text-2xl font-bold text-slate-800 dark:text-slate-100 tabular-nums">
                {formatDA(todayRevenue)}
              </div>
              <p className="text-xs text-slate-400 mt-1">إيرادات اليوم</p>
            </CardContent>
          </Card>

          {/* إيراد الأسبوع */}
          <Card className="rounded-xl border border-slate-200/60 dark:border-slate-700/60 shadow-[0_1px_3px_rgba(0,0,0,0.06)] bg-white dark:bg-slate-900">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-50 to-teal-100/60 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-teal-600" />
                </div>
                {weekTrendPercent !== 0 && (
                  <span
                    className={cn(
                      "flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded-full",
                      weekTrendPercent > 0
                        ? "bg-emerald-50 text-emerald-600"
                        : "bg-rose-50 text-rose-600",
                    )}
                  >
                    {weekTrendPercent > 0 ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                    {Math.abs(weekTrendPercent)}%
                  </span>
                )}
              </div>
              <div className="text-2xl font-bold text-slate-800 dark:text-slate-100 tabular-nums">
                {formatDA(weekRevenue)}
              </div>
              <p className="text-xs text-slate-400 mt-1">إيرادات هذا الأسبوع</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ===== 2. الطلبات حسب الحالة + الطلبات اليومية ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* الطلبات حسب الحالة - دائري */}
        <Card className="rounded-xl border border-slate-200/60 dark:border-slate-700/60 shadow-[0_1px_3px_rgba(0,0,0,0.06)] bg-white dark:bg-slate-900">
          <CardContent className="p-5">
            <SectionHeader title="الطلبات حسب الحالة" />
            {statusPieData.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Package className="h-10 w-10 text-slate-200 dark:text-slate-700 mb-3" />
                <p className="text-sm text-slate-400">لا توجد بيانات كافية</p>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <div className="w-full max-w-[280px] h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusPieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={3}
                        dataKey="value"
                        stroke="none"
                      >
                        {statusPieData.map((entry) => (
                          <Cell
                            key={entry.status}
                            fill={STATUS_PIE_COLORS[entry.status] || "#94A3B8"}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        content={<ArabicTooltip />}
                        formatter={(value: number) => [value, "عدد الطلبات"]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                {/* وسيلة إيضاح مخصصة */}
                <div className="flex flex-wrap justify-center gap-3 mt-2">
                  {statusPieData.map((entry) => (
                    <div key={entry.status} className="flex items-center gap-1.5 text-xs">
                      <span
                        className="w-2.5 h-2.5 rounded-sm shrink-0"
                        style={{ backgroundColor: STATUS_PIE_COLORS[entry.status] || "#94A3B8" }}
                      />
                      <span className="text-slate-500 dark:text-slate-400">{entry.name}</span>
                      <span className="font-bold text-slate-700 dark:text-slate-200 tabular-nums">
                        {entry.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* الطلبات اليومية - أعمدة */}
        <Card className="rounded-xl border border-slate-200/60 dark:border-slate-700/60 shadow-[0_1px_3px_rgba(0,0,0,0.06)] bg-white dark:bg-slate-900">
          <CardContent className="p-5">
            <SectionHeader title="الطلبات اليومية (آخر 7 أيام)" />
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyOrdersData} margin={{ top: 5, right: 0, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11, fill: "#94A3B8" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#94A3B8" }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip content={<ArabicTooltip valueLabel="طلبات" />} />
                  <Bar
                    dataKey="orders"
                    name="عدد الطلبات"
                    fill="#0d7377"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={40}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ===== 3. أفضل الخدمات ===== */}
      <Card className="rounded-xl border border-slate-200/60 dark:border-slate-700/60 shadow-[0_1px_3px_rgba(0,0,0,0.06)] bg-white dark:bg-slate-900">
        <CardContent className="p-5">
          <SectionHeader title="أكثر الخدمات طلباً" />
          {topServicesData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Package className="h-10 w-10 text-slate-200 dark:text-slate-700 mb-3" />
              <p className="text-sm text-slate-400">لا توجد بيانات كافية</p>
            </div>
          ) : (
            <div className="h-[50 + topServicesData.length * 44]px min-h-[200px] max-h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={topServicesData}
                  layout="vertical"
                  margin={{ top: 0, right: 20, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 11, fill: "#94A3B8" }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 12, fill: "#64748B" }}
                    axisLine={false}
                    tickLine={false}
                    width={120}
                  />
                  <Tooltip content={<ArabicTooltip valueLabel="طلبات" />} />
                  <Bar
                    dataKey="count"
                    name="عدد الطلبات"
                    radius={[0, 6, 6, 0]}
                    maxBarSize={28}
                  >
                    {topServicesData.map((_, i) => (
                      <Cell key={i} fill={SERVICE_BAR_COLORS[i % SERVICE_BAR_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ===== 4. الإيرادات اليومية - مخطط مساحي ===== */}
      <Card className="rounded-xl border border-slate-200/60 dark:border-slate-700/60 shadow-[0_1px_3px_rgba(0,0,0,0.06)] bg-white dark:bg-slate-900">
        <CardContent className="p-5">
          <SectionHeader title="الإيرادات اليومية (آخر 7 أيام)" />
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyRevenueData} margin={{ top: 5, right: 0, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0d7377" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#0d7377" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: "#94A3B8" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#94A3B8" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<RevenueTooltip />} />
                <Legend
                  formatter={() => <span className="text-xs text-slate-500">الإيرادات</span>}
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ paddingTop: "8px" }}
                />
                <Area
                  type="monotone"
                  dataKey="إيرادات"
                  stroke="#0d7377"
                  strokeWidth={2.5}
                  fill="url(#revenueGradient)"
                  dot={{ r: 4, fill: "#0d7377", stroke: "#fff", strokeWidth: 2 }}
                  activeDot={{ r: 6, fill: "#0d7377", stroke: "#fff", strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}