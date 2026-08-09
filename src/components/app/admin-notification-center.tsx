"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Bell,
  X,
  ShoppingCart,
  CheckCircle2,
  AlertTriangle,
  Store,
  Settings2,
  EyeOff,
  Eye,
  Check,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type NotificationCategory = "order" | "shop" | "system";
type FilterTab = "all" | "order" | "shop" | "system";

interface AdminNotification {
  id: string;
  type: "new_order" | "order_completed" | "order_cancelled" | "new_shop" | "system_update";
  title: string;
  description: string;
  timestamp: string;
  unread: boolean;
  category: NotificationCategory;
}

interface AdminNotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

/* ------------------------------------------------------------------ */
/*  Config maps                                                        */
/* ------------------------------------------------------------------ */

const TYPE_CONFIG: Record<
  AdminNotification["type"],
  {
    icon: typeof ShoppingCart;
    label: string;
    emoji: string;
    badgeClass: string;
    dotColor: string;
    iconBg: string;
    iconColor: string;
  }
> = {
  new_order: {
    icon: ShoppingCart,
    label: "طلب جديد",
    emoji: "🛒",
    badgeClass: "badge-gradient-emerald",
    dotColor: "bg-emerald-500",
    iconBg: "bg-emerald-500/10 dark:bg-emerald-500/15",
    iconColor: "text-emerald-600 dark:text-emerald-400",
  },
  order_completed: {
    icon: CheckCircle2,
    label: "طلب مكتمل",
    emoji: "✅",
    badgeClass: "badge-gradient-violet",
    dotColor: "bg-violet-500",
    iconBg: "bg-violet-500/10 dark:bg-violet-500/15",
    iconColor: "text-violet-600 dark:text-violet-400",
  },
  order_cancelled: {
    icon: AlertTriangle,
    label: "طلب ملغى",
    emoji: "⚠️",
    badgeClass: "badge-gradient-rose",
    dotColor: "bg-rose-500",
    iconBg: "bg-rose-500/10 dark:bg-rose-500/15",
    iconColor: "text-rose-600 dark:text-rose-400",
  },
  new_shop: {
    icon: Store,
    label: "متجر جديد",
    emoji: "🏪",
    badgeClass: "badge-gradient-sky",
    dotColor: "bg-sky-500",
    iconBg: "bg-sky-500/10 dark:bg-sky-500/15",
    iconColor: "text-sky-600 dark:text-sky-400",
  },
  system_update: {
    icon: Settings2,
    label: "تحديث النظام",
    emoji: "🔔",
    badgeClass: "badge-gradient-amber",
    dotColor: "bg-amber-500",
    iconBg: "bg-amber-500/10 dark:bg-amber-500/15",
    iconColor: "text-amber-600 dark:text-amber-400",
  },
};

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: "all", label: "الكل" },
  { key: "order", label: "طلبات" },
  { key: "shop", label: "متاجر" },
  { key: "system", label: "نظام" },
];

/* ------------------------------------------------------------------ */
/*  Mock data                                                          */
/* ------------------------------------------------------------------ */

const INITIAL_NOTIFICATIONS: AdminNotification[] = [
  {
    id: "1",
    type: "new_order",
    title: "طلب جديد من متجر الأفق",
    description: "تم استلام طلب طباعة منشورات A3 — ٥٠ نسخة",
    timestamp: "منذ ٥ دقائق",
    unread: true,
    category: "order",
  },
  {
    id: "2",
    type: "new_order",
    title: "طلب جديد من مطبعة النور",
    description: "طلب بطاقات عمل — ٢٠٠ نسخة بلمسة مطفأة",
    timestamp: "منذ ١٠ دقائق",
    unread: true,
    category: "order",
  },
  {
    id: "3",
    type: "order_completed",
    title: "اكتمل طلب #١٢٣٤",
    description: "تم إتمام طباعة كتيب الشركة ووضعه جاهز للتسليم",
    timestamp: "منذ ٢٥ دقيقة",
    unread: true,
    category: "order",
  },
  {
    id: "4",
    type: "order_cancelled",
    title: "تم إلغاء طلب #١٢٣٠",
    description: "ألغى العميل الطلب بسبب تغيير المواصفات المطلوبة",
    timestamp: "منذ ٤٠ دقيقة",
    unread: true,
    category: "order",
  },
  {
    id: "5",
    type: "new_shop",
    title: "تسجيل متجر جديد: طباعة الإبداع",
    description: "تم تسجيل متجر جديد في المنطقة الشرقية وينتظر المراجعة",
    timestamp: "منذ ساعة",
    unread: true,
    category: "shop",
  },
  {
    id: "6",
    type: "system_update",
    title: "تحديث النظام v2.4.1",
    description: "تم تحديث المنصة بنجاح مع تحسينات في سرعة التحميل",
    timestamp: "منذ ساعة",
    unread: false,
    category: "system",
  },
  {
    id: "7",
    type: "order_completed",
    title: "اكتمل طلب #١٢٢٨",
    description: "تم طباعة واستلام طلب فلاتر صور للعميل أحمد",
    timestamp: "اليوم 10:30",
    unread: false,
    category: "order",
  },
  {
    id: "8",
    type: "new_shop",
    title: "تسجيل متجر جديد: مركز الطباعة الفاخرة",
    description: "انضم متجر جديد وتم تفعيل الحساب تلقائياً",
    timestamp: "اليوم 09:15",
    unread: false,
    category: "shop",
  },
  {
    id: "9",
    type: "system_update",
    title: "صيانة مجدولة غداً",
    description: "ستتم صيانة الخوادم يوم غد الساعة ٢ صباحاً — تستغرق ٣٠ دقيقة",
    timestamp: "أمس 11:45",
    unread: false,
    category: "system",
  },
  {
    id: "10",
    type: "new_order",
    title: "طلب جديد من متجر الريادة",
    description: "طلب طباعة ورق رسمي A4 — ١٠٠٠ ورقة باللونين",
    timestamp: "أمس 09:20",
    unread: false,
    category: "order",
  },
  {
    id: "11",
    type: "order_cancelled",
    title: "تم إلغاء طلب #١٢١٥",
    description: "إلغاء تلقائي بسبب عدم الدفع خلال ٢٤ ساعة",
    timestamp: "منذ يومين",
    unread: false,
    category: "order",
  },
  {
    id: "12",
    type: "system_update",
    title: "تحديث سياسة الخصوصية",
    description: "تم تحديث شروط الخصوصية — يرجى مراجعة التغييرات",
    timestamp: "منذ ٣ أيام",
    unread: false,
    category: "system",
  },
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function AdminNotificationCenter({
  isOpen,
  onClose,
}: AdminNotificationCenterProps) {
  const [notifications, setNotifications] = useState<AdminNotification[]>(INITIAL_NOTIFICATIONS);
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [loading, setLoading] = useState(false);

  /* Derived state */
  const unreadCount = useMemo(
    () => notifications.filter((n) => n.unread).length,
    [notifications]
  );

  const filteredNotifications = useMemo(() => {
    if (activeTab === "all") return notifications;
    return notifications.filter((n) => n.category === activeTab);
  }, [notifications, activeTab]);

  const tabCounts = useMemo(() => {
    const all = notifications.length;
    const orders = notifications.filter((n) => n.category === "order").length;
    const shops = notifications.filter((n) => n.category === "shop").length;
    const system = notifications.filter((n) => n.category === "system").length;
    return { all, orders, shops, system };
  }, [notifications]);

  /* Close on Escape */
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  /* Lock body scroll when open */
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  /* Handlers */
  const toggleRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, unread: !n.unread } : n))
    );
  }, []);

  const markAllRead = useCallback(() => {
    setLoading(true);
    setTimeout(() => {
      setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
      setLoading(false);
      toast.success("تم تحديد جميع الإشعارات كمقروء");
    }, 400);
  }, []);

  if (!isOpen) return null;

  return (
    <>
      {/* ---------- Backdrop ---------- */}
      <div
        className="fixed inset-0 z-50 overlay-blur bg-black/30 dark:bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* ---------- Panel (RTL: slides from right) ---------- */}
      <aside
        className={
          "fixed top-0 right-0 bottom-0 z-50 w-full sm:w-[420px] max-w-[92vw] " +
          "bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl " +
          "border-l border-slate-200/60 dark:border-slate-700/40 " +
          "shadow-2xl shadow-black/10 dark:shadow-black/40 " +
          "flex flex-col toast-slide-in"
        }
        dir="rtl"
      >
        {/* ====== Header ====== */}
        <header className="flex items-center justify-between px-5 py-4 border-b border-slate-200/60 dark:border-slate-700/40">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Bell className="h-5 w-5 text-slate-700 dark:text-slate-200" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center px-1">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </div>
            <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">
              مركز الإشعارات
            </h2>
            {unreadCount > 0 && (
              <Badge className="badge-gradient-violet text-[10px] px-2 py-0.5 rounded-full border-0 font-semibold">
                {unreadCount}
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllRead}
                disabled={loading}
                className="text-[11px] text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 gap-1.5 h-8 px-2.5"
              >
                {loading ? (
                  <span className="shimmer-line inline-block w-14 h-3.5 rounded" />
                ) : (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    تحديد الكل كمقروء
                  </>
                )}
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </header>

        {/* ====== Filter Tabs ====== */}
        <nav className="flex items-center gap-2 px-5 py-3 border-b border-slate-100 dark:border-slate-800/60">
          {FILTER_TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            const count =
              tab.key === "all"
                ? tabCounts.all
                : tab.key === "order"
                ? tabCounts.orders
                : tab.key === "shop"
                ? tabCounts.shops
                : tabCounts.system;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "tag-chip press-scale text-xs transition-all",
                  isActive
                    ? "bg-primary text-primary-foreground border-primary/30 shadow-sm"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                )}
              >
                {tab.label}
                <span
                  className={cn(
                    "mr-1 text-[10px] font-semibold",
                    isActive
                      ? "text-primary-foreground/80"
                      : "text-slate-400 dark:text-slate-500"
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </nav>

        {/* ====== Notification List ====== */}
        <div className="flex-1 overflow-y-auto scrollbar-custom px-3 py-2">
          {filteredNotifications.length === 0 ? (
            <div className="fade-scale-in flex flex-col items-center justify-center py-16 text-slate-400 dark:text-slate-500">
              <Filter className="h-10 w-10 mb-3 opacity-30" />
              <p className="text-sm">لا توجد إشعارات في هذا التصنيف</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {filteredNotifications.map((notification, index) => {
                const config = TYPE_CONFIG[notification.type];
                const Icon = config.icon;
                return (
                  <div
                    key={notification.id}
                    className={cn(
                      "card-border-glow slide-in-bottom rounded-xl p-3.5 transition-all cursor-pointer",
                      "hover:bg-slate-50/80 dark:hover:bg-slate-800/40",
                      notification.unread
                        ? "bg-emerald-50/30 dark:bg-emerald-950/10 border border-emerald-200/40 dark:border-emerald-800/20"
                        : "bg-white/50 dark:bg-slate-900/30 border border-transparent"
                    )}
                    style={{
                      animationDelay: `${index * 40}ms`,
                      animationFillMode: "both",
                    }}
                    onClick={() => toggleRead(notification.id)}
                  >
                    <div className="flex items-start gap-3">
                      {/* Type icon circle */}
                      <div
                        className={cn(
                          "shrink-0 w-9 h-9 rounded-full flex items-center justify-center",
                          config.iconBg
                        )}
                      >
                        <Icon className={cn("h-4 w-4", config.iconColor)} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h4
                            className={cn(
                              "text-[13px] leading-snug truncate",
                              notification.unread
                                ? "font-bold text-slate-800 dark:text-slate-100"
                                : "font-medium text-slate-600 dark:text-slate-300"
                            )}
                          >
                            {notification.title}
                          </h4>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {/* Unread dot */}
                            {notification.unread && (
                              <span
                                className={cn(
                                  "w-2 h-2 rounded-full shrink-0",
                                  config.dotColor
                                )}
                              />
                            )}
                            {/* Read/Unread toggle icon */}
                            <button
                              className={cn(
                                "press-scale p-1 rounded-md transition-colors",
                                "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                              )}
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleRead(notification.id);
                                toast.success(
                                  notification.unread
                                    ? "تم تحديد الإشعار كمقروء"
                                    : "تم تحديد الإشعار كغير مقروء"
                                );
                              }}
                              aria-label={
                                notification.unread
                                  ? "تحديد كمقروء"
                                  : "تحديد كغير مقروء"
                              }
                            >
                              {notification.unread ? (
                                <EyeOff className="h-3.5 w-3.5" />
                              ) : (
                                <Eye className="h-3.5 w-3.5" />
                              )}
                            </button>
                          </div>
                        </div>

                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed mt-0.5 line-clamp-2">
                          {notification.description}
                        </p>

                        <div className="flex items-center justify-between mt-2">
                          <span className="text-[10px] text-slate-400 dark:text-slate-500">
                            {notification.timestamp}
                          </span>
                          <Badge
                            className={cn(
                              config.badgeClass,
                              "text-[9px] px-2 py-0 rounded-full border-0 font-medium"
                            )}
                          >
                            {config.label}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ====== Footer / section-divider ====== */}
        <div className="section-divider" />
        <footer className="px-5 py-3 border-t border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/30">
          <p className="text-[10px] text-slate-400 dark:text-slate-500 text-center">
            {unreadCount > 0
              ? `لديك ${unreadCount} إشعار${unreadCount > 2 ? "ات" : unreadCount === 2 ? "ان" : ""} غير مقروء${unreadCount > 2 ? "ة" : unreadCount === 2 ? "" : ""}`
              : "جميع الإشعارات مقروءة ✓"}
          </p>
        </footer>
      </aside>
    </>
  );
}
