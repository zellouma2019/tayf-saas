"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Plus, Store, RefreshCw, Shield, Package, Clock,
  Search, ExternalLink, Trash2, Download, TrendingUp,
  Lock, Menu, Settings, DollarSign, BarChart3, Users, Activity,
  ArrowUpRight, Eye, ChevronLeft, Bell, Zap, Calendar,
  CheckCircle2, AlertTriangle, Info, Copy, Keyboard,
  FileText, Check, Square, X, CheckSquare,
} from "lucide-react";
import { ThemeToggle } from "@/components/app/theme-toggle";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogTitle,
} from "@/components/ui/dialog";
import {
  Card, CardContent, CardHeader, CardTitle,
} from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  STATUS_META, STATUS_FLOW, formatDA, formatDateTimeAr,
} from "@/lib/print-config";
import { cn } from "@/lib/utils";
import type { GlobalStats, GlobalOrder, ShopStat } from "@/lib/admin-types";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  isAuthenticated, verifySession, adminFetch,
  formatNumber, STATUS_COLORS, STATUS_BORDER_COLORS, STATUS_DOT_COLORS,
  SERVICE_EMOJI, clearSession, setFaviconBadge,
} from "@/lib/admin-utils";
import { LoginGate } from "@/components/app/admin-login-gate";
import { ShopManageCard } from "@/components/app/admin-shop-card";
import { CreateShopDialog } from "@/components/app/admin-create-shop";
import { OverviewTab } from "@/components/app/admin-overview-tab";
import { SettingsTab } from "@/components/app/admin-settings-tab";
import { SecurityTab } from "@/components/app/admin-security-tab";
import { PlatformSettingsTab } from "@/components/app/admin-platform-settings";
import { AdminErrorBoundary } from "@/components/app/error-boundary";
import { AdminNotificationCenter } from "@/components/app/admin-notification-center";

const BUILD_HASH = "v4.8-" + process.env.NEXT_PUBLIC_BUILD_HASH || "v4.8";

export default function SuperAdminPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [globalStats, setGlobalStats] = useState<GlobalStats | null>(null);
  const [allOrders, setAllOrders] = useState<GlobalOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [lastUpdated, setLastUpdated] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [shopFilter, setShopFilter] = useState("all");
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [shopSearch, setShopSearch] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<GlobalOrder | null>(null);
  // Date range filter
  const [dateFilter, setDateFilter] = useState<"all" | "today" | "week" | "month" | "custom">("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showDateFilter, setShowDateFilter] = useState(false);
  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState("");
  // Quick view
  const [quickViewOrder, setQuickViewOrder] = useState<GlobalOrder | null>(null);
  // Data health tracking
  const [dataHealth, setDataHealth] = useState<{ status: 'healthy' | 'warning' | 'error'; message: string }>({ status: 'healthy', message: '' });
  // Platform settings
  const [platformLogo, setPlatformLogo] = useState("");
  const [platformLogoDark, setPlatformLogoDark] = useState("");
  const [platformName, setPlatformName] = useState("طيف");
  // Fallback shops
  const [fallbackShops, setFallbackShops] = useState<ShopStat[]>([]);

  // Whether initial data load has completed at least once
  const dataLoaded = globalStats !== null || fallbackShops.length > 0 || allOrders.length > 0;
  const isInitialLoading = loading && !dataLoaded;
  const isRefreshing = refreshing || (loading && dataLoaded);

  // Load platform settings
  useEffect(() => {
    fetch("/api/super-admin/platform-settings")
      .then((r) => {
        const ct = r.headers.get('content-type') || '';
        if (!ct.includes('application/json')) throw new Error('non-JSON');
        return r.json();
      })
      .then((d) => {
        const s = d.settings || {};
        setPlatformLogo(s.platformLogo || "");
        setPlatformLogoDark(s.platformLogoDark || "");
        setPlatformName(s.platformName || "طيف");
      })
      .catch(() => {});
  }, []);

  // Prevent hydration mismatch
  useEffect(() => { setMounted(true); }, []);

  // Verify session on mount
  useEffect(() => {
    if (isAuthenticated()) {
      setAuthenticated(true);
    } else {
      verifySession().then(({ valid }) => {
        if (valid) setAuthenticated(true);
      }).catch(() => {});
    }
  }, []);

  // Load all data after authentication
  const loadAll = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    else setRefreshing(true);
    setLoadError("");
    try {
      const cacheBust = `&_=${Date.now()}`;
      const [statsRes, ordersRes] = await Promise.all([
        fetch(`/api/admin/global-stats${cacheBust}`),
        fetch(`/api/orders${cacheBust}`),
      ]);
      // Safe JSON parsing - handle non-JSON responses gracefully
      async function safeJson(res: Response) {
        const ct = res.headers.get('content-type') || '';
        if (!ct.includes('application/json')) {
          throw new Error(`API returned non-JSON response (${res.status})`);
        }
        return res.json();
      }
      const statsData = await safeJson(statsRes);
      const ordersData = await safeJson(ordersRes);

      // Primary: use shopStats + recentOrders from global-stats API
      if (statsData.shopStats && Array.isArray(statsData.shopStats) && statsData.shopStats.length > 0) {
        setGlobalStats(statsData);
        setAllOrders(Array.isArray(statsData.recentOrders) ? statsData.recentOrders : []);
        // Check data quality
        const hasShopOrders = statsData.shopStats.some((s: ShopStat) => s.orders > 0);
        const hasRecentOrders = Array.isArray(statsData.recentOrders) && statsData.recentOrders.length > 0;
        if (hasShopOrders && hasRecentOrders) {
          setDataHealth({ status: 'healthy', message: '' });
        } else if (statsData.totalOrders > 0) {
          setDataHealth({ status: 'warning', message: 'تم تحميل البيانات via fallback' });
        } else {
          setDataHealth({ status: 'healthy', message: '' });
        }
      } else if (statsData.shopCount > 0) {
        // Fallback: shopStats exists but might be empty, still use stats structure
        setGlobalStats(statsData);
        setAllOrders(Array.isArray(statsData.recentOrders) ? statsData.recentOrders : []);
        setDataHealth({ status: 'warning', message: 'بيانات جزئية — تم استخدام fallback' });
      } else {
        // Last resort: load shops + orders from separate APIs
        const shopsRes = await fetch("/api/shops");
        const shops = await shopsRes.json();
        setFallbackShops(Array.isArray(shops) ? shops : []);
        setAllOrders(Array.isArray(ordersData.orders) ? ordersData.orders : (Array.isArray(ordersData) ? ordersData : []));
        setDataHealth({ status: 'error', message: 'لم يتم تحميل global-stats — تم استخدام APIs منفصلة' });
      }
      setLastUpdated(new Date().toLocaleTimeString("ar-SA"));
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "فشل في تحميل البيانات");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Load data after authentication
  useEffect(() => {
    if (authenticated) loadAll();
  }, [authenticated, loadAll]);

  // Set favicon badge
  useEffect(() => {
    if (allOrders.length > 0) {
      const pending = allOrders.filter((o) => o.status === "pending").length;
      setFaviconBadge(pending);
    }
  }, [allOrders]);

  // Keyboard shortcuts: Alt+R = refresh, Alt+1/2/3 = tabs
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.altKey && e.key === "r") {
        e.preventDefault();
        loadAll(false);
      }
      if (e.altKey && e.key === "1") setActiveTab("overview");
      if (e.altKey && e.key === "2") setActiveTab("shops");
      if (e.altKey && e.key === "3") setActiveTab("orders");
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [loadAll]);

  // Auto-refresh: poll every 30 seconds when authenticated
  useEffect(() => {
    if (!authenticated) return;
    const interval = setInterval(() => {
      loadAll(false); // silent refresh
    }, 30_000);
    return () => clearInterval(interval);
  }, [authenticated, loadAll]);

  // Change order status inline
  const changeOrderStatus = useCallback(async (orderId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error('فشل في تحديث الحالة');
      toast.success(`تم تحديث حالة الطلب إلى: ${STATUS_META[newStatus as keyof typeof STATUS_META]?.label || newStatus}`);
      loadAll(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'فشل في تحديث الحالة');
    }
  }, [loadAll]);

  // Handle logout
  function handleLogout() {
    clearSession();
    setAuthenticated(false);
    setGlobalStats(null);
    setAllOrders([]);
  }

  // Date range helper
  function isInDateRange(dateStr: string): boolean {
    if (dateFilter === "all") return true;
    const d = new Date(dateStr);
    const now = new Date();
    if (dateFilter === "today") {
      return d.toDateString() === now.toDateString();
    }
    if (dateFilter === "week") {
      const weekAgo = new Date(now); weekAgo.setDate(weekAgo.getDate() - 7);
      return d >= weekAgo;
    }
    if (dateFilter === "month") {
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }
    if (dateFilter === "custom" && dateFrom && dateTo) {
      const from = new Date(dateFrom); from.setHours(0,0,0,0);
      const to = new Date(dateTo); to.setHours(23,59,59,999);
      return d >= from && d <= to;
    }
    return true;
  }

  // Safe data refs
  const safeOrders = Array.isArray(allOrders) ? allOrders : [];
  const pendingCount = safeOrders.filter(o => o.status === "pending").length;

  // Notification state
  const [notifEvents, setNotifEvents] = useState<Array<{
    id: string;
    message: string;
    type: 'order_new' | 'order_status' | 'system' | 'info';
    time: string;
    shopName?: string;
  }>>([]);

  // Generate notification events from orders
  useEffect(() => {
    const events: typeof notifEvents = [];
    const recent = safeOrders.slice(0, 8);
    recent.forEach((o) => {
      if (o.status === "pending") {
        events.push({
          id: `new-${o.id}`,
          message: `طلب جديد #${o.reference} — ${o.serviceName}`,
          type: "order_new",
          time: o.createdAt,
          shopName: o.shopName,
        });
      } else if (o.status === "completed" || o.status === "delivered") {
        events.push({
          id: `done-${o.id}`,
          message: `تم إنجاز الطلب #${o.reference}`,
          type: "order_status",
          time: o.createdAt,
          shopName: o.shopName,
        });
      } else {
        events.push({
          id: `status-${o.id}`,
          message: `طلب #${o.reference} — حالة: ${STATUS_META[o.status]?.label || o.status}`,
          type: "info",
          time: o.createdAt,
          shopName: o.shopName,
        });
      }
    });
    if (pendingCount > 3) {
      events.unshift({
        id: "system-queue",
        message: `${pendingCount} طلب معلق بانتظار المعالجة`,
        type: "system",
        time: new Date().toISOString(),
      });
    }
    setNotifEvents(events);
  }, [safeOrders, pendingCount]);

  const handleMarkAllRead = useCallback(() => {
    setNotifEvents([]);
  }, []);

  // Filter orders
  const filteredOrders = safeOrders.filter((o) => {
    if (statusFilter !== "all" && o.status !== statusFilter) return false;
    if (shopFilter !== "all") {
      const shopName = o.shopName || o.shopSlug || "";
      if (!shopName.includes(shopFilter)) return false;
    }
    if (search) {
      const s = search.toLowerCase();
      const searchable = `${o.id} ${o.customer?.name || ''} ${o.customer?.phone || ''} ${o.shopName} ${o.serviceType}`.toLowerCase();
      if (!searchable.includes(s)) return false;
    }
    // Date range filter
    if (!isInDateRange(o.createdAt)) return false;
    return true;
  });

  // Bulk actions
  const toggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);
  const toggleSelectAll = useCallback(() => {
    if (selectedIds.size === filteredOrders.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredOrders.map(o => o.id)));
    }
  }, [selectedIds.size, filteredOrders]);
  const applyBulkStatus = useCallback(async () => {
    if (!bulkStatus || selectedIds.size === 0) return;
    const promises = Array.from(selectedIds).map(id =>
      fetch(`/api/orders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: bulkStatus }),
      }).catch(() => null)
    );
    await Promise.all(promises);
    toast.success(`تم تحديث ${selectedIds.size} طلب`);
    setSelectedIds(new Set());
    setBulkStatus("");
    loadAll(false);
  }, [bulkStatus, selectedIds, loadAll]);

  const shops = globalStats?.shopStats || fallbackShops;
  const safeShops = Array.isArray(shops) ? shops : [];
  const filteredShops = safeShops.filter((s) => {
    if (!shopSearch) return true;
    const q = shopSearch.toLowerCase();
    return (s.name || "").toLowerCase().includes(q) || (s.slug || "").toLowerCase().includes(q);
  });

  // Status timeline for order detail
  const statusTimeline = selectedOrder ? [
    { key: "pending", label: "تم الاستلام", time: selectedOrder.createdAt },
    { key: "confirmed", label: "تم التأكيد", time: null },
    { key: "printing", label: "جاري الطباعة", time: null },
    { key: "ready", label: "جاهز للتسليم", time: null },
    { key: "delivered", label: "تم التسليم", time: null },
  ] : [];
  const currentStatusIdx = selectedOrder ? statusTimeline.findIndex(s => s.key === selectedOrder.status) : -1;

  // Login gate
  if (!authenticated) {
    return <LoginGate onUnlock={() => setAuthenticated(true)} />;
  }

  if (!mounted) return <div className="min-h-screen bg-background" />;

  const tabLabels: Record<string, string> = {
    overview: "نظرة عامة",
    shops: "المتاجر",
    orders: "الطلبات",
    settings: "الإعدادات",
    security: "الأمان",
    platform: "إعدادات المنصة",
  };

  return (
    <AdminErrorBoundary>
    <div className="min-h-screen bg-background flex flex-col admin-pattern-bg" dir="rtl">
      {/* Refresh progress bar + data freshness indicator */}
      {isRefreshing && (
        <div className="h-0.5 w-full bg-muted overflow-hidden">
          <div className="h-full w-1/2 bg-primary animate-admin-progress rounded-full" />
        </div>
      )}
      {!isRefreshing && lastUpdated && (
        <div className="overflow-hidden">
          <div className="freshness-bar" key={lastUpdated} />
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-50 admin-header-glass">
        <div className="flex items-center gap-3 px-4 py-3 flex-wrap">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {platformLogo ? (
              <img src={platformLogo} alt={platformName} className="w-8 h-8 rounded-lg shrink-0 object-cover dark:hidden" />
            ) : (
              <img src="/tayf-logo-sm.png" alt={platformName} className="w-8 h-8 rounded-lg shrink-0 dark:hidden" />
            )}
            <div className="min-w-0">
              <h1 className="text-sm font-semibold text-foreground truncate">
                {tabLabels[activeTab] || "لوحة التحكم"}
              </h1>
              <p className="text-xs text-muted-foreground truncate">
                <span className="text-gradient-platform font-semibold">{platformName}</span>{" / "}{tabLabels[activeTab] || "نظرة عامة"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            {/* Notification Center */}
            <AdminNotificationCenter
              pendingCount={pendingCount}
              events={notifEvents}
              onMarkAllRead={handleMarkAllRead}
            />
            {/* Data health indicator */}
            {dataHealth.status !== 'healthy' && (
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground admin-tooltip" data-tip={dataHealth.message}>
                <span className={cn("health-dot", dataHealth.status)} />
                {dataHealth.status === 'warning' && <AlertTriangle className="h-3 w-3 text-amber-500" />}
                {dataHealth.status === 'error' && <Info className="h-3 w-3 text-red-500" />}
              </div>
            )}
            <ThemeToggle />
            {/* PDF Report button */}
            <a
              href="/api/admin/pdf-report"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg p-2.5 text-sm transition-colors admin-tooltip"
              data-tip="تقرير PDF للإحصائيات"
              title="تقرير إحصائيات"
            >
              <FileText className="h-4 w-4" />
            </a>
            <button
              onClick={() => setCreateOpen(true)}
              className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium transition-colors flex items-center gap-1.5"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">إنشاء متجر</span>
            </button>
            <button
              onClick={() => loadAll(false)}
              className="text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg p-2.5 text-sm transition-colors"
              title="تحديث"
            >
              <RefreshCw className={cn("h-4 w-4", (loading || refreshing) && "animate-spin")} />
            </button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="border-b border-border bg-card/50">
        <div className="px-4 flex items-center gap-1 overflow-x-auto">
          {["overview", "shops", "orders", "settings", "security", "platform"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "relative px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap",
                activeTab === tab
                  ? "bg-background text-foreground border-b-2 border-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              {tabLabels[tab]}
              {tab === "orders" && safeOrders.filter(o => o.status === "pending").length > 0 && (
                <span className="absolute -top-0.5 left-1 min-w-[16px] h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center px-1 badge-pulse">
                  {safeOrders.filter(o => o.status === "pending").length}
                </span>
              )}
            </button>
          ))}
          <div className="flex-1" />
          {lastUpdated && (
            <span className="text-[10px] text-muted-foreground py-2.5 whitespace-nowrap">
              آخر تحديث: {lastUpdated}
            </span>
          )}
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 p-4 space-y-4 tab-content-enter" key={activeTab}>
        {loadError && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-4 text-sm text-destructive flex items-center gap-2">
            <Shield className="h-4 w-4 shrink-0" />
            <span>{loadError}</span>
            <button onClick={() => loadAll()} className="mr-auto text-xs underline">إعادة المحاولة</button>
          </div>
        )}

        {/* ====== Skeleton state for initial load ====== */}
        {isInitialLoading && activeTab === "overview" && (
          <div className="space-y-4">
            {/* 4 skeleton KPI cards with improved shimmer */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded-xl border border-border bg-card p-4 space-y-3 overflow-hidden">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="h-7 w-16 skeleton-improved rounded-lg" />
                      <div className="h-3 w-24 skeleton-improved rounded-lg" />
                    </div>
                    <div className="w-10 h-10 rounded-lg skeleton-improved" />
                  </div>
                </div>
              ))}
            </div>
            {/* Skeleton for recent orders */}
            <div className="rounded-xl border border-border bg-card">
              <div className="p-4 border-b border-border flex items-center justify-between">
                <div className="h-4 w-24 skeleton-improved rounded-lg" />
                <div className="h-3 w-16 skeleton-improved rounded-lg" />
              </div>
              <div className="divide-y divide-border">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="p-3 flex items-center gap-3">
                    <div className="h-5 w-16 skeleton-improved rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-3/4 skeleton-improved rounded-lg" />
                      <div className="h-3 w-1/2 skeleton-improved rounded-lg" />
                    </div>
                    <div className="h-3 w-14 skeleton-improved rounded-lg" />
                  </div>
                ))}
              </div>
            </div>
            {/* Skeleton for shops list */}
            <div className="rounded-xl border border-border bg-card">
              <div className="p-4 border-b border-border flex items-center justify-between">
                <div className="h-4 w-20 skeleton-improved rounded-lg" />
                <div className="h-3 w-16 skeleton-improved rounded-lg" />
              </div>
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="rounded-xl border border-border p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg skeleton-improved" />
                      <div className="space-y-2 flex-1">
                        <div className="h-4 w-28 skeleton-improved rounded-lg" />
                        <div className="h-3 w-20 skeleton-improved rounded-lg" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {isInitialLoading && activeTab === "shops" && (
          <div className="space-y-4">
            <div className="h-10 w-full max-w-md bg-muted animate-pulse rounded-lg" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="rounded-xl border border-border p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-muted animate-pulse" />
                    <div className="space-y-2 flex-1">
                      <div className="h-4 w-28 bg-muted animate-pulse rounded-lg" />
                      <div className="h-3 w-20 bg-muted animate-pulse rounded-lg" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {isInitialLoading && activeTab === "orders" && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="h-10 flex-1 min-w-[200px] bg-muted animate-pulse rounded-lg" />
              <div className="h-10 w-36 bg-muted animate-pulse rounded-lg" />
              <div className="h-10 w-40 bg-muted animate-pulse rounded-lg" />
            </div>
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">الزبون</TableHead>
                    <TableHead className="text-right">الخدمة</TableHead>
                    <TableHead className="text-right">المتجر</TableHead>
                    <TableHead className="text-right">الحالة</TableHead>
                    <TableHead className="text-right">التاريخ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><div className="h-4 w-24 bg-muted animate-pulse rounded-lg" /></TableCell>
                      <TableCell><div className="h-4 w-20 bg-muted animate-pulse rounded-lg" /></TableCell>
                      <TableCell><div className="h-4 w-16 bg-muted animate-pulse rounded-lg" /></TableCell>
                      <TableCell><div className="h-5 w-14 bg-muted animate-pulse rounded-lg" /></TableCell>
                      <TableCell><div className="h-3 w-14 bg-muted animate-pulse rounded-lg" /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {/* ====== Loaded content (only show when NOT in initial load) ====== */}
        {!isInitialLoading && activeTab === "overview" && (
          <OverviewTab
            stats={globalStats}
            lastUpdated={lastUpdated}
            onOpenCreate={() => setCreateOpen(true)}
            adminName=""
            onRefresh={() => loadAll(false)}
            onExport={() => {
              const csv = filteredOrders.map(o =>
                `${o.customer?.name || ""},${o.serviceName || o.serviceType || ""},${o.shopName || ""},${STATUS_META[o.status as keyof typeof STATUS_META]?.label || o.status},${o.total || 0},${formatDA(o.createdAt)}`
              ).join("\n");
              const header = "الزبون,الخدمة,المتجر,الحالة,المبلغ,التاريخ";
              const blob = new Blob(["\ufeff" + header + "\n" + csv], { type: "text/csv;charset=utf-8" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `orders-${new Date().toISOString().slice(0, 10)}.csv`;
              a.click();
              URL.revokeObjectURL(url);
              toast.success("تم تصدير الطلبات");
            }}
            onSwitchToSettings={() => setActiveTab("settings")}
          />
        )}

        {/* Shops Tab */}
        {!isInitialLoading && activeTab === "shops" && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={shopSearch}
                  onChange={(e) => setShopSearch(e.target.value)}
                  placeholder="بحث عن متجر..."
                  className="pr-10"
                />
              </div>
            </div>
            {safeShops.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredShops.map((shop) => (
                  <ShopManageCard key={shop.slug} shop={shop} onCopyLink={(slug) => { navigator.clipboard.writeText(`https://tayf-saas.vercel.app/s/${slug}`); toast.success('تم نسخ رابط المتجر'); }} onCopyAdminLink={(slug) => { navigator.clipboard.writeText(`https://tayf-saas.vercel.app/s/${slug}?admin=1`); toast.success('تم نسخ رابط الإدارة'); }} onRefresh={() => loadAll(false)} />
                ))}
              </div>
            ) : (
              <div className="rounded-xl border-2 border-dashed border-primary/30 bg-primary/[0.03] p-12 flex flex-col items-center justify-center text-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Store className="h-8 w-8 text-primary" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-semibold text-foreground">
                    لم تنشئ أي متجر بعد
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-sm">
                    ابدأ بإنشاء متجرك الأول وابدأ بإدارة طلباتك بسهولة
                  </p>
                </div>
                <button
                  onClick={() => setCreateOpen(true)}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg px-6 py-2.5 text-sm font-medium transition-colors flex items-center gap-2 mt-2"
                >
                  <Plus className="h-4 w-4" />
                  إنشاء متجر جديد
                </button>
              </div>
            )}
          </div>
        )}

        {/* Orders Tab */}
        {!isInitialLoading && activeTab === "orders" && (
          <div className="space-y-4">
            {/* Filters + count + export */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="بحث بالاسم أو الهاتف..."
                  className="pr-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="الحالة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الحالات</SelectItem>
                  {Object.entries(STATUS_META).map(([key, meta]) => (
                    <SelectItem key={key} value={key}>{meta.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={shopFilter} onValueChange={setShopFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="المتجر" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع المتاجر</SelectItem>
                  {safeShops.map((s) => (
                    <SelectItem key={s.slug} value={s.name || s.slug}>{s.name || s.slug}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {/* Date range filter */}
              <div className="relative">
                <button
                  onClick={() => setShowDateFilter(!showDateFilter)}
                  className={cn(
                    "h-10 px-3 rounded-lg border text-sm flex items-center gap-1.5 transition-colors",
                    dateFilter !== "all"
                      ? "border-primary/50 bg-primary/5 text-primary"
                      : "border-border bg-card hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Calendar className="h-4 w-4" />
                  <span className="hidden sm:inline">
                    {dateFilter === "all" ? "الفترة" : dateFilter === "today" ? "اليوم" : dateFilter === "week" ? "هذا الأسبوع" : dateFilter === "month" ? "هذا الشهر" : "مخصص"}
                  </span>
                </button>
                {showDateFilter && (
                  <div className="absolute top-full mt-1 right-0 z-50 rounded-xl border border-border bg-card shadow-lg p-3 min-w-[200px] date-filter-popup">
                    <div className="space-y-1.5">
                      {[
                        { key: "all" as const, label: "جميع الأوقات", icon: "∞" },
                        { key: "today" as const, label: "اليوم", icon: "☀" },
                        { key: "week" as const, label: "آخر 7 أيام", icon: "📅" },
                        { key: "month" as const, label: "هذا الشهر", icon: "🗓" },
                        { key: "custom" as const, label: "مخصص", icon: "⚙" },
                      ].map(opt => (
                        <button
                          key={opt.key}
                          onClick={() => { setDateFilter(opt.key); if (opt.key !== "custom") setShowDateFilter(false); }}
                          className={cn(
                            "w-full text-right px-3 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors",
                            dateFilter === opt.key ? "bg-primary/10 text-primary font-medium" : "text-foreground hover:bg-muted/50"
                          )}
                        >
                          <span>{opt.icon}</span>
                          {opt.label}
                        </button>
                      ))}
                    </div>
                    {dateFilter === "custom" && (
                      <div className="mt-3 pt-3 border-t border-border space-y-2">
                        <div className="flex items-center gap-2">
                          <label className="text-xs text-muted-foreground whitespace-nowrap">من</label>
                          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="flex-1 h-8 px-2 rounded-md border border-border bg-background text-sm" />
                        </div>
                        <div className="flex items-center gap-2">
                          <label className="text-xs text-muted-foreground whitespace-nowrap">إلى</label>
                          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="flex-1 h-8 px-2 rounded-md border border-border bg-background text-sm" />
                        </div>
                        <button onClick={() => setShowDateFilter(false)} className="w-full h-8 rounded-md bg-primary text-primary-foreground text-sm font-medium">
                          تطبيق
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
              {/* Export button */}
              <button
                onClick={() => {
                  const csv = filteredOrders.map(o => 
                    `${o.customer?.name || ""},${o.serviceName || o.serviceType || ""},${o.shopName || ""},${STATUS_META[o.status as keyof typeof STATUS_META]?.label || o.status},${o.total || 0},${formatDA(o.createdAt)}`
                  ).join("\n");
                  const header = "الزبون,الخدمة,المتجر,الحالة,المبلغ,التاريخ";
                  const blob = new Blob(["\ufeff" + header + "\n" + csv], { type: "text/csv;charset=utf-8" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `orders-${new Date().toISOString().slice(0, 10)}.csv`;
                  a.click();
                  URL.revokeObjectURL(url);
                  toast.success("تم تصدير الطلبات");
                }}
                className="h-10 px-3 rounded-lg border border-border bg-card hover:bg-muted/50 text-muted-foreground hover:text-foreground text-sm flex items-center gap-1.5 transition-colors"
                title="تصدير CSV"
              >
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">تصدير CSV</span>
              </button>
            </div>

            {/* Orders count bar */}
            {(statusFilter !== "all" || shopFilter !== "all" || search || dateFilter !== "all") && (
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span><span className="order-count-badge">{filteredOrders.length}</span> من <span className="order-count-badge">{safeOrders.length}</span> طلب</span>
                <button onClick={() => { setSearch(""); setStatusFilter("all"); setShopFilter("all"); setDateFilter("all"); setDateFrom(""); setDateTo(""); }} className="text-primary hover:underline">مسح الفلاتر</button>
              </div>
            )}

            {/* Bulk action bar */}
            {selectedIds.size > 0 && (
              <div className="rounded-xl border border-primary/30 bg-primary/5 p-3 flex items-center gap-3 flex-wrap bulk-action-bar">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <CheckSquare className="h-4 w-4 text-primary" />
                  <span>تم اختيار {selectedIds.size} طلب</span>
                </div>
                <div className="flex-1" />
                <select
                  value={bulkStatus}
                  onChange={(e) => setBulkStatus(e.target.value)}
                  className="h-8 px-3 rounded-lg border border-border bg-background text-sm"
                >
                  <option value="">تغيير الحالة إلى...</option>
                  {Object.entries(STATUS_META).map(([key, meta]) => (
                    <option key={key} value={key}>{meta.label}</option>
                  ))}
                </select>
                <button
                  onClick={applyBulkStatus}
                  disabled={!bulkStatus}
                  className="h-8 px-4 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium disabled:opacity-40 transition-colors"
                >
                  تطبيق
                </button>
                <button
                  onClick={() => { setSelectedIds(new Set()); setBulkStatus(""); }}
                  className="h-8 px-3 rounded-lg border border-border hover:bg-muted/50 text-muted-foreground text-sm transition-colors"
                >
                  إلغاء
                </button>
              </div>
            )}

            {/* Orders table */}
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10 text-center">
                        <button onClick={toggleSelectAll} className="p-1 rounded hover:bg-muted/80 transition-colors" title="تحديد الكل">
                          {selectedIds.size === filteredOrders.length && filteredOrders.length > 0
                            ? <Check className="h-4 w-4 text-primary" />
                            : <Square className="h-4 w-4 text-muted-foreground" />
                          }
                        </button>
                      </TableHead>
                      <TableHead className="text-right">الزبون</TableHead>
                      <TableHead className="text-right">الخدمة</TableHead>
                      <TableHead className="text-right">المتجر</TableHead>
                      <TableHead className="text-right">الحالة</TableHead>
                      <TableHead className="text-right">المبلغ</TableHead>
                      <TableHead className="text-right">التاريخ</TableHead>
                      <TableHead className="text-right">إجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrders.map((order) => (
                      <TableRow
                        key={order.id}
                        onClick={() => setSelectedOrder(order)}
                        className={cn(
                          "cursor-pointer hover:bg-muted/50 table-row-hover table-row-highlight order-row-accent",
                          `status-${order.status}`,
                          selectedIds.has(order.id) && "row-selected"
                        )}
                      >
                        <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => toggleSelect(order.id)}
                            className={cn(
                              "p-1 rounded transition-colors",
                              selectedIds.has(order.id) ? "text-primary" : "text-muted-foreground hover:text-foreground"
                            )}
                          >
                            {selectedIds.has(order.id)
                              ? <Check className="h-4 w-4" />
                              : <Square className="h-4 w-4" />
                            }
                          </button>
                        </TableCell>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {order.customer?.name || "—"}
                            {order.customer?.phone && (
                              <span className="text-[10px] text-muted-foreground" dir="ltr">{order.customer.phone}</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="overflow-marquee inline-block max-w-[120px]" title={order.serviceName || order.serviceType || ""}>
                            {order.serviceName || order.serviceType || "—"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs text-muted-foreground overflow-marquee inline-block max-w-[100px]">
                            {order.shopName || order.shopSlug || "—"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="status-dropdown-cell" onClick={(e) => e.stopPropagation()}>
                            <select
                              value={order.status}
                              onChange={(e) => changeOrderStatus(order.id, e.target.value)}
                              className={cn(
                                "order-status-transition",
                                STATUS_META[order.status as keyof typeof STATUS_META]?.color || ""
                              )}
                            >
                              {Object.entries(STATUS_META).map(([key, meta]) => (
                                <option key={key} value={key}>{meta.label}</option>
                              ))}
                            </select>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium tabular-nums text-sm">
                          <span className={cn(order.total > 0 && "revenue-gold")}>
                            {order.total ? `${order.total.toLocaleString("ar-DZ")} د.ج` : "—"}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          <div className="flex flex-col gap-0.5">
                            <span>{formatDA(order.createdAt)}</span>
                            <span className="text-[9px] text-muted-foreground/50" dir="ltr">
                              {new Date(order.createdAt).toLocaleTimeString("ar-DZ", { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => setSelectedOrder(order)}
                              className="p-1.5 rounded-md hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors"
                              title="عرض التفاصيل"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => setQuickViewOrder(order)}
                              className="p-1.5 rounded-md hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors"
                              title="عرض سريع"
                            >
                              <Zap className="h-3.5 w-3.5" />
                            </button>
                            <a
                              href={`/s/${order.shopSlug || "default"}?admin=1`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-md hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors"
                              title="فتح في لوحة المتجر"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <ArrowUpRight className="h-3.5 w-3.5" />
                            </a>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredOrders.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                          <div className="flex flex-col items-center gap-2">
                            <Package className="h-8 w-8 text-muted-foreground/30" />
                            <span>لا توجد طلبات</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === "settings" && (
          <div className="tab-content-enter">
            <SettingsTab />
          </div>
        )}

        {/* Security Tab */}
        {activeTab === "security" && (
          <div className="tab-content-enter">
            <SecurityTab />
          </div>
        )}

        {/* Platform Settings Tab */}
        {activeTab === "platform" && (
          <div className="tab-content-enter">
            <PlatformSettingsTab />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-border bg-card/50 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <p className="text-[10px] text-muted-foreground">
              {platformName} — لوحة الإدارة
            </p>
            {lastUpdated && (
              <span className="text-[9px] text-muted-foreground/50">•</span>
            )}
            {lastUpdated && (
              <span className="text-[9px] text-muted-foreground/50">
                v4.6
              </span>
            )}
            <span className={cn(
              "perf-indicator",
              safeOrders.length > 0 && (Date.now() - new Date(safeOrders[0]?.createdAt || 0).getTime()) < 300000 ? "perf-good" : "perf-warn"
            )}>
              {safeOrders.length > 0 && (Date.now() - new Date(safeOrders[0]?.createdAt || 0).getTime()) < 300000 ? "● نشط" : "● خامد"}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[9px] text-muted-foreground/40 tabular-nums">
              {safeShops.length} متجر • {safeOrders.length} طلب
            </span>
            <div className="hidden lg:flex items-center gap-1.5">
              <span className="kbd-hint" title="تحديث">Alt+R</span>
              <span className="text-[8px] text-muted-foreground/30">تحديث</span>
              <span className="kbd-hint ml-1" title="تبويب">1-6</span>
              <span className="text-[8px] text-muted-foreground/30">تبويبات</span>
            </div>
            <button
              onClick={handleLogout}
              className="text-xs text-muted-foreground hover:text-destructive transition-colors flex items-center gap-1 hover:bg-destructive/5 px-2 py-1 rounded-md"
            >
              <Lock className="h-3 w-3" />
              تسجيل الخروج
            </button>
          </div>
        </div>
      </footer>

      {/* Create Shop Dialog */}
      <CreateShopDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={() => { setCreateOpen(false); loadAll(false); }}
      />

      {/* Order Detail Dialog — Enhanced with status timeline */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-lg p-0 gap-0 overflow-hidden dialog-slide-in" dir="rtl" onInteractOutside={(e) => e.preventDefault()}>
          <DialogTitle className="sr-only">تفاصيل الطلب</DialogTitle>
          {selectedOrder && (
            <div className="p-6">
              {/* Header with gradient */}
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-border">
                <div>
                  <h3 className="text-lg font-bold">تفاصيل الطلب</h3>
                  <p className="text-xs text-muted-foreground mt-0.5 font-mono">{selectedOrder.reference || selectedOrder.id}</p>
                </div>
                <Badge variant="outline" className={cn("status-pill-animated", STATUS_META[selectedOrder.status as keyof typeof STATUS_META]?.color)}>
                  {STATUS_META[selectedOrder.status as keyof typeof STATUS_META]?.label || selectedOrder.status}
                </Badge>
              </div>
              {/* Price highlight */}
              {selectedOrder.total > 0 && (
                <div className="mb-4 rounded-xl bg-gradient-to-l from-violet-500/10 to-blue-500/10 border border-violet-200/50 dark:border-violet-800/30 p-4 text-center">
                  <p className="text-xs text-muted-foreground mb-1">المبلغ الإجمالي</p>
                  <p className="text-2xl font-bold tabular-nums revenue-gold">{selectedOrder.total.toLocaleString("ar-DZ")} <span className="text-sm font-normal">د.ج</span></p>
                </div>
              )}
              {/* Status timeline */}
              <div className="mb-4 p-4 rounded-xl bg-muted/30 border border-border">
                <h4 className="text-xs font-semibold text-muted-foreground mb-3 flex items-center gap-1.5">
                  <Activity className="h-3.5 w-3.5" />
                  مسار الحالة
                </h4>
                <div className="flex items-start gap-0 order-timeline">
                  {statusTimeline.map((step, idx) => {
                    const isCompleted = idx <= currentStatusIdx;
                    const isCurrent = idx === currentStatusIdx;
                    return (
                      <div key={step.key} className="flex-1 flex flex-col items-center relative">
                        <div className={cn(
                          "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all duration-300 order-timeline-dot",
                          isCompleted ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                          isCurrent && "order-timeline-current ring-4 ring-primary/20"
                        )}>
                          {isCompleted ? "✓" : idx + 1}
                        </div>
                        <span className={cn(
                          "text-[9px] mt-1.5 text-center leading-tight whitespace-nowrap",
                          isCurrent ? "font-semibold text-primary" : isCompleted ? "text-foreground" : "text-muted-foreground/50"
                        )}>
                          {step.label}
                        </span>
                        {idx < statusTimeline.length - 1 && (
                          <div className={cn(
                            "absolute top-3 right-full w-full h-0.5 order-timeline-line",
                            idx < currentStatusIdx ? "bg-primary" : "bg-muted"
                          )} />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-muted/50 p-3 info-cell">
                    <p className="text-muted-foreground text-xs">الزبون</p>
                    <p className="font-medium mt-0.5">{selectedOrder.customer?.name || selectedOrder.customerName || "—"}</p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-3 info-cell">
                    <p className="text-muted-foreground text-xs">الهاتف</p>
                    <p className="font-medium mt-0.5" dir="ltr">{selectedOrder.customer?.phone || selectedOrder.customerPhone || "—"}</p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-3 info-cell">
                    <p className="text-muted-foreground text-xs">الخدمة</p>
                    <p className="font-medium mt-0.5">{selectedOrder.serviceName || selectedOrder.serviceType || "—"}</p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-3 info-cell">
                    <p className="text-muted-foreground text-xs">المتجر</p>
                    <p className="font-medium mt-0.5">{selectedOrder.shopName || selectedOrder.shopSlug || "—"}</p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-3 info-cell">
                    <p className="text-muted-foreground text-xs">تاريخ الإنشاء</p>
                    <p className="font-medium mt-0.5">{formatDA(selectedOrder.createdAt)}</p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-3 info-cell">
                    <p className="text-muted-foreground text-xs">معرف الطلب</p>
                    <p className="font-medium mt-0.5 font-mono text-xs">{selectedOrder.id.slice(0, 12)}...</p>
                  </div>
                </div>
              </div>
              {selectedOrder.notes && (
                <div className="mt-3 p-3 rounded-lg bg-muted">
                  <p className="text-muted-foreground text-xs mb-1">ملاحظات</p>
                  <p className="text-sm">{selectedOrder.notes}</p>
                </div>
              )}
              <div className="mt-4 flex gap-2">
                <a
                  href={`/s/${selectedOrder.shopSlug || "default"}?admin=1`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium text-center transition-colors flex items-center justify-center gap-1.5"
                >
                  <ExternalLink className="h-4 w-4" />
                  فتح في لوحة المتجر
                </a>
                <button
                  onClick={() => { navigator.clipboard.writeText(selectedOrder.reference || selectedOrder.id); toast.success("تم نسخ معرف الطلب"); }}
                  className="h-10 px-3 rounded-lg border border-border hover:bg-muted/50 text-muted-foreground hover:text-foreground text-sm transition-colors flex items-center gap-1.5"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Quick View Popover — compact order preview */}
      <Dialog open={!!quickViewOrder} onOpenChange={() => setQuickViewOrder(null)}>
        <DialogContent className="max-w-xs p-0 gap-0 overflow-hidden quick-view-dialog" dir="rtl" onInteractOutside={(e) => e.preventDefault()}>
          <DialogTitle className="sr-only">عرض سريع</DialogTitle>
          {quickViewOrder && (
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "w-2.5 h-2.5 rounded-full",
                    STATUS_META[quickViewOrder.status as keyof typeof STATUS_META]?.color?.replace('text-', 'bg-') || "bg-muted"
                  )} />
                  <span className="text-xs font-mono text-muted-foreground">{quickViewOrder.reference || quickViewOrder.id.slice(0, 10)}</span>
                </div>
                <button onClick={() => setQuickViewOrder(null)} className="p-1 rounded hover:bg-muted/80 text-muted-foreground">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">الزبون</span>
                  <span className="font-medium">{quickViewOrder.customer?.name || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">الهاتف</span>
                  <span className="font-medium font-mono text-xs" dir="ltr">{quickViewOrder.customer?.phone || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">الخدمة</span>
                  <span className="font-medium">{quickViewOrder.serviceName || quickViewOrder.serviceType || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">المتجر</span>
                  <span className="font-medium">{quickViewOrder.shopName || "—"}</span>
                </div>
                <div className="h-px bg-border" />
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">المبلغ</span>
                  <span className="font-bold tabular-nums revenue-gold">{quickViewOrder.total ? `${quickViewOrder.total.toLocaleString("ar-DZ")} د.ج` : "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">التاريخ</span>
                  <span className="text-xs">{formatDA(quickViewOrder.createdAt)}</span>
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => { setQuickViewOrder(null); setSelectedOrder(quickViewOrder); }}
                  className="flex-1 h-8 rounded-lg bg-primary text-primary-foreground text-xs font-medium flex items-center justify-center gap-1"
                >
                  <Eye className="h-3 w-3" />
                  تفاصيل كاملة
                </button>
                <a
                  href={`/s/${quickViewOrder.shopSlug || "default"}?admin=1`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-8 px-3 rounded-lg border border-border text-xs flex items-center justify-center gap-1 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                >
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Floating action button — Pending orders shortcut */}
      {safeOrders.filter(o => o.status === "pending").length > 0 && (
        <button
          onClick={() => { setActiveTab("orders"); setStatusFilter("pending"); }}
          className="fixed bottom-6 left-6 z-40 bg-amber-500 hover:bg-amber-600 text-white rounded-full w-14 h-14 shadow-lg shadow-amber-500/30 flex items-center justify-center transition-all duration-300 hover:scale-110 quick-action-float group"
          title={`${safeOrders.filter(o => o.status === "pending").length} طلب معلق`}
        >
          <Clock className="h-6 w-6 group-hover:animate-pulse" />
          <span className="absolute -top-1 -right-1 min-w-[20px] h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center px-1 badge-pulse">
            {safeOrders.filter(o => o.status === "pending").length}
          </span>
        </button>
      )}
    </div>
    </AdminErrorBoundary>
  );
}
