"use client";

import { useState, useEffect, useCallback } from "react";
import { LogOut, LayoutDashboard, Settings, RefreshCw, Download, Plus, Crown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { LoginGate } from "@/components/app/admin-login-gate";
import { OverviewTab } from "@/components/app/admin-overview-tab";
import { PlatformSettingsTab } from "@/components/app/admin-platform-settings";
import { ThemeToggle } from "@/components/app/theme-toggle";
import { clearSession } from "@/lib/admin-utils";
import type { GlobalStats } from "@/lib/admin-types";

const EMPTY_STATS: GlobalStats = {
  totalOrders: 0,
  totalRevenue: 0,
  todayOrders: 0,
  shopCount: 0,
  activeShopCount: 0,
  statusCounts: {},
  shopStats: [],
  recentOrders: [],
};

export default function SuperAdminPage() {
  const [unlocked, setUnlocked] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [stats, setStats] = useState<GlobalStats>(EMPTY_STATS);
  const [lastUpdated, setLastUpdated] = useState("");
  const [loading, setLoading] = useState(true);

  /* ── Fetch global stats ── */
  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/global-stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data);
        setLastUpdated(new Date().toLocaleTimeString("ar-SA"));
      }
    } catch {
      toast.error("فشل تحميل الإحصائيات");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (unlocked) {
      setLoading(true);
      fetchStats();
    }
  }, [unlocked, fetchStats]);

  /* ── Unlock handler ── */
  const handleUnlock = useCallback(() => {
    setUnlocked(true);
  }, []);

  /* ── Logout ── */
  const handleLogout = useCallback(() => {
    clearSession();
    setUnlocked(false);
    setActiveTab("overview");
    setStats(EMPTY_STATS);
    setLastUpdated("");
    toast.success("تم تسجيل الخروج");
  }, []);

  /* ── Export (placeholder — triggers browser print for now) ── */
  const handleExport = useCallback(() => {
    toast.info("جارٍ تصدير التقرير…");
  }, []);

  /* ── Gate: show login until authenticated ── */
  if (!unlocked) {
    return <LoginGate onUnlock={handleUnlock} />;
  }

  return (
    <div className="h-screen overflow-auto bg-background flex flex-col" dir="rtl">
      {/* ── Header ── */}
      <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="flex items-center justify-between px-4 sm:px-6 h-14">
          {/* Branding */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#d4a853] to-[#b8923a] flex items-center justify-center shadow-sm shadow-[#d4a853]/20">
              <Crown className="h-4 w-4 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-foreground leading-tight">
                طيف — المدير العام
              </span>
              <span className="text-[10px] text-muted-foreground leading-tight">
                لوحة الإدارة المركزية
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1.5">
            <ThemeToggle />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 gap-1.5 text-xs"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">خروج</span>
            </Button>
          </div>
        </div>
      </header>

      {/* ── Main content ── */}
      <main className="flex-1 min-h-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="h-full flex flex-col"
            >
              {/* Tab bar */}
              <div className="px-4 sm:px-6 pt-4 pb-2">
                <TabsList className="bg-muted/60 h-10 p-1">
                  <TabsTrigger
                    value="overview"
                    className="gap-1.5 text-xs data-[state=active]:bg-[#d4a853] data-[state=active]:text-[#0a0a0b] data-[state=active]:shadow-sm"
                  >
                    <LayoutDashboard className="h-3.5 w-3.5" />
                    نظرة عامة
                  </TabsTrigger>
                  <TabsTrigger
                    value="settings"
                    className="gap-1.5 text-xs data-[state=active]:bg-[#d4a853] data-[state=active]:text-[#0a0a0b] data-[state=active]:shadow-sm"
                  >
                    <Settings className="h-3.5 w-3.5" />
                    إعدادات المنصة
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* Tab panels */}
              <div className="flex-1 min-h-0 overflow-auto px-4 sm:px-6 pb-6">
                <TabsContent value="overview" className="mt-0 h-full">
                  {loading ? (
                    <div className="flex items-center justify-center h-64">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      >
                        <RefreshCw className="h-5 w-5 text-[#d4a853]" />
                      </motion.div>
                    </div>
                  ) : (
                    <OverviewTab
                      stats={stats}
                      lastUpdated={lastUpdated}
                      onOpenCreate={() => {}}
                      adminName="المدير العام"
                      onRefresh={fetchStats}
                      onExport={handleExport}
                      onSwitchToSettings={() => setActiveTab("settings")}
                    />
                  )}
                </TabsContent>

                <TabsContent value="settings" className="mt-0 h-full">
                  <PlatformSettingsTab />
                </TabsContent>
              </div>
            </Tabs>
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
