"use client";

import { useCallback, useState } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import {
  Plus,
  MapPin,
  Phone,
  Mail,
  Clock,
  MessageCircle,
  RotateCcw,
  Search,
  ChevronUp,
  Info,
  Calculator,
  Menu,
  Home,
  ArrowLeftToLine,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RepeatOrder } from "@/components/app/repeat-order";
import { TrackOrder } from "@/components/app/track-order";
import { OrderSuccess } from "@/components/app/order-success";
import { AdminGate } from "@/components/app/admin-gate";
import { ThemeToggle } from "@/components/app/theme-toggle";
import { LiveClock } from "@/components/app/live-clock";
import { NotificationBadge } from "@/components/app/notification-badge";
import { Intro } from "@/components/app/intro";
import { MobileSidebar } from "@/components/app/mobile-sidebar";
import { BackToTop } from "@/components/app/back-to-top";
import { MobileBottomNav } from "@/components/app/mobile-bottom-nav";
import { TestimonialsSection } from "@/components/app/testimonials-section";
import { useAppStore, type View, type CreatedOrder } from "@/lib/store";
import type { PrintOrderLite } from "@/lib/order-types";

const NewOrderWizard = dynamic(() => import("@/components/app/new-order-wizard").then(m => ({ default: m.NewOrderWizard })), { loading: () => <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" /></div> });
const AdminPanel = dynamic(() => import("@/components/app/admin-panel").then(m => ({ default: m.AdminPanel })), { ssr: false });
const QuickPriceCalculator = dynamic(() => import("@/components/app/quick-price-calculator").then(m => ({ default: m.QuickPriceCalculator })));
const FloatingAssistant = dynamic(() => import("@/components/app/floating-assistant").then(m => ({ default: m.FloatingAssistant })), { ssr: false });

/* ------------------------------------------------------------------
 *  Props — بيانات المتجر الديناميكية من shop-context / page props
 * ------------------------------------------------------------------ */
export interface AppShellProps {
  shopId?: string;
  shopSlug?: string;
  shopName?: string;
  shopPhone?: string;
  shopWhatsapp?: string;
  shopEmail?: string;
  shopAddress?: string;
  shopLogo?: string;
  shopCountry?: string;
  shopCurrency?: string;
}

export function AppShell({
  shopId,
  shopSlug,
  shopName: propShopName,
  shopPhone,
  shopWhatsapp,
  shopEmail,
  shopAddress,
  shopLogo,
}: AppShellProps) {
  const [footerOpen, setFooterOpen] = useState(true);
  const [calcOpen, setCalcOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const shopName = propShopName || "مطبعة الذكي";
  const isShopOpen = (() => {
    const now = new Date();
    const day = now.getDay();
    const hour = now.getHours();
    return day !== 5 && hour >= 8 && hour < 19;
  })();
  const {
    view,
    setView,
    createdOrder,
    setCreatedOrder,
    prefillOrder,
    setPrefillOrder,
    pendingFile,
    setPendingFile,
    adminUnlocked,
    setAdminUnlocked,
    adminGateOpen,
    setAdminGateOpen,
    refreshKey,
    incrementRefresh,
    showIntro,
    setShowIntro,
    showAdminLink,
  } = useAppStore();

  const handleCreated = useCallback((order: CreatedOrder) => {
    setCreatedOrder(order);
  }, [setCreatedOrder]);

  const handleRepeat = useCallback((order: PrintOrderLite, file?: File | null) => {
    setPrefillOrder(order);
    setPendingFile(file || null);
    setView("new");
  }, [setPrefillOrder, setPendingFile, setView]);

  const handlePrefillConsumed = useCallback(() => {
    setPrefillOrder(null);
    setPendingFile(null);
  }, [setPrefillOrder, setPendingFile]);

  const handleNavClick = useCallback(
    (key: View) => {
      if (key === "admin" && !adminUnlocked) {
        setAdminGateOpen(true);
        return;
      }
      if (key === "new") {
        setFooterOpen(false);
      } else {
        setFooterOpen(true);
      }
      setView(key);
    },
    [adminUnlocked, setAdminGateOpen, setView],
  );

  const handleAdminUnlock = useCallback(() => {
    setAdminUnlocked(true);
    setAdminGateOpen(false);
    setView("admin");
  }, [setAdminUnlocked, setAdminGateOpen, setView]);

  const handleCloseOrderSuccess = useCallback(() => {
    setCreatedOrder(null);
    incrementRefresh();
  }, [setCreatedOrder, incrementRefresh]);

  const navItems: { key: View; label: string; shortLabel: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { key: "new", label: "طلب جديد", shortLabel: "جديد", icon: Plus },
    { key: "repeat", label: "تكرار طلب", shortLabel: "تكرار", icon: RotateCcw },
    { key: "track", label: "تتبّع", shortLabel: "تتبّع", icon: Search },
  ];

  const displayPhone = shopPhone || "0560 00 00 00";
  const displayPhoneTel = (shopPhone || "0560000000").replace(/\s/g, "");
  const displayAddress = shopAddress || "شارع ديدوش مراد، الجزائر العاصمة";
  const displayEmail = shopEmail || "contact@matbaa-dhaki.dz";

  return (
    <>
    {showIntro && <Intro onFinish={() => setShowIntro(false)} />}
    <LayoutGroup>
      <div className="min-h-screen flex flex-col bg-background" dir="rtl">

      {/* Top info bar */}
      {view !== "new" && (
      <div className="bg-gradient-to-r from-amber-600 via-amber-500 to-orange-500 text-white border-b border-amber-400/30">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 h-8 sm:h-9 flex items-center justify-between gap-2">
          <div className="flex sm:hidden items-center gap-1.5 text-xs min-w-0">
            <span className="shrink-0">⚡</span>
            <span className="truncate font-medium">اطلب خلال دقيقة</span>
          </div>
          <div className="hidden sm:flex items-center gap-4 md:gap-6 overflow-hidden text-xs font-medium">
            <span className="flex items-center gap-1.5 whitespace-nowrap">
              <span>⚡</span>
              اطلب خلال دقيقة
            </span>
            <span className="hidden md:flex items-center gap-1.5 whitespace-nowrap">
              <span>🕐</span>
              جاهز خلال ساعة
            </span>
            <span className="hidden lg:flex items-center gap-1.5 whitespace-nowrap">
              <span>🔔</span>
              إشعار عند الجاهزية
            </span>
          </div>
          <a
            href={`tel:${displayPhoneTel}`}
            className="flex items-center gap-1 hover:bg-white/20 transition-colors whitespace-nowrap shrink-0 text-xs rounded-full px-2 py-0.5"
          >
            <Phone className="h-3 w-3 shrink-0" />
            <span className="hidden sm:inline">{displayPhone}</span>
            <span className="sm:hidden">اتصل بنا</span>
          </a>
        </div>
      </div>
      )}

      {/* Header */}
      <header className="bg-white dark:bg-neutral-950 border-b border-border sticky top-0 z-40 no-print shadow-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 h-14 md:h-16 flex items-center justify-between gap-1 sm:gap-2">
          {/* Logo */}
          <button
            onClick={() => { setFooterOpen(false); setView("new"); }}
            className="flex items-center gap-1.5 sm:gap-2.5 shrink-0 min-w-0"
          >
            <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-neutral-900 flex items-center justify-center shrink-0 overflow-hidden">
              {shopLogo ? (
                <img src={shopLogo} alt="" className="w-full h-full object-contain p-0.5" />
              ) : (
                <img src="/shop-logo.png" alt="" className="w-full h-full object-contain p-0.5" />
              )}
            </div>
            <div className="text-right min-w-0">
              <div className="font-bold text-sm md:text-base leading-tight truncate">{shopName}</div>
              <div className="text-[10px] md:text-xs text-muted-foreground leading-tight truncate">
                <span>الطباعة تبدأ قبل وصولك</span>
              </div>
            </div>
          </button>

          {/* Live clock - desktop only */}
          <div className="hidden lg:block">
            <LiveClock />
          </div>

          {/* Desktop nav */}
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
                    className="absolute inset-0 bg-neutral-900 rounded-full shadow-sm"
                    style={{ zIndex: -1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <item.icon className="h-4 w-4 relative z-10" />
                <span className="relative z-10">{item.label}</span>
              </button>
            ))}
          </nav>

          {/* Desktop side icons */}
          <div className="hidden md:flex items-center gap-1.5 shrink-0">
            <Button variant="ghost" size="icon" className="h-9 w-9 sm:h-auto sm:w-auto" onClick={() => setCalcOpen(true)} aria-label="حاسبة الأسعار">
              <Calculator className="h-[18px] w-[18px]" />
            </Button>
            <div className="h-5 w-px bg-border/50" />
            <NotificationBadge />
            <ThemeToggle />
          </div>

          {/* Mobile buttons: home + notifications + menu */}
          <div className="flex md:hidden items-center gap-0.5 shrink-0">
            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => { setFooterOpen(false); setView("new"); }} aria-label="الرئيسية">
              <Home className="h-[18px] w-[18px]" />
            </Button>
            <NotificationBadge />
            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setMobileSidebarOpen(true)} aria-label="القائمة">
              <Menu className="h-[20px] w-[20px]" />
            </Button>
          </div>
        </div>
      </header>

      {/* Calculator dialog */}
      <Dialog open={calcOpen} onOpenChange={setCalcOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>حاسبة الأسعار السريعة</DialogTitle>
          </DialogHeader>
          <QuickPriceCalculator />
        </DialogContent>
      </Dialog>

      {/* Mobile sidebar */}
      <MobileSidebar
        open={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
        onNavClick={handleNavClick}
        onCalcOpen={() => setCalcOpen(true)}
      />

      {/* Main content */}
      <main className="flex-1 flex flex-col">
        <div className="flex-1 py-4 md:py-8">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 w-full">
            <AnimatePresence mode="wait">
              {view === "new" && (
                <motion.div key="view-new" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.25, ease: "easeInOut" }}>
                  <NewOrderWizard onCreated={handleCreated} prefillOrder={prefillOrder} onPrefillConsumed={handlePrefillConsumed} />
                </motion.div>
              )}
              {view === "repeat" && (
                <motion.div key="view-repeat" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.25, ease: "easeInOut" }}>
                  <RepeatOrder onRepeat={handleRepeat} />
                </motion.div>
              )}
              {view === "track" && (
                <motion.div key="view-track" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.25, ease: "easeInOut" }}>
                  <TrackOrder key={refreshKey} />
                </motion.div>
              )}
              {view === "admin" && (
                <motion.div key="view-admin" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.25, ease: "easeInOut" }}>
                  <AdminPanel key={refreshKey} onRefresh={incrementRefresh} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Footer (hidden in admin) */}
        {view !== "admin" && (
        <footer className="bg-gradient-to-b from-amber-50 via-orange-50/80 to-amber-50/60 dark:from-neutral-900 dark:via-neutral-900 dark:to-neutral-950 text-neutral-700 dark:text-neutral-300 mt-auto no-print border-t border-amber-200/60 dark:border-amber-500/10">
          <button onClick={() => setFooterOpen(!footerOpen)} className="w-full flex items-center justify-center gap-2 py-3 px-4 text-xs text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 transition-colors border-b border-amber-200/40 dark:border-amber-500/10 active:bg-amber-100/50 dark:active:bg-neutral-800/50" aria-expanded={footerOpen} aria-label={footerOpen ? "إخفاء التفاصيل" : "عرض التفاصيل"}>
            <Info className="h-3.5 w-3.5" />
            <span className="font-medium">{footerOpen ? "إخفاء التفاصيل" : "عرض معلومات المطبعة"}</span>
            <motion.div animate={{ rotate: footerOpen ? 0 : 180 }} transition={{ duration: 0.3, ease: "easeInOut" }}>
              <ChevronUp className="h-4 w-4" />
            </motion.div>
          </button>

          <div className={`footer-collapse${footerOpen ? " footer-expanded" : ""}`}>
            <TestimonialsSection />
            <div className="divider-gold mx-auto w-full max-w-7xl" />
            <div className="max-w-7xl mx-auto px-4 py-10">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                <div className="md:col-span-1">
                  <div className="flex items-center gap-2.5 mb-3">
                    <div className="w-9 h-9 rounded-lg bg-amber-500 flex items-center justify-center overflow-hidden">
                      {shopLogo ? (
                        <img src={shopLogo} alt="" className="w-full h-full object-contain p-0.5" />
                      ) : (
                        <img src="/shop-logo.png" alt="" className="w-full h-full object-contain p-0.5" />
                      )}
                    </div>
                    <div>
                      <div className="font-bold text-neutral-900 dark:text-white">{shopName}</div>
                      <div className="text-xs text-neutral-500 dark:text-neutral-400">اطبع بسهولة</div>
                    </div>
                  </div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                    خدمة طباعة احترافية وسريعة.
                  </p>
                  <div className="flex items-center gap-2 mt-4">
                    <a href="#" aria-label="facebook" className="social-icon w-8 h-8 rounded-full bg-amber-100 dark:bg-neutral-800 hover:bg-amber-200 dark:hover:bg-amber-500/20 text-amber-600 dark:text-neutral-400 hover:text-amber-700 dark:hover:text-amber-400 transition-all flex items-center justify-center">
                      <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                    </a>
                    <a href="#" aria-label="instagram" className="social-icon w-8 h-8 rounded-full bg-amber-100 dark:bg-neutral-800 hover:bg-amber-200 dark:hover:bg-amber-500/20 text-amber-600 dark:text-neutral-400 hover:text-amber-700 dark:hover:text-amber-400 transition-all flex items-center justify-center">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="5"/><circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none"/></svg>
                    </a>
                    <a href="#" aria-label="twitter" className="social-icon w-8 h-8 rounded-full bg-amber-100 dark:bg-neutral-800 hover:bg-amber-200 dark:hover:bg-amber-500/20 text-amber-600 dark:text-neutral-400 hover:text-amber-700 dark:hover:text-amber-400 transition-all flex items-center justify-center">
                      <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                    </a>
                    <a href="#" aria-label="tiktok" className="social-icon w-8 h-8 rounded-full bg-amber-100 dark:bg-neutral-800 hover:bg-amber-200 dark:hover:bg-amber-500/20 text-amber-600 dark:text-neutral-400 hover:text-amber-700 dark:hover:text-amber-400 transition-all flex items-center justify-center">
                      <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1 0-5.78 2.86 2.86 0 0 1 .88.13V9.4a6.31 6.31 0 0 0-.88-.06 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V9.12a8.28 8.28 0 0 0 4.84 1.55V7.21a4.85 4.85 0 0 1-1.08-.52z"/></svg>
                    </a>
                  </div>
                </div>

                <div>
                  <h4 className="text-neutral-900 dark:text-white font-semibold text-sm mb-3">روابط سريعة</h4>
                  <ul className="space-y-2 text-xs">
                    <li><button onClick={() => { setFooterOpen(false); setView("new"); }} className="footer-link">طلب طباعة جديد</button></li>
                    <li><button onClick={() => setView("track")} className="footer-link">تتبّع طلب</button></li>
                    <li><button onClick={() => setView("repeat")} className="footer-link">إعادة طلب سابق</button></li>
                  </ul>
                </div>

                <div>
                  <h4 className="text-neutral-900 dark:text-white font-semibold text-sm mb-3">خدماتنا</h4>
                  <div className="space-y-2.5 text-xs text-neutral-600 dark:text-neutral-400">
                    <button onClick={() => { setFooterOpen(false); setView("new"); }} className="flex items-center gap-2 w-full text-right hover:text-amber-400 transition-colors"><span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />طباعة مستند</button>
                    <button onClick={() => { setFooterOpen(false); setView("new"); }} className="flex items-center gap-2 w-full text-right hover:text-amber-400 transition-colors"><span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />نسخ مستندات</button>
                    <button onClick={() => { setFooterOpen(false); setView("new"); }} className="flex items-center gap-2 w-full text-right hover:text-amber-400 transition-colors"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />طباعة صور</button>
                    <button onClick={() => { setFooterOpen(false); setView("new"); }} className="flex items-center gap-2 w-full text-right hover:text-amber-400 transition-colors"><span className="w-1.5 h-1.5 rounded-full bg-orange-400 shrink-0" />تجليد</button>
                    <button onClick={() => { setFooterOpen(false); setView("new"); }} className="flex items-center gap-2 w-full text-right hover:text-amber-400 transition-colors"><span className="w-1.5 h-1.5 rounded-full bg-yellow-500 shrink-0" />بطاقات</button>
                    <button onClick={() => { setFooterOpen(false); setView("new"); }} className="flex items-center gap-2 w-full text-right hover:text-amber-400 transition-colors"><span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />ملصقات</button>
                  </div>
                </div>

                <div>
                  <h4 className="text-neutral-900 dark:text-white font-semibold text-sm mb-3">تواصل معنا</h4>
                  <ul className="space-y-3 text-xs">
                    <li className="flex items-start gap-2"><MapPin className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" /><span>{displayAddress}</span></li>
                    <li className="flex items-center gap-2"><Phone className="h-4 w-4 text-amber-400" /><span>{displayPhone}</span></li>
                    <li className="flex items-center gap-2"><MessageCircle className="h-4 w-4 text-amber-400" /><span>واتساب</span></li>
                    <li className="flex items-center gap-2"><Mail className="h-4 w-4 text-amber-400" /><span>{displayEmail}</span></li>
                    <li className="flex items-start gap-2 pt-2 border-t border-amber-200/40 dark:border-neutral-700">
                      <Clock className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <div>السبت - الخميس: 8:00 ص — 7:00 م</div>
                        <div className="flex items-center gap-2 mt-0.5">
                          {isShopOpen ? (
                            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium status-open">
                              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                              مفتوح الآن
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium status-closed">
                              <span className="w-2 h-2 rounded-full bg-red-500" />
                              مغلق
                            </span>
                          )}
                          <span className="text-neutral-500">الجمعة: مغلق</span>
                        </div>
                      </div>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-amber-200/40 dark:border-amber-500/10 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-neutral-400 dark:text-neutral-500">
                <span>© 2026 {shopName} — جميع الحقوق محفوظة</span>
                <span className="flex items-center gap-1">صُمّم <span className="animate-heart-pulse inline-block">❤️</span> في الجزائر 🇩🇿</span>
              </div>
            </div>
          </div>
        </footer>
        )}
      </main>

      <MobileBottomNav />

      {/* Admin link for multi-shop */}
      {showAdminLink && shopSlug && (
        <a
          href={`/s/${shopSlug}?admin=1`}
          className="fixed bottom-16 left-3 z-50 flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-neutral-900 text-white text-[11px] font-medium shadow-lg hover:bg-neutral-800 transition-colors no-print"
          title="لوحة التحكم"
        >
          <ArrowLeftToLine className="h-3.5 w-3.5" />
          <span>لوحة التحكم</span>
        </a>
      )}

      <OrderSuccess order={createdOrder} open={!!createdOrder} onClose={handleCloseOrderSuccess} onNavigate={(v) => { if (v === "new") setFooterOpen(false); setView(v as View); }} />
      <AdminGate open={adminGateOpen} onClose={() => setAdminGateOpen(false)} onSuccess={handleAdminUnlock} />

      <BackToTop />
      <FloatingAssistant onRepeatOrder={() => setView("repeat")} />

      <SonnerToaster position="top-center" dir="rtl" />
      </div>
    </LayoutGroup>
    </>
  );
}
