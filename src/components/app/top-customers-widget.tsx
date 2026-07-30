"use client";

import { motion } from "framer-motion";
import { Trophy, ShoppingBag, Banknote } from "lucide-react";

const customers = [
  { name: "شركة النور للإعلان", spent: 125000, orders: 32, medal: "🥇" },
  { name: "مؤسسة الأمل", spent: 98000, orders: 28, medal: "🥈" },
  { name: "مكتبة المعرفة", spent: 76000, orders: 21, medal: "🥉" },
  { name: "شركة الريان", spent: 65000, orders: 18, medal: null },
  { name: "مدرسة المستقبل", spent: 52000, orders: 15, medal: null },
  { name: "مطعم السلام", spent: 45000, orders: 12, medal: null },
];

const maxSpent = 125000;
const totalSpent = 461000;

function formatDZD(n: number) {
  return n.toLocaleString("ar-DZ");
}

const rankBg: Record<number, string> = {
  1: "bg-amber-500/10 border-amber-500/20",
  2: "bg-slate-200/60 border-slate-300/40 dark:bg-slate-700/30 dark:border-slate-600/30",
  3: "bg-orange-100/60 border-orange-200/50 dark:bg-orange-900/20 dark:border-orange-800/30",
};

export default function TopCustomersWidget() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="rounded-2xl border border-border bg-card p-6 shadow-sm"
    >
      <div className="mb-5 flex items-center gap-2">
        <Trophy className="h-5 w-5 text-amber-500" />
        <h3 className="text-lg font-bold text-foreground">أفضل العملاء</h3>
      </div>

      <div className="flex flex-col gap-2.5">
        {customers.map((c, i) => {
          const rank = i + 1;
          const barWidth = (c.spent / maxSpent) * 100;
          const bgClass = rank <= 3 ? rankBg[rank] : "border-transparent";

          return (
            <motion.div
              key={c.name}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + i * 0.07 }}
              className={`flex items-center gap-3 rounded-xl border p-3 transition-colors hover:bg-muted/50 ${bgClass}`}
            >
              {/* Rank */}
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center text-lg">
                {c.medal || (
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
                    {rank}
                  </span>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-semibold text-foreground">{c.name}</p>
                  <p className="flex items-center gap-1 text-sm font-bold text-foreground">
                    <Banknote className="h-3.5 w-3.5 text-emerald-500" />
                    {formatDZD(c.spent)} د.ج
                  </p>
                </div>
                <div className="mt-1.5 flex items-center gap-2">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-border">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-l from-emerald-500 to-emerald-400"
                      initial={{ width: 0 }}
                      animate={{ width: `${barWidth}%` }}
                      transition={{ duration: 0.8, delay: 0.2 + i * 0.08 }}
                    />
                  </div>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <ShoppingBag className="h-3 w-3" />
                    {c.orders} طلب
                  </span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Summary */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="mt-4 flex items-center justify-between rounded-xl bg-muted/50 px-4 py-3"
      >
        <span className="text-sm text-muted-foreground">إجمالي الإنفاق</span>
        <span className="text-base font-bold text-foreground">{formatDZD(totalSpent)} د.ج</span>
      </motion.div>
    </motion.div>
  );
}
