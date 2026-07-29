"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Bell, CheckCircle2, AlertTriangle, Info, Clock } from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getTimeAgo } from "@/lib/admin-utils";

interface NotificationEvent {
  id: string;
  message: string;
  type: "order_new" | "order_status" | "system" | "info";
  time: string;
  shopName?: string;
}

interface Props {
  pendingCount: number;
  events: NotificationEvent[];
  onMarkAllRead: () => void;
}

const TYPE_STYLES: Record<
  NotificationEvent["type"],
  { icon: typeof Bell; color: string; bg: string; border: string }
> = {
  order_new: {
    icon: Bell,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
  },
  order_status: {
    icon: CheckCircle2,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
  },
  system: {
    icon: AlertTriangle,
    color: "text-amber-500",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
  },
  info: {
    icon: Info,
    color: "text-green-500",
    bg: "bg-green-500/10",
    border: "border-green-500/20",
  },
};

export function AdminNotificationCenter({
  pendingCount,
  events,
  onMarkAllRead,
}: Props) {
  const [open, setOpen] = useState(false);
  const autoCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetAutoClose = useCallback(() => {
    if (autoCloseTimer.current) clearTimeout(autoCloseTimer.current);
    autoCloseTimer.current = setTimeout(() => {
      setOpen(false);
    }, 5000);
  }, []);

  useEffect(() => {
    if (open) {
      resetAutoClose();
    }
    return () => {
      if (autoCloseTimer.current) clearTimeout(autoCloseTimer.current);
    };
  }, [open, events.length, resetAutoClose]);

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (nextOpen) resetAutoClose();
  };

  const handleMarkAllRead = () => {
    onMarkAllRead();
    if (autoCloseTimer.current) clearTimeout(autoCloseTimer.current);
    setTimeout(() => setOpen(false), 300);
  };

  const displayEvents = events.slice(0, 10);

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "relative p-2.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors",
            pendingCount > 0 && "bell-urgent"
          )}
          aria-label={`الإشعارات (${pendingCount})`}
        >
          <Bell className="h-4 w-4" />
          {pendingCount > 0 && (
            <span className="absolute -top-0.5 left-0.5 min-w-[16px] h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center px-1 badge-pulse">
              {pendingCount > 99 ? "99+" : pendingCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        side="bottom"
        sideOffset={8}
        className={cn(
          "w-80 sm:w-96 p-0 overflow-hidden",
          "bg-card/80 backdrop-blur-xl border border-border/50 shadow-2xl shadow-black/10",
          "animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 duration-200"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">
              مركز الإشعارات
            </h3>
            {pendingCount > 0 && (
              <Badge
                variant="secondary"
                className="h-5 min-w-[20px] text-[10px] px-1.5 bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20"
              >
                {pendingCount}
              </Badge>
            )}
          </div>
          {pendingCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="text-[11px] text-primary hover:text-primary/80 font-medium flex items-center gap-1 transition-colors"
            >
              <CheckCircle2 className="h-3 w-3" />
              تحديد الكل كمقروء
            </button>
          )}
        </div>

        {/* Event list */}
        <div className="max-h-[320px] overflow-y-auto">
          {displayEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
              <Bell className="h-8 w-8 mb-2 opacity-30" />
              <p className="text-xs">لا توجد إشعارات جديدة</p>
            </div>
          ) : (
            <div className="divide-y divide-border/30">
              {displayEvents.map((event, index) => {
                const style = TYPE_STYLES[event.type];
                const Icon = style.icon;
                return (
                  <div
                    key={event.id}
                    className={cn(
                      "flex items-start gap-3 px-4 py-3 transition-colors hover:bg-secondary/50",
                      "animate-in fade-in-0 slide-in-from-right-2 duration-300"
                    )}
                    style={{ animationDelay: `${index * 50}ms`, animationFillMode: "both" }}
                  >
                    <div
                      className={cn(
                        "mt-0.5 shrink-0 p-1.5 rounded-md",
                        style.bg,
                        style.border,
                        "border"
                      )}
                    >
                      <Icon className={cn("h-3 w-3", style.color)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-foreground leading-relaxed">
                        {event.message}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock className="h-2.5 w-2.5 text-muted-foreground/50" />
                        <span className="text-[10px] text-muted-foreground/60">
                          {getTimeAgo(event.time)}
                        </span>
                        {event.shopName && (
                          <>
                            <span className="text-muted-foreground/30">•</span>
                            <span className="text-[10px] text-muted-foreground/60 font-medium">
                              {event.shopName}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {displayEvents.length > 0 && (
          <div className="px-4 py-2.5 border-t border-border/50 bg-muted/20">
            <p className="text-[10px] text-muted-foreground/50 text-center">
              يُغلق تلقائياً بعد ٥ ثوانٍ
            </p>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
