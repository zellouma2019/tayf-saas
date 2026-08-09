"use client";

import { useMemo } from "react";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDA } from "@/lib/print-config";
import { Button } from "@/components/ui/button";

interface Expense {
  id: string;
  category: string;
  amount: number;
  description: string | null;
  date: string;
}

const DISPLAY_CATEGORIES = [
  { key: "materials",   label: "مواد طباعة", emoji: "📄", color: "bg-sky-500" },
  { key: "maintenance", label: "صيانة",       emoji: "🔧", color: "bg-amber-500" },
  { key: "rent",        label: "إيجار",        emoji: "🏠", color: "bg-violet-500" },
  { key: "electricity", label: "كهرباء",      emoji: "⚡", color: "bg-yellow-500" },
  { key: "other",       label: "أخرى",         emoji: "📦", color: "bg-zinc-400 dark:bg-zinc-500" },
];

function mapCategory(raw: string): string {
  if (raw === "paper" || raw === "ink") return "materials";
  if (raw === "maintenance") return "maintenance";
  if (raw === "rent") return "rent";
  return "other";
}

export function ExpenseCategoriesBreakdown({ expenses, onAddExpense }: { expenses: Expense[]; onAddExpense?: () => void }) {
  const breakdown = useMemo(() => {
    const totals: Record<string, number> = {};
    let grandTotal = 0;
    for (const exp of expenses) {
      const cat = mapCategory(exp.category);
      totals[cat] = (totals[cat] || 0) + exp.amount;
      grandTotal += exp.amount;
    }
    return { totals, grandTotal };
  }, [expenses]);

  const { totals, grandTotal } = breakdown;

  if (expenses.length === 0) {
    return (
      <div className="bg-card border border-border rounded-xl p-8 text-center">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-muted/50 flex items-center justify-center mb-3"><span className="text-2xl">💰</span></div>
        <p className="text-sm font-medium text-foreground mb-1">لا توجد مصاريف مسجّلة</p>
        <p className="text-xs text-muted-foreground mb-4">أضف مصروفك الأول لتتبع الإنفاق</p>
        {onAddExpense && (<Button size="sm" onClick={onAddExpense} className="gap-1.5"><Plus className="h-3.5 w-3.5" />إضافة مصروف</Button>)}
      </div>
    );
  }

  const maxAmount = Math.max(...Object.values(totals), 1);

  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-3">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">توزيع المصاريف حسب الفئة</h3>
      <div className="space-y-2.5">
        {DISPLAY_CATEGORIES.map((cat) => {
          const amount = totals[cat.key] || 0;
          if (amount === 0) return null;
          const pct = grandTotal > 0 ? Math.round((amount / grandTotal) * 100) : 0;
          const barWidth = Math.max(2, Math.round((amount / maxAmount) * 100));
          return (
            <div key={cat.key} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2"><span>{cat.emoji}</span><span className="font-medium text-foreground">{cat.label}</span></div>
                <div className="flex items-center gap-2"><span className="text-xs text-muted-foreground">{pct}%</span><span className="font-semibold tabular-nums text-foreground">{formatDA(amount)}</span></div>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div className={cn("h-full rounded-full transition-all duration-500", cat.color)} style={{ width: `${barWidth}%` }} />
              </div>
            </div>
          );
        })}
      </div>
      <div className="pt-2 border-t border-border flex items-center justify-between">
        <span className="text-sm font-semibold text-foreground">إجمالي المصاريف</span>
        <span className="text-base font-bold tabular-nums text-rose-600 dark:text-rose-400">{formatDA(grandTotal)}</span>
      </div>
    </div>
  );
}
