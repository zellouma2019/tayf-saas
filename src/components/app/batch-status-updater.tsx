"use client";

import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Layers, ArrowLeftRight, CheckCircle2,
  Loader2, AlertCircle, ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { STATUS_META } from "@/lib/print-config";
import { STATUS_COLORS } from "@/lib/admin-utils";

// ===== BatchStatusUpdater =====
// أداة تحديث حالة طلبات متعددة دفعة واحدة

interface BatchOrder {
  id: string;
  orderNumber: string;
  currentStatus: string;
  shopName: string;
}

interface BatchStatusUpdaterProps {
  /** قائمة الطلبات */
  orders: BatchOrder[];
  /** دالة التحديث */
  onUpdate: (orderId: string, newStatus: string) => void;
  /** الحالات المتاحة */
  availableStatuses: string[];
  className?: string;
}

export function BatchStatusUpdater({
  orders,
  onUpdate,
  availableStatuses,
  className,
}: BatchStatusUpdaterProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [newStatus, setNewStatus] = useState<string>("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateProgress, setUpdateProgress] = useState(0);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);

  // تبديل تحديد طلب
  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  // تحديد/إلغاء الكل
  const toggleSelectAll = useCallback(() => {
    if (selectedIds.size === orders.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(orders.map((o) => o.id)));
    }
  }, [selectedIds.size, orders]);

  // تنفيذ التحديث الدفعي
  const handleBatchUpdate = useCallback(async () => {
    if (selectedIds.size === 0 || !newStatus) return;
    setIsUpdating(true);
    setUpdateProgress(0);

    const ids = Array.from(selectedIds);
    for (let i = 0; i < ids.length; i++) {
      onUpdate(ids[i], newStatus);
      setUpdateProgress(((i + 1) / ids.length) * 100);
      // تأخير بسيط للعرض البصري
      await new Promise((r) => setTimeout(r, 200));
    }

    setIsUpdating(false);
    setSelectedIds(new Set());
    setNewStatus("");
    setUpdateProgress(0);
  }, [selectedIds, newStatus, onUpdate]);

  const hasSelection = selectedIds.size > 0;
  const allSelected = selectedIds.size === orders.length && orders.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={cn("widget-glass rounded-2xl overflow-hidden", className)}
      dir="rtl"
    >
      {/* رأس المكون */}
      <div className="flex items-center justify-between p-4 border-b border-border/50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
            <Layers className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">تحديث دفعي</h3>
            <p className="text-[10px] text-muted-foreground">
              {orders.length} طلب — {selectedIds.size} محدد
            </p>
          </div>
        </div>

        {/* زر تحديد الكل */}
        <Button
          variant="ghost"
          size="sm"
          className="text-xs h-7"
          onClick={toggleSelectAll}
        >
          <Checkbox
            checked={allSelected}
            onCheckedChange={toggleSelectAll}
            className="ml-1.5"
          />
          تحديد الكل
        </Button>
      </div>

      {/* قائمة الطلبات */}
      <div className="max-h-64 overflow-y-auto">
        {orders.map((order) => {
          const isSelected = selectedIds.has(order.id);
          const statusMeta = STATUS_META[order.currentStatus];
          const statusColor = STATUS_COLORS[order.currentStatus];

          return (
            <div
              key={order.id}
              className={cn(
                "flex items-center gap-3 px-4 py-2.5 border-b border-border/30 transition-colors",
                isSelected && "bg-primary/5"
              )}
            >
              <Checkbox
                checked={isSelected}
                onCheckedChange={() => toggleSelect(order.id)}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-foreground font-mono">
                    {order.orderNumber}
                  </span>
                  <Badge
                    className={cn("text-[9px] border px-1.5 py-0", statusColor)}
                  >
                    {statusMeta?.label || order.currentStatus}
                  </Badge>
                </div>
                <span className="text-[10px] text-muted-foreground truncate block">
                  {order.shopName}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* شريط الإجراءات */}
      <AnimatePresence>
        {hasSelection && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-border/50"
          >
            {/* شريط التقدم */}
            {isUpdating && (
              <div className="h-1 bg-border">
                <div
                  className="h-full bg-primary transition-all duration-300 rounded-r-full"
                  style={{ width: `${updateProgress}%` }}
                />
              </div>
            )}

            <div className="flex items-center justify-between gap-3 p-3">
              {/* قائمة الحالات المنسدلة */}
              <div className="relative flex-1">
                <button
                  onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                  className={cn(
                    "select-custom w-full rounded-lg border border-border bg-background px-3 py-2 text-xs",
                    "flex items-center justify-between",
                    !newStatus && "text-muted-foreground"
                  )}
                  disabled={isUpdating}
                >
                  <span className="flex items-center gap-1.5">
                    {newStatus && STATUS_COLORS[newStatus] && (
                      <span className={cn("w-2 h-2 rounded-full", STATUS_COLORS[newStatus])} />
                    )}
                    {newStatus
                      ? STATUS_META[newStatus]?.label || newStatus
                      : "اختر الحالة الجديدة"}
                  </span>
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                </button>

                {/* القائمة المنسدلة المخصصة */}
                {showStatusDropdown && (
                  <div className="absolute top-full mt-1 w-full bg-popover border border-border rounded-lg shadow-lg z-50 overflow-hidden">
                    {availableStatuses.map((status) => {
                      const meta = STATUS_META[status];
                      const color = STATUS_COLORS[status];
                      return (
                        <button
                          key={status}
                          onClick={() => {
                            setNewStatus(status);
                            setShowStatusDropdown(false);
                          }}
                          className={cn(
                            "w-full flex items-center gap-2 px-3 py-2 text-xs text-right transition-colors",
                            "hover:bg-accent",
                            newStatus === status && "bg-accent"
                          )}
                        >
                          <span className={cn("w-2 h-2 rounded-full shrink-0", color)} />
                          <span>{meta?.label || status}</span>
                          <span className="text-muted-foreground mr-auto">{meta?.emoji}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* زر التأكيد */}
              <Button
                size="sm"
                className="gap-1.5 h-9 text-xs"
                onClick={handleBatchUpdate}
                disabled={!newStatus || isUpdating}
              >
                {isUpdating ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <ArrowLeftRight className="h-3.5 w-3.5" />
                )}
                {isUpdating ? `جارٍ التحديث...` : `تحديث ${selectedIds.size}`}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* رسالة فارغة */}
      {!hasSelection && (
        <div className="flex items-center justify-center gap-2 py-4 text-muted-foreground">
          <AlertCircle className="h-3.5 w-3.5" />
          <span className="text-xs">حدد طلباً واحداً على الأقل</span>
        </div>
      )}
    </motion.div>
  );
}
