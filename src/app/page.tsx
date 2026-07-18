"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  Plus, Store, RefreshCw, Shield, Package, Clock,
  Search, ExternalLink, Trash2, ArrowUpDown, ArrowUp, ArrowDown,
  RotateCcw, LayoutGrid, Settings, Lock, Menu, Download, AlertCircle,
  LogOut,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  STATUS_META, STATUS_FLOW, formatDA, formatDateTimeAr,
} from "@/lib/print-config";
import { cn } from "@/lib/utils";
import { DashboardSidebar } from "@/components/ui/dashboard-sidebar";
import type { GlobalStats, GlobalOrder } from "@/lib/admin-types";
import {
  isAuthenticated, adminFetch, robustCopy, openInNewTab,
  SERVICE_EMOJI, STATUS_COLORS, STATUS_BORDER_COLORS, STATUS_DOT_COLORS,
  TAB_TITLES,
} from "@/lib/admin-utils";
import { LoginGate } from "@/components/app/admin-login-gate";
import dynamic from "next/dynamic";

const ShopManageCard = dynamic(
  () => import("@/components/app/admin-shop-card").then((m) => ({ default: m.ShopManageCard })),
  { ssr: false },
);

const OverviewTab = dynamic(
  () => import("@/components/app/admin-overview-tab").then((m) => ({ default: m.OverviewTab })),
  { ssr: false, loading: () => <div className="p-6"><div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{[...Array(4)].map((_, i) => (<div key={i} className="animate-pulse bg-slate-200 rounded-xl p-5"><div className="flex items-start justify-between"><div className="space-y-2.5 flex-1"><div className="h-8 bg-slate-300/60 rounded-lg w-24" /><div className="h-3 bg-slate-300/40 rounded w-28" /></div><div className="w-11 h-11 rounded-xl bg-slate-300/50" /></div></div>))}</div></div> },
);

const SettingsTab = dynamic(
  () => import("@/components/app/admin-settings-tab").then((m) => ({ default: m.SettingsTab })),
  { ssr: false, loading: () => <div className="p-8 text-center text-slate-400 text-sm">جارٍ التحميل...</div> },
);

const SecurityTab = dynamic(
  () => import("@/components/app/admin-security-tab").then((m) => ({ default: m.SecurityTab })),
  { ssr: false, loading: () => <div className="p-8 text-center text-slate-400 text-sm">جارٍ التحميل...</div> },
);

const CreateShopDialog = dynamic(
  () => import("@/components/app/admin-create-shop").then((m) => ({ default: m.CreateShopDialog })),
  { ssr: false, loading: () => null },
);

function handleAdminLogout() {
  localStorage.removeItem("sa_auth");
  window.location.reload();
}

export default function SuperAdminPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [globalStats, setGlobalStats] = useState<GlobalStats | null>(null);
  const [allOrders, setAllOrders] = useState<GlobalOrder[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [createOpen, setCreateOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [shopFilter, setShopFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("overview");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [shopSearch, setShopSearch] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<GlobalOrder | null>(null);
  const [sortField, setSortField] = useState<string>("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [loadError, setLoadError] = useState<string | null>(null);
  const ordersLoadedRef = useRef(false);

  // تحميل الإحصائيات فقط (خفيف)
  const loadStats = useCallback(async () => {
    setLoadingStats(true);
    setLoadError(null);
    try {
      const statsRes = await adminFetch("/api/admin/global-stats");
      if (!statsRes.ok) {
        setLoadError(`إحصائيات: ${statsRes.status}`);
        return;
      }
      const stats = await statsRes.json();
      setGlobalStats(stats);
      setLastUpdated("الآن");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "خطأ غير معروف";
      setLoadError(msg);
    } finally {
      setLoadingStats(false);
    }
  }, []);

  // تحميل الطلبات (يتم فقط عند فتح تبويب الطلبات)
  const loadOrders = useCallback(async () => {
    setLoadingOrders(true);
    try {
      const ordersRes = await adminFetch("/api/orders?limit=200");
      if (!ordersRes.ok) return;
      const data = await ordersRes.json();
      setAllOrders(data.orders || []);
    } catch {
      // صامت
    } finally {
      setLoadingOrders(false);
    }
  }, []);

  // تحميل الإحصائيات عند المصادقة
  useEffect(() => { setMounted(true); if (isAuthenticated()) setAuthenticated(true); }, []);
  useEffect(() => { if (authenticated) loadStats(); }, [authenticated, loadStats]);

  // تحميل الطلبات فقط عند التبديل إلى تبويب الطلبات
  useEffect(() => {
    if (authenticated && activeTab === "orders" && !ordersLoadedRef.current) {
      ordersLoadedRef.current = true;
      loadOrders();
    }
  }, [authenticated, activeTab, loadOrders]);

  // إعادة تحميل كل شيء
  const loadAll = useCallback(async () => {
    ordersLoadedRef.current = false;
    await loadStats();
    if (activeTab === "orders") {
      await loadOrders();
      ordersLoadedRef.current = true;
    }
  }, [loadStats, loadOrders, activeTab]);

  const filteredOrders = useMemo(() => {
    let list = allOrders;
    if (statusFilter !== "all") list = list.filter((o) => o.status === statusFilter);
    if (shopFilter !== "all") list = list.filter((o) => o.shopSlug === shopFilter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((o) => o.reference.toLowerCase().includes(q) || o.customer.name.includes(q) || o.customer.phone.includes(q) || o.shopName.includes(q));
    }
    return [...list].sort((a, b) => {
      let cmp = 0;
      if (sortField === "date") cmp = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      else if (sortField === "total") cmp = a.total - b.total;
      else if (sortField === "reference") cmp = a.reference.localeCompare(b.reference);
      return sortDir === "desc" ? (sortField === "date" ? cmp : -cmp) : (sortField === "date" ? -cmp : cmp);
    });
  }, [allOrders, statusFilter, shopFilter, search, sortField, sortDir]);

  function handleSort(field: string) {
    if (sortField === field) setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    else { setSortField(field); setSortDir("desc"); }
  }

  function SortIcon({ field }: { field: string }) {
    if (sortField !== field) return <ArrowUpDown className="h-3 w-3 text-slate-300" />;
    return sortDir === "desc" ? <ArrowDown className="h-3 w-3 text-teal-600" /> : <ArrowUp className="h-3 w-3 text-teal-600" />;
  }

  async function exportToExcel() {
    const XLSX = await import("xlsx");
    const rows = filteredOrders.map((o) => ({
      "رقم الطلب": o.reference, "المتجر": o.shopName, "الخدمة": o.serviceName,
      "العميل": o.customer.name, "الهاتف": o.customer.phone, "المجموع": o.total,
      "الحالة": STATUS_META[o.status]?.label || o.status, "التاريخ": formatDateTimeAr(o.createdAt),
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "الطلبات");
    XLSX.writeFile(wb, `orders-${new Date().toISOString().slice(0, 10)}.xlsx`);
    toast.success("تم تصدير الملف");
  }

  async function handleStatusChange(orderId: string, shopId: string, newStatus: string) {
    try {
      const res = await fetch(`/api/orders/${orderId}?shopId=${shopId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: newStatus }) });
      if (res.ok) {
        setAllOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)));
        setSelectedOrder((prev) => prev && prev.id === orderId ? { ...prev, status: newStatus } : prev);
        toast.success("تم تحديث الحالة");
      } else { toast.error("فشل تحديث الحالة"); }
    } catch { toast.error("خطأ في الاتصال"); }
  }

  async function handleDeleteOrder(orderId: string, shopId: string) {
    try {
      const res = await fetch(`/api/orders/${orderId}?shopId=${shopId}`, { method: "DELETE" });
      if (res.ok) { setAllOrders((prev) => prev.filter((o) => o.id !== orderId)); setSelectedOrder(null); toast.success("تم حذف الطلب"); }
      else { toast.error("فشل حذف الطلب"); }
    } catch { toast.error("خطأ في الاتصال"); }
  }

  async function copyLink(slug: string) { await robustCopy(`${window.location.origin}/s/${slug}`, "تم نسخ رابط الزبائن", "شاركه مع زبائن المتجر"); }
  async function copyAdminLink(slug: string) { await robustCopy(`${window.location.origin}/s/${slug}?admin=1`, "تم نسخ رابط الإدارة", "أعطه لصاحب المتجر فقط"); }

  const stats = globalStats;
  const sidebarSections = useMemo(() => [
    { title: "الرئيسية", items: [
      { key: "overview", label: "الرئيسية", icon: LayoutGrid },
      { key: "orders", label: "الطلبات", icon: Package, badge: stats?.totalOrders },
      { key: "shops", label: "المتاجر", icon: Store },
    ]},
    { title: "النظام", items: [
      { key: "settings", label: "الإعدادات", icon: Settings },
      { key: "security", label: "الأمان والفريق", icon: Lock },
    ]},
  ], [stats?.totalOrders]);

  if (!mounted) return <div className="min-h-screen bg-slate-50" />;
  if (!authenticated) return <LoginGate onUnlock={() => setAuthenticated(true)} />;

  return (
    <div className="flex min-h-screen" dir="rtl">
      <DashboardSidebar
        sections={sidebarSections} activeKey={activeTab} onNavigate={setActiveTab}
        collapsed={sidebarCollapsed} onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        mobileOpen={mobileOpen} onMobileToggle={() => setMobileOpen(!mobileOpen)}
        logo={<div className="flex items-center gap-3"><img src="/tayf-logo-sm.png" alt="طيف" className="w-9 h-9 rounded-xl shrink-0 dark:hidden" /><img src="/tayf-logo-sm-dark.png" alt="طيف" className="w-9 h-9 rounded-xl shrink-0 hidden dark:block" />{!sidebarCollapsed && <div className="min-w-0"><div className="font-bold text-sm text-white truncate">طيف</div><div className="text-[10px] text-slate-400 truncate">لوحة التحكم</div></div>}</div>}
        footer={
          <button onClick={handleAdminLogout} className="flex items-center gap-2 w-full px-3 py-2 text-sm text-rose-500 hover:bg-rose-50 rounded-lg transition-colors">
            <LogOut className="h-4 w-4" />
            تسجيل الخروج
          </button>
        }
      />
      <div className="flex-1 bg-slate-50 overflow-auto">
        <header className="bg-background border-b border-slate-200 dark:border-slate-700 h-16 sticky top-0 z-30 px-4 sm:px-6">
          <div className="h-full flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <button type="button" onClick={() => setMobileOpen(!mobileOpen)} className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 md:hidden" aria-label={mobileOpen ? 'إغلاق القائمة' : 'فتح القائمة'}><Menu size={20} /></button>
              <div className="min-w-0"><h1 className="text-sm font-semibold text-slate-800 truncate">{TAB_TITLES[activeTab] || "لوحة التحكم"}</h1><p className="text-xs text-slate-400 truncate">لوحة التحكم / {TAB_TITLES[activeTab] || "نظرة عامة"}</p></div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button onClick={() => setCreateOpen(true)} className="bg-teal-600 hover:bg-teal-700 text-white rounded-lg px-2.5 sm:px-4 py-2 text-sm font-medium transition-colors flex items-center gap-1.5"><Plus className="h-4 w-4" /><span className="hidden sm:inline">إنشاء متجر</span></button>
              <button onClick={loadAll} className="text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg p-2 sm:p-2.5 text-sm transition-colors"><RefreshCw className={`h-4 w-4 ${loadingStats ? "animate-spin" : ""}`} /></button>
            </div>
          </div>
        </header>

        {loadError ? (
          <div className="p-4 sm:p-6 flex flex-col items-center justify-center min-h-[40vh]">
            <AlertCircle className="h-12 w-12 text-rose-300 mb-4" />
            <p className="text-sm font-medium text-slate-600 mb-1">فشل تحميل البيانات</p>
            <p className="text-xs text-slate-400 mb-4">{loadError}</p>
            <button onClick={loadAll} className="inline-flex items-center gap-2 text-sm text-teal-600 hover:text-teal-700 font-medium bg-teal-50 hover:bg-teal-100 rounded-lg px-5 py-2.5 transition-colors">
              <RefreshCw className="h-4 w-4" /> إعادة المحاولة
            </button>
          </div>
        ) : (
        <div className="p-4 sm:p-6 space-y-6">
          {activeTab === "overview" && stats && <OverviewTab stats={stats} lastUpdated={lastUpdated} onOpenCreate={() => setCreateOpen(true)} />}
          {activeTab === "overview" && loadingStats && (
            <div className="p-4 sm:p-6 space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{[...Array(4)].map((_, i) => (<div key={i} className="animate-pulse bg-slate-200 rounded-xl p-5"><div className="flex items-start justify-between"><div className="space-y-2.5 flex-1"><div className="h-8 bg-slate-300/60 rounded-lg w-24" /><div className="h-3 bg-slate-300/40 rounded w-28" /></div><div className="w-11 h-11 rounded-xl bg-slate-300/50" /></div></div>))}</div>
            </div>
          )}

          {activeTab === "orders" && (
            <div className="space-y-5">
              {loadingOrders ? (
                <div className="text-center py-16 text-slate-400 text-sm"><RefreshCw className="h-6 w-6 animate-spin mx-auto mb-3 text-teal-500" />جارٍ تحميل الطلبات...</div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div className="relative md:col-span-1"><Search className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" /><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="ابحث برقم الطلب، اسم، هاتف، أو متجر..." className="pr-10 text-sm h-10 rounded-lg border-slate-200 focus:ring-teal-500/20 focus:border-teal-500 bg-background" /></div>
                    <Select value={shopFilter} onValueChange={setShopFilter}><SelectTrigger className="text-sm h-10 rounded-lg border-slate-200 bg-background"><SelectValue placeholder="كل المتاجر" /></SelectTrigger><SelectContent><SelectItem value="all">كل المتاجر</SelectItem>{stats?.shopStats.map((s) => (<SelectItem key={s.id} value={s.slug}>{s.name}</SelectItem>))}</SelectContent></Select>
                    <Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger className="text-sm h-10 rounded-lg border-slate-200 bg-background"><SelectValue placeholder="كل الحالات" /></SelectTrigger><SelectContent><SelectItem value="all">كل الحالات</SelectItem>{STATUS_FLOW.map((s) => (<SelectItem key={s} value={s}>{STATUS_META[s].label}</SelectItem>))}<SelectItem value="cancelled">ملغي</SelectItem></SelectContent></Select>
                    <button onClick={exportToExcel} disabled={filteredOrders.length === 0} className="border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed bg-background"><Download className="h-4 w-4" />تصدير Excel</button>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-400 px-1"><span>المعروض: <b className="text-slate-600">{filteredOrders.length}</b> من {allOrders.length}</span></div>
                  {/* جدول - حاسوب */}
                  <div className="hidden md:block bg-background rounded-xl border border-slate-200/60 dark:border-slate-700/60 shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-x-auto">
                    <Table>
                      <TableHeader><TableRow className="bg-slate-50/80 hover:bg-slate-50/80 border-b border-slate-100">
                        <TableHead className="text-right text-xs font-medium text-slate-500 uppercase tracking-wide cursor-pointer select-none hover:text-slate-700" onClick={() => handleSort("reference")}><span className="inline-flex items-center gap-1">رقم الطلب <SortIcon field="reference" /></span></TableHead>
                        <TableHead className="text-right text-xs font-medium text-slate-500 uppercase tracking-wide">المتجر</TableHead>
                        <TableHead className="text-right text-xs font-medium text-slate-500 uppercase tracking-wide">الخدمة</TableHead>
                        <TableHead className="text-right text-xs font-medium text-slate-500 uppercase tracking-wide">العميل</TableHead>
                        <TableHead className="text-right text-xs font-medium text-slate-500 uppercase tracking-wide cursor-pointer select-none hover:text-slate-700" onClick={() => handleSort("total")}><span className="inline-flex items-center gap-1">المجموع <SortIcon field="total" /></span></TableHead>
                        <TableHead className="text-right text-xs font-medium text-slate-500 uppercase tracking-wide">الحالة</TableHead>
                        <TableHead className="text-right text-xs font-medium text-slate-500 uppercase tracking-wide cursor-pointer select-none hover:text-slate-700" onClick={() => handleSort("date")}><span className="inline-flex items-center gap-1">التاريخ <SortIcon field="date" /></span></TableHead>
                      </TableRow></TableHeader>
                      <TableBody>
                        {filteredOrders.slice(0, 100).map((o) => (
                          <TableRow key={o.id} className="cursor-pointer hover:bg-slate-50 transition-colors border-b border-slate-50" onClick={() => setSelectedOrder(o)}>
                            <TableCell className="font-mono text-xs font-bold text-slate-800">{o.reference}</TableCell>
                            <TableCell className="text-xs"><span className="text-xs px-2 py-0.5 rounded-lg bg-slate-100 text-slate-500">{o.shopName || "—"}</span></TableCell>
                            <TableCell className="text-sm text-slate-700">{SERVICE_EMOJI[o.serviceType] || ""} {o.serviceName}</TableCell>
                            <TableCell className="text-sm"><div className="text-slate-700">{o.customer.name}</div><div className="text-slate-400" dir="ltr">{o.customer.phone}</div></TableCell>
                            <TableCell className="text-sm font-bold text-slate-800">{formatDA(o.total)}</TableCell>
                            <TableCell><span className={`text-xs px-2.5 py-1 rounded-lg ${STATUS_COLORS[o.status] || ""}`}>{STATUS_META[o.status]?.label || o.status}</span></TableCell>
                            <TableCell className="text-sm text-slate-400">{formatDateTimeAr(o.createdAt)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    {filteredOrders.length === 0 && <EmptyOrdersMessage hasOrders={allOrders.length > 0} onClear={() => { setSearch(""); setStatusFilter("all"); setShopFilter("all"); }} />}
                  </div>
                  {/* بطاقات - جوال */}
                  <div className="md:hidden space-y-3">
                    {filteredOrders.slice(0, 50).map((o) => (
                      <div key={o.id} className={cn("cursor-pointer bg-background rounded-xl border border-slate-200/60 dark:border-slate-700/60 shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-4 hover:shadow-[0_2px_8px_rgba(0,0,0,0.08)] transition-shadow border-r-[3px]", STATUS_BORDER_COLORS[o.status] || "")} onClick={() => setSelectedOrder(o)}>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="min-w-0"><div className="flex items-center gap-2"><span className="font-mono text-xs font-bold text-slate-800">{o.reference}</span><span className="text-xs px-2 py-0.5 rounded-lg bg-slate-100 text-slate-500">{o.shopName}</span></div><div className="text-xs text-slate-400 mt-1">{SERVICE_EMOJI[o.serviceType] || ""} {o.serviceName} · {o.customer.name}</div></div>
                          <div className="text-left shrink-0"><div className="text-sm font-bold text-slate-800">{formatDA(o.total)}</div><span className={`text-xs px-2.5 py-1 rounded-lg ${STATUS_COLORS[o.status] || ""}`}>{STATUS_META[o.status]?.label || o.status}</span></div>
                        </div>
                      </div>
                    ))}
                    {filteredOrders.length === 0 && <EmptyOrdersMessage hasOrders={allOrders.length > 0} onClear={() => { setSearch(""); setStatusFilter("all"); setShopFilter("all"); }} />}
                  </div>
                </>
              )}
            </div>
          )}

          {/* نافذة تفاصيل الطلب */}
          <OrderDetailDialog order={selectedOrder} onClose={() => setSelectedOrder(null)} onStatusChange={handleStatusChange} onDelete={handleDeleteOrder} />

          {/* تبويب المتاجر */}
          {activeTab === "shops" && (
            <div className="space-y-5">
              <div className="flex items-center justify-between px-1">
                <div className="text-sm text-slate-400">{stats?.shopCount ?? 0} متجر</div>
                <button onClick={() => setCreateOpen(true)} className="border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg px-4 py-2 text-sm font-medium transition-colors flex items-center gap-1.5"><Plus className="h-4 w-4" /> إنشاء متجر جديد</button>
              </div>
              <div className="relative"><Search className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" /><Input value={shopSearch} onChange={(e) => setShopSearch(e.target.value)} placeholder="ابحث في المتاجر بالاسم أو الرابط..." className="pr-10 text-sm h-10 rounded-lg border-slate-200 focus:ring-teal-500/20 focus:border-teal-500 bg-background" /></div>
              {loadingStats ? (<div className="text-center py-16 text-slate-400 text-sm"><RefreshCw className="h-6 w-6 animate-spin mx-auto mb-3 text-teal-500" />جارٍ التحميل...</div>) : (stats?.shopStats.length ?? 0) === 0 ? (
                <div className="bg-background rounded-xl border border-slate-200/60 dark:border-slate-700/60 shadow-[0_1px_3px_rgba(0,0,0,0.06)]"><div className="py-20 text-center"><div className="w-16 h-16 mx-auto rounded-2xl bg-slate-50 flex items-center justify-center mb-4"><Store className="h-8 w-8 text-slate-300" /></div><p className="font-semibold text-slate-700 mb-2">لا توجد متاجر بعد</p><p className="text-xs text-slate-400 mb-4">ابدأ بإنشاء متجرك الأول</p><button onClick={() => setCreateOpen(true)} className="bg-teal-600 hover:bg-teal-700 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors inline-flex items-center gap-1.5"><Plus className="h-4 w-4" /> إنشاء متجر</button></div></div>
              ) : (
                <div className="space-y-4">
                  {stats?.shopStats.filter((shop) => { if (!shopSearch.trim()) return true; const q = shopSearch.toLowerCase(); return shop.name.toLowerCase().includes(q) || shop.slug.toLowerCase().includes(q); }).map((shop) => (<ShopManageCard key={shop.id} shop={shop} onCopyLink={copyLink} onCopyAdminLink={copyAdminLink} onRefresh={loadAll} />))}
                  {shopSearch.trim() && stats?.shopStats.filter((s) => { const q = shopSearch.toLowerCase(); return s.name.toLowerCase().includes(q) || s.slug.toLowerCase().includes(q); }).length === 0 && (<div className="text-center py-12 text-slate-400 text-sm">لا توجد متاجر تطابق البحث</div>)}
                </div>
              )}
            </div>
          )}

          {activeTab === "settings" && <SettingsTab />}
          {activeTab === "security" && <SecurityTab />}
        </div>
        )}
      </div>
      <CreateShopDialog open={createOpen} onClose={() => setCreateOpen(false)} onCreated={loadAll} />
    </div>
  );
}

// ===== رسالة طلبات فارغة =====
function EmptyOrdersMessage({ hasOrders, onClear }: { hasOrders: boolean; onClear: () => void }) {
  return (
    <div className="py-16 text-center">
      <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center mb-4"><Package className="h-8 w-8 text-slate-300" /></div>
      <p className="font-semibold text-slate-700 mb-1">{hasOrders ? "لا توجد طلبات تطابق البحث" : "لا توجد طلبات بعد"}</p>
      {hasOrders && <button onClick={onClear} className="inline-flex items-center gap-1.5 text-xs text-teal-600 hover:text-teal-700 font-medium transition-colors mt-2"><RotateCcw className="h-3.5 w-3.5" />مسح الفلاتر</button>}
    </div>
  );
}

// ===== نافذة تفاصيل الطلب =====
function OrderDetailDialog({ order, onClose, onStatusChange, onDelete }: {
  order: GlobalOrder | null; onClose: () => void;
  onStatusChange: (id: string, shopId: string, status: string) => void;
  onDelete: (id: string, shopId: string) => void;
}) {
  return (
    <Dialog open={!!order} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-md sm:max-w-lg border-t-4 border-t-teal-500" dir="rtl">
        <DialogTitle className="sr-only">تفاصيل الطلب</DialogTitle>
        {order && (
          <div className="space-y-5">
            <div><div className="flex items-center gap-2 mb-1"><span className="font-mono text-sm font-bold text-slate-800">{order.reference}</span><span className={`text-xs px-2.5 py-1 rounded-lg ${STATUS_COLORS[order.status] || ""}`}>{STATUS_META[order.status]?.label || order.status}</span></div><p className="text-xs text-slate-400">{formatDateTimeAr(order.createdAt)}</p></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 rounded-xl p-3"><div className="text-xs text-slate-400 mb-0.5">المتجر</div><div className="text-sm font-medium text-slate-800">{order.shopName}</div></div>
              <div className="bg-slate-50 rounded-xl p-3"><div className="text-xs text-slate-400 mb-0.5">الخدمة</div><div className="text-sm font-medium text-slate-800">{SERVICE_EMOJI[order.serviceType] || ""} {order.serviceName}</div></div>
              <div className="bg-slate-50 rounded-xl p-3"><div className="text-xs text-slate-400 mb-0.5">العميل</div><div className="text-sm font-medium text-slate-800">{order.customer.name}</div><div className="text-xs text-slate-400 mt-0.5" dir="ltr">{order.customer.phone}</div></div>
              <div className="bg-slate-50 rounded-xl p-3"><div className="text-xs text-slate-400 mb-0.5">المجموع</div><div className="text-sm font-bold text-slate-800">{formatDA(order.total)}</div></div>
            </div>
            <div>
              <Label className="text-xs text-slate-500 mb-1.5 block">تغيير الحالة</Label>
              <Select value={order.status} onValueChange={(val) => { if (order.shopId) onStatusChange(order.id, order.shopId, val); }}>
                <SelectTrigger className="text-sm h-10 rounded-lg"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUS_FLOW.map((s) => (<SelectItem key={s} value={s}><span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: STATUS_DOT_COLORS[s] || "#94a3b8" }} />{STATUS_META[s].label}</span></SelectItem>))}
                  <SelectItem value="cancelled"><span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full shrink-0 bg-rose-400" />ملغي</span></SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button className="flex-1 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors flex items-center justify-center gap-1.5" onClick={() => openInNewTab(`/s/${order.shopSlug || ""}?admin=1`)}><ExternalLink className="h-4 w-4" /> فتح في الإدارة</button>
              <AlertDialog><AlertDialogTrigger asChild><button className="border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors flex items-center gap-1.5"><Trash2 className="h-4 w-4" /> حذف</button></AlertDialogTrigger>
                <AlertDialogContent dir="rtl"><AlertDialogHeader><AlertDialogTitle>حذف الطلب؟</AlertDialogTitle><AlertDialogDescription>سيتم حذف الطلب {order.reference} نهائياً. هذا الإجراء لا يمكن التراجع عنه.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>إلغاء</AlertDialogCancel><AlertDialogAction className="bg-rose-600 hover:bg-rose-700 text-white" onClick={() => onDelete(order.id, order.shopId || "")}>حذف</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}