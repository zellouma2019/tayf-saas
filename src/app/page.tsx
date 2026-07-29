"use client";

import { ThemeToggle } from "@/components/app/theme-toggle";
import ExpenseBudgetTracker from "@/components/app/expense-budget-tracker";
import CustomerFeedbackChart from "@/components/app/customer-feedback-chart";
import InventoryStockWidget from "@/components/app/inventory-stock-widget";
import OrderPriorityQueue from "@/components/app/order-priority-queue";
import ShopComparisonWidget from "@/components/app/shop-comparison-widget";

export default function Page() {
  return (
    <div dir="rtl" className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🖨️</span>
            <h1 className="text-lg font-black text-foreground">Tayf — مكونات الجولة 41</h1>
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        {/* Row 1: Budget Tracker + Customer Feedback */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ExpenseBudgetTracker />
          <CustomerFeedbackChart />
        </div>

        {/* Row 2: Inventory Stock */}
        <InventoryStockWidget />

        {/* Row 3: Order Priority Queue */}
        <OrderPriorityQueue />

        {/* Row 4: Shop Comparison */}
        <ShopComparisonWidget />
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-border bg-card/50">
        <div className="max-w-6xl mx-auto px-4 py-4 text-center">
          <p className="text-xs text-muted-foreground">
            Tayf SaaS Platform — 5 مكونات جديدة (الجولة 41)
          </p>
        </div>
      </footer>
    </div>
  );
}
