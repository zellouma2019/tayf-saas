"use client";

import { motion } from "framer-motion";

interface MaterialItem {
  name: string;
  icon: string;
  currentStock: number;
  maxStock: number;
  unit: string;
}

const MATERIALS: MaterialItem[] = [
  { name: "ورق A4", icon: "📄", currentStock: 850, maxStock: 1000, unit: "ورقة" },
  { name: "ورق A3", icon: "📋", currentStock: 420, maxStock: 500, unit: "ورقة" },
  { name: "ورق لاصق", icon: "🏷️", currentStock: 45, maxStock: 200, unit: "ورقة" },
  { name: "ورق صور", icon: "🖼️", currentStock: 180, maxStock: 300, unit: "ورقة" },
  { name: "حبر أسود", icon: "⬛", currentStock: 12, maxStock: 50, unit: "علبة" },
  { name: "حبر ملون", icon: "🎨", currentStock: 8, maxStock: 50, unit: "علبة" },
];

function getStockColor(pct: number) {
  if (pct < 30) return { bar: "bg-red-500", text: "text-red-500 dark:text-red-400", badge: "bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400" };
  if (pct <= 60) return { bar: "bg-amber-500", text: "text-amber-500 dark:text-amber-400", badge: "bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400" };
  return { bar: "bg-emerald-500", text: "text-emerald-500 dark:text-emerald-400", badge: "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400" };
}

export default function InventoryStockWidget() {
  const lowStockCount = MATERIALS.filter((m) => m.currentStock / m.maxStock < 0.3).length;

  return (
    <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-sky-500/10 flex items-center justify-center text-lg">
            📦
          </div>
          <div>
            <h3 className="font-bold text-foreground text-sm">مخزون المواد</h3>
            <p className="text-xs text-muted-foreground">6 أنواع</p>
          </div>
        </div>
        {lowStockCount > 0 && (
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-100 dark:bg-red-500/20"
          >
            <svg className="w-3.5 h-3.5 text-red-500 dark:text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span className="text-xs font-semibold text-red-600 dark:text-red-400">{lowStockCount} تنبيه</span>
          </motion.div>
        )}
      </div>

      {/* Material grid */}
      <div className="grid grid-cols-2 gap-3">
        {MATERIALS.map((mat, idx) => {
          const pct = Math.round((mat.currentStock / mat.maxStock) * 100);
          const colors = getStockColor(pct);
          const isLow = pct < 30;

          return (
            <motion.div
              key={mat.name}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.07 }}
              className={`p-3 rounded-xl border space-y-2 ${isLow ? "border-red-200 dark:border-red-500/30" : "border-border"} bg-background`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{mat.icon}</span>
                  <span className="text-sm font-medium text-foreground">{mat.name}</span>
                </div>
                {isLow && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${colors.badge}`}>
                    منخفض
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between">
                <span className={`text-lg font-bold ${colors.text}`}>{mat.currentStock}</span>
                <span className="text-[11px] text-muted-foreground">/ {mat.maxStock} {mat.unit}</span>
              </div>

              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(pct, 100)}%` }}
                  transition={{ duration: 0.6, delay: idx * 0.07 + 0.2 }}
                  className={`h-full rounded-full ${colors.bar}`}
                />
              </div>

              {isLow && (
                <motion.button
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                  className="w-full text-[11px] font-semibold py-1.5 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20 transition-colors"
                >
                  إعادة طلب
                </motion.button>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
