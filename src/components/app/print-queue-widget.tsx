"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  Printer,
  Layers,
  Clock,
  CheckCircle2,
  AlertTriangle,
  BarChart3,
  Zap,
} from "lucide-react";
import type { PrintOrderLite } from "@/lib/order-types";
import { formatDA } from "@/lib/print-config";

interface PrintQueueWidgetProps {
  orders: PrintOrderLite[];
  className?: string;
}

interface QueueItem {
  id: string;
  reference: string;
  service: string;
  customer: string;
  status: string;
  total: number;
  createdAt: string;
  pages?: number;
}

export function PrintQueueWidget({ orders, className = "" }: PrintQueueWidgetProps) {
  const queueData = useMemo(() => {
    const queue = orders.filter(o =>
      o.status === "confirmed" || o.status === "printing" || o.status === "pending"
    ).map(o => ({
      id: o.id,
      reference: o.reference,
      service: o.serviceName || "طباعة",
      customer: o.customerName || "زبون",
      status: o.status,
      total: o.total || 0,
      createdAt: o.createdAt || new Date().toISOString(),
      pages: o.pages || 0,
    }));

    const totalRevenue = queue.reduce((s, o) => s + o.total, 0);
    const printing = queue.filter(o => o.status === "printing").length;
    const pending = queue.filter(o => o.status === "pending").length;
    const confirmed = queue.filter(o => o.status === "confirmed").length;

    return { queue: queue.slice(0, 8), totalRevenue, printing, pending, confirmed, total: queue.length };
  }, [orders]);

  const getStatusInfo = (status: string) => {
    switch (status) {
      case "printing":
        return { label: "جارٍ الطباعة", icon: Printer, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-100 dark:bg-amber-900/30", barColor: "bg-amber-400" };
      case "confirmed":
        return { label: "مؤكد", icon: CheckCircle2, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-100 dark:bg-blue-900/30", barColor: "bg-blue-400" };
      case "pending":
        return { label: "بانتظار", icon: Clock, color: "text-neutral-600 dark:text-neutral-400", bg: "bg-neutral-100 dark:bg-neutral-800", barColor: "bg-neutral-400" };
      default:
        return { label: status, icon: AlertTriangle, color: "text-muted-foreground", bg: "bg-muted", barColor: "bg-muted-foreground" };
    }
  };

  const progressPercent = queueData.total > 0
    ? Math.round((queueData.printing / queueData.total) * 100)
    : 0;

  if (queueData.total === 0) {
    return (
      <div className={`empty-state ${className}`}>
        <div className="empty-state-icon">
          <Layers className="h-7 w-7 text-muted-foreground/50" />
        </div>
        <p className="text-sm font-medium text-muted-foreground">لا توجد طلبات في الطابور</p>
        <p className="text-xs text-muted-foreground/60 mt-1">الطلبات الجديدة ستظهر هنا تلقائياً</p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Queue Summary */}
      <div className="grid grid-cols-3 gap-2">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200/50 dark:border-amber-800/30 p-3 text-center"
        >
          <Printer className="h-4 w-4 text-amber-600 dark:text-amber-400 mx-auto mb-1" />
          <p className="text-lg font-bold text-amber-700 dark:text-amber-300 counter-number">{queueData.printing}</p>
          <p className="text-[10px] text-amber-600/70 dark:text-amber-400/70">جارٍ الطباعة</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-xl bg-blue-50 dark:bg-blue-900/10 border border-blue-200/50 dark:border-blue-800/30 p-3 text-center"
        >
          <CheckCircle2 className="h-4 w-4 text-blue-600 dark:text-blue-400 mx-auto mb-1" />
          <p className="text-lg font-bold text-blue-700 dark:text-blue-300 counter-number">{queueData.confirmed}</p>
          <p className="text-[10px] text-blue-600/70 dark:text-blue-400/70">مؤكد</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200/50 dark:border-neutral-700/30 p-3 text-center"
        >
          <Clock className="h-4 w-4 text-neutral-600 dark:text-neutral-400 mx-auto mb-1" />
          <p className="text-lg font-bold text-neutral-700 dark:text-neutral-300 counter-number">{queueData.pending}</p>
          <p className="text-[10px] text-neutral-600/70 dark:text-neutral-400/70">بانتظار</p>
        </motion.div>
      </div>

      {/* Progress bar */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
            <Zap className="h-3 w-3" />
            تقدّم الطابور
          </span>
          <span className="text-[11px] font-bold text-foreground counter-number">{progressPercent}%</span>
        </div>
        <div className="print-queue-progress">
          <motion.div
            className="print-queue-progress-bar"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>
        <div className="flex items-center justify-between mt-1">
          <span className="text-[10px] text-muted-foreground/60">{queueData.total} طلب إجمالي</span>
          <span className="text-[10px] text-gold-600 dark:text-gold-400 font-bold">{formatDA(queueData.totalRevenue)}</span>
        </div>
      </div>

      {/* Queue list */}
      <div className="space-y-2">
        {queueData.queue.map((item, index) => {
          const statusInfo = getStatusInfo(item.status);
          const StatusIcon = statusInfo.icon;
          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-center gap-3 p-2.5 rounded-xl bg-card border border-border/50 hover:bg-primary/5 transition-colors group notif-hover"
            >
              {/* Status indicator */}
              <div className={`w-8 h-8 rounded-lg ${statusInfo.bg} flex items-center justify-center shrink-0`}>
                <StatusIcon className={`h-4 w-4 ${statusInfo.color}`} />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold font-mono text-foreground truncate">{item.reference}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground font-medium shrink-0">
                    {statusInfo.label}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                  {item.service} — {item.customer}
                </p>
              </div>

              {/* Amount */}
              <span className="text-xs font-bold text-gold-600 dark:text-gold-400 shrink-0 counter-number">
                {formatDA(item.total)}
              </span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
