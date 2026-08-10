"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Phone, Search, RotateCcw, Clock, FileText, Paperclip, X, Upload } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  STATUS_META,
  formatDA,
  formatDateTimeAr,
} from "@/lib/print-config";
import type { PrintOrderLite } from "@/lib/order-types";

import { EmptyState } from "@/components/app/empty-state";
import { OrderCardSkeleton } from "@/components/app/skeleton-cards";
import { LoyaltyChecker } from "@/components/app/loyalty-checker";

const ACCEPTED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
  "image/jpeg",
  "image/jpg",
  "image/png",
];
const ACCEPTED_EXT = ".pdf,.docx,.doc,.jpg,.jpeg,.png";

interface RepeatOrderProps {
  onRepeat: (order: PrintOrderLite, file?: File | null) => void;
}

export function RepeatOrder({ onRepeat }: RepeatOrderProps) {
  const [phone, setPhone] = useState("");
  const [orders, setOrders] = useState<PrintOrderLite[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [cardFiles, setCardFiles] = useState<Map<string, File>>(new Map());

  async function handleSearch(e?: React.FormEvent) {
    e?.preventDefault();
    const clean = phone.replace(/[\s\-+]/g, "");
    if (clean.length < 8) {
      toast.error("رقم الهاتف غير صحيح", {
        description: "أدخل رقماً جزائرياً صحيحاً (8 أرقام على الأقل)",
      });
      return;
    }
    setLoading(true);
    setSearched(true);
    try {
      const res = await fetch(
        `/api/orders/by-phone?phone=${encodeURIComponent(clean)}`
      );
      const d = await res.json();
      setOrders(d.orders || []);
      if ((d.orders || []).length === 0) {
        toast.info("لا توجد طلبات سابقة لهذا الرقم");
      } else {
        toast.success(`تم العثور على ${d.orders.length} طلب سابق`);
      }
    } catch {
      setOrders([]);
      toast.error("خطأ في البحث");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">

      <div className="rounded-xl bg-card border shadow-sm p-1">
        <div className="text-center py-5 px-4 mb-1">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-3">
            <RotateCcw className="h-7 w-7 text-amber-700 dark:text-amber-400" />
          </div>
          <h1 className="text-2xl font-bold mb-1">إعادة طلب سابق</h1>
          <p className="text-sm text-muted-foreground">
            أدخل رقم هاتفك لعرض كل طلباتك السابقة واختر أحدها وعدّله قبل التأكيد
          </p>
        </div>

        <form onSubmit={handleSearch} className="flex gap-2 px-4 pb-4">
          <div className="relative flex-1">
            <Phone className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="05XX XX XX XX"
              className="pr-9 h-12 text-base"
              dir="ltr"
              type="tel"
            />
          </div>
          <Button
            type="submit"
            size="lg"
            className="h-12 px-6 bg-neutral-900 hover:bg-neutral-800 text-white"
            disabled={loading}
          >
            {loading ? (
              <span className="animate-pulse">بحث...</span>
            ) : (
              <>
                <Search className="h-4 w-4" />
                عرض طلباتي
              </>
            )}
          </Button>
        </form>
      </div>

      <p className="text-xs text-center text-muted-foreground">
        يُستخدم رقم هاتفك فقط لاسترجاع طلباتك السابقة
      </p>

      {/* برنامج الولاء */}
      <LoyaltyChecker />

      {loading && (
        <div className="space-y-3">
          <OrderCardSkeleton />
          <OrderCardSkeleton />
          <OrderCardSkeleton />
        </div>
      )}

      {searched && !loading && orders.length === 0 && (
        <EmptyState
          title="لا توجد طلبات سابقة لهذا الرقم"
          description="تأكد من الرقم أو ابدأ طلبك الأول"
          emoji="📱"
          actionLabel="تصفّح الخدمات"
          onAction={() => window.open("/", "_self")}
        />
      )}

      {orders.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-sm">
              {orders.length} طلب سابق
            </h2>
            <span className="text-xs text-muted-foreground">
              اختر طلباً لتعديله وإرساله من جديد
            </span>
          </div>
          <div className="space-y-3">
            {orders.map((o) => (
              <RepeatOrderCard
                key={o.id}
                order={o}
                onRepeat={onRepeat}
                selectedFile={cardFiles.get(o.id) || null}
                onFileChange={(f) => {
                  setCardFiles((prev) => {
                    const next = new Map(prev);
                    if (f) next.set(o.id, f);
                    else next.delete(o.id);
                    return next;
                  });
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function RepeatOrderCard({
  order,
  onRepeat,
  selectedFile,
  onFileChange,
}: {
  order: PrintOrderLite;
  onRepeat: (o: PrintOrderLite, file?: File | null) => void;
  selectedFile: File | null;
  onFileChange: (f: File | null) => void;
}) {
  const meta = STATUS_META[order.status];
  const serviceEmoji: Record<string, string> = {
    document: "🖨️",
    photo: "🖼️",
    binding: "📚",
    copy: "📄",
    card: "🪪",
    poster: "📜",
  };
  const inputRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  const handlePick = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0] || null;
      if (f && !ACCEPTED_TYPES.includes(f.type) && !ACCEPTED_EXT.split(",").some((ext) => f.name.toLowerCase().endsWith(ext))) {
        toast.error("نوع الملف غير مدعوم", {
          description: "يرجى اختيار PDF, DOCX, DOC, JPG, أو PNG",
        });
        e.target.value = "";
        return;
      }
      onFileChange(f);
      if (f) {
        toast.success("تم اختيار ملف جديد", { description: f.name });
      }
    },
    [onFileChange],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const f = e.dataTransfer.files?.[0] || null;
      if (f && !ACCEPTED_TYPES.includes(f.type) && !ACCEPTED_EXT.split(",").some((ext) => f.name.toLowerCase().endsWith(ext))) {
        toast.error("نوع الملف غير مدعوم", {
          description: "يرجى اختيار PDF, DOCX, DOC, JPG, أو PNG",
        });
        return;
      }
      onFileChange(f);
      if (f) {
        toast.success("تم اختيار ملف جديد", { description: f.name });
      }
    },
    [onFileChange],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  function formatFileSize(bytes: number) {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  }

  return (
    <Card className="hover:shadow-md transition-shadow overflow-hidden">
      <CardContent className="p-0">
        <div className="p-3 md:p-4 flex items-start sm:items-center gap-3 sm:gap-4">
          <div className="w-11 h-11 md:w-12 md:h-12 rounded-xl bg-neutral-900 flex items-center justify-center shrink-0">
            <span className="text-lg md:text-xl">{serviceEmoji[order.serviceType] || "🖨️"}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="font-bold text-sm">{order.serviceName}</span>
              <span className={"text-xs px-2 py-0.5 rounded-full border " + (meta?.bg || "")}>
                {meta?.label}
              </span>
            </div>
            <div className="text-xs text-muted-foreground flex items-center gap-3 flex-wrap">
              <span className="font-mono">{order.reference}</span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatDateTimeAr(order.createdAt)}
              </span>
            </div>
            <div className="text-xs text-muted-foreground mt-1 flex items-center gap-3 flex-wrap">
              <span>{order.pages} صفحة · {order.copies} نسخة</span>
              {order.fileName && (
                <span className="flex items-center gap-1 truncate max-w-[120px] sm:max-w-[150px]">
                  <FileText className="h-3 w-3" />
                  {order.fileName}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto mt-2 sm:mt-0">
            <div className="text-left">
              <div className="text-[10px] sm:text-xs text-muted-foreground">المجموع</div>
              <div className="font-bold text-amber-700 dark:text-amber-400">{formatDA(order.total)}</div>
            </div>
            <Button
              size="sm"
              className="shrink-0 bg-neutral-900 hover:bg-neutral-800 text-white text-xs sm:text-sm"
              onClick={() => {
                onRepeat(order, selectedFile);
                toast.success("تم تحميل الطلب للتعديل", {
                  description: selectedFile
                    ? "سيتم استخدام الملف الجديد المحدد"
                    : "عدّل ما تريد ثم أكّد الطلب الجديد",
                });
              }}
            >
              <RotateCcw className="h-4 w-4" />
              <span className="hidden xs:inline">تعديل وإعادة</span>
              <span className="xs:hidden">إعادة</span>
            </Button>
          </div>
        </div>

        {/* منطقة رفع ملف جديد (اختياري) */}
        <div className="px-4 pb-3">
          <div
            ref={dropRef}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            className="w-full md:w-[60%] md:mx-auto"
          >
            <AnimatePresence mode="wait">
              {selectedFile ? (
                <motion.div
                  key="selected"
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center gap-2.5 rounded-lg border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/30 px-3 py-2"
                >
                  <Paperclip className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{selectedFile.name}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {formatFileSize(selectedFile.size)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onFileChange(null);
                      if (inputRef.current) inputRef.current.value = "";
                    }}
                    className="shrink-0 w-6 h-6 flex items-center justify-center rounded-full hover:bg-amber-200 dark:hover:bg-amber-800/50 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="إزالة الملف"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </motion.div>
              ) : (
                <motion.button
                  key="dropzone"
                  type="button"
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.2 }}
                  onClick={handlePick}
                  className="w-full flex flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-muted-foreground/30 hover:border-amber-400 dark:hover:border-amber-500 bg-muted/20 hover:bg-amber-50 dark:hover:bg-amber-950/20 px-3 py-3 transition-colors cursor-pointer"
                >
                  <Upload className="h-4 w-4 text-muted-foreground" />
                  <span className="text-[11px] text-muted-foreground text-center leading-relaxed">
                    اسحب ملف جديد هنا أو انقر للاختيار
                  </span>
                </motion.button>
              )}
            </AnimatePresence>
            <input
              ref={inputRef}
              type="file"
              accept={ACCEPTED_EXT}
              onChange={handleInputChange}
              className="hidden"
              aria-label="اختيار ملف جديد"
            />
          </div>
        </div>

        <div className="px-4 pb-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-muted-foreground">
          <Detail label="الطباعة" value={order.options.color === "color" ? "ملون" : "أبيض وأسود"} />
          <Detail label="الورق" value={order.options.paperSize + " · " + order.options.paperType} />
          <Detail label="التجليد" value={order.options.binding === "none" ? "بدون" : order.options.binding} />
          <Detail label="النسخ" value={String(order.copies)} />
        </div>
      </CardContent>
    </Card>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded bg-muted/40 px-2 py-1">
      <span className="text-muted-foreground">{label}: </span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}