"use client";

import { useState, useEffect, useMemo } from "react";
import { Clock, AlertTriangle, ArrowRight, ExternalLink, Bell, BellOff } from "lucide-react";
import type { GlobalStats } from "@/lib/admin-types";

interface StaleOrdersWidgetProps {
  stats: GlobalStats | null;
  onRefresh: () => void;
}

const STALE_THRESHOLD_HOURS = 24;

interface StaleOrder {
  id: string;
  reference: string;
  shopName: string;
  customerName: string;
  total: number;
  status: string;
  createdAt: string;
  hoursOld: number;
}

export function StaleOrdersWidget({ stats, onRefresh }: StaleOrdersWidgetProps) {
  const [dismissed, setDismissed] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem("tayf-dismissed-stale");
      if (saved) setDismissed(JSON.parse(saved));
    } catch {}
  }, []);

  const staleOrders = useMemo(() => {
    if (!stats?.recentOrders) return [];
    const now = Date.now();

    return stats.recentOrders
      .filter((o) => {
        if (dismissed.includes(o.id)) return false;
        if (o.status === "delivered" || o.status === "cancelled") return false;
        if (!o.createdAt) return false;

        const created = new Date(o.createdAt).getTime();
        const hoursOld = (now - created) / (1000 * 60 * 60);
        return hoursOld >= STALE_THRESHOLD_HOURS;
      })
      .map((o) => ({
        id: o.id,
        reference: o.reference,
        shopName: o.shopName,
        customerName: o.customer?.name || "—",
        total: o.total,
        status: o.status,
        createdAt: o.createdAt,
        hoursOld: Math.floor(
          (now - new Date(o.createdAt).getTime()) / (1000 * 60 * 60)
        ),
      }))
      .sort((a, b) => b.hoursOld - a.hoursOld);
  }, [stats, dismissed]);

  const handleDismiss = (orderId: string) => {
    setDismissed((prev) => {
      const next = [...prev, orderId];
      try { localStorage.setItem("tayf-dismissed-stale", JSON.stringify(next)); } catch {}
      return next;
    });
  };

  const handleDismissAll = () => {
    const ids = staleOrders.map((o) => o.id);
    const next = [...dismissed, ...ids];
    try { localStorage.setItem("tayf-dismissed-stale", JSON.stringify(next)); } catch {}
    setDismissed(next);
  };

  if (!mounted || staleOrders.length === 0) return null;

  const severity = staleOrders[0]?.hoursOld >= 72 ? "critical" : staleOrders[0]?.hoursOld >= 48 ? "warning" : "mild";

  return (
    <div
      className={`rounded-xl border overflow-hidden fade-slide-up ${
        severity === "critical"
          ? "border-rose-300 dark:border-rose-700/50 bg-rose-50/50 dark:bg-rose-950/20"
          : severity === "warning"
          ? "border-amber-300 dark:border-amber-700/50 bg-amber-50/50 dark:bg-amber-950/20"
          : "border-yellow-300 dark:border-yellow-700/50 bg-yellow-50/50 dark:bg-yellow-950/20"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-inherit/50">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
            severity === "critical"
              ? "bg-rose-100 dark:bg-rose-900/40"
              : severity === "warning"
              ? "bg-amber-100 dark:bg-amber-900/40"
              : "bg-yellow-100 dark:bg-yellow-900/40"
          }`}>
            <AlertTriangle className={`h-4 w-4 ${
              severity === "critical"
                ? "text-rose-600 dark:text-rose-400"
                : severity === "warning"
                ? "text-amber-600 dark:text-amber-400"
                : "text-yellow-600 dark:text-yellow-400"
            }`} />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">طلبات متأخرة</p>
            <p className="text-xs text-muted-foreground">
              {staleOrders.length} طلب بانتظار أكثر من {STALE_THRESHOLD_HOURS} ساعة
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleDismissAll}
            className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded-md hover:bg-accent transition-colors flex items-center gap-1"
          >
            <BellOff className="h-3 w-3" />
            إيقاف التنبيه
          </button>
        </div>
      </div>

      {/* List */}
      <div className="divide-y divide-border/50 max-h-[200px] overflow-y-auto scrollbar-thin">
        {staleOrders.slice(0, 5).map((order, i) => (
          <div key={order.id} className={`flex items-center gap-3 px-4 py-2.5 text-sm ${i > 0 ? "" : ""}`} style={{ animationDelay: `${i * 0.05}s` }}>
            <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${
              order.hoursOld >= 72
                ? "bg-rose-100 dark:bg-rose-900/30"
                : "bg-amber-100 dark:bg-amber-900/30"
            }`}>
              <Clock className={`h-4 w-4 ${
                order.hoursOld >= 72
                  ? "text-rose-600 dark:text-rose-400"
                  : "text-amber-600 dark:text-amber-400"
              }`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-mono font-semibold text-xs text-foreground">{order.reference}</span>
                <span className="text-xs text-muted-foreground truncate">{order.shopName}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {order.customerName} · {order.total.toLocaleString()} د.ج
              </p>
            </div>
            <div className="flex-shrink-0 flex items-center gap-2">
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                order.hoursOld >= 72
                  ? "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300"
                  : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
              }`}>
                {order.hoursOld} ساعة
              </span>
              <button
                onClick={() => handleDismiss(order.id)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-accent transition-colors"
                title="إزالة التنبيه"
              >
                <BellOff className="h-3 w-3" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
