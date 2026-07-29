"use client";

import { motion } from "framer-motion";

interface BudgetCategory {
  name: string;
  allocated: number;
  spent: number;
}

const BUDGET_CATEGORIES: BudgetCategory[] = [
  { name: "المواد الخام", allocated: 150000, spent: 98000 },
  { name: "الصيانة", allocated: 30000, spent: 27000 },
  { name: "الرواتب", allocated: 200000, spent: 200000 },
  { name: "التسويق", allocated: 25000, spent: 8500 },
];

function getBarColor(percentage: number) {
  if (percentage > 90) return "bg-red-500";
  if (percentage >= 75) return "bg-amber-500";
  return "bg-emerald-500";
}

function getBarTrackDark(percentage: number) {
  if (percentage > 90) return "bg-red-500/20";
  if (percentage >= 75) return "bg-amber-500/20";
  return "bg-emerald-500/20";
}

function formatCurrency(amount: number) {
  return amount.toLocaleString("ar-DZ") + " د.ج";
}

export default function ExpenseBudgetTracker() {
  const totalAllocated = BUDGET_CATEGORIES.reduce((s, c) => s + c.allocated, 0);
  const totalSpent = BUDGET_CATEGORIES.reduce((s, c) => s + c.spent, 0);
  const totalPercentage = Math.round((totalSpent / totalAllocated) * 100);

  return (
    <div className="bg-card border border-border rounded-2xl p-5 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-lg">
            💰
          </div>
          <div>
            <h3 className="font-bold text-foreground text-sm">تتبّع الميزانية</h3>
            <p className="text-xs text-muted-foreground">الشهر الحالي</p>
          </div>
        </div>
        <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-muted text-muted-foreground">
          {totalPercentage}%
        </span>
      </div>

      {/* Category rows */}
      <div className="space-y-4">
        {BUDGET_CATEGORIES.map((cat, idx) => {
          const pct = Math.round((cat.spent / cat.allocated) * 100);
          return (
            <div key={cat.name}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-medium text-foreground">{cat.name}</span>
                <span className="text-xs text-muted-foreground">
                  {formatCurrency(cat.spent)} / {formatCurrency(cat.allocated)}
                </span>
              </div>
              <div className="relative h-2.5 rounded-full bg-muted overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(pct, 100)}%` }}
                  transition={{ duration: 0.8, delay: idx * 0.15, ease: "easeOut" }}
                  className={`absolute inset-y-0 start-0 rounded-full ${getBarColor(pct)}`}
                />
              </div>
              <div className="flex justify-end mt-1">
                <span className={`text-[11px] font-semibold ${pct > 90 ? "text-red-500 dark:text-red-400" : pct >= 75 ? "text-amber-500 dark:text-amber-400" : "text-emerald-500 dark:text-emerald-400"}`}>
                  {pct}%
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Divider */}
      <div className="border-t border-border" />

      {/* Total summary */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-bold text-foreground">إجمالي الميزانية</span>
          <span className="text-xs text-muted-foreground">
            {formatCurrency(totalSpent)} / {formatCurrency(totalAllocated)}
          </span>
        </div>
        <div className="relative h-3 rounded-full bg-muted overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(totalPercentage, 100)}%` }}
            transition={{ duration: 1, delay: 0.6, ease: "easeOut" }}
            className={`absolute inset-y-0 start-0 rounded-full ${getBarColor(totalPercentage)}`}
          />
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-muted-foreground">
            المتبقي: {formatCurrency(totalAllocated - totalSpent)}
          </span>
          <span className={`text-xs font-bold ${totalPercentage > 90 ? "text-red-500 dark:text-red-400" : totalPercentage >= 75 ? "text-amber-500 dark:text-amber-400" : "text-emerald-500 dark:text-emerald-400"}`}>
            {totalPercentage}% مستهلك
          </span>
        </div>
      </div>
    </div>
  );
}
