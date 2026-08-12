"use client";

import { useCallback, useState, useSyncExternalStore } from "react";
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
import { ThemeToggle } from "@/components/app/theme-toggle";
import { Intro } from "@/components/app/intro";
import { LiveClock } from "@/components/app/live-clock";
import { NotificationBadge } from "@/components/app/notification-badge";
import { QuickPriceCalculator } from "@/components/app/quick-price-calculator";
import { FloatingActions } from "@/components/app/floating-actions";
import { MobileBottomNav } from "@/components/app/mobile-bottom-nav";
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
  const [calcDialogOpen, setCalcDialogOpen] = useState(false);

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
          {/* Promo Banner */}
          {view !== "new" && (
            <div className="bg-primary text-primary-foreground">
              <div className="max-w-7xl mx-auto px-3 sm:px-4 h-8 sm:h-9 flex items-center justify-between gap-2">
                <div className="flex sm:hidden items-center gap-1.5 text-xs min-w-0">
                  <Zap className="h-3 w-3 shrink-0" />
                  <span className="truncate font-semibold font-heading">اطلب خلال دقيقة</span>
                </div>
                <div className="hidden sm:flex items-center gap-4 md:gap-6 overflow-hidden text-xs">
                  <span className="flex items-center gap-1.5 whitespace-nowrap font-semibold">
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
                  <a href={`tel:${displayPhone.replace(/\s/g, "")}`} className="flex items-center gap-1 hover:bg-primary-foreground/15 transition-colors whitespace-nowrap shrink-0 text-xs rounded-full px-3 py-1 bg-primary-foreground/10">
                    <Phone className="h-3 w-3 shrink-0" />
                    <span className="hidden sm:inline font-semibold">{displayPhone}</span>
                    <span className="sm:hidden font-semibold">اتصل بنا</span>
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Main Header */}
          <header className="bg-background/80 backdrop-blur-xl border-b border-border/40 sticky top-0 z-40 no-print">
            <div className="max-w-7xl mx-auto px-3 sm:px-4 h-14 md:h-16 flex items-center justify-between gap-2">
              {/* Logo & Name */}
              <button onClick={() => setView("new")} className="flex items-center gap-2.5 sm:gap-3 shrink-0 min-w-0 group">
                <div className="w-10 h-10 md:w-11 md:h-11 rounded-xl bg-primary flex items-center justify-center shrink-0 shadow-lg shadow-primary/20 group-hover:shadow-primary/30 transition-shadow">
                  <Printer className="h-5 w-5 md:h-5.5 md:w-5.5 text-primary-foreground" />
                </div>
                <div className="text-right min-w-0">
                  <div className="font-bold font-heading text-sm md:text-base leading-tight truncate text-foreground">{shop?.name || "المتجر"}</div>
                  <div className="text-[11px] text-muted-foreground leading-tight truncate">الطباعة تبدأ قبل وصولك</div>
                </div>
              </button>

              <LiveClock />

              {/* Desktop Nav */}
              <nav className="hidden md:flex items-center gap-0.5 bg-muted/50 rounded-full p-1 border border-border/30">
                {navItems.map((item) => (
                  <button key={item.key} onClick={() => handleNavClick(item.key)} className={`relative flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold font-heading transition-colors ${view === item.key ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-background/50"}`}>
                    {view === item.key && (
                      <motion.div layoutId="nav-active-desktop" className="absolute inset-0 bg-primary rounded-full shadow-md" style={{ zIndex: -1 }} transition={{ type: "spring", stiffness: 400, damping: 30 }} />
                    )}
                    <item.icon className="h-4 w-4 relative z-10" />
                    <span className="relative z-10">{item.label}</span>
                  </button>
                ))}
              </nav>

              {/* Mobile Nav Only */}
              <nav className="flex md:hidden items-center gap-0.5 bg-muted/50 rounded-full p-0.5 shrink-0 border border-border/30">
                {navItems.map((item) => (
                  <button key={item.key} onClick={() => handleNavClick(item.key)} className={`relative flex items-center justify-center w-8 h-8 rounded-full transition-colors ${view === item.key ? "text-primary-foreground" : "text-muted-foreground"}`} aria-label={item.label}>
                    {view === item.key && (
                      <motion.div layoutId="nav-active-mobile" className="absolute inset-0 bg-primary rounded-full shadow-sm" style={{ zIndex: -1 }} transition={{ type: "spring", stiffness: 400, damping: 30 }} />
                    )}
                    <item.icon className="h-4 w-4 relative z-10" />
                  </button>
                ))}
              </nav>

              {/* Tool Buttons */}
              <div className="flex items-center gap-1 shrink-0">
                <Button variant="ghost" size="icon" onClick={() => setCalcDialogOpen(true)} className="relative h-9 w-9" aria-label="حاسبة الأسعار">
                  <Calculator className="h-4 w-4" />
                </Button>
                <NotificationBadge />
                <ThemeToggle />
              </div>
            </div>
          </header>

          {/* Price Calculator */}
          <Dialog open={calcDialogOpen} onOpenChange={setCalcDialogOpen}>
            <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>حاسبة الأسعار السريعة</DialogTitle>
              </DialogHeader>
              <QuickPriceCalculator />
            </DialogContent>
          </Dialog>

          {/* Content */}
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

            {/* Compact Footer — always visible, no toggle, no overflow hidden */}
            {view !== "admin" && (
              <footer className="mt-auto no-print border-t border-border/30 bg-muted/10">
                <div className="max-w-5xl mx-auto px-3 sm:px-4 py-3 sm:py-3.5">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
                    {/* Shop info */}
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                        <Store className="h-3 w-3 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold font-heading text-foreground truncate">{shop?.name || "المتجر"}</div>
                        {shop?.address && (
                          <div className="text-[10px] text-muted-foreground truncate flex items-center gap-1">
                            <MapPin className="h-2.5 w-2.5 shrink-0" />
                            <span className="truncate">{shop.address}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Contact + Hours + Copyright */}
                    <div className="flex items-center gap-3 sm:gap-4 text-muted-foreground">
                      <div className="flex items-center gap-2">
                        {displayWhatsapp && (
                          <a href={`https://wa.me/${displayWhatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="w-7 h-7 rounded-lg hover:bg-emerald-500/10 border border-border/30 flex items-center justify-center transition-colors" aria-label="واتساب">
                            <MessageCircle className="h-3.5 w-3.5 text-emerald-500" />
                          </a>
                        )}
                        {displayPhone && (
                          <a href={`tel:${displayPhone.replace(/\s/g, "")}`} className="w-7 h-7 rounded-lg hover:bg-primary/10 border border-border/30 flex items-center justify-center transition-colors" aria-label="اتصل">
                            <Phone className="h-3.5 w-3.5 text-primary" />
                          </a>
                        )}
                        {shop?.email && (
                          <a href={`mailto:${shop.email}`} className="hidden sm:flex w-7 h-7 rounded-lg hover:bg-sky-500/10 border border-border/30 items-center justify-center transition-colors" aria-label="بريد إلكتروني">
                            <Mail className="h-3.5 w-3.5 text-sky-500" />
                          </a>
                        )}
                      </div>

                      <div className="hidden sm:flex items-center gap-1 text-[10px]">
                        <Clock className="h-3 w-3" />
                        <span>السبت - الخميس: 8ص — 7م</span>
                      </div>

                      <div className="text-[10px] text-muted-foreground/60 whitespace-nowrap">
                        مدعوم بـ <span className="text-primary font-bold font-heading">طيف</span> © {new Date().getFullYear()}
                      </div>
                    </div>
                  </div>
                </div>
              </footer>
            )}
          </main>

          <FloatingActions />
          <MobileBottomNav />
          <OrderSuccess order={createdOrder} open={!!createdOrder} onClose={handleCloseOrderSuccess} onNavigate={(v) => setView(v as View)} />
          <AdminGate open={adminGateOpen} onClose={() => setAdminGateOpen(false)} onSuccess={handleAdminUnlock} />
          <SonnerToaster position="top-center" dir="rtl" />
        </div>
      </LayoutGroup>
    </>
  );
}