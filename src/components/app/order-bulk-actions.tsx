"use client";

import { useState, useMemo, useCallback } from "react";
import {
  CheckSquare, XCircle, Printer, Download, MessageCircle, Trash2,
  ArrowUpDown, Eye, MoreHorizontal, Tag, Clock, Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { STATUS_META, STATUS_COLORS, STATUS_FLOW } from "@/lib/print-config";
import type { GlobalOrder } from "@/lib/admin-types";

interface OrderBulkActionsProps {
  selectedIds: Set<string>;
  orders: GlobalOrder[];
  onStatusChange: (ids: string[], newStatus: string) => void;
  onDelete: (ids: string[]) => void;
  onClearSelection: () => void;
  onRefresh: () => void;
  className?: string;
}

export function OrderBulkActions({
  selectedIds, orders, onStatusChange, onDelete, onClearSelection, onRefresh, className,
}: OrderBulkActionsProps) {
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const count = selectedIds.size;

  const selectedOrders = useMemo(() => {
    return orders.filter(o => selectedIds.has(o.id));
  }, [orders, selectedIds]);

  const totalAmount = useMemo(() => {
    return selectedOrders.reduce((s, o) => s + (o.total || 0), 0);
  }, [selectedOrders]);

  const handleBulkStatus = useCallback((newStatus: string) => {
    onStatusChange(Array.from(selectedIds), newStatus);
    toast.success(`تم تحديث حالة ${count} طلب إلى "${STATUS_META[newStatus]?.label || newStatus}"`);
  }, [selectedIds, count, onStatusChange]);

  const handleBulkDelete = useCallback(() => {
    onDelete(Array.from(selectedIds));
    setDeleteConfirmOpen(false);
    toast.success(`تم حذف ${count} طلب`);
  }, [selectedIds, count, onDelete]);

  const handleSelectAll = useCallback(() => {
    const allIds = orders.map(o => o.id);
    if (allIds.length === selectedIds.size) {
      onClearSelection();
    } else {
      onStatusChange(allIds, "");
    }
  }, [orders, selectedIds, onClearSelection, onStatusChange]);

  if (count === 0) return null;

  const availableTransitions = STATUS_FLOW.flatMap(({ from, to }) =>
    selectedOrders.some(o => o.status === from) ? to : []
  );
  const uniqueTransitions = [...new Set(availableTransitions)];

  return (
    <>
      <div
        className={cn(
          "flex items-center gap-3 p-3 rounded-xl border animate-fade-up",
          "bg-primary/5 border-primary/20 dark:bg-primary/10 dark:border-primary/30",
          className
        )}
        dir="rtl"
      >
        {/* العدد والتفاصيل */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 dark:bg-primary/20">
            <CheckSquare className="h-3.5 w-3.5 text-primary" />
            <span className="text-sm font-bold text-primary tabular-nums">{count}</span>
            <span className="text-xs text-primary/80">محدد</span>
          </div>
          {totalAmount > 0 && (
            <span className="text-xs text-muted-foreground truncate">
              المجموع: <span className="font-medium text-foreground tabular-nums">{totalAmount.toLocaleString('ar-DZ')} د.ج</span>
            </span>
          )}
        </div>

        {/* أزرار الإجراءات */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* تغيير الحالة */}
          {uniqueTransitions.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1 text-xs h-8 btn-icon-round">
                  <Tag className="h-3 w-3" />
                  تغيير الحالة
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {uniqueTransitions.map(status => (
                  <DropdownMenuItem
                    key={status}
                    onClick={() => handleBulkStatus(status)}
                    className="gap-2 text-xs"
                  >
                    <span className={cn("w-2 h-2 rounded-full", STATUS_COLORS[status] || "bg-gray-400")} />
                    {STATUS_META[status]?.label || status}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* طباعة */}
          <Button
            variant="outline"
            size="sm"
            className="gap-1 text-xs h-8"
            onClick={() => toast.info(`طباعة ${count} طلب...`)}
          >
            <Printer className="h-3 w-3" />
            طباعة
          </Button>

          {/* تصدير */}
          <Button
            variant="outline"
            size="sm"
            className="gap-1 text-xs h-8"
            onClick={() => toast.info(`تصدير ${count} طلب...`)}
          >
            <Download className="h-3 w-3" />
            تصدير
          </Button>

          {/* حذف */}
          <Button
            variant="outline"
            size="sm"
            className="gap-1 text-xs h-8 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
            onClick={() => setDeleteConfirmOpen(true)}
          >
            <Trash2 className="h-3 w-3" />
            حذف
          </Button>

          {/* إلغاء التحديد */}
          <Button
            variant="ghost"
            size="sm"
            className="text-xs h-8 text-muted-foreground"
            onClick={onClearSelection}
          >
            <XCircle className="h-3 w-3 ml-1" />
            إلغاء
          </Button>
        </div>
      </div>

      {/* تأكيد الحذف */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>حذف {count} طلب</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف {count} طلب محدد؟ لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              حذف {count} طلب
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
