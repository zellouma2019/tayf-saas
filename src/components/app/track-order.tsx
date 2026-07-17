"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Package, Inbox, QrCode, Download, Clock, Loader2, FileText, Copy, CheckCircle2, Truck, Lightbulb, XCircle, Share2 } from "lucide-react";
import QRCode from "qrcode";
import { downloadInvoicePDF } from "@/lib/pdf-invoice";
import { shopApi } from "@/lib/shop-api";
import {
  STATUS_META,
  STATUS_FLOW,
  formatDA,
  formatDateAr,
  formatDateTimeAr,
} from "@/lib/print-config";
import type { PrintOrderLite } from "@/lib/order-types";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { motion } from "framer-motion";
import { toast } from "sonner";

const SERVICE_EMOJI: Record<string, string> = {
  document: "🖨️",
  photo: "🖼️",
  binding: "📚",
  copy: "📄",
  card: "🪪",
  poster: "📜",
};

export function TrackOrder() {
  const [query, setQuery] = useState("");
  const [orders, setOrders] = useState<PrintOrderLite[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  async function handleSearch(e?: React.FormEvent) {
    e?.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const res = await shopApi(`/api/track?q=${encodeURIComponent(query.trim())}`);
      const d = await res.json();
      setOrders(d.orders || []);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* منطقة البحث مع خلفية محسّنة */}
      <div className="relative rounded-2xl bg-gradient-to-br from-violet-50 to-slate-50 border border-slate-200/60 p-6 md:p-8 mb-8 text-center overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(139,92,246,0.06),transparent_50%)]" />
        <div className="relative">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-violet-100 to-indigo-100 flex items-center justify-center mb-3 shadow-sm">
            <Search className="h-7 w-7 text-violet-600" />
          </div>
          <h1 className="text-2xl font-bold mb-1">تتبّع طلبك</h1>
          <p className="text-sm text-muted-foreground">
            أدخل رقم الطلب أو رقم هاتفك لمعرفة حالة طلبك
          </p>
        </div>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2 mb-3">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="مثال: A-1050 أو 0560..."
            className="pr-9 h-12 text-base"
            dir="ltr"
          />
        </div>
        <Button type="submit" size="lg" className="h-12 px-6 bg-neutral-900 hover:bg-neutral-800 text-white">
          تتبّع
        </Button>
      </form>

      {/* تلميح البحث */}
      <p className="text-xs text-center text-muted-foreground mb-6 flex items-center justify-center gap-1.5">
        <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
        تلميح: أدخل رقم الطلب مثل A-1050 أو رقم هاتفك
      </p>

      {loading && (
        <div className="flex flex-col items-center py-16 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin text-violet-500 mb-3" />
          <p className="text-sm font-medium">جارٍ البحث عن طلبك...</p>
        </div>
      )}

      {!loading && searched && orders.length === 0 && (
        <Card>
          <CardContent className="py-16 text-center">
            <Inbox className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-sm font-medium">لا توجد طلبات مطابقة</p>
            <p className="text-xs text-muted-foreground mt-1">
              تأكد من رقم الطلب أو رقم الهاتف وحاول مرة أخرى
            </p>
          </CardContent>
        </Card>
      )}

      {!loading && orders.length > 0 && (
        <motion.div
          className="space-y-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          {orders.map((o, i) => (
            <motion.div
              key={o.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: i * 0.1, ease: "easeOut" }}
            >
              <OrderTrackingCard order={o} />
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}

function OrderTrackingCard({ order }: { order: PrintOrderLite }) {
  const meta = STATUS_META[order.status];
  const currentStep = meta.step;
  const customer = order.customer;
  const delivery = order.delivery;
  const DELIVERY_LABELS: Record<string, string> = {
    hour: "خلال ساعة",
    today: "اليوم",
    tomorrow: "غداً",
    scheduled: formatDateAr(delivery.date),
  };
  const [qrUrl, setQrUrl] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleShare = useCallback(async () => {
    const url = `${window.location.origin}?track=${order.reference}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("تم نسخ رابط التتبع");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("فشل نسخ الرابط");
    }
  }, [order.reference]);

  useEffect(() => {
    QRCode.toDataURL(
      JSON.stringify({ ref: order.reference, total: order.total, ts: Date.now() }),
      { width: 160, margin: 1, color: { dark: "#1a1a1a", light: "#ffffff" } },
    ).then(setQrUrl).catch(() => {});
  }, [order.reference, order.total]);

  const [pdfLoading, setPdfLoading] = useState(false);

  async function downloadInvoice() {
    setPdfLoading(true);
    await downloadInvoicePDF(order.id, order.reference);
    setPdfLoading(false);
  }

  async function handleCancel() {
    setCancelling(true);
    try {
      const res = await shopApi("/api/track/cancel", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference: order.reference }),
      });
      if (res.ok) {
        toast.success("تم إلغاء الطلب بنجاح");
        // تحديث الحالة محلياً
        order.status = "cancelled";
        // إجبار إعادة التصيير
        window.location.reload();
      } else {
        const d = await res.json();
        toast.error(d.error || "فشل إلغاء الطلب");
      }
    } catch {
      toast.error("خطأ في الاتصال بالخادم");
    } finally {
      setCancelling(false);
    }
  }

  const serviceEmoji = SERVICE_EMOJI[order.serviceType] || "🖨️";

  return (
    <Card className="overflow-hidden shadow-lg shadow-slate-200/40 dark:shadow-slate-900/40 hover:shadow-xl dark:hover:shadow-slate-800/50 transition-shadow duration-300">
      <CardContent className="p-0">
        {/* الرأس */}
        <div className="px-5 py-4 border-b flex items-center justify-between bg-neutral-900 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400 flex items-center justify-center">
              <Package className="h-5 w-5 text-neutral-900" />
            </div>
            <div>
              <div className="font-mono font-bold text-sm text-amber-400">{order.reference}</div>
              <div className="text-xs text-neutral-300">
                {serviceEmoji} {order.serviceName} · {formatDateTimeAr(order.createdAt)}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {order.status === "pending" && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-rose-400 hover:text-rose-300 hover:bg-rose-900/30 text-xs gap-1"
                    disabled={cancelling}
                  >
                    <XCircle className="h-3.5 w-3.5" />
                    إلغاء الطلب
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent dir="rtl">
                  <AlertDialogHeader>
                    <AlertDialogTitle>تأكيد إلغاء الطلب</AlertDialogTitle>
                    <AlertDialogDescription>
                      هل أنت متأكد من إلغاء الطلب <span className="font-mono font-bold text-foreground">{order.reference}</span>؟ لا يمكن التراجع عن هذا الإجراء.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>تراجع</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleCancel}
                      className="bg-rose-600 hover:bg-rose-700 text-white"
                    >
                      {cancelling ? "جارٍ الإلغاء..." : "نعم، إلغاء الطلب"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            <span className={`text-xs px-2.5 py-1 rounded-full border ${meta.bg}`}>
              {meta.label}
            </span>
            <Button
              size="sm"
              variant="ghost"
              className="text-neutral-400 hover:text-white hover:bg-white/10 text-xs gap-1"
              onClick={handleShare}
            >
              {copied ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> : <Share2 className="h-3.5 w-3.5" />}
              {copied ? "تم النسخ" : "مشاركة"}
            </Button>
          </div>
        </div>

        <div className="p-5 space-y-4">
            {/* نسبة الإنجاز */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="flex items-center gap-3 mb-1"
          >
            <div className="flex-1 h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-l from-emerald-400 via-emerald-500 to-teal-500 shadow-sm shadow-emerald-200 dark:shadow-emerald-900/30"
                initial={{ width: 0 }}
                animate={{ width: `${Math.round(Math.min(100, ((currentStep - 1) / (STATUS_FLOW.length - 1)) * 100))}%` }}
                transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
              />
            </div>
            <span className="text-xs font-bold text-emerald-600 min-w-[3ch] text-left tabular-nums">
              {Math.round(Math.min(100, ((currentStep - 1) / (STATUS_FLOW.length - 1)) * 100))}%
            </span>
          </motion.div>

            {/* خط الزمن المحسّن */}
          <div className="bg-gradient-to-l from-slate-50 to-slate-100/50 dark:from-slate-900/50 dark:to-slate-800/30 rounded-xl p-4 border border-slate-200/60 dark:border-slate-700/60">
            <div className="flex items-center justify-between relative">
              {/* خط الربط الخلفي */}
              <div className="absolute top-4 right-6 left-6 h-1 bg-slate-200 dark:bg-slate-700 rounded-full" />
              <div
                className="absolute top-4 right-6 h-1 bg-gradient-to-l from-emerald-400 to-teal-500 rounded-full transition-all duration-500 shadow-sm shadow-emerald-200 dark:shadow-emerald-900/30"
                style={{ width: `${Math.min(100, ((currentStep - 1) / (STATUS_FLOW.length - 1)) * 100)}%` }}
              />
              {STATUS_FLOW.map((s, i) => {
                const done = i < currentStep - 1;
                const active = i === currentStep - 1;
                const m = STATUS_META[s];
                return (
                  <div key={s} className="flex-1 flex flex-col items-center relative z-10">
                    <motion.div
                      animate={active ? { scale: [1, 1.15, 1], boxShadow: [
                        "0 0 0 0 rgba(245,158,11,0.4)",
                        "0 0 0 8px rgba(245,158,11,0)",
                        "0 0 0 0 rgba(245,158,11,0.4)",
                      ]} : {}}
                      transition={active ? { repeat: Infinity, duration: 2, ease: "easeInOut" } : {}}
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm border-2 transition-colors duration-300 ${
                        done
                          ? "bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-200 dark:shadow-emerald-900/30"
                          : active
                            ? "bg-amber-400 border-amber-400 text-white shadow-md shadow-amber-200 dark:shadow-amber-900/30"
                            : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-400"
                      }`}
                    >
                      {done ? <CheckCircle2 className="h-4 w-4" /> : <span>{m.emoji}</span>}
                    </motion.div>
                    <div
                      className={`text-[11px] mt-1.5 text-center leading-tight ${
                        done || active ? "font-semibold text-foreground" : "text-muted-foreground/60"
                      }`}
                    >
                      {m.label}
                    </div>
                  </div>
                );
              })}
            </div>
            {meta.description && (
              <p className="text-xs text-center text-muted-foreground mt-3">{meta.description}</p>
            )}
          </div>

          {/* QR + الفاتورة + التسليم */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {qrUrl && (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-br from-amber-50 to-amber-100/30 border border-amber-200/60">
                <img src={qrUrl} alt="QR code" className="w-14 h-14 rounded-lg" />
                <div>
                  <div className="text-xs font-bold text-amber-800">رمز QR</div>
                  <div className="text-[11px] text-muted-foreground">أظهره عند الاستلام</div>
                </div>
              </div>
            )}
            <button
              onClick={downloadInvoice}
              disabled={pdfLoading}
              className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-br from-violet-50 to-violet-100/30 border border-violet-200/60 hover:from-violet-100 hover:to-violet-100/50 transition-all text-right disabled:opacity-60"
            >
              {pdfLoading ? (
                <Loader2 className="h-5 w-5 text-violet-600 shrink-0 animate-spin" />
              ) : (
                <FileText className="h-5 w-5 text-violet-600 shrink-0" />
              )}
              <div>
                <div className="text-xs font-bold text-violet-800">{pdfLoading ? "جارٍ الإنشاء..." : "فاتورة PDF"}</div>
                <div className="text-[11px] text-muted-foreground">تنزيل الفاتورة</div>
              </div>
            </button>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100/30 border border-blue-200/60">
              <Truck className="h-5 w-5 text-blue-600 shrink-0" />
              <div>
                <div className="text-xs font-bold text-blue-800">التسليم</div>
                <div className="text-[11px] text-muted-foreground">{DELIVERY_LABELS[delivery.mode] || delivery.mode}</div>
              </div>
            </div>
          </div>

          {/* الوقت المتوقع */}
          <div className="flex items-center gap-2.5 text-xs text-blue-700 bg-gradient-to-l from-blue-50 to-sky-50/30 border border-blue-200/60 rounded-xl p-3">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
              <Clock className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <div className="text-blue-900 font-bold">{order.estimatedHours} ساعة</div>
              <div className="text-blue-500">الوقت المتوقع للتسليم</div>
            </div>
          </div>

          {/* التفاصيل */}
          <div className="grid grid-cols-2 gap-2 text-sm">
            <Detail label="العميل" value={customer.name} />
            <Detail label="الهاتف" value={customer.phone} />
            <Detail label="عدد الصفحات" value={`${order.pages} صفحة × ${order.copies} نسخة`} />
            <Detail label="التسليم" value={DELIVERY_LABELS[delivery.mode] || delivery.mode} />
            <Detail label="المجموع" value={formatDA(order.total)} highlight />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function Detail({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="rounded-lg bg-muted/30 p-3 border-r-[3px] border-r-amber-400/60">
      <div className="text-xs text-muted-foreground mb-0.5">{label}</div>
      <div className={`text-sm font-semibold truncate ${highlight ? "text-amber-700 font-bold" : ""}`} dir="auto">
        {value}
      </div>
    </div>
  );
}