"use client";

import { motion } from "framer-motion";
import { Zap, TrendingUp, Clock, Package, AlertTriangle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LiveActivityItem {
  id: string;
  type: "order_new" | "order_confirmed" | "order_printing" | "order_ready" | "order_delivered";
  message: string;
  time: string;
  shopName?: string;
}

const TYPE_CONFIG: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
  order_new: { icon: <Zap className="h-3.5 w-3.5" />, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-100 dark:bg-amber-900/30" },
  order_confirmed: { icon: <CheckCircle2 className="h-3.5 w-3.5" />, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-100 dark:bg-blue-900/30" },
  order_printing: { icon: <Package className="h-3.5 w-3.5" />, color: "text-violet-600 dark:text-violet-400", bg: "bg-violet-100 dark:bg-violet-900/30" },
  order_ready: { icon: <Clock className="h-3.5 w-3.5" />, color: "text-teal-600 dark:text-teal-400", bg: "bg-teal-100 dark:bg-teal-900/30" },
  order_delivered: { icon: <TrendingUp className="h-3.5 w-3.5" />, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-100 dark:bg-emerald-900/30" },
};

export function LiveActivityFeed({ items }: { items: LiveActivityItem[] }) {
  if (!items.length) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center" dir="rtl">
        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
          <Clock className="h-5 w-5 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">لا توجد نشاطات مباشرة حالياً</p>
      </div>
    );
  }

  return (
    <div className="space-y-2" dir="rtl">
      {/* Header with live dot */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <h3 className="text-sm font-bold text-foreground">مباشر</h3>
        </div>
        <span className="text-[10px] text-muted-foreground">{items.length} نشاط</span>
      </div>

      {/* Activity items */}
      <div className="space-y-1.5">
        {items.slice(0, 8).map((item, idx) => {
          const config = TYPE_CONFIG[item.type] || TYPE_CONFIG.order_new;
          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05, type: "spring", stiffness: 300 }}
              className={cn(
                "flex items-center gap-3 p-2.5 rounded-lg border transition-colors",
                idx === 0 ? "border-primary/20 bg-primary/[0.03] dark:border-primary/10" : "border-border bg-card hover:bg-muted/50"
              )}
            >
              <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center shrink-0", config.bg, config.color)}>
                {config.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-foreground truncate">{item.message}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  {item.shopName && <span className="text-[10px] text-muted-foreground">{item.shopName}</span>}
                  <span className="text-[10px] text-muted-foreground/60">{item.time}</span>
                </div>
              </div>
              {idx === 0 && (
                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shrink-0" />
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
