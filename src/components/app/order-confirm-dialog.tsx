"use client";

import { ClipboardCheck, Loader2 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export interface OrderSummaryData {
  serviceName: string;
  serviceType: string;
  copies: number;
  pages: number;
  total: number;
  customerName: string;
  customerPhone: string;
  deliveryMode: string;
  fileName?: string;
}

interface OrderConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  orderSummary: OrderSummaryData;
  loading: boolean;
}

const SUMMARY_ROWS: { key: keyof OrderSummaryData; label: string }[] = [
  { key: "serviceName", label: "الخدمة" },
  { key: "copies", label: "عدد النسخ" },
  { key: "pages", label: "عدد الصفحات" },
  { key: "customerName", label: "اسم العميل" },
  { key: "customerPhone", label: "الهاتف" },
  { key: "deliveryMode", label: "طريقة التسليم" },
  { key: "fileName", label: "اسم الملف" },
];

export function OrderConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  orderSummary,
  loading,
}: OrderConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <AnimatePresence mode="wait">
          {open && (
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              <DialogHeader className="text-center sm:text-center">
                {/* أيقونة التأكيد */}
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100">
                  <ClipboardCheck className="h-7 w-7 text-amber-600" />
                </div>
                <DialogTitle className="text-xl font-bold">
                  تأكيد إرسال الطلب
                </DialogTitle>
                <DialogDescription className="sr-only">
                  مراجعة تفاصيل الطلب قبل تأكيد الإرسال
                </DialogDescription>
              </DialogHeader>

              {/* ملخص الطلب */}
              <div className="mt-4 space-y-0 divide-y divide-border rounded-lg border bg-muted/40">
                {SUMMARY_ROWS.map(({ key, label }) => {
                  const value = orderSummary[key];
                  if (key === "fileName" && !value) return null;
                  return (
                    <div
                      key={key}
                      className="flex items-center justify-between px-4 py-2.5 text-sm"
                    >
                      <span className="text-muted-foreground">{label}</span>
                      <span className="font-medium text-foreground mr-2">
                        {String(value)}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* المجموع */}
              <div className="mt-4 text-center">
                <p className="text-2xl font-bold text-amber-700">
                  المجموع: {orderSummary.total.toLocaleString("ar-DZ")} دج
                </p>
              </div>

              {/* أزرار الإجراءات */}
              <div className="mt-5 flex items-center justify-end gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => onOpenChange(false)}
                  disabled={loading}
                >
                  تعديل
                </Button>
                <Button
                  type="button"
                  className="bg-amber-500 text-white hover:bg-amber-600"
                  onClick={onConfirm}
                  disabled={loading}
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  تأكيد وإرسال
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}