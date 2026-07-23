"use client";

import { Suspense, useCallback, useState, useMemo, useEffect } from "react";
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
import { PageSkeleton } from "@/components/app/page-skeleton";
import { ThemeToggle } from "@/components/app/theme-toggle";
import { Intro } from "@/components/app/intro";
import { useAppStore } from "@/lib/store";
import type { PrintOrderLite } from "@/lib/order-types";
import { getCountry } from "@/lib/countries";
import { DEFAULT_SETTINGS, type AppSettings } from "@/lib/default-settings";

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

  const formattedPhone = shopPhone ? shopPhone.replace(/(\d{2})(\d{3})(\d{2})(\d{3})/, "$1 $2 $3 $4") : "";

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
      <div className="min-h-screen flex flex-col bg-background" dir="rtl">
      {/* ===== الشريط العلوي الأسود ===== */}
      {view !== "new" && (
      <div className="bg-muted/80 text-muted-foreground backdrop-blur-sm border-b">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 h-8 sm:h-9 flex items-center justify-between gap-2">
          {/* الجوال: معلومة واحدة واضحة */}
          <div className="flex sm:hidden items-center gap-1.5 text-xs min-w-0">
            <span className="text-primary shrink-0">⚡</span>
            <span className="truncate">اطلب خلال دقيقة</span>
          </div>
          {/* الحاسوب: كل المميزات */}
          <div className="hidden sm:flex items-center gap-4 md:gap-6 overflow-hidden text-xs">
            <span className="flex items-center gap-1.5 whitespace-nowrap">
              <span className="text-primary">⚡</span>
              اطلب خلال دقيقة
            </span>
            <span className="hidden md:flex items-center gap-1.5 whitespace-nowrap">
              <span className="text-primary">🕐</span>
              جاهز خلال ساعة
            </span>
            <span className="hidden lg:flex items-center gap-1.5 whitespace-nowrap">
              <span className="text-primary">🔔</span>
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
      <header className={`bg-background border-b border-border/50 sticky top-0 z-40 no-print transition-shadow duration-300 after:content-[''] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-gradient-to-l after:from-primary/20 after:via-primary/10 after:to-primary/20 ${scrolled ? 'shadow-sm' : ''}`}>
        <div className="max-w-7xl mx-auto px-3 sm:px-4 h-14 md:h-16 flex items-center justify-between gap-1 sm:gap-2 overflow-hidden">
          {/* الشعار */}
          <button
            onClick={() => { setFooterOpen(false); setView("new"); }}
            className="flex items-center gap-2 sm:gap-2.5 min-w-0"
          >
            {shop?.logoUrl ? (
              <img src={shop.logoUrl} alt={displayBusinessName} className="w-9 h-9 md:w-10 md:h-10 rounded-xl shrink-0 ring-2 ring-transparent hover:ring-primary/20 transition-all duration-300 object-cover" />
            ) : platformLogoUrl ? (
              <img src={platformLogoUrl} alt={displayBusinessName} className="w-9 h-9 md:w-10 md:h-10 rounded-xl shrink-0 ring-2 ring-transparent hover:ring-primary/20 transition-all duration-300 object-cover dark:hidden" />
            ) : (
              <img src="/tayf-logo-sm.png" alt={displayBusinessName} className="w-9 h-9 md:w-10 md:h-10 rounded-xl shrink-0 ring-2 ring-transparent hover:ring-primary/20 transition-all duration-300 dark:hidden" />
            )}
            {shop?.logoUrl ? null : (platformLogoDarkUrl || platformLogoUrl) ? (
              <img src={platformLogoDarkUrl || platformLogoUrl} alt={displayBusinessName} className="w-9 h-9 md:w-10 md:h-10 rounded-xl shrink-0 ring-2 ring-transparent hover:ring-primary/20 transition-all duration-300 object-cover hidden dark:block" />
            ) : (
              <img src="/tayf-logo-sm-dark.png" alt={displayBusinessName} className="w-9 h-9 md:w-10 md:h-10 rounded-xl shrink-0 ring-2 ring-transparent hover:ring-primary/20 transition-all duration-300 hidden dark:block" />
            )}
            <div className="font-bold text-sm md:text-base leading-tight truncate min-w-0">{displayBusinessName}</div>
          </button>

          {/* التنقل - حاسوب */}
          <nav className="hidden md:flex items-center gap-1 bg-muted/60 rounded-full p-1">
            {navItems.map((item) => (
              <button
                key={item.key}
                onClick={() => handleNavClick(item.key)}
                className={`relative flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  view === item.key
                    ? "text-white"
                    : "text-foreground hover:bg-background"
                }`}
              >
                {view === item.key && (
                  <motion.div
                    layoutId="nav-active-desktop"
                    className="absolute inset-0 bg-primary rounded-full shadow-sm"
                    style={{ zIndex: -1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <item.icon className="h-4 w-4 relative z-10" />
                <span className="relative z-10">{item.label}</span>
                {item.key === "admin" && !adminUnlocked && (
                  <svg className="h-3 w-3 text-primary relative z-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                )}
              </button>
            ))}
          </nav>

          {/* التنقل - الجوال (أيقونات واضحة) */}
          <nav className="flex md:hidden items-center gap-1 bg-muted/60 rounded-full p-1 shrink-0">
            {navItems.filter((item) => !item.desktopOnly).map((item) => (
              <button
                key={item.key}
                onClick={() => handleNavClick(item.key)}
                className={`relative flex items-center justify-center w-10 h-10 rounded-full transition-colors ${
                  view === item.key
                    ? "text-white"
                    : "text-foreground hover:bg-background"
                }`}
                aria-label={item.label}
              >
                {view === item.key && (
                  <motion.div
                    layoutId="nav-active-mobile"
                    className="absolute inset-0 bg-primary rounded-full"
                    style={{ zIndex: -1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <item.icon className="h-4 w-4 relative z-10" />
                {item.key === "admin" && !adminUnlocked && (
                  <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-primary rounded-full" />
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
            className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground px-2.5 py-1.5 rounded-lg hover:bg-primary/10 transition-colors"
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

        {/* ===== التذييل (يختفي في قسم الإدارة) ===== */}
        {view !== "admin" && (
        <footer className="bg-neutral-900 text-neutral-300 mt-auto no-print">
          {/* خط فاصل متدرّج */}
          <div className="h-px bg-gradient-to-l from-primary/50 via-border to-primary/50" />
          {/* زر الطي/الفتح - يظهر فقط على الجوال */}
          <button
            onClick={() => setFooterOpen(!footerOpen)}
            className="md:hidden w-full flex items-center justify-center gap-2 min-h-[44px] px-4 text-xs text-neutral-400 hover:text-primary transition-colors border-b border-neutral-800/60 active:bg-neutral-800/50"
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
                    <h4 className="text-white font-semibold text-sm mb-3">روابط سريعة</h4>
                    <ul className="space-y-2 text-xs">
                      <li>
                        <button onClick={() => { setFooterOpen(false); setView("new"); }} className="hover:text-primary transition-colors flex items-center gap-2 min-h-[44px]">
                          <Plus className="h-3.5 w-3.5 text-neutral-500" />
                          طلب طباعة جديد
                        </button>
                      </li>
                      <li>
                        <button onClick={() => setView("track")} className="hover:text-primary transition-colors flex items-center gap-2 min-h-[44px]">
                          <Search className="h-3.5 w-3.5 text-neutral-500" />
                          تتبّع طلب
                        </button>
                      </li>
                      {showAdminLink && (
                      <li>
                        <button onClick={() => handleNavClick("admin")} className="hover:text-primary transition-colors flex items-center gap-2 min-h-[44px]">
                          <Shield className="h-3.5 w-3.5 text-neutral-500" />
                          لوحة الإدارة
                        </button>
                      </li>
                      )}
                      <li>
                        <button onClick={() => setView("repeat")} className="hover:text-primary transition-colors flex items-center gap-2 min-h-[44px]">
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
                            className="flex items-center gap-1.5 text-xs text-neutral-400 px-2 py-1.5 rounded-lg hover:bg-neutral-800/60 hover:text-primary transition-all duration-200 cursor-default hover:shadow-[0_0_8px_rgba(245,158,11,0.15)]"
                          >
                            <span className="shrink-0">{s.emoji || "🖨️"}</span>
                            <span className="truncate">{s.name}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-1.5">
                        {[{e:"🖨️",n:"طباعة مستند"},{e:"📄",n:"نسخ مستندات"},{e:"🖼️",n:"طباعة صور"},{e:"📚",n:"تجليد"},{e:"🪪",n:"بطاقات"},{e:"📜",n:"ملصقات"}].map((s) => (
                          <div key={s.n} className="flex items-center gap-1.5 text-xs text-neutral-400 px-2 py-1.5 rounded-lg hover:bg-neutral-800/60 hover:text-primary hover:shadow-[0_0_8px_rgba(245,158,11,0.15)] transition-all cursor-default">
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
                    </ul>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-neutral-800 text-center text-xs text-neutral-500">
                  © {new Date().getFullYear()} {displayBusinessName} — جميع الحقوق محفوظة
                  <div className="mt-1 text-neutral-600 flex items-center justify-center gap-1">{platformLogoUrl ? (<img src={platformLogoUrl} alt="طيف" className="w-4 h-4 inline dark:hidden" />) : (<img src="/tayf-logo-sm.png" alt="طيف" className="w-4 h-4 inline dark:hidden" />)}{platformLogoDarkUrl || platformLogoUrl ? (<img src={platformLogoDarkUrl || platformLogoUrl} alt="طيف" className="w-4 h-4 inline hidden dark:block" />) : (<img src="/tayf-logo-sm-dark.png" alt="طيف" className="w-4 h-4 inline hidden dark:block" />)} طيف</div>
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

      </div>
    </LayoutGroup>
    </>
  );
}