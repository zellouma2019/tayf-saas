"use client";

import { memo } from "react";
import { BarChart3, Clock, Users, TrendingUp, AlertTriangle, FileText, RefreshCw, Package, X } from "lucide-react";
import { cn } from "@/lib/utils";

// === Stub components for admin dashboard ===
// These are lightweight placeholders that render meaningful content
// without requiring complex chart/analytics libraries.

function StubCard({ title, children, className }: { title: string; children?: React.ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-xl border border-border bg-card p-4", className)}>
      <div className="text-sm font-medium text-muted-foreground mb-3">{title}</div>
      {children}
    </div>
  );
}

export const OrderTimelineMini = memo(function OrderTimelineMini({ orders }: { orders: Record<string, unknown>[] }) {
  if (!orders?.length) return null;
  return (
    <StubCard title="آخر الطلبات">
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {orders.slice(0, 5).map((o: Record<string, unknown>, i: number) => (
          <div key={String(o.id || i)} className="flex items-center gap-3 p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
            <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{String(o.serviceName || o.reference || "—")}</div>
              <div className="text-xs text-muted-foreground">{String(o.customerName || "—")} · {String(o.total || 0)} د.ج</div>
            </div>
            <div className={cn("text-xs px-2 py-0.5 rounded-full font-medium",
              String(o.status) === "delivered" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
              String(o.status) === "printing" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" :
              "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
            )}>{String(o.status || "pending")}</div>
          </div>
        ))}
      </div>
    </StubCard>
  );
});

export const PerformanceMeter = memo(function PerformanceMeter({ orders, shops }: { orders: Record<string, unknown>[]; shops: Record<string, unknown>[] }) {
  const completed = orders?.filter((o: Record<string, unknown>) => String(o.status) === "delivered").length || 0;
  const total = orders?.length || 0;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  return (
    <StubCard title="مؤشر الأداء">
      <div className="flex items-center gap-4">
        <div className="relative w-20 h-20">
          <svg className="w-20 h-20 -rotate-90" viewBox="0 0 36 36">
            <path d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" className="text-muted/30" />
            <path d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" strokeDasharray={`${pct}, 100`} className="text-primary" />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center text-sm font-bold">{pct}%</div>
        </div>
        <div className="space-y-1 text-sm">
          <div>مكتمل: <span className="font-bold">{completed}/{total}</span></div>
          <div>المتاجر النشطة: <span className="font-bold">{shops?.length || 0}</span></div>
          <div>الإيرادات: <span className="font-bold">{(orders?.reduce((s: number, o: Record<string, unknown>) => s + Number(o.total || 0), 0) || 0).toLocaleString()}</span> د.ج</div>
        </div>
      </div>
    </StubCard>
  );
});

export const CustomerInsight = memo(function CustomerInsight({ orders }: { orders: Record<string, unknown>[] }) {
  const uniqueCustomers = new Set(orders?.map((o: Record<string, unknown>) => o.customer?.name || o.customer?.phone || "").filter(Boolean));
  const repeatCount = orders?.length > 0 ? Math.min(Math.round(orders.length / Math.max(uniqueCustomers.size, 1) * 10) / 10, 5) : 0;
  return (
    <StubCard title="رؤية الزبائن">
      <div className="grid grid-cols-2 gap-3">
        <div className="text-center p-3 rounded-lg bg-muted/30">
          <Users className="h-5 w-5 mx-auto mb-1 text-primary" />
          <div className="text-lg font-bold">{uniqueCustomers.size}</div>
          <div className="text-xs text-muted-foreground">زبون فريد</div>
        </div>
        <div className="text-center p-3 rounded-lg bg-muted/30">
          <TrendingUp className="h-5 w-5 mx-auto mb-1 text-primary" />
          <div className="text-lg font-bold">{repeatCount}</div>
          <div className="text-xs text-muted-foreground">متوسط الطلبات</div>
        </div>
      </div>
    </StubCard>
  );
});

export const OrderQuickStats = memo(function OrderQuickStats({ orders }: { orders: Record<string, unknown>[] }) {
  const statusCounts: Record<string, number> = {};
  for (const o of orders || []) {
    const s = String(o.status || "pending");
    statusCounts[s] = (statusCounts[s] || 0) + 1;
  }
  return (
    <div className="flex flex-wrap gap-2">
      {Object.entries(statusCounts).map(([status, count]) => (
        <div key={status} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 text-sm">
          <div className={cn("w-2 h-2 rounded-full",
            status === "delivered" ? "bg-green-500" :
            status === "printing" ? "bg-amber-500" :
            status === "ready" ? "bg-blue-500" :
            "bg-gray-400"
          )} />
          <span className="text-muted-foreground">{status}:</span>
          <span className="font-bold">{count}</span>
        </div>
      ))}
    </div>
  );
});

export const DuplicateDetector = memo(function DuplicateDetector({ orders }: { orders: Record<string, unknown>[] }) {
  const phoneCounts = new Map<string, number>();
  for (const o of orders || []) {
    const phone = String(o.customer?.phone || "");
    if (!phone) continue;
    phoneCounts.set(phone, (phoneCounts.get(phone) || 0) + 1);
  }
  const duplicates = Array.from(phoneCounts.entries()).filter(([, c]) => c > 1);
  if (duplicates.length === 0) return null;
  return (
    <StubCard title={"طلبات مكررة محتملة (" + duplicates.length + ")"}>
      <div className="text-sm text-muted-foreground">
        تم اكتشاف {duplicates.length} أرقام هواتف مكررة. 
        <span className="font-medium">{duplicates.reduce((s, [, c]) => s + c, 0)} طلب</span> مرتبط بها.
      </div>
    </StubCard>
  );
});

// Status pipeline - horizontal bar showing order distribution
export const StatusPipeline = memo(function StatusPipeline({ orders, onStatusClick }: { orders: Record<string, unknown>[]; onStatusClick?: (s: string) => void }) {
  const statusCounts: Record<string, number> = {};
  for (const o of orders || []) {
    const s = String(o.status || "pending");
    statusCounts[s] = (statusCounts[s] || 0) + 1;
  }
  const total = orders?.length || 1;
  const colors: Record<string, string> = { pending: "bg-gray-400", printing: "bg-amber-500", ready: "bg-blue-500", delivered: "bg-green-500" };
  return (
    <StubCard title="مسار الحالات">
      <div className="flex h-6 rounded-full overflow-hidden bg-muted/30">
        {Object.entries(statusCounts).map(([status, count]) => (
          <div key={status} className={cn("transition-all cursor-pointer hover:opacity-80", colors[status] || "bg-gray-400")}
            style={{ width: `${(count / total) * 100}%` }}
            onClick={() => onStatusClick?.(status)}
            title={`${status}: ${count}`} />
        ))}
      </div>
      <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
        {Object.entries(statusCounts).map(([status, count]) => (
          <span key={status} className="cursor-pointer hover:text-foreground" onClick={() => onStatusClick?.(status)}>
            {status}: <span className="font-bold text-foreground">{count}</span>
          </span>
        ))}
      </div>
    </StubCard>
  );
});

// Aging alerts
export const AgingAlerts = memo(function AgingAlerts({ orders, onOrderClick }: { orders: Record<string, unknown>[]; onOrderClick?: (id: string) => void }) {
  const now = Date.now();
  const oldOrders = (orders || []).filter(o => {
    const created = new Date(String(o.createdAt || "")).getTime();
    return (now - created) > 3 * 24 * 60 * 60 * 1000 && String(o.status) !== "delivered";
  });
  if (oldOrders.length === 0) return null;
  return (
    <StubCard title={"طلبات قديمة (" + oldOrders.length + ")"}>
      <div className="space-y-2">
        {oldOrders.slice(0, 5).map((o: Record<string, unknown>, i: number) => {
          const age = Math.floor((now - new Date(String(o.createdAt || "")).getTime()) / (24 * 60 * 60 * 1000));
          return (
            <div key={String(o.id || i)} className="flex items-center gap-2 text-sm p-2 rounded-lg bg-red-50 dark:bg-red-900/10 cursor-pointer hover:bg-red-100 dark:hover:bg-red-900/20" onClick={() => onOrderClick?.(String(o.id))}>
              <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0" />
              <span className="font-medium">{String(o.reference || "—")}</span>
              <span className="text-muted-foreground">- {age} يوم</span>
              <span className="text-red-500 text-xs font-medium">{String(o.status)}</span>
            </div>
          );
        })}
      </div>
    </StubCard>
  );
});

// Simple chart-like stubs
function MiniBarChart({ data, label }: { data: Record<string, number>; label: string }) {
  const max = Math.max(...Object.values(data), 1);
  return (
    <StubCard title={label}>
      <div className="space-y-2">
        {Object.entries(data).slice(0, 6).map(([k, v]) => (
          <div key={k} className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground w-20 truncate">{k}</span>
            <div className="flex-1 h-4 bg-muted/30 rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${(v / max) * 100}%` }} />
            </div>
            <span className="text-xs font-bold w-10 text-left">{v}</span>
          </div>
        ))}
      </div>
    </StubCard>
  );
}

export const AdminDailySummary = memo(function AdminDailySummary({ orders }: { orders: Record<string, unknown>[] }) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const todayOrders = (orders || []).filter(o => new Date(String(o.createdAt || "")) >= today);
  const revenue = todayOrders.reduce((s: number, o: Record<string, unknown>) => s + Number(o.total || 0), 0);
  return (
    <StubCard title="ملخص اليوم">
      <div className="grid grid-cols-2 gap-3">
        <div className="text-center p-3 rounded-lg bg-primary/5">
          <Package className="h-5 w-5 mx-auto mb-1 text-primary" />
          <div className="text-xl font-bold">{todayOrders.length}</div>
          <div className="text-xs text-muted-foreground">طلبات اليوم</div>
        </div>
        <div className="text-center p-3 rounded-lg bg-primary/5">
          <BarChart3 className="h-5 w-5 mx-auto mb-1 text-primary" />
          <div className="text-xl font-bold">{revenue.toLocaleString()}</div>
          <div className="text-xs text-muted-foreground">إيرادات (د.ج)</div>
        </div>
      </div>
    </StubCard>
  );
});

export const AdminStatusFlowViz = memo(function AdminStatusFlowViz({ orders }: { orders: Record<string, unknown>[] }) {
  const counts: Record<string, number> = {};
  for (const o of orders || []) counts[String(o.status || "pending")] = (counts[String(o.status || "pending")] || 0) + 1;
  const flow = ["pending", "printing", "ready", "delivered"];
  return (
    <StubCard title="تدفق الحالات">
      <div className="flex items-center justify-center gap-2 flex-wrap">
        {flow.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className="px-3 py-2 rounded-lg border border-border bg-muted/30 text-center">
              <div className="text-xs text-muted-foreground">{s}</div>
              <div className="text-lg font-bold">{counts[s] || 0}</div>
            </div>
            {i < flow.length - 1 && <span className="text-muted-foreground">→</span>}
          </div>
        ))}
      </div>
    </StubCard>
  );
});

export const AdminRevenueChart = memo(function AdminRevenueChart({ orders }: { orders: Record<string, unknown>[] }) {
  const byDate: Record<string, number> = {};
  for (const o of orders || []) {
    const d = String(o.createdAt || "").slice(0, 10);
    byDate[d] = (byDate[d] || 0) + Number(o.total || 0);
  }
  return <MiniBarChart data={byDate} label="رسم الإيرادات" />;
});

export const OrderRevenueTrend = memo(function OrderRevenueTrend({ orders }: { orders: Record<string, unknown>[]; onDateClick?: (d: string) => void }) {
  const byDate: Record<string, number> = {};
  for (const o of orders || []) {
    const d = String(o.createdAt || "").slice(0, 10);
    byDate[d] = (byDate[d] || 0) + Number(o.total || 0);
  }
  return (
    <StubCard title="اتجاه الإيرادات">
      <div className="space-y-1">
        {Object.entries(byDate).slice(-7).map(([d, v]) => (
          <div key={d} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted/30 rounded p-1" onClick={() => onDateClick?.(d)}>
            <span className="text-xs text-muted-foreground w-24">{d}</span>
            <div className="flex-1 h-3 bg-muted/30 rounded-full overflow-hidden">
              <div className="h-full bg-primary/70 rounded-full" style={{ width: `${Math.min((v / Math.max(...Object.values(byDate))) * 100, 100)}%` }} />
            </div>
            <span className="text-xs font-bold">{v.toLocaleString()}</span>
          </div>
        ))}
      </div>
    </StubCard>
  );
});

export const ServiceBreakdown = memo(function ServiceBreakdown({ orders, onServiceClick }: { orders: Record<string, unknown>[]; onServiceClick?: (n: string) => void }) {
  const byService: Record<string, number> = {};
  for (const o of orders || []) {
    const s = String(o.serviceName || o.serviceType || "أخرى");
    byService[s] = (byService[s] || 0) + 1;
  }
  return <MiniBarChart data={byService} label="توزيع الخدمات" />;
});

export const PeakHours = memo(function PeakHours({ orders }: { orders: Record<string, unknown>[] }) {
  const byHour: Record<string, number> = {};
  for (const o of orders || []) {
    try {
      const h = new Date(String(o.createdAt || "")).getHours();
      const label = `${h}:00`;
      byHour[label] = (byHour[label] || 0) + 1;
    } catch {}
  }
  return <MiniBarChart data={byHour} label="ساعات الذروة" />;
});

export const StatsSummaryBar = memo(function StatsSummaryBar({ stats, loading }: { stats: any; loading?: boolean }) {
  if (loading) return <div className="flex gap-4 p-3"><div className="animate-pulse h-8 bg-muted rounded-lg flex-1" /><div className="animate-pulse h-8 bg-muted rounded-lg flex-1" /><div className="animate-pulse h-8 bg-muted rounded-lg flex-1" /></div>;
  const s = stats || {};
  return (
    <div className="flex flex-wrap gap-3 p-3 rounded-xl bg-muted/30">
      <div className="flex items-center gap-1.5 text-sm"><Package className="h-4 w-4 text-primary" /><span className="text-muted-foreground">الطلبات:</span><span className="font-bold">{s.totalOrders || 0}</span></div>
      <div className="flex items-center gap-1.5 text-sm"><BarChart3 className="h-4 w-4 text-primary" /><span className="text-muted-foreground">الإيرادات:</span><span className="font-bold">{(s.totalRevenue || 0).toLocaleString()}</span></div>
      <div className="flex items-center gap-1.5 text-sm"><Clock className="h-4 w-4 text-primary" /><span className="text-muted-foreground">اليوم:</span><span className="font-bold">{s.todayOrders || 0}</span></div>
      <div className="flex items-center gap-1.5 text-sm"><Users className="h-4 w-4 text-primary" /><span className="text-muted-foreground">المتاجر:</span><span className="font-bold">{s.shopCount || 0}</span></div>
    </div>
  );
});

export const CustomerHistory = memo(function CustomerHistory({ orders }: { orders: Record<string, unknown>[] }) {
  return (
    <StubCard title="سجل الزبائن">
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {(orders || []).slice(0, 10).map((o: Record<string, unknown>, i: number) => (
          <div key={String(o.id || i)} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/30 text-sm">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium truncate">{String(o.customer?.name || "—")}</span>
            <span className="text-muted-foreground text-xs">{String(o.customer?.phone || "")}</span>
            <span className="ml-auto text-xs">{String(o.createdAt || "").slice(0, 10)}</span>
          </div>
        ))}
      </div>
    </StubCard>
  );
});

export const CustomerDetailPanel = memo(function CustomerDetailPanel({ customer, onClose }: { customer: any; onClose?: () => void }) {
  if (!customer) return null;
  return (
    <StubCard title="تفاصيل الزبون">
      <div className="space-y-2 text-sm">
        <div><span className="text-muted-foreground">الاسم:</span> <span className="font-medium">{customer.name || "—"}</span></div>
        <div><span className="text-muted-foreground">الهاتف:</span> <span className="font-medium">{customer.phone || "—"}</span></div>
      </div>
    </StubCard>
  );
});

export const CustomerSpendingChart = memo(function CustomerSpendingChart({ orders, onCustomerClick }: { orders: Record<string, unknown>[]; onCustomerClick?: (p: string, n: string) => void }) {
  const byCustomer = new Map<string, { name: string; total: number; count: number }>();
  for (const o of orders || []) {
    const phone = String(o.customer?.phone || "");
    const name = String(o.customer?.name || "—");
    if (!phone) continue;
    const existing = byCustomer.get(phone) || { name, total: 0, count: 0 };
    existing.total += Number(o.total || 0);
    existing.count += 1;
    byCustomer.set(phone, existing);
  }
  const sorted = Array.from(byCustomer.entries()).sort((a, b) => b[1].total - a[1].total).slice(0, 8);
  const data: Record<string, number> = {};
  for (const [, v] of sorted) data[v.name] = v.total;
  return <MiniBarChart data={data} label="إنفاق الزبائن" />;
});

export const StatusDonut = memo(function StatusDonut({ orders, onStatusClick }: { orders: Record<string, unknown>[]; onStatusClick?: (s: string) => void }) {
  const counts: Record<string, number> = {};
  const colors: Record<string, string> = { pending: "#9ca3af", printing: "#f59e0b", ready: "#3b82f6", delivered: "#22c55e" };
  for (const o of orders || []) counts[String(o.status || "pending")] = (counts[String(o.status || "pending")] || 0) + 1;
  const total = orders?.length || 1;
  let cumulative = 0;
  return (
    <StubCard title="دائري الحالات">
      <div className="flex items-center gap-4">
        <div className="relative w-28 h-28 flex-shrink-0">
          <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
            {Object.entries(counts).map(([status, count]) => {
              const pct = (count / total) * 100;
              const offset = cumulative;
              cumulative += pct;
              return <path key={status} d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke={colors[status] || "#9ca3af"} strokeWidth="3" strokeDasharray={`${pct} ${100 - pct}`} strokeDashoffset={`${-offset}`} className="cursor-pointer" onClick={() => onStatusClick?.(status)} />;
            })}
          </svg>
        </div>
        <div className="space-y-1 text-sm">
          {Object.entries(counts).map(([status, count]) => (
            <div key={status} className="flex items-center gap-2 cursor-pointer" onClick={() => onStatusClick?.(status)}>
              <div className="w-3 h-3 rounded-full" style={{ background: colors[status] || "#9ca3af" }} />
              <span className="text-muted-foreground">{status}:</span>
              <span className="font-bold">{count}</span>
            </div>
          ))}
        </div>
      </div>
    </StubCard>
  );
});

export const RetentionIndicator = memo(function RetentionIndicator({ orders }: { orders: Record<string, unknown>[] }) {
  const customers = new Map<string, number>();
  for (const o of orders || []) {
    const p = String(o.customer?.phone || "");
    if (p) customers.set(p, (customers.get(p) || 0) + 1);
  }
  const repeat = Array.from(customers.values()).filter(c => c > 1).length;
  const total = customers.size || 1;
  const rate = Math.round((repeat / total) * 100);
  return (
    <StubCard title="معدل الاحتفاظ">
      <div className="text-center p-3">
        <div className="text-3xl font-bold text-primary">{rate}%</div>
        <div className="text-xs text-muted-foreground">{repeat} من {total} زبون متكرر</div>
      </div>
    </StubCard>
  );
});

export const OrderValueDistribution = memo(function OrderValueDistribution({ orders }: { orders: Record<string, unknown>[] }) {
  const ranges: Record<string, number> = { "<500": 0, "500-1000": 0, "1000-3000": 0, ">3000": 0 };
  for (const o of orders || []) {
    const t = Number(o.total || 0);
    if (t < 500) ranges["<500"]++;
    else if (t < 1000) ranges["500-1000"]++;
    else if (t < 3000) ranges["1000-3000"]++;
    else ranges[">3000"]++;
  }
  return <MiniBarChart data={ranges} label="توزيع قيمة الطلبات (د.ج)" />;
});

export const ShopRevenueCompare = memo(function ShopRevenueCompare({ orders, onShopClick }: { orders: Record<string, unknown>[]; onShopClick?: (n: string) => void }) {
  const byShop: Record<string, number> = {};
  for (const o of orders || []) {
    const name = String(o.shopName || "—");
    byShop[name] = (byShop[name] || 0) + Number(o.total || 0);
  }
  return <MiniBarChart data={byShop} label="مقارنة إيرادات المتاجر" />;
});

// Analytics tab stubs
export const AdminCompletionFunnel = memo(function AdminCompletionFunnel({ orders, onStepClick }: { orders: Record<string, unknown>[]; onStepClick?: (s: string) => void }) {
  const steps = ["pending", "printing", "ready", "delivered"];
  const counts: Record<string, number> = {};
  for (const o of orders || []) counts[String(o.status || "pending")] = (counts[String(o.status || "pending")] || 0) + 1;
  const max = Math.max(...steps.map(s => counts[s] || 0), 1);
  return (
    <StubCard title="قمع الإنجاز">
      <div className="space-y-2">
        {steps.map((step, i) => (
          <div key={step} className="cursor-pointer" onClick={() => onStepClick?.(step)}>
            <div className="flex items-center justify-between text-sm mb-1"><span>{step}</span><span className="font-bold">{counts[step] || 0}</span></div>
            <div className="h-5 bg-muted/30 rounded-full overflow-hidden" style={{ width: `${100 - i * 15}%`, margin: "0 auto" }}>
              <div className="h-full bg-primary/70 rounded-full" style={{ width: `${((counts[step] || 0) / max) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
    </StubCard>
  );
});

export const AdminServicePopularity = memo(function AdminServicePopularity({ orders, onServiceClick }: { orders: Record<string, unknown>[]; onServiceClick?: (n: string) => void }) {
  const byService: Record<string, number> = {};
  for (const o of orders || []) {
    const s = String(o.serviceName || o.serviceType || "أخرى");
    byService[s] = (byService[s] || 0) + 1;
  }
  return <MiniBarChart data={byService} label="شعبية الخدمات" />;
});

export const AdminOrderAgeAnalysis = memo(function AdminOrderAgeAnalysis({ orders, onStatusClick }: { orders: Record<string, unknown>[]; onStatusClick?: (s: string) => void }) {
  const now = Date.now();
  const buckets: Record<string, number> = { "أقل من يوم": 0, "1-3 أيام": 0, "3-7 أيام": 0, "أكثر من أسبوع": 0 };
  for (const o of orders || []) {
    const age = (now - new Date(String(o.createdAt || "")).getTime()) / (24 * 60 * 60 * 1000);
    if (age < 1) buckets["أقل من يوم"]++;
    else if (age < 3) buckets["1-3 أيام"]++;
    else if (age < 7) buckets["3-7 أيام"]++;
    else buckets["أكثر من أسبوع"]++;
  }
  return <MiniBarChart data={buckets} label="عمر الطلبات" />;
});

export const AdminTopCustomersLeaderboard = memo(function AdminTopCustomersLeaderboard({ orders, onCustomerClick }: { orders: Record<string, unknown>[]; onCustomerClick?: (p: string, n: string) => void }) {
  const byCustomer = new Map<string, { name: string; total: number }>();
  for (const o of orders || []) {
    const p = String(o.customer?.phone || "");
    if (!p) continue;
    const existing = byCustomer.get(p) || { name: String(o.customer?.name || "—"), total: 0 };
    existing.total += Number(o.total || 0);
    byCustomer.set(p, existing);
  }
  const sorted = Array.from(byCustomer.entries()).sort((a, b) => b[1].total - a[1].total).slice(0, 5);
  return (
    <StubCard title="أفضل الزبائن">
      <div className="space-y-2">
        {sorted.map(([phone, data], i) => (
          <div key={phone} className="flex items-center gap-3 p-2 rounded-lg bg-muted/30 cursor-pointer hover:bg-muted/50" onClick={() => onCustomerClick?.(phone, data.name)}>
            <div className={cn("w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
              i === 0 ? "bg-amber-100 text-amber-700" : i === 1 ? "bg-gray-100 text-gray-600" : i === 2 ? "bg-orange-100 text-orange-700" : "bg-muted text-muted-foreground"
            )}>{i + 1}</div>
            <div className="flex-1 min-w-0"><div className="text-sm font-medium truncate">{data.name}</div></div>
            <div className="text-sm font-bold">{data.total.toLocaleString()} د.ج</div>
          </div>
        ))}
      </div>
    </StubCard>
  );
});

export const AdminOrderSizeBreakdown = memo(function AdminOrderSizeBreakdown({ orders }: { orders: Record<string, unknown>[] }) {
  const sizes: Record<string, number> = { "صغير (<500)": 0, "متوسط (500-2000)": 0, "كبير (>2000)": 0 };
  for (const o of orders || []) {
    const t = Number(o.total || 0);
    if (t < 500) sizes["صغير (<500)"]++;
    else if (t < 2000) sizes["متوسط (500-2000)"]++;
    else sizes["كبير (>2000)"]++;
  }
  return <MiniBarChart data={sizes} label="حجم الطلبات (د.ج)" />;
});

export const AdminShopActivityGrid = memo(function AdminShopActivityGrid({ orders, onShopClick }: { orders: Record<string, unknown>[]; onShopClick?: (n: string) => void }) {
  const byShop: Record<string, number> = {};
  for (const o of orders || []) byShop[String(o.shopName || "—")] = (byShop[String(o.shopName || "—")] || 0) + 1;
  return <MiniBarChart data={byShop} label="نشاط المتاجر" />;
});

export const AdminShopHealthScores = memo(function AdminShopHealthScores({ orders, onShopClick }: { orders: Record<string, unknown>[]; onShopClick?: (n: string) => void }) {
  const byShop = new Map<string, { total: number; delivered: number }>();
  for (const o of orders || []) {
    const name = String(o.shopName || "—");
    const existing = byShop.get(name) || { total: 0, delivered: 0 };
    existing.total++;
    if (String(o.status) === "delivered") existing.delivered++;
    byShop.set(name, existing);
  }
  return (
    <StubCard title="صحة المتاجر">
      <div className="space-y-2">
        {Array.from(byShop.entries()).map(([name, data]) => {
          const score = data.total > 0 ? Math.round((data.delivered / data.total) * 100) : 0;
          return (
            <div key={name} className="cursor-pointer" onClick={() => onShopClick?.(name)}>
              <div className="flex items-center justify-between text-sm mb-1"><span>{name}</span><span className={cn("font-bold", score > 70 ? "text-green-600" : score > 40 ? "text-amber-600" : "text-red-600")}>{score}%</span></div>
              <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
                <div className={cn("h-full rounded-full", score > 70 ? "bg-green-500" : score > 40 ? "bg-amber-500" : "bg-red-500")} style={{ width: `${score}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </StubCard>
  );
});

export const AdminRecentQuickTable = memo(function AdminRecentQuickTable({ orders, onOrderClick }: { orders: Record<string, unknown>[]; onOrderClick?: (o: any) => void }) {
  return (
    <StubCard title="آخر الطلبات (جدول)">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="text-muted-foreground border-b border-border"><th className="text-right py-2 px-2">المرجع</th><th className="text-right py-2 px-2">الخدمة</th><th className="text-right py-2 px-2">المبلغ</th><th className="text-right py-2 px-2">الحالة</th></tr></thead>
          <tbody>
            {(orders || []).slice(0, 10).map((o: Record<string, unknown>, i: number) => (
              <tr key={String(o.id || i)} className="border-b border-border/50 hover:bg-muted/30 cursor-pointer" onClick={() => onOrderClick?.(o)}>
                <td className="py-2 px-2">{String(o.reference || "—")}</td>
                <td className="py-2 px-2 truncate max-w-32">{String(o.serviceName || "—")}</td>
                <td className="py-2 px-2 font-medium">{Number(o.total || 0).toLocaleString()}</td>
                <td className="py-2 px-2"><span className={cn("text-xs px-2 py-0.5 rounded-full",
                  String(o.status) === "delivered" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-muted text-muted-foreground"
                )}>{String(o.status || "")}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </StubCard>
  );
});

export const AdminWeeklyComparison = memo(function AdminWeeklyComparison({ orders }: { orders: Record<string, unknown>[] }) {
  const byWeek: Record<string, number> = {};
  for (const o of orders || []) {
    try {
      const d = new Date(String(o.createdAt || ""));
      const weekStart = new Date(d); weekStart.setDate(d.getDate() - d.getDay());
      const key = weekStart.toISOString().slice(0, 10);
      byWeek[key] = (byWeek[key] || 0) + Number(o.total || 0);
    } catch {}
  }
  return <MiniBarChart data={byWeek} label="مقارنة أسبوعية" />;
});

export const AdminOrderVelocity = memo(function AdminOrderVelocity({ orders }: { orders: Record<string, unknown>[] }) {
  const byDate: Record<string, number> = {};
  for (const o of orders || []) {
    const d = String(o.createdAt || "").slice(0, 10);
    byDate[d] = (byDate[d] || 0) + 1;
  }
  return <MiniBarChart data={byDate} label="سرعة الطلبات" />;
});

export const QuickStatsBar = memo(function QuickStatsBar({ stats }: { stats: any }) {
  const s = stats || {};
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <div className="rounded-lg border border-border bg-card p-3 text-center">
        <div className="text-xl font-bold">{s.totalOrders || 0}</div><div className="text-xs text-muted-foreground">إجمالي الطلبات</div>
      </div>
      <div className="rounded-lg border border-border bg-card p-3 text-center">
        <div className="text-xl font-bold">{(s.totalRevenue || 0).toLocaleString()}</div><div className="text-xs text-muted-foreground">الإيرادات</div>
      </div>
      <div className="rounded-lg border border-border bg-card p-3 text-center">
        <div className="text-xl font-bold">{s.todayOrders || 0}</div><div className="text-xs text-muted-foreground">اليوم</div>
      </div>
      <div className="rounded-lg border border-border bg-card p-3 text-center">
        <div className="text-xl font-bold">{s.shopCount || 0}</div><div className="text-xs text-muted-foreground">المتاجر</div>
      </div>
    </div>
  );
});

export const PdfExportBtn = memo(function PdfExportBtn({ stats }: { stats: any }) {
  return (
    <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-card text-sm hover:bg-muted/50 transition-colors" onClick={() => {}}>
      <FileText className="h-4 w-4" /><span>تصدير PDF</span>
    </button>
  );
});

export const EmptyOrdersMessage = memo(function EmptyOrdersMessage({ hasOrders, onClear }: { hasOrders?: boolean; onClear?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Package className="h-12 w-12 text-muted-foreground/50 mb-4" />
      <div className="text-lg font-medium text-muted-foreground">لا توجد طلبات</div>
      {!hasOrders && <div className="text-sm text-muted-foreground mt-1">لم يتم إنشاء أي طلبات بعد</div>}
      {hasOrders && onClear && <button onClick={onClear} className="mt-3 text-sm text-primary hover:underline">مسح الفلاتر</button>}
    </div>
  );
});

export const AdvancedSearchPanel = memo(function AdvancedSearchPanel({ onSearch, onClose }: { onSearch?: (q: string) => void; onClose?: () => void }) {
  return null;
});

export const BulkStatusChange = memo(function BulkStatusChange({ selectedIds, orders, onClear, onRefresh }: { selectedIds: Set<string>; orders: any[]; onClear: () => void; onRefresh: () => void }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/5 border border-primary/20">
      <span className="text-sm font-medium">{selectedIds.size} طلب محدد</span>
      <button onClick={onClear} className="text-sm text-muted-foreground hover:text-foreground">إلغاء التحديد</button>
    </div>
  );
});

export const AdminBulkActions = memo(function AdminBulkActions({ selectedIds, orders, onClear, onRefresh }: { selectedIds: Set<string>; orders: any[]; onClear: () => void; onRefresh: () => void }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/5 border border-primary/20">
      <span className="text-sm font-medium">{selectedIds.size} طلب محدد</span>
      <button onClick={onClear} className="text-sm text-muted-foreground hover:text-foreground">إلغاء التحديد</button>
      <button onClick={onRefresh} className="text-sm text-primary hover:underline ml-auto"><RefreshCw className="h-3.5 w-3.5 inline" /> تحديث</button>
    </div>
  );
});

export const DateQuickFilter = memo(function DateQuickFilter({ onRange, activeFrom, activeTo }: { onRange?: (from: string | null, to: string | null) => void; activeFrom: string | null; activeTo: string | null }) {
  return null;
});

export const ShopMiniCards = memo(function ShopMiniCards({ orders }: { orders: Record<string, unknown>[] }) {
  const byShop: Record<string, { count: number; revenue: number }> = {};
  for (const o of orders || []) {
    const name = String(o.shopName || "—");
    if (!byShop[name]) byShop[name] = { count: 0, revenue: 0 };
    byShop[name].count++;
    byShop[name].revenue += Number(o.total || 0);
  }
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {Object.entries(byShop).map(([name, data]) => (
        <div key={name} className="rounded-lg border border-border bg-card p-3">
          <div className="text-sm font-medium truncate">{name}</div>
          <div className="text-xs text-muted-foreground">{data.count} طلب · {data.revenue.toLocaleString()} د.ج</div>
        </div>
      ))}
    </div>
  );
});

export const ShopKpiCards = memo(function ShopKpiCards({ orders, onShopClick }: { orders: Record<string, unknown>[]; onShopClick?: (slug: string) => void }) {
  const byShop = new Map<string, { name: string; slug: string; count: number; revenue: number; delivered: number }>();
  for (const o of orders || []) {
    const name = String(o.shopName || "—");
    const slug = String(o.shopSlug || "");
    const existing = byShop.get(name) || { name, slug, count: 0, revenue: 0, delivered: 0 };
    existing.count++;
    existing.revenue += Number(o.total || 0);
    if (String(o.status) === "delivered") existing.delivered++;
    byShop.set(name, existing);
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from(byShop.values()).map(shop => {
        const deliveryRate = shop.count > 0 ? Math.round((shop.delivered / shop.count) * 100) : 0;
        return (
          <div key={shop.name} className="rounded-xl border border-border bg-card p-4 cursor-pointer hover:border-primary/50 transition-colors" onClick={() => onShopClick?.(shop.slug)}>
            <div className="font-medium mb-2">{shop.name}</div>
            <div className="grid grid-cols-3 gap-2 text-center text-sm">
              <div><div className="font-bold">{shop.count}</div><div className="text-xs text-muted-foreground">طلبات</div></div>
              <div><div className="font-bold">{shop.revenue.toLocaleString()}</div><div className="text-xs text-muted-foreground">إيرادات</div></div>
              <div><div className={cn("font-bold", deliveryRate > 70 ? "text-green-600" : "text-amber-600")}>{deliveryRate}%</div><div className="text-xs text-muted-foreground">إنجاز</div></div>
            </div>
          </div>
        );
      })}
    </div>
  );
});

export const QuickNotesInline = memo(function QuickNotesInline({ value, onChange }: { value?: string; onChange?: (v: string) => void }) {
  return null;
});

// === Tab components ===

export function AnalyticsTab({ orders }: { orders: any[] }) {
  const counts: Record<string, number> = {};
  for (const o of orders || []) counts[String(o.status || "pending")] = (counts[String(o.status || "pending")] || 0) + 1;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-border bg-card p-4"><div className="text-xs text-muted-foreground mb-1">إجمالي الطلبات</div><div className="text-2xl font-bold">{orders?.length || 0}</div></div>
        <div className="rounded-xl border border-border bg-card p-4"><div className="text-xs text-muted-foreground mb-1">الإيرادات</div><div className="text-2xl font-bold">{(orders?.reduce((s: number, o: any) => s + (o.total || 0), 0) || 0).toLocaleString()}</div></div>
        <div className="rounded-xl border border-border bg-card p-4"><div className="text-xs text-muted-foreground mb-1">مكتمل</div><div className="text-2xl font-bold text-green-600">{counts["delivered"] || 0}</div></div>
        <div className="rounded-xl border border-border bg-card p-4"><div className="text-xs text-muted-foreground mb-1">قيد التنفيذ</div><div className="text-2xl font-bold text-amber-600">{(counts["printing"] || 0) + (counts["ready"] || 0)}</div></div>
      </div>
      <StatusPipeline orders={orders || []} />
      <AdminCompletionFunnel orders={orders || []} />
      <AdminTopCustomersLeaderboard orders={orders || []} />
    </div>
  );
}

export function KanbanTab({ orders, onStatusChange, onOrderClick, shopFilter }: { orders: any[]; onStatusChange?: (id: string, status: string) => void; onOrderClick?: (o: any) => void; shopFilter?: string }) {
  const filtered = shopFilter && shopFilter !== "all" ? (orders || []).filter((o: any) => o.shopSlug === shopFilter || o.shopId === shopFilter) : (orders || []);
  const columns = ["pending", "printing", "ready", "delivered"];
  const labels: Record<string, string> = { pending: "قيد الانتظار", printing: "قيد الطباعة", ready: "جاهز", delivered: "تم التسليم" };
  const colColors: Record<string, string> = { pending: "border-t-gray-400", printing: "border-t-amber-500", ready: "border-t-blue-500", delivered: "border-t-green-500" };
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {columns.map(col => {
        const colOrders = filtered.filter((o: any) => o.status === col);
        return (
          <div key={col} className={cn("rounded-xl border border-border border-t-4 bg-card p-3", colColors[col])}>
            <div className="flex items-center justify-between mb-3">
              <div className="font-medium text-sm">{labels[col]}</div>
              <div className="text-xs bg-muted rounded-full px-2 py-0.5 font-bold">{colOrders.length}</div>
            </div>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {colOrders.map((o: any) => (
                <div key={o.id} className="p-2.5 rounded-lg border border-border/50 bg-background hover:bg-muted/30 cursor-pointer transition-colors" onClick={() => onOrderClick?.(o)}>
                  <div className="text-sm font-medium truncate">{o.serviceName || o.reference || "—"}</div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-muted-foreground truncate">{o.customer?.name || "—"}</span>
                    <span className="text-xs font-bold">{Number(o.total || 0).toLocaleString()} د.ج</span>
                  </div>
                </div>
              ))}
              {colOrders.length === 0 && <div className="text-center text-xs text-muted-foreground py-4">لا توجد طلبات</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function CalendarTab({ orders, onOrderClick, shopFilter }: { orders: any[]; onOrderClick?: (o: any) => void; shopFilter?: string }) {
  const filtered = shopFilter && shopFilter !== "all" ? (orders || []).filter((o: any) => o.shopSlug === shopFilter || o.shopId === shopFilter) : (orders || []);
  const byDate = new Map<string, any[]>();
  for (const o of filtered) {
    const d = String(o.createdAt || "").slice(0, 10);
    if (!d) continue;
    const arr = byDate.get(d) || [];
    arr.push(o);
    byDate.set(d, arr);
  }
  const sorted = Array.from(byDate.entries()).sort((a, b) => b[0].localeCompare(a[0])).slice(0, 14);
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {sorted.map(([date, dayOrders]) => (
          <div key={date} className="rounded-xl border border-border bg-card p-4">
            <div className="font-medium text-sm mb-2">{date}</div>
            <div className="space-y-1.5">
              {dayOrders.slice(0, 4).map((o: any) => (
                <div key={o.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/30 cursor-pointer text-sm" onClick={() => onOrderClick?.(o)}>
                  <span className="truncate">{o.serviceName || o.reference}</span>
                  <span className="text-xs font-bold">{Number(o.total || 0).toLocaleString()}</span>
                </div>
              ))}
              {dayOrders.length > 4 && <div className="text-xs text-muted-foreground text-center">+{dayOrders.length - 4} آخرين</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CustomersTab({ orders, shopFilter, onOrderClick, onSelectCustomer }: { orders: any[]; shopFilter?: string; onOrderClick?: (o: any) => void; onSelectCustomer?: (c: any) => void }) {
  const customers = new Map<string, { name: string; phone: string; total: number; count: number; lastOrder: string }>();
  const filtered = shopFilter && shopFilter !== "all" ? orders.filter((o: any) => o.shopSlug === shopFilter || o.shopId === shopFilter) : orders;
  for (const o of filtered) {
    const phone = String(o.customer?.phone || "");
    const name = String(o.customer?.name || "—");
    if (!phone) continue;
    const existing = customers.get(phone) || { name, phone, total: 0, count: 0, lastOrder: "" };
    existing.total += Number(o.total || 0);
    existing.count += 1;
    if (String(o.createdAt || "") > existing.lastOrder) existing.lastOrder = String(o.createdAt || "");
    customers.set(phone, existing);
  }
  const sorted = Array.from(customers.values()).sort((a, b) => b.total - a.total);
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead><tr className="text-muted-foreground border-b border-border"><th className="text-right py-3 px-3">الاسم</th><th className="text-right py-3 px-3">الهاتف</th><th className="text-right py-3 px-3">الطلبات</th><th className="text-right py-3 px-3">الإنفاق</th><th className="text-right py-3 px-3">آخر طلب</th></tr></thead>
        <tbody>
          {sorted.map(c => (
            <tr key={c.phone} className="border-b border-border/50 hover:bg-muted/30 cursor-pointer" onClick={() => onSelectCustomer?.({ phone: c.phone, name: c.name })}>
              <td className="py-2.5 px-3 font-medium">{c.name}</td>
              <td className="py-2.5 px-3 text-muted-foreground dir-ltr">{c.phone}</td>
              <td className="py-2.5 px-3">{c.count}</td>
              <td className="py-2.5 px-3 font-bold">{c.total.toLocaleString()} د.ج</td>
              <td className="py-2.5 px-3 text-muted-foreground">{c.lastOrder.slice(0, 10)}</td>
            </tr>
          ))}
          {sorted.length === 0 && <tr><td colSpan={5} className="text-center py-12 text-muted-foreground">لا يوجد زبائن بعد</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

export function ReportsTab() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <FileText className="h-16 w-16 text-muted-foreground/30 mb-4" />
      <div className="text-lg font-medium text-muted-foreground">التقارير</div>
      <div className="text-sm text-muted-foreground mt-1">ستتوفر تقارير مفصلة قريباً</div>
    </div>
  );
}

export function OrderDetailDialog({ order, onClose, onStatusChange, onDelete }: { order: any; onClose?: () => void; onStatusChange?: (id: string, status: string) => void; onDelete?: (id: string) => void }) {
  if (!order) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-lg mx-4 max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold">تفاصيل الطلب</h3>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
          </div>
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <div><span className="text-muted-foreground">المرجع:</span> <span className="font-medium">{order.reference || "—"}</span></div>
              <div><span className="text-muted-foreground">الحالة:</span> <span className="font-medium">{order.status || "—"}</span></div>
              <div><span className="text-muted-foreground">الخدمة:</span> <span className="font-medium">{order.serviceName || "—"}</span></div>
              <div><span className="text-muted-foreground">المبلغ:</span> <span className="font-bold">{Number(order.total || 0).toLocaleString()} د.ج</span></div>
              <div><span className="text-muted-foreground">الزبون:</span> <span className="font-medium">{order.customer?.name || "—"}</span></div>
              <div><span className="text-muted-foreground">الهاتف:</span> <span className="font-medium dir-ltr">{order.customer?.phone || "—"}</span></div>
              <div><span className="text-muted-foreground">المتجر:</span> <span className="font-medium">{order.shopName || "—"}</span></div>
              <div><span className="text-muted-foreground">التاريخ:</span> <span className="font-medium">{String(order.createdAt || "").slice(0, 16)}</span></div>
            </div>
            {order.notes && <div className="p-3 rounded-lg bg-muted/30"><span className="text-muted-foreground">ملاحظات:</span> <span>{String(order.notes)}</span></div>}
          </div>
          <div className="flex gap-2 pt-2">
            <button onClick={onClose} className="flex-1 px-4 py-2 rounded-lg border border-border hover:bg-muted/50 text-sm">إغلاق</button>
            {onDelete && <button onClick={() => { onDelete(order.id); onClose?.(); }} className="px-4 py-2 rounded-lg bg-red-500/10 text-red-600 hover:bg-red-500/20 text-sm">حذف</button>}
          </div>
        </div>
      </div>
    </div>
  );
}
