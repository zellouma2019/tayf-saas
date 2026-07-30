"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  Plus, Store, RefreshCw, Shield, Package, Clock,
  Search, ExternalLink, Trash2, Download, TrendingUp,
  Lock, Menu, Settings, DollarSign, BarChart3, Users, Activity,
  ArrowUpRight, Eye, ChevronLeft, Bell, Zap, Calendar,
  CheckCircle2, AlertTriangle, Info, Copy, Keyboard,
  FileText, Check, Square, X, CheckSquare, MessageCircle,
  LayoutGrid, ArrowUpDown, Filter, PlusCircle, ChevronUp, ChevronDown,
  Printer, Phone, Share2, ArrowRight, Play,
  StickyNote, UserCircle, BarChart2, Hash, Clock4, Send, Volume2, VolumeX,
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
import dynamic from "next/dynamic";
import { LoginGate } from "@/components/app/admin-login-gate";
import { AdminErrorBoundary } from "@/components/app/error-boundary";
import { AdminNotificationCenter } from "@/components/app/admin-notification-center";
import { AdminActivityPanel } from "@/components/app/admin-activity-panel";

// Lazy-loaded tab components — only one tab is visible at a time
const ShopManageCard = dynamic(() => import("@/components/app/admin-shop-card").then(m => ({ default: m.ShopManageCard })), { ssr: false, loading: () => <div className="h-48 rounded-xl border border-border bg-card animate-pulse" /> });
const CreateShopDialog = dynamic(() => import("@/components/app/admin-create-shop").then(m => ({ default: m.CreateShopDialog })), { ssr: false });
const OverviewTab = dynamic(() => import("@/components/app/admin-overview-tab").then(m => ({ default: m.OverviewTab })), { ssr: false, loading: () => <div className="space-y-4"><div className="grid grid-cols-2 lg:grid-cols-4 gap-3">{Array.from({length:4}).map((_,i)=><div key={i} className="h-28 rounded-xl border border-border bg-card animate-pulse" />)}</div><div className="h-64 rounded-xl border border-border bg-card animate-pulse" /></div> });
const SettingsTab = dynamic(() => import("@/components/app/admin-settings-tab").then(m => ({ default: m.SettingsTab })), { ssr: false, loading: () => <div className="h-64 rounded-xl border border-border bg-card animate-pulse" /> });
const SecurityTab = dynamic(() => import("@/components/app/admin-security-tab").then(m => ({ default: m.SecurityTab })), { ssr: false, loading: () => <div className="h-64 rounded-xl border border-border bg-card animate-pulse" /> });
const PlatformSettingsTab = dynamic(() => import("@/components/app/admin-platform-settings").then(m => ({ default: m.PlatformSettingsTab })), { ssr: false, loading: () => <div className="h-64 rounded-xl border border-border bg-card animate-pulse" /> });

const BUILD_HASH = "v7.0-" + (process.env.NEXT_PUBLIC_BUILD_HASH || "dev");

// ===== Data Health Banner with Auto-Dismiss =====
function DataHealthBanner({ message, status, onRetry }: { message: string; status: 'warning' | 'error'; onRetry: () => void }) {
  const [visible, setVisible] = useState(true);
  const [exiting, setExiting] = useState(false);

  // Auto-dismiss after 8 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setExiting(true);
      setTimeout(() => setVisible(false), 300);
    }, 8000);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div className={cn(
      "px-4 py-2 border-b text-xs flex items-center justify-center gap-2",
      exiting ? "health-banner-exit" : "health-banner anim-cinematic-in breathing-border",
      status === 'warning' && "bg-amber-500/5 border-amber-500/20 text-amber-600 dark:text-amber-400",
      status === 'error' && "bg-red-500/5 border-red-500/20 text-red-600 dark:text-red-400"
    )}>
      <span className={cn("w-1.5 h-1.5 rounded-full", status === 'warning' && "bg-amber-500 status-dot-ping", status === 'error' && "bg-red-500 status-dot-ping")} />
      <span>{message}</span>
      <button onClick={onRetry} className="hover:bg-white/10 rounded-md px-2 py-0.5 transition-colors flex items-center gap-1 micro-bounce press-feedback">
        <RefreshCw className="h-3 w-3" />
        إعادة المحاولة
      </button>
      <button onClick={() => { setExiting(true); setTimeout(() => setVisible(false), 300); }} className="hover:bg-white/10 rounded-md px-1 py-0.5 transition-colors ml-1">
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}

// ===== Static Time Ago (non-reactive, for modals) =====


// ===== Weekly Order Heatmap =====
function WeeklyOrderHeatmap({ orders, onDayClick }: { orders: GlobalOrder[]; onDayClick?: (day: string) => void }) {
  const days = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  const today = new Date();
  const weekDays: { label: string; date: string; count: number; total: number }[] = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const dayOrders = orders.filter(o => o.createdAt && o.createdAt.startsWith(dateStr));
    weekDays.push({
      label: days[d.getDay()],
      date: dateStr,
      count: dayOrders.length,
      total: dayOrders.reduce((s, o) => s + (o.total || 0), 0),
    });
  }

  const maxCount = Math.max(...weekDays.map(d => d.count), 1);

  return (
    <div className="weekly-heatmap-container">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">خريطة الأسبوع</span>
        <span className="text-[9px] text-muted-foreground/50">آخر 7 أيام</span>
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {weekDays.map((day) => {
          const intensity = day.count / maxCount;
          return (
            <button
              key={day.date}
              onClick={() => onDayClick?.(day.date)}
              className="heatmap-cell group relative"
              title={`${day.label}: ${day.count} طلب`}
              style={{
                backgroundColor: day.count === 0
                  ? 'var(--muted, #f0f0f0)'
                  : `rgba(245, 158, 11, ${0.15 + intensity * 0.85})`,
                animationDelay: `${weekDays.indexOf(day) * 60}ms`,
              }}
            >
              <span className="heatmap-cell-label">{day.label.slice(0, 2)}</span>
              {day.count > 0 && (
                <span className="heatmap-cell-count">{day.count}</span>
              )}
              <div className="heatmap-tooltip">
                <p className="font-medium text-[10px]">{day.label} — {day.date}</p>
                <p className="text-[9px] text-muted-foreground">{day.count} طلب</p>
                {day.total > 0 && (
                  <p className="text-[9px] font-mono text-amber-500">{day.total.toLocaleString("ar-DZ")} د.ج</p>
                )}
              </div>
            </button>
          );
        })}
      </div>
      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-1">
          <span className="text-[8px] text-muted-foreground/40">أقل</span>
          {[0.15, 0.4, 0.65, 0.9].map((o, i) => (
            <span key={i} className="w-3 h-3 rounded-sm" style={{ backgroundColor: `rgba(245, 158, 11, ${o})` }} />
          ))}
          <span className="text-[8px] text-muted-foreground/40">أكثر</span>
        </div>
        <span className="text-[9px] text-muted-foreground/50">المجموع: {weekDays.reduce((s,d)=>s+d.count,0)} طلب</span>
      </div>
    </div>
  );
}

// ===== Duplicate Order Warning =====
function DuplicateWarning({ order, allOrders }: { order: GlobalOrder; allOrders: GlobalOrder[] }) {
  const duplicates = allOrders.filter(o =>
    o.id !== order.id &&
    (o.customer?.name || "") === (order.customer?.name || "") &&
    (o.customer?.phone || "") === (order.customer?.phone || "") &&
    (o.serviceType || o.serviceName) === (order.serviceType || order.serviceName) &&
    Math.abs(new Date(o.createdAt).getTime() - new Date(order.createdAt).getTime()) < 86400000
  );

  if (duplicates.length === 0) return null;

  return (
    <div className="duplicate-warning-bar">
      <AlertTriangle className="h-3 w-3 flex-shrink-0 duplicate-warning-icon" />
      <span className="text-[10px]">{duplicates.length} طلب مكرر مشابه اليوم</span>
    </div>
  );
}



// ===== Order Calendar View =====
function OrderCalendarView({ orders, month, year, onPrevMonth, onNextMonth, onDayClick }: {
  orders: GlobalOrder[]; month: number; year: number;
  onPrevMonth: () => void; onNextMonth: () => void;
  onDayClick?: (date: string) => void;
}) {
  const monthNames = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
  const dayNames = ["أحد", "إثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة", "سبت"];
  
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  // Build day data
  const days: { day: number; dateStr: string; orders: GlobalOrder[]; isToday: boolean }[] = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    days.push({
      day: d,
      dateStr,
      orders: orders.filter(o => o.createdAt && o.createdAt.startsWith(dateStr)),
      isToday: dateStr === todayStr,
    });
  }

  const maxOrders = Math.max(...days.map(d => d.orders.length), 1);

  return (
    <div className="calendar-view-container">
      <div className="flex items-center justify-between mb-3">
        <button onClick={onPrevMonth} className="calendar-nav-btn"><ChevronRight className="h-4 w-4" /></button>
        <h3 className="text-sm font-bold text-foreground calendar-month-title">
          {monthNames[month]} {year}
        </h3>
        <button onClick={onNextMonth} className="calendar-nav-btn"><ChevronLeft className="h-4 w-4" /></button>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-1">
        {dayNames.map(d => (
          <div key={d} className="calendar-day-header">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {/* Empty cells before first day */}
        {Array.from({ length: firstDay }).map((_, i) => (
          <div key={`empty-${i}`} className="calendar-day-cell calendar-day-empty" />
        ))}
        {days.map(({ day, dateStr, orders: dayOrders, isToday }) => (
          <button
            key={dateStr}
            onClick={() => dayOrders.length > 0 && onDayClick?.(dateStr)}
            className={cn(
              "calendar-day-cell",
              isToday && "calendar-day-today",
              dayOrders.length > 0 && "calendar-day-has-orders",
              dayOrders.length >= 5 && "calendar-day-busy"
            )}
            style={dayOrders.length > 0 ? {
              backgroundColor: `rgba(139, 92, 246, ${Math.min(0.08 + (dayOrders.length / maxOrders) * 0.25, 0.35)})`,
              animationDelay: `${day * 8}ms`,
            } : undefined}
          >
            <span className="calendar-day-number">{day}</span>
            {dayOrders.length > 0 && (
              <span className="calendar-day-count">{dayOrders.length}</span>
            )}
          </button>
        ))}
      </div>
      <div className="flex items-center justify-between mt-3 text-[10px] text-muted-foreground/60">
        <span>{days.reduce((s, d) => s + d.orders.length, 0)} طلب هذا الشهر</span>
        <span>{formatNumber(days.reduce((s, d) => s + d.orders.reduce((a, o) => a + (o.total || 0), 0), 0))} د.ج</span>
      </div>
    </div>
  );
}

// ===== Status Flow Mini Dots =====
const STATUS_FLOW_KEYS = ["pending", "confirmed", "printing", "ready", "delivered"];
function StatusFlowDots({ status }: { status: string }) {
  const currentIdx = STATUS_FLOW_KEYS.indexOf(status);
  return (
    <div className="status-flow-mini">
      {STATUS_FLOW_KEYS.map((key, i) => (
        <span
          key={key}
          className={cn(
            "flow-dot",
            i < currentIdx && "active",
            i === currentIdx && "current"
          )}
          title={STATUS_META[key as keyof typeof STATUS_META]?.label || key}
        />
      ))}
    </div>
  );
}

// ===== Customer Quick Profile =====
function CustomerQuickProfile({ order, allOrders, onClose }: {
  order: GlobalOrder; allOrders: GlobalOrder[];
  onClose: () => void;
}) {
  const custOrders = allOrders.filter(o =>
    (o.customer?.name || "") === (order.customer?.name || "") &&
    (o.customer?.phone || "") === (order.customer?.phone || "")
  );
  const totalSpent = custOrders.reduce((s, o) => s + (o.total || 0), 0);
  const statusCounts: Record<string, number> = {};
  custOrders.forEach(o => { statusCounts[o.status] = (statusCounts[o.status] || 0) + 1; });

  return (
    <div className="customer-quick-profile" onClick={e => e.stopPropagation()}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="cq-avatar">
            <UserCircle className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-bold"><button onClick={(e) => { e.stopPropagation(); setCustomerProfile(order); }} className="cq-trigger hover:text-primary transition-colors hover:underline text-right font-medium">{order.customer?.name || "—"}</button></p>
            <p className="text-[10px] text-muted-foreground font-mono" dir="ltr">{order.customer?.phone || "—"}</p>
          </div>
        </div>
        <button onClick={onClose} className="p-1 rounded-lg hover:bg-muted transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="cq-stat-card">
          <span className="cq-stat-value">{custOrders.length}</span>
          <span className="cq-stat-label">طلب</span>
        </div>
        <div className="cq-stat-card">
          <span className="cq-stat-value cq-stat-gold">{formatNumber(totalSpent)}</span>
          <span className="cq-stat-label">د.ج</span>
        </div>
        <div className="cq-stat-card">
          <span className="cq-stat-value">{statusCounts['delivered'] || 0}</span>
          <span className="cq-stat-label">مُنجز</span>
        </div>
      </div>
      <div className="space-y-1.5 max-h-32 overflow-y-auto scrollbar-thin-v2">
        {custOrders.slice(0, 8).map(o => (
          <div key={o.id} className="cq-order-row">
            <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0",
              STATUS_META[o.status as keyof typeof STATUS_META]?.color?.replace('text-', 'bg-') || "bg-muted"
            )} />
            <span className="text-[10px] truncate flex-1">{o.serviceName || o.serviceType}</span>
            <span className="text-[10px] font-mono tabular-nums revenue-gold">{formatNumber(o.total)}</span>
            <span className="text-[9px] text-muted-foreground">{formatDA(o.createdAt)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function getTimeAgoStatic(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  if (diffMs < 60000) return 'الآن';
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 60) return `منذ ${diffMin} دقيقة`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `منذ ${diffHr} ساعة`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `منذ ${diffDay} يوم`;
  const diffWeek = Math.floor(diffDay / 7);
  return `منذ ${diffWeek} أسبوع`;
}

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
  const [searchOpen, setSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [orderStatusFilter, setOrderStatusFilter] = useState("all");
  const [shopFilter, setShopFilter] = useState("all");
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [shopSearch, setShopSearch] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<GlobalOrder | null>(null);
  // Date range filter
  const [dateFilter, setDateFilter] = useState<"all" | "today" | "week" | "month" | "custom">("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [showPriorityFilter, setShowPriorityFilter] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState("");
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  // Quick view
  const [quickViewOrder, setQuickViewOrder] = useState<GlobalOrder | null>(null);
  // Sorting
  const [sortKey, setSortKey] = useState<"date" | "amount" | "customer" | "status">("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  // View mode: table, kanban, or cards
  const [ordersView, setOrdersView] = useState<"table" | "kanban" | "cards" | "calendar">("table");
  // Priority filter
  // Order comments
  const [orderComments, setOrderComments] = useState<Record<string, string>>({});
  const [qvComment, setQvComment] = useState("");
  // Weekly heatmap data
  const [showHeatmap, setShowHeatmap] = useState(false);
  // Calendar view
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());
  // Sound toggle
  const [soundEnabled, setSoundEnabled] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('sound-notifications') !== 'false';
    return true;
  });

  const [priorityFilter, setPriorityFilter] = useState<"all" | "urgent" | "medium" | "normal">("all");
  // Enhanced FAB
  const [fabOpen, setFabOpen] = useState(false);
  // Data health tracking
  const [dataHealth, setDataHealth] = useState<{ status: 'healthy' | 'warning' | 'error'; message: string }>({ status: 'healthy', message: '' });
  // Platform settings
  const [platformLogo, setPlatformLogo] = useState("");
  const [platformLogoDark, setPlatformLogoDark] = useState("");
  const [platformName, setPlatformName] = useState("طيف");
  // Fallback shops
  const [fallbackShops, setFallbackShops] = useState<ShopStat[]>([]);
  // Customer quick profile
  const [customerProfile, setCustomerProfile] = useState<GlobalOrder | null>(null);
  // Order inline note editing
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");
  // Active filters summary

  // Save comment for an order
  const saveComment = useCallback(async (orderId: string, comment: string) => {
    setOrderComments(prev => ({ ...prev, [orderId]: comment }));
    try {
      await fetch(`/api/orders/${orderId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: comment }),
      });
    } catch {}
  }, []);

  // Get time spent in current status
  const getTimeInStatus = useCallback((order: GlobalOrder) => {
    const created = new Date(order.createdAt).getTime();
    const now = Date.now();
    const hours = Math.floor((now - created) / 3600000);
    if (hours < 1) return 'أقل من ساعة';
    if (hours < 24) return `${hours} ساعة`;
    const days = Math.floor(hours / 24);
    return `${days} يوم`;
  }, []);

  const activeFilterCount = [statusFilter !== 'all', shopFilter !== 'all', dateFilter !== 'all', priorityFilter !== 'all', search.length > 0].filter(Boolean).length;

  // Whether initial data load has completed at least once
  const dataLoaded = globalStats !== null || fallbackShops.length > 0 || allOrders.length > 0;
  const isInitialLoading = loading && !dataLoaded;
  const isRefreshing = refreshing || (loading && dataLoaded);

  // Load platform settings
  useEffect(() => {
    fetch("/api/super-admin/platform-settings")
      .then((r) => r.text())
      .then((text) => {
        try {
          const d = JSON.parse(text);
          const s = d.settings || {};
          setPlatformLogo(s.platformLogo || "");
          setPlatformLogoDark(s.platformLogoDark || "");
          setPlatformName(s.platformName || "طيف");
        } catch {}
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

  // Load all data after authentication (with auto-retry)
  const loadAll = useCallback(async (showLoading = true, retryCount = 0) => {
    if (showLoading) setLoading(true);
    else setRefreshing(true);
    setLoadError("");
    try {
      const cacheBust = `?_=${Date.now()}`;
      const [statsRes, ordersRes] = await Promise.all([
        fetch(`/api/admin/global-stats${cacheBust}`),
        fetch(`/api/orders${cacheBust}`),
      ]);
      // Safe JSON parsing - handle non-JSON responses and HTTP errors gracefully
      async function safeJson(res: Response, label: string) {
        if (!res.ok) {
          const text = await res.text().catch(() => '');
          throw new Error(`${label} API error (${res.status}): ${text.slice(0, 200) || 'Unknown error'}`);
        }
        const text = await res.text();
        try {
          return JSON.parse(text);
        } catch {
          throw new Error(`${label} returned non-JSON response (${res.status})`);
        }
      }
      const statsData = await safeJson(statsRes, 'global-stats');
      const ordersData = await safeJson(ordersRes, 'orders');

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
      const errMsg = err instanceof Error ? err.message : "فشل في تحميل البيانات";
      // Auto-retry up to 3 times with exponential backoff
      if (retryCount < 3) {
        const delay = Math.min(1000 * Math.pow(2, retryCount), 5000);
        console.log(`[loadAll] Retry ${retryCount + 1}/3 in ${delay}ms — ${errMsg}`);
        setTimeout(() => loadAll(showLoading, retryCount + 1), delay);
      } else {
        setLoadError(errMsg);
      }
    } finally {
      if (retryCount === 0 || retryCount >= 3) {
        setLoading(false);
        setRefreshing(false);
      }
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

  // Keyboard shortcuts: Alt+R = refresh, Alt+1/2/3 = tabs, Ctrl+K = search, ? = help
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.altKey && e.key === "r") {
        e.preventDefault();
        loadAll(false);
      }
      if (e.altKey && e.key === "1") setActiveTab("overview");
      if (e.altKey && e.key === "2") setActiveTab("shops");
      if (e.altKey && e.key === "3") setActiveTab("orders");
      if (e.altKey && e.key === "4") setActiveTab("settings");
      if (e.altKey && e.key === "5") setActiveTab("security");
      if (e.altKey && e.key === "6") setActiveTab("platform");
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
        setSearchOpen(true);
      }
      if (e.key === "?" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag !== "INPUT" && tag !== "TEXTAREA") {
          e.preventDefault();
          setShowShortcuts(prev => !prev);
        }
      }
      if (e.key === "Escape" && showShortcuts) {
        setShowShortcuts(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [loadAll, showShortcuts]);

  // Close global search dropdown on outside click or Escape
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (searchInputRef.current && !searchInputRef.current.parentElement?.contains(target)) {
        setSearchOpen(false);
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setSearchOpen(false);
        searchInputRef.current?.blur();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  // Auto-refresh: poll every 30 seconds when authenticated
  useEffect(() => {
    if (!authenticated) return;
    const interval = setInterval(() => {
      loadAll(false); // silent refresh
    }, 30_000);
    return () => clearInterval(interval);
  }, [authenticated, loadAll]);

  // Play notification sound when new pending orders arrive
  const prevPendingRef = useRef(0);
  useEffect(() => {
    const currentPending = allOrders.filter(o => o.status === 'pending').length;
    if (prevPendingRef.current > 0 && currentPending > prevPendingRef.current) {
      // New pending order detected — play sound
      try {
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = 880;
        osc.type = 'sine';
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.5);
      } catch {}
    }
    prevPendingRef.current = currentPending;
  }, [allOrders.length]);

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

    // R71: Sound notification on status change
    if (newStatus === "delivered") playDeliveredChime();
    else if (newStatus === "ready") playNewOrderChime();
      loadAll(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'فشل في تحديث الحالة');
    }
  }, [loadAll]);

  // Add/update order note
  const saveOrderNote = useCallback(async (orderId: string, note: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statusNotes: note }),
      });
      if (!res.ok) throw new Error('فشل في حفظ الملاحظة');
      toast.success('تم حفظ الملاحظة');
      setEditingNote(null);
      setNoteText("");
      loadAll(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'فشل في حفظ الملاحظة');
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

  // Duplicate order detection — flags orders with same phone+serviceType+shopId within 1 hour
  const duplicateOrderIds = useMemo(() => {
    const dupes = new Set<string>();
    const seen = new Map<string, string[]>(); // key → order IDs
    safeOrders.forEach((o) => {
      const phone = o.customer?.phone || "";
      const service = o.serviceType || o.serviceName || "";
      const shop = o.shopId || o.shopSlug || "";
      if (!phone || !service) return;
      const key = `${phone}:${service}:${shop}`;
      const list = seen.get(key) || [];
      list.push(o.id);
      seen.set(key, list);
    });
    seen.forEach((ids) => {
      if (ids.length > 1) {
        // Check if any pair is within 1 hour
        const ordersById = new Map(safeOrders.map(o => [o.id, o]));
        for (let i = 0; i < ids.length; i++) {
          for (let j = i + 1; j < ids.length; j++) {
            const a = ordersById.get(ids[i]);
            const b = ordersById.get(ids[j]);
            if (a && b) {
              const diff = Math.abs(new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
              if (diff < 60 * 60 * 1000) { // within 1 hour
                dupes.add(ids[i]);
                dupes.add(ids[j]);
              }
            }
          }
        }
      }
    });
    return dupes;
  }, [safeOrders]);

  // Customer loyalty scoring — ranks customers by order count and total spend
  const customerLoyalty = useMemo(() => {
    const map = new Map<string, { name: string; phone: string; orderCount: number; totalSpend: number; lastOrder: string }>();
    safeOrders.forEach((o) => {
      const key = o.customer?.phone || o.customer?.name || o.id;
      const entry = map.get(key) || { name: o.customer?.name || '—', phone: o.customer?.phone || '', orderCount: 0, totalSpend: 0, lastOrder: '' };
      entry.orderCount++;
      entry.totalSpend += o.total || 0;
      if (!entry.lastOrder || new Date(o.createdAt) > new Date(entry.lastOrder)) entry.lastOrder = o.createdAt;
      map.set(key, entry);
    });
    return map;
  }, [safeOrders]);

  // Get loyalty tier for a customer
  function getLoyaltyTier(phoneOrName: string): { tier: string; color: string; icon: string } {
    const c = customerLoyalty.get(phoneOrName);
    if (!c) return { tier: '', color: '', icon: '' };
    if (c.orderCount >= 5 || c.totalSpend >= 5000) return { tier: 'ذهبي', color: 'text-amber-500', icon: '★' };
    if (c.orderCount >= 3 || c.totalSpend >= 2000) return { tier: 'فضي', color: 'text-slate-400', icon: '☆' };
    if (c.orderCount >= 2) return { tier: 'برونزي', color: 'text-orange-600', icon: '●' };
    return { tier: '', color: '', icon: '' };
  }

  // Customer profile data for panel
  const customerProfileData = useMemo(() => {
    if (!customerProfile) return null;
    const custOrders = safeOrders.filter(o => 
      (o.customer?.phone || o.customer?.name || '') === customerProfile
    );
    if (custOrders.length === 0) return null;
    const totalSpend = custOrders.reduce((s,o) => s + (o.total||0), 0);
    const statusDist: Record<string, number> = {};
    custOrders.forEach(o => { statusDist[o.status] = (statusDist[o.status] || 0) + 1; });
    const serviceTypes = new Set(custOrders.map(o => o.serviceType || o.serviceName));
    const shops = new Set(custOrders.map(o => o.shopName || o.shopSlug));
    const avgOrder = totalSpend / custOrders.length;
    const firstOrder = custOrders.reduce((a,b) => new Date(a.createdAt) < new Date(b.createdAt) ? a : b);
    const lastOrder = custOrders.reduce((a,b) => new Date(a.createdAt) > new Date(b.createdAt) ? a : b);
    return {
      name: custOrders[0].customer?.name || '—',
      phone: custOrders[0].customer?.phone || '',
      orderCount: custOrders.length,
      totalSpend,
      avgOrder,
      statusDist,
      serviceTypes: Array.from(serviceTypes),
      shops: Array.from(shops),
      firstOrderDate: firstOrder.createdAt,
      lastOrderDate: lastOrder.createdAt,
      orders: custOrders.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
      loyalty: getLoyaltyTier(customerProfile),
    };
  }, [customerProfile, safeOrders]);

  // Service type distribution data
  const serviceDistribution = useMemo(() => {
    const dist = new Map<string, { count: number; revenue: number; service: string }>();
    safeOrders.forEach(o => {
      const key = o.serviceType || o.serviceName || 'أخرى';
      const entry = dist.get(key) || { count: 0, revenue: 0, service: key };
      entry.count++;
      entry.revenue += o.total || 0;
      dist.set(key, entry);
    });
    return Array.from(dist.values()).sort((a,b) => b.revenue - a.revenue);
  }, [safeOrders]);

  // Clear all filters helper
  const clearAllFilters = useCallback(() => {
    setStatusFilter('all');
    setShopFilter('all');
    setDateFilter('all');
    setPriorityFilter('all');
    setSearch('');
  }, []);

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
    if (orderStatusFilter !== "all" && o.status !== orderStatusFilter) return false;
    if (shopFilter !== "all") {
      const shopName = o.shopName || o.shopSlug || "";
      if (!shopName.includes(shopFilter)) return false;
    }
    if (search) {
      const s = search.toLowerCase();
      const searchable = `${o.id} ${o.reference || ''} ${o.customer?.name || ''} ${o.customer?.phone || ''} ${o.shopName} ${o.serviceType || ''} ${o.serviceName || ''}`.toLowerCase();
      if (!searchable.includes(s)) return false;
    }
    // Date range filter
    if (!isInDateRange(o.createdAt)) return false;
    // Priority filter
    if (priorityFilter !== "all") {
      const total = o.total || 0;
      if (priorityFilter === "urgent" && total < 5000) return false;
      if (priorityFilter === "medium" && (total < 2000 || total >= 5000)) return false;
      if (priorityFilter === "normal" && total >= 2000) return false;
    }
    return true;
  });

  // Sorting
  const sortedOrders = useMemo(() => {
    const arr = [...filteredOrders];
    arr.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "date":
          cmp = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          break;
        case "amount":
          cmp = (b.total || 0) - (a.total || 0);
          break;
        case "customer":
          cmp = (a.customer?.name || "").localeCompare(b.customer?.name || "", "ar");
          break;
        case "status":
          const order = ["cancelled", "pending", "confirmed", "printing", "ready", "delivered"];
          cmp = (order.indexOf(a.status) ?? 99) - (order.indexOf(b.status) ?? 99);
          break;
      }
      return sortDir === "desc" ? -cmp : cmp;
    });
    return arr;
  }, [filteredOrders, sortKey, sortDir]);

  const toggleSort = useCallback((key: typeof sortKey) => {
    if (sortKey === key) {
      setSortDir(d => d === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }, [sortKey]);

  // Sortable header helper
  const SortTh = useCallback(({ label, sortField, children }: { label: string; sortField: typeof sortKey; children?: React.ReactNode }) => {
    const isActive = sortKey === sortField;
    return (
      <TableHead
        className={cn("text-right sortable-th", isActive && sortDir === "desc" ? "active desc" : isActive && "active")}
        onClick={() => toggleSort(sortField)}
      >
        <span className="flex items-center gap-0.5">
          {label}
          <span className="sort-icon">▲▼</span>
        </span>
        {children}
      </TableHead>
    );
  }, [sortKey, sortDir, toggleSort]);

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
    try {
      const res = await fetch(`/api/orders/bulk-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderIds: Array.from(selectedIds), status: bulkStatus }),
      });
      if (!res.ok) throw new Error('فشل التحديث');
      toast.success(`تم تحديث ${selectedIds.size} طلب`);
      setSelectedIds(new Set());
      setBulkStatus("");
      loadAll(false);
    } catch {
      toast.error('خطأ', { description: 'فشل تحديث حالة الطلبات' });
    }
  }, [bulkStatus, selectedIds, loadAll]);

  const applyBulkDelete = useCallback(async () => {
    if (selectedIds.size === 0) return;
    try {
      const res = await fetch(`/api/orders/bulk`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selectedIds) }),
      });
      if (!res.ok) throw new Error('فشل الحذف');
      toast.success(`تم حذف ${selectedIds.size} طلب`);
      setSelectedIds(new Set());
      setBulkDeleteOpen(false);
      loadAll(false);
    } catch {
      toast.error('خطأ', { description: 'فشل حذف الطلبات' });
    }
  }, [selectedIds, loadAll]);

  const shops = globalStats?.shopStats || fallbackShops;
  const safeShops = Array.isArray(shops) ? shops : [];
  const filteredShops = safeShops.filter((s) => {
    if (!shopSearch) return true;
    const q = shopSearch.toLowerCase();
    return (s.name || "").toLowerCase().includes(q) || (s.slug || "").toLowerCase().includes(q);
  });

  // Global search results
  const globalSearchResults = useMemo(() => {
    if (!search.trim()) return { orders: [], shops: [], customers: [] };
    const q = search.toLowerCase().trim();
    const matchedOrders = safeOrders.filter((o) => {
      const haystack = `${o.reference || o.id} ${o.customer?.name || ''} ${o.customer?.phone || ''} ${o.shopName} ${o.serviceType || o.serviceName}`.toLowerCase();
      return haystack.includes(q);
    }).slice(0, 5);
    const matchedShops = safeShops.filter((s) => {
      const haystack = `${s.name || ''} ${s.slug || ''} ${s.ownerName || ''} ${s.phone || ''}`.toLowerCase();
      return haystack.includes(q);
    }).slice(0, 5);
    // Extract unique customers from orders
    const customerMap = new Map<string, { name: string; phone: string }>();
    safeOrders.forEach((o) => {
      const name = o.customer?.name || '';
      const phone = o.customer?.phone || '';
      if ((name || phone) && !customerMap.has(phone || name)) {
        customerMap.set(phone || name, { name, phone });
      }
    });
    const matchedCustomers = Array.from(customerMap.values()).filter((c) => {
      const haystack = `${c.name} ${c.phone}`.toLowerCase();
      return haystack.includes(q);
    }).slice(0, 5);
    return { orders: matchedOrders, shops: matchedShops, customers: matchedCustomers };
  }, [search, safeOrders, safeShops]);

  const hasGlobalResults = globalSearchResults.orders.length > 0 || globalSearchResults.shops.length > 0 || globalSearchResults.customers.length > 0;

  // Status timeline for order detail
  const statusTimeline = selectedOrder ? [
    { key: "pending", label: "تم الاستلام", time: selectedOrder.createdAt },
    { key: "confirmed", label: "تم التأكيد", time: null },
    { key: "printing", label: "جاري الطباعة", time: null },
    { key: "ready", label: "جاهز للتسليم", time: null },
    { key: "delivered", label: "تم التسليم", time: null },
  ] : [];
  const currentStatusIdx = selectedOrder ? statusTimeline.findIndex(s => s.key === selectedOrder.status) : -1;

  // Export admin report to printable page
  function exportAdminReport() {
    const stats = globalStats;
    const orders = allOrders;
    if (!stats) { toast.error("لا توجد بيانات للتصدير"); return; }
    const statusMap: Record<string,string> = { pending: "معلق", confirmed: "مؤكد", printing: "طباعة", ready: "جاهز", delivered: "تم التسليم", cancelled: "ملغى" };
    const shopsHtml = (stats.shopStats || []).map((s: any) => 
      `<tr><td>${s.name || '-'}</td><td>${s.orders || 0}</td><td>${(s.revenue || 0).toLocaleString()} د.ج</td></tr>`
    ).join('');
    const ordersHtml = orders.slice(0, 20).map((o: any) =>
      `<tr><td>${o.reference || o.id}</td><td>${o.customer?.name || o.customer || '-'}</td><td>${o.serviceType || o.serviceName || '-'}</td><td>${statusMap[o.status] || o.status}</td><td>${(o.total || 0).toLocaleString()} د.ج</td></tr>`
    ).join('');
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="UTF-8"><title>تقرير طيف</title>
    <style>*{font-family:Arial,sans-serif;box-sizing:border-box}body{padding:30px;max-width:800px;margin:auto;color:#333}
    h1{text-align:center;color:#6366f1;border-bottom:3px solid #6366f1;padding-bottom:10px;margin-bottom:5px}
    .date{text-align:center;color:#666;margin-bottom:20px;font-size:14px}
    .stats{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:24px}
    .stat{background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:14px;text-align:center}
    .stat-value{font-size:24px;font-weight:bold;color:#6366f1}
    .stat-label{font-size:12px;color:#666;margin-top:4px}
    table{width:100%;border-collapse:collapse;margin-bottom:20px}
    th{background:#6366f1;color:white;padding:10px;text-align:right;font-size:13px}
    td{padding:8px 10px;border-bottom:1px solid #eee;font-size:13px}
    tr:nth-child(even){background:#f8fafc}
    .section-title{font-size:16px;font-weight:bold;color:#333;margin:20px 0 10px;padding-bottom:5px;border-bottom:2px solid #e2e8f0}
    .footer{text-align:center;margin-top:30px;color:#999;font-size:12px}
    @media print{body{padding:10px}}</style></head><body>
    <h1>تقرير منصة طيف</h1>
    <div class="date">${new Date().toLocaleDateString('ar-SA', {year:'numeric',month:'long',day:'numeric'})}</div>
    <div class="stats">
      <div class="stat"><div class="stat-value">${stats.totalOrders || 0}</div><div class="stat-label">إجمالي الطلبات</div></div>
      <div class="stat"><div class="stat-value">${(stats.totalRevenue || 0).toLocaleString()}</div><div class="stat-label">الإيرادات (د.ج)</div></div>
      <div class="stat"><div class="stat-value">${stats.shopCount || 0}</div><div class="stat-label">المتاجر</div></div>
      <div class="stat"><div class="stat-value">${stats.todayOrders || 0}</div><div class="stat-label">طلبات اليوم</div></div>
    </div>
    <div class="section-title">المتاجر</div>
    <table><tr><th>المتجر</th><th>الطلبات</th><th>الإيرادات</th></tr>${shopsHtml || '<tr><td colspan="3" style="text-align:center">لا توجد بيانات</td></tr>'}</table>
    <div class="section-title">آخر الطلبات</div>
    <table><tr><th>الرقم</th><th>الزبون</th><th>الخدمة</th><th>الحالة</th><th>السعر</th></tr>${ordersHtml || '<tr><td colspan="5" style="text-align:center">لا توجد طلبات</td></tr>'}</table>
    <div class="footer">تقرير تلقائي من منصة طيف — ${new Date().toISOString().split('T')[0]}</div>
    </body></html>`);
    win.document.close();
    setTimeout(() => win.print(), 500);
  }

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
          {/* Global Search */}
          <div className="focus-glow-card relative max-w-xs flex-1 min-w-[180px]">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              ref={searchInputRef}
              value={search}
              onChange={(e) => { setSearch(e.target.value); setSearchOpen(true); }}
              onFocus={() => setSearchOpen(true)}
              placeholder="بحث شامل... Ctrl+K"
              className="pr-10 h-9 text-sm"
            />
            {/* Search Results Dropdown */}
            {searchOpen && search.trim() && (
              <div className="absolute top-full mt-1 left-0 right-0 z-[60] rounded-xl border border-border bg-card shadow-xl overflow-hidden min-w-[320px]">
                {hasGlobalResults ? (
                  <div className="max-h-[360px] overflow-y-auto py-1">
                    {/* Orders */}
                    {globalSearchResults.orders.length > 0 && (
                      <div>
                        <div className="px-3 py-1.5 text-[11px] font-semibold text-muted-foreground bg-muted/50 flex items-center gap-1.5">
                          <Package className="h-3 w-3" /> الطلبات
                        </div>
                        {globalSearchResults.orders.map((o) => (
                          <button
                            key={o.id}
                            onClick={() => { setActiveTab("orders"); setSearchOpen(false); }}
                            className="w-full text-right px-3 py-2.5 text-sm flex items-center gap-3 hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="font-medium truncate">
                                #{o.reference || o.id} — {o.customer?.name || '—'}
                              </div>
                              <div className="text-xs text-muted-foreground truncate">
                                {o.serviceType || o.serviceName} · {o.shopName}
                              </div>
                            </div>
                            <Badge
                              className="shrink-0 text-[10px] px-1.5 py-0"
                              style={{
                                backgroundColor: STATUS_COLORS[o.status as keyof typeof STATUS_COLORS] || '#6b7280',
                                color: '#fff',
                              }}
                            >
                              {STATUS_META[o.status as keyof typeof STATUS_META]?.label || o.status}
                            </Badge>
                          </button>
                        ))}
                      </div>
                    )}
                    {/* Shops */}
                    {globalSearchResults.shops.length > 0 && (
                      <div>
                        <div className="px-3 py-1.5 text-[11px] font-semibold text-muted-foreground bg-muted/50 flex items-center gap-1.5 border-t border-border">
                          <Store className="h-3 w-3" /> المتاجر
                        </div>
                        {globalSearchResults.shops.map((s) => (
                          <button
                            key={s.id}
                            onClick={() => { setActiveTab("shops"); setSearchOpen(false); }}
                            className="w-full text-right px-3 py-2.5 text-sm flex items-center gap-3 hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="font-medium truncate">{s.name || s.slug}</div>
                              <div className="text-xs text-muted-foreground truncate">
                                {s.orders || 0} طلب · {s.revenue || 0} ر.س
                              </div>
                            </div>
                            {s.isActive !== false ? (
                              <span className="shrink-0 h-2 w-2 rounded-full bg-green-500" />
                            ) : (
                              <span className="shrink-0 h-2 w-2 rounded-full bg-gray-400" />
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                    {/* Customers */}
                    {globalSearchResults.customers.length > 0 && (
                      <div>
                        <div className="px-3 py-1.5 text-[11px] font-semibold text-muted-foreground bg-muted/50 flex items-center gap-1.5 border-t border-border">
                          <Users className="h-3 w-3" /> العملاء
                        </div>
                        {globalSearchResults.customers.map((c) => (
                          <button
                            key={c.phone || c.name}
                            onClick={() => {
                              setActiveTab("orders");
                              setSearch(c.phone || c.name);
                              setSearchOpen(false);
                            }}
                            className="w-full text-right px-3 py-2.5 text-sm flex items-center gap-3 hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="font-medium truncate">{c.name || '—'}</div>
                              <div className="text-xs text-muted-foreground truncate">{c.phone || '—'}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                    لا توجد نتائج لـ "{search.trim()}"
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            {/* Notification bell with pending count */}
            {pendingCount > 0 && (
              <button className="relative p-2.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors bell-urgent">
                <Bell className="h-4 w-4" />
                <span className="absolute -top-0.5 left-0.5 min-w-[16px] h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center px-1 badge-pulse notif-badge-pulse">
                  {pendingCount}
                </span>
              </button>
            )}
            {/* Data health indicator — enhanced visibility */}
            {dataHealth.status !== 'healthy' && (
              <div className={cn(
                "flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full transition-all",
                dataHealth.status === 'warning' && "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20",
                dataHealth.status === 'error' && "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 health-pulse"
              )}>
                <span className={cn("w-2 h-2 rounded-full", dataHealth.status === 'warning' && "bg-amber-500", dataHealth.status === 'error' && "bg-red-500")} />
                <span className="max-w-[200px] truncate">{dataHealth.message}</span>
                <button
                  onClick={() => loadAll(false)}
                  className="mr-1 hover:bg-white/20 rounded-full p-0.5 transition-colors"
                  title="إعادة المحاولة"
                >
                  <RefreshCw className="h-3 w-3" />
                </button>
              </div>
            )}
            <ThemeToggle />
            {/* PDF Report button */}
            <button
              onClick={exportAdminReport}
              className="text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg p-2.5 text-sm transition-colors admin-tooltip"
              data-tip="تصدير التقرير (ملف HTML للطباعة)"
              title="تصدير التقرير"
            >
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline mr-1.5">تصدير التقرير</span>
            </button>
            <a
              href="/api/admin/analytics"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg p-2.5 text-sm transition-colors admin-tooltip"
              data-tip="تقرير PDF للإحصائيات"
              title="تقرير إحصائيات (JSON)"
            >
              <BarChart3 className="h-4 w-4" />
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
      <div className="border-b border-border bg-card/30 px-4 py-2">
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-thin">
          <div className="pill-tabs">
          {["overview", "shops", "orders", "settings", "security", "platform"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "pill-tab hover-underline-grow relative",
                activeTab === tab && "active",
                tab === "orders" && safeOrders.length > 0 && "flex items-center gap-1.5"
              )}
            >
              {tabLabels[tab]}
              {tab === "orders" && safeOrders.length > 0 && (
                <span className={cn(
                  "min-w-[20px] h-4 rounded-full text-[9px] font-bold flex items-center justify-center px-1",
                  activeTab === tab
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                )}>
                  {filteredOrders.length}/{safeOrders.length}
                </span>
              )}
            </button>
          ))}
          </div>
          <div className="flex-1" />
          {lastUpdated && (
            <span className="text-[10px] text-muted-foreground whitespace-nowrap">
              آخر تحديث: {lastUpdated}
            </span>
          )}
          <button
            onClick={() => setShowShortcuts(true)}
            className="text-[10px] text-muted-foreground/40 hover:text-muted-foreground px-1.5 rounded-md transition-colors hover:bg-muted/50"
            title="اختصارات لوحة المفاتيح (?)"
          >
            <Keyboard className="h-3 w-3" />
          </button>
        </div>
      </div>

      <div className="gradient-line-animated" />
      {/* Data health banner — auto-dismiss after 8 seconds */}
      {!isInitialLoading && dataHealth.status !== 'healthy' && (
        <DataHealthBanner message={dataHealth.message} status={dataHealth.status} onRetry={() => loadAll(false)} />
      )}

      {/* Quick stats ribbon — visible on all tabs */}
      {!isInitialLoading && globalStats && (
        <div className="px-4 py-2 border-b border-border/50 ribbon-gradient overflow-x-auto scrollbar-thin">
          <div className="flex items-center gap-4 text-xs min-w-max">
            <div className="flex items-center gap-1.5 press-feedback rounded-md px-1.5 py-0.5 cursor-default">
              <div className="w-2 h-2 rounded-full bg-emerald-500 status-dot-ping" />
              <span className="text-foreground/80 font-semibold tabular-data number-highlight-violet">{globalStats.totalOrders}</span>
              <span className="text-muted-foreground/60">طلب</span>
            </div>
            <div className="w-px h-4 bg-gradient-to-b from-transparent via-border to-transparent" />
            <div className="flex items-center gap-1.5 press-feedback rounded-md px-1.5 py-0.5 cursor-default">
              <DollarSign className="h-3.5 w-3.5 text-amber-500" />
              <span className="text-foreground/80 font-semibold tabular-data number-highlight-emerald">{formatNumber(globalStats.totalRevenue)}</span>
              <span className="text-muted-foreground/60">د.ج</span>
            </div>
            <div className="w-px h-4 bg-gradient-to-b from-transparent via-border to-transparent" />
            <div className="flex items-center gap-1.5 press-feedback rounded-md px-1.5 py-0.5 cursor-default">
              <Store className="h-3.5 w-3.5 text-violet-500" />
              <span className="text-foreground/80 font-semibold tabular-data number-highlight-violet">{globalStats.shopCount}</span>
              <span className="text-muted-foreground/60">متجر</span>
            </div>
            <div className="w-px h-4 bg-gradient-to-b from-transparent via-border to-transparent" />
            <div className="flex items-center gap-1.5 press-feedback rounded-md px-1.5 py-0.5 cursor-default">
              <span className="w-2 h-2 rounded-full bg-amber-500 status-dot-ping" />
              <span className="text-amber-600 dark:text-amber-400 font-semibold tabular-data number-highlight-amber">{globalStats.statusCounts?.pending || 0}</span>
              <span className="text-muted-foreground/60">معلّق</span>
            </div>
            <div className="w-px h-4 bg-gradient-to-b from-transparent via-border to-transparent" />
            <div className="flex items-center gap-1.5 press-feedback rounded-md px-1.5 py-0.5 cursor-default">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="text-blue-600 dark:text-blue-400 font-semibold tabular-data number-highlight-blue">{globalStats.statusCounts?.printing || 0}</span>
              <span className="text-muted-foreground/60">طباعة</span>
            </div>
            <div className="w-px h-4 bg-gradient-to-b from-transparent via-border to-transparent" />
            <div className="flex items-center gap-1.5 press-feedback rounded-md px-1.5 py-0.5 cursor-default">
              <span className="w-2 h-2 rounded-full bg-teal-500" />
              <span className="text-teal-600 dark:text-teal-400 font-semibold tabular-data number-highlight-teal">{globalStats.statusCounts?.ready || 0}</span>
              <span className="text-muted-foreground/60">جاهز</span>
            </div>
            <div className="w-px h-4 bg-gradient-to-b from-transparent via-border to-transparent" />
            <div className="flex items-center gap-1.5 press-feedback rounded-md px-1.5 py-0.5 cursor-default">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-green-600 dark:text-green-400 font-semibold tabular-data number-highlight-green">{globalStats.statusCounts?.delivered || 0}</span>
              <span className="text-muted-foreground/60">تم التسليم</span>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="container-responsive flex-1 p-4 space-y-4 tab-content-enter" key={activeTab}>
        {loadError && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-4 text-sm text-destructive flex items-center gap-2">
            <Shield className="h-4 w-4 shrink-0" />
            <span>{loadError}</span>
            <button onClick={() => loadAll()} className="mr-auto text-xs underline">إعادة المحاولة</button>
          </div>
        )}

        {/* ====== Skeleton state for initial load ====== */}
        {isInitialLoading && activeTab === "overview" && (
          <div className="space-y-4 stagger-grid">
            {/* 4 skeleton KPI cards with wave shimmer */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded-xl border border-border bg-card p-4 space-y-3 overflow-hidden shimmer-card depth-1">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="h-7 w-16 skeleton-wave rounded-lg" />
                      <div className="h-3 w-24 skeleton-wave rounded-lg" style={{ animationDelay: `${i * 200}ms` }} />
                    </div>
                    <div className="w-10 h-10 rounded-xl skeleton-wave" style={{ animationDelay: `${i * 200 + 100}ms` }} />
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
        {!isInitialLoading && activeTab === "overview" && globalStats && (
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
          <div className="space-y-4 widget-fade-in">
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={shopSearch}
                  onChange={(e) => setShopSearch(e.target.value)}
                  placeholder="بحث عن متجر بالاسم أو الرابط..."
                  className="pr-10"
                />
              </div>
              <span className="text-xs text-muted-foreground/70 whitespace-nowrap">
                {filteredShops.length}/{safeShops.length} متجر
              </span>
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
          <div className="space-y-4 widget-fade-in">
            {/* Mini Stats Overview Widget */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 stagger-grid-16">
              <div className="glass-card-v2 p-3 hover-lift-1 stat-card-glow-emerald">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                    <Package className="h-3.5 w-3.5 text-emerald-500" />
                  </div>
                  <span className="text-[10px] text-muted-foreground">إجمالي الطلبات</span>
                </div>
                <p className="text-lg font-bold tabular-data">{safeOrders.length}</p>
                <p className="text-[10px] text-muted-foreground/60 mt-0.5">{filteredOrders.length} معروض</p>
              </div>
              <div className="glass-card-v2 p-3 hover-lift-1 stat-card-glow-amber">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center">
                    <DollarSign className="h-3.5 w-3.5 text-amber-500" />
                  </div>
                  <span className="text-[10px] text-muted-foreground">إجمالي الإيرادات</span>
                </div>
                <p className="text-lg font-bold tabular-data">{formatNumber(safeOrders.reduce((s, o) => s + (o.total || 0), 0))}</p>
                <p className="text-[10px] text-muted-foreground/60 mt-0.5">د.ج</p>
              </div>
              <div className="glass-card-v2 p-3 hover-lift-1 stat-card-glow-violet">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-7 h-7 rounded-lg bg-violet-500/10 flex items-center justify-center">
                    <Users className="h-3.5 w-3.5 text-violet-500" />
                  </div>
                  <span className="text-[10px] text-muted-foreground">العملاء الفريدين</span>
                </div>
                <p className="text-lg font-bold tabular-data">{new Set(safeOrders.map(o => o.customer?.phone || o.customer?.name || o.id)).size}</p>
                <p className="text-[10px] text-muted-foreground/60 mt-0.5">{safeOrders.length > 0 ? `متوسط ${(safeOrders.length / new Set(safeOrders.map(o => o.customer?.phone || o.customer?.name || o.id)).size).toFixed(1)} طلب/زبون` : '—'}</p>
              </div>
              <div className="glass-card-v2 p-3 hover-lift-1 stat-card-glow-rose">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-7 h-7 rounded-lg bg-rose-500/10 flex items-center justify-center">
                    <AlertTriangle className="h-3.5 w-3.5 text-rose-500" />
                  </div>
                  <span className="text-[10px] text-muted-foreground">طلبات مكررة</span>
                </div>
                <p className="text-lg font-bold tabular-data">{duplicateOrderIds.size}</p>
                <p className="text-[10px] text-muted-foreground/60 mt-0.5">{safeOrders.length > 0 ? `${((duplicateOrderIds.size / safeOrders.length) * 100).toFixed(1)}% من الإجمالي` : '—'}</p>
              </div>
            </div>

            {/* Revenue Timeline Widget */}
            <div className="grid grid-cols-3 gap-2 revenue-timeline-row">
              {(() => {
                const now = Date.now();
                const todayStart = new Date(); todayStart.setHours(0,0,0,0);
                const weekStart = new Date(todayStart); weekStart.setDate(weekStart.getDate() - weekStart.getDay() + (weekStart.getDay() === 0 ? -6 : 1));
                const monthStart = new Date(todayStart.getFullYear(), todayStart.getMonth(), 1);
                const todayOrders = safeOrders.filter(o => new Date(o.createdAt).getTime() >= todayStart.getTime());
                const weekOrders = safeOrders.filter(o => new Date(o.createdAt).getTime() >= weekStart.getTime());
                const monthOrders = safeOrders.filter(o => new Date(o.createdAt).getTime() >= monthStart.getTime());
                const todayRev = todayOrders.reduce((s,o) => s + (o.total||0), 0);
                const weekRev = weekOrders.reduce((s,o) => s + (o.total||0), 0);
                const monthRev = monthOrders.reduce((s,o) => s + (o.total||0), 0);
                const todayDelivered = todayOrders.filter(o => o.status === 'delivered').length;
                const pendingAmount = safeOrders.filter(o => o.status === 'pending').reduce((s,o) => s + (o.total||0), 0);
                return [
                  { label: 'إيرادات اليوم', value: formatNumber(todayRev), sub: `${todayOrders.length} طلب • ${todayDelivered} تم التسليم`, icon: '☀', cls: 'revenue-timeline-today', accent: '#f59e0b' },
                  { label: 'إيرادات الأسبوع', value: formatNumber(weekRev), sub: `${weekOrders.length} طلب`, icon: '📅', cls: 'revenue-timeline-week', accent: '#3b82f6' },
                  { label: 'إيرادات الشهر', value: formatNumber(monthRev), sub: `${monthOrders.length} طلب`, icon: '🗓', cls: 'revenue-timeline-month', accent: '#8b5cf6' },
                ].map((item, i) => (
                  <div key={i} className={cn('rounded-xl border border-border/60 bg-card/80 p-3 hover-lift-1 transition-all revenue-timeline-card', item.cls)} style={{'--timeline-accent': item.accent} as React.CSSProperties}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] text-muted-foreground font-medium">{item.icon} {item.label}</span>
                    </div>
                    <p className="text-base font-bold tabular-data revenue-gold">{item.value} <span className="text-[10px] font-normal text-muted-foreground/70">د.ج</span></p>
                    <p className="text-[9px] text-muted-foreground/50 mt-0.5">{item.sub}</p>
                  </div>
                ));
              })()}
            </div>
            {/* Pending revenue alert */}
            {safeOrders.filter(o => o.status === 'pending').length > 0 && (
              <div className="revenue-pending-alert">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-amber-500" />
                  <span className="text-xs font-medium">طلبات معلقة تحتاج تأكيد</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold tabular-data revenue-gold">{formatNumber(safeOrders.filter(o => o.status === 'pending').reduce((s,o) => s + (o.total||0), 0))} د.ج</span>
                  <span className="text-[10px] text-muted-foreground">{safeOrders.filter(o => o.status === 'pending').length} طلب</span>
                  <button onClick={() => { setStatusFilter('pending'); setActiveTab('orders'); }} className="text-[10px] text-primary hover:underline font-medium">عرض ←</button>
                </div>
              </div>
            )}

            {/* Status Distribution Bar */}
            <div className="rounded-xl border border-border/60 bg-card/80 p-3 status-dist-bar-container">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <BarChart3 className="h-3.5 w-3.5" />
                  توزيع الحالات
                </span>
                <span className="text-[10px] text-muted-foreground/60">{safeOrders.length} طلب إجمالي</span>
              </div>
              <div className="status-dist-bar">
                {Object.entries(STATUS_META).filter(([k]) => k !== 'cancelled').map(([key, meta]) => {
                  const count = safeOrders.filter(o => o.status === key).length;
                  const pct = safeOrders.length > 0 ? (count / safeOrders.length * 100) : 0;
                  return (
                    <button
                      key={key}
                      onClick={() => setStatusFilter(key)}
                      className="status-dist-segment"
                      style={{ width: `${pct}%`, backgroundColor: meta.color }}
                      title={`${meta.label}: ${count} (${pct.toFixed(1)}%)`}
                    >
                      {pct > 8 && <span className="status-dist-label">{meta.emoji} {count}</span>}
                    </button>
                  );
                })}
              </div>
              <div className="flex items-center gap-3 mt-2 flex-wrap">
                {Object.entries(STATUS_META).filter(([k]) => k !== 'cancelled').map(([key, meta]) => {
                  const count = safeOrders.filter(o => o.status === key).length;
                  return (
                    <button
                      key={key}
                      onClick={() => setStatusFilter(statusFilter === key ? 'all' : key)}
                      className={cn("flex items-center gap-1 text-[10px] transition-colors status-dist-legend", statusFilter === key && "status-dist-legend-active")}
                    >
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: meta.color }} />
                      {meta.label}
                      <span className="tabular-nums font-medium">{count}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Order Statistics Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(() => {
                const totalRev = safeOrders.reduce((s,o) => s + (o.total||0), 0);
                const avgOrder = safeOrders.length > 0 ? totalRev / safeOrders.length : 0;
                const completed = safeOrders.filter(o => o.status === 'delivered').length;
                const completionRate = safeOrders.length > 0 ? (completed / safeOrders.length * 100) : 0;
                const todayStart2 = new Date(); todayStart2.setHours(0,0,0,0);
                const todayCount = safeOrders.filter(o => new Date(o.createdAt).getTime() >= todayStart2.getTime()).length;
                return [
                  { label: 'متوسط قيمة الطلب', value: `${formatNumber(Math.round(avgOrder))}`, sub: 'د.ج', icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                  { label: 'معدل الإنجاز', value: `${completionRate.toFixed(0)}%`, sub: `${completed}/${safeOrders.length}`, icon: CheckCircle2, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                  { label: 'طلبات اليوم', value: `${todayCount}`, sub: 'طلب جديد', icon: Calendar, color: 'text-amber-500', bg: 'bg-amber-500/10' },
                  { label: 'أعلى طلب', value: formatNumber(Math.max(...safeOrders.map(o => o.total||0), 0)), sub: 'د.ج', icon: Zap, color: 'text-rose-500', bg: 'bg-rose-500/10' },
                ].map((item, i) => (
                  <div key={i} className="rounded-xl border border-border/50 bg-card/60 p-2.5 hover-lift-1 transition-all stat-mini-card" style={{animationDelay: `${i * 50}ms`}}>
                    <div className="flex items-center gap-1.5 mb-1">
                      <div className={cn("w-5 h-5 rounded-md flex items-center justify-center", item.bg)}>
                        <item.icon className={cn("h-3 w-3", item.color)} />
                      </div>
                      <span className="text-[9px] text-muted-foreground truncate">{item.label}</span>
                    </div>
                    <p className="text-sm font-bold tabular-data">{item.value} <span className="text-[9px] font-normal text-muted-foreground/60">{item.sub}</span></p>
                  </div>
                ));
              })()}
            </div>

            {/* Shop Performance Mini-Table */}
            {safeShops.length > 0 && (
              <div className="rounded-xl border border-border/60 bg-card/80 overflow-hidden shop-perf-container">
                <div className="flex items-center justify-between px-3 pt-3 pb-2">
                  <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                    <Store className="h-3.5 w-3.5" />
                    أداء المتاجر
                  </span>
                  <span className="text-[10px] text-muted-foreground/50">{safeShops.length} متجر</span>
                </div>
                <div className="px-3 pb-3 space-y-1.5">
                  {(() => {
                    const shopPerf = safeShops.map(shop => {
                      const shopOrders = safeOrders.filter(o => (o.shopName || o.shopSlug || '') === (shop.name || shop.slug));
                      const rev = shopOrders.reduce((s,o) => s + (o.total||0), 0);
                      const completed2 = shopOrders.filter(o => o.status === 'delivered').length;
                      const pending2 = shopOrders.filter(o => o.status === 'pending').length;
                      const rate = shopOrders.length > 0 ? (completed2 / shopOrders.length * 100) : 0;
                      return { ...shop, orderCount: shopOrders.length, revenue: rev, completed: completed2, pending: pending2, rate };
                    }).sort((a,b) => b.revenue - a.revenue);
                    const maxRev = Math.max(...shopPerf.map(s => s.revenue), 1);
                    return shopPerf.map((shop, i) => (
                      <div key={shop.slug} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/30 transition-colors shop-perf-row" style={{animationDelay: `${i * 40}ms`}}>
                        <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0 shop-perf-rank">
                          {i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium truncate max-w-[120px]">{shop.name}</span>
                            <span className="text-xs font-bold tabular-data revenue-gold">{formatNumber(shop.revenue)} د.ج</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden shop-perf-bar-bg">
                              <div className="h-full rounded-full shop-perf-bar-fill transition-all duration-500" style={{ width: `${(shop.revenue / maxRev) * 100}%`, backgroundColor: i === 0 ? '#f59e0b' : i === 1 ? '#3b82f6' : '#8b5cf6' }} />
                            </div>
                            <span className="text-[9px] text-muted-foreground/60 tabular-nums whitespace-nowrap">{shop.orderCount} طلب • {shop.rate.toFixed(0)}%</span>
                          </div>
                        </div>
                        {shop.pending > 0 && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-medium whitespace-nowrap">{shop.pending} معلق</span>
                        )}
                      </div>
                    ));
                  })()}
                </div>
              </div>
            )}

            {/* Service Type Distribution Widget */}
            {serviceDistribution.length > 0 && (
              <div className="rounded-xl border border-border/60 bg-card/80 p-3 svc-dist-container">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                    <BarChart2 className="h-3.5 w-3.5" />
                    توزيع الخدمات
                  </span>
                  <span className="text-[10px] text-muted-foreground/50">{serviceDistribution.length} نوع خدمة</span>
                </div>
                <div className="space-y-1.5">
                  {serviceDistribution.slice(0, 6).map((svc, i) => {
                    const maxRev = serviceDistribution[0]?.revenue || 1;
                    const pct = safeOrders.length > 0 ? (svc.count / safeOrders.length * 100) : 0;
                    return (
                      <div key={svc.service} className="flex items-center gap-2.5 svc-dist-row" style={{animationDelay: `${i * 40}ms`}}>
                        <span className="svc-dist-emoji">{SERVICE_EMOJI[svc.service as keyof typeof SERVICE_EMOJI] || '📄'}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="text-[11px] font-medium truncate max-w-[140px]">{svc.service}</span>
                            <span className="text-[10px] tabular-nums text-muted-foreground">{pct.toFixed(0)}%</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-muted/50 overflow-hidden svc-dist-bar-bg">
                            <div className="h-full rounded-full svc-dist-bar-fill transition-all duration-700" style={{ width: `${(svc.revenue / maxRev) * 100}%` }} />
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[9px] text-muted-foreground/50">{svc.count} طلب</span>
                            <span className="text-[9px] text-muted-foreground/50">•</span>
                            <span className="text-[9px] text-muted-foreground/50 revenue-gold">{formatNumber(svc.revenue)} د.ج</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}


            {/* Weekly Order Heatmap */}
            <div className="rounded-xl border border-border/60 bg-card/80 p-3 svc-dist-container">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-[11px] font-bold text-foreground flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-amber-500" />
                  خريطة الطلبات الأسبوعية
                </h3>
                <button
                  onClick={() => setShowHeatmap(!showHeatmap)}
                  className="text-[9px] text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showHeatmap ? 'إخفاء ▲' : 'عرض ▼'}
                </button>
              </div>
              {showHeatmap && (
                <WeeklyOrderHeatmap
                  orders={safeOrders}
                  onDayClick={(day) => { setDateFilter("custom"); setDateFrom(day); setDateTo(day); setShowHeatmap(false); }}
                />
              )}
            </div>

            {/* Activity Panel + Filters Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4">
            <div className="space-y-4">
            {/* Filters + count + export */}
            <Card className="card-hover-glow">
              <CardContent className="p-3">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="بحث بالاسم، الهاتف، الرقم المرجعي أو الخدمة..."
                  className="pr-10 search-input-enhanced"
                />
                {search && (
                  <button onClick={() => setSearch("")} className="absolute left-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-muted/80 text-muted-foreground transition-colors search-clear-btn">
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
                {search && (
                  <span className="absolute left-10 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground/60 tabular-nums search-result-count">{filteredOrders.length}</span>
                )}
              </div>
              <Select value={orderStatusFilter} onValueChange={setOrderStatusFilter}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="الحالة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">الكل</SelectItem>
                  <SelectItem value="pending">معلق</SelectItem>
                  <SelectItem value="confirmed">مؤكد</SelectItem>
                  <SelectItem value="printing">طباعة</SelectItem>
                  <SelectItem value="ready">جاهز</SelectItem>
                  <SelectItem value="delivered">تم التسليم</SelectItem>
                  <SelectItem value="cancelled">ملغى</SelectItem>
                </SelectContent>
              </Select>
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
                  onClick={() => { setShowDateFilter(!showDateFilter); setShowPriorityFilter(false); }}
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
              {/* Priority filter */}
              <div className="relative">
                <button
                  onClick={() => { setShowPriorityFilter(!showPriorityFilter); setShowDateFilter(false); }}
                  className={cn(
                    "h-10 px-3 rounded-lg border text-sm flex items-center gap-1.5 transition-colors",
                    priorityFilter !== "all"
                      ? "border-primary/50 bg-primary/5 text-primary"
                      : "border-border bg-card hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Filter className="h-4 w-4" />
                  <span className="hidden sm:inline">
                    {priorityFilter === "all" ? "الأولوية" : priorityFilter === "urgent" ? "عاجل" : priorityFilter === "medium" ? "متوسط" : "عادي"}
                  </span>
                </button>
                {showPriorityFilter && (
                  <div className="absolute top-full mt-1 right-0 z-50 rounded-xl border border-border bg-card shadow-lg p-3 min-w-[200px] date-filter-popup">
                    <div className="space-y-1.5">
                      {[
                        { key: "all" as const, label: "جميع الأولويات", icon: "📋", desc: "عرض كل الطلبات", count: safeOrders.length },
                        { key: "urgent" as const, label: "عاجل", icon: "🔴", desc: "5,000+ د.ج", count: safeOrders.filter(o => (o.total||0) >= 5000).length },
                        { key: "medium" as const, label: "متوسط", icon: "🟡", desc: "2,000 — 4,999 د.ج", count: safeOrders.filter(o => { const t = o.total||0; return t >= 2000 && t < 5000; }).length },
                        { key: "normal" as const, label: "عادي", icon: "🟢", desc: "أقل من 2,000 د.ج", count: safeOrders.filter(o => (o.total||0) < 2000).length },
                      ].map(opt => (
                        <button
                          key={opt.key}
                          onClick={() => { setPriorityFilter(opt.key); setShowPriorityFilter(false); }}
                          className={cn(
                            "w-full text-right px-3 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors",
                            priorityFilter === opt.key ? "bg-primary/10 text-primary font-medium" : "text-foreground hover:bg-muted/50"
                          )}
                        >
                          <span>{opt.icon}</span>
                          <div className="flex-1 text-right">
                            <div>{opt.label}</div>
                            <div className="text-[10px] text-muted-foreground">{opt.desc}</div>
                          </div>
                          <span className={cn(
                            "min-w-[20px] h-5 rounded-full text-[10px] font-bold flex items-center justify-center px-1",
                            priorityFilter === opt.key ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                          )}>{opt.count}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              {/* View Toggle: Table / Kanban */}
              <div className="view-toggle-group">
                <button
                  className={cn("view-toggle-btn", ordersView === "table" && "active")}
                  onClick={() => setOrdersView("table")}
                  title="عرض جدول"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3h18v18H3z"/><path d="M3 9h18"/><path d="M3 15h18"/><path d="M9 3v18"/></svg>
                  جدول
                </button>
                <button
                  className={cn("view-toggle-btn", ordersView === "kanban" && "active")}
                  onClick={() => setOrdersView("kanban")}
                  title="عرض كانبان"
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                  كانبان
                </button>
                <button
                  className={cn("view-toggle-btn", ordersView === "cards" && "active")}
                  onClick={() => setOrdersView("cards")}
                  title="عرض بطاقات"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
                  بطاقات
                </button>
                <button
                  className={cn("view-toggle-btn", ordersView === "calendar" && "active")}
                  onClick={() => setOrdersView("calendar")}
                  title="عرض تقويم"
                >
                  <Calendar className="h-3.5 w-3.5" />
                  تقويم
                </button>
              </div>
              {/* Sort indicator */}
              <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground">
                <ArrowUpDown className="h-3.5 w-3.5" />
                <span>ترتيب:</span>
                <span className="font-medium text-foreground">{{date: "التاريخ", amount: "المبلغ", customer: "الزبون", status: "الحالة"}[sortKey]}</span>
                <button onClick={() => setSortDir(d => d === "asc" ? "desc" : "asc")} className="text-primary hover:underline font-medium">{sortDir === "desc" ? "↓" : "↑"}</button>
              </div>
              {/* Enhanced export button — full CSV with all columns */}
              <button
                onClick={() => {
                  const csv = filteredOrders.map(o => {
                    const ref = o.reference || o.id;
                    const name = o.customer?.name || "";
                    const phone = o.customer?.phone || "";
                    const service = o.serviceName || o.serviceType || "";
                    const shop = o.shopName || o.shopSlug || "";
                    const status = STATUS_META[o.status as keyof typeof STATUS_META]?.label || o.status;
                    const total = o.total || 0;
                    const date = formatDA(o.createdAt);
                    const time = new Date(o.createdAt).toLocaleTimeString("ar-DZ", { hour: "2-digit", minute: "2-digit" });
                    const isDupe = duplicateOrderIds.has(o.id) ? "نعم" : "لا";
                    return `"${ref}","${name}","${phone}","${service}","${shop}","${status}",${total},"${date}","${time}","${isDupe}"`;
                  }).join("\n");
                  const header = "الرقم,الزبون,الهاتف,الخدمة,المتجر,الحالة,المبلغ,التاريخ,الوقت,مكرر";
                  const blob = new Blob(["\ufeff" + header + "\n" + csv], { type: "text/csv;charset=utf-8" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `tayf-orders-${new Date().toISOString().slice(0, 10)}.csv`;
                  a.click();
                  URL.revokeObjectURL(url);
                  toast.success(`تم تصدير ${filteredOrders.length} طلب بنجاح`);
                }}
                className="h-10 px-3 rounded-lg border border-border bg-card hover:bg-muted/50 text-muted-foreground hover:text-foreground text-sm flex items-center gap-1.5 transition-colors micro-bounce press-feedback"
                title="تصدير CSV مفصّل"
              >
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">تصدير CSV</span>
              </button>
            </div>
              </CardContent>
            </Card>

            {/* Orders count bar with filter chips */}
            {(statusFilter !== "all" || orderStatusFilter !== "all" || shopFilter !== "all" || search || dateFilter !== "all" || priorityFilter !== "all") && (
              <div className="flex items-center justify-between gap-2 flex-wrap text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="order-count-badge">{filteredOrders.length}</span>
                  <span>من</span>
                  <span className="order-count-badge">{safeOrders.length}</span>
                  <span>طلب</span>
                  {search && (
                    <span className="filter-chip">
                      🔍 "{search}"
                      <button className="chip-dismiss-btn" onClick={() => setSearch("")}><X className="h-2.5 w-2.5" /></button>
                    </span>
                  )}
                  {priorityFilter !== "all" && (
                    <span className="filter-chip">
                      {priorityFilter === "urgent" ? "🔴 عاجل" : priorityFilter === "medium" ? "🟡 متوسط" : "🟢 عادي"}
                      <button className="chip-dismiss-btn" onClick={() => setPriorityFilter("all")}><X className="h-2.5 w-2.5" /></button>
                    </span>
                  )}
                  {dateFilter !== "all" && (
                    <span className="filter-chip">
                      📅 {dateFilter === "today" ? "اليوم" : dateFilter === "week" ? "الأسبوع" : dateFilter === "month" ? "الشهر" : "مخصص"}
                      <button className="chip-dismiss-btn" onClick={() => { setDateFilter("all"); setDateFrom(""); setDateTo(""); }}><X className="h-2.5 w-2.5" /></button>
                    </span>
                  )}
                </div>
                <button onClick={() => clearAllFilters()} className="text-primary hover:underline btn-ripple rounded-md px-2 py-0.5">مسح الكل</button>
              </div>
            )}

            {/* Bulk action bar */}
            {selectedIds.size > 0 && (
              <div className="rounded-xl border border-primary/30 bg-primary/5 p-3 flex items-center gap-3 flex-wrap bulk-action-bar">
                <Badge variant="secondary" className="font-medium tabular-nums">
                  {selectedIds.size} طلب محدد
                </Badge>
                <div className="flex-1" />
                <button
                  onClick={toggleSelectAll}
                  className="h-8 px-3 rounded-lg border border-border hover:bg-muted/50 text-muted-foreground text-sm transition-colors flex items-center gap-1.5"
                >
                  <CheckSquare className="h-3.5 w-3.5" />
                  {selectedIds.size === filteredOrders.length && filteredOrders.length > 0 ? 'إلغاء التحديد' : 'تحديد الكل'}
                </button>
                <select
                  value={bulkStatus}
                  onChange={(e) => setBulkStatus(e.target.value)}
                  className="h-8 px-3 rounded-lg border border-border bg-background text-sm"
                >
                  <option value="">تحديث الحالة</option>
                  {Object.entries(STATUS_META).map(([key, meta]) => (
                    <option key={key} value={key}>{meta.label}</option>
                  ))}
                </select>
                <button
                  onClick={applyBulkStatus}
                  disabled={!bulkStatus}
                  className="h-8 px-4 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium disabled:opacity-40 transition-colors"
                >
                  تحديث الحالة
                </button>
                <button
                  onClick={() => setBulkDeleteOpen(true)}
                  className="h-8 px-3 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 text-sm font-medium transition-colors flex items-center gap-1.5"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  حذف المحدد
                </button>
                <button
                  onClick={() => { setSelectedIds(new Set()); setBulkStatus(""); }}
                  className="h-8 px-3 rounded-lg border border-border hover:bg-muted/50 text-muted-foreground text-sm transition-colors"
                >
                  إلغاء
                </button>
              </div>
            )}

            {/* Orders table / kanban / cards view */}
            {ordersView === "table" ? (
            <div className="rounded-xl border border-border bg-card overflow-hidden hover-border-gradient">
              <div className="overflow-x-auto scrollbar-thin">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10 text-center">
                        <button onClick={toggleSelectAll} className="p-1 rounded hover:bg-muted/80 transition-colors tooltip-css" data-tip="تحديد الكل">
                          {selectedIds.size === sortedOrders.length && sortedOrders.length > 0
                            ? <Check className="h-4 w-4 text-primary" />
                            : <Square className="h-4 w-4 text-muted-foreground" />
                          }
                        </button>
                      </TableHead>
                      <SortTh label="الزبون" sortField="customer" />
                      <TableHead className="text-right">الخدمة</TableHead>
                      <TableHead className="text-right">المتجر</TableHead>
                      <SortTh label="الحالة" sortField="status" />
                      <SortTh label="المبلغ" sortField="amount" />
                      <SortTh label="التاريخ" sortField="date" />
                      <TableHead className="text-right">إجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedOrders.map((order, idx) => (
                      <TableRow
                        key={order.id}
                        onClick={() => setSelectedOrder(order)}
                        className={cn(
                          "cursor-pointer hover:bg-muted/50 table-row-hover table-row-highlight order-row-accent data-row-hover table-row-enter table-row-priority",
                          `status-${order.status}`,
                          selectedIds.has(order.id) && "row-selected",
                          duplicateOrderIds.has(order.id) && "duplicate-warning-row",
                          (order.total || 0) >= 5000 && "priority-urgent",
                          (order.total || 0) >= 2000 && (order.total || 0) < 5000 && "priority-medium"
                        )}
                        style={{ animationDelay: `${idx * 20}ms` }}
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
                          <div className="flex items-center gap-2 flex-wrap">
                            {(() => {
                              const loyalty = getLoyaltyTier(order.customer?.phone || order.customer?.name || '');
                              const custData = customerLoyalty.get(order.customer?.phone || order.customer?.name || '');
                              return loyalty.tier ? (
                                <span className={cn("inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full font-medium loyalty-badge-inline", loyalty.color)} title={`عميل ${loyalty.tier} • ${custData?.orderCount || 0} طلب • ${(custData?.totalSpend || 0).toLocaleString("ar-DZ")} د.ج`}>
                                  {loyalty.icon} {loyalty.tier}
                                  <span className="loyalty-badge-count">{custData?.orderCount || 0}</span>
                                </span>
                              ) : null;
                            })()}
                            {order.customer?.name || "—"}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const key = order.customer?.phone || order.customer?.name || '';
                                setCustomerProfile(customerProfile === key ? null : key);
                              }}
                              className="p-0.5 rounded hover:bg-violet-500/10 text-muted-foreground hover:text-violet-500 transition-colors"
                              title="ملف الزبون"
                            >
                              <UserCircle className="h-3 w-3 inline-block mr-0.5 opacity-40 hover:opacity-100" />
                            </button>
                            {duplicateOrderIds.has(order.id) && (
                              <span className="badge-chip bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20" title="طلب مكرر محتمل">
                                ⚠️ مكرر
                              </span>
                            )}
                            {order.customer?.phone && (
                              <a
                                href={`tel:${order.customer.phone}`}
                                className="text-[10px] text-muted-foreground hover:text-primary transition-colors"
                                dir="ltr"
                                onClick={(e) => e.stopPropagation()}
                                title="اتصال هاتفي"
                              >{order.customer.phone}</a>
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
                          {order.statusNotes && (
                            <span className="text-[9px] text-violet-600 dark:text-violet-400 truncate max-w-[60px] block mt-0.5" title={order.statusNotes}>
                              📝 {order.statusNotes}
                            </span>
                          )}
                          <div className="order-status-mini-progress mt-1">
                            {["pending", "confirmed", "printing", "ready", "delivered"].map((s, i) => (
                              <div
                                key={s}
                                className={cn(
                                  "status-mini-dot",
                                  ["pending", "confirmed", "printing", "ready", "delivered"].indexOf(order.status) >= i && "status-mini-dot-active"
                                )}
                                style={{ backgroundColor: ["pending", "confirmed", "printing", "ready", "delivered"].indexOf(order.status) >= i ? (STATUS_META[s as keyof typeof STATUS_META]?.color || "#999") : undefined }}
                              />
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium tabular-nums text-sm">
                          <div className="flex items-center gap-1.5">
                            <span className={cn(order.total > 0 && "revenue-gold")}>
                              {order.total ? `${order.total.toLocaleString("ar-DZ")} د.ج` : "—"}
                            </span>
                            {order.total >= 5000 && (
                              <span className="priority-badge-urgent text-[9px] px-1.5 py-0.5 rounded-md font-bold" title="أولوية عاجلة">عاجل</span>
                            )}
                          </div>
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
                          <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => setSelectedOrder(order)}
                              className="p-1.5 rounded-md hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors tooltip-top group/btn"
                              data-tooltip="عرض التفاصيل"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => setQuickViewOrder(order)}
                              className="p-1.5 rounded-md hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors tooltip-top"
                              data-tooltip="عرض سريع"
                            >
                              <Zap className="h-3.5 w-3.5" />
                            </button>
                            {order.customer?.phone && (
                              <a
                                href={`https://wa.me/${(order.customer.phone || "").replace(/[^0-9]/g, "")}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 rounded-md hover:bg-emerald-500/10 text-muted-foreground hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors tooltip-top"
                                data-tooltip="واتساب"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MessageCircle className="h-3.5 w-3.5" />
                              </a>
                            )}
                            <button
                              onClick={() => {
                                const statusFlow: Record<string, string> = { pending: "confirmed", confirmed: "printing", printing: "ready", ready: "delivered" };
                                const next = statusFlow[order.status];
                                if (next) changeOrderStatus(order.id, next);
                              }}
                              className="p-1.5 rounded-md hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors tooltip-top"
                              data-tooltip="تقدم ←"
                              title="نقل للحالة التالية"
                            >
                              <Play className="h-3.5 w-3.5" />
                            </button>
                            <a
                              href={`/s/${order.shopSlug || "default"}?admin=1`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-md hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors tooltip-top"
                              data-tooltip="لوحة المتجر"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <ArrowUpRight className="h-3.5 w-3.5" />
                            </a>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const key = order.customer?.phone || order.customer?.name || '';
                                setCustomerProfile(customerProfile === key ? null : key);
                              }}
                              className={cn(
                                "p-1.5 rounded-md hover:bg-violet-500/10 text-muted-foreground hover:text-violet-500 transition-colors tooltip-top",
                                customerProfile === (order.customer?.phone || order.customer?.name) && "bg-violet-500/10 text-violet-500"
                              )}
                              data-tooltip="ملف الزبون"
                            >
                              <UserCircle className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (editingNote === order.id) {
                                  setEditingNote(null);
                                } else {
                                  setEditingNote(order.id);
                                  setNoteText((order as any).statusNotes || '');
                                }
                              }}
                              className={cn(
                                "p-1.5 rounded-md hover:bg-amber-500/10 text-muted-foreground hover:text-amber-500 transition-colors tooltip-top",
                                (order as any).statusNotes && "text-amber-500",
                                editingNote === order.id && "bg-amber-500/10"
                              )}
                              data-tooltip="ملاحظة"
                            >
                              <StickyNote className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {sortedOrders.length === 0 && (
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
            ) : ordersView === "kanban" ? (
            /* Kanban View */
            <div className="space-y-3 stagger-cols-enter">
              {Object.entries(STATUS_META).filter(([k]) => k !== "cancelled").map(([statusKey, meta]) => {
                const colOrders = sortedOrders.filter(o => o.status === statusKey);
                const colUrgent = colOrders.filter(o => (o.total||0) >= 5000).length;
                return (
                  <div key={statusKey} className="rounded-xl border border-border bg-card overflow-hidden hover-lift-glow">
                    <div className="kanban-col-header" style={{background: `linear-gradient(135deg, ${meta.color}18, ${meta.color}08)`, borderRightColor: meta.color}}>
                      <div className="flex items-center gap-2">
                        <span className="text-base">{meta.emoji}</span>
                        <span className="text-sm font-semibold">{meta.label}</span>
                        {colUrgent > 0 && (
                          <span className="tag-urgent text-[9px] py-0 px-1.5 rounded text-rose-600 dark:text-rose-400 bg-rose-500/10 border border-rose-500/20 font-bold">
                            ⚡{colUrgent} عاجل
                          </span>
                        )}
                      </div>
                      <span className="kanban-col-count">{colOrders.length}</span>
                    </div>
                    <div className="px-1.5 pt-1">
                      <div className="status-mini-bar mb-1">
                        <div style={{width: `${sortedOrders.length > 0 ? (colOrders.length / sortedOrders.length * 100) : 0}%`, backgroundColor: meta.color}} />
                      </div>
                    </div>
                    <div className="p-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 min-h-[60px]">
                      {colOrders.length === 0 ? (
                        <div className="col-span-full text-center py-4 text-xs text-muted-foreground/50">لا توجد طلبات</div>
                      ) : colOrders.map(order => (
                        <div
                          key={order.id}
                          onClick={() => setSelectedOrder(order)}
                          className={cn(
                            "rounded-lg border border-border/50 bg-background/50 p-2.5 cursor-pointer transition-all hover:border-primary/30 hover:bg-primary/[0.02] press-scale glass-card-animated",
                            selectedIds.has(order.id) && "ring-1 ring-primary/50 bg-primary/[0.04]"
                          )}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs font-mono text-muted-foreground hover-underline-animated">{order.reference || order.id.substring(0, 8)}</span>
                            <div className="flex items-center gap-1.5">
                              {order.total >= 3000 && <span className="tag-urgent">عاجل</span>}
                              {order.total ? <span className="text-xs font-bold revenue-gold">{order.total.toLocaleString("ar-DZ")} د.ج</span> : null}
                            </div>
                          </div>
                          <div className="text-sm font-medium truncate">{order.customer?.name || "—"}</div>
                          <div className="flex items-center justify-between mt-1.5 text-[10px] text-muted-foreground">
                            <span className="truncate max-w-[100px]">{order.serviceName || order.serviceType || ""}</span>
                            <span className={cn("status-badge-icon", order.status)} dir="ltr">{STATUS_META[order.status as keyof typeof STATUS_META]?.label}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
            ) : (
            /* Cards View */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 stagger-cols-enter">
              {sortedOrders.length === 0 ? (
                <div className="col-span-full flex flex-col items-center justify-center py-16 text-muted-foreground">
                  <Package className="h-10 w-10 text-muted-foreground/20 mb-3" />
                  <span className="text-sm">لا توجد طلبات</span>
                </div>
              ) : sortedOrders.map((order, idx) => {
                const statusMeta = STATUS_META[order.status as keyof typeof STATUS_META];
                const statusColor = statusMeta?.color || "#888";
                const isUrgent = (order.total || 0) >= 5000;
                const isMedium = (order.total || 0) >= 2000 && (order.total || 0) < 5000;
                const statusIdx = ["pending", "confirmed", "printing", "ready", "delivered"].indexOf(order.status);
                return (
                  <div
                    key={order.id}
                    onClick={() => setSelectedOrder(order)}
                    className={cn(
                      "order-card-view cursor-pointer",
                      isUrgent && "order-card-urgent",
                      isMedium && "order-card-medium",
                      selectedIds.has(order.id) && "order-card-selected"
                    )}
                    style={{ animationDelay: `${idx * 30}ms` }}
                  >
                    {/* Card header — status bar */}
                    <div className="order-card-header" style={{background: `linear-gradient(135deg, ${statusColor}15, ${statusColor}05)`}}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm" dangerouslySetInnerHTML={{__html: statusMeta?.emoji || "📋"}} />
                          <span className="text-xs font-semibold" style={{color: statusColor}}>{statusMeta?.label || order.status}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {isUrgent && <span className="priority-badge-urgent text-[8px] px-1.5 py-0.5 rounded font-bold">عاجل</span>}
                          <button
                            onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(order.reference || order.id.substring(0, 8)); toast.success("تم نسخ الرقم المرجعي"); }}
                            className="p-1 rounded hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors"
                            title="نسخ الرقم المرجعي"
                          >
                            <Copy className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Card body */}
                    <div className="p-3 space-y-2.5">
                      {/* Reference */}
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-mono text-muted-foreground hover-underline-animated">#{order.reference || order.id.substring(0, 8)}</span>
                        <span className="text-[10px] text-muted-foreground/40" dir="ltr">{formatDA(order.createdAt)}</span>
                      </div>

                      {/* Customer */}
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                          {(order.customer?.name || "?").charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{order.customer?.name || "—"}</p>
                          {order.customer?.phone && (
                            <a
                              href={`tel:${order.customer.phone}`}
                              className="text-[10px] text-muted-foreground hover:text-primary transition-colors"
                              dir="ltr"
                              onClick={(e) => e.stopPropagation()}
                            >{order.customer.phone}</a>
                          )}
                        </div>
                      </div>

                      {/* Service + Shop */}
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="truncate max-w-[120px]">{order.serviceName || order.serviceType || "—"}</span>
                        <span className="text-muted-foreground/30">·</span>
                        <span className="truncate max-w-[80px]">{order.shopName || "—"}</span>
                      </div>

                      {/* Amount + Status dots */}
                      <div className="flex items-center justify-between pt-1.5 border-t border-border/50">
                        <span className={cn("text-sm font-bold tabular-data", order.total > 0 && "revenue-gold")}>
                          {order.total ? `${order.total.toLocaleString("ar-DZ")} د.ج` : "—"}
                        </span>
                        <div className="order-status-mini-progress">
                          {["pending", "confirmed", "printing", "ready", "delivered"].map((s, i) => (
                            <div
                              key={s}
                              className={cn("status-mini-dot", statusIdx >= i && "status-mini-dot-active")}
                              style={{ backgroundColor: statusIdx >= i ? (STATUS_META[s as keyof typeof STATUS_META]?.color || "#999") : undefined }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Card footer — quick actions */}
                    <div className="order-card-footer">
                      <div className="flex items-center gap-0.5">
                        <button onClick={(e) => { e.stopPropagation(); setSelectedOrder(order); }} className="order-card-action" title="التفاصيل">
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                        {order.customer?.phone && (
                          <a href={`https://wa.me/${(order.customer.phone || "").replace(/[^0-9]/g, "")}`} target="_blank" rel="noopener noreferrer" className="order-card-action order-card-action-green" onClick={(e) => e.stopPropagation()} title="واتساب">
                            <MessageCircle className="h-3.5 w-3.5" />
                          </a>
                        )}
                        <button onClick={(e) => { e.stopPropagation(); const flow: Record<string,string> = {pending:"confirmed",confirmed:"printing",printing:"ready",ready:"delivered"}; const next = flow[order.status]; if(next) changeOrderStatus(order.id, next); }} className="order-card-action" title="تقدم ←">
                          <Play className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      {order.statusNotes && (
                        <span className="text-[9px] text-violet-500 truncate max-w-[100px]" title={order.statusNotes}>📝 {order.statusNotes}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            )}
            </div>
            {/* Activity Panel — side column on large screens */}
            <div className="hidden lg:block">
              <AdminActivityPanel orders={safeOrders} className="sticky top-[80px]" />
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
              <span className="text-[9px] text-muted-foreground/50 tabular-data">
                {BUILD_HASH}
              </span>
            )}
            {refreshing ? (
              <span className="flex items-center gap-1 text-[10px] text-primary">
                <RefreshCw className="h-3 w-3 animate-spin" />
                جاري التحديث...
              </span>
            ) : lastUpdated ? (
              <span className="flex items-center gap-1 text-[9px] text-muted-foreground/50">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
                آخر تحديث: {lastUpdated}
              </span>
            ) : null}
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

      {/* Order Detail Dialog — Enhanced with status timeline, print, duplicate warning */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-lg p-0 gap-0 overflow-hidden dialog-slide-in" dir="rtl" onInteractOutside={(e) => e.preventDefault()}>
          <DialogTitle className="sr-only">تفاصيل الطلب</DialogTitle>
          {selectedOrder && (
            <div className="p-6">
              {/* Header with gradient */}
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-border">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold">تفاصيل الطلب</h3>
                    {duplicateOrderIds.has(selectedOrder.id) && (
                      <span className="badge-chip bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-[10px]">
                        ⚠️ طلب مكرر محتمل
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-xs text-muted-foreground font-mono">{selectedOrder.reference || selectedOrder.id}</p>
                    <span className="text-[10px] text-muted-foreground/60" dir="ltr">{getTimeAgoStatic(selectedOrder.createdAt)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={cn("status-pill-animated", STATUS_META[selectedOrder.status as keyof typeof STATUS_META]?.color)}>
                    {STATUS_META[selectedOrder.status as keyof typeof STATUS_META]?.label || selectedOrder.status}
                  </Badge>
                </div>
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
                {/* Customer loyalty indicator */}
                {(() => {
                  const loyalty = getLoyaltyTier(selectedOrder.customer?.phone || selectedOrder.customer?.name || '');
                  if (!loyalty.tier) return null;
                  const c = customerLoyalty.get(selectedOrder.customer?.phone || selectedOrder.customer?.name || '');
                  return (
                    <div className={cn(
                      "rounded-xl p-3 border",
                      loyalty.tier === 'ذهبي' && "bg-amber-500/5 border-amber-500/20",
                      loyalty.tier === 'فضي' && "bg-slate-500/5 border-slate-500/20",
                      loyalty.tier === 'برونزي' && "bg-orange-500/5 border-orange-500/20"
                    )}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={cn("text-lg", loyalty.color)}>{loyalty.icon}</span>
                          <div>
                            <p className={cn("text-xs font-semibold", loyalty.color)}>عميل {loyalty.tier}</p>
                            <p className="text-[10px] text-muted-foreground">{c?.orderCount || 0} طلب • {(c?.totalSpend || 0).toLocaleString("ar-DZ")} د.ج إجمالي</p>
                          </div>
                        </div>
                        {c && (
                          <div className="text-left">
                            <p className="text-[10px] text-muted-foreground">آخر طلب</p>
                            <p className="text-[10px] font-medium">{getTimeAgoStatic(c.lastOrder)}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}
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
                {/* Status Change Dropdown */}
                <select
                  value={selectedOrder.status}
                  onChange={(e) => { changeOrderStatus(selectedOrder.id, e.target.value); setSelectedOrder({...selectedOrder, status: e.target.value}); }}
                  className={cn(
                    "h-10 px-3 rounded-lg border text-sm flex-1",
                    STATUS_META[selectedOrder.status as keyof typeof STATUS_META]?.color || ""
                  )}
                >
                  {Object.entries(STATUS_META).map(([key, meta]) => (
                    <option key={key} value={key}>{meta.label}</option>
                  ))}
                </select>
                <a
                  href={`/api/orders/${selectedOrder.id}/invoice`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-10 px-3 rounded-lg border border-border hover:bg-muted/50 text-muted-foreground hover:text-foreground text-sm transition-colors flex items-center gap-1.5 micro-bounce press-feedback"
                  title="طباعة الفاتورة"
                >
                  <Download className="h-4 w-4" />
                </a>
                <a
                  href={selectedOrder.customer?.phone ? `https://wa.me/213${selectedOrder.customer.phone.replace(/^0/, "")}` : "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-10 px-3 rounded-lg border border-border hover:bg-green-50 dark:hover:bg-green-950/20 text-green-600 dark:text-green-400 text-sm transition-colors flex items-center gap-1.5 micro-bounce press-feedback"
                  title="تواصل عبر واتساب"
                >
                  <MessageCircle className="h-4 w-4" />
                </a>
                <a
                  href={`/s/${selectedOrder.shopSlug || "default"}?admin=1`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-10 px-3 rounded-lg border border-border hover:bg-muted/50 text-muted-foreground hover:text-foreground text-sm transition-colors flex items-center gap-1.5 micro-bounce press-feedback"
                  title="فتح في لوحة المتجر"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
                <button
                  onClick={() => { navigator.clipboard.writeText(selectedOrder.reference || selectedOrder.id); toast.success("تم نسخ معرف الطلب"); }}
                  className="h-10 px-3 rounded-lg border border-border hover:bg-muted/50 text-muted-foreground hover:text-foreground text-sm transition-colors flex items-center gap-1.5 micro-bounce press-feedback"
                  title="نسخ المعرف"
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
                {/* Status change in quick view */}
                <select
                  value={quickViewOrder.status}
                  onChange={(e) => { changeOrderStatus(quickViewOrder.id, e.target.value); setQuickViewOrder({...quickViewOrder, status: e.target.value}); }}
                  className={cn(
                    "h-8 px-2 rounded-lg border text-xs flex-1",
                    STATUS_META[quickViewOrder.status as keyof typeof STATUS_META]?.color || ""
                  )}
                >
                  {Object.entries(STATUS_META).map(([key, meta]) => (
                    <option key={key} value={key}>{meta.label}</option>
                  ))}
                </select>
                <a
                  href={quickViewOrder.customer?.phone ? `https://wa.me/213${quickViewOrder.customer.phone.replace(/^0/, "")}` : "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-8 w-8 rounded-lg border border-border text-green-600 dark:text-green-400 flex items-center justify-center hover:bg-green-50 dark:hover:bg-green-950/20 transition-colors"
                  title="واتساب"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MessageCircle className="h-3 w-3" />
                </a>
                <button
                  onClick={() => { setQuickViewOrder(null); setSelectedOrder(quickViewOrder); }}
                  className="h-8 px-3 rounded-lg bg-primary text-primary-foreground text-xs font-medium flex items-center justify-center gap-1 micro-bounce press-feedback"
                >
                  <Eye className="h-3 w-3" />
                  المزيد
                </button>
              </div>

              {/* Order comment in quick view */}
              <div className="mt-3 pt-3 border-t border-border/60">
                <div className="flex items-center gap-1.5 mb-2">
                  <StickyNote className="h-3 w-3 text-muted-foreground" />
                  <span className="text-[10px] font-bold text-muted-foreground">ملاحظة</span>
                </div>
                <div className="flex gap-1.5">
                  <input
                    value={qvComment}
                    onChange={(e) => setQvComment(e.target.value)}
                    placeholder="أضف ملاحظة سريعة..."
                    className="flex-1 h-7 px-2 rounded-lg border border-border/60 bg-muted/30 text-[11px] placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/40 comment-input-mini"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && qvComment.trim() && quickViewOrder) {
                        saveComment(quickViewOrder.id, qvComment.trim());
                        setQvComment("");
                        toast.success("تم حفظ الملاحظة");
                      }
                    }}
                  />
                  <button
                    onClick={() => {
                      if (qvComment.trim() && quickViewOrder) {
                        saveComment(quickViewOrder.id, qvComment.trim());
                        setQvComment("");
                        toast.success("تم حفظ الملاحظة");
                      }
                    }}
                    disabled={!qvComment.trim()}
                    className="h-7 w-7 rounded-lg bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed micro-bounce"
                  >
                    <Send className="h-3 w-3" />
                  </button>
                </div>
                {orderComments[quickViewOrder?.id || ""] && (
                  <p className="mt-1.5 text-[10px] text-muted-foreground bg-muted/30 rounded-lg px-2 py-1.5 comment-saved-text">
                    {orderComments[quickViewOrder?.id || ""]}
                  </p>
                )}
              </div>
              {/* Time in status */}
              <div className="mt-2 flex items-center justify-between">
                <span className="text-[9px] text-muted-foreground/50">المدة</span>
                <span className="text-[10px] font-medium text-muted-foreground time-in-status-badge">
                  {quickViewOrder && getTimeInStatus(quickViewOrder)}
                </span>
              </div>
              {/* Duplicate warning */}
              {quickViewOrder && <DuplicateWarning order={quickViewOrder} allOrders={safeOrders} />}

            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Bulk Delete Confirmation Dialog */}
      <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد حذف الطلبات</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف {selectedIds.size} طلب المحدد؟ لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={applyBulkDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              حذف {selectedIds.size} طلب
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Enhanced Floating Action Button */}
      <div className="fixed bottom-6 left-6 z-40 flex flex-col-reverse items-end gap-3">
        {/* Action items - shown when FAB is open */}
        {fabOpen && (
          <div className="flex flex-col items-end gap-2 fab-actions-container">
            {safeOrders.filter(o => o.status === "pending").length > 0 && (
              <button
                onClick={() => { setActiveTab("orders"); setStatusFilter("pending"); setFabOpen(false); }}
                className="fab-action-item fab-action-amber"
              >
                <Clock className="h-4 w-4" />
                <span>{safeOrders.filter(o => o.status === "pending").length} طلب معلق</span>
              </button>
            )}
            {safeOrders.filter(o => o.status === "printing").length > 0 && (
              <button
                onClick={() => { setActiveTab("orders"); setStatusFilter("printing"); setFabOpen(false); }}
                className="fab-action-item fab-action-blue"
              >
                <Printer className="h-4 w-4" />
                <span>{safeOrders.filter(o => o.status === "printing").length} جارٍ الطباعة</span>
              </button>
            )}
            {safeOrders.filter(o => o.status === "ready").length > 0 && (
              <button
                onClick={() => { setActiveTab("orders"); setStatusFilter("ready"); setFabOpen(false); }}
                className="fab-action-item fab-action-emerald"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>{safeOrders.filter(o => o.status === "ready").length} جاهز للاستلام</span>
              </button>
            )}
            <button
              onClick={() => {
                const next = !soundEnabled;
                setSoundEnabled(next);
                localStorage.setItem('sound-notifications', String(next));
                toast.success(next ? 'الإشعارات الصوتية مفعّلة' : 'الإشعارات الصوتية مُعطّلة');
                setFabOpen(false);
              }}
              className="fab-action-item fab-action-cyan"
            >
              {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              <span>{soundEnabled ? 'الصوت مفعّل' : 'الصوت مُعطّل'}</span>
            </button>
            <button
              onClick={() => { setActiveTab("orders"); setPriorityFilter("urgent"); setFabOpen(false); }}
              className="fab-action-item fab-action-rose"
            >
              <Zap className="h-4 w-4" />
              <span>{safeOrders.filter(o => (o.total||0) >= 5000).length} طلب عاجل</span>
            </button>
            <button
              onClick={() => { loadAll(false); setFabOpen(false); }}
              className="fab-action-item fab-action-violet"
            >
              <RefreshCw className="h-4 w-4" />
              <span>تحديث البيانات</span>
            </button>
          </div>
        )}
        {/* Main FAB button */}
        <button
          onClick={() => setFabOpen(!fabOpen)}
          className={cn(
            "rounded-full w-14 h-14 shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-110 quick-action-float group relative",
            fabOpen
              ? "bg-rose-500 hover:bg-rose-600 shadow-rose-500/30 rotate-45"
              : "bg-amber-500 hover:bg-amber-600 shadow-amber-500/30"
          )}
          title="إجراءات سريعة"
        >
          <PlusCircle className={cn("h-7 w-7 text-white transition-transform", fabOpen && "rotate-0")} />
          {!fabOpen && (
            <span className="absolute -top-1 -right-1 min-w-[20px] h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center px-1 notif-badge-pulse">
              {safeOrders.filter(o => o.status === "pending" || o.status === "ready").length || ''}
            </span>
          )}
        </button>
      </div>


      {/* Customer Quick Profile Dialog */}
      <Dialog open={!!customerProfile} onOpenChange={() => setCustomerProfile(null)}>
        <DialogContent className="max-w-sm p-0 gap-0 overflow-hidden" dir="rtl">
          <DialogTitle className="sr-only">ملف الزبون</DialogTitle>
          {customerProfile && (
            <div className="p-4">
              <CustomerQuickProfile
                order={customerProfile}
                allOrders={safeOrders}
                onClose={() => setCustomerProfile(null)}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
      {/* Keyboard shortcuts overlay */}
      {showShortcuts && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowShortcuts(false)}>
          <div className="bg-card border border-border rounded-2xl shadow-2xl p-5 max-w-md w-full mx-4 shortcuts-panel-enhanced" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Keyboard className="h-4 w-4 text-primary" />
                اختصارات لوحة المفاتيح
              </h3>
              <button onClick={() => setShowShortcuts(false)} className="w-7 h-7 rounded-lg hover:bg-muted flex items-center justify-center transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">التبويبات</p>
                {[
                  { keys: 'Alt + 1', desc: 'نظرة عامة' },
                  { keys: 'Alt + 2', desc: 'الطلبات' },
                  { keys: 'Alt + 3', desc: 'المتاجر' },
                  { keys: 'Alt + 4', desc: 'الإعدادات' },
                  { keys: 'Alt + 5', desc: 'الأمان' },
                  { keys: 'Alt + 6', desc: 'إعدادات المنصة' },
                ].map((s) => (
                  <div key={s.keys} className="flex items-center justify-between py-1.5 px-2.5 rounded-lg hover:bg-muted/50 transition-colors shortcut-row">
                    <span className="text-xs text-muted-foreground">{s.desc}</span>
                    <kbd className="inline-flex items-center text-[10px] font-mono bg-muted/80 border border-border rounded-md px-1.5 py-0.5 text-foreground shadow-sm">{s.keys}</kbd>
                  </div>
                ))}
              </div>
              <div className="h-px bg-border" />
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">الإجراءات</p>
                {[
                  { keys: 'Ctrl + K', desc: 'بحث شامل' },
                  { keys: 'Alt + R', desc: 'تحديث البيانات' },
                  { keys: 'Escape', desc: 'إغلاق النوافذ واللوحات' },
                  { keys: '?', desc: 'عرض هذا الدليل' },
                ].map((s) => (
                  <div key={s.keys} className="flex items-center justify-between py-1.5 px-2.5 rounded-lg hover:bg-muted/50 transition-colors shortcut-row">
                    <span className="text-xs text-muted-foreground">{s.desc}</span>
                    <kbd className="inline-flex items-center text-[10px] font-mono bg-muted/80 border border-border rounded-md px-1.5 py-0.5 text-foreground shadow-sm">{s.keys}</kbd>
                  </div>
                ))}
              </div>
            </div>
            <p className="text-[9px] text-muted-foreground/40 text-center mt-4">اضغط Escape أو ? للإغلاق</p>
          </div>
        </div>
      )}
    </div>
    </AdminErrorBoundary>
  );
}
