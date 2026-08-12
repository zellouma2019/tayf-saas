"use client";

import { useCallback, useState, useSyncExternalStore } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Printer,
  MapPin,
  Phone,
  Mail,
  MessageCircle,
  RotateCcw,
  Search,
  Store,
  Check,
  Clock,
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
  const theme = getTheme(shop?.themeId || 1);

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

  const displayPhone = shop?.phone || "";
  const displayWhatsapp = shop?.whatsapp || shop?.phone || "";

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center animate-pulse" style={{ backgroundColor: theme.accent + "20" }}>
          <Printer className="h-5 w-5" style={{ color: theme.accent }} />
        </div>
      </div>
    );
  }

  return (
    <>
      {showIntro && <Intro onFinish={() => setShowIntro(false)} />}

      <div className="min-h-screen flex flex-col bg-background" dir="rtl">
        {/* ─── Store Header ─── */}
        <header
          className="bg-card border-b border-border sticky top-0 z-40"
          style={{ borderColor: theme.header.border }}
        >
          <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
            {/* Logo & Name */}
            <button onClick={() => setView("new")} className="flex items-center gap-3 shrink-0 min-w-0">
              <div
                className={`w-9 h-9 ${theme.logoStyle} flex items-center justify-center shrink-0`}
                style={{ backgroundColor: theme.accent + "15" }}
              >
                <Printer className="h-5 w-5" style={{ color: theme.logoIconColor }} />
              </div>
              <div className="text-right min-w-0">
                <h1 className="font-bold text-base leading-tight truncate text-foreground" style={{ color: theme.header.text }}>
                  {shop?.name || "المتجر"}
                </h1>
                <p className="text-[10px] text-muted-foreground leading-tight truncate">
                  {shop?.address || "مطبعة رقمية · طباعة أونلاين"}
                </p>
              </div>
            </button>

            <div className="flex items-center gap-2">
              <LiveClock />
              <Button
                size="sm"
                className="font-semibold shadow-sm"
                style={{ backgroundColor: theme.accent, color: theme.nav.activeText }}
                onClick={() => setView("new")}
              >
                <Plus className="h-4 w-4 ml-1" />
                طلب جديد
              </Button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="max-w-3xl mx-auto px-4">
            <div className="flex items-center gap-1 -mb-px">
              {(
                [
                  { key: "new" as View, label: "طلب جديد", icon: Plus },
                  { key: "repeat" as View, label: "تكرار طلب", icon: RotateCcw },
                  { key: "track" as View, label: "تتبّع", icon: Search },
                ] as const
              ).map((item) => (
                <button
                  key={item.key}
                  onClick={() => handleNavClick(item.key)}
                  className={`relative flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 ${
                    view === item.key
                      ? "font-bold"
                      : "text-muted-foreground hover:text-foreground border-transparent"
                  }`}
                  style={
                    view === item.key
                      ? { color: theme.accent, borderColor: theme.accent }
                      : undefined
                  }
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        </header>

        {/* Price Calculator Dialog */}
        <Dialog open={calcDialogOpen} onOpenChange={setCalcDialogOpen}>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>حاسبة الأسعار السريعة</DialogTitle>
            </DialogHeader>
            <QuickPriceCalculator />
          </DialogContent>
        </Dialog>

        {/* ─── Main Content ─── */}
        <main className="flex-1">
          <div className="max-w-3xl mx-auto w-full px-4 py-4 space-y-4 pb-28">
            <AnimatePresence mode="wait">
              {view === "new" && (
                <motion.div
                  key="view-new"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.2 }}
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
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.2 }}
                >
                  <RepeatOrder onRepeat={handleRepeat} />
                </motion.div>
              )}
              {view === "track" && (
                <motion.div
                  key="view-track"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.2 }}
                >
                  <TrackOrder key={refreshKey} />
                </motion.div>
              )}
              {view === "admin" && (
                <motion.div
                  key="view-admin"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.2 }}
                >
                  <AdminPanel key={refreshKey} onRefresh={incrementRefresh} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ─── Footer — Simple, clean, always visible ─── */}
          {view !== "admin" && (
            <footer
              className="border-t py-4 px-4 text-center text-[10px] text-muted-foreground mt-auto"
              style={{ borderColor: theme.footer.border }}
            >
              <p className="font-bold text-foreground text-xs mb-1">{shop?.name || "المتجر"}</p>
              <p className="mb-1">
                {shop?.address && (
                  <span className="inline-flex items-center gap-1 ml-3">
                    <MapPin className="h-3 w-3" />
                    {shop.address}
                  </span>
                )}
                {displayPhone && (
                  <a
                    href={`tel:${displayPhone.replace(/\s/g, "")}`}
                    className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
                  >
                    <Phone className="h-3 w-3" />
                    {displayPhone}
                  </a>
                )}
              </p>
              <div className="flex items-center justify-center gap-3 mt-2">
                {displayWhatsapp && (
                  <a
                    href={`https://wa.me/${displayWhatsapp.replace(/\D/g, "")}?text=${encodeURIComponent("مرحبا، أريد طلب طباعة.")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-emerald-500 hover:text-emerald-600 transition-colors"
                  >
                    <MessageCircle className="h-3 w-3" />
                    واتساب
                  </a>
                )}
                {shop?.email && (
                  <a
                    href={`mailto:${shop.email}`}
                    className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
                  >
                    <Mail className="h-3 w-3" />
                    {shop.email}
                  </a>
                )}
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  السبت - الخميس: 8ص — 7م
                </span>
              </div>
              <p className="mt-2 text-muted-foreground/60">
                مدعوم بـ <span className="font-bold" style={{ color: theme.accent }}>طيف</span> © {new Date().getFullYear()}
              </p>
            </footer>
          )}
        </main>

        {/* ─── Floating Actions (outside main to avoid clipping) ─── */}
        <FloatingActions />
        <MobileBottomNav />

        {/* ─── Dialogs ─── */}
        <OrderSuccess
          order={createdOrder}
          open={!!createdOrder}
          onClose={handleCloseOrderSuccess}
          onNavigate={(v) => setView(v as View)}
        />
        <AdminGate
          open={adminGateOpen}
          onClose={() => setAdminGateOpen(false)}
          onSuccess={handleAdminUnlock}
        />
        <SonnerToaster position="top-center" dir="rtl" />
      </div>
    </>
  );
}
