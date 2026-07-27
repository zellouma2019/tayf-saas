"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  X,
  Download,
  Printer,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Info,
  Loader2,
  ShieldCheck,
  Sparkles,
  FileText,
  Copy,
  Eye,
  Zap,
} from "lucide-react";
import type { PrintOrderLite } from "@/lib/order-types";
import {
  STATUS_META,
  formatDA,
  formatDateTimeAr,
} from "@/lib/print-config";
import {
  translateOptionKey,
  translateOptionValue,
  HIDDEN_OPTION_KEYS,
} from "@/lib/option-translations";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface DirectPrintPreviewDialogProps {
  order: PrintOrderLite | null;
  open: boolean;
  onClose: () => void;
  shopId: string;
  shopName: string;
  shopPhone: string;
  shopAddress: string | null;
  onPrintStart: () => void;
  onPrintComplete: () => void;
}

interface VerifyResult {
  success: boolean;
  canPrint: boolean;
  confidence: number;
  status: "match" | "warning" | "mismatch" | "no_file" | "no_preview";
  summary: string;
  alerts: string[];
  warnings: string[];
  checks: { label: string; passed: boolean; note: string }[];
  requirements?: string;
  fileName?: string | null;
  fileType?: string | null;
  isImage?: boolean;
  isPdf?: boolean;
  error?: string;
}

const SERVICE_EMOJI: Record<string, string> = {
  document: "🖨️",
  photo: "🖼️",
  binding: "📚",
  copy: "📄",
  card: "🪪",
  poster: "📜",
};

const IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "webp", "gif", "bmp"];

function isImageFile(fileName: string | null | undefined): boolean {
  if (!fileName) return false;
  const ext = fileName.split(".").pop()?.toLowerCase() || "";
  return IMAGE_EXTENSIONS.includes(ext);
}

function isPdfFile(fileName: string | null | undefined): boolean {
  return !!fileName?.toLowerCase().endsWith(".pdf");
}

export function DirectPrintPreviewDialog({
  order,
  open,
  onClose,
  shopId,
  shopName,
  shopPhone,
  shopAddress,
  onPrintStart,
  onPrintComplete,
}: DirectPrintPreviewDialogProps) {
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [fileLoading, setFileLoading] = useState(false);
  const [verify, setVerify] = useState<VerifyResult | null>(null);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [forcePrint, setForcePrint] = useState(false);
  const [copies, setCopies] = useState(1);
  const printedRef = useRef(false);

  const isImg = isImageFile(order?.fileName);
  const isPdf = isPdfFile(order?.fileName);

  // ===== جلب الملف للمعاينة =====
  const loadFile = useCallback(async () => {
    if (!order) return;
    setFileLoading(true);
    try {
      const res = await fetch(`/api/orders/${order.id}/file?shopId=${shopId}`);
      if (!res.ok) throw new Error("فشل تحميل الملف");
      const blob = await res.blob();
      if (fileUrl) URL.revokeObjectURL(fileUrl);
      setFileUrl(URL.createObjectURL(blob));
    } catch (e) {
      toast.error("تعذّر تحميل الملف للمعاينة", { description: (e as Error).message });
    } finally {
      setFileLoading(false);
    }
  }, [order, shopId, fileUrl]);

  // ===== التحقق الذكي =====
  const runVerify = useCallback(async () => {
    if (!order) return;
    setVerifyLoading(true);
    setVerify(null);
    try {
      const res = await fetch(`/api/orders/${order.id}/verify-print?shopId=${shopId}`);
      const data = (await res.json()) as VerifyResult;
      if (!res.ok && !data.status) {
        throw new Error(data.error || "فشل التحقق");
      }
      setVerify(data);
    } catch (e) {
      setVerify({
        success: false,
        canPrint: true,
        confidence: 0,
        status: "no_preview",
        summary: "تعذّر التحقق التلقائي — راجع يدوياً",
        alerts: [],
        warnings: ["فشل تشغيل التحقق الذكي، يرجى المراجعة اليدوية"],
        checks: [],
        error: (e as Error).message,
      });
    } finally {
      setVerifyLoading(false);
    }
  }, [order, shopId]);

  useEffect(() => {
    if (open && order) {
      setVerify(null);
      setForcePrint(false);
      setCopies(order.copies || 1);
      printedRef.current = false;
      loadFile();
      runVerify();
    }
    return () => {
      if (fileUrl) URL.revokeObjectURL(fileUrl);
    };
  }, [open, order?.id]);

  // ===== تأكيد الطباعة =====
  async function handleConfirmPrint() {
    if (!order || printedRef.current) return;
    printedRef.current = true;
    setConfirming(true);
    try {
      // 1) تحديث الحالة إلى printing
      const printRes = await fetch(`/api/orders/${order.id}?shopId=${shopId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "printing" }),
      });
      if (printRes.ok) {
        onPrintStart();
      }

      toast.success("بدأت الطباعة", {
        description: `${order.reference} — ${copies} نسخة`,
      });

      // 2) تشغيل الطباعة (نافذة الطباعة تعرض الملف + بيانات الطلب)
      await new Promise((r) => setTimeout(r, 300));
      window.print();

      // 3) بعد إغلاق نافذة الطباعة → ready
      const readyRes = await fetch(`/api/orders/${order.id}?shopId=${shopId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ready" }),
      });
      if (readyRes.ok) {
        toast.success("تمت الطباعة", {
          description: `${order.reference} — جاهز للاستلام`,
        });
        onPrintComplete();
      }
      onClose();
    } catch (e) {
      toast.error("خطأ في الطباعة", { description: (e as Error).message });
      printedRef.current = false;
    } finally {
      setConfirming(false);
    }
  }

  async function handleDownload() {
    if (!order) return;
    try {
      const res = await fetch(`/api/orders/${order.id}/file?shopId=${shopId}`);
      if (!res.ok) throw new Error("فشل التنزيل");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = order.fileName || `order-${order.reference}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("تم تنزيل الملف");
    } catch (e) {
      toast.error("تعذّر التنزيل", { description: (e as Error).message });
    }
  }

  function handleOpenChange(isOpen: boolean) {
    if (!isOpen) {
      if (fileUrl) {
        URL.revokeObjectURL(fileUrl);
        setFileUrl(null);
      }
      onClose();
    }
  }

  if (!order) return null;

  const meta = STATUS_META[order.status];
  const serviceEmoji = SERVICE_EMOJI[order.serviceType] || "🖨️";

  // عدد النسخ الكلي للطباعة
  const totalSheets = (order.pages || 1) * copies;

  // الحالة العامة للتحقق
  const verifyStatus = verify?.status;
  const canPrintDirectly = verify?.canPrint === true || forcePrint;

  const statusConfig: Record<string, { icon: typeof CheckCircle2; color: string; bg: string; label: string }> = {
    match: { icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200", label: "مطابق للمتطلبات" },
    warning: { icon: AlertTriangle, color: "text-amber-600", bg: "bg-amber-50 border-amber-200", label: "تحذيرات — راجع قبل الطباعة" },
    mismatch: { icon: XCircle, color: "text-rose-600", bg: "bg-rose-50 border-rose-200", label: "اختلاف — يمنع الطباعة" },
    no_file: { icon: Info, color: "text-blue-600", bg: "bg-blue-50 border-blue-200", label: "لا يوجد ملف" },
    no_preview: { icon: Info, color: "text-slate-600", bg: "bg-slate-50 border-slate-200", label: "مراجعة يدوية" },
  };
  const sCfg = verifyStatus ? statusConfig[verifyStatus] : null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="flex flex-col gap-0 p-0 rounded-none border-0 inset-0 top-0 left-0 translate-x-0 translate-y-0 h-[100dvh] w-full max-w-none sm:top-[50%] sm:left-[50%] sm:translate-x-[-50%] sm:translate-y-[-50%] sm:max-w-3xl sm:max-h-[92vh] sm:rounded-xl sm:border sm:h-auto overflow-hidden bg-background"
        dir="rtl"
        showCloseButton={false}
      >
        {/* ===== Header لاصق ===== */}
        <div className="sticky top-0 z-30 flex items-center justify-between gap-2 px-3 sm:px-5 py-2.5 sm:py-3 border-b bg-background/95 backdrop-blur-sm">
          <div className="min-w-0 flex-1 flex items-center gap-2">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shrink-0 shadow-sm">
              <Printer className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="flex items-center gap-1.5 text-sm sm:text-base font-bold truncate">
                <span>{serviceEmoji}</span>
                <span className="font-mono">{order.reference}</span>
              </DialogTitle>
              <DialogDescription className="text-[11px] sm:text-xs truncate">
                معاينة الطباعة المباشرة — {order.serviceName}
              </DialogDescription>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 shrink-0 rounded-lg hover:bg-muted"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* ===== المحتوى القابل للتمرير ===== */}
        <div className="flex-1 overflow-y-auto custom-scroll px-3 sm:px-5 py-3 sm:py-4 space-y-3 sm:space-y-4">
          {/* ===== قسم المعاينة ===== */}
          <section className="rounded-xl border bg-card overflow-hidden">
            <div className="flex items-center justify-between gap-2 px-3 sm:px-4 py-2.5 border-b bg-muted/30">
              <h3 className="text-xs sm:text-sm font-bold flex items-center gap-2">
                <Eye className="h-4 w-4 text-amber-500" />
                معاينة الملف
              </h3>
              <div className="flex items-center gap-1.5">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-[11px] px-2 rounded-lg"
                  onClick={handleDownload}
                >
                  <Download className="h-3 w-3 ml-1" />
                  تنزيل
                </Button>
              </div>
            </div>
            <div className="p-3 sm:p-4 bg-muted/20">
              {fileLoading ? (
                <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                  <Loader2 className="h-6 w-6 animate-spin text-amber-500 mb-2" />
                  <span className="text-xs">جارٍ تحميل الملف...</span>
                </div>
              ) : fileUrl ? (
                isImg ? (
                  <div className="flex justify-center">
                    <img
                      src={fileUrl}
                      alt={order.fileName || "معاينة"}
                      className="max-w-full max-h-[40vh] sm:max-h-[45vh] object-contain rounded-lg border shadow-sm"
                    />
                  </div>
                ) : isPdf ? (
                  <iframe
                    src={fileUrl}
                    title="معاينة PDF"
                    className="w-full h-[40vh] sm:h-[45vh] rounded-lg border bg-white"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <FileText className="h-10 w-10 text-muted-foreground/50 mb-2" />
                    <p className="text-xs font-medium mb-1">{order.fileName}</p>
                    <p className="text-[11px] text-muted-foreground">
                      لا يمكن عرض معاينة لهذا النوع — استخدم التنزيل
                    </p>
                  </div>
                )
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                  <FileText className="h-10 w-10 text-muted-foreground/50 mb-2" />
                  <span className="text-xs">تعذّر تحميل المعاينة</span>
                </div>
              )}
            </div>
            {/* معلومات الملف */}
            {order.fileName && (
              <div className="px-3 sm:px-4 py-2 border-t bg-muted/20 flex items-center gap-2 flex-wrap text-[11px]">
                <FileText className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                <span className="font-medium truncate flex-1 min-w-0">{order.fileName}</span>
                <Badge variant="outline" className="text-[10px] h-5">
                  {order.fileType || "—"}
                </Badge>
                {order.fileSize ? (
                  <Badge variant="outline" className="text-[10px] h-5">
                    {Math.round(order.fileSize / 1024)} ك.ب
                  </Badge>
                ) : null}
              </div>
            )}
          </section>

          {/* ===== التحقق الذكي بالـ AI ===== */}
          <section className="rounded-xl border bg-card overflow-hidden">
            <div className="flex items-center justify-between gap-2 px-3 sm:px-4 py-2.5 border-b bg-gradient-to-l from-violet-50/50 to-transparent">
              <h3 className="text-xs sm:text-sm font-bold flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-violet-500" />
                التحقق الذكي قبل الطباعة
              </h3>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-[11px] px-2 rounded-lg"
                onClick={runVerify}
                disabled={verifyLoading}
              >
                <RefreshCw className={cn("h-3 w-3 ml-1", verifyLoading && "animate-spin")} />
                إعادة
              </Button>
            </div>
            <div className="p-3 sm:p-4">
              {verifyLoading ? (
                <div className="flex flex-col items-center justify-center py-6">
                  <Loader2 className="h-6 w-6 animate-spin text-violet-500 mb-2" />
                  <p className="text-xs text-muted-foreground">جارٍ تحليل الملف ومقارنته بمتطلبات العميل...</p>
                  <p className="text-[10px] text-muted-foreground/70 mt-1">قد يستغرق هذا بضع ثوانٍ</p>
                </div>
              ) : verify && sCfg ? (
                <div className="space-y-3">
                  {/* الحالة العامة */}
                  <div className={cn("flex items-start gap-2.5 rounded-lg border p-3", sCfg.bg)}>
                    <sCfg.icon className={cn("h-5 w-5 shrink-0 mt-0.5", sCfg.color)} />
                    <div className="flex-1 min-w-0">
                      <div className={cn("text-xs font-bold", sCfg.color)}>{sCfg.label}</div>
                      {verify.summary && (
                        <p className="text-[11px] text-foreground/80 mt-0.5 leading-relaxed">{verify.summary}</p>
                      )}
                      {verify.confidence > 0 && (
                        <div className="flex items-center gap-1.5 mt-1.5">
                          <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden max-w-[120px]">
                            <div
                              className={cn("h-full rounded-full", verify.confidence >= 70 ? "bg-emerald-500" : verify.confidence >= 40 ? "bg-amber-500" : "bg-rose-500")}
                              style={{ width: `${verify.confidence}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-muted-foreground tabular-nums">{verify.confidence}%</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* تنبيهات حرجة */}
                  {verify.alerts.length > 0 && (
                    <div className="space-y-1.5">
                      {verify.alerts.map((a, i) => (
                        <div key={i} className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-2.5">
                          <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                          <p className="text-[11px] text-rose-700 leading-relaxed flex-1">{a}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* تحذيرات */}
                  {verify.warnings.length > 0 && (
                    <div className="space-y-1.5">
                      {verify.warnings.map((w, i) => (
                        <div key={i} className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-2.5">
                          <Info className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                          <p className="text-[11px] text-amber-700 leading-relaxed flex-1">{w}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* الفحوصات التفصيلية */}
                  {verify.checks.length > 0 && (
                    <div className="rounded-lg border bg-muted/20 p-2.5 space-y-1.5">
                      <div className="text-[10px] font-bold text-muted-foreground mb-1">تفاصيل الفحوصات</div>
                      {verify.checks.map((c, i) => (
                        <div key={i} className="flex items-start gap-2 text-[11px]">
                          {c.passed ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                          ) : (
                            <XCircle className="h-3.5 w-3.5 text-rose-500 shrink-0 mt-0.5" />
                          )}
                          <div className="flex-1 min-w-0">
                            <span className={cn("font-medium", c.passed ? "text-foreground/80" : "text-rose-700")}>{c.label}</span>
                            {c.note && <span className="text-muted-foreground"> — {c.note}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* متطلبات العميل */}
                  {verify.requirements && (
                    <details className="rounded-lg border bg-muted/20">
                      <summary className="cursor-pointer text-[11px] font-medium px-3 py-2 select-none">
                        عرض متطلبات العميل المُحلَّلة
                      </summary>
                      <pre className="text-[10px] text-muted-foreground whitespace-pre-wrap px-3 pb-2.5 leading-relaxed">{verify.requirements}</pre>
                    </details>
                  )}
                </div>
              ) : (
                <div className="text-xs text-muted-foreground py-4 text-center">
                  لم يتم التحقق بعد
                </div>
              )}
            </div>
          </section>

          {/* ===== ملخص الطباعة ===== */}
          <section className="rounded-xl border bg-card overflow-hidden">
            <div className="px-3 sm:px-4 py-2.5 border-b bg-muted/30">
              <h3 className="text-xs sm:text-sm font-bold flex items-center gap-2">
                <Copy className="h-4 w-4 text-amber-500" />
                تفاصيل الطباعة
              </h3>
            </div>
            <div className="p-3 sm:p-4 space-y-2.5">
              {/* عدد النسخ */}
              <div className="flex items-center justify-between gap-2">
                <Label2 text="عدد النسخ المطلوبة" />
                <div className="flex items-center gap-1.5">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 w-8 p-0 rounded-lg"
                    onClick={() => setCopies((c) => Math.max(1, c - 1))}
                    disabled={copies <= 1}
                  >
                    −
                  </Button>
                  <Input2
                    value={copies}
                    onChange={(v) => setCopies(Math.max(1, Number(v) || 1))}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 w-8 p-0 rounded-lg"
                    onClick={() => setCopies((c) => c + 1)}
                  >
                    +
                  </Button>
                </div>
              </div>

              {/* الخيارات */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {Object.entries(order.options)
                  .filter(
                    ([k, v]) =>
                      v !== undefined &&
                      v !== null &&
                      v !== "" &&
                      !HIDDEN_OPTION_KEYS.includes(k),
                  )
                  .map(([k, v]) => (
                    <div key={k} className="rounded-lg bg-muted/30 border px-2.5 py-1.5">
                      <div className="text-[10px] text-muted-foreground">{translateOptionKey(k)}</div>
                      <div className="text-[11px] font-semibold truncate">{translateOptionValue(String(v))}</div>
                    </div>
                  ))}
              </div>

              {/* ملخص الصفحات */}
              <div className="flex items-center gap-2 flex-wrap text-[11px] rounded-lg bg-amber-50 border border-amber-200/60 px-3 py-2">
                <span className="text-amber-700 font-medium">إجمالي الصفحات للطباعة:</span>
                <span className="font-bold text-amber-800 tabular-nums">
                  {order.pages} صفحة × {copies} نسخة = {totalSheets} ورقة
                </span>
              </div>

              {/* المجموع */}
              <div className="flex items-center justify-between gap-2 rounded-lg bg-gradient-to-l from-amber-50 to-transparent border border-amber-200/60 px-3 py-2">
                <span className="text-xs text-muted-foreground">المجموع</span>
                <span className="text-sm font-bold text-amber-700">{formatDA(order.total)}</span>
              </div>
            </div>
          </section>

          {/* ===== معلومات الطلب السريعة ===== */}
          <section className="rounded-xl border bg-card overflow-hidden print-hide">
            <div className="px-3 sm:px-4 py-2.5 border-b bg-muted/30">
              <h3 className="text-xs sm:text-sm font-bold">معلومات العميل والتسليم</h3>
            </div>
            <div className="p-3 sm:p-4 grid grid-cols-2 gap-2 text-[11px]">
              <Info2 label="العميل" value={order.customer?.name || "—"} />
              <Info2 label="الهاتف" value={order.customer?.phone || "—"} ltr />
              <Info2 label="التسليم" value={order.delivery?.mode === "pickup" ? "استلام من المحل" : "توصيل"} />
              <Info2 label="الموعد" value={order.delivery?.date || "—"} />
              <Info2 label="الحالة" value={`${meta.emoji} ${meta.label}`} />
              <Info2 label="التاريخ" value={formatDateTimeAr(order.createdAt)} />
            </div>
          </section>
        </div>

        {/* ===== Footer لاصق ===== */}
        <div className="sticky bottom-0 z-30 border-t bg-background/95 backdrop-blur-sm px-3 sm:px-5 py-2.5 sm:py-3 print-hide">
          {/* تحذير فرض الطباعة */}
          {verify && !verify.canPrint && !forcePrint && (
            <div className="mb-2 rounded-lg border border-rose-300 bg-rose-50 px-3 py-2 flex items-start gap-2">
              <ShieldCheck className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-bold text-rose-700">الذكاء الاصطناعي يوصي بعدم الطباعة</p>
                <p className="text-[10px] text-rose-600 mt-0.5">راجع التنبيهات أعلاه. يمكنك تجاوز التحذير ومتابعة الطباعة على مسؤوليتك.</p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-[10px] px-2 text-rose-700 hover:bg-rose-100 shrink-0"
                onClick={() => setForcePrint(true)}
              >
                تجاوز
              </Button>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="h-10 sm:h-11 px-3 rounded-xl text-xs sm:text-sm shrink-0"
              onClick={onClose}
            >
              <X className="h-4 w-4 ml-1" />
              إلغاء
            </Button>
            <Button
              className={cn(
                "flex-1 h-10 sm:h-11 rounded-xl text-xs sm:text-sm font-semibold gap-2 transition-all duration-200 active:scale-[0.98]",
                canPrintDirectly
                  ? "bg-gradient-to-l from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-md shadow-amber-200/60"
                  : "bg-muted text-muted-foreground cursor-not-allowed",
              )}
              onClick={handleConfirmPrint}
              disabled={!canPrintDirectly || confirming}
            >
              {confirming ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  جارٍ الطباعة...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4" />
                  {verify && !verify.canPrint && !forcePrint
                    ? "راجع التنبيهات أولاً"
                    : forcePrint
                      ? "طباعة على مسؤوليتي"
                      : `تأكيد وطباعة (${copies} نسخة)`}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>

      {/* ===== منطقة الطباعة (تظهر فقط عند window.print) ===== */}
      <PrintArea
        order={order}
        shopName={shopName}
        shopPhone={shopPhone}
        shopAddress={shopAddress}
        copies={copies}
        fileUrl={fileUrl}
        isImg={isImg}
        isPdf={isPdf}
      />
    </Dialog>
  );
}

// ===== مكونات مساعدة صغيرة =====

function Label2({ text }: { text: string }) {
  return <span className="text-xs text-muted-foreground">{text}</span>;
}

function Input2({ value, onChange }: { value: number; onChange: (v: string) => void }) {
  return (
    <input
      type="number"
      min={1}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-8 w-14 text-center text-sm font-bold rounded-lg border bg-background tabular-nums focus:outline-none focus:ring-2 focus:ring-amber-400/40"
    />
  );
}

function Info2({ label, value, ltr }: { label: string; value: string; ltr?: boolean }) {
  return (
    <div className="rounded-lg bg-muted/30 border px-2.5 py-1.5 min-w-0">
      <div className="text-[10px] text-muted-foreground">{label}</div>
      <div className="text-[11px] font-semibold truncate" dir={ltr ? "ltr" : "auto"}>
        {value}
      </div>
    </div>
  );
}

// ===== منطقة الطباعة النظيفة =====
// تظهر فقط في وضع الطباعة (print) — تحتوي الملف + بيانات الطلب فقط

interface PrintAreaProps {
  order: PrintOrderLite;
  shopName: string;
  shopPhone: string;
  shopAddress: string | null;
  copies: number;
  fileUrl: string | null;
  isImg: boolean;
  isPdf: boolean;
}

function PrintArea({ order, shopName, shopPhone, shopAddress, copies, fileUrl, isImg, isPdf }: PrintAreaProps) {
  const meta = STATUS_META[order.status];
  const visibleOptions = Object.entries(order.options).filter(
    ([k, v]) =>
      v !== undefined &&
      v !== null &&
      v !== "" &&
      !HIDDEN_OPTION_KEYS.includes(k),
  );

  return (
    <div id="direct-print-area" className="direct-print-area" dir="rtl" lang="ar">
      {/* رأس المتجر */}
      <div className="dpa-header">
        <h1 className="dpa-shop-name">{shopName}</h1>
        {shopPhone && <p className="dpa-shop-phone" dir="ltr">{shopPhone}</p>}
        {shopAddress && <p className="dpa-shop-address">{shopAddress}</p>}
      </div>
      <div className="dpa-divider" />

      {/* رقم الطلب */}
      <div className="dpa-ref-row">
        <span className="dpa-ref-label">رقم الطلب</span>
        <span className="dpa-ref-value">{order.reference}</span>
        <span className="dpa-status">{meta.emoji} {meta.label}</span>
      </div>
      <div className="dpa-divider" />

      {/* الملف المراد طباعته */}
      {fileUrl && isImg && (
        <div className="dpa-file-section">
          <h2 className="dpa-section-title">📄 الملف المراد طباعته</h2>
          <img src={fileUrl} alt={order.fileName || "ملف"} className="dpa-image" />
        </div>
      )}

      {/* تفاصيل الطباعة */}
      <div className="dpa-section">
        <h2 className="dpa-section-title">🖨️ تفاصيل الطباعة</h2>
        <div className="dpa-grid">
          <div className="dpa-field">
            <span className="dpa-field-label">الخدمة</span>
            <span className="dpa-field-value">{order.serviceName}</span>
          </div>
          <div className="dpa-field">
            <span className="dpa-field-label">الصفحات</span>
            <span className="dpa-field-value">{order.pages}</span>
          </div>
          <div className="dpa-field">
            <span className="dpa-field-label">النسخ</span>
            <span className="dpa-field-value">{copies}</span>
          </div>
          <div className="dpa-field">
            <span className="dpa-field-label">إجمالي الأوراق</span>
            <span className="dpa-field-value">{order.pages * copies}</span>
          </div>
          {visibleOptions.map(([k, v]) => (
            <div key={k} className="dpa-field">
              <span className="dpa-field-label">{translateOptionKey(k)}</span>
              <span className="dpa-field-value">{translateOptionValue(String(v))}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="dpa-divider" />

      {/* العميل */}
      <div className="dpa-section">
        <h2 className="dpa-section-title">👤 العميل</h2>
        <div className="dpa-grid">
          <div className="dpa-field">
            <span className="dpa-field-label">الاسم</span>
            <span className="dpa-field-value">{order.customer?.name || "—"}</span>
          </div>
          <div className="dpa-field">
            <span className="dpa-field-label">الهاتف</span>
            <span className="dpa-field-value" dir="ltr">{order.customer?.phone || "—"}</span>
          </div>
          <div className="dpa-field">
            <span className="dpa-field-label">التسليم</span>
            <span className="dpa-field-value">{order.delivery?.mode === "pickup" ? "استلام من المحل" : "توصيل"}</span>
          </div>
          <div className="dpa-field">
            <span className="dpa-field-label">الموعد</span>
            <span className="dpa-field-value">{order.delivery?.date || "—"}</span>
          </div>
        </div>
      </div>

      <div className="dpa-divider" />
      <div className="dpa-footer">
        <span>{shopName} — طباعة مباشرة</span>
        <span>{formatDateTimeAr(order.createdAt)}</span>
      </div>
    </div>
  );
}
