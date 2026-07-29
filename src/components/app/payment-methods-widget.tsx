"use client";

import { useEffect, useState } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { Wallet, AlertTriangle, ArrowUpLeft } from "lucide-react";
import { cn } from "@/lib/utils";

const METHODS = [
  { name: "نقدي", icon: "💵", pct: 45, amount: 125000 },
  { name: "بطاقة", icon: "💳", pct: 30, amount: 83000 },
  { name: "تحويل", icon: "📱", pct: 18, amount: 50000 },
  { name: "دفع إلكتروني", icon: "🌐", pct: 7, amount: 19000 },
];

const TOTAL = METHODS.reduce((a, m) => a + m.amount, 0);
const PENDING = { count: 3, amount: 12500 };

const TRANSACTIONS = [
  { name: "محمد بن علي", amount: "2,500 د.ج", method: "بطاقة", time: "منذ 5 دقائق" },
  { name: "شركة النور", amount: "15,000 د.ج", method: "تحويل", time: "منذ 30 دقيقة" },
  { name: "فاطمة الزهراء", amount: "800 د.ج", method: "نقدي", time: "منذ ساعة" },
];

function AnimatedTotal({ target }: { target: number }) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (v) => Math.round(v));
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const unsub = rounded.on("change", (v) => setDisplay(v));
    animate(count, target, { duration: 1.4, ease: "easeOut" });
    return unsub;
  }, [target, count, rounded]);

  return <span>{display.toLocaleString("ar-DZ")}</span>;
}

function MiniRing({ pct, size = 48, strokeWidth = 5, colorClass }: { pct: number; size?: number; strokeWidth?: number; colorClass: string }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <svg width={size} height={size} className="transform -rotate-90 shrink-0">
      <circle cx={size / 2} cy={size / 2} r={radius} className="stroke-muted/50 dark:stroke-muted/30" strokeWidth={strokeWidth} fill="none" />
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        className={cn("stroke-current", colorClass)}
        strokeWidth={strokeWidth}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={circumference}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1, ease: "easeOut" }}
      />
    </svg>
  );
}

const ringColors = [
  "text-emerald-500 dark:text-emerald-400",
  "text-sky-500 dark:text-sky-400",
  "text-violet-500 dark:text-violet-400",
  "text-amber-500 dark:text-amber-400",
];

export default function PaymentMethodsWidget() {
  return (
    <div className="rounded-xl border border-border bg-card shadow-sm p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Wallet className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-bold text-foreground">طرق الدفع</h3>
        </div>
        <div className="text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full font-bold">
          <AnimatedTotal target={TOTAL} /> د.ج
        </div>
      </div>

      {/* Pending alert */}
      <motion.div
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-2 mb-4 px-3 py-2 rounded-lg bg-amber-500/10 dark:bg-amber-400/10 border border-amber-500/20 dark:border-amber-400/20"
      >
        <AlertTriangle className="h-4 w-4 text-amber-500 dark:text-amber-400 shrink-0" />
        <span className="text-xs text-amber-700 dark:text-amber-300">
          {PENDING.count} مدفوعات معلقة — {PENDING.amount.toLocaleString("ar-DZ")} د.ج
        </span>
      </motion.div>

      {/* Payment method cards 2×2 */}
      <div className="grid grid-cols-2 gap-3 mb-5" dir="rtl">
        {METHODS.map((m, i) => (
          <motion.div
            key={m.name}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1, duration: 0.35 }}
            className="flex items-center gap-3 p-3 rounded-xl border border-border bg-muted/20 hover:bg-muted/40 transition-colors"
          >
            <div className="relative">
              <MiniRing pct={m.pct} colorClass={ringColors[i]} />
              <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-foreground">
                {m.pct}%
              </span>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1 mb-0.5">
                <span className="text-sm">{m.icon}</span>
                <span className="text-xs font-semibold text-foreground truncate">{m.name}</span>
              </div>
              <span className="text-[10px] text-muted-foreground block tabular-nums">
                {m.amount.toLocaleString("ar-DZ")} د.ج
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Recent transactions */}
      <div dir="rtl">
        <h4 className="text-xs font-bold text-foreground mb-2 flex items-center gap-1.5">
          <ArrowUpLeft className="h-3.5 w-3.5" />
          آخر المعاملات
        </h4>
        <div className="space-y-2">
          {TRANSACTIONS.map((tx, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + i * 0.1, duration: 0.3 }}
              className="flex items-center justify-between py-2 border-b border-border last:border-0"
            >
              <div>
                <span className="text-xs font-medium text-foreground block">{tx.name}</span>
                <span className="text-[10px] text-muted-foreground">{tx.method} · {tx.time}</span>
              </div>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{tx.amount}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
