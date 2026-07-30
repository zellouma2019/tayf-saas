"use client";

import { motion } from "framer-motion";
import { Star, Award, Briefcase, CheckCircle2 } from "lucide-react";

const employees = [
  { name: "أحمد محمد", role: "طباعة", rating: 4.8, orders: 156, completion: 98, initials: "أم" },
  { name: "فاطمة علي", role: "تصميم", rating: 4.6, orders: 134, completion: 95, initials: "فأ" },
  { name: "محمد خالد", role: "تجليد", rating: 4.5, orders: 98, completion: 92, initials: "مخ" },
  { name: "سارة أحمد", role: "خدمة عملاء", rating: 4.7, orders: 189, completion: 97, initials: "سأ" },
  { name: "يوسف عمر", role: "طباعة", rating: 4.3, orders: 112, completion: 90, initials: "يع" },
];

const avatarColors = [
  "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  "bg-violet-500/15 text-violet-600 dark:text-violet-400",
  "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  "bg-rose-500/15 text-rose-600 dark:text-rose-400",
  "bg-cyan-500/15 text-cyan-600 dark:text-cyan-400",
];

function StarRating({ rating }: { rating: number }) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${
            i < full
              ? "fill-amber-400 text-amber-400"
              : i === full && half
                ? "fill-amber-400/50 text-amber-400"
                : "fill-none text-border"
          }`}
        />
      ))}
    </div>
  );
}

function CompletionBar({ pct }: { pct: number }) {
  const color = pct >= 95 ? "#10b981" : pct >= 90 ? "#f59e0b" : "#ef4444";
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-border">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
      <span className="text-xs font-semibold" style={{ color }}>{pct}% إنجاز</span>
    </div>
  );
}

export default function EmployeePerformanceChart() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="rounded-2xl border border-border bg-card p-6 shadow-sm"
    >
      <div className="mb-5 flex items-center gap-2">
        <Award className="h-5 w-5 text-violet-500" />
        <h3 className="text-lg font-bold text-foreground">أداء الموظفين</h3>
      </div>

      <div className="flex flex-col gap-3">
        {employees.map((emp, i) => {
          const isTop = i === 0;

          return (
            <motion.div
              key={emp.name}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + i * 0.08 }}
              className={`relative flex items-center gap-3 rounded-xl border p-3.5 transition-colors hover:bg-muted/50 ${
                isTop ? "border-amber-500/30 bg-amber-500/5" : "border-border"
              }`}
            >
              {/* Best employee badge */}
              {isTop && (
                <span className="absolute -top-2.5 right-4 flex items-center gap-1 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
                  <Award className="h-3 w-3" />
                  أفضل موظف
                </span>
              )}

              {/* Avatar */}
              <div
                className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold ${avatarColors[i]}`}
              >
                {emp.initials}
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{emp.name}</p>
                    <div className="mt-0.5 flex items-center gap-2">
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Briefcase className="h-3 w-3" />
                        {emp.role}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <CheckCircle2 className="h-3 w-3" />
                        {emp.orders} طلب
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <div className="flex items-center gap-1">
                      <StarRating rating={emp.rating} />
                      <span className="text-sm font-bold text-foreground">{emp.rating}</span>
                    </div>
                    <CompletionBar pct={emp.completion} />
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
