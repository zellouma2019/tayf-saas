"use client";

import { useEffect, useState } from "react";
import { Activity, ArrowLeft, Clock, Inbox } from "lucide-react";
import { STATUS_META, formatDateTimeAr, SERVICE_MAP } from "@/lib/print-config";
import type { PrintOrderLite } from "@/lib/order-types";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

// ─── Status visual mapping ───────────────────────────────────────────────────

const STATUS_BORDER: Record<string, string> = {
  pending: "border-l-amber-500",
  printing: "border-l-amber-600",
  ready: "border-l-emerald-500",
  delivered: "border-l-emerald-600",
  cancelled: "border-l-red-500",
};

const STATUS_DOT: Record<string, string> = {
  pending: "bg-amber-500 dark:bg-amber-400",
  printing: "bg-amber-600 dark:bg-amber-400",
  ready: "bg-emerald-500 dark:bg-emerald-400",
  delivered: "bg-emerald-600 dark:bg-emerald-400",
  cancelled: "bg-red-500 dark:bg-red-400",
};

const STATUS_DOT_RING: Record<string, string> = {
  pending: "ring-amber-500/30 dark:ring-amber-400/20",
  printing: "ring-amber-500/30 dark:ring-amber-400/20",
  ready: "ring-emerald-500/30 dark:ring-emerald-400/20",
  delivered: "ring-emerald-600/30 dark:ring-emerald-400/20",
  cancelled: "ring-red-500/30 dark:ring-red-400/20",
};

// ─── Relative time in Arabic ─────────────────────────────────────────────────

function timeAgoAr(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;

  if (diffMs < 0) return "الآن";

  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return "منذ لحظات";
  if (minutes < 60) return `منذ ${minutes} دقيقة`;
  if (hours < 24) return `منذ ${hours} ساعة`;
  if (days === 1) return "منذ يوم";
  if (days < 7) return `منذ ${days} أيام`;
  if (days < 30) return `منذ ${Math.floor(days / 7)} أسبوع`;
  if (days < 365) return `منذ ${Math.floor(days / 30)} شهر`;
  return `منذ ${Math.floor(days / 365)} سنة`;
}

// ─── Skeleton loader ─────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="space-y-0 divide-y divide-border/50">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 px-4 py-3.5"
        >
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-9 rounded-full ring-4 ring-muted" />
          </div>
          <div className="flex flex-1 flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3.5 w-16 rounded-full" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-3 w-14" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
      ))}
    </div>
  );
}

// ─── Empty state ─────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/80 dark:bg-muted/40">
        <Inbox className="h-7 w-7 text-muted-foreground/60" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium text-muted-foreground">
          لا توجد طلبات بعد
        </p>
        <p className="text-xs text-muted-foreground/70">
          ستظهر هنا آخر الطلبات عند استلامها
        </p>
      </div>
    </div>
  );
}

// ─── Single activity row ─────────────────────────────────────────────────────

interface ActivityRowProps {
  order: PrintOrderLite;
  isLast: boolean;
}

function ActivityRow({ order, isLast }: ActivityRowProps) {
  const meta = STATUS_META[order.status];
  const service = SERVICE_MAP[order.serviceType];
  const borderClass = STATUS_BORDER[order.status] ?? "border-l-muted-foreground/30";
  const dotClass = STATUS_DOT[order.status] ?? "bg-muted-foreground";
  const ringClass = STATUS_DOT_RING[order.status] ?? "ring-muted-foreground/20";

  return (
    <div
      className={`
        group relative flex items-center gap-3 pl-7 pr-4 py-3.5
        transition-colors duration-150
        hover:bg-muted/40 dark:hover:bg-muted/20
        ${!isLast ? "border-b border-border/40" : ""}
      `}
    >
      {/* Left colored border accent */}
      <div
        className={`absolute inset-y-0 left-0 w-[3px] rounded-r-full ${borderClass}`}
      />

      {/* Status dot with ring */}
      <div className="flex shrink-0 items-center justify-center">
        <div
          className={`h-2.5 w-2.5 rounded-full ring-[3px] ${dotClass} ${ringClass}`}
        />
      </div>

      {/* Content */}
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        {/* Top line: service emoji + name + ref */}
        <div className="flex items-center gap-2">
          <span className="text-base leading-none" aria-hidden>
            {service?.emoji ?? "📄"}
          </span>
          <span className="truncate text-sm font-medium text-foreground">
            {order.serviceName}
          </span>
          <span className="shrink-0 text-xs font-mono text-muted-foreground/70">
            {order.reference}
          </span>
        </div>

        {/* Bottom line: time ago */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>{timeAgoAr(order.createdAt)}</span>
          <span className="text-muted-foreground/40">·</span>
          <span>{formatDateTimeAr(order.createdAt)}</span>
        </div>
      </div>

      {/* Status badge */}
      {meta && (
        <span
          className={`
            shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-medium leading-tight
            ${meta.bg}
          `}
        >
          {meta.emoji} {meta.label}
        </span>
      )}
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

export function ActivityFeed() {
  const [orders, setOrders] = useState<PrintOrderLite[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOrders() {
      try {
        const res = await fetch("/api/orders?limit=5&sort=desc");
        if (res.ok) {
          const data = await res.json();
          setOrders(Array.isArray(data) ? data : []);
        }
      } catch {
        // silent fail — shows empty state
      } finally {
        setLoading(false);
      }
    }
    fetchOrders();
  }, []);

  return (
    <div
      className="
        overflow-hidden rounded-xl border border-border/60
        bg-card shadow-sm
        dark:border-border/30 dark:shadow-none
      "
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/50 px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 dark:bg-primary/20">
            <Activity className="h-4 w-4 text-primary" />
          </div>
          <h3 className="text-sm font-semibold text-foreground">
            آخر الطلبات
          </h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          onClick={() => {
            /* لا يوجد تنقل — يمكن تمرير onNavigate كـ prop */
          }}
        >
          عرض الكل
          <ArrowLeft className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Body */}
      <div>
        {loading && <LoadingSkeleton />}

        {!loading && orders.length === 0 && <EmptyState />}

        {!loading &&
          orders.length > 0 &&
          orders.map((order, i) => (
            <ActivityRow
              key={order.id}
              order={order}
              isLast={i === orders.length - 1}
            />
          ))}
      </div>
    </div>
  );
}