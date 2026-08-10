"use client";

import { useCallback, useSyncExternalStore, useState } from "react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import {
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
  Store,
  Calculator,
  Zap,
  Bell,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { NewOrderWizard } from "@/components/app/new-order-wizard";
import { RepeatOrder } from "@/components/app/repeat-order";
import { TrackOrder } from "@/components/app/track-order";
import { AdminPanel } from "@/components/app/admin-panel";
import { OrderSuccess } from "@/components/app/order-success";
import { AdminGate } from "@/components/app/admin-gate";
import { FloatingAssistant } from "@/components/app/floating-assistant";
import { ThemeToggle } from "@/components/app/theme-toggle";
import { Intro } from "@/components/app/intro";
import { LiveClock } from "@/components/app/live-clock";
import { NotificationBadge } from "@/components/app/notification-badge";
import { QuickPriceCalculator } from "@/components/app/quick-price-calculator";
import { BackToTop } from "@/components/app/back-to-top";
import { MobileBottomNav } from "@/components/app/mobile-bottom-nav";
import { QuickActions } from "@/components/app/quick-actions";
import { TestimonialsSection } from "@/components/app/testimonials-section";
import { useAppStore } from "@/lib/store";
import { useShop } from "@/lib/shop-context";
import { getTheme } from "@/lib/themes";
import type { PrintOrderLite } from "@/lib/order-types";

export interface CreatedOrder {
  id: string;
  reference: string;
  serviceName: string;
  serviceType: string;
  total: number;
  status: string;
  estimatedHours: number;
  editableUntil?: string;
}

type View = "new" | "repeat" | "track" | "admin";

export { type CreatedOrder };

export function AppShell() {
  const [footerOpen, setFooterOpen] = useState(true);
  const [calcOpen, setCalcOpen] = useState(false);
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const { shop } = useShop();
  const theme = getTheme(shop?.themeId || 1, shop?.primaryColor);

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
    refreshKey,
    incrementRefresh,
    showIntro,
    setShowIntro,
  } = useAppStore();

  const handleCreated = useCallback((order: CreatedOrder) => {
    setCreatedOrder(order);
  }, [setCreatedOrder]);

  const handleRepeat = useCallback((order: PrintOrderLite) => {
    setPrefillOrder(order);
    setView("new");
  }, [setPrefillOrder, setView]);

  const handlePrefillConsumed = useCallback(() => {
    setPrefillOrder(null);
  }, [setPrefillOrder]);

  const handleNavClick = useCallback(
    (key: View) => {
      if (key === "new") setFooterOpen(false);
      setView(key);
    },
    [setView],
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

  // التنقل بدون زر الإدارة — فقط للزبون
  const navItems: { key: View; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { key: "new", label: "طلب جديد", icon: Plus },
    { key: "repeat", label: "تكرار طلب", icon: RotateCcw },
    { key: "track", label: "تتبّع", icon: Search },
  ];

  const displayPhone = shop?.phone || "0560 00 00 00";
  const displayWhatsapp = shop?.whatsapp || shop?.phone || "0560000000";

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-9 h-9 rounded-xl bg-neutral-900 dark:bg-white/10 flex items-center justify-center animate-pulse">
          <Printer className="h-5 w-5 text-amber-400" />
        </div>
      </div>
    );
  }

  return (
    <>
      {showIntro && <Intro onFinish={() => setShowIntro(false)} />}
      <LayoutGroup>
        <div className="min-h-screen flex flex-col bg-background" dir="rtl" style={theme.rootVars as React.CSSProperties}>
          {/* ===== الشريط العلوي الترويجي ===== */}
          {view !== "new" && (
            <div className="bg-gradient-to-l from-amber-600/90 via-amber-500/90 to-amber-600/90 text-white">
              <div className="max-w-7xl mx-auto px-3 sm:px-4 h-8 sm:h-9 flex items-center justify-between gap-2">
                <div className="flex sm:hidden items-center gap-1.5 text-xs min-w-0">
                  <Zap className="h-3 w-3 shrink-0" />
                  <span className="truncate font-medium">اطلب خلال دقيقة</span>
                </div>
                <div className="hidden sm:flex items-center gap-4 md:gap-6 overflow-hidden text-xs">
                  <span className="flex items-center gap-1.5 whitespace-nowrap font-medium">
                    <Zap className="h-3 w-3" /> اطلب خلال دقيقة
                  </span>
                  <span className="hidden md:flex items-center gap-1.5 whitespace-nowrap">
                    <Clock className="h-3 w-3" /> جاهز خلال ساعة
                  </span>
                  <span className="hidden lg:flex items-center gap-1.5 whitespace-nowrap">
                    <Bell className="h-3 w-3" /> إشعار عند الجاهزية
                  </span>
                </div>
                {displayPhone && (
                  <a href={`tel:${displayPhone.replace(/\s/g, "")}`} className="flex items-center gap-1 hover:bg-white/15 transition-colors whitespace-nowrap shrink-0 text-xs rounded-full px-3 py-1 bg-white/10">
                    <Phone className="h-3 w-3 shrink-0" />
                    <span className="hidden sm:inline font-medium">{displayPhone}</span>
                    <span className="sm:hidden font-medium">اتصل بنا</span>
                  </a>
                )}
              </div>
            </div>
          )}

          {/* ===== الترويسة الرئيسية ===== */}
          <header className="bg-white/80 dark:bg-neutral-950/80 backdrop-blur-xl border-b border-border/50 sticky top-0 z-40 no-print">
            <div className="max-w-7xl mx-auto px-3 sm:px-4 h-14 md:h-16 flex items-center justify-between gap-2">
              {/* الشعار والاسم */}
              <button onClick={() => { setFooterOpen(false); setView("new"); }} className="flex items-center gap-2.5 sm:gap-3 shrink-0 min-w-0 group">
                <div className="w-10 h-10 md:w-11 md:h-11 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/20 dark:shadow-amber-500/10 group-hover:shadow-amber-500/30 transition-shadow">
                  <Printer className="h-5 w-5 md:h-5.5 md:w-5.5 text-white" />
                </div>
                <div className="text-right min-w-0">
                  <div className="font-bold text-sm md:text-base leading-tight truncate text-foreground">{shop?.name || "المتجر"}</div>
                  <div className="text-[11px] text-muted-foreground leading-tight truncate">الطباعة تبدأ قبل وصولك</div>
                </div>
              </button>

              <LiveClock />

              {/* التنقل - حاسوب */}
              <nav className="hidden lg:flex items-center gap-0.5 bg-muted/50 dark:bg-white/5 rounded-full p-1 border border-border/30">
                {navItems.map((item) => (
                  <button key={item.key} onClick={() => handleNavClick(item.key)} className={`relative flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${view === item.key ? "text-white" : "text-muted-foreground hover:text-foreground hover:bg-background/50 dark:hover:bg-white/5"}`}>
                    {view === item.key && (
                      <motion.div layoutId="nav-active-desktop" className="absolute inset-0 bg-gradient-to-l from-neutral-800 to-neutral-900 dark:from-neutral-700 dark:to-neutral-800 rounded-full shadow-md" style={{ zIndex: -1 }} transition={{ type: "spring", stiffness: 400, damping: 30 }} />
                    )}
                    <item.icon className="h-4 w-4 relative z-10" />
                    <span className="relative z-10">{item.label}</span>
                  </button>
                ))}
              </nav>

              {/* التنقل - الجوال والتابلت */}
              <nav className="flex lg:hidden items-center gap-0.5 bg-muted/50 dark:bg-white/5 rounded-full p-0.5 shrink-0 border border-border/30">
                {navItems.map((item) => (
                  <button key={item.key} onClick={() => handleNavClick(item.key)} className={`relative flex items-center justify-center w-8 h-8 rounded-full transition-colors ${view === item.key ? "text-white" : "text-muted-foreground"}`} aria-label={item.label}>
                    {view === item.key && (
                      <motion.div layoutId="nav-active-mobile" className="absolute inset-0 bg-gradient-to-l from-neutral-800 to-neutral-900 dark:from-neutral-700 dark:to-neutral-800 rounded-full shadow-sm" style={{ zIndex: -1 }} transition={{ type: "spring", stiffness: 400, damping: 30 }} />
                    )}
                    <item.icon className="h-4 w-4 relative z-10" />
                  </button>
                ))}
              </nav>

              {/* أزرار الأدوات */}
              <div className="flex items-center gap-1 shrink-0">
                <Button variant="ghost" size="icon" onClick={() => setCalcOpen(true)} className="relative h-9 w-9" aria-label="حاسبة الأسعار">
                  <Calculator className="h-4 w-4" />
                </Button>
                <NotificationBadge />
                <ThemeToggle />
              </div>
            </div>
          </header>

          {/* حاسبة الأسعار */}
          <Dialog open={calcOpen} onOpenChange={setCalcOpen}>
            <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>حاسبة الأسعار السريعة</DialogTitle>
              </DialogHeader>
              <QuickPriceCalculator />
            </DialogContent>
          </Dialog>

          {/* ===== المحتوى ===== */}
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

            {/* ===== التذييل ===== */}
            {view !== "admin" && (
              <footer className="mt-auto no-print">
                {/* زر طي/فتح التذييل */}
                <button onClick={() => setFooterOpen(!footerOpen)} className="w-full flex items-center justify-center gap-2 py-3.5 px-4 text-xs text-muted-foreground hover:text-amber-500 dark:hover:text-amber-400 transition-colors border-t border-border/50 bg-muted/30 dark:bg-white/[0.02]" aria-expanded={footerOpen} aria-label={footerOpen ? "إخفاء التفاصيل" : "عرض التفاصيل"}>
                  <Info className="h-3.5 w-3.5" />
                  <span className="font-medium">{footerOpen ? "إخفاء التفاصيل" : `عرض معلومات ${shop?.name || "المتجر"}`}</span>
                  <motion.div animate={{ rotate: footerOpen ? 0 : 180 }} transition={{ duration: 0.3, ease: "easeInOut" }}>
                    <ChevronUp className="h-4 w-4" />
                  </motion.div>
                </button>

                <div className={`footer-collapse${footerOpen ? " footer-expanded" : ""}`}>
                  {/* قسم آراء العملاء */}
                  <TestimonialsSection />

                  {/* الفاصل الذهبي */}
                  <div className="divider-gold mx-auto w-full max-w-7xl" />

                  {/* المحتوى الرئيسي للتذييل */}
                  <div className="bg-gradient-to-b from-neutral-900 via-neutral-900 to-neutral-950 dark:from-neutral-950 dark:via-black/60 dark:to-black/80">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10 md:py-14">
                      <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">

                        {/* العمود الأول: العلامة التجارية */}
                        <div className="xs:col-span-2 lg:col-span-1">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
                              <Store className="h-5 w-5 text-white" />
                            </div>
                            <div>
                              <div className="font-bold text-white text-sm sm:text-base">{shop?.name || "المتجر"}</div>
                              <div className="text-[11px] text-amber-300/80 font-medium">اطبع بسهولة</div>
                            </div>
                          </div>
                          <p className="text-xs sm:text-sm text-neutral-400/80 leading-relaxed max-w-xs">
                            خدمة طباعة احترافية وسريعة. اطبع مستنداتك وصورك وبطاقاتك أونلاين وتابع طلبك لحظة بلحظة.
                          </p>
                          <div className="flex items-center gap-2.5 mt-5">
                            {displayWhatsapp && (
                              <a href={`https://wa.me/${displayWhatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 hover:border-emerald-500/40 flex items-center justify-center transition-all group">
                                <MessageCircle className="h-4 w-4 text-emerald-400/80 group-hover:text-emerald-400 transition-colors" />
                              </a>
                            )}
                            {displayPhone && (
                              <a href={`tel:${displayPhone.replace(/\s/g, "")}`} className="w-9 h-9 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 hover:border-amber-500/40 flex items-center justify-center transition-all group">
                                <Phone className="h-4 w-4 text-amber-400/80 group-hover:text-amber-400 transition-colors" />
                              </a>
                            )}
                            {shop?.email && (
                              <a href={`mailto:${shop.email}`} className="w-9 h-9 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/20 hover:border-sky-500/40 flex items-center justify-center transition-all group">
                                <Mail className="h-4 w-4 text-sky-400/80 group-hover:text-sky-400 transition-colors" />
                              </a>
                            )}
                          </div>
                        </div>

                        {/* العمود الثاني: روابط سريعة */}
                        <div>
                          <h4 className="text-amber-300 font-bold text-xs sm:text-sm mb-3 sm:mb-4 uppercase tracking-wider">روابط سريعة</h4>
                          <ul className="space-y-2.5 text-xs sm:text-sm">
                            <li><button onClick={() => { setFooterOpen(false); setView("new"); }} className="text-neutral-400 hover:text-white transition-colors">طلب طباعة جديد</button></li>
                            <li><button onClick={() => setView("track")} className="text-neutral-400 hover:text-white transition-colors">تتبّع طلب</button></li>
                            <li><button onClick={() => setView("repeat")} className="text-neutral-400 hover:text-white transition-colors">إعادة طلب سابق</button></li>
                          </ul>
                        </div>

                        {/* العمود الثالث: خدماتنا */}
                        <div>
                          <h4 className="text-amber-300 font-bold text-xs sm:text-sm mb-3 sm:mb-4 uppercase tracking-wider">خدماتنا</h4>
                          <ul className="space-y-2.5 text-xs sm:text-sm text-neutral-400">
                            <li className="flex items-center gap-2"><Printer className="h-3.5 w-3.5 text-amber-400/50 shrink-0" /> طباعة مستند</li>
                            <li className="flex items-center gap-2"><span className="text-amber-400/50 shrink-0">📄</span> نسخ مستندات</li>
                            <li className="flex items-center gap-2"><span className="text-amber-400/50 shrink-0">🖼️</span> طباعة صور</li>
                            <li className="flex items-center gap-2"><span className="text-amber-400/50 shrink-0">📚</span> تجليد</li>
                            <li className="flex items-center gap-2"><span className="text-amber-400/50 shrink-0">🪪</span> بطاقات</li>
                            <li className="flex items-center gap-2"><span className="text-amber-400/50 shrink-0">📜</span> ملصقات</li>
                          </ul>
                        </div>

                        {/* العمود الرابع: تواصل معنا */}
                        <div>
                          <h4 className="text-amber-300 font-bold text-xs sm:text-sm mb-3 sm:mb-4 uppercase tracking-wider">تواصل معنا</h4>
                          <ul className="space-y-3 text-xs sm:text-sm">
                            {shop?.address && (
                              <li className="flex items-start gap-2 text-neutral-400">
                                <MapPin className="h-3.5 w-3.5 text-amber-400/50 shrink-0 mt-0.5" />
                                <span>{shop.address}</span>
                              </li>
                            )}
                            {displayPhone && (
                              <li className="flex items-center gap-2 text-neutral-400">
                                <Phone className="h-3.5 w-3.5 text-amber-400/50 shrink-0" />
                                <span dir="ltr">{displayPhone}</span>
                              </li>
                            )}
                            {shop?.email && (
                              <li className="flex items-center gap-2 text-neutral-400">
                                <Mail className="h-3.5 w-3.5 text-amber-400/50 shrink-0" />
                                <span>{shop.email}</span>
                              </li>
                            )}
                            <li className="flex items-start gap-2 pt-2.5 border-t border-white/8">
                              <Clock className="h-3.5 w-3.5 text-amber-400/50 shrink-0 mt-0.5" />
                              <div className="text-neutral-400">
                                <div>السبت - الخميس: 8:00 ص — 7:00 م</div>
                                <div className="text-neutral-500 text-[11px] mt-0.5">الجمعة: مغلق</div>
                              </div>
                            </li>
                          </ul>
                        </div>
                      </div>

                      {/* حقوق النشر */}
                      <div className="mt-8 sm:mt-10 pt-6 border-t border-white/8 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] sm:text-xs text-neutral-500">
                        <div>© {new Date().getFullYear()} {shop?.name || "المتجر"} — جميع الحقوق محفوظة</div>
                        <div className="flex items-center gap-1">
                          <span>مدعوم بـ</span>
                          <span className="text-amber-400/70 font-semibold">طيف</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </footer>
            )}
          </main>

          <MobileBottomNav />
          <OrderSuccess order={createdOrder} open={!!createdOrder} onClose={handleCloseOrderSuccess} onNavigate={(v) => { if (v === "new") setFooterOpen(false); setView(v as View); }} />
          <AdminGate open={adminGateOpen} onClose={() => setAdminGateOpen(false)} onSuccess={handleAdminUnlock} />
          <BackToTop />
          <FloatingAssistant onRepeatOrder={() => setView("repeat")} />
          <QuickActions />
          <SonnerToaster position="top-center" dir="rtl" />
        </div>
      </LayoutGroup>
    </>
  );
}