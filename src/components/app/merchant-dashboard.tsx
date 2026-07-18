"use client";

import dynamic from "next/dynamic";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useShop } from "@/lib/shop-context";
import {
  Package,
  Settings,
  Store,
  Link2,
  Eye,
  EyeOff,
  RefreshCw,
  Search,
  MoreHorizontal,
  Lock,
  ShieldCheck,
  AlertCircle,
  Copy,
  ExternalLink,
  Printer,
  Phone,
  Mail,
  MapPin,
  MessageCircle,
  User,
  Palette,
  Save,
  ChevronLeft,
  TrendingUp,
  DollarSign,
  Clock,
  Inbox,
  Download,
  FileText,
  Upload,
  X,
  Crown,
  QrCode,
  Trash2,
  CheckSquare,
  Check,
  CheckCircle2,
  LayoutGrid, Menu,
  ListChecks,
  Tag,
  StickyNote,
  SlidersHorizontal,
  Table2,
  Columns3,
  Plus,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Bell,
  BarChart3,
  Users,
  LogOut,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  Printer as PrinterIcon,
  BookOpen as BookOpenIcon,
  Scissors as ScissorsIcon,
  Palette as PaletteIcon,
  Image as ImageIcon,
  Tag as TagIcon,
  Layers as LayersIcon,
  PenTool as PenToolIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  STATUS_META,
  STATUS_FLOW,
  SERVICE_MAP,
  formatDA,
  formatDateTimeAr,
} from "@/lib/print-config";
import type { PrintOrderLite } from "@/lib/order-types";
import { printReceipt } from "@/lib/print-receipt";
import { DashboardSidebar, type SidebarSection } from "@/components/ui/dashboard-sidebar";
import { SHOP_THEMES } from "@/lib/themes";
import { type FeatureKey } from "@/lib/shop-features";

// Dynamic imports لتقليل استهلاك الذاكرة أثناء التجميع
const OrderDetailsRow = dynamic(() => import("@/components/app/order-details-row").then((m) => ({ default: m.OrderDetailsRow })), { ssr: false });
const AdminAnalytics = dynamic(() => import("@/components/app/admin-analytics").then((m) => ({ default: m.AdminAnalytics })), { ssr: false, loading: () => <div className="py-16 text-center text-slate-400 text-sm">جارٍ التحميل...</div> });
const MerchantOrderDetail = dynamic(() => import("@/components/app/merchant-order-detail").then((m) => ({ default: m.MerchantOrderDetail })), { ssr: false });
const MerchantSettingsAdvanced = dynamic(() => import("@/components/app/merchant-settings-advanced").then((m) => ({ default: m.MerchantSettingsAdvanced })), { ssr: false, loading: () => <div className="py-16 text-center text-slate-400 text-sm">جارٍ التحميل...</div> });
const MerchantCustomers = dynamic(() => import("@/components/app/merchant-customers").then((m) => ({ default: m.MerchantCustomers })), { ssr: false, loading: () => <div className="py-16 text-center text-slate-400 text-sm">جارٍ التحميل...</div> });
const MerchantExpenses = dynamic(() => import("@/components/app/merchant-expenses").then((m) => ({ default: m.MerchantExpenses })), { ssr: false, loading: () => <div className="py-16 text-center text-slate-400 text-sm">جارٍ التحميل...</div> });
const KanbanBoard = dynamic(() => import("@/components/app/kanban-board").then((m) => ({ default: m.KanbanBoard })), { ssr: false, loading: () => <div className="py-16 text-center text-slate-400 text-sm">جارٍ التحميل...</div> });
const MerchantAnalytics = dynamic(() => import("@/components/app/merchant-analytics").then((m) => ({ default: m.MerchantAnalytics })), { ssr: false, loading: () => <div className="py-16 text-center text-slate-400 text-sm">جارٍ التحميل...</div> });

// QRCode import خفيف
let QRCodeModule: typeof import("qrcode") | null = null;
async function getQRCode() {
  if (!QRCodeModule) QRCodeModule = await import("qrcode");
  return QRCodeModule;
}

// ===== الأنواع =====
interface AdminStats {
  totalOrders: number;
  totalRevenue: number;
  todayOrders: number;
  statusCounts: Record<string, number>;
  serviceCounts: { serviceType: string; count: number; revenue: number }[];
  recentOrders: PrintOrderLite[];
}

type MerchantTab = "home" | "orders" | "customers" | "expenses" | "analytics" | "settings" | "advancedSettings" | "share" | "preview";
type OrderViewMode = "table" | "kanban";

// ===== المكون الرئيسي =====
export function MerchantDashboard({ shopId, shopSlug }: { shopId: string; shopSlug: string }) {
  const { shop, hasFeature, refreshShop } = useShop();
  const [unlocked, setUnlocked] = useState(false);
  const [pin, setPin] = useState("");
  const verifiedPinRef = useRef("");
  const [pinError, setPinError] = useState(false);
  const [pinAttempts, setPinAttempts] = useState(0);
  const [verifying, setVerifying] = useState(false);
  const [activeTab, setActiveTab] = useState<MerchantTab>("home");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);

  // حالة الطلبات والإحصائيات
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [rawOrders, setRawOrders] = useState<PrintOrderLite[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortField, setSortField] = useState<string>("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [mobileSelectionMode, setMobileSelectionMode] = useState(false);
  const [viewMode, setViewMode] = useState<OrderViewMode>("table");
  const [selectedOrder, setSelectedOrder] = useState<PrintOrderLite | null>(null);
  const [pendingCount, setPendingCount] = useState(0);

  // استمرارية الجلسة — 7 أيام
  useEffect(() => {
    try {
      const raw = localStorage.getItem(`shop_auth_${shopSlug}`);
      if (raw) {
        const { ts, pin } = JSON.parse(raw);
        if (Date.now() - ts < 168 * 60 * 60 * 1000 && pin) {
          verifiedPinRef.current = pin;
          setUnlocked(true);
        } else {
          localStorage.removeItem(`shop_auth_${shopSlug}`);
        }
      }
    } catch {}
  }, [shopSlug]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const pendingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // جلب عدد الطلبات المعلقة
  const fetchPendingCount = useCallback(() => {
    fetch(`/api/orders/pending-count?shopId=${shopId}`)
      .then((r) => r.json())
      .then((d) => { if (typeof d.count === "number") setPendingCount(d.count); })
      .catch(() => {});
  }, [shopId]);

  useEffect(() => {
    fetchPendingCount();
    pendingIntervalRef.current = setInterval(fetchPendingCount, 30000);
    return () => {
      if (pendingIntervalRef.current) clearInterval(pendingIntervalRef.current);
    };
  }, [fetchPendingCount]);

  // فلترة + ترتيب الطلبات بالذاكرة
  const orders = useMemo(() => {
    let result = rawOrders;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (x) =>
          x.reference.toLowerCase().includes(q) ||
          x.customer.name.toLowerCase().includes(q) ||
          x.customer.phone.includes(search),
      );
    }
    // ترتيب
    result = [...result].sort((a, b) => {
      let cmp = 0;
      if (sortField === "date") cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      else if (sortField === "total") cmp = a.total - b.total;
      else if (sortField === "reference") cmp = a.reference.localeCompare(b.reference);
      else if (sortField === "status") cmp = (STATUS_META[a.status]?.step ?? 0) - (STATUS_META[b.status]?.step ?? 0);
      return sortDir === "desc" ? -cmp : cmp;
    });
    return result;
  }, [rawOrders, search, sortField, sortDir]);

  // حسابات الربح (قبل أي return مبكر)
  const totalCost = useMemo(() => rawOrders.reduce((s, o) => s + (o.cost || 0), 0), [rawOrders]);
  const totalProfit = (stats?.totalRevenue ?? 0) - totalCost;
  const todayOrdersList = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return rawOrders.filter((o) => new Date(o.createdAt) >= today);
  }, [rawOrders]);
  const todayRevenue = useMemo(() => todayOrdersList.reduce((s, o) => s + o.total, 0), [todayOrdersList]);
  const todayCost = useMemo(() => todayOrdersList.reduce((s, o) => s + (o.cost || 0), 0), [todayOrdersList]);

  // مساعد الترتيب
  function toggleSort(field: string) {
    if (sortField === field) setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    else { setSortField(field); setSortDir("desc"); }
  }
  function SortIcon({ field }: { field: string }) {
    if (sortField !== field) return <ArrowUpDown className="h-3 w-3 opacity-40" />;
    return sortDir === "desc" ? <ArrowDown className="h-3 w-3 text-teal-600" /> : <ArrowUp className="h-3 w-3 text-teal-600" />;
  }

  // اشتقاق الحالات المتاحة من STATUS_FLOW
  const bulkStatusOptions = useMemo(() => ["pending", "printing", "ready", "delivered"], []);

  const sidebarSections: SidebarSection[] = useMemo(() => {
    const dataSection: SidebarSection = {
      title: "البيانات",
      items: [
        { key: "customers", label: "العملاء", icon: User },
        { key: "expenses", label: "المصاريف", icon: FileText },
      ],
    };
    if (hasFeature("advancedAnalytics")) {
      dataSection.items.push({ key: "analytics", label: "التحليلات", icon: BarChart3 });
    }
    return [
      {
        title: "القائمة",
        items: [
          { key: "home", label: "الرئيسية", icon: LayoutGrid },
          { key: "orders", label: "الطلبات", icon: Package, badge: stats?.totalOrders || undefined },
          { key: "settings", label: "إعدادات المتجر", icon: Settings },
          { key: "advancedSettings", label: "إعدادات متقدمة", icon: SlidersHorizontal },
        ],
      },
      dataSection,
      {
        title: "أدوات",
        items: [
          { key: "share", label: "مشاركة الرابط", icon: Link2 },
          { key: "preview", label: "معاينة المتجر", icon: Eye },
        ],
      },
    ];
  }, [stats?.totalOrders, hasFeature]);

  function toggleSelectAll() {
    if (selectedIds.size === orders.length && orders.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(orders.map((o) => o.id)));
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

  async function bulkChangeStatus(newStatus: string) {
    if (selectedIds.size === 0 || bulkLoading) return;
    setBulkLoading(true);
    try {
      const res = await fetch(`/api/orders/bulk?shopId=${shopId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selectedIds), status: newStatus }),
      });
      if (!res.ok) throw new Error("فشل التحديث");
      toast.success("تم تحديث الحالة", {
        description: `${selectedIds.size} طلب ← ${STATUS_META[newStatus].label}`,
      });
      setSelectedIds(new Set());
      setMobileSelectionMode(false);
      loadAll();
    } catch (e) {
      toast.error("خطأ", { description: (e as Error).message });
    } finally {
      setBulkLoading(false);
    }
  }

  async function bulkDelete() {
    if (selectedIds.size === 0 || bulkLoading) return;
    setBulkDeleteOpen(true);
  }

  async function confirmBulkDelete() {
    setBulkLoading(true);
    setBulkDeleteOpen(false);
    try {
      const res = await fetch(`/api/orders/bulk?shopId=${shopId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selectedIds) }),
      });
      if (!res.ok) throw new Error("فشل الحذف");
      toast.success("تم حذف الطلبات", {
        description: `تم حذف ${selectedIds.size} طلب`,
      });
      setSelectedIds(new Set());
      setMobileSelectionMode(false);
      loadAll();
    } catch (e) {
      toast.error("خطأ", { description: (e as Error).message });
    } finally {
      setBulkLoading(false);
    }
  }

  function exportCSV() {
    if (orders.length === 0) return;
    const BOM = "\uFEFF";
    const header = "رقم الطلب,اسم العميل,الهاتف,الخدمة,الحالة,المجموع,التاريخ\n";
    const rows = orders.map((o) => {
      const customer = o.customer || {};
      const c = JSON.parse(JSON.stringify(customer));
      const name = String(c.name || "").replace(/,/g, ";");
      const phone = String(c.phone || "").replace(/,/g, ";");
      const service = String(o.serviceName || o.serviceType).replace(/,/g, ";");
      const status = STATUS_META[o.status]?.label || o.status;
      const total = o.total || 0;
      const date = formatDateTimeAr(o.createdAt).replace(/,/g, " ");
      return `${o.reference},${name},${phone},${service},${status},${total},${date}`;
    }).join("\n");
    const csv = BOM + header + rows;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const dateStr = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `orders-${shop?.slug || "export"}-${dateStr}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async function deleteOrder(id: string) {
    try {
      const res = await fetch(`/api/orders/${id}?shopId=${shopId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("فشل الحذف");
      toast.success("تم حذف الطلب");
      setSelectedOrder(null);
      loadAll();
    } catch (e) {
      toast.error("خطأ", { description: (e as Error).message });
    }
  }

  const loadAll = useCallback(() => {
    setLoading(true);
    setLoadError(null);
    Promise.all([
      fetch(`/api/admin/stats?shopId=${shopId}`).then((r) => {
        if (!r.ok) throw new Error(`stats: ${r.status}`);
        return r.json();
      }),
      fetch(`/api/orders?shopId=${shopId}`).then((r) => {
        if (!r.ok) throw new Error(`orders: ${r.status}`);
        return r.json();
      }),
    ])
      .then(([s, o]) => {
        setStats(s);
        setRawOrders(o.orders || []);
        setLoadError(null);
      })
      .catch((e) => {
        console.error('[MerchantDashboard] loadAll failed:', e);
        setLoadError('فشل تحميل البيانات. تحقق من الاتصال بالإنترنت وأعد المحاولة.');
      })
      .finally(() => {
        setLoading(false);
        refreshShop();
      });
  }, [shopId, refreshShop]);

  useEffect(() => {
    if (unlocked) loadAll();
  }, [unlocked, loadAll]);

  async function handlePinSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!pin || verifying) return;
    setVerifying(true);
    try {
      const res = await fetch(`/api/shops/${encodeURIComponent(shopSlug)}/verify-pin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });
      if (res.ok) {
        toast.success("مرحباً بك في لوحة التحكم");
        verifiedPinRef.current = pin;
        localStorage.setItem(`shop_auth_${shopSlug}`, JSON.stringify({ ts: Date.now(), pin }));
        setUnlocked(true);
        setPin("");
      } else {
        handleWrongPin();
      }
    } catch {
      handleWrongPin();
    } finally {
      setVerifying(false);
    }
  }

  function handleWrongPin() {
    setPinError(true);
    setPinAttempts((a) => a + 1);
    toast.error("كلمة المرور غير صحيحة", {
      description: pinAttempts >= 2 ? "محاولة أخيرة قبل القفل المؤقت" : `المتبقي ${3 - pinAttempts - 1} محاولات`,
    });
    setPin("");
    if (pinAttempts >= 2) {
      setTimeout(() => { setPinAttempts(0); setPinError(false); }, 5000);
    }
  }

  async function changeStatus(order: PrintOrderLite, status: string) {
    try {
      const res = await fetch(`/api/orders/${order.id}?shopId=${shopId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("فشل التحديث");
      toast.success("تم تحديث الحالة", {
        description: `${order.reference} → ${STATUS_META[status].label}`,
      });
      setRawOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, status } : o)));
      // تحديث الإحصائيات فقط بدون إعادة تحميل كل الطلبات
      fetch(`/api/admin/stats?shopId=${shopId}`)
        .then((r) => r.json())
        .then((s) => setStats(s))
        .catch(() => {});
    } catch (e) {
      toast.error("خطأ", { description: (e as Error).message });
    }
  }

  function handleLogout() {
    localStorage.removeItem(`shop_auth_${shopSlug}`);
    verifiedPinRef.current = "";
    setUnlocked(false);
    toast.info("تم تسجيل الخروج");
  }

  // ===== شاشة كلمة المرور =====
  if (!unlocked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 via-slate-50 to-teal-50/30 p-4" dir="rtl">
        {/* Decorative grid pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(circle, #0d7377 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
        <Card className="max-w-sm w-full rounded-2xl shadow-xl border border-slate-200/60 relative z-10 hover:shadow-2xl hover:-translate-y-1 transition-all duration-500">
          <CardContent className="p-8">
            <div className="text-center mb-8">
              <div className="w-24 h-24 mx-auto rounded-2xl bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center mb-5 shadow-lg shadow-teal-300/40" style={{ animation: "float 3s ease-in-out infinite" }}>
                <Lock className="h-12 w-12 text-white" />
              </div>
              <h2 className="text-xl font-bold text-slate-800">لوحة تحكم المتجر</h2>
              <p className="text-sm text-slate-500 mt-2">أدخل رمز PIN للوصول إلى لوحة التحكم</p>
              <p className="text-xs text-teal-600 font-medium mt-1">طيف</p>
            </div>

            <form onSubmit={handlePinSubmit} className="space-y-5">
              <div className="relative">
                <Input
                  type="password"
                  value={pin}
                  onChange={(e) => { setPin(e.target.value); setPinError(false); }}
                  placeholder="• • • •"
                  className={cn(
                    "text-center text-2xl tracking-[0.5em] h-12 rounded-xl border-slate-200 focus:ring-teal-500/20 focus:border-teal-500 shadow-sm bg-slate-50 transition-shadow",
                    pinError && "ring-2 ring-rose-400 bg-rose-50/50 shadow-rose-100",
                  )}
                  autoFocus
                  dir="ltr"
                  disabled={verifying}
                />
              </div>
              {pinError && (
                <div className="flex items-center justify-center gap-2 text-sm text-rose-500">
                  <AlertCircle className="h-4 w-4" />
                  كلمة المرور غير صحيحة
                </div>
              )}
              <Button
                type="submit"
                className="w-full h-12 rounded-xl bg-teal-600 hover:bg-teal-700 text-white shadow-md hover:shadow-lg transition-all duration-200 active:scale-[0.98]"
                disabled={pin.length < 1 || verifying}
              >
                <ShieldCheck className="h-4 w-4" />
                {verifying ? "جارٍ التحقق..." : "دخول"}
              </Button>
            </form>

            <button
              type="button"
              className="text-xs text-teal-500 hover:text-teal-700 transition-colors mt-4 w-full text-center"
              onClick={() => toast.info("تواصل مع صاحب المنصة")}
            >
              هل نسيت الرمز؟
            </button>
            <p className="text-xs text-slate-400 mt-4 text-center">
              🔒 هذا القسم مخصص لصاحب المتجر فقط
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ===== لوحة التحكم الرئيسية =====
  const customerLink = typeof window !== "undefined" ? `${window.location.origin}/s/${shopSlug}` : `/s/${shopSlug}`;

  const statCards = [
    { title: "إجمالي الطلبات", value: stats?.totalOrders ?? 0, icon: Package, color: "text-teal-600", bg: "bg-gradient-to-br from-teal-50 to-teal-100/60", borderColor: "border-t-teal-400" },
    { title: "إجمالي الإيرادات", value: formatDA(stats?.totalRevenue ?? 0), icon: DollarSign, color: "text-emerald-600", bg: "bg-gradient-to-br from-emerald-50 to-emerald-100/60", borderColor: "border-t-emerald-400" },
    { title: "صافي الربح", value: formatDA(totalProfit), icon: TrendingUp, color: totalProfit >= 0 ? "text-emerald-600" : "text-rose-600", bg: totalProfit >= 0 ? "bg-gradient-to-br from-emerald-50 to-emerald-100/60" : "bg-gradient-to-br from-rose-50 to-rose-100/60", borderColor: totalProfit >= 0 ? "border-t-emerald-400" : "border-t-rose-400" },
    { title: "قيد التنفيذ", value: (stats?.statusCounts?.printing ?? 0) + (stats?.statusCounts?.pending ?? 0), icon: Clock, color: "text-amber-600", bg: "bg-gradient-to-br from-amber-50 to-amber-100/60", borderColor: "border-t-amber-400" },
    { title: "إيرادات اليوم", value: formatDA(todayRevenue), icon: Inbox, color: "text-sky-600", bg: "bg-gradient-to-br from-sky-50 to-sky-100/60", borderColor: "border-t-sky-400", trend: todayRevenue > 0 ? "up" : todayRevenue < 0 ? "down" : undefined },
    { title: "ربح اليوم", value: formatDA(todayRevenue - todayCost), icon: Crown, color: (todayRevenue - todayCost) >= 0 ? "text-teal-600" : "text-rose-600", bg: (todayRevenue - todayCost) >= 0 ? "bg-gradient-to-br from-teal-50 to-teal-100/60" : "bg-gradient-to-br from-rose-50 to-rose-100/60", borderColor: (todayRevenue - todayCost) >= 0 ? "border-t-teal-400" : "border-t-rose-400", trend: (todayRevenue - todayCost) > 0 ? "up" : (todayRevenue - todayCost) < 0 ? "down" : undefined },
  ];

  const quickFilters = [
    { value: "all", label: "الكل", count: stats?.totalOrders ?? 0 },
    { value: "pending", label: STATUS_META.pending.label, count: stats?.statusCounts?.pending ?? 0 },
    { value: "printing", label: STATUS_META.printing.label, count: stats?.statusCounts?.printing ?? 0 },
    { value: "ready", label: STATUS_META.ready.label, count: stats?.statusCounts?.ready ?? 0 },
    { value: "delivered", label: STATUS_META.delivered.label, count: stats?.statusCounts?.delivered ?? 0 },
  ];

  return (
    <div className="flex min-h-screen" dir="rtl">
      {/* ===== الشريط الجانبي ===== */}
      <DashboardSidebar
        sections={sidebarSections}
        activeKey={activeTab}
        onNavigate={(key) => setActiveTab(key as MerchantTab)}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        mobileOpen={mobileOpen}
        onMobileToggle={() => setMobileOpen(!mobileOpen)}
        logo={
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
              style={{ backgroundColor: shop?.primaryColor || '#0d7377' }}
            >
              {(() => {
                const Comp = DYN_ICON_MAP[shop?.logoIcon || "Printer"] || PrinterIcon;
                return <Comp className="h-5 w-5 text-white" />;
              })()}
            </div>
            <span className="font-bold text-sm text-white truncate">{shop?.name || "المتجر"}</span>
          </div>
        }
        footer={
          <button onClick={handleLogout} className="flex items-center gap-2 w-full px-3 py-2 text-sm text-rose-500 hover:bg-rose-50 rounded-lg transition-colors">
            <LogOut className="h-4 w-4" />
            تسجيل الخروج
          </button>
        }
      />

      {/* ===== المحتوى الرئيسي ===== */}
      <div className="flex-1 bg-slate-50 overflow-auto">
        {/* ===== الشريط العلوي ===== */}
        <header className="bg-white border-b border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.05)] h-16 sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileOpen(!mobileOpen)}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 md:hidden"
              aria-label={mobileOpen ? 'إغلاق القائمة' : 'فتح القائمة'}
            >
              <Menu className="h-5 w-5" />
            </button>
            <div
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
              style={{ backgroundColor: shop?.primaryColor || '#0d7377' }}
            >
              {(() => {
                const Comp = DYN_ICON_MAP[shop?.logoIcon || "Printer"] || PrinterIcon;
                return <Comp className="h-4 w-4 sm:h-5 sm:w-5 text-white" />;
              })()}
            </div>
            <div className="hidden sm:flex items-center gap-2.5 bg-gradient-to-l from-teal-50 to-cyan-50 border border-teal-200/60 -mx-2 px-3 py-1.5 rounded-xl">
              <div className="min-w-0">
                <div className="font-bold text-sm truncate text-slate-800">{shop?.name || "المتجر"}</div>
                <div className="text-xs text-slate-400 truncate">لوحة التحكم</div>
              </div>
            </div>
            <div className="sm:hidden min-w-0">
              <div className="font-bold text-sm truncate text-slate-800">{shop?.name || "المتجر"}</div>
              <div className="text-xs text-slate-400 truncate">لوحة التحكم</div>
            </div>
          </div>
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <button
              type="button"
              onClick={() => { setActiveTab("orders"); setStatusFilter("pending"); }}
              className="relative p-2 rounded-lg hover:bg-slate-100 transition-colors"
              title="طلبات معلقة"
            >
              <Bell className="h-4.5 w-4.5 text-slate-500" />
              {pendingCount > 0 && (
                <span className="absolute -top-1 -left-1 w-5 h-5 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                  {pendingCount > 99 ? "99+" : pendingCount}
                </span>
              )}
            </button>
            <a
              href={customerLink}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-teal-600 hover:bg-teal-700 text-white rounded-lg px-2.5 sm:px-3 py-2 text-xs font-medium transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">طلب جديد</span>
            </a>
            <Button
              size="icon"
              variant="ghost"
              onClick={loadAll}
              className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 h-9 w-9 sm:h-10 sm:w-10 rounded-lg shrink-0 transition-all duration-200"
              title="تحديث"
            >
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            </Button>
            <button
              type="button"
              onClick={loadAll}
              disabled={loading}
              className="hidden sm:inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-teal-600 hover:bg-teal-50 border border-slate-200 hover:border-teal-200 rounded-lg px-3 py-2 font-medium transition-all duration-200"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
              تحديث
            </button>
          </div>
        </header>

        {/* ===== المحتوى ===== */}
        <main className="p-4 sm:p-6 space-y-6">
          {/* ===== تبويب الرئيسية ===== */}
          {activeTab === "home" && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {statCards.map((c, i) => (
                  <div key={i} className={cn("bg-white rounded-xl border border-slate-200/60 border-t-2 shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-4 sm:p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200", c.borderColor)}>
                    <div className="flex items-start justify-between">
                      <div className="min-w-0">
                        <div className="text-xl sm:text-2xl font-bold tabular-nums truncate text-slate-800">{c.value}</div>
                        <div className="text-xs text-slate-400 mt-1 flex items-center gap-1">{c.title}{c.trend && (c.trend === "up" ? <ArrowUp className="h-3 w-3 text-emerald-500" /> : <ArrowDown className="h-3 w-3 text-rose-500" />)}</div>
                      </div>
                      <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center shrink-0 animate-pulse-slow", c.bg)}>
                        <c.icon className={cn("h-5 w-5", c.color)} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* إجراءات سريعة */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { icon: Plus, label: "طلب جديد", color: "from-teal-500 to-teal-600", action: () => window.open(customerLink, '_blank') },
                  { icon: BarChart3, label: "تقرير يومي", color: "from-emerald-500 to-emerald-600", action: () => toast.info("قريباً: التقارير اليومية") },
                  { icon: Users, label: "العملاء", color: "from-amber-500 to-amber-600", action: () => setActiveTab("customers") },
                  { icon: FileText, label: "المصاريف", color: "from-rose-500 to-rose-600", action: () => setActiveTab("expenses") },
                ].map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={item.action}
                    className="flex flex-col items-center gap-2.5 p-4 rounded-xl border border-slate-200/60 bg-white hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group"
                  >
                    <div className={cn("w-11 h-11 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform", item.color)}>
                      <item.icon className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-xs font-medium text-slate-600 group-hover:text-slate-800">{item.label}</span>
                  </button>
                ))}
              </div>

              {!(stats?.totalOrders ?? 0) && (
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-l from-teal-600 via-teal-500 to-cyan-600 p-6 sm:p-8 text-white">
                  <div className="relative z-10">
                    <h2 className="text-lg sm:text-xl font-bold mb-1">🎉 متجرك جاهز لاستقبال الطلبات!</h2>
                    <p className="text-teal-100 text-sm max-w-lg mb-4">
                      شارك رابط متجرك مع زبائنك لبدء استقبال طلبات الطباعة أونلاين
                    </p>
                    <div className="flex items-center gap-3">
                      <a
                        href={customerLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 bg-white text-teal-600 rounded-lg px-4 py-2 text-sm font-semibold hover:bg-teal-50 transition-colors shadow-sm"
                      >
                        <ExternalLink className="h-4 w-4" />
                        معاينة المتجر
                      </a>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(customerLink).then(() => {
                            toast.success("تم نسخ الرابط", { description: "شاركه مع زبائنك" });
                          });
                        }}
                        className="inline-flex items-center gap-1.5 bg-white/15 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-white/25 transition-colors"
                      >
                        <Copy className="h-4 w-4" />
                        نسخ الرابط
                      </button>
                    </div>
                  </div>
                  {/* Floating decorative shapes */}
                  <div className="absolute -left-10 -top-10 w-40 h-40 rounded-full bg-white/10" style={{ animation: "float 4s ease-in-out infinite" }} />
                  <div className="absolute -right-6 -bottom-6 w-28 h-28 rounded-full bg-white/5" style={{ animation: "float 5s ease-in-out infinite reverse" }} />
                  <div className="absolute right-1/4 top-4 w-4 h-4 rounded-full bg-white/20" style={{ animation: "float 3s ease-in-out infinite" }} />
                  <div className="absolute left-1/3 bottom-8 w-3 h-3 rounded-full bg-white/15" style={{ animation: "float 4.5s ease-in-out infinite reverse" }} />
                  <div className="absolute right-12 bottom-1/3 w-2 h-2 rounded-full bg-white/25" style={{ animation: "float 3.5s ease-in-out infinite" }} />
                  <div className="absolute left-1/4 top-1/3 w-2.5 h-2.5 rounded-full bg-white/10" style={{ animation: "float 5.5s ease-in-out infinite" }} />
                  {/* Particle dots */}
                  <div className="absolute left-[15%] top-[20%] w-1 h-1 rounded-full bg-white/30" />
                  <div className="absolute left-[70%] top-[15%] w-1 h-1 rounded-full bg-white/20" />
                  <div className="absolute left-[45%] top-[80%] w-1 h-1 rounded-full bg-white/25" />
                  <div className="absolute left-[80%] top-[60%] w-1 h-1 rounded-full bg-white/15" />
                  <div className="absolute left-[25%] top-[70%] w-1 h-1 rounded-full bg-white/20" />
                </div>
              )}

              {/* آخر الطلبات */}
              <div className="bg-white rounded-xl border border-slate-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
                <div className="border-b border-slate-200/60 px-4 sm:px-6 pt-5 pb-3">
                  <h3 className="text-sm font-semibold flex items-center gap-2 text-slate-800">
                    <Clock className="h-4 w-4 text-teal-500" />
                    آخر الطلبات
                  </h3>
                </div>
                <div className="p-0">
                  {loadError ? (
                    <div className="py-12 flex flex-col items-center px-4">
                      <AlertCircle className="h-10 w-10 text-rose-300 mb-3" />
                      <p className="text-sm font-medium text-slate-500 mb-1">فشل تحميل البيانات</p>
                      <p className="text-xs text-slate-400 mb-4 text-center">{loadError}</p>
                      <button
                        type="button"
                        onClick={loadAll}
                        className="inline-flex items-center gap-1.5 text-xs text-teal-600 hover:text-teal-700 font-medium bg-teal-50 hover:bg-teal-100 rounded-lg px-4 py-2 transition-colors"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                        إعادة المحاولة
                      </button>
                    </div>
                  ) : loading ? (
                    <div className="py-12 text-center text-slate-400 text-sm">
                      <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2" />
                      جارٍ التحميل...
                    </div>
                  ) : !stats?.recentOrders?.length ? (
                    <div className="py-14 flex flex-col items-center">
                      <Inbox className="h-10 w-10 text-slate-200 mb-3" />
                      <p className="text-sm font-medium text-slate-400">لا توجد طلبات بعد</p>
                      <p className="text-xs text-slate-300 mt-1">ستظهر هنا آخر الطلبات الواردة</p>
                      <a
                        href={customerLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-4 text-xs text-teal-600 hover:text-teal-700 font-medium flex items-center gap-1 transition-colors"
                      >
                        <ExternalLink className="h-3 w-3" />
                        افتح المتجر واطلب الآن
                      </a>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {stats.recentOrders.slice(0, 5).map((o) => {
                        const meta = STATUS_META[o.status] || STATUS_META.pending;
                        const statusBorderMap: Record<string, string> = {
                          pending: "border-r-amber-400",
                          printing: "border-r-blue-400",
                          ready: "border-r-emerald-400",
                          delivered: "border-r-emerald-500",
                          cancelled: "border-r-rose-400",
                        };
                        const serviceEmoji = SERVICE_MAP[o.serviceType]?.emoji ?? "";
                        return (
                          <div key={o.id} className={cn("flex items-center justify-between px-4 sm:px-6 py-3.5 gap-3 hover:bg-slate-50 transition-colors duration-150 border-r-[3px]", statusBorderMap[o.status] || "border-r-slate-300")}>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span
                                  className="font-mono text-xs font-bold text-slate-800 cursor-pointer hover:text-teal-600 transition-colors"
                                  onClick={() => setSelectedOrder(o)}
                                >{o.reference}</span>
                                <span className={cn("text-xs px-2.5 py-1 rounded-lg font-medium", meta.bg)}>{meta.label}</span>
                              </div>
                              <div className="text-xs text-slate-400 truncate mt-0.5">
                                {o.customer.name} · {serviceEmoji}{o.serviceName}
                              </div>
                            </div>
                            <div className="text-left shrink-0">
                              <div className="text-sm font-bold text-teal-600">{formatDA(o.total)}</div>
                              <div className="text-xs text-slate-400">{formatDateTimeAr(o.createdAt)}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* التحليلات */}
              <div className="bg-white rounded-xl border border-slate-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">
                <AdminAnalytics stats={stats} orders={rawOrders} shopId={shopId} />
              </div>
            </div>
          )}

          {/* ===== تبويب الطلبات ===== */}
          {activeTab === "orders" && (
            <div className="space-y-5">
              {/* أزرار التبديل بين جدول ولوحة كانبان */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setViewMode("table")}
                  className={cn(
                    "flex items-center gap-2 text-sm font-medium transition-all duration-200 min-h-[44px] px-4 py-2 rounded-lg",
                    viewMode === "table"
                      ? "bg-teal-600 text-white"
                      : "text-slate-500 hover:text-slate-700 hover:bg-slate-100",
                  )}
                >
                  <Table2 className="h-4 w-4" />
                  جدول
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("kanban")}
                  className={cn(
                    "flex items-center gap-2 text-sm font-medium transition-all duration-200 min-h-[44px] px-4 py-2 rounded-lg",
                    viewMode === "kanban"
                      ? "bg-teal-600 text-white"
                      : "text-slate-500 hover:text-slate-700 hover:bg-slate-100",
                  )}
                >
                  <Columns3 className="h-4 w-4" />
                  كانبان
                </button>
              </div>
              {/* الفلاتر */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="relative">
                  <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="ابحث برقم الطلب أو اسم/هاتف العميل..."
                    className="pr-10 text-sm h-11 rounded-xl border-slate-200 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                    onKeyDown={(e) => e.key === "Enter" && loadAll()}
                  />
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="text-sm h-11 rounded-xl border-slate-200">
                        <SelectValue placeholder="كل الحالات" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">كل الحالات</SelectItem>
                        {STATUS_FLOW.map((s) => (
                          <SelectItem key={s} value={s}>{STATUS_META[s].label}</SelectItem>
                        ))}
                        <SelectItem value="cancelled">ملغي</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {hasFeature("exportExcel") && (
                    <Button variant="outline" onClick={exportCSV} className="shrink-0 h-11 w-11 rounded-lg border-slate-200 hover:bg-slate-50 transition-all duration-200" title="تصدير CSV">
                      <Download className="h-4 w-4" />
                    </Button>
                  )}
                  <Button variant="outline" onClick={loadAll} className="shrink-0 h-11 w-11 rounded-lg border-slate-200 hover:bg-slate-50 transition-all duration-200">
                    <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
                  </Button>
                </div>
              </div>

              {/* شرائح التصفية السريعة */}
              <div className="flex items-center gap-2 overflow-x-auto custom-scroll pb-1 -mx-1 px-1">
                {quickFilters.map((f) => {
                  const dotColor: Record<string, string> = {
                    all: "bg-slate-400",
                    pending: "bg-amber-400",
                    printing: "bg-blue-400",
                    ready: "bg-emerald-400",
                    delivered: "bg-emerald-500",
                  };
                  const isActive = statusFilter === f.value;
                  return (
                  <button
                    key={f.value}
                    onClick={() => setStatusFilter(f.value)}
                    className={cn(
                      "flex items-center gap-2 text-sm font-medium whitespace-nowrap transition-all duration-200 shrink-0 min-h-[44px]",
                      isActive
                        ? "bg-teal-600 text-white rounded-lg px-4 py-2 shadow-md shadow-teal-200"
                        : "text-slate-500 hover:text-slate-700 hover:bg-slate-100 hover:shadow-sm hover:-translate-y-0.5 rounded-lg px-4 py-2",
                    )}
                  >
                    <span className={cn("w-2 h-2 rounded-full shrink-0", isActive && f.value !== "all" ? "bg-white/70" : dotColor[f.value] || "bg-slate-400")} />
                    {f.label}
                    <span className={cn(
                      "tabular-nums text-xs px-2 py-0.5 rounded-md",
                      isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500",
                    )}>
                      {f.count}
                    </span>
                  </button>
                  );
                })}
              </div>

              {/* ===== عرض الجدول ===== */}
              {viewMode === "table" && (<>
              {/* جدول الطلبات - حاسوب */}
              <div className="bg-white rounded-xl border border-slate-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.06)] hidden md:block">
                <div className="border-b border-slate-200/60 px-6 pt-5 pb-3">
                  <h3 className="text-sm font-semibold text-slate-800">الطلبات ({orders.length})</h3>
                </div>
                <div className="p-0">
                  {loadError ? (
                    <div className="py-16 flex flex-col items-center px-4">
                      <AlertCircle className="h-10 w-10 text-rose-300 mb-3" />
                      <p className="text-sm font-medium text-slate-500 mb-1">فشل تحميل البيانات</p>
                      <p className="text-xs text-slate-400 mb-4 text-center">{loadError}</p>
                      <button
                        type="button"
                        onClick={loadAll}
                        className="inline-flex items-center gap-1.5 text-xs text-teal-600 hover:text-teal-700 font-medium bg-teal-50 hover:bg-teal-100 rounded-lg px-4 py-2 transition-colors"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                        إعادة المحاولة
                      </button>
                    </div>
                  ) : loading ? (
                    <div className="py-16 text-center text-slate-400 text-sm">
                      <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2" />
                      جارٍ التحميل...
                    </div>
                  ) : orders.length === 0 ? (
                    <div className="py-16 text-center">
                      <Inbox className="h-12 w-12 mx-auto text-slate-200 mb-3" />
                      <p className="text-sm text-slate-400">لا توجد طلبات</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto custom-scroll">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-slate-50/80 hover:bg-slate-50/80 border-b border-slate-200/60">
                            {hasFeature("bulkActions") && (
                              <TableHead className="w-10 p-2">
                                <Checkbox
                                  checked={orders.length > 0 && selectedIds.size === orders.length}
                                  onCheckedChange={toggleSelectAll}
                                  aria-label="تحديد الكل"
                                />
                              </TableHead>
                            )}
                            <TableHead>
                              <button onClick={() => toggleSort("reference")} className="flex items-center gap-1 text-right text-xs text-slate-500 font-medium hover:text-slate-700 transition-colors">
                                رقم الطلب <SortIcon field="reference" />
                              </button>
                            </TableHead>
                            <TableHead className="text-right text-xs text-slate-500 font-medium">الخدمة</TableHead>
                            <TableHead className="text-right text-xs text-slate-500 font-medium">العميل</TableHead>
                            <TableHead className="text-right text-xs text-slate-500 font-medium hidden md:table-cell">الهاتف</TableHead>
                            <TableHead className="text-right text-xs text-slate-500 font-medium hidden lg:table-cell">التفاصيل</TableHead>
                            <TableHead>
                              <button onClick={() => toggleSort("total")} className="flex items-center gap-1 text-right text-xs text-slate-500 font-medium hover:text-slate-700 transition-colors">
                                المجموع <SortIcon field="total" />
                              </button>
                            </TableHead>
                            <TableHead className="text-right text-xs text-slate-500 font-medium hidden lg:table-cell">الربح</TableHead>
                            <TableHead>
                              <button onClick={() => toggleSort("status")} className="flex items-center gap-1 text-right text-xs text-slate-500 font-medium hover:text-slate-700 transition-colors">
                                الحالة <SortIcon field="status" />
                              </button>
                            </TableHead>
                            <TableHead>
                              <button onClick={() => toggleSort("date")} className="flex items-center gap-1 text-right text-xs text-slate-500 font-medium hover:text-slate-700 transition-colors hidden sm:flex">
                                التاريخ <SortIcon field="date" />
                              </button>
                              <span className="text-right text-xs text-slate-500 font-medium sm:hidden">التاريخ</span>
                            </TableHead>
                            <TableHead className="text-center text-xs w-10"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {orders.map((o) => (
                            <OrderDetailsRow
                              key={o.id}
                              order={o}
                              onStatusChange={changeStatus}
                              onClick={() => setSelectedOrder(o)}
                              selected={hasFeature("bulkActions") ? selectedIds.has(o.id) : undefined}
                              onToggleSelect={hasFeature("bulkActions") ? () => toggleSelect(o.id) : undefined}
                              canPrintReceipt={hasFeature("receiptPrinting")}
                              onPrintReceipt={() => printReceipt(o, shop?.name || "", shop?.phone || "", shop?.address || null)}
                            />
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              </div>

              {/* بطاقات الطلبات - جوال */}
              <div className="bg-white rounded-xl border border-slate-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.06)] md:hidden">
                <div className="border-b border-slate-200/60 px-5 pt-5 pb-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-slate-800">الطلبات ({orders.length})</h3>
                    <div className="flex items-center gap-1">
                      {hasFeature("bulkActions") && !mobileSelectionMode && orders.length > 0 && (
                        <button
                          onClick={() => setMobileSelectionMode(true)}
                          className="text-[11px] px-2.5 py-1 rounded-md transition-colors bg-teal-600 text-white hover:bg-teal-700 flex items-center gap-1"
                        >
                          <ListChecks className="h-3 w-3" />
                          تحديد
                        </button>
                      )}
                      {mobileSelectionMode && (
                        <button
                          onClick={() => { setMobileSelectionMode(false); setSelectedIds(new Set()); }}
                          className="text-[11px] px-2.5 py-1 rounded-md transition-colors text-slate-400 hover:text-slate-600"
                        >
                          إلغاء
                        </button>
                      )}
                      <button onClick={() => toggleSort("date")} className={cn("text-[11px] px-2 py-1 rounded-md transition-colors", sortField === "date" ? "bg-teal-100 text-teal-700" : "text-slate-400 hover:text-slate-600")}>
                        {sortDir === "desc" ? "الأحدث" : "الأقدم"}
                      </button>
                      <button onClick={() => toggleSort("total")} className={cn("text-[11px] px-2 py-1 rounded-md transition-colors", sortField === "total" ? "bg-teal-100 text-teal-700" : "text-slate-400 hover:text-slate-600")}>
                        الأعلى سعراً
                      </button>
                    </div>
                  </div>
                </div>
                <div className="p-4 space-y-3">
                  {loadError ? (
                    <div className="py-10 flex flex-col items-center px-4">
                      <AlertCircle className="h-8 w-8 text-rose-300 mb-2" />
                      <p className="text-xs text-slate-400 mb-3 text-center">{loadError}</p>
                      <button type="button" onClick={loadAll} className="inline-flex items-center gap-1.5 text-xs text-teal-600 font-medium bg-teal-50 rounded-lg px-3 py-1.5">
                        <RefreshCw className="h-3 w-3" /> إعادة المحاولة
                      </button>
                    </div>
                  ) : loading ? (
                    <div className="py-10 text-center text-slate-400 text-sm">
                      <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2" />
                      جارٍ التحميل...
                    </div>
                  ) : orders.length === 0 ? (
                    <div className="py-10 text-center">
                      <Inbox className="h-10 w-10 mx-auto text-slate-200 mb-2" />
                      <p className="text-xs text-slate-400">لا توجد طلبات</p>
                    </div>
                  ) : (
                    orders.map((o) => <MobileOrderCard key={o.id} order={o} onStatusChange={changeStatus} onClick={() => setSelectedOrder(o)} shopId={shopId} shopName={shop?.name || ""} shopPhone={shop?.phone || ""} shopAddress={shop?.address || null} selectionMode={mobileSelectionMode} selected={mobileSelectionMode ? selectedIds.has(o.id) : undefined} onToggleSelect={mobileSelectionMode ? () => toggleSelect(o.id) : undefined} />)
                  )}
                </div>
              </div>
              </>)}

              {/* ===== عرض كانبان ===== */}
              {viewMode === "kanban" && (
                <div className="bg-white rounded-xl border border-slate-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-4">
                  {loadError ? (
                    <div className="py-16 flex flex-col items-center px-4">
                      <AlertCircle className="h-10 w-10 text-rose-300 mb-3" />
                      <p className="text-xs text-slate-400 mb-3 text-center">{loadError}</p>
                      <button type="button" onClick={loadAll} className="inline-flex items-center gap-1.5 text-xs text-teal-600 font-medium bg-teal-50 rounded-lg px-4 py-2">
                        <RefreshCw className="h-3.5 w-3.5" /> إعادة المحاولة
                      </button>
                    </div>
                  ) : loading ? (
                    <div className="py-16 text-center text-slate-400 text-sm">
                      <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2" />
                      جارٍ التحميل...
                    </div>
                  ) : orders.length === 0 ? (
                    <div className="py-16 text-center">
                      <Inbox className="h-12 w-12 mx-auto text-slate-200 mb-3" />
                      <p className="text-sm text-slate-400">لا توجد طلبات</p>
                    </div>
                  ) : (
                    <KanbanBoard orders={orders} onStatusChange={changeStatus} onRefresh={loadAll} />
                  )}
                </div>
              )}

              {/* شريط الإجراءات الجماعية العائم */}
              {hasFeature("bulkActions") && selectedIds.size > 0 && (
                <div className="fixed bottom-4 left-2 right-2 sm:left-1/2 sm:-translate-x-1/2 sm:right-auto z-50 flex items-center gap-2 sm:gap-3 bg-teal-600 text-white rounded-xl px-3 sm:px-5 py-3 sm:py-3.5 shadow-2xl shadow-teal-600/30 animate-in slide-in-from-bottom-4 duration-300 ease-out overflow-x-auto">
                  <span className="text-sm font-semibold whitespace-nowrap">
                    <CheckSquare className="h-4 w-4 inline-block ml-1.5 -mt-0.5" />
                    {selectedIds.size} محدد
                  </span>
                  <div className="w-px h-6 bg-white/25 shrink-0" />
                  <Select onValueChange={(v) => bulkChangeStatus(v)} disabled={bulkLoading}>
                    <SelectTrigger className="h-9 w-auto min-w-[110px] sm:min-w-[130px] text-xs rounded-lg border-white/30 bg-white/15 text-white hover:bg-white/25 focus:ring-white/40 [&_svg]:text-white">
                      <SelectValue placeholder="تغيير الحالة" />
                    </SelectTrigger>
                    <SelectContent>
                      {bulkStatusOptions.map((s) => (
                        <SelectItem key={s} value={s}>{STATUS_META[s].label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    size="sm"
                    onClick={bulkDelete}
                    disabled={bulkLoading}
                    className="h-9 text-xs gap-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white border border-white/30 active:scale-[0.98] transition-all duration-200"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    حذف المحدد
                  </Button>
                  <button
                    onClick={() => { setSelectedIds(new Set()); setMobileSelectionMode(false); }}
                    className="w-9 h-9 rounded-full hover:bg-white/25 flex items-center justify-center transition-all duration-200 text-white/70 hover:text-white"
                    aria-label="إلغاء التحديد"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}

              {/* تأكيد حذف جماعي */}
              <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
                <AlertDialogContent className="max-w-sm">
                  <AlertDialogHeader>
                    <AlertDialogTitle>تأكيد حذف الطلبات</AlertDialogTitle>
                    <AlertDialogDescription>
                      هل أنت متأكد من حذف {selectedIds.size} طلب محدد؟ لا يمكن التراجع عن هذا الإجراء.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter className="gap-2 sm:gap-0">
                    <AlertDialogCancel className="mt-0 sm:mt-0">إلغاء</AlertDialogCancel>
                    <AlertDialogAction onClick={confirmBulkDelete} className="bg-rose-600 hover:bg-rose-700 text-white">
                      حذف {selectedIds.size} طلب
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
          {/* ===== تبويب التحليلات ===== */}
          {activeTab === "analytics" && hasFeature("advancedAnalytics") && (
            <div className="bg-white rounded-xl border border-slate-200/60 dark:border-slate-700/60 shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">
              <div className="p-4 sm:p-6">
                <MerchantAnalytics stats={stats} orders={rawOrders} />
              </div>
            </div>
          )}

          {/* ===== تبويب العملاء ===== */}
          {activeTab === "customers" && (
            <MerchantCustomers />
          )}

          {/* ===== تبويب المصاريف ===== */}
          {activeTab === "expenses" && (
            <MerchantExpenses />
          )}

          {/* ===== تبويب إعدادات المتجر ===== */}
          {activeTab === "settings" && (
            <MerchantShopSettings shopId={shopId} shopSlug={shopSlug} adminPin={verifiedPinRef.current} onSaved={() => setPreviewKey(k => k + 1)} />
          )}

          {/* ===== تبويب الإعدادات المتقدمة ===== */}
          {activeTab === "advancedSettings" && (
            <MerchantSettingsAdvanced shopId={shopId} shopSlug={shopSlug} adminPin={verifiedPinRef.current} />
          )}

          {/* ===== تبويب مشاركة الرابط ===== */}
          {activeTab === "share" && (
            <ShareLinkTab shopName={shop?.name || ""} shopSlug={shopSlug} customerLink={customerLink} />
          )}

          {/* ===== تبويب المعاينة ===== */}
          {activeTab === "preview" && (
            <div className="space-y-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="font-bold text-lg text-slate-800">معاينة متجرك</h2>
                  <p className="text-sm text-slate-500 mt-1">هذا ما يراه زبائنك عند فتح الرابط</p>
                </div>
                <Button variant="outline" onClick={() => window.open(customerLink, "_blank")} className="border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg shrink-0">
                  <ExternalLink className="h-4 w-4" />
                  فتح في نافذة جديدة
                </Button>
              </div>
              <div className="bg-white rounded-xl border border-slate-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">
                <div className="p-0">
                  <div className="bg-slate-100 p-3 flex items-center gap-2.5 border-b border-slate-200/60">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-rose-400" />
                      <div className="w-3 h-3 rounded-full bg-amber-400" />
                      <div className="w-3 h-3 rounded-full bg-emerald-400" />
                    </div>
                    <div className="flex-1 bg-white rounded-lg px-4 py-1.5 text-xs text-slate-400 text-center shadow-sm border border-slate-200/60" dir="ltr">
                      {customerLink}
                    </div>
                  </div>
                  <iframe
                    key={previewKey}
                    src={customerLink}
                    className="w-full border-0"
                    style={{ height: "calc(100vh - 280px)", minHeight: "400px" }}
                    title="معاينة المتجر"
                  />
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ===== نافذة تفاصيل الطلب ===== */}
      <MerchantOrderDetail
        order={selectedOrder}
        open={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        onStatusChange={(order, status) => {
          changeStatus(order, status);
          setSelectedOrder((prev) => prev ? { ...prev, status } : null);
        }}
        onUpdated={loadAll}
        shopId={shopId}
        shopName={shop?.name || ""}
        shopPhone={shop?.phone || ""}
        shopAddress={shop?.address || null}
        hasReceiptPrinting={hasFeature("receiptPrinting")}
        hasDirectPrinting={hasFeature("directPrinting")}
      />
    </div>
  );
}

// ===== خريطة الأيقونات الديناميكية =====
const DYN_ICON_MAP: Record<string, LucideIcon> = {
  Printer: PrinterIcon,
  BookOpen: BookOpenIcon,
  Scissors: ScissorsIcon,
  Palette: PaletteIcon,
  Image: ImageIcon,
  Tag: TagIcon,
  Layers: LayersIcon,
  PenTool: PenToolIcon,
};

const ICON_LABELS: Record<string, string> = {
  Printer: "طابعة",
  BookOpen: "كتاب",
  Scissors: "مقص",
  Palette: "لوحة ألوان",
  Image: "صورة",
  Tag: "وسم",
  Layers: "طبقات",
  PenTool: "قلم",
};

// ===== قفل الميزات الاحترافية — يقرأ الحالة من قاعدة البيانات =====
function ProLock({ featureKey, children, title, desc }: { featureKey: FeatureKey | FeatureKey[]; children: React.ReactNode; title: string; desc: string }) {
  const { hasFeature, shop } = useShop();
  const keys = Array.isArray(featureKey) ? featureKey : [featureKey];
  const isEnabled = keys.some((k) => hasFeature(k));
  const [showContact, setShowContact] = useState(false);
  const contactNumber = shop?.ownerPhone || shop?.whatsapp || shop?.phone || "";

  return (
    <div className="relative">
      <div className={cn(!isEnabled && "opacity-50 blur-[1px] pointer-events-none select-none")}>
        {children}
      </div>
      {!isEnabled && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-md flex items-center justify-center rounded-xl z-10">
          <div className="bg-white rounded-xl p-6 text-center max-w-[260px] mx-4 shadow-xl border border-slate-200/60">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center mb-4 shadow-lg shadow-teal-200/50">
              <ShieldCheck className="h-8 w-8 text-white" />
            </div>
            <h4 className="font-bold text-sm mb-1 text-slate-800">{title}</h4>
            <p className="text-xs text-slate-400 mb-5">{desc}</p>
            {!showContact ? (
              <Button
                size="sm"
                className="bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white rounded-lg shadow-sm transition-all duration-200 active:scale-[0.98]"
                onClick={() => setShowContact(true)}
              >
                <Crown className="h-4 w-4 ml-1" />
                طلب تفعيل الميزة
              </Button>
            ) : (
              <div className="space-y-2">
                {contactNumber && (
                  <Button
                    size="sm"
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-all duration-200 active:scale-[0.98]"
                    onClick={() => {
                      const clean = contactNumber.replace(/\s/g, "");
                      const msg = encodeURIComponent(`مرحباً، أريد تفعيل ميزة "${title}" لمتجري`);
                      window.open(`https://wa.me/${clean.startsWith("0") ? "213" + clean.substring(1) : clean}?text=${msg}`, "_blank");
                    }}
                  >
                    <MessageCircle className="h-4 w-4 ml-1" />
                    واتساب
                  </Button>
                )}
                {contactNumber && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full rounded-lg border-slate-200 hover:bg-slate-50 transition-all duration-200"
                    onClick={() => window.open(`tel:${contactNumber.replace(/\s/g, "")}`, "_self")}
                  >
                    <Phone className="h-4 w-4 ml-1" />
                    اتصل
                  </Button>
                )}
                <button
                  className="text-xs text-slate-400 hover:text-slate-600 mt-1 transition-colors duration-200"
                  onClick={() => setShowContact(false)}
                >
                  إلغاء
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ===== الخدمات الافتراضية =====
const DEFAULT_SERVICES = [
  { type: "document", name: "طباعة مستند", emoji: "🖨️", basePricePerPage: 5, enabled: true },
  { type: "photo", name: "طباعة صور", emoji: "🖼️", basePricePerPage: 25, enabled: true },
  { type: "binding", name: "تجليد", emoji: "📚", basePricePerPage: 0, enabled: true },
  { type: "copy", name: "نسخ مستندات", emoji: "📄", basePricePerPage: 4, enabled: true },
  { type: "card", name: "بطاقات", emoji: "🪪", basePricePerPage: 30, enabled: true },
  { type: "poster", name: "ملصقات", emoji: "📜", basePricePerPage: 50, enabled: true },
];

// ===== إعدادات المتجر (داخل لوحة التاجر) =====
function MerchantShopSettings({ shopId, shopSlug, adminPin, onSaved }: { shopId: string; shopSlug: string; adminPin: string; onSaved?: () => void }) {
  const { shop, hasFeature, refreshShop } = useShop();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    whatsapp: "",
    email: "",
    address: "",
    primaryColor: "",
    ownerName: "",
    ownerPhone: "",
    logoIcon: "Printer",
    themeId: 1,
  });

  // حالة تغيير كلمة المرور
  const [pinForm, setPinForm] = useState({
    currentPin: "",
    newPin: "",
    confirmPin: "",
  });
  const [changingPin, setChangingPin] = useState(false);
  const [showCurrentPin, setShowCurrentPin] = useState(false);
  const [showNewPin, setShowNewPin] = useState(false);

  // حالة الأيقونة المختارة
  const [selectedIcon, setSelectedIcon] = useState("Printer");
  // حالة القالب اللوني
  const [selectedThemeId, setSelectedThemeId] = useState(1);
  // حالة الشعار
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    if (shop) {
      setForm((f) => ({
        ...f,
        name: shop.name || "",
        phone: shop.phone || "",
        whatsapp: shop.whatsapp || "",
        email: shop.email || "",
        address: shop.address || "",
        primaryColor: shop.primaryColor || "",
        ownerName: shop.ownerName || "",
        ownerPhone: shop.ownerPhone || "",
        logoIcon: shop.logoIcon || "Printer",
        themeId: shop.themeId || 1,
      }));
      setLogoUrl(shop.logoUrl || null);
    }
  }, [shop]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const updateData: Record<string, string | number> = { ...form, adminPin };

      const res = await fetch(`/api/shops/${encodeURIComponent(shopSlug)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "فشل الحفظ");
      }
      toast.success("تم حفظ الإعدادات بنجاح");
      refreshShop();
      onSaved?.();
    } catch (err) {
      toast.error("فشل الحفظ", { description: (err as Error).message });
    } finally {
      setSaving(false);
    }
  }

  async function handleChangePin(e: React.FormEvent) {
    e.preventDefault();
    if (!pinForm.currentPin) {
      toast.error("أدخل كلمة المرور الحالية");
      return;
    }
    if (!pinForm.newPin || pinForm.newPin.length < 10) {
      toast.error("كلمة المرور الجديدة يجب أن تكون 10 أحرف على الأقل");
      return;
    }
    if (pinForm.newPin !== pinForm.confirmPin) {
      toast.error("كلمة المرور الجديدة غير متطابقة");
      return;
    }
    if (pinForm.currentPin === pinForm.newPin) {
      toast.error("كلمة المرور الجديدة يجب أن تكون مختلفة عن الحالية");
      return;
    }
    setChangingPin(true);
    try {
      const res = await fetch(`/api/shops/${encodeURIComponent(shopSlug)}/change-pin`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPin: pinForm.currentPin, newPin: pinForm.newPin }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "فشل تغيير كلمة المرور");
      }
      toast.success("تم تغيير كلمة المرور بنجاح ✅");
      setPinForm({ currentPin: "", newPin: "", confirmPin: "" });
    } catch (err) {
      toast.error("فشل تغيير كلمة المرور", { description: (err as Error).message });
    } finally {
      setChangingPin(false);
    }
  }

  async function handleSaveOwnerInfo() {
    setSaving(true);
    try {
      const res = await fetch(`/api/shops/${encodeURIComponent(shopSlug)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ownerName: form.ownerName, ownerPhone: form.ownerPhone, adminPin }),
      });
      if (!res.ok) throw new Error("فشل الحفظ");
      toast.success("تم حفظ معلومات المالك");
      refreshShop();
    } catch (err) {
      toast.error("فشل الحفظ", { description: (err as Error).message });
    } finally {
      setSaving(false);
    }
  }

  // ===== ضغط الصورة قبل الرفع =====
  async function compressLogo(dataUrl: string, maxSize = 512): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxSize || height > maxSize) {
          if (width > height) {
            height = Math.round((height / width) * maxSize);
            width = maxSize;
          } else {
            width = Math.round((width / height) * maxSize);
            height = maxSize;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) { reject(new Error("فشل إنشاء سياق الرسم")); return; }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.8));
      };
      img.onerror = () => reject(new Error("فشل تحميل الصورة"));
      img.src = dataUrl;
    });
  }

  // ===== رفع الشعار =====
  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("حجم الملف كبير جداً", { description: "الحد الأقصى 2 م.ب" });
      return;
    }
    setUploading(true);
    try {
      const rawDataUrl: string = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error("فشل قراءة الملف"));
        reader.readAsDataURL(file);
      });
      // ضغط الصورة إلى 512x512 كحد أقصى بصيغة JPEG
      const dataUrl = await compressLogo(rawDataUrl);
      // حفظ الشعار كملف (وليس data URL في قاعدة البيانات)
      const saveRes = await fetch(`/api/shops/${encodeURIComponent(shopSlug)}/logo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logoDataUrl: dataUrl, adminPin }),
      });
      if (!saveRes.ok) {
        const errData = await saveRes.json().catch(() => ({}));
        throw new Error(errData.error || "فشل حفظ الشعار");
      }
      const result = await saveRes.json();
      setLogoUrl(result.logoUrl);
      toast.success("تم رفع الشعار بنجاح");
      refreshShop();
    } catch (err) {
      toast.error("فشل رفع الشعار", { description: (err as Error).message });
    } finally {
      setUploading(false);
    }
  }

  async function handleRemoveLogo() {
    setUploading(true);
    try {
      const res = await fetch(`/api/shops/${encodeURIComponent(shopSlug)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logoUrl: null, adminPin }),
      });
      if (!res.ok) throw new Error("فشل حذف الشعار");
      setLogoUrl(null);
      toast.success("تم حذف الشعار");
    } catch (err) {
      toast.error("فشل حذف الشعار", { description: (err as Error).message });
    } finally {
      setUploading(false);
    }
  }

  // ===== حفظ أيقونة الشعار =====
  async function handleSelectIcon(iconName: string) {
    setSelectedIcon(iconName);
    try {
      const res = await fetch(`/api/shops/${encodeURIComponent(shopSlug)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logoIcon: iconName, adminPin }),
      });
      if (!res.ok) throw new Error("فشل الحفظ");
      toast.success("تم تغيير أيقونة الشعار");
      refreshShop();
    } catch (err) {
      toast.error("فشل الحفظ", { description: (err as Error).message });
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* ===== عنوان التاجر ===== */}
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-teal-50 flex items-center justify-center">
          <User className="h-5 w-5 text-teal-600" />
        </div>
        <div>
          <h2 className="font-bold text-lg text-slate-800">{shop?.name || "التاجر"}</h2>
          <p className="text-xs text-slate-500">إعدادات المتجر والحساب</p>
        </div>
      </div>

      {/* ===== 1. رفع الشعار (customLogo) ===== */}
      <ProLock featureKey="customLogo" title="شعار المتجر" desc="ارفع شعار متجرك ليظهر للزبائن">
        <div className="bg-white rounded-xl border border-slate-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
          <div className="p-4 sm:p-6 space-y-5">
            <h3 className="text-sm font-semibold flex items-center gap-2.5 text-slate-800 border-r-4 border-teal-500 pr-3">
              <Upload className="h-4 w-4 text-teal-600" />
              شعار المتجر
              <Badge className="bg-gradient-to-r from-teal-600 to-teal-700 text-white text-[10px] px-2 py-0.5 rounded-md border-0 shadow-sm">PRO</Badge>
            </h3>
            <div className="flex items-center gap-4">
              {logoUrl ? (
                <div className="relative w-20 h-20 rounded-xl overflow-hidden shadow-sm shrink-0 border border-slate-200/60">
                  <img src={logoUrl} alt="شعار المتجر" className="w-full h-full object-cover" />
                  <button
                    onClick={handleRemoveLogo}
                    disabled={uploading}
                    className="absolute top-1 left-1 w-7 h-7 rounded-full bg-rose-500 text-white flex items-center justify-center hover:bg-rose-600 transition-all duration-200 shadow-sm"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <div className="w-20 h-20 rounded-xl bg-slate-50 border border-slate-200/60 shadow-sm flex items-center justify-center shrink-0">
                  <Store className="h-8 w-8 text-slate-300" />
                </div>
              )}
              <div className="flex-1 space-y-3">
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleLogoUpload}
                    disabled={uploading}
                  />
                  <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-teal-50 hover:bg-teal-100 transition-all duration-200 border border-teal-200/60">
                    <Upload className="h-4 w-4 text-teal-600" />
                    <span className="text-sm font-medium text-teal-700">
                      {uploading ? "جارٍ الرفع..." : "اختر صورة"}
                    </span>
                  </div>
                </label>
                <p className="text-xs text-slate-400">الحد الأقصى: 2 م.ب (يُضغط تلقائياً)</p>
              </div>
            </div>
          </div>
        </div>
      </ProLock>

      {/* ===== 2. أيقونة الشعار (customLogo) ===== */}
      <ProLock featureKey="customLogo" title="أيقونة الشعار" desc="اختر أيقونة مميزة لشعار متجرك">
        <div className="bg-white rounded-xl border border-slate-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
          <div className="p-4 sm:p-6 space-y-5">
            <h3 className="text-sm font-semibold flex items-center gap-2.5 text-slate-800 border-r-4 border-teal-500 pr-3">
              <Palette className="h-4 w-4 text-teal-600" />
              أيقونة الشعار
              <Badge className="bg-gradient-to-r from-teal-600 to-teal-700 text-white text-[10px] px-2 py-0.5 rounded-md border-0 shadow-sm">PRO</Badge>
            </h3>
            <div className="grid grid-cols-4 sm:grid-cols-4 gap-2.5">
              {Object.entries(DYN_ICON_MAP).map(([name, IconComp]) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => handleSelectIcon(name)}
                  className={cn(
                    "flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all duration-200 border border-slate-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.06)]",
                    selectedIcon === name
                      ? "bg-teal-50 shadow-md ring-1 ring-teal-300 border-teal-200"
                      : "bg-slate-50 hover:bg-slate-100 hover:shadow-md",
                  )}
                >
                  <IconComp className={cn("h-7 w-7", selectedIcon === name ? "text-teal-600 font-bold" : "text-slate-500")} />
                  <span className="text-xs font-medium text-slate-600">{ICON_LABELS[name]}</span>
                </button>
              ))}
            </div>
            {/* معاينة حية */}
            <div className="mt-3 pt-4 border-t border-slate-200/60">
              <p className="text-xs text-slate-400 mb-3">معاينة:</p>
              <div className="inline-flex items-center gap-2.5 p-3 rounded-xl shadow-sm" style={{ backgroundColor: shop?.primaryColor || "#0d7377" }}>
                <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center">
                  {(() => {
                    const Comp = DYN_ICON_MAP[selectedIcon] || PrinterIcon;
                    return <Comp className="h-5 w-5 text-white" />;
                  })()}
                </div>
                <span className="font-bold text-sm text-white">{form.name || "اسم المتجر"}</span>
              </div>
            </div>
          </div>
        </div>
      </ProLock>

      {/* ===== 3. القالب اللوني (customLogo) ===== */}
      <ThemePickerSection shopSlug={shopSlug} shop={shop} adminPin={adminPin} />

      {/* ===== 4. معلومات المتجر (مجاني) ===== */}
      <form onSubmit={handleSave} className="space-y-5">
        <div className="bg-white rounded-xl border border-slate-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
          <div className="p-4 sm:p-6 space-y-5">
            <h3 className="text-sm font-semibold flex items-center gap-2.5 text-slate-800 border-r-4 border-teal-500 pr-3">
              <Store className="h-4 w-4 text-teal-600" />
              معلومات المتجر
            </h3>
            <div>
              <Label className="text-slate-600 text-sm">اسم المتجر</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1.5 h-11 rounded-xl border-slate-200 focus:ring-teal-500/20 focus:border-teal-500 transition-all" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="flex items-center gap-1.5 text-slate-600 text-sm"><Phone className="h-3.5 w-3.5 text-slate-400" />الهاتف</Label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="mt-1.5 h-11 rounded-xl border-slate-200 focus:ring-teal-500/20 focus:border-teal-500 transition-all" dir="ltr" />
              </div>
              <div>
                <Label className="flex items-center gap-1.5 text-slate-600 text-sm"><MessageCircle className="h-3.5 w-3.5 text-slate-400" />واتساب</Label>
                <Input value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} className="mt-1.5 h-11 rounded-xl border-slate-200 focus:ring-teal-500/20 focus:border-teal-500 transition-all" dir="ltr" />
              </div>
              <div>
                <Label className="flex items-center gap-1.5 text-slate-600 text-sm"><Mail className="h-3.5 w-3.5 text-slate-400" />البريد الإلكتروني</Label>
                <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="mt-1.5 h-11 rounded-xl border-slate-200 focus:ring-teal-500/20 focus:border-teal-500 transition-all" dir="ltr" />
              </div>
              <div>
                <Label className="flex items-center gap-1.5 text-slate-600 text-sm"><MapPin className="h-3.5 w-3.5 text-slate-400" />العنوان</Label>
                <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="mt-1.5 h-11 rounded-xl border-slate-200 focus:ring-teal-500/20 focus:border-teal-500 transition-all" />
              </div>
            </div>
          </div>
        </div>

        <Button type="submit" className="w-full h-12 rounded-xl bg-teal-600 hover:bg-teal-700 text-white shadow-md hover:shadow-lg transition-all duration-200 active:scale-[0.98]" disabled={saving}>
          <Save className="h-4 w-4" />
          {saving ? "جارٍ الحفظ..." : "حفظ الإعدادات"}
        </Button>
      </form>

      {/* ===== 5. إدارة الأسعار والخدمات (customPricing / serviceToggle) ===== */}
      <PriceEditorSection shopSlug={shopSlug} shop={shop} adminPin={adminPin} />

      {/* ===== 6. معلومات المالك + تغيير كلمة المرور (مجاني) ===== */}
      <div className="bg-white rounded-xl border border-slate-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
        <div className="p-4 sm:p-6 space-y-5">
          <h3 className="text-sm font-semibold flex items-center gap-2.5 text-slate-800 border-r-4 border-teal-500 pr-3">
            <User className="h-4 w-4 text-teal-600" />
            معلومات المالك
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-slate-600 text-sm">الاسم</Label>
              <Input value={form.ownerName} onChange={(e) => setForm({ ...form, ownerName: e.target.value })} className="mt-1.5 h-11 rounded-xl border-slate-200 focus:ring-teal-500/20 focus:border-teal-500 transition-all" />
            </div>
            <div>
              <Label className="text-slate-600 text-sm">الهاتف</Label>
              <Input value={form.ownerPhone} onChange={(e) => setForm({ ...form, ownerPhone: e.target.value })} className="mt-1.5 h-11 rounded-xl border-slate-200 focus:ring-teal-500/20 focus:border-teal-500 transition-all" dir="ltr" />
            </div>
          </div>
          <Button onClick={handleSaveOwnerInfo} className="w-full h-11 rounded-xl bg-teal-600 hover:bg-teal-700 text-white shadow-md hover:shadow-lg transition-all duration-200 active:scale-[0.98]" disabled={saving}>
            <Save className="h-4 w-4" />
            {saving ? "جارٍ الحفظ..." : "حفظ معلومات المالك"}
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
        <div className="p-4 sm:p-6 space-y-5">
          <h3 className="text-sm font-semibold flex items-center gap-2.5 text-slate-800 border-r-4 border-teal-500 pr-3">
            <Lock className="h-4 w-4 text-teal-600" />
            تغيير كلمة المرور
          </h3>
          <form onSubmit={handleChangePin} className="space-y-3 max-w-md">
            {/* كلمة المرور الحالية */}
            <div>
              <Label className="text-xs text-slate-500 mb-1 block">كلمة المرور الحالية</Label>
              <div className="relative">
                <Input
                  type={showCurrentPin ? "text" : "password"}
                  value={pinForm.currentPin}
                  onChange={(e) => setPinForm({ ...pinForm, currentPin: e.target.value })}
                  placeholder="أدخل كلمة المرور الحالية"
                  dir="ltr"
                  className="h-11 pe-10 rounded-xl border-slate-200 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPin(!showCurrentPin)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  tabIndex={-1}
                >
                  {showCurrentPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            {/* كلمة المرور الجديدة */}
            <div>
              <Label className="text-xs text-slate-500 mb-1 block">كلمة المرور الجديدة</Label>
              <div className="relative">
                <Input
                  type={showNewPin ? "text" : "password"}
                  value={pinForm.newPin}
                  onChange={(e) => setPinForm({ ...pinForm, newPin: e.target.value })}
                  placeholder="10 أحرف على الأقل"
                  dir="ltr"
                  className="h-11 pe-10 rounded-xl border-slate-200 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                  required
                  minLength={10}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPin(!showNewPin)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  tabIndex={-1}
                >
                  {showNewPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            {/* تأكيد كلمة المرور */}
            <div>
              <Label className="text-xs text-slate-500 mb-1 block">تأكيد كلمة المرور الجديدة</Label>
              <Input
                type="password"
                value={pinForm.confirmPin}
                onChange={(e) => setPinForm({ ...pinForm, confirmPin: e.target.value })}
                placeholder="أعد إدخال كلمة المرور"
                dir="ltr"
                className="h-11 rounded-xl border-slate-200 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                required
                minLength={10}
              />
              {pinForm.confirmPin && pinForm.newPin !== pinForm.confirmPin && (
                <p className="text-xs text-rose-500 mt-1">كلمة المرور غير متطابقة</p>
              )}
            </div>
            <Button
              type="submit"
              className="w-full h-11 rounded-xl bg-teal-600 hover:bg-teal-700 text-white shadow-md hover:shadow-lg transition-all duration-200 active:scale-[0.98]"
              disabled={changingPin || !pinForm.currentPin || !pinForm.newPin || pinForm.newPin !== pinForm.confirmPin}
            >
              {changingPin ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              <span className="mr-1.5">تغيير كلمة المرور</span>
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

// ===== القالب اللوني =====
function ThemePickerSection({
  shopSlug,
  shop,
  adminPin,
}: {
  shopSlug: string;
  shop: { themeId?: number } | null;
  adminPin: string;
}) {
  const { hasFeature, refreshShop } = useShop();
  const canCustomize = hasFeature("customTheme");
  const [selectedThemeId, setSelectedThemeId] = useState(1);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (shop) {
      setSelectedThemeId(shop.themeId || 1);
    }
  }, [shop]);

  async function handleSelectTheme(themeId: number) {
    setSelectedThemeId(themeId);
    if (!canCustomize) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/shops/${encodeURIComponent(shopSlug)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ themeId, adminPin }),
      });
      if (!res.ok) throw new Error("فشل الحفظ");
      toast.success("تم تغيير القالب اللوني");
      refreshShop();
    } catch (err) {
      toast.error("فشل الحفظ", { description: (err as Error).message });
    } finally {
      setSaving(false);
    }
  }

  return (
    <ProLock featureKey="customTheme" title="القالب اللوني" desc="اختر قالب ألوان يناسب متجرك">
      <div className="bg-white rounded-xl border border-slate-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
        <div className="p-4 sm:p-6 space-y-5">
          <h3 className="text-sm font-semibold flex items-center gap-2.5 text-slate-800 border-r-4 border-teal-500 pr-3">
            <Palette className="h-4 w-4 text-teal-600" />
            القالب اللوني
          </h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {SHOP_THEMES.map((theme) => (
              <button
                key={theme.id}
                type="button"
                onClick={() => handleSelectTheme(theme.id)}
                className={cn(
                  "rounded-xl overflow-hidden transition-all duration-200 text-right border border-slate-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.06)]",
                  selectedThemeId === theme.id
                    ? "ring-2 ring-teal-500 shadow-md border-teal-200"
                    : "hover:shadow-md",
                )}
              >
                {/* معاينة مصغرة */}
                <div className="space-y-0">
                  {/* الشريط العلوي */}
                  <div className="h-2" style={{ backgroundColor: theme.topBar.bg }} />
                  {/* الترويسة */}
                  <div className="h-5 flex items-center gap-1 px-2" style={{ backgroundColor: theme.header.bg }}>
                    <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: theme.accent }} />
                    <div className="flex-1 h-1 rounded-full bg-gray-200" />
                  </div>
                  {/* المحتوى */}
                  <div className="h-8 bg-white" />
                  {/* التذييل */}
                  <div className="h-2" style={{ backgroundColor: theme.footer.bg }} />
                </div>
                {/* اسم القالب */}
                <div className="px-2.5 py-2 bg-slate-50">
                  <span className="text-[10px] font-medium text-slate-700">{theme.name}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </ProLock>
  );
}

// ===== محرر الأسعار والخدمات =====
interface ServiceSpec {
  type: string;
  name: string;
  emoji: string;
  basePricePerPage: number;
  enabled: boolean;
}

function PriceEditorSection({
  shopSlug,
  shop,
  adminPin,
}: {
  shopSlug: string;
  shop: { settings?: string | null } | null;
  adminPin: string;
}) {
  const { hasFeature } = useShop();
  const canCustomize = hasFeature("customPricing") || hasFeature("serviceToggle");
  const [services, setServices] = useState<ServiceSpec[]>(DEFAULT_SERVICES);
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (shop) {
      try {
        const raw = (shop.settings as string) || "{}";
        const parsed = JSON.parse(raw);
        if (parsed.services && Array.isArray(parsed.services)) {
          setServices(parsed.services);
        }
      } catch {
        // use defaults
      }
    }
  }, [shop]);

  function updateService(idx: number, patch: Partial<ServiceSpec>) {
    setServices((prev) => prev.map((s, i) => (i === idx ? { ...s, ...patch } : s)));
  }

  async function handleSaveServices() {
    setSaving(true);
    try {
      // دمج مع الإعدادات الحالية
      let existingSettings: Record<string, unknown> = {};
      try {
        const raw = (shop?.settings as string) || "{}";
        existingSettings = JSON.parse(raw);
      } catch {
        // ignore
      }
      const newSettings = { ...existingSettings, services };
      const res = await fetch(`/api/shops/${encodeURIComponent(shopSlug)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings: JSON.stringify(newSettings), adminPin }),
      });
      if (!res.ok) throw new Error("فشل الحفظ");
      toast.success("تم حفظ الأسعار والخدمات");
    } catch (err) {
      toast.error("فشل الحفظ", { description: (err as Error).message });
    } finally {
      setSaving(false);
    }
  }

  return (
    <ProLock featureKey={["customPricing", "serviceToggle"]} title="إدارة الأسعار والخدمات" desc="خصّص أسعار خدماتك بسهولة">
      <div className="bg-white rounded-xl border border-slate-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
        <div className="p-4 sm:p-6 space-y-5">
          <h3 className="text-sm font-semibold flex items-center gap-2.5 text-slate-800 border-r-4 border-teal-500 pr-3">
            <DollarSign className="h-4 w-4 text-teal-600" />
            إدارة الأسعار والخدمات
            <Badge className="bg-gradient-to-r from-teal-600 to-teal-700 text-white text-[10px] px-2 py-0.5 rounded-md border-0 shadow-sm">PRO</Badge>
          </h3>

          <div className="space-y-2.5">
            {services.map((svc, idx) => (
              <div key={svc.type} className="rounded-xl bg-slate-50 border border-slate-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">
                {/* رأس الخدمة */}
                <button
                  type="button"
                  onClick={() => setExpandedIdx(expandedIdx === idx ? null : idx)}
                  className="w-full flex items-center justify-between px-4 py-3.5 text-right hover:bg-slate-100 transition-all duration-200"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{svc.emoji}</span>
                    <div>
                      <div className="text-sm font-medium text-slate-800">{svc.name}</div>
                      <div className="text-xs text-slate-400">
                        {svc.basePricePerPage > 0 ? `${svc.basePricePerPage} د.ج/صفحة` : "مجاني"}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!svc.enabled && (
                      <Badge variant="outline" className="text-[10px] text-slate-400 border-slate-300 rounded-lg">معطّل</Badge>
                    )}
                    <ChevronLeft
                      className={cn(
                        "h-4 w-4 text-slate-400 transition-transform duration-200",
                        expandedIdx === idx && "rotate-90",
                      )}
                    />
                  </div>
                </button>

                {/* تفاصيل الخدمة */}
                {expandedIdx === idx && (
                  <div className="border-t border-slate-200 bg-white px-4 py-4 space-y-3">
                    <div>
                      <Label className="text-xs text-slate-500">اسم الخدمة</Label>
                      <Input
                        value={svc.name}
                        onChange={(e) => updateService(idx, { name: e.target.value })}
                        className="mt-1 h-10 text-sm rounded-xl border-slate-200 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-slate-500">السعر الأساسي لكل صفحة (د.ج)</Label>
                      <Input
                        type="number"
                        value={svc.basePricePerPage}
                        onChange={(e) => updateService(idx, { basePricePerPage: parseInt(e.target.value) || 0 })}
                        className="mt-1 h-10 text-sm rounded-xl border-slate-200 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                        dir="ltr"
                        min={0}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id={`svc-enabled-${idx}`}
                        checked={svc.enabled}
                        onCheckedChange={(checked) => updateService(idx, { enabled: !!checked })}
                      />
                      <Label htmlFor={`svc-enabled-${idx}`} className="text-xs cursor-pointer text-slate-600">
                        الخدمة مفعّلة
                      </Label>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <Button
            onClick={handleSaveServices}
            className="w-full h-12 rounded-xl bg-teal-600 hover:bg-teal-700 text-white shadow-md hover:shadow-lg transition-all duration-200 active:scale-[0.98]"
            disabled={saving}
          >
            <Save className="h-4 w-4" />
            {saving ? "جارٍ الحفظ..." : "حفظ الأسعار"}
          </Button>
        </div>
      </div>
    </ProLock>
  );
}

// ===== تبويب مشاركة الرابط =====
function ShareLinkTab({ shopName, shopSlug, customerLink }: { shopName: string; shopSlug: string; customerLink: string }) {
  const [copied, setCopied] = useState(false);
  const [adminCopied, setAdminCopied] = useState(false);
  const [qrUrl, setQrUrl] = useState("");

  useEffect(() => {
    if (!customerLink) return;
    getQRCode().then((QR) => {
      QR.toDataURL(customerLink, {
        width: 300,
        margin: 2,
        color: { dark: "#1a1a1a", light: "#ffffff" },
      }).then(setQrUrl).catch(() => {});
    });
  }, [customerLink]);

  async function robustCopy(text: string, successMsg: string, desc: string) {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.left = "-9999px";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      toast.success(successMsg, { description: desc });
      return true;
    } catch {
      toast.error("فشل النسخ", { description: "جرب تحديد النص ونسخه يدوياً" });
      return false;
    }
  }

  function copyCustomerLink() {
    robustCopy(customerLink, "تم نسخ رابط الزبائن", "شاركه مع زبائنك");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function copyAdminLink() {
    const adminLink = `${customerLink}?admin=1`;
    robustCopy(adminLink, "تم نسخ رابط الإدارة", "احفظه لنفسك فقط — لا تشاركه");
    setAdminCopied(true);
    setTimeout(() => setAdminCopied(false), 2000);
  }

  function shareViaWhatsApp() {
    const text = `مرحباً! يمكنك تقديم طلبات الطباعة مباشرة من هنا: ${customerLink}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  }

  function downloadQR() {
    if (!qrUrl) return;
    const a = document.createElement("a");
    a.href = qrUrl;
    a.download = `qr-${shopSlug}.png`;
    a.click();
  }

  function printQR() {
    if (!qrUrl) return;
    const printWin = window.open("", "_blank");
    if (!printWin) return;
    // Escape HTML to prevent XSS
    const safeName = shopName ? shopName.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;") : "المتجر";
    const safeLink = customerLink ? customerLink.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;") : "";
    printWin.document.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <title>${safeName} - رمز QR</title>
        <style>
          @media print { body { margin: 0; } }
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: Arial, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; padding: 20px; }
          .container { text-align: center; border: 3px solid #1a1a1a; border-radius: 16px; padding: 30px 40px; max-width: 400px; }
          h1 { font-size: 24px; font-weight: bold; margin-bottom: 8px; direction: rtl; }
          p { font-size: 13px; color: #666; margin-bottom: 20px; direction: rtl; }
          img { width: 250px; height: 250px; margin: 0 auto 16px; display: block; }
          .url { font-size: 11px; color: #999; direction: ltr; word-break: break-all; margin-top: 12px; }
          .hint { font-size: 12px; color: #888; margin-top: 16px; direction: rtl; }
          .print-btn { margin-top: 20px; padding: 10px 32px; background: #1a1a1a; color: white; border: none; border-radius: 8px; font-size: 14px; cursor: pointer; }
          .print-btn:hover { background: #333; }
          @media print { .print-btn, .no-print { display: none !important; } }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>${safeName}</h1>
          <p>امسح الرمز للوصول إلى متجرنا</p>
          <img src="${qrUrl}" alt="QR Code" />
          <div class="url">${safeLink}</div>
          <div class="hint">📱 افتح كاميرا هاتفك ووجّهها نحو الرمز</div>
        </div>
        <button class="print-btn no-print" onclick="window.print()">🖨️ طباعة</button>
      </body>
      </html>
    `);
    printWin.document.close();
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-teal-50 flex items-center justify-center mb-4 border border-teal-200/60">
          <Link2 className="h-8 w-8 text-teal-600" />
        </div>
        <h2 className="text-xl font-bold text-slate-800">مشاركة متجرك</h2>
        <p className="text-sm text-slate-500 mt-1.5">انشر رابط متجرك ليزوره زبائنك ويقدمون طلباتهم</p>
      </div>

      {/* رابط الزبائن */}
      <div className="bg-white rounded-xl border border-slate-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
        <div className="p-4 sm:p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50/80 flex items-center justify-center">
              <Link2 className="h-4 w-4 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-800">رابط الزبائن</h3>
              <p className="text-xs text-slate-400">هذا الرابط لمشاركته مع الزبائن فقط</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Input
              value={customerLink}
              readOnly
              className="flex-1 bg-slate-50 text-sm rounded-xl border-slate-200 h-11"
              dir="ltr"
              onClick={(e) => (e.target as HTMLInputElement).select()}
            />
            <Button onClick={copyCustomerLink} variant="outline" className="shrink-0 rounded-lg border-slate-200 hover:bg-slate-50 transition-all duration-200 h-11 px-4">
              <Copy className="h-4 w-4" />
              {copied ? "تم!" : "نسخ"}
            </Button>
          </div>
        </div>
      </div>

      {/* ===== رمز QR / الباركود ===== */}
      <div className="bg-white rounded-xl border border-slate-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">
        <div className="p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl bg-teal-50/80 flex items-center justify-center">
              <QrCode className="h-4 w-4 text-teal-600" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-800">رمز QR للمتجر</h3>
              <p className="text-xs text-slate-400">اطبعه واعرضه في محلك أو على وسائل التواصل</p>
            </div>
          </div>

          <div className="flex flex-col items-center gap-5">
            {qrUrl ? (
              <>
                <div className="rounded-xl p-5 bg-white shadow-sm border border-dashed border-slate-200">
                  <img src={qrUrl} alt="QR Code" className="w-48 h-48 md:w-56 md:h-56" />
                </div>
                <p className="text-xs text-slate-400 text-center">
                  📱 امسح الرمز بكاميرا الهاتف للوصول مباشرة إلى متجر <strong className="text-slate-700">{shopName}</strong>
                </p>
                <div className="flex gap-3 w-full">
                  <Button onClick={printQR} variant="outline" className="flex-1 h-11 gap-2 rounded-lg border-slate-200 hover:bg-slate-50 transition-all duration-200">
                    <Printer className="h-4 w-4" />
                    طباعة الباركود
                  </Button>
                  <Button onClick={downloadQR} variant="outline" className="flex-1 h-11 gap-2 rounded-lg border-slate-200 hover:bg-slate-50 transition-all duration-200">
                    <Download className="h-4 w-4" />
                    تحميل الصورة
                  </Button>
                </div>
              </>
            ) : (
              <div className="w-48 h-48 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-200/60">
                <div className="text-center">
                  <div className="animate-spin w-6 h-6 border-2 border-slate-200 border-t-teal-500 rounded-full mx-auto mb-2" />
                  <span className="text-xs text-slate-400">جارٍ توليد الرمز...</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* مشاركة عبر واتساب */}
      <Button onClick={shareViaWhatsApp} className="w-full h-12 bg-teal-600 hover:bg-teal-700 text-white gap-2 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 active:scale-[0.98]">
        <MessageCircle className="h-5 w-5" />
        مشاركة عبر واتساب
      </Button>

      {/* رابط الإدارة */}
      <div className="bg-white rounded-xl border border-slate-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.06)]" style={{ borderWidth: "1.5px", borderStyle: "dashed", borderColor: "#0d7377" }}>
        <div className="p-4 sm:p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-50/80 flex items-center justify-center">
              <AlertCircle className="h-4 w-4 text-teal-600" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-800">رابط الإدارة (لك أنت فقط)</h3>
              <p className="text-xs text-teal-600">⚠️ لا تشارك هذا الرابط مع أحد</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Input
              value={`${customerLink}?admin=1`}
              readOnly
              className="flex-1 bg-slate-50 text-sm rounded-xl border-slate-200 h-11"
              dir="ltr"
              onClick={(e) => (e.target as HTMLInputElement).select()}
            />
            <Button onClick={copyAdminLink} variant="outline" size="icon" className={cn("shrink-0 rounded-lg border-slate-200 transition-all duration-200 h-11 w-11", adminCopied ? "bg-emerald-50 border-emerald-300 text-emerald-600 hover:bg-emerald-50" : "hover:bg-slate-50")}>
              {adminCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>

      {/* تعليمات */}
      <div className="bg-teal-50 rounded-xl p-5 space-y-3 border border-teal-100">
        <h4 className="font-bold text-sm text-teal-800">📌 كيف تستخدم هذه الأدوات؟</h4>
        <ul className="text-xs text-teal-700/90 space-y-2">
          <li className="flex items-start gap-2.5">
            <span className="shrink-0 mt-0.5">✅</span>
            <span><strong>رابط الزبائن:</strong> أرسله لعملائك ليقدموا طلباتهم مباشرة</span>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="shrink-0 mt-0.5">📸</span>
            <span><strong>رمز QR:</strong> اطبعه وضعه في محلك أو انشره على وسائل التواصل الاجتماعي</span>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="shrink-0 mt-0.5">🖨️</span>
            <span><strong>طباعة الباركود:</strong> يمكنك وضعه على واجهة المحل أو كاونتر الاستقبال</span>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="shrink-0 mt-0.5">🔒</span>
            <span><strong>رابط الإدارة:</strong> احفظه في هاتفك لمتابعة الطلبات وإدارة متجرك</span>
          </li>
        </ul>
      </div>
    </div>
  );
}

// ===== بطاقة طلب للجوال =====
const SERVICE_EMOJI: Record<string, string> = {
  document: "🖨️", photo: "🖼️", binding: "📚", copy: "📄", card: "🪪", poster: "📜",
};

const OPTION_LABELS: Record<string, string> = {
  pages: "الصفحات", copies: "النسخ", color: "نوع الطباعة", paperSize: "حجم الورق",
  sides: "الوجهين", binding: "التجليد", paperType: "نوع الورق", photoSize: "حجم الصورة",
  finish: "التشطيب", retouch: "تحسينات", bindingType: "نوع التجليد", coverColor: "لون الغلاف",
  coverPrint: "طباعة الغلاف", cardType: "نوع البطاقة", lamination: "التغليف",
  posterSize: "حجم الملصق", material: "الخامة", sorting: "الترتيب", extras: "إضافات",
};

function MobileOrderCard({
  order,
  onStatusChange,
  shopId,
  onClick,
  shopName,
  shopPhone,
  shopAddress,
  selectionMode,
  selected,
  onToggleSelect,
}: {
  order: PrintOrderLite;
  onStatusChange: (order: PrintOrderLite, status: string) => void;
  shopId: string;
  onClick?: (order: PrintOrderLite) => void;
  shopName: string;
  shopPhone: string;
  shopAddress: string | null;
  selectionMode?: boolean;
  selected?: boolean;
  onToggleSelect?: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const { hasFeature } = useShop();
  const canDownloadFile = hasFeature("merchantFileDownload");
  const meta = STATUS_META[order.status];
  const serviceEmoji = SERVICE_EMOJI[order.serviceType] || "🖨️";

  const statusBorderClass: Record<string, string> = {
    pending: "border-l-amber-400",
    printing: "border-l-blue-400",
    ready: "border-l-emerald-400",
    delivered: "border-l-emerald-500",
    cancelled: "border-l-rose-400",
  };
  const borderClass = statusBorderClass[order.status] || "border-l-slate-300";

  return (
    <div className={cn("bg-white rounded-xl border border-slate-200/60 border-l-4 shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden transition-all duration-200", borderClass, selected && "ring-2 ring-teal-500 ring-offset-1")}>
      <button
        onClick={() => { if (selectionMode) { onToggleSelect?.(); return; } setExpanded(!expanded); if (!expanded && onClick) onClick(order); }}
        className="w-full p-4 text-right hover:bg-slate-50 transition-colors duration-200"
      >
        <div className="flex items-start justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            {selectionMode && (
              <Checkbox
                checked={selected || false}
                onCheckedChange={() => onToggleSelect?.()}
                onClick={(e) => e.stopPropagation()}
                className="shrink-0"
              />
            )}
            <span className="text-xl shrink-0">{serviceEmoji}</span>
            <div className="min-w-0">
              <div className="font-mono text-xs font-bold text-slate-800">{order.reference}</div>
              <div className="text-xs text-slate-400 mt-0.5">{order.serviceName}</div>
            </div>
          </div>
          <span className={cn("text-xs px-2.5 py-1 rounded-lg font-medium shrink-0", meta.bg)}>
            {meta.label}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="text-sm font-medium truncate text-slate-800">{order.customer.name}</div>
            <div className="text-xs text-slate-400" dir="ltr">{order.customer.phone}</div>
          </div>
          <div className="text-left shrink-0">
            <div className="font-bold text-teal-600 text-sm">{formatDA(order.total)}</div>
            <div className="text-xs text-slate-400">{order.pages}ص × {order.copies}ن</div>
          </div>
        </div>
        <div className="mt-2.5 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
          <span>{formatDateTimeAr(order.createdAt)}</span>
          <span className={cn("flex items-center gap-1 text-teal-500", expanded && "rotate-90", "transition-transform duration-200")}>
            <ChevronLeft className="h-3.5 w-3.5" />
            {expanded ? "إخفاء" : "عرض التفاصيل"}
          </span>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-slate-100 bg-slate-50 p-4 space-y-3">
          <div>
            <div className="text-xs font-bold text-slate-700 mb-2">مواصفات الطباعة</div>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(order.options)
                .filter(([k, v]) => v !== undefined && v !== null && v !== "" && !["notes", "printRange", "pageRange", "totalPages"].includes(k))
                .map(([k, v]) => (
                  <div key={k} className="rounded-xl bg-white shadow-sm border border-slate-200/60 px-3 py-2">
                    <div className="text-[11px] text-slate-400">{OPTION_LABELS[k as keyof typeof OPTION_LABELS] || k}</div>
                    <div className="text-xs font-semibold text-slate-800">{String(v)}</div>
                  </div>
                ))}
            </div>
          </div>

          {order.fileName && (
            <div>
              <div className="text-xs font-bold text-slate-700 mb-2">ملف الزبون</div>
              <div className="flex items-center gap-2 rounded-xl bg-white shadow-sm border border-slate-200/60 p-2.5">
                <FileText className="h-4 w-4 text-teal-500 shrink-0" />
                <span className="text-xs truncate text-slate-700 flex-1">{order.fileName}</span>
                {canDownloadFile ? (
                  <Button
                    size="sm"
                    className="h-7 text-[11px] px-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg shrink-0 transition-all duration-200 active:scale-[0.97]"
                    onClick={(e) => { e.stopPropagation(); window.open(`/api/orders/${order.id}/file?shopId=${shopId}`, "_blank"); }}
                  >
                    <Download className="h-3 w-3 ml-1" />
                    تنزيل
                  </Button>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] text-amber-600 bg-amber-50 border border-amber-200/60 px-2 py-0.5 rounded-full shrink-0">
                    <Crown className="h-2.5 w-2.5" />
                    PRO
                  </span>
                )}
              </div>
              <div className="mt-1.5 flex items-start gap-1.5 text-[10px] text-amber-700 bg-amber-50/80 border border-amber-200/40 rounded-lg p-2">
                <AlertCircle className="h-3 w-3 shrink-0 mt-0.5 text-amber-500" />
                <span>الملفات لا تُحفظ على السيرفر. يُرجى تنزيل الملف وحفظه على جهازك فوراً بعد استلام الطلب.</span>
              </div>
            </div>
          )}

          {/* وسوم الطلب */}
          {order.tags && order.tags.length > 0 && (
            <div>
              <div className="text-xs font-bold text-slate-700 mb-2">الوسوم</div>
              <div className="flex flex-wrap gap-1.5">
                {order.tags.map((tag, i) => (
                  <span key={i} className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200/60">
                    <Tag className="h-2.5 w-2.5" />
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* ملاحظات الإدارة */}
          {order.adminNotes && (
            <div>
              <div className="text-xs font-bold text-slate-700 mb-2">ملاحظات داخلية</div>
              <div className="rounded-xl bg-amber-50 border border-amber-200/60 p-2.5">
                <div className="flex items-start gap-1.5">
                  <StickyNote className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" />
                  <span className="text-xs text-amber-800">{order.adminNotes}</span>
                </div>
              </div>
            </div>
          )}

          {/* تواريخ الطباعة */}
          {(order.startedPrintingAt || order.completedPrintingAt) && (
            <div>
              <div className="text-xs font-bold text-slate-700 mb-2">مراحل الطباعة</div>
              <div className="space-y-1.5">
                {order.startedPrintingAt && (
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <PrinterIcon className="h-3.5 w-3.5 text-blue-500" />
                    <span>بدأ: {formatDateTimeAr(order.startedPrintingAt)}</span>
                  </div>
                )}
                {order.completedPrintingAt && (
                  <div className="flex items-center gap-2 text-xs text-emerald-600">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>انتهى: {formatDateTimeAr(order.completedPrintingAt)}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className={cn("grid gap-2.5 pt-1", hasFeature("receiptPrinting") ? "grid-cols-3" : "grid-cols-2")}>
            <Button
              size="sm"
              variant="outline"
              className="text-sm h-11 rounded-lg border-slate-200 hover:bg-slate-50 transition-all duration-200"
              onClick={() => window.open(`/api/orders/${order.id}/invoice?shopId=${shopId}`, "_blank")}
            >
              <Download className="h-3.5 w-3.5" />
              الفاتورة
            </Button>
            {hasFeature("receiptPrinting") && (
              <Button
                size="sm"
                variant="outline"
                className="text-sm h-11 rounded-lg border-slate-200 hover:bg-slate-50 transition-all duration-200"
                onClick={() => printReceipt(order, shopName, shopPhone, shopAddress)}
              >
                <Printer className="h-3.5 w-3.5" />
                إيصال
              </Button>
            )}
            <ChangeStatusSelect order={order} onChange={onStatusChange} />
          </div>
        </div>
      )}
    </div>
  );
}

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
        <Button size="sm" className="text-sm h-11 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-all duration-200 active:scale-[0.98]">
          <MoreHorizontal className="h-3.5 w-3.5" />
          تغيير الحالة
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-40 rounded-lg">
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