"use client";

import { ThemeToggle } from "@/components/app/theme-toggle";
import OrderAnalyticsDeepDive from "@/components/app/order-analytics-deep-dive";
import MerchantRevenueBreakdown from "@/components/app/merchant-revenue-breakdown";
import DeliveryPerformanceWidget from "@/components/app/delivery-performance-widget";
import CouponManagementWidget from "@/components/app/coupon-management-widget";
import DailySalesSummary from "@/components/app/daily-sales-summary";

export default function Page() {
  return (
    <div dir="rtl" className="min-h-screen flex flex-col bg-background">
      {/* Top bar */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🖨️</span>
            <h1 className="text-lg font-black text-foreground">Tayf — مكونات الجولة 42</h1>
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-6xl mx-auto px-4 py-8 space-y-6 flex-1">
        {/* Row 1: Order Analytics (full width) */}
        <OrderAnalyticsDeepDive />

        {/* Row 2: Revenue Breakdown + Daily Sales */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <MerchantRevenueBreakdown />
          <DailySalesSummary />
        </div>

        {/* Row 3: Delivery Performance + Coupon Management */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <DeliveryPerformanceWidget />
          <CouponManagementWidget />
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-border bg-card/50">
        <div className="max-w-6xl mx-auto px-4 py-4 text-center">
          <p className="text-xs text-muted-foreground">
            Tayf SaaS Platform — 5 مكونات جديدة (الجولة 42)
          </p>
        </div>
      </footer>
    </div>
  );
}
// vercel build trigger 1785338186
