"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Plus, Store, RefreshCw, Shield, Package, Clock,
  Search, ExternalLink, Trash2, ArrowUpDown, ArrowUp, ArrowDown,
  RotateCcw, LayoutGrid, Settings, Lock, Menu, Download, SlidersHorizontal,
  CheckSquare, Square, XCircle,
} from "lucide-react";
import { ThemeToggle } from "@/components/app/theme-toggle";
import * as XLSX from "xlsx";
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
import type { GlobalStats, GlobalOrder, ShopStat } from "@/lib/admin-types";
import {
  isAuthenticated, verifySession, adminFetch, robustCopy, openInNewTab,
  SERVICE_EMOJI, STATUS_COLORS, STATUS_BORDER_COLORS, STATUS_DOT_COLORS,
  TAB_TITLES, clearSession, setFaviconBadge,
} from "@/lib/admin-utils";
import { LoginGate } from "@/components/app/admin-login-gate";
import { ShopManageCard } from "@/components/app/admin-shop-card";
import { CreateShopDialog } from "@/components/app/admin-create-shop";
import { SettingsTab } from "@/components/app/admin-settings-tab";
import { SecurityTab } from "@/components/app/admin-security-tab";
import { OverviewTab } from "@/components/app/admin-overview-tab";
import { PlatformSettingsTab } from "@/components/app/admin-platform-settings";

export default function SuperAdminPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [globalStats, setGlobalStats] = useState<GlobalStats | null>(null);
  const [allOrders, setAllOrders] = useState<GlobalOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
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
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState<string | null>(null);
  const [sortField, setSortField] = useState<string>("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  // اسم المدير (لعرضه في الترحيب)
  const [adminName, setAdminName] = useState<string>("");
  // إعدادات المنصة (الشعار والاسم)
  const [platformLogo, setPlatformLogo] = useState("");
  const [platformLogoDark, setPlatformLogoDark] = useState("");
  const [platformName, setPlatformName] = useState("طيف");
  // قائمة المتاجر الاحتياطية (عند فشل global-stats في إرجاع shopStats)
  const [fallbackShops, setFallbackShops] = useState<ShopStat[]>([]);

  // تحميل إعدادات المنصة (الشعار)
  const loadPlatformSettings = useCallback(() => {
    fetch("/api/super-admin/platform-settings")
      .then((r) => r.json())
      .then((d) => {
        const s = d.settings || {};
        setPlatformLogo(s.platformLogo || "");
        setPlatformLogoDark(s.platformLogoDark || "");
        setPlatformName(s.platformName || "طيف");
      })
      .catch(() => {});
  }, []);

  useEffect(() => { loadPlatformSettings(); }, [loadPlatformSettings]);

  // تحديث الشعار مباشرة عند حفظ الإعدادات بدون إعادة تحميل الصفحة
  useEffect(() => {
    function onSettingsUpdated(e: Event) {
      const s = (e as CustomEvent).detail || {};
      if (s.platformLogo !== undefined) setPlatformLogo(s.platformLogo);
      if (s.platformLogoDark !== undefined) setPlatformLogoDark(s.platformLogoDark);
      if (s.platformName !== undefined) setPlatformName(s.platformName);
    }
    window.addEventListener("platform-settings-updated", onSettingsUpdated);
    return () => window.removeEventListener("platform-settings-updated", onSettingsUpdated);
  }, []);

  const loadStats = useCallback(async (useCache = true) => {
    // محاولة عرض البيانات المخزنة مؤقتاً فوراً (Stale-While-Revalidate)
    if (useCache) {
      try {
        const cached = sessionStorage.getItem('admin_global_stats');
        if (cached) {
          const d = JSON.parse(cached);
          setGlobalStats(d);
          setLastUpdated("تحديث...");
        }
      } catch {}
    }

    const hasCached = useCache && !!sessionStorage.getItem('admin_global_stats');
    if (!hasCached) setLoading(true);
    setLoadError("");

    try {
      const d = await adminFetch("/api/admin/global-stats").then((r) => r.ok ? r.json() : null).catch(() => null);
      if (d && !d.error) {
        const stats = {
          totalOrders: d.totalOrders ?? 0,
          totalRevenue: d.totalRevenue ?? 0,
          todayOrders: d.todayOrders ?? 0,
          shopCount: d.shopCount ?? 0,
          activeShopCount: d.activeShopCount ?? 0,
          statusCounts: d.statusCounts ?? {},
          shopStats: d.shopStats ?? [],
          recentOrders: d.recentOrders ?? [],
        };
        setGlobalStats(stats);
        try { sessionStorage.setItem('admin_global_stats', JSON.stringify(stats)); } catch {}
        setLastUpdated("الآن");
      } else {
        setLastUpdated("تعذّر التحديث");
        if (!hasCached) setLoadError("فشل تحميل الإحصائيات");
      }
    } catch {
      setLoadError("خطأ في الاتصال بالخادم");
    } finally {
      setLoading(false);
    }
  }, []);

  // تحميل الطلبات بشكل مستقل (لا يُعطّل عرض الإحصائيات)
  const loadOrders = useCallback(async () => {
    try {
      const d = await fetch(`/api/orders?noPreview=true&limit=500`, { cache: 'no-store' })
        .then((r) => r.ok ? r.json() : null)
        .catch(() => null);
      if (d && !d.error) {
        const orders = d.orders || [];
        if (orders.length > 0) {
          setAllOrders(orders);
        } else if ((d.pagination?.total ?? 0) > 0) {
          // Turso hiccup — retry once after delay
          setTimeout(async () => {
            try {
              const d2 = await fetch(`/api/orders?noPreview=true&limit=500`, { cache: 'no-store' }).then(r => r.json());
              if (d2.orders?.length > 0) setAllOrders(d2.orders);
            } catch { /* silent */ }
          }, 2000);
        } else {
          setAllOrders(orders);
        }
      }
    } catch {
      // أخطاء الطلبات لا تُعطّل الواجهة — الإحصائيات كافية للعرض الأولي
    }
  }, []);

  // تحميل المتاجر من /api/shops كـ fallback عندما global-stats يُرجع shopStats فارغة
  const loadFallbackShops = useCallback(async () => {
    try {
      const d = await fetch('/api/shops', { cache: 'no-store' })
        .then(r => r.ok ? r.json() : null).catch(() => null);
      if (d && Array.isArray(d.shops) && d.shops.length > 0) {
        const shops: ShopStat[] = d.shops.map((s: Record<string, unknown>) => ({
          id: String(s.id),
          name: String(s.name),
          slug: String(s.slug),
          ownerName: s.ownerName ? String(s.ownerName) : null,
          ownerPhone: s.ownerPhone ? String(s.ownerPhone) : null,
          phone: s.phone ? String(s.phone) : null,
          whatsapp: s.whatsapp ? String(s.whatsapp) : null,
          email: s.email ? String(s.email) : null,
          address: s.address ? String(s.address) : null,
          primaryColor: s.primaryColor ? String(s.primaryColor) : null,
          isActive: Boolean(s.isActive),
          adminPin: String(s.adminPin || ""),
          trialDays: s.trialDays != null ? Number(s.trialDays) : null,
          trialStartsAt: s.trialStartsAt ? String(s.trialStartsAt) : null,
          plan: String(s.plan || "free"),
          features: s.features ? String(s.features) : null,
          paymentInfo: s.paymentInfo ? String(s.paymentInfo) : null,
          ownerNotes: s.ownerNotes ? String(s.ownerNotes) : null,
          country: String(s.country || "DZ"),
          language: String(s.language || "ar"),
          orders: Number(s._count?.orders ?? 0),
          revenue: 0,
          todayOrders: 0,
          recentOrders: [],
        }));
        setFallbackShops(shops);
      }
    } catch { /* silent */ }
  }, []);

  // النسخة الموحدة للتحديث اليدوي (زر التحديث) — تحميل الاثنين معاً
  const loadAll = useCallback(async (useCache = true) => {
    await Promise.allSettled([loadStats(useCache), loadOrders(), loadFallbackShops()]);
  }, [loadStats, loadOrders, loadFallbackShops]);

  // عند Mount: تحقق سريع من الجلسة المحفوظة (عودة المستخدم)
  useEffect(() => {
    setMounted(true);
    if (isAuthenticated()) {
      setAuthenticated(true);
    }
  }, []);

  // عندما يصبح authenticated = true (بعد تسجيل الدخول أو العودة) — حمّل البيانات
  useEffect(() => {
    if (!authenticated) return;

    // 1) حمّل الإحصائيات أولاً (سريع ~600ms) — تظهر لوحة التحكم فوراً
    loadStats();
    // 2) حمّل الطلبات في الخلفية (لا تُعطّل العرض)
    loadOrders();
    // 3) حمّل المتاجر من /api/shops كـ fallback
    loadFallbackShops();

    // 4) تحديث تلقائي كل 45 ثانية
    const interval = setInterval(() => {
      loadStats();
      loadOrders();
    }, 45_000);

    // التحقق من الجلسة بالتوازي (يستخدم كاش sessionStorage لمدة 5 دقائق)
    // لا يُعطّل الواجهة أبداً — لو فشل الشبكة يبقى المستخدم يعمل
    verifySession().then(({ valid, adminName: name }) => {
      if (name) setAdminName(name);
      if (!valid) {
        clearSession();
        setAuthenticated(false);
      }
    });
    return () => clearInterval(interval);
  }, [authenticated, loadStats, loadOrders]);

  // تحديث شارة الـ favicon بعدد الطلبات المعلقة
  useEffect(() => {
    if (globalStats) {
      const pendingCount = globalStats.statusCounts?.pending ?? 0;
      setFaviconBadge(pendingCount);
    }
  }, [globalStats]);

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
    if (sortField !== field) return <ArrowUpDown className="h-3 w-3 text-muted-foreground/40" />;
    return sortDir === "desc" ? <ArrowDown className="h-3 w-3 text-primary" /> : <ArrowUp className="h-3 w-3 text-primary" />;
  }

  function exportToExcel() {
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

  // ===== إجراءات جماعية على الطلبات =====
  function toggleSelectOrder(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }
  function selectAllVisible() {
    setSelectedIds(new Set(filteredOrders.slice(0, 100).map(o => o.id)));
  }
  function clearSelection() { setSelectedIds(new Set()); }
  async function applyBulkStatus() {
    if (!bulkStatus || selectedIds.size === 0) return;
    const ids = Array.from(selectedIds);
    let successCount = 0;
    for (const orderId of ids) {
      const order = allOrders.find(o => o.id === orderId);
      if (!order?.shopId) continue;
      try {
        const res = await fetch(`/api/orders/${orderId}?shopId=${order.shopId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: bulkStatus }) });
        if (res.ok) successCount++;
      } catch { /* continue */ }
    }
    if (successCount > 0) {
      setAllOrders((prev) => prev.map(o => selectedIds.has(o.id) ? { ...o, status: bulkStatus! } : o));
      toast.success(`تم تحديث ${successCount} طلب إلى "${STATUS_META[bulkStatus]?.label || bulkStatus}"`);
    }
    setSelectedIds(new Set());
    setBulkStatus(null);
  }

  const stats = globalStats;
  const sidebarSections = useMemo(() => [
    { title: "الرئيسية", items: [
      { key: "overview", label: "نظرة عامة", icon: LayoutGrid },
      { key: "orders", label: "الطلبات", icon: Package, badge: stats?.totalOrders },
      { key: "shops", label: "المتاجر", icon: Store },
    ]},
    { title: "المنصة", items: [
      { key: "platformSettings", label: "إعدادات المنصة", icon: Settings },
      { key: "settings", label: "إعدادات المتاجر", icon: SlidersHorizontal },
    ]},
    { title: "النظام", items: [
      { key: "security", label: "الأمان والفريق", icon: Lock },
    ]},
  ], [stats?.totalOrders]);

  if (!mounted) return <div className="min-h-screen bg-background" />;
  if (!authenticated) return <LoginGate onUnlock={() => setAuthenticated(true)} />;

  return (
    <div className="flex h-screen overflow-hidden" dir="rtl">
      <DashboardSidebar
        sections={sidebarSections} activeKey={activeTab} onNavigate={setActiveTab}
        collapsed={sidebarCollapsed} onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        mobileOpen={mobileOpen} onMobileToggle={() => setMobileOpen(!mobileOpen)}
        logo={<div className="flex items-center gap-3">{platformLogo ? (<img src={platformLogo} alt={platformName} className="w-9 h-9 rounded-xl shrink-0 object-cover dark:hidden" />) : (<img src="/tayf-logo-sm.png" alt={platformName} className="w-9 h-9 rounded-xl shrink-0 dark:hidden" />)}{platformLogoDark ? (<img src={platformLogoDark} alt={platformName} className="w-9 h-9 rounded-xl shrink-0 object-cover hidden dark:block" />) : (platformLogo ? (<img src={platformLogo} alt={platformName} className="w-9 h-9 rounded-xl shrink-0 object-cover hidden dark:block" />) : (<img src="/tayf-logo-sm-dark.png" alt={platformName} className="w-9 h-9 rounded-xl shrink-0 hidden dark:block" />))}{!sidebarCollapsed && <div className="min-w-0"><div className="font-bold text-sm text-sidebar-primary-foreground truncate">{platformName}</div><div className="text-[10px] text-sidebar-foreground/50 truncate">لوحة التحكم</div></div>}</div>}
      />
      <div className="flex-1 bg-background overflow-auto">
        <header className="bg-background border-b border-border h-16 sticky top-0 z-30 px-4 sm:px-6">
          <div className="h-full flex items-center justify-between gap-2 sm:gap-3">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <button type="button" onClick={() => setMobileOpen(!mobileOpen)} className="flex h-11 w-11 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:hidden" aria-label={mobileOpen ? 'إغلاق القائمة' : 'فتح القائمة'}><Menu size={20} /></button>
              {platformLogo ? (<img src={platformLogo} alt={platformName} className="w-8 h-8 rounded-lg shrink-0 object-cover dark:hidden" />) : (<img src="/tayf-logo-sm.png" alt={platformName} className="w-8 h-8 rounded-lg shrink-0 dark:hidden" />)}
              {platformLogoDark ? (<img src={platformLogoDark} alt={platformName} className="w-8 h-8 rounded-lg shrink-0 object-cover hidden dark:block" />) : (platformLogo ? (<img src={platformLogo} alt={platformName} className="w-8 h-8 rounded-lg shrink-0 object-cover hidden dark:block" />) : (<img src="/tayf-logo-sm-dark.png" alt={platformName} className="w-8 h-8 rounded-lg shrink-0 hidden dark:block" />))}
              <div className="min-w-0"><h1 className="text-sm font-semibold text-foreground truncate">{TAB_TITLES[activeTab] || "لوحة التحكم"}</h1><p className="text-xs text-muted-foreground truncate">{platformName} / {TAB_TITLES[activeTab] || "نظرة عامة"}</p></div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <ThemeToggle />
              <button onClick={() => setCreateOpen(true)} className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium transition-colors flex items-center gap-1.5 btn-shine"><Plus className="h-4 w-4" /><span className="hidden sm:inline">إنشاء متجر</span></button>
              <button onClick={() => loadAll(false)} className="text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg p-2.5 text-sm transition-colors relative"><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /></button>
              {stats?.todayOrders && stats.todayOrders > 0 && (
                <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-500 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
                  </span>
                  <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 tabular-nums">{stats.todayOrders} جديد اليوم</span>
                </div>
              )}
            </div>
          </div>
        </header>

        {loading ? (
          <div className="p-4 sm:p-6 space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{[...Array(4)].map((_, i) => (<div key={i} className="skeleton-soft rounded-xl p-5"><div className="flex items-start justify-between"><div className="space-y-2.5 flex-1"><div className="h-8 bg-muted/50 rounded-lg w-24" /><div className="h-3 bg-muted/30 rounded w-28" /></div><div className="w-11 h-11 rounded-xl bg-muted/50" /></div></div>))}</div>
            <div className="skeleton-soft rounded-xl p-6"><div className="h-5 bg-muted/50 rounded-lg w-48 mb-5" /><div className="space-y-3">{[...Array(5)].map((_, i) => (<div key={i} className="h-12 bg-muted/20 rounded-lg" />))}</div></div>
          </div>
        ) : (
        <div className="p-4 sm:p-6 space-y-6">
          {activeTab === "overview" && stats && <OverviewTab stats={stats} lastUpdated={lastUpdated} onOpenCreate={() => setCreateOpen(true)} adminName={adminName} />}
          {activeTab === "overview" && !stats && !loading && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              {loadError ? (
                <>
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-500/10 flex items-center justify-center mb-4"><RefreshCw className="h-8 w-8 text-rose-400" /></div>
                  <p className="font-semibold text-foreground mb-2">فشل تحميل البيانات</p>
                  <p className="text-xs text-muted-foreground mb-4 max-w-sm">{loadError}. تحقق من اتصالك بالإنترنت وحاول مرة أخرى</p>
                  <button onClick={() => loadAll(false)} className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg px-5 py-2.5 text-sm font-medium transition-colors inline-flex items-center gap-2"><RefreshCw className="h-4 w-4" />إعادة المحاولة</button>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center mb-4"><LayoutGrid className="h-8 w-8 text-primary" /></div>
                  <p className="font-semibold text-foreground mb-2">النظرة العامة</p>
                  <p className="text-xs text-muted-foreground mb-4 max-w-sm">لا توجد إحصائيات متاحة حالياً. سيتم عرضها عند وجود بيانات</p>
                  <button onClick={() => loadAll(false)} className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg px-5 py-2.5 text-sm font-medium transition-colors inline-flex items-center gap-2"><RefreshCw className="h-4 w-4" />تحديث</button>
                </>
              )}
            </div>
          )}

          {activeTab === "orders" && (
            <div className="space-y-5">
              {/* شريط الإجراءات الجماعية */}
              {selectedIds.size > 0 && (
                <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-primary/5 dark:bg-primary/10 border border-primary/20 dark:border-primary/30 fade-in-up">
                  <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">{selectedIds.size}</span>
                    <span>طلب محدد</span>
                  </div>
                  <div className="flex-1" />
                  <Select value={bulkStatus || ""} onValueChange={setBulkStatus}>
                    <SelectTrigger className="text-sm h-9 rounded-lg border-border bg-background w-36"><SelectValue placeholder="تغيير الحالة..." /></SelectTrigger>
                    <SelectContent>
                      {STATUS_FLOW.map((s) => (<SelectItem key={s} value={s}><span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: STATUS_DOT_COLORS[s] || "#94a3b8" }} />{STATUS_META[s].label}</span></SelectItem>))}
                    </SelectContent>
                  </Select>
                  <button onClick={applyBulkStatus} disabled={!bulkStatus} className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg px-3 py-2 text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed btn-shine">تطبيق</button>
                  <button onClick={clearSelection} className="text-muted-foreground hover:text-foreground rounded-lg p-2 transition-colors" title="إلغاء التحديد"><XCircle className="h-4 w-4" /></button>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 stagger-children">
                <div className="relative md:col-span-1"><Search className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/70" /><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="ابحث برقم الطلب، اسم، هاتف، أو متجر..." className="pr-10 text-sm h-10 rounded-lg focus:ring-ring focus:border-ring bg-background input-glow" /></div>
                <Select value={shopFilter} onValueChange={setShopFilter}><SelectTrigger className="text-sm h-10 rounded-lg border-border bg-background"><SelectValue placeholder="كل المتاجر" /></SelectTrigger><SelectContent><SelectItem value="all">كل المتاجر</SelectItem>{(stats?.shopStats?.length ?? 0) > 0 ? stats.shopStats.map((s) => (<SelectItem key={s.id} value={s.slug}>{s.name}</SelectItem>)) : fallbackShops.map((s) => (<SelectItem key={s.id} value={s.slug}>{s.name}</SelectItem>))}</SelectContent></Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger className="text-sm h-10 rounded-lg border-border bg-background"><SelectValue placeholder="كل الحالات" /></SelectTrigger><SelectContent><SelectItem value="all">كل الحالات</SelectItem>{STATUS_FLOW.map((s) => (<SelectItem key={s} value={s}>{STATUS_META[s].label}</SelectItem>))}<SelectItem value="cancelled">ملغي</SelectItem></SelectContent></Select>
                <button onClick={exportToExcel} disabled={filteredOrders.length === 0} className="border border-border text-foreground hover:bg-accent rounded-lg px-4 py-2.5 text-sm font-medium transition-colors flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed bg-background"><Download className="h-4 w-4" />تصدير Excel</button>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground/70 px-1">
                <span>المعروض: <b className="text-foreground/60">{filteredOrders.length}</b> من {allOrders.length}</span>
                {filteredOrders.length > 0 && (
                  <button onClick={selectedIds.size === filteredOrders.length ? clearSelection : selectAllVisible} className="text-primary hover:text-primary/80 font-medium transition-colors">
                    {selectedIds.size === filteredOrders.length ? "إلغاء الكل" : "تحديد الكل"}
                  </button>
                )}
              </div>
              {/* جدول - حاسوب */}
              <div className="hidden md:block bg-card rounded-xl border border-border shadow-sm overflow-x-auto">
                <Table>
                  <TableHeader><TableRow className="bg-background/80 hover:bg-background/80 border-b border-border">
                    <TableHead className="text-center text-xs w-10"><button onClick={selectedIds.size > 0 ? clearSelection : selectAllVisible}>{selectedIds.size > 0 ? <CheckSquare className="h-4 w-4 text-primary" /> : <Square className="h-4 w-4 text-muted-foreground/40" />}</button></TableHead>
                    <TableHead className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wide cursor-pointer select-none hover:text-foreground" onClick={() => handleSort("reference")}><span className="inline-flex items-center gap-1">رقم الطلب <SortIcon field="reference" /></span></TableHead>
                    <TableHead className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wide">المتجر</TableHead>
                    <TableHead className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wide">الخدمة</TableHead>
                    <TableHead className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wide">العميل</TableHead>
                    <TableHead className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wide cursor-pointer select-none hover:text-foreground" onClick={() => handleSort("total")}><span className="inline-flex items-center gap-1">المجموع <SortIcon field="total" /></span></TableHead>
                    <TableHead className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wide">الحالة</TableHead>
                    <TableHead className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wide cursor-pointer select-none hover:text-foreground" onClick={() => handleSort("date")}><span className="inline-flex items-center gap-1">التاريخ <SortIcon field="date" /></span></TableHead>
                    <TableHead className="text-center text-xs font-medium text-muted-foreground uppercase tracking-wide w-10"></TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {filteredOrders.slice(0, 100).map((o) => (
                      <TableRow key={o.id} className={cn("cursor-pointer hover:bg-background transition-colors border-b border-border group press-effect", selectedIds.has(o.id) && "bg-primary/5")} onClick={() => setSelectedOrder(o)}>
                        <TableCell className="text-center" onClick={(e) => e.stopPropagation()}><button onClick={() => toggleSelectOrder(o.id)}>{selectedIds.has(o.id) ? <CheckSquare className="h-4 w-4 text-primary" /> : <Square className="h-4 w-4 text-muted-foreground/30 group-hover:text-muted-foreground/60 transition-colors" />}</button></TableCell>
                        <TableCell className="font-mono text-xs font-bold text-foreground">{o.reference}</TableCell>
                        <TableCell className="text-xs"><span className="text-xs px-2 py-0.5 rounded-lg bg-muted text-muted-foreground">{o.shopName || "—"}</span></TableCell>
                        <TableCell className="text-sm text-foreground">{SERVICE_EMOJI[o.serviceType] || ""} {o.serviceName}</TableCell>
                        <TableCell className="text-sm"><div className="text-foreground">{o.customer.name}</div><div className="text-muted-foreground/70" dir="ltr">{o.customer.phone}</div></TableCell>
                        <TableCell className="text-sm font-bold text-foreground">{formatDA(o.total)}</TableCell>
                        <TableCell><span className={`text-xs px-2.5 py-1 rounded-lg ${STATUS_COLORS[o.status] || ""}`}>{STATUS_META[o.status]?.label || o.status}</span></TableCell>
                        <TableCell className="text-sm text-muted-foreground/70">{formatDateTimeAr(o.createdAt)}</TableCell>
                        <TableCell className="text-center">
                          <button
                            className="p-1.5 rounded-lg hover:bg-muted transition-colors opacity-0 group-hover:opacity-100"
                            title="نسخ رابط التتبع"
                            onClick={(e) => { e.stopPropagation(); robustCopy(`${window.location.origin}/track?ref=${o.reference}`, "تم نسخ رابط التتبع", "شاركه مع العميل لمتابعة طلبه"); }}
                          >
                            <ExternalLink className="h-3.5 w-3.5 text-muted-foreground hover:text-primary" />
                          </button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {filteredOrders.length === 0 && <EmptyOrdersMessage hasOrders={allOrders.length > 0} onClear={() => { setSearch(""); setStatusFilter("all"); setShopFilter("all"); }} />}
              </div>
              {/* بطاقات - جوال */}
              <div className="md:hidden space-y-3">
                {filteredOrders.slice(0, 50).map((o) => (
                  <div key={o.id} className={cn("cursor-pointer bg-card rounded-xl border border-border shadow-sm p-4 hover:shadow-[0_2px_8px_rgba(0,0,0,0.08)] transition-shadow border-r-[3px] group press-effect", STATUS_BORDER_COLORS[o.status] || "", selectedIds.has(o.id) && "bg-primary/5")} onClick={() => setSelectedOrder(o)}>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 min-w-0">
                      <div className="flex items-center gap-2 min-w-0">
                        <button onClick={(e) => { e.stopPropagation(); toggleSelectOrder(o.id); }} className="shrink-0">
                          {selectedIds.has(o.id) ? <CheckSquare className="h-4 w-4 text-primary" /> : <Square className="h-4 w-4 text-muted-foreground/30" />}
                        </button>
                        <span className="font-mono text-xs font-bold text-foreground">{o.reference}</span>
                        <span className="text-xs px-2 py-0.5 rounded-lg bg-muted text-muted-foreground">{o.shopName}</span>
                      </div>
                      <div className="text-xs text-muted-foreground/70 mt-1">
                        {SERVICE_EMOJI[o.serviceType] || ""} {o.serviceName} · {o.customer.name}
                      </div>
                    </div>
                      <div className="text-left shrink-0 flex items-center gap-1.5">
                        <div className="text-sm font-bold text-foreground">{formatDA(o.total)}</div>
                        <span className={`text-xs px-2.5 py-1 rounded-lg ${STATUS_COLORS[o.status] || ""}`}>{STATUS_META[o.status]?.label || o.status}</span>
                        <button className="p-1 rounded-lg hover:bg-muted transition-colors opacity-0 group-hover:opacity-100" title="نسخ رابط التتبع" onClick={(e) => { e.stopPropagation(); robustCopy(`${window.location.origin}/track?ref=${o.reference}`, "تم نسخ رابط التتبع", "شاركه مع العميل"); }}>
                          <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {filteredOrders.length === 0 && <EmptyOrdersMessage hasOrders={allOrders.length > 0} onClear={() => { setSearch(""); setStatusFilter("all"); setShopFilter("all"); }} />}
              </div>
            </div>
          )}

          {/* نافذة تفاصيل الطلب */}
          <OrderDetailDialog order={selectedOrder} onClose={() => setSelectedOrder(null)} onStatusChange={handleStatusChange} onDelete={handleDeleteOrder} />

          {/* تبويب المتاجر */}
          {activeTab === "shops" && (() => {
            // استخدم shopStats من global-stats، وإذا كانت فارغة استخدم fallbackShops من /api/shops
            const displayShops = (stats?.shopStats?.length ?? 0) > 0 ? stats.shopStats : fallbackShops;
            const shopCount = (stats?.shopCount ?? 0) > 0 ? stats.shopCount : fallbackShops.length;
            return (
            <div className="space-y-5">
              <div className="flex items-center justify-between px-1">
                <div className="text-sm text-muted-foreground/70">{shopCount} متجر</div>
                <button onClick={() => setCreateOpen(true)} className="border border-border text-foreground hover:bg-accent rounded-lg px-4 py-2 text-sm font-medium transition-colors flex items-center gap-1.5"><Plus className="h-4 w-4" /> إنشاء متجر جديد</button>
              </div>
              <div className="relative"><Search className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/70" /><Input value={shopSearch} onChange={(e) => setShopSearch(e.target.value)} placeholder="ابحث في المتاجر بالاسم أو الرابط..." className="pr-10 text-sm h-10 rounded-lg focus:ring-ring focus:border-ring bg-background" /></div>
              {loading ? (<div className="text-center py-16 text-muted-foreground/70 text-sm"><RefreshCw className="h-6 w-6 animate-spin mx-auto mb-3 text-violet-500" />جارٍ التحميل...</div>) : displayShops.length === 0 ? (
                <div className="bg-card rounded-xl border border-border shadow-sm"><div className="py-20 text-center"><div className="w-16 h-16 mx-auto rounded-2xl bg-background flex items-center justify-center mb-4"><Store className="h-8 w-8 text-muted-foreground/40" /></div><p className="font-semibold text-foreground mb-2">لا توجد متاجر بعد</p><p className="text-xs text-muted-foreground/70 mb-4">ابدأ بإنشاء متجرك الأول</p><button onClick={() => setCreateOpen(true)} className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium transition-colors inline-flex items-center gap-1.5"><Plus className="h-4 w-4" /> إنشاء متجر</button></div></div>
              ) : (
                <div className="space-y-4">
                  {displayShops.filter((shop) => { if (!shopSearch.trim()) return true; const q = shopSearch.toLowerCase(); return shop.name.toLowerCase().includes(q) || shop.slug.toLowerCase().includes(q); }).map((shop) => (<ShopManageCard key={shop.id} shop={shop} onCopyLink={copyLink} onCopyAdminLink={copyAdminLink} onRefresh={loadAll} />))}
                  {shopSearch.trim() && displayShops.filter((s) => { const q = shopSearch.toLowerCase(); return s.name.toLowerCase().includes(q) || s.slug.toLowerCase().includes(q); }).length === 0 && (<div className="text-center py-12 text-muted-foreground/70 text-sm">لا توجد متاجر تطابق البحث</div>)}
                </div>
              )}
            </div>
            );
          })()}

          {activeTab === "platformSettings" && <PlatformSettingsTab />}
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
      <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center mb-4"><Package className="h-8 w-8 text-muted-foreground/40" /></div>
      <p className="font-semibold text-foreground mb-1">{hasOrders ? "لا توجد طلبات تطابق البحث" : "لا توجد طلبات بعد"}</p>
      {hasOrders && <button onClick={onClear} className="inline-flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 font-medium transition-colors mt-2"><RotateCcw className="h-3.5 w-3.5" />مسح الفلاتر</button>}
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
      <DialogContent className="max-w-md sm:max-w-lg border-t-4 border-t-primary card-accent-top" dir="rtl">
        <DialogTitle className="sr-only">تفاصيل الطلب</DialogTitle>
        {order && (
          <div className="space-y-5">
            <div><div className="flex items-center gap-2 mb-1"><span className="font-mono text-sm font-bold text-foreground">{order.reference}</span><span className={`text-xs px-2.5 py-1 rounded-lg ${STATUS_COLORS[order.status] || ""}`}>{STATUS_META[order.status]?.label || order.status}</span></div><p className="text-xs text-muted-foreground/70">{formatDateTimeAr(order.createdAt)}</p></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-background rounded-xl p-3"><div className="text-xs text-muted-foreground/70 mb-0.5">المتجر</div><div className="text-sm font-medium text-foreground">{order.shopName}</div></div>
              <div className="bg-background rounded-xl p-3"><div className="text-xs text-muted-foreground/70 mb-0.5">الخدمة</div><div className="text-sm font-medium text-foreground">{SERVICE_EMOJI[order.serviceType] || ""} {order.serviceName}</div></div>
              <div className="bg-background rounded-xl p-3"><div className="text-xs text-muted-foreground/70 mb-0.5">العميل</div><div className="text-sm font-medium text-foreground">{order.customer.name}</div><div className="text-xs text-muted-foreground/70 mt-0.5" dir="ltr">{order.customer.phone}</div></div>
              <div className="bg-background rounded-xl p-3"><div className="text-xs text-muted-foreground/70 mb-0.5">المجموع</div><div className="text-sm font-bold text-foreground">{formatDA(order.total)}</div></div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">تغيير الحالة</Label>
              <Select value={order.status} onValueChange={(val) => { if (order.shopId) onStatusChange(order.id, order.shopId, val); }}>
                <SelectTrigger className="text-sm h-10 rounded-lg"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUS_FLOW.map((s) => (<SelectItem key={s} value={s}><span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: STATUS_DOT_COLORS[s] || "#94a3b8" }} />{STATUS_META[s].label}</span></SelectItem>))}
                  <SelectItem value="cancelled"><span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full shrink-0 bg-rose-400" />ملغي</span></SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button className="flex-1 border border-border text-foreground hover:bg-accent rounded-lg px-4 py-2.5 text-sm font-medium transition-colors flex items-center justify-center gap-1.5" onClick={() => openInNewTab(`/s/${order.shopSlug || ""}?admin=1`)}><ExternalLink className="h-4 w-4" /> فتح في الإدارة</button>
              <AlertDialog><AlertDialogTrigger asChild><button className="border border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-800 dark:text-rose-400 dark:hover:bg-rose-950 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors flex items-center gap-1.5"><Trash2 className="h-4 w-4" /> حذف</button></AlertDialogTrigger>
                <AlertDialogContent dir="rtl"><AlertDialogHeader><AlertDialogTitle>حذف الطلب؟</AlertDialogTitle><AlertDialogDescription>سيتم حذف الطلب {order.reference} نهائياً. هذا الإجراء لا يمكن التراجع عنه.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>إلغاء</AlertDialogCancel><AlertDialogAction className="bg-rose-600 hover:bg-rose-700 text-white" onClick={() => onDelete(order.id, order.shopId || "")}>حذف</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}