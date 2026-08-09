"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Printer, Clock, CheckCircle2, AlertTriangle, Zap } from "lucide-react";

interface QueueStatus {
  pending: number;
  printing: number;
  ready: number;
  todayTotal: number;
  todayRevenue: number;
}

export function ServiceStatusBanner() {
  const [status, setStatus] = useState<QueueStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/stats/overview")
      .then((r) => r.json())
      .then((d) => {
        setStatus({
          pending: d.pending || 0,
          printing: d.printing || 0,
          ready: d.ready || 0,
          todayTotal: d.todayOrders || 0,
          todayRevenue: d.todayRevenue || 0,
        });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="rounded-xl border bg-card p-4 animate-pulse">
        <div className="h-4 bg-muted rounded w-1/3 mb-3" />
        <div className="flex gap-3">
          <div className="h-8 bg-muted rounded flex-1" />
          <div className="h-8 bg-muted rounded flex-1" />
          <div className="h-8 bg-muted rounded flex-1" />
        </div>
      </div>
    );
  }

  if (!status) return null;

  const isBusy = status.printing >= 3;
  const hasUrgent = status.pending >= 5;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={`rounded-xl border p-3 sm:p-4 ${
        isBusy
          ? "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/50"
          : "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/40"
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
            isBusy
              ? "bg-amber-100 dark:bg-amber-900/40"
              : "bg-emerald-100 dark:bg-emerald-900/30"
          }`}>
            {isBusy ? (
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            ) : (
              <Zap className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            )}
          </div>
          <div>
            <div className="text-sm font-bold">
              {isBusy ? "المطبعة مشغولة" : "المطبعة جاهزة"}
            </div>
            <div className="text-[11px] text-muted-foreground">
              {isBusy ? "قد يتأخر التسليم قليلاً" : "يمكنك استلام طلبك بسرعة"}
            </div>
          </div>
        </div>
        <div className="text-left">
          <div className="text-xs text-muted-foreground">اليوم</div>
          <div className="text-sm font-bold">
            {status.todayTotal} طلب
          </div>
        </div>
      </div>

      <div className="flex gap-2 sm:gap-3">
        <motion.div
          whileHover={{ scale: 1.03 }}
          className="flex-1 rounded-lg bg-white dark:bg-neutral-900/60 border border-amber-100 dark:border-amber-900/40 p-2.5 text-center"
        >
          <div className="flex items-center justify-center gap-1 mb-1">
            <Clock className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
            <span className="text-[10px] text-muted-foreground">بانتظار</span>
          </div>
          <div className={`text-lg font-black ${hasUrgent ? "text-amber-600 dark:text-amber-400" : "text-foreground"}`}>
            {status.pending}
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.03 }}
          className="flex-1 rounded-lg bg-white dark:bg-neutral-900/60 border border-amber-100 dark:border-amber-900/40 p-2.5 text-center"
        >
          <div className="flex items-center justify-center gap-1 mb-1">
            <Printer className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
            <span className="text-[10px] text-muted-foreground">جارٍ الطباعة</span>
          </div>
          <div className="text-lg font-black text-amber-600 dark:text-amber-400">
            {status.printing}
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.03 }}
          className="flex-1 rounded-lg bg-white dark:bg-neutral-900/60 border border-emerald-100 dark:border-emerald-900/40 p-2.5 text-center"
        >
          <div className="flex items-center justify-center gap-1 mb-1">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="text-[10px] text-muted-foreground">جاهز</span>
          </div>
          <div className="text-lg font-black text-emerald-600 dark:text-emerald-400">
            {status.ready}
          </div>
        </motion.div>
      </div>

      {/* شريط التقدم التشغيلي */}
      {status.todayTotal > 0 && (
        <div className="mt-3">
          <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
            <span>تقدّم اليوم</span>
            <span>{Math.round(((status.ready + (status.printing * 0.5)) / Math.max(1, status.todayTotal)) * 100)}%</span>
          </div>
          <div className="h-1.5 bg-white dark:bg-neutral-800 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{
                width: `${((status.ready + (status.printing * 0.5)) / Math.max(1, status.todayTotal)) * 100}%`
              }}
              transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
              className="h-full rounded-full bg-gradient-to-l from-emerald-500 to-emerald-400"
            />
          </div>
        </div>
      )}
    </motion.div>
  );
}