"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Pencil,
  XCircle,
  Timer,
} from "lucide-react";
import QRCode from "qrcode";
import { toast } from "sonner";
import { downloadInvoicePDF } from "@/lib/pdf-invoice";
import type { CreatedOrder } from "@/lib/store";
import {
  STATUS_FLOW,
  STATUS_META,
  formatDA,
  PAPER_SIZES,
  COLORS,
  PAPER_TYPES,
  SIDES,
  BINDINGS,
  DELIVERY_OPTIONS,
  PRINT_RANGES,
  SERVICE_MAP,
} from "@/lib/print-config";
import { shopApi } from "@/lib/shop-api";

interface OrderSuccessProps {
  order: CreatedOrder | null;
  open: boolean;
  onClose: () => void;
  onNavigate: (view: "new" | "track" | "repeat") => void;
}

/* ───── تفاصيل الطلب الكاملة من API ───── */
interface FullOrderDetail {
  id: string;
  reference: string;
  serviceType: string;
  serviceName: string;
  fileName?: string | null;
  fileType?: string | null;
  fileSize?: number | null;
  options: Record<string, unknown>;
  customer: Record<string, unknown>;
  delivery: Record<string, unknown>;
  pricing?: Record<string, unknown>;
  pages: number;
  copies: number;
  status: string;
  total: number;
  estimatedHours: number;
  editableUntil?: string | null;
}

/* ───── حالات نموذج التعديل ───── */
interface EditFormState {
  color: string;
  paperSize: string;
  paperType: string;
  sides: string;
  binding: string;
  pages: number;
  copies: number;
  printRange: string;
  pageRange: string;
  deliveryMode: string;
  deliveryTimeSlot: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  notes: string;
  deliveryNotes: string;
  isDelivery: boolean;
}

const EMPTY_FORM: EditFormState = {
  color: "",
  paperSize: "",
  paperType: "",
  sides: "",
  binding: "",
  pages: 1,
  copies: 1,
  printRange: "all",
  pageRange: "",
  deliveryMode: "",
  deliveryTimeSlot: "",
  customerName: "",
  customerPhone: "",
  customerAddress: "",
  notes: "",
  deliveryNotes: "",
  isDelivery: false,
};

const TIME_SLOTS = [
  { id: "morning", label: "الصباح (8:00 - 12:00)" },
  { id: "noon", label: "الظهيرة (12:00 - 16:00)" },
  { id: "evening", label: "المساء (16:00 - 20:00)" },
];

function useCountdown(targetDate: string | undefined) {
  const [secondsLeft, setSecondsLeft] = useState(() =>
    targetDate ? Math.max(0, Math.round((new Date(targetDate).getTime() - Date.now()) / 1000)) : 0,
  );

  useEffect(() => {
    if (!targetDate) return;
    const target = new Date(targetDate).getTime();
    const tick = () => {
      const remaining = Math.max(0, Math.round((target - Date.now()) / 1000));
      setSecondsLeft(remaining);
      if (remaining > 0) requestAnimationFrame(() => setTimeout(tick, 500));
    };
    requestAnimationFrame(() => setTimeout(tick, 0));
  }, [targetDate]);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const isExpired = secondsLeft <= 0;
  const percentage = targetDate ? Math.max(0, (secondsLeft / 900) * 100) : 0;

  return { secondsLeft, minutes, seconds, isExpired, percentage, formatted: `${minutes}:${seconds.toString().padStart(2, "0")}` };
}

export function OrderSuccess({ order, open, onClose, onNavigate }: OrderSuccessProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [showQR, setShowQR] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [fullOrder, setFullOrder] = useState<FullOrderDetail | null>(null);
  const [editForm, setEditForm] = useState<EditFormState>(EMPTY_FORM);

  const countdown = useCountdown(order?.editableUntil);

  /* ───── جلب تفاصيل الطلب الكاملة عند فتح النافذة ───── */
  useEffect(() => {
    if (order && open) {
      shopApi(`/api/orders/${order.id}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.error) return;
          setFullOrder(data);
        })
        .catch(() => {});
    } else {
      setFullOrder(null);
    }
  }, [order, open]);

  /* ───── جلب تفاصيل الطلب عند فتح وضع التعديل ───── */
  useEffect(() => {
    if (editMode && order) {
      setEditLoading(true);
      shopApi(`/api/orders/${order.id}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.error) {
            toast.error(data.error);
            setEditMode(false);
            return;
          }
          const d: FullOrderDetail = data;
          setFullOrder(d);
          const opts = (d.options || {}) as Record<string, unknown>;
          const cust = (d.customer || {}) as Record<string, unknown>;
          const del = (d.delivery || {}) as Record<string, unknown>;
          setEditForm({
            color: (opts.color as string) || "",
            paperSize: (opts.paperSize as string) || "",
            paperType: (opts.paperType as string) || "",
            sides: (opts.sides as string) || "",
            binding: (opts.binding as string) || "",
            pages: d.pages || 1,
            copies: d.copies || 1,
            printRange: (opts.printRange as string) || "all",
            pageRange: (opts.pageRange as string) || "",
            deliveryMode: (del.mode as string) || "",
            deliveryTimeSlot: (del.timeSlot as string) || "",
            customerName: (cust.name as string) || "",
            customerPhone: (cust.phone as string) || "",
            customerAddress: (cust.address as string) || "",
            notes: (opts.notes as string) || "",
            deliveryNotes: (del.notes as string) || "",
            isDelivery: (cust.deliveryMethod as string) === "delivery",
          });
        })
        .catch(() => {
          toast.error("خطأ في تحميل تفاصيل الطلب");
          setEditMode(false);
        })
        .finally(() => setEditLoading(false));
    }
  }, [editMode, order]);

  useEffect(() => {
    if (order && open) {
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

  const handleCancel = useCallback(async () => {
    if (!order) return;
    if (!confirm("هل أنت متأكد من إلغاء الطلب؟")) return;
    setCancelling(true);
    try {
      const res = await shopApi(`/api/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel" }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("تم إلغاء الطلب");
        onClose();
      } else {
        toast.error(data.error || "فشل الإلغاء");
      }
    } catch {
      toast.error("خطأ في الاتصال");
    } finally {
      setCancelling(false);
    }
  }, [order, onClose]);

  const handleSaveEdit = useCallback(async () => {
    if (!order) return;
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        action: "edit",
        copies: editForm.copies,
        pages: editForm.pages,
        color: editForm.color,
        paperSize: editForm.paperSize,
        paperType: editForm.paperType,
        sides: editForm.sides,
        binding: editForm.binding,
        printRange: editForm.printRange,
        pageRange: editForm.printRange === "custom" ? editForm.pageRange : undefined,
        deliveryMode: editForm.deliveryMode,
        timeSlot: editForm.deliveryTimeSlot,
        name: editForm.customerName,
        phone: editForm.customerPhone,
        address: editForm.customerAddress,
        notes: editForm.notes,
        deliveryNotes: editForm.deliveryNotes,
      };
      const res = await shopApi(`/api/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("تم حفظ التعديلات ✓");
        setEditMode(false);
        setFullOrder(null);
      } else {
        toast.error(data.error || "فشل التعديل");
        if (data.expired) setEditMode(false);
      }
    } catch {
      toast.error("خطأ في الاتصال");
    } finally {
      setSaving(false);
    }
  }, [order, editForm]);

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

  const canEdit = !countdown.isExpired && order.editableUntil;
  const serviceDef = fullOrder ? SERVICE_MAP[fullOrder.serviceType] : null;
  const showBinding = fullOrder?.serviceType === "document" || fullOrder?.serviceType === "binding" || fullOrder?.serviceType === "copy";

  /* ───── مساعد تحديث حقول النموذج ───── */
  function setField<K extends keyof EditFormState>(key: K, value: EditFormState[K]) {
    setEditForm((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden max-h-[94vh] flex flex-col" dir="rtl" onInteractOutside={(e) => e.preventDefault()}>
        <DialogTitle className="sr-only">تم استلام الطلب</DialogTitle>
        <DialogDescription className="sr-only">تأكيد إنشاء طلب الطباعة بنجاح مع تفاصيل التتبع</DialogDescription>
        <div className="overflow-y-auto custom-scroll">
          {/* ===== رأس النجاح ===== */}
          <div className="bg-gradient-to-b from-emerald-50 to-white p-8 text-center">
            <div className="w-20 h-20 mx-auto rounded-full bg-emerald-100 flex items-center justify-center mb-4 ring-4 ring-emerald-50">
              <CheckCircle2 className="h-12 w-12 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold mb-2">تم استلام طلبك بنجاح</h2>
            <p className="text-sm text-muted-foreground">
              طلبك الآن في النظام — سنتواصل معك قريباً لتأكيد التفاصيل
            </p>
          </div>

          <div className="p-6 space-y-5">
            {/* ===== نافذة التعديل ===== */}
            {canEdit && (
              <div className={`rounded-2xl border-2 overflow-hidden transition-all duration-300 ${countdown.percentage < 20 ? "border-rose-300 bg-rose-50" : "border-amber-300 bg-amber-50"}`}>
                <div className="px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Timer className={`h-4 w-4 ${countdown.percentage < 20 ? "text-rose-600" : "text-amber-600"}`} />
                    <span className="text-xs font-bold">نافذة التعديل</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`font-mono font-bold text-sm tabular-nums ${countdown.percentage < 20 ? "text-rose-600" : "text-amber-700"}`}>
                      {countdown.formatted}
                    </span>
                    <span className="text-[10px] text-muted-foreground">متبقية</span>
                  </div>
                </div>
                {/* شريط التقدم */}
                <div className="h-1.5 bg-amber-200/50">
                  <div
                    className={`h-full transition-all duration-500 ${countdown.percentage < 20 ? "bg-rose-500" : "bg-amber-500"}`}
                    style={{ width: `${countdown.percentage}%` }}
                  />
                </div>
                <div className="p-4 space-y-3">
                  {!editMode ? (
                    <>
                      <p className="text-xs text-muted-foreground">
                        يمكنك تعديل خيارات الطباعة أو إلغاء الطلب خلال هذه الفترة
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => setEditMode(true)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          تعديل الخيارات
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 border-rose-200 text-rose-600 hover:bg-rose-50"
                          onClick={handleCancel}
                          disabled={cancelling}
                        >
                          {cancelling ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <XCircle className="h-3.5 w-3.5" />}
                          إلغاء الطلب
                        </Button>
                      </div>
                    </>
                  ) : editLoading ? (
                    <div className="flex items-center justify-center gap-2 py-6">
                      <Loader2 className="h-5 w-5 animate-spin text-amber-600" />
                      <span className="text-sm text-muted-foreground">جارٍ تحميل تفاصيل الطلب...</span>
                    </div>
                  ) : (
                    /* ===== نموذج التعديل الشامل ===== */
                    <div className="max-h-[60vh] overflow-y-auto custom-scroll space-y-5 -mx-1 px-1">
                      {/* ─── معلومات الطباعة ─── */}
                      <div className="space-y-3">
                        <h4 className="text-sm font-bold flex items-center gap-1.5 border-b pb-1.5 border-border">
                          🖨️ معلومات الطباعة
                        </h4>
                        <div className="flex items-center gap-2">
                          <Label className="text-xs font-medium shrink-0 w-20">نوع الخدمة</Label>
                          <Badge variant="secondary" className="text-xs font-semibold">
                            {serviceDef?.name || fullOrder?.serviceName || order.serviceName}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label className="text-xs font-medium mb-1 block">حجم الورق</Label>
                            <Select value={editForm.paperSize} onValueChange={(v) => setField("paperSize", v)}>
                              <SelectTrigger className="text-sm w-full" size="sm">
                                <SelectValue placeholder="اختر الحجم" />
                              </SelectTrigger>
                              <SelectContent>
                                {PAPER_SIZES.map((p) => (
                                  <SelectItem key={p.id} value={p.id}>
                                    {p.label} ({p.dimensions})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label className="text-xs font-medium mb-1 block">نوع الطباعة</Label>
                            <Select value={editForm.color} onValueChange={(v) => setField("color", v)}>
                              <SelectTrigger className="text-sm w-full" size="sm">
                                <SelectValue placeholder="اختر النوع" />
                              </SelectTrigger>
                              <SelectContent>
                                {COLORS.map((c) => (
                                  <SelectItem key={c.id} value={c.id}>
                                    {c.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label className="text-xs font-medium mb-1 block">نوع الورق</Label>
                            <Select value={editForm.paperType} onValueChange={(v) => setField("paperType", v)}>
                              <SelectTrigger className="text-sm w-full" size="sm">
                                <SelectValue placeholder="اختر الورق" />
                              </SelectTrigger>
                              <SelectContent>
                                {PAPER_TYPES.map((p) => (
                                  <SelectItem key={p.id} value={p.id}>
                                    {p.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label className="text-xs font-medium mb-1 block">الوجه</Label>
                            <Select value={editForm.sides} onValueChange={(v) => setField("sides", v)}>
                              <SelectTrigger className="text-sm w-full" size="sm">
                                <SelectValue placeholder="اختر" />
                              </SelectTrigger>
                              <SelectContent>
                                {SIDES.map((s) => (
                                  <SelectItem key={s.id} value={s.id}>
                                    {s.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        {showBinding && (
                          <div className="w-full">
                            <Label className="text-xs font-medium mb-1 block">التجليد</Label>
                            <Select value={editForm.binding} onValueChange={(v) => setField("binding", v)}>
                              <SelectTrigger className="text-sm w-full" size="sm">
                                <SelectValue placeholder="اختر التجليد" />
                              </SelectTrigger>
                              <SelectContent>
                                {BINDINGS.map((b) => (
                                  <SelectItem key={b.id} value={b.id}>
                                    {b.label} — {b.description}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                      </div>

                      {/* ─── الصفحات والنسخ ─── */}
                      <div className="space-y-3">
                        <h4 className="text-sm font-bold flex items-center gap-1.5 border-b pb-1.5 border-border">
                          📄 الصفحات والنسخ
                        </h4>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label className="text-xs font-medium mb-1 block">عدد الصفحات</Label>
                            <Input
                              type="number"
                              value={editForm.pages}
                              onChange={(e) => setField("pages", Math.max(1, Number(e.target.value)))}
                              className="text-sm"
                              min={1}
                            />
                          </div>
                          <div>
                            <Label className="text-xs font-medium mb-1 block">عدد النسخ</Label>
                            <Input
                              type="number"
                              value={editForm.copies}
                              onChange={(e) => setField("copies", Math.max(1, Number(e.target.value)))}
                              className="text-sm"
                              min={1}
                            />
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs font-medium mb-1 block">نطاق الطباعة</Label>
                          <div className="flex gap-3">
                            {PRINT_RANGES.map((r) => (
                              <label key={r.id} className="flex items-center gap-1.5 text-xs cursor-pointer">
                                <input
                                  type="radio"
                                  name="printRange"
                                  value={r.id}
                                  checked={editForm.printRange === r.id}
                                  onChange={() => setField("printRange", r.id)}
                                  className="accent-amber-600"
                                />
                                {r.label}
                              </label>
                            ))}
                          </div>
                          {editForm.printRange === "custom" && (
                            <Input
                              type="text"
                              value={editForm.pageRange}
                              onChange={(e) => setField("pageRange", e.target.value)}
                              placeholder="مثال: 1-5, 8, 10-12"
                              className="text-sm mt-2"
                            />
                          )}
                        </div>
                      </div>

                      {/* ─── التسليم ─── */}
                      <div className="space-y-3">
                        <h4 className="text-sm font-bold flex items-center gap-1.5 border-b pb-1.5 border-border">
                          🚚 التسليم
                        </h4>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label className="text-xs font-medium mb-1 block">طريقة التسليم</Label>
                            <Select value={editForm.deliveryMode} onValueChange={(v) => setField("deliveryMode", v)}>
                              <SelectTrigger className="text-sm w-full" size="sm">
                                <SelectValue placeholder="اختر" />
                              </SelectTrigger>
                              <SelectContent>
                                {DELIVERY_OPTIONS.map((d) => (
                                  <SelectItem key={d.id} value={d.id}>
                                    {d.emoji} {d.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label className="text-xs font-medium mb-1 block">الفترة الزمنية</Label>
                            <Select value={editForm.deliveryTimeSlot} onValueChange={(v) => setField("deliveryTimeSlot", v)}>
                              <SelectTrigger className="text-sm w-full" size="sm">
                                <SelectValue placeholder="اختر" />
                              </SelectTrigger>
                              <SelectContent>
                                {TIME_SLOTS.map((t) => (
                                  <SelectItem key={t.id} value={t.id}>
                                    {t.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>

                      {/* ─── معلومات العميل ─── */}
                      <div className="space-y-3">
                        <h4 className="text-sm font-bold flex items-center gap-1.5 border-b pb-1.5 border-border">
                          👤 معلومات العميل
                        </h4>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label className="text-xs font-medium mb-1 block">الاسم</Label>
                            <Input
                              type="text"
                              value={editForm.customerName}
                              onChange={(e) => setField("customerName", e.target.value)}
                              className="text-sm"
                              placeholder="اسم العميل"
                            />
                          </div>
                          <div>
                            <Label className="text-xs font-medium mb-1 block">الهاتف</Label>
                            <Input
                              type="tel"
                              value={editForm.customerPhone}
                              onChange={(e) => setField("customerPhone", e.target.value)}
                              className="text-sm"
                              placeholder="رقم الهاتف"
                            />
                          </div>
                        </div>
                        {editForm.isDelivery && (
                          <div>
                            <Label className="text-xs font-medium mb-1 block">عنوان التسليم</Label>
                            <Input
                              type="text"
                              value={editForm.customerAddress}
                              onChange={(e) => setField("customerAddress", e.target.value)}
                              className="text-sm"
                              placeholder="عنوان التوصيل"
                            />
                          </div>
                        )}
                      </div>

                      {/* ─── ملاحظات ─── */}
                      <div className="space-y-3">
                        <h4 className="text-sm font-bold flex items-center gap-1.5 border-b pb-1.5 border-border">
                          📝 ملاحظات
                        </h4>
                        <div>
                          <Label className="text-xs font-medium mb-1 block">ملاحظات إضافية</Label>
                          <Textarea
                            value={editForm.notes}
                            onChange={(e) => setField("notes", e.target.value)}
                            placeholder="ملاحظات على الطباعة..."
                            rows={2}
                            className="text-sm"
                          />
                        </div>
                        <div>
                          <Label className="text-xs font-medium mb-1 block">ملاحظات التسليم</Label>
                          <Textarea
                            value={editForm.deliveryNotes}
                            onChange={(e) => setField("deliveryNotes", e.target.value)}
                            placeholder="ملاحظات على التسليم..."
                            rows={2}
                            className="text-sm"
                          />
                        </div>
                      </div>

                      {/* ─── أزرار الحفظ ─── */}
                      <div className="flex gap-2 pt-1">
                        <Button
                          size="sm"
                          className="flex-1 bg-neutral-900 hover:bg-neutral-800 text-white"
                          onClick={handleSaveEdit}
                          disabled={saving}
                        >
                          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                          حفظ التعديلات
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditMode(false);
                            setFullOrder(null);
                          }}
                        >
                          إلغاء
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ===== رقم المعاملة + السعر ===== */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border bg-card p-4">
                <div className="text-xs text-muted-foreground mb-1">رقم المعاملة</div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xl font-bold text-neutral-900 font-mono tracking-wider">
                    {order.reference}
                  </span>
                  <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={copyRef}>
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <div className="rounded-xl border bg-card p-4">
                <div className="text-xs text-muted-foreground mb-1">السعر التقديري</div>
                <div className="text-xl font-bold text-amber-700">{formatDA(order.total)}</div>
              </div>
            </div>

            {/* ===== تفاصيل الطلب الكاملة ===== */}
            {fullOrder && (() => {
              const opts = (fullOrder.options || {}) as Record<string, unknown>;
              const cust = (fullOrder.customer || {}) as Record<string, unknown>;
              const del = (fullOrder.delivery || {}) as Record<string, unknown>;
              const prc = (fullOrder.pricing || {}) as Record<string, unknown>;

              const getLabel = (id: string, list: Array<{ id: string; label: string }>) => {
                const found = list.find(i => i.id === id);
                return found ? found.label : id;
              };

              return (
                <div className="space-y-3">
                  {/* معلومات الملف */}
                  {fullOrder.fileName && (
                    <div className="rounded-xl border bg-card p-4">
                      <div className="text-xs font-bold text-muted-foreground mb-2 flex items-center gap-1.5">
                        📎 معلومات الملف
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                        <div>
                          <span className="text-muted-foreground">الاسم</span>
                          <div className="font-semibold truncate">{fullOrder.fileName}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">النوع</span>
                          <div className="font-semibold">{fullOrder.fileType || "—"}{fullOrder.fileType && <Badge variant="secondary" className="text-[10px] mr-1 px-1 py-0">{getLabel(fullOrder.fileType, [{id:"PDF",label:"مستند"},{id:"DOCX",label:"مستند"},{id:"JPG",label:"صورة"},{id:"JPEG",label:"صورة"},{id:"PNG",label:"صورة"},{id:"WEBP",label:"صورة"},{id:"XLSX",label:"جدول"}])}</Badge>}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">الحجم</span>
                          <div className="font-semibold">{fullOrder.fileSize ? `${(fullOrder.fileSize / 1024).toFixed(0)} ك.ب` : "—"}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">الصفحات</span>
                          <div className="font-semibold">{fullOrder.pages}</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* خيارات الطباعة */}
                  <div className="rounded-xl border bg-card p-4">
                    <div className="text-xs font-bold text-muted-foreground mb-2 flex items-center gap-1.5">
                      🖨️ إعدادات الطباعة
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                      <div>
                        <span className="text-muted-foreground">الخدمة</span>
                        <div className="font-semibold">{fullOrder.serviceName}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">حجم الورق</span>
                        <div className="font-semibold">{getLabel(opts.paperSize as string, PAPER_SIZES)}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">نوع الطباعة</span>
                        <div className="font-semibold">{getLabel(opts.color as string, COLORS)}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">نوع الورق</span>
                        <div className="font-semibold">{getLabel(opts.paperType as string, PAPER_TYPES)}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">الوجه</span>
                        <div className="font-semibold">{getLabel(opts.sides as string, SIDES)}</div>
                      </div>
                      {(showBinding && opts.binding) && (
                        <div>
                          <span className="text-muted-foreground">التجليد</span>
                          <div className="font-semibold">{getLabel(opts.binding as string, BINDINGS)}</div>
                        </div>
                      )}
                      <div>
                        <span className="text-muted-foreground">نطاق الطباعة</span>
                        <div className="font-semibold">
                          {opts.printRange === "custom" ? `مخصص: ${opts.pageRange || "—"}` : getLabel(opts.printRange as string, PRINT_RANGES)}
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">النسخ</span>
                        <div className="font-semibold">{fullOrder.copies}</div>
                      </div>
                    </div>
                    {opts.notes && (
                      <div className="mt-2 pt-2 border-t border-border">
                        <span className="text-muted-foreground text-[11px]">ملاحظات: </span>
                        <span className="text-xs">{opts.notes as string}</span>
                      </div>
                    )}
                  </div>

                  {/* معلومات العميل */}
                  <div className="rounded-xl border bg-card p-4">
                    <div className="text-xs font-bold text-muted-foreground mb-2 flex items-center gap-1.5">
                      👤 معلومات العميل
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-muted-foreground">الاسم</span>
                        <div className="font-semibold">{(cust.name as string) || "—"}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">الهاتف</span>
                        <div className="font-semibold" dir="ltr">{(cust.phone as string) || "—"}</div>
                      </div>
                      {cust.address && (
                        <div className="col-span-2">
                          <span className="text-muted-foreground">العنوان</span>
                          <div className="font-semibold">{cust.address as string}</div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* معلومات التسليم */}
                  <div className="rounded-xl border bg-card p-4">
                    <div className="text-xs font-bold text-muted-foreground mb-2 flex items-center gap-1.5">
                      🚚 معلومات التسليم
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-muted-foreground">طريقة التسليم</span>
                        <div className="font-semibold">{getLabel(del.mode as string, DELIVERY_OPTIONS)}</div>
                      </div>
                      {del.timeSlot && (
                        <div>
                          <span className="text-muted-foreground">الفترة الزمنية</span>
                          <div className="font-semibold">{del.timeSlot as string}</div>
                        </div>
                      )}
                      {del.notes && (
                        <div className="col-span-2">
                          <span className="text-muted-foreground">ملاحظات التسليم</span>
                          <div className="font-semibold">{del.notes as string}</div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* تفصيل الأسعار */}
                  {prc && (prc.perPage || prc.pagesCost || prc.copiesCost || prc.deliveryCost) && (
                    <div className="rounded-xl border bg-card p-4">
                      <div className="text-xs font-bold text-muted-foreground mb-2 flex items-center gap-1.5">
                        💰 تفصيل الأسعار
                      </div>
                      <div className="space-y-1 text-xs">
                        {prc.perPage != null && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">سعر الصفحة</span>
                            <span className="font-semibold">{formatDA(prc.perPage as number)}</span>
                          </div>
                        )}
                        {prc.pagesCost != null && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">تكلفة الصفحات</span>
                            <span className="font-semibold">{formatDA(prc.pagesCost as number)}</span>
                          </div>
                        )}
                        {prc.copiesCost != null && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">تكلفة النسخ</span>
                            <span className="font-semibold">{formatDA(prc.copiesCost as number)}</span>
                          </div>
                        )}
                        {prc.deliveryCost != null && Number(prc.deliveryCost) > 0 && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">تكلفة التسليم</span>
                            <span className="font-semibold">{formatDA(prc.deliveryCost as number)}</span>
                          </div>
                        )}
                        {prc.discount != null && Number(prc.discount) > 0 && (
                          <div className="flex justify-between text-emerald-600">
                            <span>الخصم</span>
                            <span className="font-semibold">-{formatDA(prc.discount as number)}</span>
                          </div>
                        )}
                        <div className="flex justify-between pt-1.5 border-t border-border font-bold text-sm">
                          <span>المجموع</span>
                          <span className="text-amber-700">{formatDA(fullOrder.total)}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* ===== QR + الفاتورة ===== */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setShowQR(!showQR)}
                className="group flex items-center gap-3 p-4 rounded-xl border-2 border-amber-300 bg-amber-50 hover:bg-amber-100 transition-colors text-right"
              >
                <div className="w-10 h-10 rounded-lg bg-neutral-900 flex items-center justify-center shrink-0">
                  <QrCode className="h-5 w-5 text-amber-400" />
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-sm">رمز QR للعملية</div>
                  <div className="text-xs text-muted-foreground">
                    {showQR ? "إخفاء الرمز" : "اعرض الرمز للمسح"}
                  </div>
                </div>
              </button>
              <button
                onClick={downloadInvoice}
                disabled={pdfLoading}
                className="group flex items-center gap-3 p-4 rounded-xl border-2 border-neutral-200 bg-card hover:bg-neutral-50 hover:border-neutral-300 transition-colors text-right disabled:opacity-60"
              >
                <div className="w-10 h-10 rounded-lg bg-amber-400 flex items-center justify-center shrink-0">
                  {pdfLoading ? (
                    <Loader2 className="h-5 w-5 text-neutral-900 animate-spin" />
                  ) : (
                    <Download className="h-5 w-5 text-neutral-900" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-sm">{pdfLoading ? "جارٍ الإنشاء..." : "تنزيل الفاتورة PDF"}</div>
                  <div className="text-xs text-muted-foreground">ملف PDF جاهز للطباعة</div>
                </div>
              </button>
            </div>

            {/* ===== عرض QR ===== */}
            {showQR && qrDataUrl && (
              <div className="rounded-2xl border-2 border-amber-300 bg-amber-50 p-5 text-center animate-in fade-in zoom-in duration-300">
                <div className="inline-block bg-white p-3 rounded-xl shadow-sm">
                  <img src={qrDataUrl} alt={`QR ${order.reference}`} className="w-48 h-48 mx-auto" />
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  اعرض هذا الرمز في المطبعة لاستلام طلبك بسرعة
                </p>
                <p className="text-xs font-mono font-bold text-neutral-900 mt-1">{order.reference}</p>
              </div>
            )}

            {/* ===== الوقت المتوقع للتسليم ===== */}
            <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200">
              <div className="w-10 h-10 rounded-lg bg-amber-500 flex items-center justify-center shrink-0">
                <Clock className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <div className="text-xs text-muted-foreground">الوقت المتوقع للتسليم</div>
                <div className="font-bold text-amber-700">
                  {order.estimatedHours} {order.estimatedHours === 1 ? "ساعة" : "ساعة"}
                </div>
              </div>
              <div className="text-xs text-amber-600 text-left">
                سيصلك إشعار<br />عند الجاهزية
              </div>
            </div>

            {/* ===== ملاحظة المكالمة ===== */}
            <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200">
              <div className="flex items-center gap-2 mb-1">
                <Phone className="h-4 w-4 text-amber-600" />
                <span className="font-bold text-sm">سنتواصل معك قبل بدء الطباعة</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                سنتصل بك على الرقم المُدخل لتأكيد الطلب والتفاصيل النهائية قبل تنفيذ الطباعة.
                تأكد من توفّرك لاستقبال المكالمة.
              </p>
            </div>

            {/* ===== مراحل تنفيذ الطلب ===== */}
            <div>
              <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
                <Package className="h-4 w-4 text-amber-600" />
                مراحل تنفيذ الطلب
              </h3>
              <div className="space-y-0">
                {STATUS_FLOW.map((s, i) => {
                  const meta = STATUS_META[s];
                  const isCurrent = s === order.status;
                  const isDone = STATUS_FLOW.indexOf(order.status) > i;
                  return (
                    <div key={s} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div
                          className={`w-9 h-9 rounded-full flex items-center justify-center text-base border-2 transition-all ${
                            isCurrent
                              ? "bg-amber-400 border-amber-400 scale-110 shadow-md"
                              : isDone
                                ? "bg-emerald-400 border-emerald-400"
                                : "bg-card border-muted"
                          }`}
                        >
                          {isDone ? (
                            <CheckCircle2 className="h-5 w-5 text-white" />
                          ) : (
                            <span>{meta.emoji}</span>
                          )}
                        </div>
                        {i < STATUS_FLOW.length - 1 && (
                          <div className={`w-0.5 h-8 ${isDone ? "bg-emerald-400" : "bg-muted"}`} />
                        )}
                      </div>
                      <div className="pt-1.5 pb-8">
                        <div className={`font-semibold text-sm ${isCurrent ? "text-amber-700" : isDone ? "text-emerald-700" : "text-muted-foreground"}`}>
                          {meta.label}
                          {isCurrent && (
                            <span className="mr-2 text-xs px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">
                              الحالة الحالية
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ===== أزرار الإجراءات ===== */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2">
              <Button
                variant="outline"
                className="w-full"
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
                className="w-full"
                onClick={() => {
                  onClose();
                  onNavigate("track");
                }}
              >
                <Search className="h-4 w-4" />
                تتبّع الطلب
              </Button>
              <Button
                className="w-full bg-neutral-900 hover:bg-neutral-800 text-white"
                onClick={() => {
                  onClose();
                  onNavigate("new");
                }}
              >
                <Plus className="h-4 w-4" />
                طلب جديد
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
