"use client";

import dynamic from "next/dynamic";
import { Suspense, useCallback, useState, useMemo, useEffect } from "react";
import { shopApi } from "@/lib/shop-api";
import { useShop } from "@/lib/shop-context";
import { useTheme } from "next-themes";
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
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { AdminGate } from "@/components/app/admin-gate";
import { PageSkeleton } from "@/components/app/page-skeleton";
import { ThemeToggle } from "@/components/app/theme-toggle";
import { Intro } from "@/components/app/intro";
import { useAppStore } from "@/lib/store";
import type { PrintOrderLite } from "@/lib/order-types";
import { getCountry } from "@/lib/countries";
import { DEFAULT_SETTINGS, type AppSettings } from "@/lib/default-settings";
import { getTheme } from "@/lib/themes";

// Dynamic imports for heavy components (lazy loaded on demand)
const NewOrderWizard = dynamic(() => import("@/components/app/new-order-wizard").then(m => ({ default: m.NewOrderWizard })), {
  loading: () => <PageSkeleton />,
  ssr: false,
});

const RepeatOrder = dynamic(() => import("@/components/app/repeat-order").then(m => ({ default: m.RepeatOrder })), {
  loading: () => <PageSkeleton />,
  ssr: false,
});

const TrackOrder = dynamic(() => import("@/components/app/track-order").then(m => ({ default: m.TrackOrder })), {
  loading: () => <PageSkeleton />,
  ssr: false,
});

const AdminPanel = dynamic(() => import("@/components/app/admin-panel").then(m => ({ default: m.AdminPanel })), {
  loading: () => <PageSkeleton />,
  ssr: false,
});

const OrderHistory = dynamic(() => import("@/components/app/order-history").then(m => ({ default: m.OrderHistory })), {
  loading: () => <PageSkeleton />,
  ssr: false,
});

const OrderSuccess = dynamic(() => import("@/components/app/order-success").then(m => ({ default: m.OrderSuccess })), {
  ssr: false,
});

const FloatingAssistant = dynamic(() => import("@/components/app/floating-assistant").then(m => ({ default: m.FloatingAssistant })), {
  ssr: false,
});

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
  const [scrolled, setScrolled] = useState(false);
  const { shop, hasFeature } = useShop();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  // تحميل القالب اللوني مع تجاوز primaryColor إن وُجد
  const baseTheme = getTheme(shop?.themeId);
  const shopTheme = useMemo(() => {
    if (shop?.primaryColor) {
      return { ...baseTheme, accent: shop.primaryColor, footerIcon: shop.primaryColor };
    }
    return baseTheme;
  }, [baseTheme, shop?.primaryColor]);
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
  const shopLogoUrl = shop?.logoUrl || null;
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

  // Parse full settings (including intro) for components that need it
  const shopSettingsParsed = useMemo((): AppSettings | null => {
    try {
      const raw = (shop?.settings as string) || "{}";
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }, [shop?.settings]);

  const countryData = getCountry(shopCountry);
  const displayBusinessName = shopSettings.businessName || shopName;
  const displayTagline = shopSettings.tagline || "";
  const whatsappBtnNumber = shopSettings.whatsappButtonNumber || shopWhatsapp;
  const isOrderTrackingEnabled = shopSettings.enableOrderTracking !== false;
  const welcomeMessage = shopSettings.welcomeMessage || "";

  const formattedPhone = shopPhone ? shopPhone.replace(/(\d{2})(\d{3})(\d{2})(\d{2})/, "$1 $2 $3 $4") : "";

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
    {showIntro && <Intro onFinish={() => setShowIntro(false)} introSettings={shopSettingsParsed?.intro ?? null} />}
      <div
        className="min-h-screen flex flex-col"
        style={{
          backgroundColor: isDark ? '#0f172a' : shopTheme.contentBg,
          '--shop-accent': shopTheme.accent,
          '--shop-footer-hover': shopTheme.footer.linkHover,
          '--shop-footer-border': shopTheme.footer.border,
          '--shop-footer-icon': shopTheme.footerIcon,
          '--foreground': isDark ? 'oklch(0.92 0.005 60)' : 'oklch(0.18 0.01 60)',
          '--muted-foreground': isDark ? 'oklch(0.6 0.015 60)' : 'oklch(0.5 0.015 60)',
          '--background': isDark ? 'oklch(0.15 0.01 250)' : 'oklch(0.985 0.008 85)',
          '--card': isDark ? 'oklch(0.2 0.01 250)' : 'oklch(1 0 0)',
          '--card-foreground': isDark ? 'oklch(0.92 0.005 60)' : 'oklch(0.18 0.01 60)',
          '--popover': isDark ? 'oklch(0.2 0.01 250)' : 'oklch(1 0 0)',
          '--popover-foreground': isDark ? 'oklch(0.92 0.005 60)' : 'oklch(0.18 0.01 60)',
          '--muted': isDark ? 'oklch(0.25 0.01 250)' : 'oklch(0.96 0.008 85)',
          '--border': isDark ? 'oklch(0.3 0.01 250)' : 'oklch(0.91 0.005 85)',
          '--input': isDark ? 'oklch(0.3 0.01 250)' : 'oklch(0.91 0.005 85)',
          '--ring': shopTheme.accent,
          '--accent': isDark ? 'oklch(0.25 0.01 250)' : 'oklch(0.96 0.008 85)',
          '--accent-foreground': isDark ? 'oklch(0.92 0.005 60)' : 'oklch(0.18 0.01 60)',
          '--secondary': isDark ? 'oklch(0.25 0.01 250)' : 'oklch(0.96 0.008 85)',
          '--secondary-foreground': isDark ? 'oklch(0.85 0.01 60)' : 'oklch(0.25 0.03 60)',
          '--destructive': 'oklch(0.65 0.2 22)',
        } as React.CSSProperties}
        dir="rtl"
      >
      {/* ===== الشريط العلوي الأسود ===== */}
      {view !== "new" && (
      <div style={{ backgroundColor: shopTheme.topBar.bg, color: shopTheme.topBar.text }}>
        <div className="max-w-7xl mx-auto px-3 sm:px-4 h-8 sm:h-9 flex items-center justify-between gap-2">
          {/* الجوال: معلومة واحدة واضحة */}
          <div className="flex sm:hidden items-center gap-1.5 text-xs min-w-0">
            <span style={{ color: shopTheme.topBar.accent }} className="shrink-0">⚡</span>
            <span className="truncate">اطلب خلال دقيقة</span>
          </div>
          {/* الحاسوب: كل المميزات */}
          <div className="hidden sm:flex items-center gap-4 md:gap-6 overflow-hidden text-xs">
            <span className="flex items-center gap-1.5 whitespace-nowrap">
              <span style={{ color: shopTheme.topBar.accent }}>⚡</span>
              اطلب خلال دقيقة
            </span>
            <span className="hidden md:flex items-center gap-1.5 whitespace-nowrap">
              <span style={{ color: shopTheme.topBar.accent }}>🕐</span>
              جاهز خلال ساعة
            </span>
            <span className="hidden lg:flex items-center gap-1.5 whitespace-nowrap">
              <span style={{ color: shopTheme.topBar.accent }}>🔔</span>
              إشعار عند الجاهزية
            </span>
          </div>
          {shopPhone && (
          <a
            href={`tel:${shopPhone}`}
            className="flex items-center gap-1 hover:text-white transition-colors whitespace-nowrap shrink-0 text-xs sm:text-xs"
          >
            <Phone className="h-3 w-3 shrink-0" />
            <span className="hidden sm:inline">{formattedPhone}</span>
            <span className="sm:hidden">اتصل بنا</span>
          </a>
          )}
        </div>
      </div>
      )}

      {/* ===== الترويسة الرئيسية ===== */}
      <header
        className={`border-b sticky top-0 z-40 no-print transition-shadow duration-300 after:content-[''] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-[var(--shop-accent)] ${scrolled ? 'shadow-sm' : ''}`}
        style={{ backgroundColor: shopTheme.header.bg, borderColor: shopTheme.header.border }}
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-4 h-14 md:h-16 flex items-center justify-between gap-2">
          {/* الشعار */}
          <button
            onClick={() => { setFooterOpen(false); setView("new"); }}
            className="flex items-center gap-2 sm:gap-2.5 shrink-0 min-w-0"
          >
            {shopLogoUrl ? (
              <img src={shopLogoUrl} alt={displayBusinessName} className="w-9 h-9 md:w-10 md:h-10 rounded-xl shrink-0 object-cover ring-2 ring-transparent hover:ring-[var(--shop-accent)] transition-all duration-300" />
            ) : (
                <img src="/tayf-logo-sm.png" alt={displayBusinessName} className="w-9 h-9 md:w-10 md:h-10 rounded-xl shrink-0 ring-2 ring-transparent hover:ring-[var(--shop-accent)] transition-all duration-300" />
            )}
            <div className="text-right min-w-0">
              <div className="font-bold text-sm md:text-base leading-tight truncate text-foreground">{displayBusinessName}</div>
              <div className="text-xs md:text-xs text-muted-foreground leading-tight truncate">
                <span className="sm:hidden">{displayTagline || "اطبع بسهولة"}</span>
                <span className="hidden sm:inline">{displayTagline || "اطبع بسهولة — أسرع من واتساب"}</span>
              </div>
            </div>
          </button>

          {/* التنقل - حاسوب */}
          <nav className="hidden md:flex items-center gap-1 bg-muted rounded-full p-1">
            {navItems.map((item) => (
              <button
                key={item.key}
                onClick={() => handleNavClick(item.key)}
                className={`relative flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  view === item.key
                    ? ""
                    : "text-muted-foreground hover:bg-accent"
                }`}
                style={view === item.key ? { color: shopTheme.nav.activeText } : undefined}
              >
                {view === item.key && (
                  <div
                    className="absolute inset-0 rounded-full shadow-sm transition-all duration-300"
                    style={{ backgroundColor: shopTheme.nav.active, zIndex: -1 }}
                  />
                )}
                <item.icon className="h-4 w-4 relative z-10" />
                <span className="relative z-10">{item.label}</span>
                {item.key === "admin" && !adminUnlocked && (
                  <svg className="h-3 w-3 text-amber-500 relative z-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                )}
              </button>
            ))}
          </nav>

          {/* التنقل - الجوال (أيقونات واضحة) */}
          <nav className="flex md:hidden items-center gap-1 bg-muted rounded-full p-1 shrink-0">
            {navItems.filter((item) => !item.desktopOnly).map((item) => (
              <button
                key={item.key}
                onClick={() => handleNavClick(item.key)}
                className={`relative flex items-center justify-center w-8 h-8 rounded-full transition-colors ${
                  view === item.key
                    ? ""
                    : "text-muted-foreground hover:bg-accent"
                }`}
                style={view === item.key ? { color: shopTheme.nav.activeText } : undefined}
                aria-label={item.label}
              >
                {view === item.key && (
                  <div
                    className="absolute inset-0 rounded-full transition-all duration-300"
                    style={{ backgroundColor: shopTheme.nav.active, zIndex: -1 }}
                  />
                )}
                <item.icon className="h-4 w-4 relative z-10" />
                {item.key === "admin" && !adminUnlocked && (
                  <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-amber-500 rounded-full" />
                )}
              </button>
            ))}
          </nav>

          {/* زر مشاركة المتجر */}
          <button
            onClick={() => {
              const url = window.location.origin + window.location.pathname;
              if (navigator.share) {
                navigator.share({ title: shopName, url });
              } else {
                navigator.clipboard.writeText(url).then(() => toast.success("تم نسخ الرابط", { description: "شاركه مع أصدقائك" }));
              }
            }}
            className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground px-2.5 py-1.5 rounded-lg hover:bg-accent transition-colors"
            title="مشاركة رابط المتجر"
          >
            <Share2 className="h-4 w-4" />
            <span>مشاركة</span>
          </button>

          {/* زر التبديل بين الوضعين */}
          {hasFeature("darkMode") && (
          <div className="flex items-center gap-1.5 shrink-0">
            <ThemeToggle />
          </div>
          )}
        </div>
      </header>

      {/* ===== المحتوى ===== */}
      <main className="flex-1 flex flex-col">
        <div className="flex-1 py-4 md:py-8">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 w-full">
            {/* Welcome message */}
            {welcomeMessage && view === "new" && (
              <div
                className="mb-4 p-3 rounded-xl border text-sm text-center"
                style={{
                  backgroundColor: shopTheme.accent + '15',
                  borderColor: shopTheme.accent + '40',
                  color: shopTheme.accent,
                }}
              >
                {welcomeMessage}
              </div>
            )}
            <Suspense fallback={<PageSkeleton />}>
            {view === "new" && (
                <div key="view-new" className="animate-in fade-in duration-200">
                  <NewOrderWizard
                    onCreated={handleCreated}
                    prefillOrder={prefillOrder}
                    onPrefillConsumed={handlePrefillConsumed}
                  />
                </div>
              )}
              {view === "repeat" && (
                <div key="view-repeat" className="animate-in fade-in duration-200">
                  <RepeatOrder onRepeat={handleRepeat} />
                </div>
              )}
              {view === "track" && (
                <div key="view-track" className="animate-in fade-in duration-200">
                  <TrackOrder key={refreshKey} />
                </div>
              )}
              {view === "history" && (
                <div key="view-history" className="animate-in fade-in duration-200">
                  <OrderHistory />
                </div>
              )}
              {view === "admin" && (
                <div key="view-admin" className="animate-in fade-in duration-200">
                  <AdminPanel onRefresh={incrementRefresh} />
                </div>
              )}
            </Suspense>
          </div>
        </div>

        {/* ===== التذييل (يختفي في قسم الإدارة) ===== */}
        {view !== "admin" && (
        <footer className="mt-auto no-print" style={{ backgroundColor: shopTheme.footer.bg, color: shopTheme.footer.text }}>
          {/* خط فاصل متدرّج */}
          <div className="h-px" style={{ background: `linear-gradient(to left, ${shopTheme.footerIcon}80, ${shopTheme.footer.border}, ${shopTheme.footerIcon}80)` }} />
          {/* زر الطي/الفتح - يظهر فقط على الجوال */}
          <button
            onClick={() => setFooterOpen(!footerOpen)}
            className="md:hidden w-full flex items-center justify-center gap-2 py-3.5 px-4 text-xs text-neutral-400 hover:text-[var(--shop-footer-hover)] transition-colors border-b border-[var(--shop-footer-border)] active:bg-neutral-800/50"
            aria-expanded={footerOpen}
            aria-label={footerOpen ? "إخفاء التفاصيل" : "عرض التفاصيل"}
          >
            <Info className="h-3.5 w-3.5" />
            <span className="font-medium">{footerOpen ? "إخفاء التفاصيل" : "عرض معلومات المطبعة"}</span>
            <div
              className={`transition-transform duration-300 ${footerOpen ? "rotate-180" : ""}`}
            >
              <ChevronUp className="h-4 w-4" />
            </div>
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
                      {shopLogoUrl ? (
                        <img src={shopLogoUrl} alt={displayBusinessName} className="w-9 h-9 rounded-lg shrink-0 object-cover ring-2 ring-white/10" />
                      ) : (
                        <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: shopTheme.footerIcon }}>
                          <Printer className="h-5 w-5 text-neutral-900" />
                        </div>
                      )}
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
                    <h4 className="text-white font-semibold text-sm mb-3">روابط سريعة</h4>
                    <ul className="space-y-2 text-xs">
                      <li>
                        <button onClick={() => { setFooterOpen(false); setView("new"); }} className="hover:text-[var(--shop-footer-hover)] transition-colors flex items-center gap-2">
                          <Plus className="h-3.5 w-3.5 text-neutral-500" />
                          طلب طباعة جديد
                        </button>
                      </li>
                      <li>
                        <button onClick={() => setView("track")} className="hover:text-[var(--shop-footer-hover)] transition-colors flex items-center gap-2">
                          <Search className="h-3.5 w-3.5 text-neutral-500" />
                          تتبّع طلب
                        </button>
                      </li>
                      {showAdminLink && (
                      <li>
                        <button onClick={() => handleNavClick("admin")} className="hover:text-[var(--shop-footer-hover)] transition-colors flex items-center gap-2">
                          <Shield className="h-3.5 w-3.5 text-neutral-500" />
                          لوحة الإدارة
                        </button>
                      </li>
                      )}
                      <li>
                        <button onClick={() => setView("repeat")} className="hover:text-[var(--shop-footer-hover)] transition-colors flex items-center gap-2">
                          <RotateCcw className="h-3.5 w-3.5 text-neutral-500" />
                          إعادة طلب سابق
                        </button>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="text-white font-semibold text-sm mb-3">خدماتنا</h4>
                    {shopServices ? (
                      <div className="grid grid-cols-2 gap-1.5">
                        {shopServices.map((s: { name: string; emoji?: string }, i: number) => (
                          <div
                            key={i}
                            className="flex items-center gap-1.5 text-xs text-neutral-400 px-2 py-1.5 rounded-lg hover:bg-white/5 hover:text-[var(--shop-footer-hover)] transition-all duration-200 cursor-default"
                          >
                            <span className="shrink-0">{s.emoji || "🖨️"}</span>
                            <span className="truncate">{s.name}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-1.5">
                        {[{e:"🖨️",n:"طباعة مستند"},{e:"📄",n:"نسخ مستندات"},{e:"🖼️",n:"طباعة صور"},{e:"📚",n:"تجليد"},{e:"🪪",n:"بطاقات"},{e:"📜",n:"ملصقات"}].map((s) => (
                          <div key={s.n} className="flex items-center gap-1.5 text-xs text-neutral-400 px-2 py-1.5 rounded-lg hover:bg-white/5 hover:text-[var(--shop-footer-hover)] transition-all cursor-default">
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
                        <MapPin className="h-4 w-4 text-[var(--shop-footer-icon)] shrink-0 mt-0.5" />
                        <span>{shopAddress}</span>
                      </li>
                      )}
                      {formattedPhone && (
                      <li className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-[var(--shop-footer-icon)]" />
                        <span>{formattedPhone}</span>
                      </li>
                      )}
                      {whatsappBtnNumber && (
                      <li className="flex items-center gap-2">
                        <MessageCircle className="h-4 w-4 text-[var(--shop-footer-icon)]" />
                        <a href={`https://wa.me/${whatsappBtnNumber.replace(/[^0-9]/g, "")}`} target="_blank" rel="noopener noreferrer" className="hover:text-[var(--shop-footer-hover)] transition-colors">واتساب</a>
                      </li>
                      )}
                      {shopEmail && (
                      <li className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-[var(--shop-footer-icon)]" />
                        <a href={`mailto:${shopEmail}`} className="hover:text-[var(--shop-footer-hover)] transition-colors">{shopEmail}</a>
                      </li>
                      )}
                      <li className="flex items-start gap-2 pt-2 border-t border-[var(--shop-footer-border)]">
                        <Clock className="h-4 w-4 text-[var(--shop-footer-icon)] shrink-0 mt-0.5" />
                        <div>
                          <div>السبت - الخميس: 8:00 ص — 8:00 م</div>
                          <div className="text-neutral-500">الجمعة: مغلق</div>
                        </div>
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-[var(--shop-footer-border)] text-center text-xs text-neutral-500">
                  © {new Date().getFullYear()} {displayBusinessName} — جميع الحقوق محفوظة
                  <div className="mt-1 text-neutral-600 flex items-center justify-center gap-1">
                    <img src="/tayf-logo-sm-dark.png" alt="طيف" className="w-4 h-4" />
                    <span>طيف</span>
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

      {/* الزر العائم: واتساب + مساعد ذكي */}
      <FloatingAssistant onRepeatOrder={() => setView("repeat")} />

      <SonnerToaster position="top-center" dir="rtl" />
      </div>
    </>
  );
}