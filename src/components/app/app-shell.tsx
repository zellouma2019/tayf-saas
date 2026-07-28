"use client";

import { Suspense, useCallback, useState, useMemo, useEffect } from "react";
import { useTheme } from "next-themes";
import { shopApi } from "@/lib/shop-api";
import { useShop } from "@/lib/shop-context";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import {
  LayoutGrid,
  Plus,
  Printer,
  MapPin,
  Phone,
  Mail,
  Clock,
  MessageCircle,
  RotateCcw,
  Search,
  ChevronUp,
  Info,
  Shield,
  Share2,
  History,
  FileText,
  BookOpen,
  Image as ImageIcon,
  Copy,
  CreditCard,
  Tag,
  Store,
  Calculator,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { NewOrderWizard } from "@/components/app/new-order-wizard";
import { RepeatOrder } from "@/components/app/repeat-order";
import { TrackOrder } from "@/components/app/track-order";
import { AdminPanel } from "@/components/app/admin-panel";
import { OrderHistory } from "@/components/app/order-history";
import { OrderSuccess } from "@/components/app/order-success";
import { AdminGate } from "@/components/app/admin-gate";
import { FloatingAssistant } from "@/components/app/floating-assistant";
import { PriceEstimator } from "@/components/app/price-estimator";
import { PageSkeleton } from "@/components/app/page-skeleton";
import { ThemeToggle } from "@/components/app/theme-toggle";
import { Intro } from "@/components/app/intro";
import { useAppStore } from "@/lib/store";
import type { PrintOrderLite } from "@/lib/order-types";
import { getCountry } from "@/lib/countries";
import { DEFAULT_SETTINGS, type AppSettings } from "@/lib/default-settings";
import { getTheme, type ShopTheme } from "@/lib/themes";

type View = "new" | "repeat" | "track" | "history" | "admin";

export interface CreatedOrder {
  id: string;
  reference: string;
  serviceName: string;
  total: number;
  status: string;
  estimatedHours: number;
}

export function AppShell() {
  const [footerOpen, setFooterOpen] = useState(false);
  const [showEstimator, setShowEstimator] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { shop, hasFeature } = useShop();
  // شعار المنصة
  const [platformLogoUrl, setPlatformLogoUrl] = useState("");
  const [platformLogoDarkUrl, setPlatformLogoDarkUrl] = useState("");
  useEffect(() => {
    fetch("/api/super-admin/platform-settings")
      .then((r) => r.json())
      .then((d) => {
        const s = d.settings || {};
        setPlatformLogoUrl(s.platformLogo || "");
        setPlatformLogoDarkUrl(s.platformLogoDark || "");
      })
      .catch(() => {});
  }, []);
  // تحليل إعدادات المتجر (services مأخوذة من shop.settings JSON)
  const shopServices = useMemo(() => {
    try {
      const raw = (shop?.settings as string) || "{}";
      const parsed = JSON.parse(raw);
      const services = parsed?.services;
      if (Array.isArray(services) && services.length > 0) return services;
    } catch {}
    return null;
  }, [shop?.settings]);

  const shopName = shop?.name || "طيف";
  const shopPhone = shop?.phone || "";
  const shopWhatsapp = shop?.whatsapp || shopPhone;
  const shopEmail = shop?.email || "";
  const shopAddress = shop?.address || "";
  const shopCountry = shop?.country || "DZ";

  // Parse shop settings for general customization
  const shopSettings = useMemo((): AppSettings["general"] => {
    try {
      const raw = (shop?.settings as string) || "{}";
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_SETTINGS.general, ...(parsed.general ?? {}) };
    } catch {
      return DEFAULT_SETTINGS.general;
    }
  }, [shop?.settings]);

  const countryData = getCountry(shopCountry);
  const displayBusinessName = shopSettings.businessName || shopName;
  const displayTagline = shopSettings.tagline || "";
  const whatsappBtnNumber = shopSettings.whatsappButtonNumber || shopWhatsapp;
  const isOrderTrackingEnabled = shopSettings.enableOrderTracking !== false;
  const welcomeMessage = shopSettings.welcomeMessage || "";

  // قالب المتجر اللوني — يتكيّف مع الوضع الداكن تلقائياً
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const theme: ShopTheme = useMemo(() => {
    const base = getTheme(shop?.themeId);
    if (!isDark) return base;
    // ===== Dark mode overrides =====
    // ألوان المتجر مصمّمة للوضع الفاتح (خلفية بيضاء + نص داكن).
    // في الوضع الداكن نُبدّل الخلفيات الفاتحة بسطوح داكنة والنصوص الداكنة بنصوص فاتحة،
    // مع الحفاظ على لون الـ accent المميّز لكل متجر.
    return {
      ...base,
      topBar: {
        bg: "#0e0e10",
        text: "#e8e4dc",
        accent: base.topBar.accent,
      },
      header: {
        bg: "#141416",
        text: "#e8e4dc",
        border: "rgba(255, 255, 255, 0.08)",
      },
      nav: {
        active: base.accent,
        activeText: "#0a0a0b",
        hover: "rgba(255, 255, 255, 0.05)",
      },
      footer: {
        bg: "#0a0a0b",
        text: "#a8a29e",
        border: "rgba(255, 255, 255, 0.06)",
        linkHover: base.accent,
      },
      fab: {
        bg: base.fab.bg,
        hover: base.fab.hover,
        icon: "#ffffff",
      },
      contentBg: "#0a0a0b",
      card: {
        border: "rgba(255, 255, 255, 0.08)",
        hoverBg: "rgba(255, 255, 255, 0.03)",
      },
      logoIconColor: base.accent,
    };
  }, [shop?.themeId, isDark]);
  // متغيرات CSS لكل ألوان القالب (تُحقن في الجذر)
  const themeStyle = useMemo(() => {
    const t = theme;
    return {
      "--shop-accent": t.accent,
      "--shop-topbar-bg": t.topBar.bg,
      "--shop-topbar-text": t.topBar.text,
      "--shop-topbar-accent": t.topBar.accent,
      "--shop-header-bg": t.header.bg,
      "--shop-header-text": t.header.text,
      "--shop-header-border": t.header.border,
      "--shop-nav-active": t.nav.active,
      "--shop-nav-active-text": t.nav.activeText,
      "--shop-nav-hover": t.nav.hover,
      "--shop-footer-bg": t.footer.bg,
      "--shop-footer-text": t.footer.text,
      "--shop-footer-border": t.footer.border,
      "--shop-fab-bg": t.fab.bg,
      "--shop-fab-hover": t.fab.hover,
      "--shop-fab-icon": t.fab.icon,
      "--shop-card-border": t.card.border,
      "--shop-logo-icon": t.logoIconColor,
    } as React.CSSProperties;
  }, [theme]);

  const formattedPhone = shopPhone ? shopPhone.replace(/(\d{2})(\d{3})(\d{2})(\d{3})/, "$1 $2 $3 $4") : "";
  const customerLink = typeof window !== "undefined" ? `${window.location.origin}${window.location.pathname}` : `/s/${shop?.slug || ""}`;

  // Track scroll for header shadow
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  const {

    view,
    setView,
    createdOrder,
    setCreatedOrder,
    prefillOrder,
    setPrefillOrder,
    adminUnlocked,
    setAdminUnlocked,
    adminGateOpen,
    setAdminGateOpen,
    adminCode,
    setAdminCode,
    refreshKey,
    incrementRefresh,
    showIntro,
    setShowIntro,
    showAdminLink,
  } = useAppStore();

  const handleCreated = useCallback((order: CreatedOrder) => {
    setCreatedOrder(order);
  }, [setCreatedOrder]);

  const handleRepeat = useCallback((order: PrintOrderLite | null) => {
    setPrefillOrder(order);
    setFooterOpen(false);
    setView("new");
  }, [setPrefillOrder, setView]);

  const handlePrefillConsumed = useCallback(() => {
    setPrefillOrder(null);
  }, [setPrefillOrder]);

  const handleNavClick = useCallback(
    (key: View) => {
      if (key === "admin" && !adminUnlocked) {
        setAdminGateOpen(true);
        return;
      }
      // إخفاء التذييل تلقائياً على الجوال عند بدء طلب جديد
      if (key === "new") {
        setFooterOpen(false);
      }
      setView(key);
    },
    [adminUnlocked, setAdminGateOpen, setView],
  );

  const handleAdminUnlock = useCallback(() => {
    setAdminUnlocked(true);
    setAdminGateOpen(false);
    setView("admin");
    // جلب كود الإدارة وتخزينه لإرساله مع طلبات API المحمية
    shopApi("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        const general = data.general;
        if (general?.adminCode) setAdminCode(general.adminCode);
      })
      .catch(() => {});
  }, [setAdminUnlocked, setAdminGateOpen, setView, setAdminCode]);

  const handleCloseOrderSuccess = useCallback(() => {
    setCreatedOrder(null);
    incrementRefresh();
  }, [setCreatedOrder, incrementRefresh]);

  const navItems: { key: View; label: string; shortLabel: string; icon: React.ComponentType<{ className?: string }>; desktopOnly?: boolean }[] = [
    { key: "new", label: "طلب جديد", shortLabel: "جديد", icon: Plus },
    { key: "repeat", label: "تكرار طلب", shortLabel: "تكرار", icon: RotateCcw },
    ...(isOrderTrackingEnabled ? [{ key: "track" as View, label: "تتبّع", shortLabel: "تتبّع", icon: Search }] : []),
    { key: "history", label: "سجل الطلبات", shortLabel: "سجل", icon: History, desktopOnly: true },
    ...(showAdminLink ? [{ key: "admin" as View, label: "الإدارة", shortLabel: "إدارة", icon: LayoutGrid }] : []),
  ];

  return (
    <>
    {showIntro && <Intro onFinish={() => setShowIntro(false)} />}
    <LayoutGroup>
      <div className="min-h-screen flex flex-col bg-background" dir="rtl" style={themeStyle}>
      {/* ===== الشريط العلوي المُلوَّن حسب ثيم المتجر ===== */}
      {view !== "new" && (
      <div
        className="backdrop-blur-sm border-b no-print"
        style={{
          backgroundColor: theme.topBar.bg,
          color: theme.topBar.text,
          borderBottomColor: theme.footer.border,
        }}
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-4 h-8 sm:h-9 flex items-center justify-between gap-2">
          {/* الجوال: معلومة واحدة واضحة */}
          <div className="flex sm:hidden items-center gap-1.5 text-xs min-w-0">
            <span className="shrink-0" style={{ color: theme.topBar.accent }}>⚡</span>
            <span className="truncate">اطلب خلال دقيقة</span>
          </div>
          {/* الحاسوب: كل المميزات */}
          <div className="hidden sm:flex items-center gap-4 md:gap-6 overflow-hidden text-xs">
            <span className="flex items-center gap-1.5 whitespace-nowrap">
              <span style={{ color: theme.topBar.accent }}>⚡</span>
              اطلب خلال دقيقة
            </span>
            <span className="hidden md:flex items-center gap-1.5 whitespace-nowrap">
              <span style={{ color: theme.topBar.accent }}>🕐</span>
              جاهز خلال ساعة
            </span>
            <span className="hidden lg:flex items-center gap-1.5 whitespace-nowrap">
              <span style={{ color: theme.topBar.accent }}>🔔</span>
              إشعار عند الجاهزية
            </span>
          </div>
          {shopPhone && (
          <a
            href={`tel:${shopPhone}`}
            className="flex items-center gap-1 transition-colors whitespace-nowrap shrink-0 text-xs sm:text-xs hover:opacity-80"
            style={{ color: theme.topBar.accent }}
          >
            <Phone className="h-3 w-3 shrink-0" />
            <span className="hidden sm:inline">{formattedPhone}</span>
            <span className="sm:hidden">اتصل بنا</span>
          </a>
          )}
        </div>
      </div>
      )}

      {/* ===== الترويسة الرئيسية المُصمَّمة حسب ثيم المتجر ===== */}
      <header
        className={`sticky top-0 z-40 no-print transition-all duration-300 ${
          scrolled ? "shadow-md" : "shadow-sm"
        }`}
        style={{
          backgroundColor: theme.header.bg,
          color: theme.header.text,
          borderBottomColor: theme.header.border,
        }}
      >
          {/* gradient accent line under header - enhanced */}
        <div
          className="h-[3px] w-full"
          style={{
            background: `linear-gradient(90deg, transparent 0%, ${theme.accent} 20%, ${theme.topBar.accent} 50%, ${theme.accent} 80%, transparent 100%)`,
            opacity: 0.9,
          }}
        />
        <div className="border-b" style={{ borderColor: theme.header.border }}>
          <div className="max-w-7xl mx-auto px-3 sm:px-4 h-16 md:h-20 flex items-center justify-between gap-2 sm:gap-3 overflow-hidden">
          {/* الشعار + اسم المتجر بتصميم محسَّن */}
          <button
            onClick={() => { setFooterOpen(false); setView("new"); }}
            className="flex items-center gap-2.5 sm:gap-3 min-w-0 group"
          >
            {/* إطار الشعار مع ظل وتوهج لوني */}
            <div className="relative shrink-0">
              {shop?.logoUrl ? (
                <img
                  src={shop.logoUrl}
                  alt={displayBusinessName}
                  className={`w-11 h-11 md:w-12 md:h-12 ${theme.logoStyle} object-cover ring-2 ring-offset-2 transition-all duration-300 group-hover:scale-105`}
                  style={{
                    // @ts-expect-error -- ring color via CSS var
                    "--tw-ring-color": theme.accent + "40",
                    // @ts-expect-error -- offset color
                    "--tw-ring-offset-color": theme.header.bg,
                  }}
                />
              ) : (
                <div
                  className={`w-11 h-11 md:w-12 md:h-12 ${theme.logoStyle} flex items-center justify-center ring-2 ring-offset-2 transition-all duration-300 group-hover:scale-105`}
                  style={{
                    backgroundColor: theme.accent + "15",
                    // @ts-expect-error -- ring color via CSS var
                    "--tw-ring-color": theme.accent + "40",
                    // @ts-expect-error -- offset color
                    "--tw-ring-offset-color": theme.header.bg,
                  }}
                >
                  <Printer
                    className="h-6 w-6 md:h-7 md:w-7"
                    style={{ color: theme.logoIconColor }}
                  />
                </div>
              )}
              {/* نقطة زخرفية صغيرة */}
              <span
                className="absolute -bottom-0.5 -left-0.5 w-2.5 h-2.5 rounded-full ring-2"
                style={{
                  backgroundColor: theme.accent,
                  // @ts-expect-error -- ring color
                  "--tw-ring-color": theme.header.bg,
                }}
              />
            </div>

            {/* اسم المتجر + السطر الفرعي */}
            <div className="flex flex-col items-start min-w-0 leading-tight">
              <span
                className="font-extrabold text-base md:text-lg tracking-tight truncate max-w-[45vw] sm:max-w-[280px] transition-all duration-300"
                style={{
                  color: theme.header.text,
                  fontFamily: "'Cairo', 'Tajawal', system-ui, sans-serif",
                }}
              >
                {displayBusinessName}
              </span>
              {displayTagline ? (
                <span
                  className="text-[10px] md:text-[11px] font-medium truncate max-w-[45vw] sm:max-w-[240px] mt-0.5"
                  style={{ color: theme.header.text, opacity: 0.6 }}
                >
                  {displayTagline}
                </span>
              ) : (
                <span
                  className="text-[10px] md:text-[11px] font-medium tracking-wide truncate mt-0.5"
                  style={{ color: theme.accent, opacity: 0.85 }}
                >
                  مطبعة رقمية · طباعة أونلاين
                </span>
              )}
            </div>
          </button>

          {/* التنقل - حاسوب (يستخدم ألوان الثيم) */}
          <nav
            className="hidden md:flex items-center gap-1 rounded-full p-1"
            style={{ backgroundColor: theme.nav.hover }}
          >
            {navItems.map((item) => {
              const isActive = view === item.key;
              return (
              <button
                key={item.key}
                onClick={() => handleNavClick(item.key)}
                className="relative flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors"
                style={{
                  color: isActive ? theme.nav.activeText : theme.header.text,
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.backgroundColor = theme.header.bg;
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                {isActive && (
                  <motion.div
                    layoutId="nav-active-desktop"
                    className="absolute inset-0 rounded-full shadow-sm"
                    style={{ backgroundColor: theme.nav.active, zIndex: -1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <item.icon className="h-4 w-4 relative z-10" />
                <span className="relative z-10">{item.label}</span>
                {item.key === "admin" && !adminUnlocked && (
                  <svg className="h-3 w-3 relative z-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: theme.accent }}><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                )}
              </button>
              );
            })}
          </nav>

          {/* الأزرار الجانبية: تبديل الثيم + زر الطلب السريع */}
          <div className="flex items-center gap-1.5 shrink-0">
            <ThemeToggle />
            <button
              onClick={() => handleNavClick("new")}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold transition-all duration-300 hover:scale-105 active:scale-95"
              style={{
                backgroundColor: theme.fab.bg,
                color: theme.fab.icon,
              }}
            >
              <Plus className="h-3.5 w-3.5" />
              <span>طلب سريع</span>
            </button>
          </div>
          </div>
        </div>
      </header>

      {/* ===== المحتوى ===== */}
      <main className="flex-1 flex flex-col pb-20 md:pb-0">
        <div className="flex-1 py-4 md:py-8">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 w-full">
            {/* Welcome message */}
            {welcomeMessage && view === "new" && (
              <div className="mb-4 p-3 rounded-xl bg-primary/5 border border-primary/20 text-sm text-primary text-center">
                {welcomeMessage}
              </div>
            )}
            <Suspense fallback={<PageSkeleton />}>
            <AnimatePresence mode="wait">
              {view === "new" && (
                <motion.div
                  key="view-new"
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                >
                  {/* خلفية نقطية متحركة */}
                  <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ backgroundImage: "radial-gradient(circle, var(--shop-accent) 0.6px, transparent 0.6px)", backgroundSize: "28px 28px", opacity: 0.08 }}>
                    <div className="absolute inset-0" style={{ backgroundImage: "linear-gradient(180deg, transparent 0%, var(--shop-accent)05 40%, var(--shop-accent)08 100%)" }} />
                  </div>

                  {/* شريط الثقة */}
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4 rounded-2xl overflow-hidden bg-gradient-to-l from-violet-500/8 via-indigo-500/5 to-sky-500/8 dark:from-violet-500/15 dark:via-indigo-500/10 dark:to-sky-500/15 border border-violet-200/50 dark:border-violet-700/30 p-3 sm:p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex -space-x-2 rtl:space-x-reverse shrink-0">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-400 to-indigo-500 ring-2 ring-background flex items-center justify-center text-[10px]">🖨️</div>
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 ring-2 ring-background flex items-center justify-center text-[10px]">📄</div>
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 ring-2 ring-background flex items-center justify-center text-[10px]">📸</div>
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs sm:text-sm font-medium text-foreground truncate">خدمة طباعة احترافية وسريعة</p>
                          <p className="text-[10px] sm:text-xs text-muted-foreground truncate">رفع ملفك واحصل على تسعيرة فورية ✓</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="hidden sm:flex items-center gap-1 text-[10px] text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>جاهز خلال ساعة</span>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="h-3 w-3" />
                          <span>موثوق</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                  <NewOrderWizard
                    onCreated={handleCreated}
                    prefillOrder={prefillOrder}
                    onPrefillConsumed={handlePrefillConsumed}
                  />
                </motion.div>
              )}
              {view === "repeat" && (
                <motion.div
                  key="view-repeat"
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                >
                  <RepeatOrder onRepeat={handleRepeat} />
                </motion.div>
              )}
              {view === "track" && (
                <motion.div
                  key="view-track"
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                >
                  <TrackOrder key={refreshKey} />
                </motion.div>
              )}
              {view === "history" && (
                <motion.div
                  key="view-history"
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                >
                  <OrderHistory />
                </motion.div>
              )}
              {view === "admin" && (
                <motion.div
                  key="view-admin"
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                >
                  <AdminPanel key={refreshKey} onRefresh={incrementRefresh} />
                </motion.div>
              )}
            </AnimatePresence>
            </Suspense>
          </div>
        </div>

        {/* شريط الإجراءات السريعة */}
        {view !== "admin" && (
        <div className="bg-gradient-to-t from-card via-card/95 to-transparent pt-3 pb-1 px-4 -mx-4">
          <div className="flex items-center gap-2 justify-center text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-violet-50 dark:bg-violet-950/30 text-violet-600 dark:text-violet-400">
              <span>⚡</span> اطلب خلال دقيقة
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400">
              <span>🕐</span> جاهز خلال ساعة
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400">
              <span>🔔</span> إشعار عند الجاهزية
            </span>
          </div>
        </div>
        )}

        {/* ===== التذييل (يختفي في قسم الإدارة) — يستخدم ألوان ثيم المتجر ===== */}
        {view !== "admin" && (
        <footer
          className="mt-auto no-print"
          style={{
            backgroundColor: theme.footer.bg,
            color: theme.footer.text,
            borderTopColor: theme.footer.border,
          }}
        >
          {/* خط فاصل متدرّج بلون الثيم */}
          <div
            className="h-[2px] w-full"
            style={{
              background: `linear-gradient(90deg, ${theme.accent}00 0%, ${theme.accent} 50%, ${theme.accent}00 100%)`,
              opacity: 0.5,
            }}
          />
          {/* زر الطي/الفتح - يظهر فقط على الجوال */}
          <button
            onClick={() => setFooterOpen(!footerOpen)}
            className="md:hidden w-full flex items-center justify-center gap-2 min-h-[44px] px-4 text-xs transition-colors border-b active:bg-black/20"
            style={{
              color: theme.footer.text,
              borderColor: theme.footer.border,
            }}
            aria-expanded={footerOpen}
            aria-label={footerOpen ? "إخفاء التفاصيل" : "عرض التفاصيل"}
          >
            <Info className="h-3.5 w-3.5" />
            <span className="font-medium">{footerOpen ? "إخفاء التفاصيل" : "عرض معلومات المطبعة"}</span>
            <motion.div
              animate={{ rotate: footerOpen ? 180 : 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <ChevronUp className="h-4 w-4" />
            </motion.div>
          </button>

          {/* محتوى التذييل: الحاسوب دائماً ظاهر، الجوال يتقلّب */}
          <div
            className="footer-collapse"
            style={
              footerOpen
                ? { maxHeight: "2000px" }
                : undefined
            }
          >
            <div className="max-w-7xl mx-auto px-4 py-10">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                  <div className="md:col-span-1">
                    <div className="flex items-center gap-2.5 mb-3">
                      <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
                        <Printer className="h-5 w-5 text-primary-foreground" />
                      </div>
                      <div>
                        <div className="font-bold text-white">{displayBusinessName}</div>
                        <div className="text-xs text-neutral-400">{displayTagline || "اطبع بسهولة"}</div>
                      </div>
                    </div>
                    <p className="text-xs text-neutral-400 leading-relaxed">
                      منصة طباعة احترافية لإنشاء الطلبات ومتابعتها بسهولة وسرعة.
                    </p>
                  </div>

                  <div>
                    <h4 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
                      <div className="w-1 h-4 rounded-full" style={{ backgroundColor: theme.accent }} />
                      روابط سريعة
                    </h4>
                    <ul className="space-y-2 text-xs">
                      <li>
                        <button onClick={() => { setFooterOpen(false); setView("new"); }} className="hover:text-primary transition-colors flex items-center gap-2 min-h-[44px] group">
                          <Plus className="h-3.5 w-3.5 text-neutral-500 group-hover:text-primary transition-colors" />
                          طلب طباعة جديد
                        </button>
                      </li>
                      <li>
                        <button onClick={() => setView("track")} className="hover:text-primary transition-colors flex items-center gap-2 min-h-[44px] group">
                          <Search className="h-3.5 w-3.5 text-neutral-500 group-hover:text-primary transition-colors" />
                          تتبّع طلب
                        </button>
                      </li>
                      {showAdminLink && (
                      <li>
                        <button onClick={() => handleNavClick("admin")} className="hover:text-primary transition-colors flex items-center gap-2 min-h-[44px] group">
                          <Shield className="h-3.5 w-3.5 text-neutral-500 group-hover:text-primary transition-colors" />
                          لوحة الإدارة
                        </button>
                      </li>
                      )}
                      <li>
                        <button onClick={() => setView("repeat")} className="hover:text-primary transition-colors flex items-center gap-2 min-h-[44px] group">
                          <RotateCcw className="h-3.5 w-3.5 text-neutral-500 group-hover:text-primary transition-colors" />
                          إعادة طلب سابق
                        </button>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
                      <div className="w-1 h-4 rounded-full" style={{ backgroundColor: theme.accent }} />
                      خدماتنا
                    </h4>
                    {shopServices ? (
                      <div className="grid grid-cols-2 gap-1.5">
                        {shopServices.map((s: { name: string; emoji?: string }, i: number) => (
                          <div
                            key={i}
                            className="flex items-center gap-1.5 text-xs text-neutral-400 px-2 py-1.5 rounded-lg hover:bg-neutral-800/60 hover:text-primary transition-all duration-300 cursor-default hover:shadow-[0_0_12px_rgba(245,158,11,0.2)] hover:-translate-y-0.5"
                          >
                            <span className="shrink-0">{s.emoji || "🖨️"}</span>
                            <span className="truncate">{s.name}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-1.5">
                        {[{e:"🖨️",n:"طباعة مستند"},{e:"📄",n:"نسخ مستندات"},{e:"🖼️",n:"طباعة صور"},{e:"📚",n:"تجليد"},{e:"🪪",n:"بطاقات"},{e:"📜",n:"ملصقات"}].map((s) => (
                          <div key={s.n} className="flex items-center gap-1.5 text-xs text-neutral-400 px-2 py-1.5 rounded-lg hover:bg-neutral-800/60 hover:text-primary hover:shadow-[0_0_12px_rgba(245,158,11,0.2)] hover:-translate-y-0.5 transition-all duration-300 cursor-default">
                            <span className="shrink-0">{s.e}</span>
                            <span className="truncate">{s.n}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <h4 className="text-white font-semibold text-sm mb-3">تواصل معنا</h4>
                    <ul className="space-y-3 text-xs">
                      {shopAddress && (
                      <li className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        <span>{shopAddress}</span>
                      </li>
                      )}
                      {formattedPhone && (
                      <li className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-primary" />
                        <span>{formattedPhone}</span>
                      </li>
                      )}
                      {whatsappBtnNumber && (
                      <li className="flex items-center gap-2">
                        <MessageCircle className="h-4 w-4 text-primary" />
                        <a href={`https://wa.me/${whatsappBtnNumber.replace(/[^0-9]/g, "")}`} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">واتساب</a>
                      </li>
                      )}
                      {shopEmail && (
                      <li className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-primary" />
                        <a href={`mailto:${shopEmail}`} className="hover:text-primary transition-colors">{shopEmail}</a>
                      </li>
                      )}
                      <li className="flex items-start gap-2 pt-2 border-t border-neutral-700">
                        <Clock className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        <div>
                          <div>السبت - الخميس: 8:00 ص — 8:00 م</div>
                          <div className="text-neutral-500">الجمعة: مغلق</div>
                        </div>
                      </li>
                      {/* أيقونات التواصل الاجتماعي */}
                      <li className="flex items-center gap-2 pt-2 border-t border-neutral-700">
                        <Share2 className="h-4 w-4 text-primary shrink-0" />
                        <div className="flex items-center gap-2">
                          {whatsappBtnNumber && (
                            <a
                              href={`https://wa.me/${whatsappBtnNumber.replace(/[^0-9]/g, "")}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-8 h-8 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 flex items-center justify-center transition-colors"
                              title="واتساب"
                            >
                              <MessageCircle className="h-4 w-4 text-emerald-400" />
                            </a>
                          )}
                          {shopPhone && (
                            <a
                              href={`tel:${shopPhone}`}
                              className="w-8 h-8 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 flex items-center justify-center transition-colors"
                              title="اتصل"
                            >
                              <Phone className="h-4 w-4 text-sky-400" />
                            </a>
                          )}
                          {shopEmail && (
                            <a
                              href={`mailto:${shopEmail}`}
                              className="w-8 h-8 rounded-lg bg-violet-500/10 hover:bg-violet-500/20 flex items-center justify-center transition-colors"
                              title="بريد إلكتروني"
                            >
                              <Mail className="h-4 w-4 text-violet-400" />
                            </a>
                          )}
                          <button
                            onClick={() => { navigator.clipboard.writeText(customerLink); toast.success("تم نسخ رابط المتجر!"); }}
                            className="w-8 h-8 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 flex items-center justify-center transition-colors"
                            title="نسخ رابط المتجر"
                          >
                            <Copy className="h-4 w-4 text-amber-400" />
                          </button>
                        </div>
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-neutral-800 text-center text-xs text-neutral-500">
                  © {new Date().getFullYear()} {displayBusinessName} — جميع الحقوق محفوظة
                  <div className="mt-2 flex items-center justify-center gap-2">
                    <span className="text-neutral-600">يعمل بفضل</span>
                    <a href="/" className="inline-flex items-center gap-1 text-gold-400 hover:text-gold-300 transition-colors font-medium">
                      {platformLogoUrl ? (<img src={platformLogoUrl} alt="طيف" className="w-4 h-4 inline dark:hidden" />) : (<img src="/tayf-logo-sm.png" alt="طيف" className="w-4 h-4 inline dark:hidden" />)}{platformLogoDarkUrl || platformLogoUrl ? (<img src={platformLogoDarkUrl || platformLogoUrl} alt="طيف" className="w-4 h-4 inline hidden dark:block" />) : (<img src="/tayf-logo-sm-dark.png" alt="طيف" className="w-4 h-4 inline hidden dark:block" />)}
                      طيف
                    </a>
                  </div>
                </div>
            </div>
          </div>
        </footer>
        )}
      </main>

      {/* نافذة نجاح الطلب */}
      <OrderSuccess
        order={createdOrder}
        open={!!createdOrder}
        onClose={handleCloseOrderSuccess}
        onNavigate={(v) => { if (v === "new") setFooterOpen(false); setView(v); }}
      />

      {/* بوابة كود الإدارة */}
      <AdminGate
        open={adminGateOpen}
        onClose={() => setAdminGateOpen(false)}
        onSuccess={handleAdminUnlock}
      />

      {/* حاسبة الأسعار */}
      <button
        onClick={() => setShowEstimator(!showEstimator)}
        className="fixed bottom-24 left-4 z-30 w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center justify-center"
        title="حاسبة الأسعار"
      >
        <Calculator className="h-5 w-5" />
      </button>
      {showEstimator && (
        <div className="fixed bottom-40 left-4 z-30 w-80 sm:w-96">
          <PriceEstimator onRequestOrder={() => { setShowEstimator(false); setView("new"); }} />
        </div>
      )}

      {/* الزر العائم: واتساب + مساعد ذكي */}
      <FloatingAssistant onRepeatOrder={() => setView("repeat")} />

      {/* ===== شريط التنقل السفلي للجوال (ثيم المتجر) ===== */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 no-print border-t backdrop-blur-lg"
        style={{
          backgroundColor: theme.header.bg + "f5",
          borderColor: theme.header.border,
        }}
      >
        <div className="flex items-center justify-around px-1 py-1.5 safe-area-pb">
          {navItems.filter((item) => !item.desktopOnly).map((item) => {
            const isActive = view === item.key;
            return (
              <button
                key={item.key}
                onClick={() => handleNavClick(item.key)}
                className="relative flex flex-col items-center justify-center gap-0.5 px-2 py-1 rounded-lg min-w-[56px] transition-all"
                style={{ color: isActive ? theme.accent : theme.header.text }}
                aria-label={item.label}
              >
                <div
                  className="relative flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-300"
                  style={{
                    backgroundColor: isActive ? theme.accent + "20" : "transparent",
                  }}
                >
                  <item.icon
                    className="h-5 w-5 transition-transform"
                    style={{
                      transform: isActive ? "scale(1.1)" : "scale(1)",
                    }}
                  />
                  {item.key === "admin" && !adminUnlocked && (
                    <span
                      className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full"
                      style={{ backgroundColor: theme.accent }}
                    />
                  )}
                </div>
                <span
                  className="text-[10px] font-medium leading-none"
                  style={{ opacity: isActive ? 1 : 0.7 }}
                >
                  {item.shortLabel}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      </div>
    </LayoutGroup>
    </>
  );
}