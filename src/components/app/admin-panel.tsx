"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { shopApi } from "@/lib/shop-api";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Package,
  DollarSign,
  TrendingUp,
  Clock,
  Search,
  MoreHorizontal,
  RefreshCw,
  Inbox,
  Settings,
  ListOrdered,
  ChevronLeft,
  FileText,
  Download,
  BarChart3,
  Trash2,
  Table2,
  Users,
  Bell,
  Wallet,
  Copy,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";
import {
  STATUS_META,
  STATUS_FLOW,
  formatDA,
  formatDateTimeAr,
} from "@/lib/print-config";
import type { PrintOrderLite } from "@/lib/order-types";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/lib/store";
import { OrderDetailsRow } from "@/components/app/order-details-row";
import { OrderDetailModal } from "@/components/app/order-detail-modal";
import { PageSkeleton } from "@/components/app/page-skeleton";
import {
  translateOptionKey,
  translateOptionValue,
  HIDDEN_OPTION_KEYS,
} from "@/lib/option-translations";

// Dynamic imports for heavy tab components
const AdminSettings = dynamic(() => import("@/components/app/admin-settings").then(m => ({ default: m.AdminSettings })), {
  ssr: false, loading: () => <PageSkeleton />,
});
const AdminAnalytics = dynamic(() => import("@/components/app/admin-analytics").then(m => ({ default: m.AdminAnalytics })), {
  ssr: false, loading: () => <PageSkeleton />,
});
const AdminCustomers = dynamic(() => import("@/components/app/admin-customers").then(m => ({ default: m.AdminCustomers })), {
  ssr: false, loading: () => <PageSkeleton />,
});
const KanbanBoard = dynamic(() => import("@/components/app/kanban-board").then(m => ({ default: m.KanbanBoard })), {
  ssr: false, loading: () => <PageSkeleton />,
});
const AdminExpenses = dynamic(() => import("@/components/app/admin-expenses").then(m => ({ default: m.AdminExpenses })), {
  ssr: false, loading: () => <PageSkeleton />,
});
const AdminShortcuts = dynamic(() => import("@/components/app/admin-shortcuts").then(m => ({ default: m.AdminShortcuts })), {
  ssr: false, loading: () => <PageSkeleton />,
});

interface Notification {
  id: string;
  type: "new_order" | "status_change" | "stale_order" | "system";
  title: string;
  body: string;
  orderId?: string;
  read: boolean;
  createdAt: string;
}

/// هل الملف من نوع صورة؟
function isImageFile(fileType: string | null): boolean {
  if (!fileType) return false;
  const t = fileType.toUpperCase();
  return ["JPG", "JPEG", "PNG", "WEBP", "GIF"].includes(t);
}

/// هل الملف PDF؟
function isPdfFile(fileType: string | null): boolean {
  if (!fileType) return false;
  return fileType.toUpperCase() === "PDF";
}

/// تنزيل ملف من رابط
function downloadFile(url: string, fileName: string) {
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

interface AdminStats {
  totalOrders: number;
  totalRevenue: number;
  totalExpenses: number;
  profit: number;
  todayOrders: number;
  statusCounts: Record<string, number>;
  serviceCounts: { serviceType: string; count: number; revenue: number }[];
  recentOrders: PrintOrderLite[];
}

interface AdminPanelProps {
  onRefresh: () => void;
}

const SERVICE_EMOJI: Record<string, string> = {
  document: "🖨️",
  photo: "🖼️",
  binding: "📚",
  copy: "📄",
  card: "🪪",
  poster: "📜",
};

export function AdminPanel({ onRefresh: _onRefresh }: AdminPanelProps) {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [orders, setOrders] = useState<PrintOrderLite[]>([]);
  const [loading, setLoading] = useState(true);
  const adminCode = useAppStore((s) => s.adminCode);
  const adminHeadersRef = useRef<Record<string, string>>({ "x-admin-code": adminCode });
  useEffect(() => { adminHeadersRef.current = { "x-admin-code": adminCode }; }, [adminCode]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [batchStatusLoading, setBatchStatusLoading] = useState(false);
  const [detailOrder, setDetailOrder] = useState<PrintOrderLite | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotif, setShowNotif] = useState(false);
  const [lastCheck] = useState(() => new Date().toISOString());
  const lastCheckRef = useRef(lastCheck);
  const notifRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState("orders");

  // ===== Polling notifications every 30s =====
  useEffect(() => {
    async function fetchNotifs() {
      try {
        const res = await fetch(`/api/notifications?since=${encodeURIComponent(lastCheckRef.current)}`, {
          headers: adminHeadersRef.current,
        });
        if (res.ok) {
          const data = await res.json();
          setNotifications((prev) => {
            const ids = new Set(prev.map((n) => n.id));
            const fresh = (data.notifications as Notification[]).filter((n) => !ids.has(n.id));
            return [...fresh, ...prev].slice(0, 30);
          });
          lastCheckRef.current = new Date().toISOString();
        }
      } catch {
        /* silent */
      }
    }
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 30_000);
    return () => clearInterval(interval);
  }, []);

  // Close notification dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotif(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  async function exportXLSX() {
    setExporting(true);
    try {
      const res = await shopApi("/api/orders/export", { method: "POST", headers: adminHeadersRef.current });
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "تقرير-الطلبات.xlsx";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("تم تصدير الملف بنجاح", {
        description: "ملف Excel يحتوي كل الطلبات والإحصائيات",
      });
    } catch {
      toast.error("فشل التصدير", { description: "جاري تجربة مرة أخرى..." });
    } finally {
      setExporting(false);
    }
  }

  // ===== إحصائيات: تُجلب عبر loadAll فقط (لا تكرار) =====

  function loadAll() {
    setLoading(true);
    Promise.all([
      shopApi("/api/admin/stats", { headers: adminHeadersRef.current }).then(async r => { if (!r.ok) return null; return r.json(); }).catch(() => null),
      shopApi("/api/orders").then((r) => r.json()).catch(() => ({ orders: [] })),
    ])
      .then(([s, o]) => {
        if (s && typeof s.totalOrders === 'number') setStats(s);
        const rawOrders = Array.isArray(o?.orders) ? o.orders : [];
        // تأمين بيانات العميل لكل طلب
        const safeOrders = rawOrders.map((order: Record<string, unknown>) => ({
          ...order,
          customer: order.customer && typeof order.customer === "object"
            ? { name: "", phone: "", deliveryMethod: "pickup", ...order.customer }
            : { name: "", phone: "", deliveryMethod: "pickup" },
        }));
        setOrders(safeOrders);
      })
      .catch((err) => {
        console.error("loadAll error:", err);
        setOrders([]);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadAll();
  }, []);

  // تصفية: حالة + بحث + تاريخ
  const filteredOrders = useMemo(() => {
    let list = orders;
    if (statusFilter !== "all") {
      list = list.filter((o) => o.status === statusFilter);
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (x) =>
          x.reference.toLowerCase().includes(q) ||
          (x.customer?.name || "").toLowerCase().includes(q) ||
          (x.customer?.phone || "").includes(q),
      );
    }
    if (dateFrom) {
      const from = new Date(dateFrom);
      from.setHours(0, 0, 0, 0);
      list = list.filter((o) => new Date(o.createdAt) >= from);
    }
    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999);
      list = list.filter((o) => new Date(o.createdAt) <= to);
    }
    return list;
  }, [orders, statusFilter, search, dateFrom, dateTo]);

  async function changeStatus(order: PrintOrderLite, status: string) {
    try {
      const res = await fetch(`/api/orders/${order.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...adminHeadersRef.current },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("فشل التحديث");
      toast.success("تم تحديث الحالة", {
        description: `${order.reference} → ${STATUS_META[status].label}`,
      });
      setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, status } : o)));
    } catch (e) {
      toast.error("خطأ", { description: (e as Error).message });
    }
  }

  async function cloneOrder(order: PrintOrderLite) {
    try {
      const payload = {
        serviceType: order.serviceType,
        fileName: order.fileName,
        fileType: order.fileType,
        fileSize: order.fileSize,
        fileData: order.fileData,
        smartAnalysis: order.smartAnalysis,
        options: order.options,
        customer: order.customer,
        delivery: order.delivery,
      };
      const res = await shopApi("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("فشل نسخ الطلب");
      toast.success("تم نسخ الطلب بنجاح");
      loadAll();
    } catch (e) {
      toast.error("خطأ في نسخ الطلب", { description: (e as Error).message });
    }
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selectedIds.size === filteredOrders.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredOrders.map((o) => o.id)));
    }
  }

  async function batchChangeStatus(status: string) {
    if (selectedIds.size === 0) return;
    setBatchStatusLoading(true);
    try {
      const ids = Array.from(selectedIds);
      await Promise.all(
        ids.map((id) =>
          fetch(`/api/orders/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json", ...adminHeadersRef.current },
            body: JSON.stringify({ action: "status", status }),
          }),
        ),
      );
      toast.success(`تم تغيير حالة ${ids.length} طلب إلى ${STATUS_META[status].label}`);
      setSelectedIds(new Set());
      loadAll();
    } catch (e) {
      toast.error("خطأ في تغيير الحالة", { description: (e as Error).message });
    } finally {
      setBatchStatusLoading(false);
    }
  }

  async function deleteSelected() {
    if (selectedIds.size === 0) return;
    setDeleting(true);
    try {
      const ids = Array.from(selectedIds);
      await Promise.all(ids.map((id) => fetch(`/api/orders/${id}`, { method: "DELETE", headers: adminHeadersRef.current })));
      toast.success("تم حذف الطلبات المحددة", { description: `${ids.length} طلب` });
      setSelectedIds(new Set());
      loadAll();
    } catch (e) {
      toast.error("خطأ في الحذف", { description: (e as Error).message });
    } finally {
      setDeleting(false);
    }
  }

  const statCards = [
    {
      title: "إجمالي الطلبات",
      value: stats?.totalOrders ?? 0,
      icon: Package,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      title: "إجمالي الإيرادات",
      value: formatDA(stats?.totalRevenue ?? 0),
      icon: DollarSign,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      title: "طلبات اليوم",
      value: stats?.todayOrders ?? 0,
      icon: TrendingUp,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
    {
      title: "قيد الطباعة",
      value: (stats?.statusCounts?.printing ?? 0) + (stats?.statusCounts?.pending ?? 0),
      icon: Clock,
      color: "text-rose-600",
      bg: "bg-rose-50",
    },
    {
      title: "صافي الربح",
      value: formatDA(stats?.profit ?? 0),
      icon: DollarSign,
      color: (stats?.profit ?? 0) >= 0 ? "text-emerald-700" : "text-red-600",
      bg: (stats?.profit ?? 0) >= 0 ? "bg-emerald-50" : "bg-red-50",
    },
  ];

  const quickFilters = [
    { value: "all", label: "الكل", count: stats?.totalOrders ?? 0 },
    { value: "pending", label: STATUS_META.pending.label, count: stats?.statusCounts?.pending ?? 0 },
    { value: "printing", label: STATUS_META.printing.label, count: stats?.statusCounts?.printing ?? 0 },
    { value: "ready", label: STATUS_META.ready.label, count: stats?.statusCounts?.ready ?? 0 },
    { value: "delivered", label: STATUS_META.delivered.label, count: stats?.statusCounts?.delivered ?? 0 },
  ];

  return (
    <div className="space-y-6">
      {/* بطاقات الإحصائيات */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4">
        {statCards.map((c, i) => (
          <Card key={i}>
            <CardContent className="p-3 md:p-5">
              <div className="flex items-start justify-between">
                <div className="min-w-0">
                  <div className="text-base md:text-2xl font-bold tabular-nums truncate">{c.value}</div>
                  <div className="text-xs md:text-xs text-muted-foreground mt-1">{c.title}</div>
                </div>
                <div className={`w-8 h-8 md:w-10 md:h-10 rounded-lg ${c.bg} flex items-center justify-center shrink-0`}>
                  <c.icon className={`h-4 w-4 md:h-5 md:w-5 ${c.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* اختصارات لوحة المفاتيح */}
      <AdminShortcuts
        onSearchFocus={() => {
          setActiveTab("orders");
          setTimeout(() => searchRef.current?.focus(), 100);
        }}
        onRefresh={loadAll}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
      <div className="text-[10px] text-muted-foreground/60 px-1 -mt-2 mb-2 hidden md:block">
        اختصارات: Ctrl+K بحث · 1-6 تبويبات · Ctrl+R تحديث
      </div>

      {/* التبويبات: الطلبات + الإعدادات */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6 max-w-3xl">
          <TabsTrigger value="orders" className="flex items-center gap-1.5 md:gap-2 text-xs md:text-sm">
            <ListOrdered className="h-4 w-4" />
            <span className="hidden sm:inline">الطلبات</span>
            <span className="sm:hidden">طلبات</span>
          </TabsTrigger>
          <TabsTrigger value="kanban" className="flex items-center gap-1.5 md:gap-2 text-xs md:text-sm">
            <Table2 className="h-4 w-4" />
            <span className="hidden sm:inline">سبورة الطلبات</span>
            <span className="sm:hidden">سبورة</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-1.5 md:gap-2 text-xs md:text-sm">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">التحليلات</span>
            <span className="sm:hidden">تحليلات</span>
          </TabsTrigger>
          <TabsTrigger value="customers" className="flex items-center gap-1.5 md:gap-2 text-xs md:text-sm">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">العملاء</span>
            <span className="sm:hidden">عملاء</span>
          </TabsTrigger>
          <TabsTrigger value="expenses" className="flex items-center gap-1.5 md:gap-2 text-xs md:text-sm">
            <Wallet className="h-4 w-4" />
            <span className="hidden sm:inline">المصاريف</span>
            <span className="sm:hidden">مصاريف</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-1.5 md:gap-2 text-xs md:text-sm">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">الإعدادات</span>
            <span className="sm:hidden">إعدادات</span>
          </TabsTrigger>
        </TabsList>

        {/* ===== تبويب الطلبات ===== */}
        <TabsContent value="orders" forceMount className={cn("space-y-3 mt-4", activeTab !== "orders" && "hidden")}>
          {/* صف الملخص */}
          <div className="flex items-center justify-between gap-2 px-1 text-xs">
            <div className="flex items-center gap-2 md:gap-3 min-w-0">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Package className="h-3.5 w-3.5" />
                الإجمالي:
                <span className="font-bold text-neutral-900 tabular-nums">
                  {stats?.totalOrders ?? 0}
                </span>
              </span>
              <span className="text-muted-foreground/40">|</span>
              <span className="text-muted-foreground">
                المعروض:
                <span className="font-bold text-neutral-900 tabular-nums mr-1">
                  {filteredOrders.length}
                </span>
              </span>
            </div>
            <span className="text-muted-foreground tabular-nums shrink-0 hidden sm:flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {stats?.todayOrders ?? 0} طلب اليوم
            </span>
            <button
              onClick={exportXLSX}
              disabled={exporting}
              className="flex items-center gap-1.5 text-xs font-medium text-emerald-700 hover:text-emerald-800 disabled:opacity-50 transition-colors px-2.5 py-1.5 rounded-lg hover:bg-emerald-50 border border-emerald-200 disabled:border-emerald-100"
              title="تصدير ملف Excel"
            >
              {exporting ? (
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Download className="h-3.5 w-3.5" />
              )}
              <span className="hidden sm:inline">تصدير Excel</span>
            </button>
          </div>

          {/* الفلاتر */}
          <div className="space-y-2.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
              <div className="relative sm:col-span-1">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  ref={searchRef}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="ابحث برقم الطلب أو اسم/هاتف العميل..."
                  className="pr-9 text-sm h-9"
                />
              </div>
              <div className="">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="text-sm h-9">
                    <SelectValue placeholder="كل الحالات" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">كل الحالات</SelectItem>
                    {STATUS_FLOW.map((s) => (
                      <SelectItem key={s} value={s}>
                        {STATUS_META[s].label}
                      </SelectItem>
                    ))}
                    <SelectItem value="cancelled">ملغي</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="relative">
                <label className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground flex items-center gap-1 pointer-events-none">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>من</span>
                </label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="text-sm h-9 pr-16"
                />
              </div>
              <div className="relative">
                <label className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground flex items-center gap-1 pointer-events-none">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>إلى</span>
                </label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="text-sm h-9 pr-16"
                />
              </div>
              <div className="flex gap-2 items-center">
                {/* جرس الإشعارات */}
                <div ref={notifRef} className="relative shrink-0">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setShowNotif((v) => !v)}
                    className="relative h-9 w-9"
                  >
                    <Bell className="h-4 w-4" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -left-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white leading-none">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                  </Button>
                  {showNotif && (
                    <div className="absolute top-full left-0 mt-1 z-50 w-72 sm:w-80 rounded-xl border bg-background shadow-lg animate-in fade-in slide-in-from-top-1 duration-200">
                      <div className="flex items-center justify-between px-3 py-2 border-b">
                        <span className="text-xs font-bold">الإشعارات</span>
                        {notifications.length > 0 && (
                          <button
                            onClick={() => {
                              setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
                            }}
                            className="text-[10px] text-muted-foreground hover:text-foreground"
                          >
                            تعيين الكل كمقروء
                          </button>
                        )}
                      </div>
                      <div className="max-h-80 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="py-8 text-center text-xs text-muted-foreground">لا توجد إشعارات</div>
                        ) : (
                          notifications.map((n) => (
                            <button
                              key={n.id}
                              onClick={() => {
                                if (n.orderId) {
                                  const found = orders.find((o) => o.id === n.orderId);
                                  if (found) setDetailOrder(found);
                                }
                                setShowNotif(false);
                              }}
                              className={cn(
                                "w-full text-right px-3 py-2.5 border-b last:border-b-0 hover:bg-muted/50 transition-colors",
                                !n.read && "bg-rose-50/40",
                              )}
                            >
                              <div className="flex items-start gap-2">
                                <span className="text-sm mt-0.5 shrink-0">
                                  {n.type === "new_order" ? "🆕" : n.type === "stale_order" ? "⏰" : "🔔"}
                                </span>
                                <div className="min-w-0 flex-1">
                                  <div className="text-xs font-bold text-foreground">{n.title}</div>
                                  <div className="text-xs text-muted-foreground mt-0.5 truncate">{n.body}</div>
                                  <div className="text-[10px] text-muted-foreground/60 mt-0.5">
                                    {formatDateTimeAr(n.createdAt)}
                                  </div>
                                </div>
                                {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0 mt-1.5" />}
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <Button variant="outline" size="icon" onClick={loadAll} className="shrink-0 h-9 w-9">
                  <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
                </Button>
              </div>
            </div>

            {/* شرائح التصفية السريعة */}
            <div className="flex items-center gap-1.5 overflow-x-auto custom-scroll pb-1 -mx-1 px-1">
              {quickFilters.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setStatusFilter(f.value)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all border shrink-0",
                    statusFilter === f.value
                      ? "bg-neutral-900 text-white border-neutral-900"
                      : "bg-background hover:bg-muted border-border text-foreground",
                  )}
                >
                  {f.label}
                  <span
                    className={cn(
                      "tabular-nums text-xs px-1.5 rounded-full",
                      statusFilter === f.value ? "bg-white/20" : "bg-muted",
                    )}
                  >
                    {f.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* جدول الطلبات - حاسوب */}
          <Card className="hidden md:block">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-sm md:text-base">
                  الطلبات ({filteredOrders.length}) — اضغط على أي طلب لعرض التفاصيل
                </CardTitle>
                {selectedIds.size > 0 && (
                  <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-2 duration-300">
                    <span className="text-xs text-muted-foreground">
                      {selectedIds.size} محدد
                    </span>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={deleteSelected}
                      disabled={deleting}
                      className="h-8 text-xs"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      {deleting ? "جارٍ الحذف..." : "حذف المحدد"}
                    </Button>
                    <Select onValueChange={batchChangeStatus} disabled={batchStatusLoading}>
                      <SelectTrigger className="h-8 text-xs w-auto min-w-[140px]">
                        <SelectValue placeholder={batchStatusLoading ? "جارٍ التغيير..." : "تغيير حالة المحدد"} />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_FLOW.map((s) => (
                          <SelectItem key={s} value={s}>
                            {STATUS_META[s].emoji} {STATUS_META[s].label}
                          </SelectItem>
                        ))}
                        <SelectItem value="cancelled">إلغاء الطلبات</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedIds(new Set())}
                      className="h-8 text-xs"
                    >
                      إلغاء التحديد
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="py-16 text-center text-muted-foreground text-sm">
                  <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2" />
                  جارٍ التحميل...
                </div>
              ) : filteredOrders.length === 0 ? (
                <div className="py-16 text-center">
                  <Inbox className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-sm text-muted-foreground">لا توجد طلبات</p>
                </div>
              ) : (
                <div className="overflow-x-auto custom-scroll">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/40">
                        <TableHead className="w-10 text-center">
                          <input
                            type="checkbox"
                            checked={selectedIds.size === filteredOrders.length && filteredOrders.length > 0}
                            onChange={toggleSelectAll}
                            className="w-4 h-4 rounded accent-rose-500 cursor-pointer"
                          />
                        </TableHead>
                        <TableHead className="text-right text-xs">رقم الطلب</TableHead>
                        <TableHead className="text-right text-xs">الخدمة</TableHead>
                        <TableHead className="text-right text-xs">العميل</TableHead>
                        <TableHead className="text-right text-xs hidden md:table-cell">الهاتف</TableHead>
                        <TableHead className="text-right text-xs hidden lg:table-cell">التفاصيل</TableHead>
                        <TableHead className="text-right text-xs">المجموع</TableHead>
                        <TableHead className="text-right text-xs hidden lg:table-cell">الربح</TableHead>
                        <TableHead className="text-right text-xs">الحالة</TableHead>
                        <TableHead className="text-right text-xs hidden sm:table-cell">التاريخ</TableHead>
                        <TableHead className="text-center text-xs w-10"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredOrders.map((o) => (
                        <OrderDetailsRow
                          key={o.id}
                          order={o}
                          onStatusChange={changeStatus}
                          onClone={() => cloneOrder(o)}
                          selected={selectedIds.has(o.id)}
                          onToggleSelect={() => toggleSelect(o.id)}
                          onClick={() => setDetailOrder(o)}
                        />
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* بطاقات الطلبات - جوال */}
          <Card className="md:hidden">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-sm">الطلبات ({filteredOrders.length})</CardTitle>
                {selectedIds.size > 0 ? (
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-muted-foreground">{selectedIds.size} محدد</span>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={deleteSelected}
                      disabled={deleting}
                      className="h-7 text-xs px-2"
                    >
                      <Trash2 className="h-3 w-3" />
                      حذف
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedIds(new Set())}
                      className="h-7 text-xs px-2"
                    >
                      إلغاء
                    </Button>
                  </div>
                ) : (
                  filteredOrders.length > 0 && (
                    <button
                      onClick={toggleSelectAll}
                      className="text-xs text-amber-600 font-medium"
                    >
                      تحديد الكل
                    </button>
                  )
                )}
              </div>
            </CardHeader>
            <CardContent className="p-3 space-y-2">
              {loading ? (
                <div className="py-10 text-center text-muted-foreground text-sm">
                  <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2" />
                  جارٍ التحميل...
                </div>
              ) : filteredOrders.length === 0 ? (
                <div className="py-10 text-center">
                  <Inbox className="h-10 w-10 mx-auto text-muted-foreground/50 mb-2" />
                  <p className="text-xs text-muted-foreground">لا توجد طلبات</p>
                </div>
              ) : (
                filteredOrders.map((o) => (
                  <MobileOrderCard
                    key={o.id}
                    order={o}
                    onStatusChange={changeStatus}
                    onClone={() => cloneOrder(o)}
                    selected={selectedIds.has(o.id)}
                    onToggleSelect={() => toggleSelect(o.id)}
                    onClick={() => setDetailOrder(o)}
                  />
                ))
              )}
            </CardContent>
          </Card>

        </TabsContent>

        {/* ===== تبويب سبورة الطلبات ===== */}
        <TabsContent value="kanban" forceMount className={cn("mt-4", activeTab !== "kanban" && "hidden")}>
          {loading ? (
            <div className="py-16 text-center text-muted-foreground text-sm">
              <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2" />
              جارٍ التحميل...
            </div>
          ) : (
            <KanbanBoard orders={filteredOrders} onStatusChange={changeStatus} onRefresh={loadAll} />
          )}
        </TabsContent>

        {/* ===== تبويب الإعدادات ===== */}
        <TabsContent value="settings" forceMount className={cn("mt-4", activeTab !== "settings" && "hidden")}>
          <AdminSettings />
        </TabsContent>

        {/* ===== تبويب التحليلات ===== */}
        <TabsContent value="analytics" forceMount className={cn("mt-4", activeTab !== "analytics" && "hidden")}>
          <AdminAnalytics stats={stats} orders={orders} />
        </TabsContent>

        {/* ===== تبويب العملاء ===== */}
        <TabsContent value="customers" forceMount className={cn("mt-4", activeTab !== "customers" && "hidden")}>
          <AdminCustomers />
        </TabsContent>

        {/* ===== تبويب المصاريف ===== */}
        <TabsContent value="expenses" forceMount className={cn("mt-4", activeTab !== "expenses" && "hidden")}>
          <AdminExpenses />
        </TabsContent>
      </Tabs>

      {/* نافذة تفاصيل الطلب */}
      <OrderDetailModal
        order={detailOrder}
        open={!!detailOrder}
        onClose={() => setDetailOrder(null)}
        onStatusChange={changeStatus}
      />
    </div>
  );
}

// ===== بطاقة طلب للجوال =====
function MobileOrderCard({
  order,
  onStatusChange,
  onClone,
  selected,
  onToggleSelect,
  onClick,
}: {
  order: PrintOrderLite;
  onStatusChange: (order: PrintOrderLite, status: string) => void;
  onClone?: () => void;
  selected: boolean;
  onToggleSelect: () => void;
  onClick?: (order: PrintOrderLite) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const meta = STATUS_META[order.status];
  const serviceEmoji = SERVICE_EMOJI[order.serviceType] || "🖨️";

  return (
    <div className={`rounded-xl border bg-card overflow-hidden transition-all ${selected ? "border-rose-400 bg-rose-50/30 ring-1 ring-rose-200" : ""}`}>
      {/* رأس البطاقة - قابل للنقر */}
      <div className="w-full p-3 flex items-start gap-2">
        {/* مربع الاختيار */}
        <input
          type="checkbox"
          checked={selected}
          onChange={(e) => { e.stopPropagation(); onToggleSelect(); }}
          className="w-5 h-5 rounded accent-rose-500 cursor-pointer shrink-0 mt-1"
        />
        {/* المحتوى القابل للنقر */}
      <button
        onClick={() => {
          if (onClick) onClick(order);
          else setExpanded(!expanded);
        }}
        className="flex-1 text-right hover:bg-muted/30 transition-colors -m-3 p-3"
      >
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xl shrink-0">{serviceEmoji}</span>
            <div className="min-w-0">
              <div className="font-mono text-xs font-bold text-neutral-900">{order.reference}</div>
              <div className="text-xs text-muted-foreground">{order.serviceName}</div>
            </div>
          </div>
          <span className={`text-xs px-2 py-0.5 rounded-full border shrink-0 ${meta.bg}`}>
            {meta.label}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="text-sm font-medium truncate">{order.customer?.name || "—"}</div>
            <div className="text-xs text-muted-foreground" dir="ltr">{order.customer?.phone || "—"}</div>
          </div>
          <div className="text-left shrink-0">
            <div className="font-bold text-amber-700 text-sm">{formatDA(order.total)}</div>
            <div className="text-xs text-muted-foreground">{order.pages}ص × {order.copies}ن</div>
          </div>
        </div>
        <div className="mt-2 pt-2 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground">
          <span>{formatDateTimeAr(order.createdAt)}</span>
          <span className={`flex items-center gap-1 text-amber-600 ${expanded ? "rotate-90" : ""} transition-transform`}>
            <ChevronLeft className="h-3 w-3" />
            {expanded ? "إخفاء" : "عرض التفاصيل"}
          </span>
        </div>
      </button>
      </div>

      {/* التفاصيل المنسدلة */}
      {expanded && (
        <div className="border-t bg-amber-50/40 p-3 space-y-3">
          {/* مواصفات الطباعة */}
          <div>
            <div className="text-xs font-bold text-neutral-700 mb-1.5">مواصفات الطباعة</div>
            <div className="grid grid-cols-2 gap-1.5">
              {Object.entries(order.options)
                .filter(([k, v]) => v !== undefined && v !== null && v !== "" && !HIDDEN_OPTION_KEYS.includes(k))
                .map(([k, v]) => (
                  <div key={k} className="rounded bg-white border border-amber-100 px-2 py-1">
                    <div className="text-xs text-muted-foreground">{translateOptionKey(k)}</div>
                    <div className="text-xs font-semibold text-neutral-900">{translateOptionValue(String(v))}</div>
                  </div>
                ))}
            </div>
          </div>

          {/* الملف + معاينة حقيقية */}
          {order.fileName && (
            <div>
              <div className="text-xs font-bold text-neutral-700 mb-1.5">ملف الزبون</div>
              <div className="rounded-lg bg-white border border-amber-100 p-2.5">
                <div className="flex items-start gap-2.5">
                  {/* معاينة الملف */}
                  <div className="shrink-0">
                    {isImageFile(order.fileType) && order.filePreview ? (
                      <div className="relative w-16 h-20 rounded-lg overflow-hidden border-2 border-amber-200 shadow-sm">
                        <img
                          src={order.filePreview}
                          alt={order.fileName}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : isPdfFile(order.fileType) && order.fileData ? (
                      <div className="relative w-16 h-20 rounded-lg overflow-hidden border-2 border-amber-200 shadow-sm bg-white">
                        <img
                          src={`/api/orders/${order.id}/thumbnail`}
                          alt={order.fileName}
                          className="w-full h-full object-contain bg-white"
                        />
                        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-0.5">
                          <span className="text-[8px] font-bold text-white">PDF</span>
                        </div>
                      </div>
                    ) : order.fileData && order.fileData.startsWith("file_") ? (
                      <div className="relative w-16 h-20 rounded-lg overflow-hidden border-2 border-amber-200 shadow-sm bg-neutral-50 flex items-center justify-center">
                        <div className="text-center">
                          <FileText className="h-5 w-5 text-amber-500 mx-auto" />
                          <span className="text-[8px] font-bold text-neutral-600 mt-0.5 block">{order.fileType}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="w-14 h-16 rounded-lg bg-neutral-900 flex flex-col items-center justify-center text-amber-400">
                        <FileText className="h-5 w-5" />
                        <span className="text-[9px] font-bold mt-0.5">{order.fileType}</span>
                      </div>
                    )}
                  </div>
                  {/* تفاصيل + زر */}
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium truncate break-all">{order.fileName}</div>
                    <div className="flex flex-wrap gap-1 mt-1 text-[10px]">
                      {order.fileType && (
                        <span className="px-1.5 py-0.5 rounded bg-amber-50 border border-amber-100 text-amber-700">
                          {order.fileType}
                        </span>
                      )}
                      {order.fileSize ? (
                        <span className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                          {Math.round(order.fileSize / 1024)} ك.ب
                        </span>
                      ) : null}
                      {order.fileData && (
                        <span className="px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-100 text-emerald-700">
                          ✓ متاح
                        </span>
                      )}
                    </div>
                    {order.fileData && (
                      <Button
                        size="sm"
                        className="mt-2 h-7 text-xs bg-neutral-900 hover:bg-neutral-800 text-white w-full"
                        onClick={() => downloadFile(`/api/orders/${order.id}/file`, order.fileName || "file")}
                      >
                        <Download className="h-3 w-3" />
                        تنزيل الملف الأصلي
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* معلومات العميل */}
          <div>
            <div className="text-xs font-bold text-neutral-700 mb-1.5">معلومات العميل</div>
            <div className="rounded bg-white border border-amber-100 p-2 space-y-1.5 text-xs">
              <div className="flex justify-between gap-2">
                <span className="text-muted-foreground">الاسم</span>
                <span className="font-medium">{order.customer?.name || "—"}</span>
              </div>
              <div className="flex justify-between gap-2" dir="ltr">
                <span className="text-muted-foreground">الهاتف</span>
                <span className="font-medium">{order.customer?.phone || "—"}</span>
              </div>
              {order.customer?.whatsapp && (
                <div className="flex justify-between gap-2" dir="ltr">
                  <span className="text-muted-foreground">واتساب</span>
                  <span className="font-medium">{order.customer.whatsapp}</span>
                </div>
              )}
              {order.customer?.email && (
                <div className="flex justify-between gap-2" dir="ltr">
                  <span className="text-muted-foreground">البريد</span>
                  <span className="font-medium">{order.customer.email}</span>
                </div>
              )}
              {order.customer?.address && (
                <div className="pt-1 border-t border-amber-50">
                  <span className="text-muted-foreground">العنوان: </span>
                  <span className="font-medium">{order.customer.address}</span>
                </div>
              )}
            </div>
          </div>

          {/* العميل والتسليم */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="rounded bg-white border border-amber-100 p-2">
              <div className="text-muted-foreground mb-0.5">الاستلام</div>
              <div className="font-medium">{order.customer?.deliveryMethod === "delivery" ? "توصيل" : "من المطبعة"}</div>
            </div>
            <div className="rounded bg-white border border-amber-100 p-2">
              <div className="text-muted-foreground mb-0.5">الوقت المتوقع</div>
              <div className="font-medium">{order.estimatedHours} ساعة</div>
            </div>
          </div>

          {/* ملاحظات */}
          {order.options.notes && (
            <div>
              <div className="text-xs font-bold text-neutral-700 mb-1">ملاحظات</div>
              <div className="rounded bg-white border border-amber-100 p-2 text-xs text-neutral-700 whitespace-pre-wrap">
                {order.options.notes}
              </div>
            </div>
          )}

          {/* أزرار */}
          <div className="grid grid-cols-3 gap-2 pt-1">
            <Button
              size="sm"
              variant="outline"
              className="text-sm h-9"
              onClick={() => { const s = useAppStore.getState().shopId; window.open(`/api/orders/${order.id}/invoice${s ? `?shopId=${encodeURIComponent(s)}` : ""}`, "_blank"); }}
            >
              <Download className="h-3.5 w-3.5" />
              الفاتورة
            </Button>
            {onClone && (
              <Button
                size="sm"
                variant="outline"
                className="text-sm h-9"
                onClick={(e) => { e.stopPropagation(); onClone(); }}
                title="نسخ الطلب"
              >
                <Copy className="h-3.5 w-3.5" />
                نسخ
              </Button>
            )}
            <ChangeStatusSelect order={order} onChange={onStatusChange} />
          </div>
        </div>
      )}
    </div>
  );
}

// قائمة تغيير الحالة للجوال
function ChangeStatusSelect({
  order,
  onChange,
}: {
  order: PrintOrderLite;
  onChange: (order: PrintOrderLite, status: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button size="sm" className="text-sm h-9 bg-neutral-900 hover:bg-neutral-800 text-white">
          <MoreHorizontal className="h-3.5 w-3.5" />
          تغيير الحالة
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-40">
        {STATUS_FLOW.filter((s) => s !== order.status).map((s) => (
          <DropdownMenuItem key={s} onClick={() => { onChange(order, s); setOpen(false); }}>
            <span className="mr-2">{STATUS_META[s].emoji}</span>
            {STATUS_META[s].label}
          </DropdownMenuItem>
        ))}
        <DropdownMenuItem onClick={() => { onChange(order, "cancelled"); setOpen(false); }}>
          إلغاء الطلب
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

