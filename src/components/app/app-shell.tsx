"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import {
  Menu,
  Home,
  ArrowLeftToLine,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { RepeatOrder } from "@/components/app/repeat-order";
import { TrackOrder } from "@/components/app/track-order";
import { OrderSuccess } from "@/components/app/order-success";
import { NotificationBadge } from "@/components/app/notification-badge";
import { Intro } from "@/components/app/intro";
import { MobileSidebar } from "@/components/app/mobile-sidebar";
import { BackToTop } from "@/components/app/back-to-top";
import { MobileBottomNav } from "@/components/app/mobile-bottom-nav";
import { useAppStore, type View } from "@/lib/store";
import type { CreatedOrder } from "@/lib/store";
import type { PrintOrderLite } from "@/lib/order-types";

const NewOrderWizard = dynamic(() => import("@/components/app/new-order-wizard").then(m => ({ default: m.NewOrderWizard })), { loading: () => <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" /></div> });
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
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const {
    view,
    setView,
    createdOrder,
    setCreatedOrder,
    prefillOrder,
    setPrefillOrder,
    pendingFile,
    setPendingFile,
    refreshKey,
    incrementRefresh,
    showIntro,
    setShowIntro,
    showAdminLink,
  } = useAppStore();

  // Derive shopName directly from prop — no effect needed
  const shopName = propShopName || "مطبعة الذكي";

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
      setView(key);
    },
    [setView],
  );

  const handleCloseOrderSuccess = useCallback(() => {
    setCreatedOrder(null);
    incrementRefresh();
  }, [setCreatedOrder, incrementRefresh]);

  return (
    <>
    {showIntro && <Intro onFinish={() => setShowIntro(false)} />}
    <LayoutGroup>
      <div className="customer-shell min-h-screen flex flex-col bg-[#FFFBEB]" dir="rtl">

      {/* ===== Sticky Header with Glass Effect ===== */}
      <header className="sticky top-0 z-40 no-print bg-white/80 backdrop-blur-xl border-b border-yellow-100/60">
        <div className="max-w-md mx-auto px-4 h-12 flex items-center justify-between gap-3">
          {/* Right side: Logo + Shop name */}
          <button
            onClick={() => setView("new")}
            className="flex items-center gap-2 shrink-0 min-w-0"
          >
            <div className="w-8 h-8 rounded-full bg-neutral-900 flex items-center justify-center shrink-0 overflow-hidden">
              {shopLogo ? (
                <img src={shopLogo} alt="" className="w-full h-full object-contain p-0.5" />
              ) : (
                <span className="text-white text-[10px] font-bold">ط</span>
              )}
            </div>
            <div className="text-right min-w-0">
              <div className="font-bold text-sm leading-tight truncate text-neutral-900" style={{ fontFamily: 'var(--font-alexandria)' }}>{shopName}</div>
              <div className="text-[10px] text-neutral-500 leading-tight truncate">
                خدمة طباعة احترافية
              </div>
            </div>
          </button>

          {/* Left side: Home + Bell + Menu */}
          <div className="flex items-center gap-0.5 shrink-0">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-neutral-500" onClick={() => setView("new")} aria-label="الرئيسية">
              <Home className="h-4 w-4" />
            </Button>
            <NotificationBadge />
            <Button variant="ghost" size="icon" className="h-8 w-8 text-neutral-500" onClick={() => setMobileSidebarOpen(true)} aria-label="القائمة">
              <Menu className="h-[18px] w-[18px]" />
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile sidebar */}
      <MobileSidebar
        open={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
        onNavClick={handleNavClick}
        onCalcOpen={() => {}}
      />

      {/* ===== Main Content ===== */}
      <main className="flex-1 flex flex-col pb-24">
        <div className="max-w-md mx-auto w-full px-4">
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
          </AnimatePresence>
        </div>
      </main>

      {/* ===== Bottom Navigation ===== */}
      <MobileBottomNav />

      {/* ===== Floating Action Button ===== */}
      <button
        className="fixed bottom-16 right-3 z-50 w-10 h-10 rounded-full bg-yellow-400 hover:bg-yellow-500 text-neutral-900 shadow-lg shadow-yellow-400/30 flex items-center justify-center transition-colors no-print"
        aria-label="مساعد ذكي"
        onClick={() => useAppStore.getState().setAssistantOpen(true)}
      >
        <Sparkles className="h-4 w-4" />
        {/* Red notification dot */}
        <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-red-500 border-2 border-white" />
      </button>

      {/* ===== Order Success Dialog ===== */}
      <OrderSuccess order={createdOrder} open={!!createdOrder} onClose={handleCloseOrderSuccess} onNavigate={(v) => setView(v as View)} />

      {/* ===== Admin Link ===== */}
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

      <BackToTop />
      <FloatingAssistant onRepeatOrder={() => setView("repeat")} />

      <SonnerToaster position="top-center" dir="rtl" />
      </div>
    </LayoutGroup>
    </>
  );
}
