"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import {
  Activity, Package, CheckCircle2, AlertTriangle,
  Store, Settings2, Clock, ArrowDownLeft, Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { STATUS_META } from "@/lib/print-config";
import type { GlobalOrder } from "@/lib/admin-types";
import { getTimeAgo } from "@/lib/admin-utils";

interface ActivityEvent {
  id: string;
  type: "new_order" | "status_change" | "completed" | "cancelled" | "system";
  icon: typeof Package;
  title: string;
  description: string;
  timestamp: string;
  shopName: string;
  color: string;
  bgColor: string;
  borderColor: string;
  dotColor: string;
}

interface AdminActivityPanelProps {
  orders: GlobalOrder[];
  className?: string;
}

export function AdminActivityPanel({ orders, className }: AdminActivityPanelProps) {
  const feedRef = useRef<HTMLDivElement>(null);
  const [isLive, setIsLive] = useState(true);

  const events: ActivityEvent[] = useMemo(() => {
    const evts: ActivityEvent[] = [];

    // System event for pending queue
    const pendingCount = orders.filter(o => o.status === "pending").length;
    if (pendingCount > 0) {
      evts.push({
        id: "sys-queue",
        type: "system",
        icon: AlertTriangle,
        title: `${pendingCount} طلب بانتظار المعالجة`,
        description: "تحتاج إلى مراجعة وتأكيد الطلبات المعلقة",
        timestamp: new Date().toISOString(),
        shopName: "",
        color: "text-amber-600 dark:text-amber-400",
        bgColor: "bg-amber-500/5",
        borderColor: "border-amber-500/20",
        dotColor: "bg-amber-500",
      });
    }

    // Process orders into activity events
    const sorted = [...orders].sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    sorted.slice(0, 12).forEach((o) => {
      const status = o.status;
      const meta = STATUS_META[status as keyof typeof STATUS_META];
      const isRecent = (Date.now() - new Date(o.createdAt).getTime()) < 3600000; // within 1 hour

      let type: ActivityEvent["type"] = "new_order";
      let icon: ActivityEvent["icon"] = Package;
      let title: string;
      let color: string;
      let bgColor: string;
      let borderColor: string;
      let dotColor: string;

      if (status === "delivered" || status === "completed") {
        type = "completed";
        icon = CheckCircle2;
        title = `تم إنجاز طلب #${o.reference || o.id.slice(0, 6)}`;
        color = "text-emerald-600 dark:text-emerald-400";
        bgColor = "bg-emerald-500/5";
        borderColor = "border-emerald-500/20";
        dotColor = "bg-emerald-500";
      } else if (status === "cancelled") {
        type = "cancelled";
        icon = AlertTriangle;
        title = `طلب ملغى #${o.reference || o.id.slice(0, 6)}`;
        color = "text-rose-600 dark:text-rose-400";
        bgColor = "bg-rose-500/5";
        borderColor = "border-rose-500/20";
        dotColor = "bg-rose-500";
      } else if (status === "printing") {
        type = "status_change";
        icon = Activity;
        title = `جاري طباعة #${o.reference || o.id.slice(0, 6)}`;
        color = "text-blue-600 dark:text-blue-400";
        bgColor = "bg-blue-500/5";
        borderColor = "border-blue-500/20";
        dotColor = "bg-blue-500";
      } else if (status === "ready") {
        type = "status_change";
        icon = CheckCircle2;
        title = `جاهز للتسليم #${o.reference || o.id.slice(0, 6)}`;
        color = "text-teal-600 dark:text-teal-400";
        bgColor = "bg-teal-500/5";
        borderColor = "border-teal-500/20";
        dotColor = "bg-teal-500";
      } else if (status === "confirmed") {
        type = "status_change";
        icon = ArrowDownLeft;
        title = `تم تأكيد طلب #${o.reference || o.id.slice(0, 6)}`;
        color = "text-violet-600 dark:text-violet-400";
        bgColor = "bg-violet-500/5";
        borderColor = "border-violet-500/20";
        dotColor = "bg-violet-500";
      } else {
        type = "new_order";
        icon = Package;
        title = `طلب جديد #${o.reference || o.id.slice(0, 6)}`;
        color = "text-amber-600 dark:text-amber-400";
        bgColor = "bg-amber-500/5";
        borderColor = "border-amber-500/20";
        dotColor = "bg-amber-500";
      }

      evts.push({
        id: o.id,
        type,
        icon,
        title,
        description: `${o.customer?.name || "—"} — ${o.serviceName || o.serviceType || ""} — ${(o.total || 0).toLocaleString("ar-DZ")} د.ج`,
        timestamp: o.createdAt,
        shopName: o.shopName || "",
        color,
        bgColor,
        borderColor,
        dotColor: isRecent ? dotColor : "bg-muted-foreground/30",
      });
    });

    return evts;
  }, [orders]);

  // Auto-scroll to top on new events
  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = 0;
    }
  }, [events.length]);

  return (
    <div className={cn("glass-card-v3 overflow-hidden", className)}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-border/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">النشاط المباشر</h3>
          <span className="text-[10px] text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded-full tabular-data">
            {events.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-[10px]">
            <span className={cn(
              "w-2 h-2 rounded-full",
              isLive ? "bg-emerald-500 activity-dot-live" : "bg-muted-foreground/30"
            )} />
            <span className={isLive ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}>
              {isLive ? "مباشر" : "متوقف"}
            </span>
          </div>
          <button
            onClick={() => setIsLive(!isLive)}
            className={cn(
              "text-[10px] px-2 py-0.5 rounded-md transition-colors",
              isLive
                ? "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            {isLive ? "إيقاف" : "تشغيل"}
          </button>
        </div>
      </div>

      {/* Feed */}
      <div
        ref={feedRef}
        className="max-h-[400px] overflow-y-auto scrollbar-rounded scroll-indicator-bottom"
      >
        {events.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-muted/50 flex items-center justify-center mb-3 empty-state-float">
              <Activity className="h-6 w-6 text-muted-foreground/30" />
            </div>
            <p className="text-sm text-muted-foreground">لا توجد نشاطات بعد</p>
            <p className="text-[10px] text-muted-foreground/50 mt-1">ستظهر النشاطات الجديدة هنا تلقائياً</p>
          </div>
        ) : (
          <div className="divide-y divide-border/30">
            {events.map((event, idx) => {
              const Icon = event.icon;
              return (
                <div
                  key={event.id}
                  className={cn(
                    "activity-feed-item px-4 py-3 transition-colors hover:bg-muted/20 anim-fade-in",
                    idx < 8 && `delay-${Math.min(idx + 1, 8)}`
                  )}
                >
                  <div
                    className={cn(
                      "absolute right-2 top-[14px] w-[9px] h-[9px] rounded-full border-2 border-background z-[1]",
                      event.dotColor,
                      event.type === "new_order" && "badge-ring"
                    )}
                    style={{ background: 'currentColor', color: event.dotColor.includes('bg-') ? undefined : event.dotColor }}
                  />
                  <div className="flex items-start gap-3 pr-3">
                    <div className={cn(
                      "w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5",
                      event.bgColor
                    )}>
                      <Icon className={cn("h-3.5 w-3.5", event.color)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn("text-xs font-medium", event.color)}>
                        {event.title}
                      </p>
                      <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                        {event.description}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock className="h-2.5 w-2.5 text-muted-foreground/40" />
                        <span className="text-[10px] text-muted-foreground/50">
                          {getTimeAgo(event.timestamp)}
                        </span>
                        {event.shopName && (
                          <>
                            <span className="text-[10px] text-muted-foreground/20">·</span>
                            <span className="text-[10px] text-muted-foreground/40 truncate max-w-[120px]">
                              {event.shopName}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
