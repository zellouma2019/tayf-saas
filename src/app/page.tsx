"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Plus, Store, RefreshCw, Shield, Package, Clock,
  Search, ExternalLink, Trash2,
  Lock, Menu, Settings,
} from "lucide-react";
import { ThemeToggle } from "@/components/app/theme-toggle";
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
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  STATUS_META, formatDA,
} from "@/lib/print-config";
import { cn } from "@/lib/utils";
import type { GlobalStats, GlobalOrder, ShopStat } from "@/lib/admin-types";
import {
  isAuthenticated, verifySession, adminFetch,
  clearSession, setFaviconBadge,
} from "@/lib/admin-utils";
import { LoginGate } from "@/components/app/admin-login-gate";
import { ShopManageCard } from "@/components/app/admin-shop-card";
import { CreateShopDialog } from "@/components/app/admin-create-shop";

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
  const [activeTab, setActiveTab] = useState<"overview" | "shops" | "orders">("overview");
  const [shopSearch, setShopSearch] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<GlobalOrder | null>(null);
  // Platform settings
  const [platformLogo, setPlatformLogo] = useState("");
  const [platformLogoDark, setPlatformLogoDark] = useState("");
  const [platformName, setPlatformName] = useState("طيف");
  // Fallback shops
  const [fallbackShops, setFallbackShops] = useState<ShopStat[]>([]);

  // Load platform settings
  useEffect(() => {
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
    setLoadError("");
    try {
      const cacheBust = `&_=${Date.now()}`;
      const [statsRes, ordersRes] = await Promise.all([
        fetch(`/api/admin/global-stats${cacheBust}`),
        fetch(`/api/orders${cacheBust}`),
      ]);
      const statsData = await statsRes.json();
      const ordersData = await ordersRes.json();

      if (statsData.shops && Array.isArray(statsData.shops) && statsData.shops.length > 0) {
        setGlobalStats(statsData);
        setAllOrders(Array.isArray(statsData.orders) ? statsData.orders : []);
      } else {
        // Fallback: load shops separately
        const shopsRes = await fetch("/api/shops");
        const shops = await shopsRes.json();
        setFallbackShops(Array.isArray(shops) ? shops : []);
        setAllOrders(Array.isArray(ordersData.orders) ? ordersData.orders : (Array.isArray(ordersData) ? ordersData : []));
      }
      setLastUpdated(new Date().toLocaleTimeString("ar-SA"));
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "فشل في تحميل البيانات");
    } finally {
      setLoading(false);
    }
  }, []);

  // Load data after authentication
  useEffect(() => {
    if (authenticated) loadAll();
  }, [authenticated, loadAll]);

  // Set favicon badge
  useEffect(() => {
    if (globalStats?.orders) {
      const pending = globalStats.orders.filter((o: GlobalOrder) => o.status === "pending").length;
      setFaviconBadge(pending);
    }
  }, [globalStats]);

  // Handle logout
  function handleLogout() {
    clearSession();
    setAuthenticated(false);
    setGlobalStats(null);
    setAllOrders([]);
  }

  // Filter orders
  const safeOrders = Array.isArray(allOrders) ? allOrders : [];
  const filteredOrders = safeOrders.filter((o) => {
    if (statusFilter !== "all" && o.status !== statusFilter) return false;
    if (shopFilter !== "all") {
      const shopName = o.shopName || o.shopSlug || "";
      if (!shopName.includes(shopFilter)) return false;
    }
    if (search) {
      const s = search.toLowerCase();
      const searchable = `${o.id} ${o.customerName} ${o.customerPhone} ${o.shopName} ${o.serviceType}`.toLowerCase();
      if (!searchable.includes(s)) return false;
    }
    return true;
  });

  const shops = globalStats?.shops || fallbackShops;
  const safeShops = Array.isArray(shops) ? shops : [];
  const filteredShops = safeShops.filter((s) => {
    if (!shopSearch) return true;
    const q = shopSearch.toLowerCase();
    return (s.name || "").toLowerCase().includes(q) || (s.slug || "").toLowerCase().includes(q);
  });

  // Login gate
  if (!authenticated) {
    return <LoginGate onUnlock={() => setAuthenticated(true)} />;
  }

  if (!mounted) return <div className="min-h-screen bg-background" />;

  const tabLabels = {
    overview: "نظرة عامة",
    shops: "المتاجر",
    orders: "الطلبات",
  };

  return (
    <div className="min-h-screen bg-background flex flex-col" dir="rtl">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-md">
        <div className="flex items-center gap-3 px-4 py-3">
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
                {platformName} / {tabLabels[activeTab] || "نظرة عامة"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <ThemeToggle />
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
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            </button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="border-b border-border bg-card/50">
        <div className="px-4 flex items-center gap-1 overflow-x-auto">
          {(["overview", "shops", "orders"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap",
                activeTab === tab
                  ? "bg-background text-foreground border-b-2 border-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              {tabLabels[tab]}
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
      <main className="flex-1 p-4 space-y-4">
        {loadError && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-4 text-sm text-destructive flex items-center gap-2">
            <Shield className="h-4 w-4 shrink-0" />
            <span>{loadError}</span>
            <button onClick={() => loadAll()} className="mr-auto text-xs underline">إعادة المحاولة</button>
          </div>
        )}

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-4">
            {/* Stats cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { label: "إجمالي الطلبات", value: safeOrders.length, icon: Package, color: "text-blue-600" },
                { label: "المتاجر", value: safeShops.length, icon: Store, color: "text-emerald-600" },
                { label: "قيد الانتظار", value: safeOrders.filter(o => o.status === "pending").length, icon: Clock, color: "text-amber-600" },
                { label: "مكتمل", value: safeOrders.filter(o => o.status === "completed" || o.status === "delivered").length, icon: Shield, color: "text-violet-600" },
              ].map((card, i) => (
                <div key={i} className="rounded-xl border border-border bg-card p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold tabular-nums">{card.value}</div>
                      <div className="text-xs text-muted-foreground mt-1">{card.label}</div>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                      <card.icon className={cn("h-5 w-5", card.color)} />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Recent orders */}
            <div className="rounded-xl border border-border bg-card">
              <div className="p-4 border-b border-border flex items-center justify-between">
                <h2 className="text-sm font-semibold">أحدث الطلبات</h2>
                <button onClick={() => setActiveTab("orders")} className="text-xs text-primary hover:underline">
                  عرض الكل
                </button>
              </div>
              <div className="divide-y divide-border">
                {safeOrders.slice(0, 10).map((order) => (
                  <div
                    key={order.id}
                    onClick={() => setSelectedOrder(order)}
                    className="p-3 hover:bg-muted/50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px] px-2 py-0",
                          STATUS_META[order.status as keyof typeof STATUS_META]?.color || ""
                        )}
                      >
                        {STATUS_META[order.status as keyof typeof STATUS_META]?.label || order.status}
                      </Badge>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">
                          {order.customerName || "زبون"} — {order.serviceType || "خدمة"}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {order.shopName || order.shopSlug || "متجر"} • {order.id}
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatDA(order.createdAt)}
                      </div>
                    </div>
                  </div>
                ))}
                {safeOrders.length === 0 && !loading && (
                  <div className="p-8 text-center text-muted-foreground text-sm">
                    لا توجد طلبات حالياً
                  </div>
                )}
              </div>
            </div>

            {/* Shops list */}
            <div className="rounded-xl border border-border bg-card">
              <div className="p-4 border-b border-border flex items-center justify-between">
                <h2 className="text-sm font-semibold">المتاجر</h2>
                <button onClick={() => setActiveTab("shops")} className="text-xs text-primary hover:underline">
                  عرض الكل
                </button>
              </div>
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredShops.map((shop) => (
                  <ShopManageCard key={shop.slug} shop={shop} onCopyLink={(slug) => { navigator.clipboard.writeText(`https://tayf-saas.vercel.app/s/${slug}`); toast.success('تم نسخ رابط المتجر'); }} onCopyAdminLink={(slug) => { navigator.clipboard.writeText(`https://tayf-saas.vercel.app/s/${slug}?admin=1`); toast.success('تم نسخ رابط الإدارة'); }} onRefresh={() => loadAll(false)} />
                ))}
                {safeShops.length === 0 && !loading && (
                  <div className="col-span-full p-8 text-center text-muted-foreground text-sm">
                    لا توجد متاجر بعد — أنشئ أول متجر
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Shops Tab */}
        {activeTab === "shops" && (
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredShops.map((shop) => (
                <ShopManageCard key={shop.slug} shop={shop} onCopyLink={(slug) => { navigator.clipboard.writeText(`https://tayf-saas.vercel.app/s/${slug}`); toast.success('تم نسخ رابط المتجر'); }} onCopyAdminLink={(slug) => { navigator.clipboard.writeText(`https://tayf-saas.vercel.app/s/${slug}?admin=1`); toast.success('تم نسخ رابط الإدارة'); }} onRefresh={() => loadAll(false)} />
              ))}
            </div>
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === "orders" && (
          <div className="space-y-4">
            {/* Filters */}
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
            </div>

            {/* Orders table */}
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="overflow-x-auto">
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
                    {filteredOrders.map((order) => (
                      <TableRow
                        key={order.id}
                        onClick={() => setSelectedOrder(order)}
                        className="cursor-pointer hover:bg-muted/50"
                      >
                        <TableCell className="font-medium">{order.customerName || "—"}</TableCell>
                        <TableCell>{order.serviceType || "—"}</TableCell>
                        <TableCell>{order.shopName || order.shopSlug || "—"}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={cn("text-[10px]", STATUS_META[order.status as keyof typeof STATUS_META]?.color)}>
                            {STATUS_META[order.status as keyof typeof STATUS_META]?.label || order.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{formatDA(order.createdAt)}</TableCell>
                      </TableRow>
                    ))}
                    {filteredOrders.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          لا توجد طلبات
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-border bg-card/50 px-4 py-3 flex items-center justify-between">
        <p className="text-[10px] text-muted-foreground">
          {platformName} — لوحة الإدارة
        </p>
        <button
          onClick={handleLogout}
          className="text-xs text-muted-foreground hover:text-destructive transition-colors flex items-center gap-1"
        >
          <Lock className="h-3 w-3" />
          تسجيل الخروج
        </button>
      </footer>

      {/* Create Shop Dialog */}
      <CreateShopDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={() => { setCreateOpen(false); loadAll(false); }}
      />

      {/* Order Detail Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-lg p-0 gap-0 overflow-hidden" dir="rtl" onInteractOutside={(e) => e.preventDefault()}>
          <DialogTitle className="sr-only">تفاصيل الطلب</DialogTitle>
          {selectedOrder && (
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold">تفاصيل الطلب</h3>
                <Badge variant="outline" className={cn(STATUS_META[selectedOrder.status as keyof typeof STATUS_META]?.color)}>
                  {STATUS_META[selectedOrder.status as keyof typeof STATUS_META]?.label || selectedOrder.status}
                </Badge>
              </div>
              <div className="space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-muted-foreground">الزبون</p>
                    <p className="font-medium">{selectedOrder.customerName || "—"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">الهاتف</p>
                    <p className="font-medium" dir="ltr">{selectedOrder.customerPhone || "—"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">الخدمة</p>
                    <p className="font-medium">{selectedOrder.serviceType || "—"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">المتجر</p>
                    <p className="font-medium">{selectedOrder.shopName || selectedOrder.shopSlug || "—"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">رقم الطلب</p>
                    <p className="font-medium font-mono">{selectedOrder.id}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">التاريخ</p>
                    <p className="font-medium">{formatDA(selectedOrder.createdAt)}</p>
                  </div>
                </div>
                {selectedOrder.notes && (
                  <div className="mt-3 p-3 rounded-lg bg-muted">
                    <p className="text-muted-foreground text-xs mb-1">ملاحظات</p>
                    <p className="text-sm">{selectedOrder.notes}</p>
                  </div>
                )}
              </div>
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
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
