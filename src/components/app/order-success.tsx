"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  Copy,
  Download,
  QrCode,
  Phone,
  Clock,
  Package,
  RefreshCw,
  Search,
  Plus,
  Loader2,
  MessageCircle,
  Star,
  Printer,
  Share2,
} from "lucide-react";
import QRCode from "qrcode";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { downloadInvoicePDF } from "@/lib/pdf-invoice";
import type { CreatedOrder } from "@/components/app/app-shell";
import {
  STATUS_FLOW,
  STATUS_META,
  formatDA,
} from "@/lib/print-config";

interface OrderSuccessProps {
  order: CreatedOrder | null;
  open: boolean;
  onClose: () => void;
  onNavigate: (view: "new" | "track" | "repeat") => void;
}

export function OrderSuccess({ order, open, onClose, onNavigate }: OrderSuccessProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [showQR, setShowQR] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [rating, setRating] = useState(0);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);

  useEffect(() => {
    if (order && open) {
      // توليد QR يحتوي على معلومات الطلب
      const qrPayload = JSON.stringify({
        ref: order.reference,
        service: order.serviceName,
        total: order.total,
        status: order.status,
        ts: Date.now(),
      });
      let active = true;
      QRCode.toDataURL(qrPayload, {
        width: 280,
        margin: 1,
        color: { dark: "#1a1a1a", light: "#ffffff" },
        errorCorrectionLevel: "M",
      })
        .then((url) => {
          if (active) {
            setQrDataUrl(url);
            setShowQR(false);
          }
        })
        .catch(() => {
          if (active) setQrDataUrl("");
        });
      return () => {
        active = false;
      };
    }
  }, [order, open]);

  if (!order) return null;

  function copyRef() {
    if (!order) return;
    navigator.clipboard.writeText(order.reference);
    toast.success("تم نسخ رقم الطلب");
  }

  async function downloadInvoice() {
    if (!order) return;
    setPdfLoading(true);
    await downloadInvoicePDF(order.id, order.reference);
    setPdfLoading(false);
  }

  function printThermalReceipt(o: CreatedOrder) {
    const statusMeta = STATUS_META[o.status] || STATUS_META.pending;
    const now = new Date();
    const dateStr = now.toLocaleDateString("ar-DZ", { year: "numeric", month: "long", day: "numeric" });
    const timeStr = now.toLocaleTimeString("ar-DZ", { hour: "2-digit", minute: "2-digit" });

    const html = `<!DOCTYPE html><html dir="rtl"><head><meta charset="utf-8"><title>إيصال - ${o.reference}</title>
<style>
  @page { size: 80mm auto; margin: 2mm; }
  body { font-family: 'Courier New', monospace; direction: rtl; margin: 0; padding: 4mm; width: 72mm; font-size: 11px; color: #000; }
  .center { text-align: center; }
  .bold { font-weight: bold; }
  .line { border-top: 1px dashed #333; margin: 4px 0; }
  .row { display: flex; justify-content: space-between; padding: 1px 0; }
  .big { font-size: 16px; font-weight: bold; }
  .status { display: inline-block; padding: 1px 8px; border: 1px solid #000; border-radius: 4px; font-size: 10px; margin: 2px 0; }
</style></head><body>
<div class="center">
  <div style="font-size:18px;font-weight:bold;">طيف للطباعة الذكية</div>
  <div style="font-size:10px;color:#555;">Tayf Smart Printing</div>
</div>
<div class="line"></div>
<div class="row"><span>الرقم:</span><span class="bold">${o.reference}</span></div>
<div class="row"><span>التاريخ:</span><span>${dateStr} ${timeStr}</span></div>
<div class="row"><span>الحالة:</span><span class="status">${statusMeta.emoji} ${statusMeta.label}</span></div>
<div class="line"></div>
<div class="row"><span>الخدمة:</span><span>${o.serviceName}</span></div>
<div class="row"><span>المجموع:</span><span class="big">${formatDA(o.total)}</span></div>
<div class="row"><span>التسليم المتوقع:</span><span>${o.estimatedHours} ساعة</span></div>
<div class="line"></div>
<div class="center" style="font-size:10px;color:#555;">
  <div>شكراً لاختياركم طيف</div>
  <div style="font-size:9px;margin-top:2px;">تتبع طلبك: ${typeof window !== 'undefined' ? window.location.origin : ''}/track</div>
</div>
<script>window.onload=function(){window.print();}</script>
</body></html>`;

    const win = window.open("", "_blank", "width=320,height=600");
    if (win) {
      win.document.write(html);
      win.document.close();
    } else {
      toast.error("لم يتم فتح نافذة الطباعة");
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg w-[calc(100vw-1rem)] p-0 gap-0 overflow-hidden max-h-[94vh] flex flex-col" dir="rtl" onInteractOutside={(e) => e.preventDefault()} aria-describedby={undefined}>
        <DialogTitle className="sr-only">تم استلام الطلب</DialogTitle>
        <div className="overflow-y-auto custom-scroll">
          {/* ===== رأس النجاح ===== */}
          <div className="bg-gradient-to-b from-emerald-50 to-white dark:from-emerald-950/40 dark:to-background p-5 sm:p-8 text-center relative overflow-hidden">
            {/* Confetti scattered dots */}
            <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
              {Array.from({ length: 20 }).map((_, i) => (
                <span
                  key={i}
                  className="confetti-dot absolute w-2 h-2 rounded-full"
                  style={{
                    backgroundColor: ['#8b5cf6', '#f59e0b', '#10b981', '#ec4899', '#3b82f6'][i % 5],
                    top: `${50 + Math.random() * 40}%`,
                    left: `${10 + Math.random() * 80}%`,
                    '--x': `${(Math.random() - 0.5) * 120}px`,
                    '--y': `${-60 - Math.random() * 80}px`,
                    '--r': `${Math.random() * 720 - 360}deg`,
                    '--dur': `${1.2 + Math.random() * 0.8}s`,
                    '--delay': `${Math.random() * 0.3}s`,
                  } as React.CSSProperties}
                />
              ))}
            </div>
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="text-3xl mb-3 tracking-widest"
            >🎉 ✨ 🎊</motion.div>
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.15 }}
              className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-emerald-200 via-emerald-300 to-teal-400 flex items-center justify-center mb-4 ring-4 ring-emerald-100 dark:ring-emerald-900/50 shadow-lg shadow-emerald-200/50 dark:shadow-emerald-800/30 animate-pulse-glow"
            >
              <CheckCircle2 className="h-12 w-12 text-emerald-600" />
            </motion.div>
            <h2 className="text-2xl font-bold mb-2">تم استلام طلبك بنجاح</h2>
            <p className="text-sm text-muted-foreground">
              طلبك الآن في النظام — سنتواصل معك قريباً لتأكيد التفاصيل
            </p>
          </div>

          <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
            {/* ===== رقم المعاملة + السعر ===== */}
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <div className="rounded-xl border bg-card p-3 sm:p-4 min-w-0">
                <div className="text-[11px] sm:text-xs text-muted-foreground mb-1">رقم المعاملة</div>
                <div className="flex items-center gap-1 min-w-0">
                  <span className="text-base sm:text-xl font-bold text-neutral-900 dark:text-neutral-100 font-mono tracking-wider truncate">
                    {order.reference}
                  </span>
                  <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={copyRef}>
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <div className="rounded-xl border bg-card p-3 sm:p-4">
                <div className="text-[11px] sm:text-xs text-muted-foreground mb-1">السعر التقديري</div>
                <div className="text-base sm:text-xl font-bold text-amber-700 dark:text-amber-400">{formatDA(order.total)}</div>
              </div>
            </div>

            {/* ===== QR + الفاتورة + إيصال ===== */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <button
                onClick={() => setShowQR(!showQR)}
                className="group flex flex-col items-center gap-1.5 p-3 sm:p-4 rounded-xl border-2 border-amber-300 bg-amber-50 hover:bg-amber-100 transition-colors"
              >
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-neutral-900 flex items-center justify-center shrink-0">
                  <QrCode className="h-4 w-4 sm:h-5 sm:w-5 text-amber-400" />
                </div>
                <div className="min-w-0 text-center">
                  <div className="font-bold text-[10px] sm:text-xs">رمز QR</div>
                  <div className="text-[9px] sm:text-[10px] text-muted-foreground">
                    {showQR ? "إخفاء" : "اعرض"}
                  </div>
                </div>
              </button>
              <button
                onClick={downloadInvoice}
                disabled={pdfLoading}
                className="group flex flex-col items-center gap-1.5 p-3 sm:p-4 rounded-xl border-2 border-neutral-200 bg-card hover:bg-neutral-50 hover:border-neutral-300 transition-colors disabled:opacity-60"
              >
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-amber-400 flex items-center justify-center shrink-0">
                  {pdfLoading ? (
                    <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 text-neutral-900 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4 sm:h-5 sm:w-5 text-neutral-900" />
                  )}
                </div>
                <div className="min-w-0 text-center">
                  <div className="font-bold text-[10px] sm:text-xs truncate">{pdfLoading ? "جارٍ..." : "فاتورة PDF"}</div>
                  <div className="text-[9px] sm:text-[10px] text-muted-foreground">تنزيل</div>
                </div>
              </button>
              <button
                onClick={() => printThermalReceipt(order)}
                className="group flex flex-col items-center gap-1.5 p-3 sm:p-4 rounded-xl border-2 border-neutral-200 bg-card hover:bg-neutral-50 hover:border-neutral-300 transition-colors"
              >
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shrink-0 shadow-sm">
                  <Printer className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </div>
                <div className="min-w-0 text-center">
                  <div className="font-bold text-[10px] sm:text-xs">إيصال حراري</div>
                  <div className="text-[9px] sm:text-[10px] text-muted-foreground">طباعة مباشرة</div>
                </div>
              </button>
            </div>

            {/* ===== عرض QR ===== */}
            {showQR && qrDataUrl && (
              <div className="rounded-2xl border-2 border-amber-300 bg-amber-50 p-4 sm:p-5 text-center animate-in fade-in zoom-in duration-300">
                <div className="inline-block bg-white p-2 sm:p-3 rounded-xl shadow-sm">
                  
                  <img src={qrDataUrl} alt={`QR ${order.reference}`} className="w-40 h-40 sm:w-48 sm:h-48 mx-auto" />
                </div>
                <p className="text-[11px] sm:text-xs text-muted-foreground mt-3">
                  اعرض هذا الرمز في المطبعة لاستلام طلبك بسرعة
                </p>
                <p className="text-xs font-mono font-bold text-neutral-900 dark:text-neutral-100 mt-1">{order.reference}</p>
              </div>
            )}

            {/* ===== الوقت المتوقع للتسليم ===== */}
            <div className="flex items-center gap-2.5 sm:gap-3 p-3 sm:p-4 rounded-xl bg-gold-500/10 border border-gold-500/20">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-gold-500 flex items-center justify-center shrink-0">
                <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[11px] sm:text-xs text-muted-foreground">الوقت المتوقع للتسليم</div>
                <div className="font-bold text-sm sm:text-base text-gold-400">
                  {order.estimatedHours} {order.estimatedHours === 1 ? "ساعة" : order.estimatedHours === 2 ? "ساعتان" : "ساعات"}
                </div>
              </div>
              <div className="text-[10px] sm:text-xs text-gold-500 text-left shrink-0">
                سيصلك إشعار<br />عند الجاهزية
              </div>
            </div>

            {/* ===== ملاحظة المكالمة ===== */}
            <div className="p-3 sm:p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700">
              <div className="flex items-center gap-2 mb-1">
                <Phone className="h-4 w-4 text-amber-600 shrink-0" />
                <span className="font-bold text-xs sm:text-sm">سنتواصل معك قبل بدء الطباعة</span>
              </div>
              <p className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed">
                سنتصل بك على الرقم المُدخل لتأكيد الطلب والتفاصيل النهائية قبل تنفيذ الطباعة.
                تأكد من توفّرك لاستقبال المكالمة.
              </p>
            </div>

            {/* ===== مراحل تنفيذ الطلب ===== */}
            <div>
              <h3 className="font-bold text-xs sm:text-sm mb-3 flex items-center gap-2">
                <Package className="h-4 w-4 text-amber-600 shrink-0" />
                مراحل تنفيذ الطلب
              </h3>
              <div className="space-y-0">
                {STATUS_FLOW.map((s, i) => {
                  const meta = STATUS_META[s];
                  const isCurrent = s === order.status;
                  const isDone = STATUS_FLOW.indexOf(order.status) > i;
                  return (
                    <div key={s} className="flex gap-2 sm:gap-3">
                      <div className="flex flex-col items-center shrink-0">
                        <div
                          className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-sm sm:text-base border-2 transition-all ${
                            isCurrent
                              ? "bg-amber-400 border-amber-400 scale-110 shadow-md"
                              : isDone
                                ? "bg-emerald-400 border-emerald-400"
                                : "bg-card border-muted"
                          }`}
                        >
                          {isDone ? (
                            <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                          ) : (
                            <span>{meta.emoji}</span>
                          )}
                        </div>
                        {i < STATUS_FLOW.length - 1 && (
                          <div className={`w-0.5 h-6 sm:h-8 ${isDone ? "bg-emerald-400" : "bg-muted"}`} />
                        )}
                      </div>
                      <div className="pt-1 pb-4 sm:pb-8 min-w-0">
                        <div className={`font-semibold text-xs sm:text-sm ${isCurrent ? "text-amber-700 dark:text-amber-400" : isDone ? "text-emerald-700 dark:text-emerald-400" : "text-muted-foreground"}`}>
                          {meta.label}
                          {isCurrent && (
                            <span className="mr-2 text-[10px] sm:text-xs px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 font-medium">
                              الحالية
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* تقييم الخدمة */}
            {!ratingSubmitted && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }} 
                className="text-center py-4"
              >
                <p className="text-sm text-muted-foreground mb-3">كيف كانت تجربتك؟</p>
                <div className="flex items-center justify-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="p-1 hover:scale-125 transition-transform"
                      aria-label={`${star} نجوم`}
                    >
                      <Star
                        className={cn(
                          "h-8 w-8 transition-colors",
                          star <= rating
                            ? "text-amber-400 fill-amber-400"
                            : "text-muted-foreground/30"
                        )}
                      />
                    </button>
                  ))}
                </div>
                {rating > 0 && (
                  <Button
                    onClick={() => { setRatingSubmitted(true); toast.success("شكراً لتقييمك! 🙏"); }}
                    className="mt-3 bg-amber-500 hover:bg-amber-600 text-white"
                    size="sm"
                  >
                    إرسال التقييم
                  </Button>
                )}
              </motion.div>
            )}
            {ratingSubmitted && (
              <div className="text-center py-3">
                <p className="text-sm text-amber-500 font-medium">شكراً لتقييمك! ❤️</p>
              </div>
            )}

            {/* ===== مشاركة حالة الطلب ===== */}
            <div className="space-y-2.5">
              <p className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                <Share2 className="h-3.5 w-3.5" />
                شارك حالة طلبك
              </p>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  className="w-full h-10 sm:h-11 btn-3d border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-800"
                  onClick={() => {
                    const trackUrl = `${window.location.origin}${window.location.pathname}?track=${order.reference}`;
                    navigator.clipboard.writeText(trackUrl).then(() =>
                      toast.success("تم نسخ رابط الطلب", { description: "يمكنك مشاركته مع أي شخص" })
                    );
                  }}
                >
                  <Copy className="h-4 w-4" />
                  نسخ رابط الطلب
                </Button>
                <Button
                  className="w-full h-10 sm:h-11 btn-3d bg-[#25D366] hover:bg-[#1da851] text-white border-0 font-bold shadow-lg shadow-[#25D366]/25"
                  onClick={() => {
                    const trackUrl = `${window.location.origin}${window.location.pathname}?track=${order.reference}`;
                    const text = `📋 طلب جديد على طيف!\n\n🔖 رقم الطلب: ${order.reference}\n🖨️ الخدمة: ${order.serviceName}\n💰 السعر: ${formatDA(order.total)}\n⏰ التسليم المتوقع: ${order.estimatedHours} ساعة\n\n📎 تابع طلبك هنا:\n${trackUrl}`;
                    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
                    window.open(whatsappUrl, "_blank");
                    toast.success("تم فتح واتساب", { description: "شارك تفاصيل طلبك" });
                  }}
                >
                  <MessageCircle className="h-4 w-4" />
                  مشاركة على واتساب
                </Button>
              </div>
              <div className="flex justify-center">
                <span className="badge-success text-[10px] px-2.5 py-1 rounded-full">تم استلام الطلب بنجاح ✅</span>
              </div>
            </div>

            {/* ===== أزرار الإجراءات ===== */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 sm:pt-2">
              <Button
                variant="outline"
                className="w-full h-10 sm:h-11"
                onClick={() => {
                  onClose();
                  onNavigate("repeat");
                }}
              >
                <RefreshCw className="h-4 w-4" />
                إعادة طلب
              </Button>
              <Button
                variant="outline"
                className="w-full h-10 sm:h-11 border-gold-300 dark:border-gold-500/20 bg-gold-50 dark:bg-gold-500/8 hover:bg-gold-100 dark:hover:bg-gold-500/15 hover:border-gold-400 dark:hover:border-gold-500 text-foreground dark:text-gold-200 transition-all duration-200"
                onClick={() => {
                  onClose();
                  onNavigate("track");
                }}
              >
                <Search className="h-4 w-4" />
                تابع طلبك
              </Button>
              <Button
                className="w-full h-10 sm:h-11 bg-neutral-900 hover:bg-neutral-800 text-white"
                onClick={() => {
                  onClose();
                  onNavigate("new");
                }}
              >
                <Plus className="h-4 w-4" />
                إنشاء طلب جديد
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
