"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Package, Clock, FileText, Eye, Printer } from "lucide-react";
import { OrderTimeline } from "@/components/app/order-timeline";
import { toast } from "sonner";
import {
  STATUS_META,
  formatDA,
  formatDateTimeAr,
} from "@/lib/print-config";
import type { PrintOrderLite } from "@/lib/order-types";
import { EmptyState } from "@/components/app/empty-state";
import { shopApi } from "@/lib/shop-api";

function isPdfFile(fileType: string | null): boolean {
  if (!fileType) return false;
  return fileType.toUpperCase() === "PDF";
}

function isImageFile(fileType: string | null): boolean {
  if (!fileType) return false;
  const t = fileType.toUpperCase();
  return ["JPG", "JPEG", "PNG", "WEBP", "GIF"].includes(t);
}

/* ── Countdown hook ── */
function useCountdown(estimatedReadyDate: string | null) {
  const [text, setText] = useState("");
  const [isOverdue, setIsOverdue] = useState(false);

  useEffect(() => {
    function calc() {
      if (!estimatedReadyDate) return;
      const now = Date.now();
      const target = new Date(estimatedReadyDate).getTime();
      const diff = target - now;

      if (diff <= 0) {
        const overMs = now - target;
        const overH = Math.floor(overMs / (1000 * 60 * 60));
        setIsOverdue(true);
        setText(`متأخر ${overH} ساعة`);
      } else if (diff < 1000 * 60 * 60) {
        setIsOverdue(false);
        setText("أقل من ساعة");
      } else {
        const h = Math.floor(diff / (1000 * 60 * 60));
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        setIsOverdue(false);
        setText(`~${h} ساعة و ${m} دقيقة`);
      }
    }
    calc();
    const id = setInterval(calc, 60_000);
    return () => clearInterval(id);
  }, [estimatedReadyDate]);

  return { text, isOverdue };
}

export function TrackOrder() {
  const [query, setQuery] = useState("");
  const [orders, setOrders] = useState<PrintOrderLite[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [resultInfo, setResultInfo] = useState<string | null>(null);

  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastQueryRef = useRef("");

  const performSearch = useCallback((q: string) => {
    if (!q.trim()) return;
    setLoading(true);
    shopApi(`/api/track?q=${encodeURIComponent(q)}`)
      .then((r) => r.json())
      .then((d) => {
        setOrders(d.orders || []);
        setResultInfo(d.resultInfo || null);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
        setOrders([]);
      });
  }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) {
      toast.error("أدخل رقم الطلب أو رقم الهاتف");
      return;
    }
    setSearched(true);
    performSearch(query);
  }

  const handleQueryChange = useCallback((value: string) => {
    setQuery(value);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    if (value.trim() && value !== lastQueryRef.current) {
      searchTimerRef.current = setTimeout(() => {
        lastQueryRef.current = value;
        setSearched(true);
        performSearch(value);
      }, 600);
    }
  }, [performSearch]);

  const handleViewFile = (order: PrintOrderLite) => {
    if (isPdfFile(order.fileType)) {
      window.open(`/api/orders/${order.id}/file`, "_blank");
    } else if (isImageFile(order.fileType)) {
      window.open(`/api/orders/${order.id}/file`, "_blank");
    } else {
      toast.info("لا يمكن معاينة هذا الملف");
    }
  };

  const statusCounts: Record<string, number> = {};
  orders.forEach((o) => {
    const s = o.status;
    statusCounts[s] = (statusCounts[s] || 0) + 1;
  });

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="rounded-xl bg-card border shadow-sm p-1">
        <div className="text-center py-8 px-4 mb-1">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-4">
            <Package className="h-8 w-8 text-amber-700 dark:text-amber-400" />
          </div>
          <h1 className="text-2xl font-bold mb-1">تتبّع طلبك</h1>
          <p className="text-sm text-muted-foreground">
            أدخل رقم الطلب أو رقم هاتفك لمعرفة حالة طلبك
          </p>
        </div>

        <form onSubmit={handleSearch} className="flex gap-2 px-4 pb-4">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              placeholder="مثال: A-1050 أو 0560..."
              className="pr-9 h-12 text-base"
              dir="ltr"
            />
          </div>
          <Button type="submit" size="lg" className="h-12 px-6 bg-neutral-900 hover:bg-neutral-800 text-white" disabled={loading}>
            {loading ? (
              <span className="animate-pulse">جارٍ البحث...</span>
            ) : (
              "تتبّع"
            )}
          </Button>
        </form>

        {resultInfo && (
          <div className="mx-4 mb-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-sm text-center">
            {resultInfo}
          </div>
        )}

        {loading && (
          <div className="text-center py-12 text-muted-foreground text-sm">
            <div className="flex items-center justify-center gap-2">
              <div className="h-4 w-4 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
              جارٍ البحث...
            </div>
          </div>
        )}

        {!loading && searched && orders.length === 0 && (
          <EmptyState
            title="لا توجد طلبات مطابقة"
            description="تأكد من الرقم أو رقم الهاتف وحاول مرة أخرى"
            emoji="🔍"
            actionLabel="تصفّح الخدمات"
            onAction={() => window.open("/", "_self")}
          />
        )}

        {!loading && orders.length > 0 && (
          <div className="px-4 pb-4 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{orders.length} نتيجة</span>
              <div className="flex gap-2">
                {Object.entries(statusCounts).map(([status, count]) => {
                  const meta = STATUS_META[status as keyof typeof STATUS_META];
                  return meta ? (
                    <span key={status} className={`text-xs px-2 py-0.5 rounded-full border ${meta.bg}`}>
                      {meta.label}: {count}
                    </span>
                  ) : null;
                })}
              </div>
            </div>
            {orders.map((o) => (
              <OrderTrackingCard key={o.id} order={o} onViewFile={handleViewFile} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function OrderTrackingCard({
  order,
  onViewFile,
}: {
  order: PrintOrderLite;
  onViewFile: (order: PrintOrderLite) => void;
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

  const isActive = order.status === "pending" || order.status === "printing";
  const showCountdown = order.status !== "delivered" && order.status !== "cancelled";
  const estimatedReadyDate = order.estimatedHours
    ? new Date(new Date(order.createdAt).getTime() + order.estimatedHours * 60 * 60 * 1000).toISOString()
    : null;
  const countdown = useCountdown(showCountdown ? estimatedReadyDate : null);

  return (
    <motion.div
      whileHover={{ scale: 1.01, y: -2 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className="group"
    >
    <Card className="hover:shadow-lg transition-all duration-300 overflow-hidden border-l-4 bg-card" style={{ borderLeftColor: getStatusColor(order.status) }}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl bg-neutral-900 dark:bg-neutral-800 flex items-center justify-center shrink-0">
            <span className="text-lg">{serviceEmoji[order.serviceType] || "🖨️"}</span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="font-bold text-sm">{order.serviceName}</span>
              {meta && (
                <span className={`text-xs px-2 py-0.5 rounded-full border flex items-center gap-1.5 ${meta.bg}`}>
                  {isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                  )}
                  {meta.label}
                </span>
              )}
            </div>
            {/* Countdown badge */}
            {showCountdown && countdown.text && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium flex items-center gap-1 ${
                countdown.isOverdue
                  ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                  : "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"
              }`}>
                <Clock className="h-3 w-3" />
                {countdown.text}
              </span>
            )}
            <div className="text-xs text-muted-foreground flex items-center gap-3 flex-wrap">
              <span className="font-mono text-amber-700 dark:text-amber-400">{order.reference}</span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatDateTimeAr(order.createdAt)}
              </span>
            </div>
            <div className="text-xs text-muted-foreground mt-1.5 flex items-center gap-3 flex-wrap">
              <span>{order.pages} صفحة</span>
              <span>·</span>
              <span>{order.copies} نسخة</span>
              <span>·</span>
              <span className="font-bold text-amber-700 dark:text-amber-400">{formatDA(order.total)}</span>
              {order.fileName && (
                <>
                  <span>·</span>
                  <span className="flex items-center gap-1 truncate max-w-[120px]">
                    <FileText className="h-3 w-3" />
                    {order.fileName}
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="flex gap-1.5 shrink-0">
            {order.fileType && (
              <Button
                size="sm"
                variant="outline"
                className="h-8 px-2 text-xs"
                onClick={() => onViewFile(order)}
              >
                <Eye className="h-3.5 w-3.5" />
                معاينة
              </Button>
            )}
          </div>
        </div>

        <div className="mt-3">
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500 ease-out"
              style={{
                width: `${getProgressPercent(order.status)}%`,
                backgroundImage: 'linear-gradient(90deg, #d97706, #f59e0b, #d97706)',
              }}
            />
          </div>
          <div className="flex justify-between mt-1 text-[10px] text-muted-foreground">
            <span>تم الاستلام</span>
            <span>جاهز للاستلام</span>
          </div>
        </div>
      </CardContent>

      {order.adminNotes && getPublicNote(order.adminNotes) && (
        <div className="mx-4 mb-2">
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 rounded-xl p-4">
            <div className="flex items-start gap-2">
              <Printer className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-amber-700 dark:text-amber-400 mb-1">ملاحظة من المطبعة</p>
                <p className="text-sm text-amber-800 dark:text-amber-200 whitespace-pre-wrap">
                  {getPublicNote(order.adminNotes)!}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="px-4 pb-4">
        <div className="p-5 bg-card rounded-2xl border card-elevated">
          <OrderTimeline
            status={order.status}
            createdAt={order.createdAt}
            startedPrintingAt={order.startedPrintingAt}
            completedPrintingAt={order.completedPrintingAt}
            readyAt={order.readyAt}
            deliveredAt={order.deliveredAt}
            estimatedHours={order.estimatedHours}
            reference={order.reference}
          />
        </div>
      </div>
    </Card>
    </motion.div>
  );
}

function getProgressPercent(status: string): number {
  const map: Record<string, number> = {
    pending: 10,
    confirmed: 25,
    printing: 50,
    quality_check: 70,
    ready: 90,
    delivered: 100,
    cancelled: 0,
  };
  return map[status] || 15;
}

function getPublicNote(adminNotes: string): string | null {
  const lines = adminNotes.split("\n");
  const publicLines = lines
    .filter((line) => line.trim().startsWith("عام:"))
    .map((line) => line.trim().replace(/^عام:\s*/, ""));
  return publicLines.length > 0 ? publicLines.join("\n") : null;
}

function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    pending: "#d97706",
    confirmed: "#b45309",
    printing: "#d97706",
    quality_check: "#92400e",
    ready: "#059669",
    delivered: "#065f46",
    cancelled: "#e11d48",
  };
  return map[status] || "#999";
}