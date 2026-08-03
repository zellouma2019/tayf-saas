"use client";

import { useState, useEffect, useCallback, useMemo, useRef, Component, type ReactNode, type ErrorInfo } from "react";
import {
  Plus, Store, RefreshCw, Shield, Package, Clock,
  Search, ArrowUpDown, ArrowUp, ArrowDown,
  RotateCcw, LayoutGrid, Settings, Lock, Menu, Download, SlidersHorizontal,
  ChevronLeft, Columns3, CalendarDays, Users, FileText, Tag, Flame,
  Minimize2, Maximize2, Wifi, WifiOff, ChevronRight, X, Save, Eye, EyeOff,
  FileDown, Trash2, ExternalLink, BarChart3, Calendar,
} from "lucide-react";
import { ThemeToggle } from "@/components/app/theme-toggle";
// XLSX loaded dynamically in exportToExcel to reduce bundle size
import { toast } from "sonner";
import {
  STATUS_META, STATUS_FLOW, formatDA, formatDateTimeAr,
} from "@/lib/print-config";
import { cn } from "@/lib/utils";
import { DashboardSidebar } from "@/components/ui/dashboard-sidebar";
import type { GlobalStats, GlobalOrder, ShopStat } from "@/lib/admin-types";
import {
  isAuthenticated, verifySession, adminFetch, robustCopy, openInNewTab,
  SERVICE_EMOJI, STATUS_COLORS, STATUS_BORDER_COLORS, STATUS_DOT_COLORS,
  TAB_TITLES, clearSession, getTimeAgo,
} from "@/lib/admin-utils";
import { LoginGate } from "@/components/app/admin-login-gate";
import { CreateShopDialog } from "@/components/app/admin-create-shop";
import { SettingsEnhanced } from "@/components/app/admin-settings-enhanced";
import { SecurityTab } from "@/components/app/admin-security-tab";
import { PlatformSettingsTab } from "@/components/app/admin-platform-settings";
import { ShopPerformanceDashboard } from "@/components/app/admin-shop-dashboard";
import { QuickActionsToolbar, KeyboardShortcutsHelp } from "@/components/app/admin-quick-actions";
import { ShortcutsOverlay } from "@/components/app/admin-shortcuts-overlay";
import { AdminQuickOrderBtn } from "@/components/app/admin-quick-order-btn";
import { QuickSearch } from '@/components/app/admin-quick-search';
import { NotifSettings } from '@/components/app/admin-notif-settings';
import { AdminNotificationCenter } from "@/components/app/admin-notification-center";
import { QuickActionsPanel } from '@/components/app/admin-quick-actions-panel';
import { AdminOrderNotesPanel as OrderNotesPanel } from '@/components/app/admin-order-notes-panel';
import { RevenueGoalWidget } from '@/components/app/revenue-goal-widget';
import { useRealtimeOrders } from "@/lib/use-realtime-orders";
import { ActivityFeed } from '@/components/app/activity-feed';
import { SB } from '@/components/app/admin-section-boundary';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { ShopManageCard } from '@/components/app/admin-shop-card';
import {
  OrderTimelineMini, PerformanceMeter, CustomerInsight, OrderQuickStats, DuplicateDetector,
  StatusPipeline, AgingAlerts, AdminDailySummary, AdminStatusFlowViz, AdminRevenueChart,
  OrderRevenueTrend, ServiceBreakdown, PeakHours, StatsSummaryBar, CustomerHistory,
  CustomerDetailPanel, CustomerSpendingChart, StatusDonut, RetentionIndicator,
  OrderValueDistribution, ShopRevenueCompare, AdminCompletionFunnel, AdminServicePopularity,
  AdminOrderAgeAnalysis, AdminTopCustomersLeaderboard, AdminOrderSizeBreakdown,
  AdminShopActivityGrid, AdminShopHealthScores, AdminRecentQuickTable, AdminWeeklyComparison,
  AdminOrderVelocity, QuickStatsBar, PdfExportBtn, EmptyOrdersMessage, AdvancedSearchPanel,
  BulkStatusChange, AdminBulkActions, DateQuickFilter, ShopMiniCards, ShopKpiCards,
  QuickNotesInline, AnalyticsTab, KanbanTab, CalendarTab, CustomersTab, ReportsTab,
  OrderDetailDialog,
} from '@/components/app/admin-stubs';

export function SuperAdminPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [globalStats, setGlobalStats] = useState<GlobalStats | null>(null);
  const [allOrders, setAllOrders] = useState<GlobalOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [createOpen, setCreateOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [shopFilter, setShopFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("overview");
  const [orderViewMode, setOrderViewMode] = useState<"table" | "kanban" | "calendar">("table");
  const [priorityFilter, setPriorityFilter] = useState<"all" | "urgent" | "medium">("all");
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [shopSearch, setShopSearch] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<GlobalOrder | null>(null);
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  // v20: تحديد جماعي للطلبات
  const [selectedOrderIds, setSelectedOrderIds] = useState<Set<string>>(new Set());
  const toggleOrderSelection = useCallback((id: string) => {
    setSelectedOrderIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);
  const clearBulkSelection = useCallback(() => setSelectedOrderIds(new Set()), []);
  const [selectedShopDash, setSelectedShopDash] = useState<ShopStat | null>(null);
  // بيانات المتاجر المستقلة (عندما global-stats يُرجع partial)
  const [independentShops, setIndependentShops] = useState<ShopStat[]>([]);
  const [sortField, setSortField] = useState<string>("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  // اسم المدير (لعرضه في الترحيب)
  const [adminName, setAdminName] = useState<string>("");
  // إعدادات المنصة (الشعار والاسم)
  const [platformLogo, setPlatformLogo] = useState("");
  const [platformLogoDark, setPlatformLogoDark] = useState("");
  const [platformName, setPlatformName] = useState("طيف");

  // v13: Real-time clock
  const [clockTime, setClockTime] = useState("");
  useEffect(() => {
    const update = () => {
      const now = new Date();
      const h = String(now.getHours()).padStart(2, '0');
      const m = String(now.getMinutes()).padStart(2, '0');
      const toAr = (s: string) => s.replace(/0/g,'٠').replace(/1/g,'١').replace(/2/g,'٢').replace(/3/g,'٣').replace(/4/g,'٤').replace(/5/g,'٥').replace(/6/g,'٦').replace(/7/g,'٧').replace(/8/g,'٨').replace(/9/g,'٩');
      setClockTime(`${toAr(h)}:${toAr(m)}`);
    };
    update();
    const iv = setInterval(update, 1000);
    return () => clearInterval(iv);
  }, []);

  // v13: Connection status
  const [connStatus, setConnStatus] = useState<'connected'|'slow'|'disconnected'>('connected');
  useEffect(() => {
    const check = async () => {
      const start = Date.now();
      try {
        await fetch('/api/admin/global-stats', { method: 'HEAD', cache: 'no-store' });
        const ms = Date.now() - start;
        setConnStatus(ms < 2000 ? 'connected' : 'slow');
      } catch {
        setConnStatus('disconnected');
      }
    };
    check();
    const iv = setInterval(check, 15000);
    return () => clearInterval(iv);
  }, []);

  // v13: Compact mode
  const [compactMode, setCompactMode] = useState(false);

  // v13: Merchant FAB dialog
  const [merchantFabOpen, setMerchantFabOpen] = useState(false);
  const [merchantSearch, setMerchantSearch] = useState("");

  // v13: Enhanced order filters
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [minAmount, setMinAmount] = useState("");
  const [savedPresets, setSavedPresets] = useState<{ name: string; statusFilter: string; shopFilter: string; priorityFilter: string; dateFrom: string; dateTo: string; minAmount: string; search: string }[]>([]);
  const [presetDialogOpen, setPresetDialogOpen] = useState(false);
  const [presetName, setPresetName] = useState("");
  const [notesPanelOpen, setNotesPanelOpen] = useState(false);
  // R111: Customer detail panel
  const [selectedCustomer, setSelectedCustomer] = useState<{ phone: string; name: string } | null>(null);
  const [animatedCount, setAnimatedCount] = useState(0);
  const prevFilteredCount = useRef(0);

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

  const loadStats = useCallback(async (useCache = true): Promise<GlobalStats | null> => {
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
      const ctrl = new AbortController();
      const tm = setTimeout(() => ctrl.abort(), 15000);
      const resp = await adminFetch("/api/admin/global-stats", { signal: ctrl.signal, cache: 'no-store' }).catch(() => null);
      clearTimeout(tm);
      if (resp) {
        // Before parsing, try to purge any stale cached 500
        const d = await resp.json().catch(() => null);
        if (d && !d.error && typeof d.totalOrders !== 'undefined') {
          // إذا كانت البيانات جزئية (_partial)، لا تحفظها — أعد المحاولة
          if (d._partial && hasCached) {
            setLastUpdated("تحديث جزئي...");
            setTimeout(() => loadStats(true), 5000);
          } else {
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
            return stats;
          }
        } else {
          setLastUpdated("تعذّر التحديث");
          if (!hasCached) setLoadError("فشل تحميل الإحصائيات");
        }
      } else {
        setLastUpdated("تعذّر التحديث");
        if (!hasCached) setLoadError("خطأ في الاتصال بالخادم");
      }
    } catch {
      if (!hasCached) {
        setLoadError("خطأ في الاتصال بالخادم");
      } else {
        setLastUpdated("تعذّر التحديث — البيانات مخزنة مؤقتاً");
      }
    } finally {
      setLoading(false);
    }
    return null;
  }, []);

  // تحميل الطلبات بشكل مستقل — يُستخدم أيضاً لحساب الإحصائيات كبديل
  const loadOrders = useCallback(async (fallbackStats?: GlobalStats | null) => {
    setOrdersLoading(true);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);
    try {
      // R111: تحميل متوازي لكل الصفحات (بدلاً من sequential)
      // يقلل وقت التحميل من 10-15 ثانية إلى ~3 ثواني
      const pagePromises = Array.from({ length: 7 }, (_, i) =>
        adminFetch(`/api/orders?noPreview=true&limit=30&page=${i + 1}`, { signal: controller.signal, cache: 'no-store' })
          .then((r) => r.ok ? r.json() : null)
          .catch(() => null)
      );
      const results = await Promise.all(pagePromises);

      let allFetched: GlobalOrder[] = [];
      let paginationTotal = 0;
      for (const d of results) {
        if (d && !d.error && d.orders && d.orders.length > 0) {
          allFetched = allFetched.concat(d.orders as GlobalOrder[]);
          paginationTotal = d.pagination?.total || allFetched.length;
          if (d.orders.length < 30) break; // آخر صفحة
        } else {
          break; // خطأ أو لا بيانات
        }
      }
      if (allFetched.length > 0) {
        setAllOrders(allFetched);
        // v15: احسب الإحصائيات من الطلبات كبديل لـ global-stats
        const total = paginationTotal || allFetched.length;
        const revenue = allFetched.reduce((sum: number, o: GlobalOrder) => sum + (o.total || 0), 0);
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const todayOrd = allFetched.filter((o: GlobalOrder) => new Date(o.createdAt) >= today).length;
        const statusCounts: Record<string, number> = {};
        for (const o of allFetched) {
          const s = o.status || 'pending';
          statusCounts[s] = (statusCounts[s] || 0) + 1;
        }
        // حدّث globalStats بالإحصائيات المحسوبة من الطلبات
        setGlobalStats(prev => {
          const computed = {
            totalOrders: Math.max(prev?.totalOrders || 0, total),
            totalRevenue: Math.max(prev?.totalRevenue || 0, revenue),
            todayOrders: Math.max(prev?.todayOrders || 0, todayOrd),
            shopCount: prev?.shopCount || 0,
            activeShopCount: prev?.activeShopCount || 0,
            statusCounts: Object.keys(statusCounts).length > 0 ? statusCounts : (prev?.statusCounts || {}),
            shopStats: prev?.shopStats || [],
            recentOrders: allFetched.slice(0, 20) as unknown as [],
          };
          try { sessionStorage.setItem('admin_global_stats', JSON.stringify(computed)); } catch {}
          return computed;
        });
      } else if (fallbackStats?.recentOrders?.length) {
        setAllOrders(fallbackStats.recentOrders as unknown as GlobalOrder[]);
      }
    } catch {
      if (fallbackStats?.recentOrders?.length) {
        setAllOrders(fallbackStats.recentOrders as unknown as GlobalOrder[]);
      }
    } finally {
      clearTimeout(timeout);
      setOrdersLoading(false);
    }
  }, []);

  // تحميل المتاجر بشكل مستقل (عندما global-statspartial لا يتضمن shopStats)
  const loadShops = useCallback(async () => {
    try {
      const d = await adminFetch("/api/shops", {}).then((r) => r.ok ? r.json() : null).catch(() => null);
      if (d?.shops && d.shops.length > 0) {
        const mapped: ShopStat[] = d.shops.map((s: Record<string, unknown>) => ({
          id: String(s.id), name: String(s.name), slug: String(s.slug),
          ownerName: s.ownerName ? String(s.ownerName) : null,
          ownerPhone: s.ownerPhone ? String(s.ownerPhone) : null,
          phone: s.phone ? String(s.phone) : null,
          isActive: Boolean(s.isActive),
          trialDays: s.trialDays != null ? Number(s.trialDays) : null,
          trialStartsAt: s.trialStartsAt ? String(s.trialStartsAt) : null,
          plan: String(s.plan || "free"),
          adminPin: String(s.adminPin || ""),
          country: String(s.country || "DZ"),
          language: String(s.language || "ar"),
          orders: Number(s._count?.orders || 0),
          revenue: 0, todayOrders: 0, recentOrders: [] as never[],
        }));
        setIndependentShops(mapped);
      }
    } catch {}
  }, []);

  // النسخة الموحدة للتحديث اليدوي (زر التحديث) — تحميل الاثنين معاً
  const loadAll = useCallback(async (useCache = true) => {
    // تحميل الإحصائيات أولاً (أسرع) — نستخدمها كبديل للطلبات
    const freshStats = await loadStats(useCache);
    // تحميل الطلبات مع بديل من الإحصائيات (نمرر القيمة المُرجعة مباشرة بدلاً من state)
    await loadOrders(freshStats);
    // إذا كانت الإحصائيات جزئية، حمّل المتاجر بشكل مستقل
    if (!freshStats || !freshStats.shopStats || freshStats.shopStats.length === 0) {
      loadShops();
    }
  }, [loadStats, loadOrders, loadShops]);

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
    loadStats().then((freshStats) => {
      // 2) حمّل الطلبات مع بديل من الإحصائيات (نمرر القيمة المُرجعة مباشرة)
      loadOrders(freshStats);
    });

    // التحقق من الجلسة بالتوازي (يستخدم كاش sessionStorage لمدة 5 دقائق)
    // لا يُعطّل الواجهة أبداً — لو فشل الشبكة يبقى المستخدم يعمل
    verifySession().then(({ valid, adminName: name }) => {
      if (name) setAdminName(name);
      if (!valid) {
        clearSession();
        setAuthenticated(false);
      }
    });
  }, [authenticated, loadStats, loadOrders]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Alt+? لعرض الاختصارات
      if (e.altKey && e.key === "?") { e.preventDefault(); setShowShortcuts(v => !v); return; }
      if (!authenticated) return;
      // Alt+1 إلى Alt+8 للتنقل بين التبويبات
      const tabMap: Record<string, string> = { "1": "overview", "2": "orders", "3": "kanban", "4": "calendar", "5": "customers", "6": "shops", "7": "analytics", "8": "reports" };
      if (e.altKey && tabMap[e.key]) { e.preventDefault(); setActiveTab(tabMap[e.key]); return; }
      // Alt+R لتحديث البيانات
      if (e.altKey && e.key.toLowerCase() === "r") { e.preventDefault(); loadAll(false); return; }
      // Alt+N لطلب جديد
      if (e.altKey && e.key.toLowerCase() === "n") { e.preventDefault(); setCreateOpen(true); return; }
      // Alt+D للوضع المضغوط
      if (e.altKey && e.key.toLowerCase() === "d") { e.preventDefault(); setCompactMode(v => !v); return; }
      // Alt+T للإشعارات
      if (e.altKey && e.key.toLowerCase() === "t") {
        e.preventDefault();
        const notifBtn = document.querySelector('[role="region"][aria-label*="Notifications"]')?.querySelector('button, [tabindex]');
        if (notifBtn) (notifBtn as HTMLElement).click();
        return;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [authenticated, loadAll]);

  // تحديث تلقائي كل 60 ثانية + إشعار صوتي عند طلبات جديدة (R86)
  const [prevOrderCount, setPrevOrderCount] = useState(0);
  const [autoRefreshActive, setAutoRefreshActive] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(60);
  const [lastAutoRefresh, setLastAutoRefresh] = useState<string>("");
  const [refreshCountdown, setRefreshCountdown] = useState(60);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Play notification beep
  const playNotifSound = useCallback(() => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.1);
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.4);
    } catch {}
  }, []);

  useEffect(() => {
    if (!authenticated || !autoRefreshActive) return;
    let countdown = refreshInterval;
    setRefreshCountdown(countdown);
    const countdownInterval = setInterval(() => {
      countdown--;
      setRefreshCountdown(countdown);
      if (countdown <= 0) countdown = refreshInterval;
    }, 1000);

    const refreshTimer = setInterval(async () => {
      try {
        const d = await adminFetch("/api/admin/global-stats", { cache: 'no-store' }).then(r => r.ok ? r.json() : null).catch(() => null);
        if (d && !d.error) {
          const newCount = d.totalOrders ?? 0;
          if (prevOrderCount > 0 && newCount > prevOrderCount) {
            if (soundEnabled) playNotifSound();
            toast.success(`طلب جديد! (${newCount - prevOrderCount})`, { description: "تم تحديث البيانات تلقائياً" });
          }
          setPrevOrderCount(newCount);
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
          // Reload orders too (مع بديل من الإحصائيات)
          const od = await adminFetch("/api/orders?noPreview=true&limit=100", { signal: AbortSignal.timeout(30000) }).then(r => r.ok ? r.json() : null).catch(() => null);
          if (od && !od.error && od.orders?.length > 0) {
            setAllOrders(od.orders);
          } else {
            setAllOrders((stats.recentOrders || []) as unknown as GlobalOrder[]);
          }
        }
        const now = new Date();
        setLastAutoRefresh(`${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}:${now.getSeconds().toString().padStart(2,'0')}`);
      } catch {}
    }, refreshInterval * 1000);

    return () => { clearInterval(refreshTimer); clearInterval(countdownInterval); };
  }, [authenticated, autoRefreshActive, refreshInterval, prevOrderCount, playNotifSound, soundEnabled]);

  // Set initial prevOrderCount after first load
  useEffect(() => {
    if (globalStats?.totalOrders && prevOrderCount === 0) setPrevOrderCount(globalStats.totalOrders);
  }, [globalStats?.totalOrders, prevOrderCount]);

  // v21: مراقبة الطلبات الجديدة مع إشعارات تفصيلية
  useRealtimeOrders({
    enabled: authenticated && autoRefreshActive,
    currentCount: globalStats?.totalOrders,
    onNewOrders: () => {
      // إعادة تحميل البيانات عند وجود طلبات جديدة
      loadStats();
      loadOrders();
    },
  });

  const handleToggleAutoRefresh = useCallback(() => {
    setAutoRefreshActive(v => !v);
    toast.success(autoRefreshActive ? "تم إيقاف التحديث التلقائي" : "تم تفعيل التحديث التلقائي");
  }, [autoRefreshActive]);

  const handleIntervalChange = useCallback((seconds: number) => {
    setRefreshInterval(seconds);
    setRefreshCountdown(seconds);
    toast.success(`تم تغيير فاصل التحديث إلى ${seconds === 30 ? '30 ثانية' : seconds === 60 ? '60 ثانية' : seconds === 120 ? '2 دقيقة' : '5 دقائق'}`);
  }, []);

  const handleToggleSound = useCallback(() => {
    setSoundEnabled(v => !v);
    toast.success(soundEnabled ? "تم إيقاف الصوت" : "تم تفعيل الصوت");
  }, [soundEnabled]);

  // v13: Load saved filter presets from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('tayf_filter_presets_v13');
      if (saved) setSavedPresets(JSON.parse(saved));
    } catch {}
  }, []);

  const savePreset = useCallback(() => {
    if (!presetName.trim()) return;
    const preset = { name: presetName.trim(), statusFilter, shopFilter, priorityFilter, dateFrom, dateTo, minAmount, search };
    const updated = [...savedPresets, preset];
    setSavedPresets(updated);
    try { localStorage.setItem('tayf_filter_presets_v13', JSON.stringify(updated)); } catch {}
    setPresetName("");
    setPresetDialogOpen(false);
    toast.success(`تم حفظ الفلتر: ${preset.name}`);
  }, [presetName, statusFilter, shopFilter, priorityFilter, dateFrom, dateTo, minAmount, search, savedPresets]);

  const loadPreset = useCallback((preset: typeof savedPresets[number]) => {
    setStatusFilter(preset.statusFilter);
    setShopFilter(preset.shopFilter);
    setPriorityFilter(preset.priorityFilter as "all" | "urgent" | "medium");
    setDateFrom(preset.dateFrom);
    setDateTo(preset.dateTo);
    setMinAmount(preset.minAmount);
    setSearch(preset.search);
    toast.success(`تم تحميل الفلتر: ${preset.name}`);
  }, []);

  const deletePreset = useCallback((idx: number) => {
    const updated = savedPresets.filter((_, i) => i !== idx);
    setSavedPresets(updated);
    try { localStorage.setItem('tayf_filter_presets_v13', JSON.stringify(updated)); } catch {}
    toast.success("تم حذف الفلتر المحفوظ");
  }, [savedPresets]);

  const filteredOrders = useMemo(() => {
    let list = allOrders;
    if (statusFilter !== "all") list = list.filter((o) => o.status === statusFilter);
    if (shopFilter !== "all") list = list.filter((o) => o.shopSlug === shopFilter);
    if (priorityFilter === "urgent") list = list.filter((o) => o.total >= 5000);
    else if (priorityFilter === "medium") list = list.filter((o) => o.total >= 2000 && o.total < 5000);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((o) => o.reference.toLowerCase().includes(q) || o.customer.name.includes(q) || o.customer.phone.includes(q) || o.shopName.includes(q));
    }
    // v13: Date range filter
    if (dateFrom) {
      const from = new Date(dateFrom); from.setHours(0, 0, 0, 0);
      list = list.filter((o) => new Date(o.createdAt) >= from);
    }
    if (dateTo) {
      const to = new Date(dateTo); to.setHours(23, 59, 59, 999);
      list = list.filter((o) => new Date(o.createdAt) <= to);
    }
    // v13: Min amount filter
    if (minAmount) {
      const minVal = parseFloat(minAmount);
      if (!isNaN(minVal) && minVal > 0) list = list.filter((o) => o.total >= minVal);
    }
    return [...list].sort((a, b) => {
      let cmp = 0;
      if (sortField === "date") cmp = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      else if (sortField === "total") cmp = a.total - b.total;
      else if (sortField === "reference") cmp = a.reference.localeCompare(b.reference);
      return sortDir === "desc" ? (sortField === "date" ? cmp : -cmp) : (sortField === "date" ? -cmp : cmp);
    });
  }, [allOrders, statusFilter, shopFilter, search, sortField, sortDir, priorityFilter, dateFrom, dateTo, minAmount]);

  // v13: Animate filtered count
  useEffect(() => {
    const target = filteredOrders.length;
    const start = prevFilteredCount.current;
    if (start === target) { setAnimatedCount(target); return; }
    const duration = 400;
    const startTime = Date.now();
    const step = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedCount(Math.round(start + (target - start) * eased));
      if (progress < 1) requestAnimationFrame(step);
      else prevFilteredCount.current = target;
    };
    requestAnimationFrame(step);
  }, [filteredOrders.length]);

  function handleSort(field: string) {
    if (sortField === field) setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    else { setSortField(field); setSortDir("desc"); }
  }

  function SortIcon({ field }: { field: string }) {
    if (sortField !== field) return <ArrowUpDown className="h-3 w-3 text-muted-foreground/40" />;
    return sortDir === "desc" ? <ArrowDown className="h-3 w-3 text-primary" /> : <ArrowUp className="h-3 w-3 text-primary" />;
  }

  function getNextStatus(current: string): string | null {
    const idx = STATUS_FLOW.indexOf(current);
    if (idx >= 0 && idx < STATUS_FLOW.length - 1) return STATUS_FLOW[idx + 1];
    return null;
  }

  function getNextStatusLabel(current: string): string {
    const next = getNextStatus(current);
    return next ? STATUS_META[next]?.label || next : "";
  }

  function getAgeClass(createdAt: string): string {
    const hours = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60);
    if (hours > 72) return 'order-age-v24--old';
    if (hours > 24) return 'order-age-v24--day';
    return 'order-age-v24--new';
  }

  function handleQuickAdvance(e: React.MouseEvent, order: GlobalOrder) {
    e.stopPropagation();
    const next = getNextStatus(order.status);
    if (next && order.shopId) handleStatusChange(order.id, order.shopId, next);
  }

  async function exportToExcel() {
    try {
      const XLSX = await import('xlsx');
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
    } catch (e) {
      toast.error("فشل تصدير الملف");
    }
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

  async function handleStatusNotesSave(orderId: string, notes: string) {
    const order = allOrders.find(o => o.id === orderId);
    const shopId = order?.shopId || '';
    try {
      const res = await fetch(`/api/orders/${orderId}?shopId=${shopId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'edit', statusNotes: notes }) });
      if (res.ok) {
        setAllOrders(prev => prev.map(o => o.id === orderId ? { ...o, statusNotes: notes } : o));
      } else { toast.error('فشل حفظ الملاحظة'); }
    } catch { toast.error('خطأ في الاتصال'); }
  }

  async function handleUpdateNote(orderId: string, shopId: string, notes: string) {
    try {
      const res = await fetch(`/api/orders/${orderId}?shopId=${shopId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "edit", adminNotes: notes }) });
      if (res.ok) {
        setAllOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, notes } : o)));
        setSelectedOrder((prev) => prev && prev.id === orderId ? { ...prev, notes } : prev);
      } else { toast.error("فشل حفظ الملاحظة"); }
    } catch { toast.error("خطأ في الاتصال"); }
  }

  function getPriorityLevel(total: number): string {
    if (total >= 5000) return 'urgent';
    if (total >= 2000) return 'medium';
    return 'normal';
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

  // دمج المتاجر: من global-stats أو من المصدر المستقل
  const displayShops = useMemo(() => {
    if (stats?.shopStats && stats.shopStats.length > 0) return stats.shopStats;
    if (independentShops.length > 0) return independentShops;
    // R110: بديل أخير — استخرج المتاجر من الطلبات المحملة
    if (allOrders.length > 0) {
      const shopMap = new Map<string, ShopStat>();
      for (const o of allOrders) {
        if (o.shopSlug && !shopMap.has(o.shopSlug)) {
          shopMap.set(o.shopSlug, {
            id: o.shopId || o.shopSlug,
            name: o.shopName || o.shopSlug,
            slug: o.shopSlug,
            ownerName: null,
            ownerPhone: null,
            phone: null,
            isActive: true,
            trialDays: null,
            trialStartsAt: null,
            plan: 'free',
            adminPin: '',
            country: 'DZ',
            language: 'ar',
            orders: 0,
            revenue: 0,
            todayOrders: 0,
            recentOrders: [] as never[],
          });
        }
        const shop = shopMap.get(o.shopSlug);
        if (shop) {
          shop.orders = (shop.orders || 0) + 1;
          shop.revenue = (shop.revenue || 0) + (o.total || 0);
        }
      }
      const derived = Array.from(shopMap.values());
      if (derived.length > 0) return derived;
    }
    return [];
  }, [stats?.shopStats, independentShops, allOrders]);

  // بديل: إذا لم تكن الإحصائيات متاحة لكن الطلبات محملة، أنشئ إحصائيات من الطلبات
  const effectiveStats = useMemo<GlobalStats | null>(() => {
    if (stats) return stats;
    if (allOrders.length === 0) return null;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const statusCounts: Record<string, number> = {};
    let totalRevenue = 0;
    let todayOrders = 0;
    for (const o of allOrders) {
      const s = o.status || 'pending';
      statusCounts[s] = (statusCounts[s] || 0) + 1;
      totalRevenue += o.total || 0;
      if (new Date(o.createdAt) >= today) todayOrders++;
    }
    return {
      totalOrders: allOrders.length,
      totalRevenue,
      todayOrders,
      shopCount: displayShops.length || 0,
      activeShopCount: displayShops.filter(s => s.isActive).length || 0,
      statusCounts,
      shopStats: displayShops,
      recentOrders: allOrders.slice(0, 20) as never[],
    };
  }, [stats, allOrders, displayShops]);

  const displayShopCount = useMemo(() => {
    if (stats?.shopCount && stats.shopCount > 0) return stats.shopCount;
    return displayShops.length;
  }, [stats?.shopCount, displayShops.length]);

  const displayActiveShopCount = useMemo(() => {
    if (stats?.activeShopCount && stats.activeShopCount > 0) return stats.activeShopCount;
    return displayShops.filter(s => s.isActive).length;
  }, [stats?.activeShopCount, displayShops]);

  const sidebarSections = useMemo(() => {
    const pendingCount = effectiveStats?.statusCounts?.pending ?? 0;
    const customerCount = new Set(allOrders.map(o => o.customer?.phone)).size;
    const completedCount = effectiveStats?.statusCounts?.delivered ?? effectiveStats?.statusCounts?.ready ?? 0;
    const totalForProgress = effectiveStats?.totalOrders ?? 0;
    const progressPct = totalForProgress > 0 ? Math.round((completedCount / totalForProgress) * 100) : 0;
    return [
    { title: "الرئيسية", items: [
      { key: "overview", label: "نظرة عامة", icon: LayoutGrid, tooltip: "عرض ملخص سريع لإحصائيات المتاجر" },
      { key: "analytics", label: "التحليلات", icon: BarChart3, tooltip: "رسوم بيانية وإحصائيات متقدمة" },
      { key: "reports", label: "التقارير المالية", icon: FileText, tooltip: "تقارير مالية تفصيلية" },
      { key: "orders", label: "الطلبات", icon: Package, badge: stats?.totalOrders, badgeColor: pendingCount > 0 ? '#f59e0b' : undefined, tooltip: "إدارة جميع الطلبات من مكان واحد", progressRing: progressPct },
      { key: "kanban", label: "لوحة كانبان", icon: Columns3, badge: pendingCount > 0 ? pendingCount : undefined, badgeColor: '#ef4444', tooltip: "متابعة حالة الطلبات بشكل بصري" },
      { key: "calendar", label: "التقويم", icon: CalendarDays, tooltip: "عرض الطلبات على التقويم" },
      { key: "customers", label: "الزبائن", icon: Users, badge: customerCount, badgeColor: '#3b82f6', tooltip: "قائمة جميع الزبائن وتفاصيلهم" },
      { key: "shops", label: "المتاجر", icon: Store, badge: displayShopCount, badgeColor: '#14b8a6', tooltip: "إدارة المتاجر المسجلة في المنصة" },
    ]},
    { title: "المنصة", collapsible: true, items: [
      { key: "platformSettings", label: "إعدادات المنصة", icon: Settings, tooltip: "تخصيص شكل وسلوك المنصة" },
      { key: "settings", label: "إعدادات المتاجر", icon: SlidersHorizontal, tooltip: "إعدادات عامة للمتاجر" },
    ]},
    { title: "النظام", collapsible: true, items: [
      { key: "security", label: "الأمان والفريق", icon: Lock, tooltip: "إدارة صلاحيات وأعضاء الفريق" },
    ]},
  ];
  }, [effectiveStats, allOrders, displayShopCount]);

  if (!mounted) return <div className="min-h-screen bg-background" />;
  if (!authenticated) return <LoginGate onUnlock={() => setAuthenticated(true)} />;

  return (
    <div className="flex h-screen overflow-hidden overflow-x-hidden" dir="rtl">
      <DashboardSidebar
        sections={sidebarSections} activeKey={activeTab} onNavigate={setActiveTab}
        collapsed={sidebarCollapsed} onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        mobileOpen={mobileOpen} onMobileToggle={() => setMobileOpen(!mobileOpen)}
        adminName={adminName}
        logo={<div className="flex items-center gap-3">{platformLogo ? (<img src={platformLogo} alt={platformName} className="w-9 h-9 rounded-xl shrink-0 object-cover dark:hidden" />) : (<img src="/tayf-logo-sm.png" alt={platformName} className="w-9 h-9 rounded-xl shrink-0 dark:hidden" />)}{platformLogoDark ? (<img src={platformLogoDark} alt={platformName} className="w-9 h-9 rounded-xl shrink-0 object-cover hidden dark:block" />) : (platformLogo ? (<img src={platformLogo} alt={platformName} className="w-9 h-9 rounded-xl shrink-0 object-cover hidden dark:block" />) : (<img src="/tayf-logo-sm-dark.png" alt={platformName} className="w-9 h-9 rounded-xl shrink-0 hidden dark:block" />))}{!sidebarCollapsed && <div className="min-w-0"><div className="font-bold text-sm text-sidebar-primary-foreground truncate">{platformName}</div><div className="text-[10px] text-sidebar-foreground/50 truncate">لوحة التحكم</div></div>}</div>}
      />
      <div className="flex-1 min-w-0 bg-background overflow-x-hidden overflow-y-auto">
        <header className={cn("bg-background border-b border-border sticky top-0 z-30 px-4 sm:px-6 transition-all duration-300", compactMode ? "h-12" : "h-16")}>
          <div className={cn("flex items-center justify-between gap-2 sm:gap-3", compactMode ? "h-12" : "h-full")}>
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <button type="button" onClick={() => setMobileOpen(!mobileOpen)} className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:hidden" aria-label={mobileOpen ? 'إغلاق القائمة' : 'فتح القائمة'}><Menu size={20} /></button>
              {platformLogo ? (<img src={platformLogo} alt={platformName} className={cn("rounded-lg shrink-0 object-cover dark:hidden", compactMode ? "w-7 h-7" : "w-8 h-8")} />) : (<img src="/tayf-logo-sm.png" alt={platformName} className={cn("rounded-lg shrink-0 object-cover dark:hidden", compactMode ? "w-7 h-7" : "w-8 h-8")} />)}
              {platformLogoDark ? (<img src={platformLogoDark} alt={platformName} className={cn("rounded-lg shrink-0 object-cover hidden dark:block", compactMode ? "w-7 h-7" : "w-8 h-8")} />) : (platformLogo ? (<img src={platformLogo} alt={platformName} className={cn("rounded-lg shrink-0 object-cover hidden dark:block", compactMode ? "w-7 h-7" : "w-8 h-8")} />) : (<img src="/tayf-logo-sm-dark.png" alt={platformName} className={cn("rounded-lg shrink-0 object-cover hidden dark:block", compactMode ? "w-7 h-7" : "w-8 h-8")} />))}
              <div className="min-w-0">
                <h1 className={cn("font-semibold text-foreground truncate", compactMode ? "text-xs" : "text-sm")}>{TAB_TITLES[activeTab] || "لوحة التحكم"}</h1>
                {!compactMode && <p className="text-xs text-muted-foreground truncate">{platformName} / {TAB_TITLES[activeTab] || "نظرة عامة"}</p>}
              </div>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 overflow-hidden">
              {!compactMode && stats?.statusCounts && !loading && (
                <div className="header-notif-pills hidden lg:flex">
                  {(stats.statusCounts.pending ?? 0) > 0 && (
                    <span className="header-notif-pill header-notif-pill-pending header-v13-pill-pulse">
                      <span className="header-notif-label">⏳ </span><span className="header-notif-pill-count">{stats.statusCounts.pending}</span><span className="header-notif-label hidden xl:inline">بانتظار</span>
                    </span>
                  )}
                  {(stats.statusCounts.printing ?? 0) > 0 && (
                    <span className="header-notif-pill header-notif-pill-printing header-v13-pill-pulse">
                      <span className="header-notif-label">🖨 </span><span className="header-notif-pill-count">{stats.statusCounts.printing}</span><span className="header-notif-label hidden xl:inline">طباعة</span>
                    </span>
                  )}
                  {(stats.statusCounts.ready ?? 0) > 0 && (
                    <span className="header-notif-pill header-notif-pill-ready header-v13-pill-pulse">
                      <span className="header-notif-label">✅ </span><span className="header-notif-pill-count">{stats.statusCounts.ready}</span><span className="header-notif-label hidden xl:inline">جاهز</span>
                    </span>
                  )}
                </div>
              )}
              {!compactMode && clockTime && (
                <div className="hidden sm:flex items-center gap-1.5 text-xs font-mono text-muted-foreground/70 px-2 py-1 rounded-lg bg-muted/50">
                  <Clock className="h-3.5 w-3.5" />
                  <span dir="ltr" className="tabular-nums">{clockTime}</span>
                </div>
              )}
              <div className={cn("hidden sm:flex items-center gap-1 px-1.5", connStatus === 'connected' ? 'text-green-500' : connStatus === 'slow' ? 'text-yellow-500' : 'text-red-500')} title={connStatus === 'connected' ? 'متصل' : connStatus === 'slow' ? 'اتصال بطيء' : 'غير متصل'}>
                {connStatus === 'connected' ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
                <span className={cn("w-2 h-2 rounded-full", connStatus === 'connected' ? 'bg-green-500' : connStatus === 'slow' ? 'bg-yellow-500 animate-pulse' : 'bg-red-500')} />
              </div>
              {authenticated && !loading && (
                <div className={"hidden sm:flex items-center " + (autoRefreshActive ? "auto-refresh-indicator auto-refresh-active" : "auto-refresh-indicator auto-refresh-paused")} onClick={handleToggleAutoRefresh} title={autoRefreshActive ? "تحديث تلقائي (اضغط لإيقاف)" : "تحديث متوقف (اضغط للتفعيل)"}>
                  <div className={"auto-refresh-dot " + (autoRefreshActive ? "auto-refresh-dot-active" : "")} />
                </div>
              )}
              {!compactMode && <button onClick={() => { window.dispatchEvent(new KeyboardEvent('keydown', {key: 'k', ctrlKey: true})); }} className="text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg p-2.5 text-sm transition-colors" title="بحث سريع (Ctrl+K)"><Search className="h-4 w-4" /></button>}
              <NotifSettings
                autoRefreshActive={autoRefreshActive}
                onToggleAutoRefresh={handleToggleAutoRefresh}
                currentInterval={refreshInterval}
                onIntervalChange={handleIntervalChange}
                soundEnabled={soundEnabled}
                onToggleSound={handleToggleSound}
                notifCount={((stats?.statusCounts?.pending ?? 0) + (stats?.statusCounts?.printing ?? 0))}
              />
              {/* v20: Notification Center */}
              {authenticated && !loading && allOrders.length > 0 && (
                <AdminNotificationCenter orders={allOrders} onNavigate={setActiveTab} />
              )}
              <ThemeToggle />
              {!compactMode && <button onClick={() => setCreateOpen(true)} className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg px-3 py-2 text-sm font-medium transition-colors flex items-center gap-1.5"><Plus className="h-4 w-4" /><span className="hidden md:inline">إنشاء متجر</span></button>}
              <button onClick={() => loadAll(false)} className="text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg p-2.5 text-sm transition-colors"><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /></button>
              <button onClick={() => setCompactMode(v => !v)} className="text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg p-2.5 text-sm transition-colors" title={compactMode ? 'الوضع الكامل' : 'الوضع المضغوط'}>
                {compactMode ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
              </button>
            </div>
          </div>
          {!compactMode && (
            <div className="header-v13-breadcrumb flex items-center gap-1 text-[11px] text-muted-foreground/60 pb-2 -mt-1 overflow-hidden">
              <span className="truncate">{platformName}</span>
              <ChevronRight className="h-3 w-3 shrink-0 rotate-180" />
              <span className="truncate font-medium text-muted-foreground/80">{TAB_TITLES[activeTab] || "نظرة عامة"}</span>
            </div>
          )}
        </header>


        {loading ? (
          <div className="p-4 sm:p-6 space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{[...Array(4)].map((_, i) => (<div key={i} className="animate-pulse bg-muted rounded-xl p-5"><div className="flex items-start justify-between"><div className="space-y-2.5 flex-1"><div className="h-8 bg-muted rounded-lg w-24" /><div className="h-3 bg-muted/40 rounded w-28" /></div><div className="w-11 h-11 rounded-xl bg-muted" /></div></div>))}</div>
            <div className="animate-pulse bg-muted rounded-xl p-6"><div className="h-5 bg-muted rounded-lg w-48 mb-5" /><div className="space-y-3">{[...Array(5)].map((_, i) => (<div key={i} className="h-12 bg-muted/30 rounded-lg" />))}</div></div>
          </div>
        ) : (
        <div className="page-stagger p-4 sm:p-6 space-y-6">
          {activeTab === "overview" && effectiveStats && <SB name="النظرة العامة"><OverviewTab stats={{...effectiveStats, shopCount: displayShopCount, activeShopCount: displayActiveShopCount}} lastUpdated={lastUpdated} onOpenCreate={() => setCreateOpen(true)} adminName={adminName} onShopDashboard={(s) => setSelectedShopDash(s)} orders={allOrders} /></SB>}
          {activeTab === "overview" && allOrders.length > 0 && <SB name="إحصائيات سريعة"><OrderQuickStats orders={allOrders} /></SB>}
          {activeTab === 'overview' && allOrders.length > 0 && <DuplicateDetector orders={allOrders} />}
          {activeTab === "overview" && effectiveStats && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              <RevenueGoalWidget targetRevenue={5000} currentRevenue={effectiveStats.totalRevenue} period="daily" />
              <div className="lg:col-span-2">
                <OrderTimelineMini orders={allOrders.slice(0, 5).map(o => ({
                  id: o.id, reference: o.reference, serviceName: o.serviceName,
                  status: o.status, total: o.total, createdAt: o.createdAt,
                  customerName: o.customer?.name || '—', shopName: o.shopName
                }))} />
              </div>
            </div>
          )}
          {activeTab === "overview" && effectiveStats && allOrders.length > 0 && (
            <PerformanceMeter orders={allOrders.map(o => ({ status: o.status, total: o.total, createdAt: o.createdAt, serviceType: o.serviceType }))} shops={(effectiveStats.shopStats || []).map(s => ({ name: s.name, orders: s.orders || 0, revenue: s.revenue || 0 }))} />
          )}
          {activeTab === "overview" && effectiveStats && allOrders.length > 0 && (
            <CustomerInsight orders={allOrders} />
          )}
          {activeTab === "overview" && allOrders.length > 0 && (
            <SB name="آخر الأنشطة">
              <ActivityFeed orders={allOrders} onViewOrder={setSelectedOrder} />
            </SB>
          )}
          {activeTab === "overview" && allOrders.length > 0 && (
            <SB name="مسار حالات الطلبات">
              <StatusPipeline orders={allOrders} onStatusClick={(s) => { setStatusFilter(s); setActiveTab('orders'); }} />
            </SB>
          )}
          {activeTab === "overview" && allOrders.length > 0 && (
            <SB name="طلبات تحتاج متابعة">
              <AgingAlerts orders={allOrders} onOrderClick={setSelectedOrder} />
            </SB>
          )}
          {activeTab === "overview" && allOrders.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <AdminDailySummary orders={allOrders} />
              <AdminStatusFlowViz orders={allOrders} />
            </div>
          )}
          {activeTab === "overview" && allOrders.length > 0 && (
            <SB name="رسم الإيرادات"><AdminRevenueChart orders={allOrders} /></SB>
          )}
          {activeTab === "overview" && allOrders.length > 0 && (
            <SB name="اتجاه الإيرادات اليومي">
              <OrderRevenueTrend orders={allOrders} onDateClick={(date) => { setSearch(date); setActiveTab('orders'); }} />
            </SB>
          )}
          {activeTab === "overview" && allOrders.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <SB name="توزيع الإيرادات حسب الخدمة">
                <ServiceBreakdown orders={allOrders} onServiceClick={(name) => { setSearch(name); setActiveTab('orders'); }} />
              </SB>
              <SB name="خريطة ذروة الطلبات">
                <PeakHours orders={allOrders} />
              </SB>
            </div>
          )}
          {activeTab === "customers" && (
            <div className="space-y-5">
              <StatsSummaryBar stats={stats} loading={loading} />
              <CustomerHistory orders={allOrders} />
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                <div className={cn("transition-all", selectedCustomer ? "lg:col-span-2" : "lg:col-span-3")}>
                  <CustomersTab orders={allOrders} shopFilter={shopFilter} onOrderClick={setSelectedOrder} onSelectCustomer={setSelectedCustomer} />
                </div>
                {selectedCustomer && (
                  <div className="lg:col-span-1">
                    <CustomerDetailPanel
                      customerPhone={selectedCustomer.phone}
                      customerName={selectedCustomer.name}
                      orders={allOrders}
                      onClose={() => setSelectedCustomer(null)}
                      onOrderClick={setSelectedOrder}
                    />
                  </div>
                )}
              </div>
              {allOrders.length > 0 && (
                <SB name="توزيع إنفاق الزبائن">
                  <CustomerSpendingChart orders={allOrders} onCustomerClick={(phone, name) => setSelectedCustomer({ phone, name })} />
                </SB>
              )}
            </div>
          )}
          {activeTab === "overview" && allOrders.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <SB name="توزيع الحالات">
                <StatusDonut orders={allOrders} onStatusClick={(s) => { setStatusFilter(s); setActiveTab('orders'); }} />
              </SB>
              <SB name="احتفاظ الزبائن">
                <RetentionIndicator orders={allOrders} />
              </SB>
            </div>
          )}
          {activeTab === "overview" && allOrders.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <SB name="توزيع قيمة الطلبات">
                <OrderValueDistribution orders={allOrders} />
              </SB>
              <SB name="مقارنة إيرادات المتاجر">
                <ShopRevenueCompare orders={allOrders} onShopClick={(name) => { setShopSearch(name); setActiveTab('shops'); }} />
              </SB>
            </div>
          )}
          {activeTab === "overview" && allOrders.length > 0 && (
            <SB name="قمع إتمام الطلبات">
              <AdminCompletionFunnel orders={allOrders} onStepClick={(s) => { setStatusFilter(s); setActiveTab('orders'); }} />
            </SB>
          )}
          {activeTab === "overview" && allOrders.length > 0 && (
            <SB name="ترتيب الخدمات الأكثر طلباً">
              <AdminServicePopularity orders={allOrders} onServiceClick={(name) => { setSearch(name); setActiveTab('orders'); }} />
            </SB>
          )}
          {activeTab === "overview" && allOrders.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <SB name="تحليل عمر الطلبات">
                <AdminOrderAgeAnalysis orders={allOrders} onStatusClick={(s) => { setStatusFilter(s); setActiveTab('orders'); }} />
              </SB>
              <SB name="لوحة المتصدرين">
                <AdminTopCustomersLeaderboard orders={allOrders} onCustomerClick={(phone, name) => { setSelectedCustomer({ phone, name }); setActiveTab('customers'); }} />
              </SB>
            </div>
          )}
          {activeTab === "overview" && allOrders.length > 0 && (
            <SB name="توزيع حجم الطلبات">
              <AdminOrderSizeBreakdown orders={allOrders} />
            </SB>
          )}
          {activeTab === "overview" && allOrders.length > 0 && (
            <SB name="شبكة نشاط المتاجر">
              <AdminShopActivityGrid orders={allOrders} onShopClick={(name) => { setShopSearch(name); setActiveTab('shops'); }} />
            </SB>
          )}
          {activeTab === "overview" && allOrders.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <SB name="مؤشر صحة المتاجر">
                <AdminShopHealthScores orders={allOrders} onShopClick={(name) => { setShopSearch(name); setActiveTab('shops'); }} />
              </SB>
              <SB name="آخر الطلبات">
                <AdminRecentQuickTable orders={allOrders} onOrderClick={setSelectedOrder} />
              </SB>
            </div>
          )}
          {activeTab === "overview" && allOrders.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <SB name="مقارنة الأسبوع">
                <AdminWeeklyComparison orders={allOrders} />
              </SB>
              <SB name="سرعة الطلبات">
                <AdminOrderVelocity orders={allOrders} />
              </SB>
            </div>
          )}
          {activeTab === "overview" && effectiveStats && (
            <QuickStatsBar stats={{
              totalOrders: effectiveStats.totalOrders || allOrders.length,
              totalRevenue: effectiveStats.totalRevenue || 0,
              todayOrders: effectiveStats.todayOrders || 0,
              pendingOrders: effectiveStats.statusCounts?.pending || 0,
              completedToday: allOrders.filter(o => o.status === 'delivered' && new Date(o.createdAt) >= new Date(new Date().setHours(0,0,0,0))).length
            }} />
          )}
          {activeTab === 'overview' && effectiveStats && (
            <div className="flex items-center justify-end -mt-3 mb-2">
              <PdfExportBtn stats={{ totalOrders: effectiveStats.totalOrders, totalRevenue: effectiveStats.totalRevenue, todayOrders: effectiveStats.todayOrders, shopCount: effectiveStats.shopCount }} />
            </div>
          )}
          {activeTab === "overview" && !effectiveStats && !loading && (
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

          {activeTab === "orders" && allOrders.length > 0 && (
            <SB name="مسار الحالات">
              <StatusPipeline orders={allOrders} onStatusClick={(s) => { setStatusFilter(s); }} />
            </SB>
          )}
          {activeTab === "orders" && (
            <div className="space-y-5">
              {/* شريط الإحصائيات السريع */}
              <StatsSummaryBar stats={stats} loading={loading} />
              {/* أزرار تبديل طريقة العرض + فلتر الأولوية */}
              <div className="flex items-center gap-2 flex-wrap">
                <button onClick={() => setOrderViewMode("table")} className={cn("view-mode-btn", orderViewMode === "table" && "view-mode-btn-active")}><Package className="h-3.5 w-3.5" /><span className="hidden sm:inline">جدول</span></button>
                <button onClick={() => setOrderViewMode("kanban")} className={cn("view-mode-btn", orderViewMode === "kanban" && "view-mode-btn-active")}><Columns3 className="h-3.5 w-3.5" /><span className="hidden sm:inline">كانبان</span></button>
                <button onClick={() => setOrderViewMode("calendar")} className={cn("view-mode-btn", orderViewMode === "calendar" && "view-mode-btn-active")}><CalendarDays className="h-3.5 w-3.5" /><span className="hidden sm:inline">تقويم</span></button>
                <div className="w-px h-5 bg-border mx-1 hidden sm:block" />
                <button onClick={() => setPriorityFilter(p => p === 'urgent' ? 'all' : 'urgent')} className={cn("view-mode-btn text-xs", priorityFilter === 'urgent' && "view-mode-btn-active !text-rose-600 dark:!text-rose-400")} title="عاجل (5000+ د.ج)"><Flame className="h-3.5 w-3.5" /><span className="hidden sm:inline">عاجل</span></button>
                <button onClick={() => setPriorityFilter(p => p === 'medium' ? 'all' : 'medium')} className={cn("view-mode-btn text-xs", priorityFilter === 'medium' && "view-mode-btn-active !text-amber-600 dark:!text-amber-400")} title="متوسط (2000-4999 د.ج)"><Clock className="h-3.5 w-3.5" /><span className="hidden sm:inline">متوسط</span></button>
              </div>
              {orderViewMode === "kanban" ? (
                <KanbanTab orders={allOrders} onStatusChange={handleStatusChange} onOrderClick={setSelectedOrder} shopFilter={shopFilter} />
              ) : orderViewMode === "calendar" ? (
                <SB name="تقويم الطلبات">
                  <CalendarTab orders={allOrders} onOrderClick={setSelectedOrder} shopFilter={shopFilter} />
                </SB>
              ) : (
              <>
              <AdvancedSearchPanel
                open={showAdvancedSearch}
                onClose={() => setShowAdvancedSearch(false)}
                onSearch={(f: AdvancedFilters) => {
                  if (f.customerName) setSearch(f.customerName);
                  else if (f.customerPhone) setSearch(f.customerPhone);
                  if (f.status !== 'all') setStatusFilter(f.status);
                  else setStatusFilter('all');
                  if (f.shopId !== 'all') setShopFilter(f.shopId);
                  else setShopFilter('all');
                }}
                onClear={() => { setSearch(''); setStatusFilter('all'); setShopFilter('all'); setPriorityFilter('all'); }}
                shops={(stats?.shopStats || []).map(s => ({ id: s.slug || s.id, name: s.name }))}
                services={[...new Set(allOrders.map(o => o.serviceName).filter(Boolean))]}
              />
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="relative md:col-span-1"><Search className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/70" /><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="ابحث برقم الطلب، اسم، هاتف، أو متجر..." className="pr-10 text-sm h-10 rounded-lg focus:ring-ring focus:border-ring bg-background" /></div>
                <Select value={shopFilter} onValueChange={setShopFilter}><SelectTrigger className="text-sm h-10 rounded-lg border-border bg-background"><SelectValue placeholder="كل المتاجر" /></SelectTrigger><SelectContent><SelectItem value="all">كل المتاجر</SelectItem>{stats?.shopStats.map((s) => (<SelectItem key={s.id} value={s.slug}>{s.name}</SelectItem>))}</SelectContent></Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger className="text-sm h-10 rounded-lg border-border bg-background"><SelectValue placeholder="كل الحالات" /></SelectTrigger><SelectContent><SelectItem value="all">كل الحالات</SelectItem>{STATUS_FLOW.map((s) => (<SelectItem key={s} value={s}>{STATUS_META[s].label}</SelectItem>))}<SelectItem value="cancelled">ملغي</SelectItem></SelectContent></Select>
                <div className="flex items-center gap-2">
                {selectedOrderIds.size > 0 && <BulkStatusChange selectedIds={selectedOrderIds} orders={allOrders} onClear={clearBulkSelection} onRefresh={() => loadAll(false)} />}
                <button onClick={() => setShowAdvancedSearch(v => !v)} className={cn("border rounded-lg px-3 py-2.5 text-sm font-medium transition-all flex items-center justify-center gap-1.5 bg-background", showAdvancedSearch ? "border-indigo-500/30 text-indigo-400 bg-indigo-500/5" : "border-border text-foreground hover:bg-accent")} title="بحث متقدم"><SlidersHorizontal className="h-4 w-4" /><span className="hidden lg:inline">بحث متقدم</span></button>
                <button onClick={exportToExcel} disabled={filteredOrders.length === 0} className="border border-border text-foreground hover:bg-accent rounded-lg px-4 py-2.5 text-sm font-medium transition-colors flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed bg-background"><Download className="h-4 w-4" /><span className="hidden sm:inline">تصدير</span></button>
                <button onClick={() => setNotesPanelOpen(true)} className="border border-border text-foreground hover:bg-accent rounded-lg px-4 py-2.5 text-sm font-medium transition-colors flex items-center justify-center gap-1.5 bg-background" title="الطلبات المعلّقة"><FileText className="h-4 w-4" /><span className="hidden sm:inline">ملاحظات</span></button>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground/70 px-1"><span>المعروض: <b className="text-foreground/60">{filteredOrders.length}</b> من {allOrders.length}</span></div>
              {/* R111: فلاتر التاريخ السريعة */}
              <DateQuickFilter onRange={(from, to) => { setDateFrom(from || ""); setDateTo(to || ""); }} activeFrom={dateFrom || null} activeTo={dateTo || null} />
              {/* جدول - حاسوب */}
              <div className="hidden md:block bg-card rounded-xl border border-border shadow-sm overflow-x-auto">
                <Table>
                  <TableHeader><TableRow className="bg-background/80 hover:bg-background/80 border-b border-border table-v27-stripe">
                    <TableHead className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wide cursor-pointer select-none hover:text-foreground" onClick={() => handleSort("reference")}><span className="inline-flex items-center gap-1">رقم الطلب <SortIcon field="reference" /></span></TableHead>
                    <TableHead className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wide">المتجر</TableHead>
                    <TableHead className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wide">الخدمة</TableHead>
                    <TableHead className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wide">العميل</TableHead>
                    <TableHead className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wide cursor-pointer select-none hover:text-foreground" onClick={() => handleSort("total")}><span className="inline-flex items-center gap-1">المجموع <SortIcon field="total" /></span></TableHead>
                    <TableHead className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wide">الحالة</TableHead>
                    <TableHead className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wide">العمر</TableHead>
                    <TableHead className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wide cursor-pointer select-none hover:text-foreground" onClick={() => handleSort("date")}><span className="inline-flex items-center gap-1">التاريخ <SortIcon field="date" /></span></TableHead>
                    <TableHead className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wide w-10"></TableHead>
                  <TableHead className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wide w-10">  
                  </TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {filteredOrders.slice(0, 100).map((o) => (
                      <TableRow key={o.id} className={cn("table-v20-row cursor-pointer hover:bg-background transition-colors border-b border-border table-v25-row-glow", o.notes ? "row-has-note" : "", selectedOrderIds.has(o.id) && "table-v20-row--selected")} onClick={() => setSelectedOrder(o)}>
                        <TableCell className="font-mono text-xs font-bold text-foreground"><span className="flex items-center gap-1.5">{o.notes || o.statusNotes ? <span className="notes-indicator" title="ملاحظات">!</span> : null}<span className="order-ref-copy-v24" title="انقر للنسخ" onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(o.reference); toast.success(`تم نسخ ${o.reference}`); }}>{o.reference}</span><span className={cn("priority-dot-inline", `priority-dot-inline-${getPriorityLevel(o.total)}`)} title={getPriorityLevel(o.total) === 'urgent' ? 'عاجل' : getPriorityLevel(o.total) === 'medium' ? 'متوسط' : 'عادي'} /></span></TableCell>
                        <TableCell className="text-xs"><span className="text-xs px-2 py-0.5 rounded-lg bg-muted text-muted-foreground">{o.shopName || "—"}</span></TableCell>
                        <TableCell className="text-sm text-foreground">{SERVICE_EMOJI[o.serviceType] || ""} {o.serviceName}</TableCell>
                        <TableCell className="text-sm"><div className="text-foreground">{o.customer.name}</div><div className="text-muted-foreground/70" dir="ltr">{o.customer.phone}</div></TableCell>
                        <TableCell className="text-sm font-bold text-foreground"><span className={cn("amount-cell", `amount-cell-${getPriorityLevel(o.total)}`)}>{formatDA(o.total)}</span></TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <span className={cn("text-xs px-2.5 py-1 rounded-lg status-chip-v4", `status-chip-v4-${o.status}`)}>{STATUS_META[o.status]?.label || o.status}</span>
                            {getNextStatus(o.status) && o.shopId && (
                              <button
                                className={`quick-advance-btn quick-advance-btn-${o.status}`}
                                onClick={(e) => handleQuickAdvance(e, o)}
                                title={`تقدم إلى: ${getNextStatusLabel(o.status)}`}
                              >
                                <ChevronLeft /><span className="hidden xl:inline">{getNextStatusLabel(o.status)}</span>
                              </button>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs"><span className={cn('order-age-v24', getAgeClass(o.createdAt))}>{getTimeAgo(o.createdAt)}</span></TableCell>
                        <TableCell className="text-sm text-muted-foreground/70">{formatDateTimeAr(o.createdAt)}</TableCell>
                        <TableCell className="w-10" onClick={(e) => e.stopPropagation()}>
                          {o.shopId && <QuickNotesInline order={o} onUpdate={handleUpdateNote} />}
                        </TableCell>
                        <TableCell className="w-10" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selectedOrderIds.has(o.id)}
                            onChange={() => toggleOrderSelection(o.id)}
                            className="rounded border-border cursor-pointer"
                            title="تحديد للإجراءات الجماعية"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {ordersLoading && filteredOrders.length === 0 ? (
                  <div className="orders-loading-v23 flex flex-col items-center justify-center py-16 text-muted-foreground text-sm">
                    <RefreshCw className="h-6 w-6 animate-spin text-violet-500 mb-3" />
                    <span>جارٍ تحميل الطلبات...</span>
                  </div>
                ) : filteredOrders.length === 0 && <EmptyOrdersMessage hasOrders={allOrders.length > 0} onClear={() => { setSearch(""); setStatusFilter("all"); setShopFilter("all"); setPriorityFilter("all"); }} />}
              </div>
              {/* بطاقات - جوال */}
              <div className="md:hidden space-y-3">
                {filteredOrders.slice(0, 50).map((o) => (
                  <div key={o.id} className={cn("cursor-pointer bg-card rounded-xl border border-border shadow-sm p-4 hover:shadow-[0_2px_8px_rgba(0,0,0,0.08)] transition-shadow border-r-[3px]", STATUS_BORDER_COLORS[o.status] || "")} onClick={() => setSelectedOrder(o)}>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="min-w-0"><div className="flex items-center gap-2"><span className="font-mono text-xs font-bold text-foreground">{o.reference}</span><span className="text-xs px-2 py-0.5 rounded-lg bg-muted text-muted-foreground">{o.shopName}</span></div><div className="text-xs text-muted-foreground/70 mt-1">{SERVICE_EMOJI[o.serviceType] || ""} {o.serviceName} · {o.customer.name}</div></div>
                      <div className="text-left shrink-0"><div className="text-sm font-bold text-foreground">{formatDA(o.total)}</div><span className={`text-xs px-2.5 py-1 rounded-lg ${STATUS_COLORS[o.status] || ""}`}>{STATUS_META[o.status]?.label || o.status}</span></div>
                    </div>
                    {getNextStatus(o.status) && o.shopId && (
                      <div className="flex justify-start mt-2">
                        <button
                          className={`quick-advance-btn quick-advance-btn-${o.status}`}
                          onClick={(e) => handleQuickAdvance(e, o)}
                        >
                          <ChevronLeft /> تقدم إلى {getNextStatusLabel(o.status)}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
                {ordersLoading && filteredOrders.length === 0 ? (
                  <div className="orders-loading-v23 flex flex-col items-center justify-center py-16 text-muted-foreground text-sm">
                    <RefreshCw className="h-6 w-6 animate-spin text-violet-500 mb-3" />
                    <span>جارٍ تحميل الطلبات...</span>
                  </div>
                ) : filteredOrders.length === 0 && <EmptyOrdersMessage hasOrders={allOrders.length > 0} onClear={() => { setSearch(""); setStatusFilter("all"); setShopFilter("all"); setPriorityFilter("all"); }} />}
              </div>
              </>
              )}
            </div>
          )}

          {/* تبويب كانبان (مباشر من الشريط الجانبي) */}
          {activeTab === "kanban" && (
            <div className="space-y-5">
              <StatsSummaryBar stats={stats} loading={loading} />
              {allOrders.length > 0 && <AgingAlerts orders={allOrders} onOrderClick={setSelectedOrder} />}
              <KanbanTab orders={allOrders} onStatusChange={handleStatusChange} onOrderClick={setSelectedOrder} shopFilter={shopFilter} />
            </div>
          )}

          {/* تبويب التقويم (مباشر من الشريط الجانبي) */}
          {activeTab === "calendar" && (
            <SB name="التقويم">
              <div className="space-y-5">
                <StatsSummaryBar stats={stats} loading={loading} />
                <CalendarTab orders={allOrders} onOrderClick={setSelectedOrder} shopFilter={shopFilter} />
              </div>
            </SB>
          )}

          {/* نافذة تفاصيل الطلب */}
          <OrderDetailDialog order={selectedOrder} onClose={() => setSelectedOrder(null)} onStatusChange={handleStatusChange} onDelete={handleDeleteOrder} />

          {/* v20: Bulk Actions Bar */}
          <AdminBulkActions selectedIds={selectedOrderIds} orders={allOrders} onClear={clearBulkSelection} onRefresh={() => loadAll(false)} />

          {/* تبويب المتاجر */}
          {activeTab === "shops" && (
            <div className="space-y-5">
              {allOrders.length > 0 && <ShopKpiCards orders={allOrders} onShopClick={(slug) => { setShopFilter(slug); setActiveTab('orders'); }} />}
              {allOrders.length > 0 && <ShopMiniCards orders={allOrders} />}
              <div className="flex items-center justify-between px-1">
                <div className="text-sm text-muted-foreground/70">{displayShopCount} متجر</div>
                <button onClick={() => setCreateOpen(true)} className="border border-border text-foreground hover:bg-accent rounded-lg px-4 py-2 text-sm font-medium transition-colors flex items-center gap-1.5"><Plus className="h-4 w-4" /> إنشاء متجر جديد</button>
              </div>
              <div className="relative"><Search className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/70" /><Input value={shopSearch} onChange={(e) => setShopSearch(e.target.value)} placeholder="ابحث في المتاجر بالاسم أو الرابط..." className="pr-10 text-sm h-10 rounded-lg focus:ring-ring focus:border-ring bg-background" /></div>
              {loading && independentShops.length === 0 ? (<div className="text-center py-16 text-muted-foreground/70 text-sm"><RefreshCw className="h-6 w-6 animate-spin mx-auto mb-3 text-violet-500" />جارٍ التحميل...</div>) : displayShops.length === 0 ? (
                <div className="bg-card rounded-xl border border-border shadow-sm"><div className="py-20 text-center"><div className="w-16 h-16 mx-auto rounded-2xl bg-background flex items-center justify-center mb-4"><Store className="h-8 w-8 text-muted-foreground/40" /></div><p className="font-semibold text-foreground mb-2">لا توجد متاجر بعد</p><p className="text-xs text-muted-foreground/70 mb-4">ابدأ بإنشاء متجرك الأول</p><button onClick={() => setCreateOpen(true)} className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium transition-colors inline-flex items-center gap-1.5"><Plus className="h-4 w-4" /> إنشاء متجر</button></div></div>
              ) : (
                <div className="space-y-4">
                  {displayShops.filter((shop) => { if (!shopSearch.trim()) return true; const q = shopSearch.toLowerCase(); return shop.name.toLowerCase().includes(q) || shop.slug.toLowerCase().includes(q); }).map((shop) => (<ShopManageCard key={shop.id} shop={shop} onCopyLink={copyLink} onCopyAdminLink={copyAdminLink} onRefresh={loadAll} />))}
                  {shopSearch.trim() && displayShops.filter((s) => { const q = shopSearch.toLowerCase(); return s.name.toLowerCase().includes(q) || s.slug.toLowerCase().includes(q); }).length === 0 && (<div className="text-center py-12 text-muted-foreground/70 text-sm">لا توجد متاجر تطابق البحث</div>)}
                </div>
              )}
            </div>
          )}

          {/* تبويب التحليلات */}
          {activeTab === "analytics" && (
            <div className="space-y-5">
              <StatsSummaryBar stats={stats} loading={loading} />
              <AnalyticsTab orders={allOrders} />
            </div>
          )}

          {/* تبويب التقارير المالية */}
          {activeTab === "reports" && <ReportsTab />}

          {activeTab === "platformSettings" && <PlatformSettingsTab />}
          {activeTab === "settings" && (
            <SB name="إعدادات محسّنة">
              <SettingsEnhanced
                platformName={platformName}
                platformLogo={platformLogo}
                onSave={async (data) => {
                  if (data.platformName !== platformName) setPlatformName(data.platformName);
                  if (data.platformLogo !== platformLogo) setPlatformLogo(data.platformLogo);
                  if (data.compactMode !== compactMode) setCompactMode(data.compactMode);
                  if (data.autoRefresh !== autoRefreshActive) setAutoRefreshActive(data.autoRefresh);
                  if (data.refreshInterval !== refreshInterval) setRefreshInterval(data.refreshInterval);
                  if (data.soundEnabled !== soundEnabled) setSoundEnabled(data.soundEnabled);
                  try { sessionStorage.setItem('admin_settings', JSON.stringify(data)); } catch {}
                }}
              />
            </SB>
          )}
          {activeTab === "security" && <SecurityTab />}
        </div>
        )}
      <CreateShopDialog open={createOpen} onClose={() => setCreateOpen(false)} onCreated={loadAll} />
      <ShopPerformanceDashboard shop={selectedShopDash} allOrders={allOrders} onClose={() => setSelectedShopDash(null)} />
      <QuickSearch orders={allOrders} onSelect={setSelectedOrder} onAdvancedSearch={(q) => { setSearch(q); setActiveTab('orders'); }} />
      {authenticated && !loading && (
        <QuickActionsToolbar
          onNavigate={(tab) => setActiveTab(tab)}
          onRefresh={() => loadAll(false)}
          onExport={exportToExcel}
          onCreateShop={() => setCreateOpen(true)}
          orderCount={allOrders.length}
        />
      )}
      {showShortcuts && <ShortcutsOverlay onClose={() => setShowShortcuts(false)} />}
      {authenticated && <AdminQuickOrderBtn onClick={() => setCreateOpen(true)} orderCount={effectiveStats?.statusCounts?.pending || 0} />}
      {authenticated && !loading && allOrders.length > 0 && (
        <QuickActionsPanel
          activeTab={activeTab}
          pendingCount={effectiveStats?.statusCounts?.pending || 0}
          onAction={(action) => {
            switch (action) {
              case 'create': case 'create-shop': setCreateOpen(true); break;
              case 'refresh': loadAll(false); break;
              case 'search': document.querySelector<HTMLInputElement>('[placeholder*="بحث"]')?.focus(); break;
              case 'export': exportToExcel(); break;
              case 'orders': setActiveTab('orders'); break;
              case 'kanban': setActiveTab('kanban'); break;
              case 'analytics': setActiveTab('analytics'); break;
              case 'reports': setActiveTab('reports'); break;
              case 'calendar': setActiveTab('calendar'); break;
            }
          }}
        />
      )}
      <OrderNotesPanel orders={allOrders} open={notesPanelOpen} onClose={() => setNotesPanelOpen(false)} />
    </div>
    </div>
  );
}

// ===== Production Error Boundary (wraps everything) =====
class ProductionErrorBoundary extends Component<{children: ReactNode}, {error: Error | null}> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ProductionErrorBoundary]', error.message, error.stack, info.componentStack);
  }
  render() {
    if (this.state.error) {
      return (
        <div className="fatal-error-v22" dir="rtl">
          <div className="fatal-error-v22__container">
            <div className="fatal-error-v22__icon-wrap">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            </div>
            <h2 className="fatal-error-v22__title">حدث خطأ غير متوقع</h2>
            <p className="fatal-error-v22__msg">{this.state.error.message}</p>
            <p className="fatal-error-v22__hint">يُرجى تحديث الصفحة والمحاولة مرة أخرى. إذا استمرت المشكلة، تواصل مع الدعم الفني.</p>
            <button className="fatal-error-v22__btn" onClick={() => { this.setState({error: null}); window.location.reload(); }}>
              <RefreshCw className="h-4 w-4" />
              تحديث الصفحة
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

/* Fallback OverviewTab — shows key stats when the full tab isn't available */
function OverviewTab({ stats, lastUpdated, adminName, orders }: any) {
  const s = stats || {};
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-border bg-card p-4"><div className="text-xs text-muted-foreground mb-1">إجمالي الطلبات</div><div className="text-2xl font-bold tabular-nums">{s.totalOrders || 0}</div></div>
        <div className="rounded-xl border border-border bg-card p-4"><div className="text-xs text-muted-foreground mb-1">الإيرادات</div><div className="text-2xl font-bold tabular-nums">{(s.totalRevenue || 0).toLocaleString()}</div><div className="text-xs text-muted-foreground">د.ج</div></div>
        <div className="rounded-xl border border-border bg-card p-4"><div className="text-xs text-muted-foreground mb-1">المتاجر</div><div className="text-2xl font-bold tabular-nums">{s.shopCount || 0}</div></div>
        <div className="rounded-xl border border-border bg-card p-4"><div className="text-xs text-muted-foreground mb-1">طلبات اليوم</div><div className="text-2xl font-bold tabular-nums">{s.todayOrders || 0}</div></div>
      </div>
      {s.statusCounts && <div className="flex flex-wrap gap-3">{Object.entries(s.statusCounts).map(([k, v]) => (<div key={k} className="rounded-lg border border-border bg-card px-3 py-2 text-sm"><span className="text-muted-foreground">{k}:</span> <span className="font-semibold">{v}</span></div>))}</div>}
    </div>
  );
}

export default function PageWithBoundary() {
  return (
    <ProductionErrorBoundary>
      <SuperAdminPage />
    </ProductionErrorBoundary>
  );
}

