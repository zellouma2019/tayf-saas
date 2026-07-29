"use client";

import { useState, useRef, useEffect } from "react";
import { Bell, X, ArrowLeft, BellOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { STATUS_META } from "@/lib/print-config";
import { STATUS_COLORS } from "@/lib/admin-utils";
import type { GlobalOrder } from "@/lib/admin-types";

interface NotificationCenterProps {
  recentOrders: GlobalOrder[];
  onViewAll: () => void;
}

function getRelativeTime(iso: string): string {
  if (!iso) return "";
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return "الآن";
  if (diffMin < 60) return `منذ ${diffMin} دقائق`;
  if (diffHr < 24) return diffHr === 1 ? "منذ ساعة" : `منذ ${diffHr} ساعة`;
  if (diffDay === 1) return "اليوم";
  if (diffDay < 7) return `منذ ${diffDay} أيام`;
  return `منذ ${Math.floor(diffDay / 7)} أسبوع`;
}

function parseCustomerName(customer: unknown): string {
  if (!customer) return "—";
  if (typeof customer === "string") {
    try {
      const parsed = JSON.parse(customer);
      return parsed?.name || "—";
    } catch {
      return customer;
    }
  }
  if (typeof customer === "object" && customer !== null && "name" in customer) {
    return (customer as { name: string }).name || "—";
  }
  return "—";
}

export function NotificationCenter({ recentOrders, onViewAll }: NotificationCenterProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    if (open) document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open]);

  const count = recentOrders.length;

  return (
    <div ref={ref} className="relative shrink-0">
      {/* زر الجرس */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "relative h-9 w-9 flex items-center justify-center rounded-lg border transition-colors",
          "hover:bg-secondary text-muted-foreground hover:text-foreground",
          count > 0
            ? "border-rose-300 dark:border-rose-700"
            : "border-border"
        )}
        aria-label="الإشعارات"
      >
        <Bell className="h-4 w-4" />
        {count > 0 && (
          <span className="absolute -top-1.5 -left-1.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white leading-none border-2 border-background">
            {count > 9 ? "9+" : count}
          </span>
        )}
        {count > 0 && (
          <span className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-red-500" />
        )}
      </button>

      {/* لوحة الإشعارات */}
      {open && (
        <div
          className="absolute top-full left-0 mt-2 z-50 w-80 sm:w-96 rounded-xl glass-card shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200 overflow-hidden"
          dir="rtl"
        >
          {/* رأس */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-muted/30">
            <div className="flex items-center gap-2">
              <Bell className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs font-bold text-foreground">الإشعارات</span>
              {count > 0 && (
                <span className="flex items-center justify-center h-5 min-w-[20px] px-1.5 rounded-full bg-rose-500 text-[10px] font-bold text-white">
                  {count}
                </span>
              )}
            </div>
            <button
              onClick={() => setOpen(false)}
              className="p-1 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              aria-label="إغلاق"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* قائمة الإشعارات */}
          <div className="max-h-80 overflow-y-auto custom-scroll">
            {count === 0 ? (
              <div className="py-12 text-center">
                <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-muted/50 flex items-center justify-center">
                  <BellOff className="h-6 w-6 text-muted-foreground/40" />
                </div>
                <p className="text-xs font-medium text-muted-foreground">
                  لا توجد إشعارات جديدة
                </p>
                <p className="text-[10px] text-muted-foreground/50 mt-1">
                  ستظهر الإشعارات الجديدة هنا تلقائياً
                </p>
              </div>
            ) : (
              <div>
                {recentOrders.map((order) => {
                  const meta = STATUS_META[order.status] || STATUS_META.pending;
                  const customerName = parseCustomerName(order.customer);
                  return (
                    <div
                      key={order.id}
                      className="w-full text-right px-4 py-3 border-b border-border/30 last:border-b-0 hover:bg-muted/40 transition-colors"
                    >
                      <div className="flex items-start gap-2.5">
                        <span className="text-base mt-0.5 shrink-0">
                          {meta.emoji}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-xs font-bold font-mono text-foreground">
                              {order.reference}
                            </span>
                            <span
                              className={cn(
                                "text-[10px] px-1.5 py-0.5 rounded-md border",
                                STATUS_COLORS[order.status] || STATUS_COLORS.pending
                              )}
                            >
                              {meta.label}
                            </span>
                          </div>
                          <div className="text-[11px] text-muted-foreground truncate">
                            {customerName}
                          </div>
                          <div className="text-[10px] text-muted-foreground/60 mt-0.5 flex items-center gap-1.5">
                            <span className="truncate">{order.shopName}</span>
                            <span className="shrink-0">·</span>
                            <span className="shrink-0">
                              {getRelativeTime(order.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* تذييل - عرض الكل */}
          {count > 0 && (
            <div className="border-t border-border/50 p-2.5 bg-muted/20">
              <button
                onClick={() => {
                  setOpen(false);
                  onViewAll();
                }}
                className="w-full flex items-center justify-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors py-1.5 rounded-lg hover:bg-primary/5"
              >
                <span>عرض الكل</span>
                <ArrowLeft className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
