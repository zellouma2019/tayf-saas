"use client";

import { useMemo } from "react";
import { Clock, Check, Printer, PackageCheck, Truck, XCircle, StickyNote, CalendarClock } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDateTimeAr } from "@/lib/print-config";

interface StatusNoteEntry {
  id: string;
  action: string;
  field: string | null;
  oldValue: string | null;
  newValue: string | null;
  details: string | null;
  createdAt: string;
}

const STATUS_ICON_MAP: Record<string, { icon: typeof Clock; colorClass: string; bgClass: string; glowClass: string }> = {
  pending:   { icon: Clock,       colorClass: "text-amber-500",  bgClass: "bg-amber-100 dark:bg-amber-900/30",   glowClass: "status-glow-pending" },
  confirmed: { icon: Check,       colorClass: "text-violet-500", bgClass: "bg-violet-100 dark:bg-violet-900/30", glowClass: "status-glow-confirmed" },
  printing:  { icon: Printer,     colorClass: "text-blue-500",   bgClass: "bg-blue-100 dark:bg-blue-900/30",     glowClass: "status-glow-printing" },
  ready:     { icon: PackageCheck, colorClass: "text-emerald-500", bgClass: "bg-emerald-100 dark:bg-emerald-900/30", glowClass: "status-glow-ready" },
  delivered: { icon: Truck,       colorClass: "text-green-500",  bgClass: "bg-green-100 dark:bg-green-900/30",   glowClass: "status-glow-delivered" },
  cancelled: { icon: XCircle,     colorClass: "text-rose-500",   bgClass: "bg-rose-100 dark:bg-rose-900/30",     glowClass: "status-glow-cancelled" },
};

const STATUS_LABELS: Record<string, string> = {
  pending: "بانتظار الطباعة",
  confirmed: "مؤكد",
  printing: "جارٍ التنفيذ",
  ready: "جاهز للاستلام",
  delivered: "تم التسليم",
  cancelled: "ملغى",
};

interface OrderStatusNotesTimelineProps {
  auditLogs: StatusNoteEntry[];
  loading?: boolean;
}

export function OrderStatusNotesTimeline({ auditLogs, loading }: OrderStatusNotesTimelineProps) {
  // Filter and sort status change logs
  const statusChanges = useMemo(() => {
    return auditLogs
      .filter((log) => log.action === "status_change" || log.action === "create")
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [auditLogs]);

  // All other logs (edits, etc.)
  const otherLogs = useMemo(() => {
    return auditLogs
      .filter((log) => log.action !== "status_change" && log.action !== "create")
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [auditLogs]);

  if (loading) {
    return (
      <div className="space-y-3 p-4">
        <div className="skeleton-glow h-4 w-32 rounded" />
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3">
              <div className="skeleton-glow w-8 h-8 rounded-full shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="skeleton-glow h-3 w-24 rounded" />
                <div className="skeleton-glow h-3 w-40 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (statusChanges.length === 0 && otherLogs.length === 0) {
    return (
      <div className="text-center py-6">
        <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-2 subtle-float">
          <StickyNote className="h-5 w-5 text-muted-foreground/50" />
        </div>
        <p className="text-xs text-muted-foreground">لا يوجد سجل تغييرات بعد</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Status Changes Timeline */}
      {statusChanges.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <h4 className="text-xs font-bold text-foreground section-title-underline">مسار الحالات</h4>
            <span className="text-[10px] text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded-full">
              {statusChanges.length} تغيير
            </span>
          </div>
          <div className="relative">
            {/* Vertical connector line */}
            <div className="absolute top-4 right-[15px] bottom-4 w-0.5 bg-gradient-to-b from-violet-300 via-sky-300 to-emerald-300 dark:from-violet-700 dark:via-sky-700 dark:to-emerald-700 rounded-full" />
            
            <div className="space-y-3">
              {statusChanges.map((log, index) => {
                const newStatus = log.newValue || log.details || "";
                const statusKey = newStatus.toLowerCase();
                const meta = STATUS_ICON_MAP[statusKey] || STATUS_ICON_MAP.pending;
                const Icon = meta.icon;
                const isFirst = index === 0;
                
                // Extract note from details if present
                const hasNote = log.details && log.details.length > 20;
                const statusLabel = STATUS_LABELS[statusKey] || newStatus;
                
                return (
                  <div
                    key={log.id}
                    className={cn(
                      "relative flex gap-3 fade-in-up-d",
                      Math.min(index + 1, 5),
                    )}
                  >
                    {/* Timeline dot */}
                    <div className={cn(
                      "relative z-10 w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-2",
                      meta.bgClass,
                      isFirst && meta.glowClass,
                      isFirst ? "border-current" : "border-transparent"
                    )}>
                      <Icon className={cn("h-3.5 w-3.5", meta.colorClass)} />
                    </div>
                    
                    {/* Content card */}
                    <div className={cn(
                      "flex-1 rounded-lg border bg-background/80 p-2.5 transition-all",
                      isFirst ? "glass-card-v4" : "bg-muted/20",
                      isFirst && "hover-scale-subtle"
                    )}>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className={cn("text-xs font-bold", meta.colorClass)}>
                            {log.action === "create" ? "إنشاء الطلب" : statusLabel}
                          </span>
                          {isFirst && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20">
                              حالي
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-muted-foreground/60 whitespace-nowrap">
                          {formatDateTimeAr(log.createdAt)}
                        </span>
                      </div>
                      
                      {/* Status transition */}
                      {log.oldValue && log.newValue && (
                        <div className="flex items-center gap-1.5 mt-1 text-[11px]">
                          <span className="text-muted-foreground line-through">
                            {STATUS_LABELS[log.oldValue.toLowerCase()] || log.oldValue}
                          </span>
                          <span className="text-muted-foreground">→</span>
                          <span className={cn("font-medium", meta.colorClass)}>
                            {STATUS_LABELS[log.newValue.toLowerCase()] || log.newValue}
                          </span>
                        </div>
                      )}
                      
                      {/* Note */}
                      {hasNote && (
                        <div className="mt-1.5 flex items-start gap-1.5 text-[11px] text-muted-foreground bg-violet-50/50 dark:bg-violet-950/10 rounded-md px-2 py-1.5">
                          <StickyNote className="h-3 w-3 text-violet-400 shrink-0 mt-0.5" />
                          <span>{log.details}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Other Activity Logs */}
      {otherLogs.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <h4 className="text-xs font-bold text-foreground section-title-underline">النشاطات الأخرى</h4>
            <span className="text-[10px] text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded-full">
              {otherLogs.length}
            </span>
          </div>
          <div className="space-y-1.5">
            {otherLogs.map((log) => {
              const icon = log.action === "edit" ? "✏️" : log.action === "delete" ? "🗑️" : "📝";
              return (
                <div
                  key={log.id}
                  className="flex items-start gap-2 text-xs py-1.5 px-2.5 rounded-md bg-muted/30 border border-border/50 hover:bg-accent/5 transition-colors soft-hover-bg"
                >
                  <span className="shrink-0 mt-0.5">{icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-medium text-foreground">
                        {log.action === "edit" ? "تعديل" : log.action === "delete" ? "حذف" : log.action}
                      </span>
                      {log.field && (
                        <span className="text-muted-foreground">— {log.field}</span>
                      )}
                    </div>
                    {log.oldValue != null && log.newValue != null && (
                      <div className="text-muted-foreground mt-0.5">
                        <span className="text-rose-500 line-through">{log.oldValue}</span>
                        <span className="mx-1">→</span>
                        <span className="text-emerald-600 font-medium">{log.newValue}</span>
                      </div>
                    )}
                    {log.details && (
                      <div className="text-muted-foreground mt-0.5">{log.details}</div>
                    )}
                  </div>
                  <span className="text-[10px] text-muted-foreground/60 whitespace-nowrap shrink-0">
                    {formatDateTimeAr(log.createdAt)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
