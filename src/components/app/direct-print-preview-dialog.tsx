"use client";

import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, X } from "lucide-react";
import type { PrintOrderLite } from "@/lib/order-types";

interface DirectPrintPreviewDialogProps {
  order: PrintOrderLite;
  open: boolean;
  onClose: () => void;
  shopId: string;
  shopName: string;
  shopPhone: string;
  shopAddress: string | null;
  onPrintStart: () => void;
  onPrintComplete: () => void;
}

export function DirectPrintPreviewDialog({
  order,
  open,
  onClose,
  shopName,
}: DirectPrintPreviewDialogProps) {
  if (!order) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg" dir="rtl">
        <DialogTitle className="flex items-center gap-2">
          <Printer className="h-5 w-5" />
          معاينة الطباعة المباشرة
        </DialogTitle>
        <DialogDescription>
          معاينة وتأكيد طباعة الطلب #{order.orderNumber || order.id} — {shopName}
        </DialogDescription>

        <div className="space-y-4 py-4">
          <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-2 text-sm">
            <p><span className="text-muted-foreground">العميل:</span> {order.customerName || "—"}</p>
            <p><span className="text-muted-foreground">الخدمة:</span> {order.serviceName || "—"}</p>
            <p><span className="text-muted-foreground">الكمية:</span> {order.quantity ?? "—"}</p>
            <p><span className="text-muted-foreground">الملاحظات:</span> {order.notes || "لا يوجد"}</p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" onClick={onClose} className="gap-2">
            <X className="h-4 w-4" />
            إغلاق
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
