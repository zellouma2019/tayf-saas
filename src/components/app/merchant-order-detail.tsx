"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  Save,
  X,
  FileText,
  Download,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Printer,
  CheckCircle2,
  Check,
  Trash2,
  FileCheck,
  Tag,
  Plus,
  AlertTriangle,
  Lock,
  Zap,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  STATUS_META,
  STATUS_FLOW,
  formatDA,
  formatDateTimeAr,
} from "@/lib/print-config";
import type { PrintOrderLite } from "@/lib/order-types";
import { printReceipt } from "@/lib/print-receipt";
import {
  translateOptionKey,
  translateOptionValue,
  HIDDEN_OPTION_KEYS,
} from "@/lib/option-translations";
import { cn } from "@/lib/utils";
import { PrintJobTicket } from "@/components/app/print-job-ticket";

// ===== أنواع =====

interface MerchantOrderDetailProps {
  order: PrintOrderLite | null;
  open: boolean;
  onClose: () => void;
  onStatusChange: (order: PrintOrderLite, status: string) => void;
  onUpdated: () => void;
  shopId: string;
  shopName: string;
  shopPhone: string;
  shopAddress: string | null;
  hasReceiptPrinting?: boolean;
  hasDirectPrinting?: boolean;
}

interface AuditLog {
  id: string;
  action: string;
  field: string | null;
  oldValue: string | null;
  newValue: string | null;
  details: string | null;
  createdAt: string;
}

// ===== ثوابت =====

const SERVICE_EMOJI: Record<string, string> = {
  document: "🖨️",
  photo: "🖼️",
  binding: "📚",
  copy: "📄",
  card: "🪪",
  poster: "📜",
};

const PRESET_TAGS = ["عاجل", "VIP", "مرتجع", "خاص", "مؤسسة", "طالب"];

// ===== المكون الرئيسي =====

export function MerchantOrderDetail({
  order,
  open,
  onClose,
  onStatusChange,
  onUpdated,
  shopId,
  shopName,
  shopPhone,
  shopAddress,
  hasReceiptPrinting,
  hasDirectPrinting,
}: MerchantOrderDetailProps) {
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showAudit, setShowAudit] = useState(false);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [printingAction, setPrintingAction] = useState<"start" | "complete" | null>(null);
  const [directPrintLoading, setDirectPrintLoading] = useState(false);

  // ===== حقول التعديل =====
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editWhatsApp, setEditWhatsApp] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editCopies, setEditCopies] = useState(1);
  const [editPages, setEditPages] = useState(1);
  const [editCost, setEditCost] = useState(0);
  const [editAdminNotes, setEditAdminNotes] = useState("");
  const [editTags, setEditTags] = useState<string[]>([]);
  const [customTagInput, setCustomTagInput] = useState("");

  // ===== جلب سجل التغييرات =====

  const fetchAuditLogs = useCallback(async () => {
    if (!order) return;
    setAuditLoading(true);
    try {
      const res = await fetch(`/api/orders/${order.id}/audit?shopId=${shopId}`);
      if (res.ok) {
        const data = await res.json();
        setAuditLogs(data.logs || []);
      }
    } catch {
      /* silent */
    } finally {
      setAuditLoading(false);
    }
  }, [order, shopId]);

  useEffect(() => {
    if (open && order) {
      setShowAudit(false);
      setAuditLogs([]);
      setShowDeleteConfirm(false);
      setCustomTagInput("");
      fetchAuditLogs();
    }
  }, [open, order, fetchAuditLogs]);

  // ===== تعبئة الحقول عند فتح النافذة =====

  useEffect(() => {
    if (!open || !order) return;
    setEditName(order.customer?.name || "");
    setEditPhone(order.customer?.phone || "");
    setEditWhatsApp(order.customer?.whatsapp || "");
    setEditEmail(order.customer?.email || "");
    setEditAddress(order.customer?.address || "");
    setEditCopies(order.copies);
    setEditPages(order.pages);
    setEditCost(order.cost || 0);
    setEditAdminNotes(order.adminNotes || "");
    try {
      setEditTags(Array.isArray(order.tags) ? order.tags : JSON.parse(order.tags ? String(order.tags) : "[]"));
    } catch {
      setEditTags([]);
    }
  }, [open, order]);

  // ===== معالجات =====

  function handleOpenChange(isOpen: boolean) {
    if (!isOpen) onClose();
  }

  async function handleSave() {
    if (!order) return;
    setSaving(true);
    try {
      const payload: Record<string, unknown> = { action: "edit" };

      const customerUpdates: Record<string, string> = {};
      if (editName !== (order.customer?.name || "")) customerUpdates.name = editName;
      if (editPhone !== (order.customer?.phone || "")) customerUpdates.phone = editPhone;
      if (editWhatsApp !== (order.customer?.whatsapp || "")) customerUpdates.whatsapp = editWhatsApp;
      if (editEmail !== (order.customer?.email || "")) customerUpdates.email = editEmail;
      if (editAddress !== (order.customer?.address || "")) customerUpdates.address = editAddress;
      if (Object.keys(customerUpdates).length > 0) payload.customer = customerUpdates;

      if (editAdminNotes !== (order.adminNotes || "")) payload.adminNotes = editAdminNotes;

      const currentTags = Array.isArray(order.tags) ? order.tags : [];
      if (JSON.stringify(editTags) !== JSON.stringify(currentTags)) {
        payload.tags = JSON.stringify(editTags);
      }

      if (editCost !== (order.cost || 0)) payload.cost = editCost;
      if (editCopies !== order.copies) payload.copies = editCopies;
      if (editPages !== order.pages) payload.pages = editPages;

      if (Object.keys(payload).length <= 1) {
        toast.info("لا توجد تغييرات لحفظها");
        setSaving(false);
        return;
      }

      const res = await fetch(`/api/orders/${order.id}?shopId=${shopId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "فشل التحديث");
      }

      toast.success("تم تحديث الطلب بنجاح");
      onUpdated();
      onClose();
    } catch (e) {
      toast.error("خطأ في التحديث", { description: (e as Error).message });
    } finally {
      setSaving(false);
    }
  }

  async function handlePrintingAction(action: "start" | "complete") {
    if (!order) return;
    setPrintingAction(action);
    try {
      const status = action === "start" ? "printing" : "ready";
      const res = await fetch(`/api/orders/${order.id}?shopId=${shopId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "فشل التحديث");
      }

      const actionLabel = action === "start" ? "بدأ الطباعة" : "انتهى الطباعة";
      toast.success(actionLabel, {
        description: `${order.reference} → ${STATUS_META[status].label}`,
      });
      onStatusChange(order, status);
      onUpdated();
    } catch (e) {
      toast.error("خطأ", { description: (e as Error).message });
    } finally {
      setPrintingAction(null);
    }
  }

  // ===== طباعة مباشرة =====
  async function handleDirectPrint() {
    if (!order) return;
    setDirectPrintLoading(true);
    try {
      // 1) Change status to "printing"
      const printRes = await fetch(`/api/orders/${order.id}?shopId=${shopId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "printing" }),
      });
      if (!printRes.ok) {
        const err = await printRes.json();
        throw new Error(err.error || "فشل تحديث الحالة");
      }

      toast.success("بدأت الطباعة", {
        description: `${order.reference} — جارٍ تنفيذ الطباعة`,
      });
      onStatusChange(order, "printing");
      onUpdated();

      // 2) Wait a tick for the DOM to settle, then trigger print
      await new Promise((r) => setTimeout(r, 300));
      window.print();

      // 3) After print dialog closes, change to "ready"
      const readyRes = await fetch(`/api/orders/${order.id}?shopId=${shopId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ready" }),
      });
      if (readyRes.ok) {
        toast.success("تمت الطباعة", {
          description: `${order.reference} — جاهز للاستلام`,
        });
        onStatusChange(order, "ready");
        onUpdated();
      }
    } catch (e) {
      toast.error("خطأ في الطباعة المباشرة", { description: (e as Error).message });
    } finally {
      setDirectPrintLoading(false);
    }
  }

  async function handleDelete() {
    if (!order) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/orders/${order.id}?shopId=${shopId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "فشل الحذف");
      }

      toast.success("تم حذف الطلب", {
        description: `${order.reference} تم حذفه نهائياً`,
      });
      onUpdated();
      onClose();
    } catch (e) {
      toast.error("خطأ في الحذف", { description: (e as Error).message });
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  }

  function handleStatusChange(status: string) {
    if (!order) return;
    onStatusChange(order, status);
  }

  function togglePresetTag(tag: string) {
    setEditTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  }

  function addCustomTag() {
    const trimmed = customTagInput.trim();
    if (!trimmed) return;
    if (editTags.includes(trimmed)) {
      toast.info("الوسم موجود بالفعل");
      return;
    }
    setEditTags((prev) => [...prev, trimmed]);
    setCustomTagInput("");
  }

  function removeTag(tag: string) {
    setEditTags((prev) => prev.filter((t) => t !== tag));
  }

  function downloadFile() {
    if (!order) return;
    if (order.fileData && order.fileData.startsWith("file_")) {
      fetch(`/api/orders/${order.id}/file?shopId=${shopId}`)
        .then((r) => r.blob())
        .then((blob) => {
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = order.fileName || "file";
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        });
    } else if (order.fileData) {
      const a = document.createElement("a");
      a.href = order.fileData;
      a.download = order.fileName || "file";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  }

  function openInvoice() {
    if (!order) return;
    window.open(`/api/orders/${order.id}/invoice?shopId=${shopId}`, "_blank");
  }

  if (!order) return null;

  const meta = STATUS_META[order.status];
  const serviceEmoji = SERVICE_EMOJI[order.serviceType] || "🖨️";
  const availableStatuses = STATUS_FLOW;
  const profit = (order.total || 0) - (editCost || 0);

  return (
    <>
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="sm:max-w-2xl max-h-[90vh] overflow-y-auto custom-scroll bg-dark-50 border-dark-200/60"
        dir="rtl"
      >
        <DialogHeader className="pb-2">
          <DialogTitle className="flex items-center gap-2 text-lg text-dark-800">
            <span className="text-xl">{serviceEmoji}</span>
            <span className="font-mono">{order.reference}</span>
            <span className="text-muted-foreground font-normal text-sm">— {order.serviceName}</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-dark-500">
            {formatDateTimeAr(order.createdAt)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* ===== شريط الحالة + أزرار الطباعة ===== */}
          <div className="bg-card border border-gold-500/8 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-4">
            <div className="flex items-center gap-2 flex-wrap mb-3">
              <span className={cn("text-xs px-2.5 py-1 rounded-lg font-medium", meta.bg)}>
                {meta.emoji} {meta.label}
              </span>
              {availableStatuses
                .filter((s) => s !== order.status)
                .map((s) => (
                  <Button
                    key={s}
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs rounded-lg border-dark-200 hover:bg-gold-500/5 transition-all duration-200"
                    onClick={() => handleStatusChange(s)}
                  >
                    {STATUS_META[s].emoji} {STATUS_META[s].label}
                  </Button>
                ))}
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs rounded-lg border-rose-200 text-rose-600 hover:bg-rose-50 transition-all duration-200"
                onClick={() => handleStatusChange("cancelled")}
              >
                ❌ إلغاء
              </Button>
            </div>

            {/* أزرار الطباعة */}
            {order.status !== "cancelled" && (
              <div className="flex items-center gap-2 pt-2 border-t border-dark-100">
                {!order.startedPrintingAt && order.status !== "ready" && order.status !== "delivered" && (
                  <Button
                    size="sm"
                    onClick={() => handlePrintingAction("start")}
                    disabled={printingAction !== null}
                    className="h-9 text-xs bg-gold-500 hover:bg-gold-600 text-white rounded-lg transition-all duration-200 active:scale-[0.98]"
                  >
                    <Printer className="h-3.5 w-3.5 ml-1" />
                    {printingAction === "start" ? "جارٍ..." : "بدأ الطباعة"}
                  </Button>
                )}
                {order.startedPrintingAt && !order.completedPrintingAt && (
                  <Button
                    size="sm"
                    onClick={() => handlePrintingAction("complete")}
                    disabled={printingAction !== null}
                    className="h-9 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-all duration-200 active:scale-[0.98]"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 ml-1" />
                    {printingAction === "complete" ? "جارٍ..." : "انتهى الطباعة"}
                  </Button>
                )}
                {(order.startedPrintingAt || order.completedPrintingAt) && (
                  <div className="flex items-center gap-3 text-xs text-dark-500 mr-auto">
                    {order.startedPrintingAt && (
                      <span className="flex items-center gap-1">
                        <Printer className="h-3 w-3 text-gold-400" />
                        بدأ: {formatDateTimeAr(order.startedPrintingAt)}
                      </span>
                    )}
                    {order.completedPrintingAt && (
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                        انتهى: {formatDateTimeAr(order.completedPrintingAt)}
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ===== طباعة مباشرة ===== */}
            {order.status !== "cancelled" && order.status !== "delivered" && (
              <div className="pt-2 mt-2 border-t border-dark-100">
                {hasDirectPrinting ? (
                  <Button
                    size="sm"
                    onClick={handleDirectPrint}
                    disabled={directPrintLoading || printingAction !== null}
                    className={cn(
                      "h-10 text-sm font-semibold rounded-xl transition-all duration-200 active:scale-[0.98] gap-2",
                      "bg-gradient-to-l from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-md shadow-amber-200/60",
                      directPrintLoading && "opacity-70 pointer-events-none",
                    )}
                  >
                    {directPrintLoading ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        جارٍ الطباعة...
                      </>
                    ) : (
                      <>
                        <Zap className="h-4 w-4" />
                        طباعة مباشرة
                      </>
                    )}
                  </Button>
                ) : (
                  <div className="flex items-center gap-2 text-xs text-dark-400">
                    <Lock className="h-3.5 w-3.5" />
                    <span>الطباعة المباشرة ميزة مدفوعة</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-dark-100 border border-dark-200 text-dark-500 font-medium">
                      تفعيل الميزة
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ===== شريط تقدم الحالة ===== */}
          {order.status !== "cancelled" && (
            <div className="bg-card border border-gold-500/8 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-4">
              <div className="flex items-center justify-between">
                {STATUS_FLOW.map((step, idx) => {
                  const stepMeta = STATUS_META[step];
                  const currentIdx = STATUS_FLOW.indexOf(order.status);
                  const isCompleted = idx < currentIdx;
                  const isCurrent = idx === currentIdx;
                  const isFuture = idx > currentIdx;

                  const dotColorMap: Record<string, string> = {
                    pending: "bg-amber-500",
                    printing: "bg-gold-500",
                    ready: "bg-emerald-500",
                    delivered: "bg-emerald-600",
                  };

                  return (
                    <div key={step} className="flex items-center flex-1 last:flex-none">
                      <div className="flex flex-col items-center gap-1.5">
                        <div className="relative">
                          {isCompleted ? (
                            <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-white", dotColorMap[step])}>
                              <Check className="h-4 w-4" strokeWidth={3} />
                            </div>
                          ) : isCurrent ? (
                            <div className="relative">
                              <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-white", dotColorMap[step])} />
                              <div className={cn("absolute inset-0 w-8 h-8 rounded-full animate-ping opacity-30", dotColorMap[step])} />
                            </div>
                          ) : (
                            <div className="w-8 h-8 rounded-full border-2 border-dark-300 bg-white" />
                          )}
                        </div>
                        <span className={cn("text-[10px] font-medium", isFuture ? "text-dark-400" : isCurrent ? "text-dark-800" : "text-dark-600")}>
                          {stepMeta.label}
                        </span>
                      </div>
                      {idx < STATUS_FLOW.length - 1 && (
                        <div className="flex-1 h-0.5 mx-2 mt-[-18px]">
                          <div className={cn("h-full rounded-full", idx < currentIdx ? "bg-dark-400" : "bg-dark-200")} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ===== معلومات العميل ===== */}
          <section className="bg-card border border-gold-500/8 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-4">
            <h3 className="text-sm font-semibold flex items-center gap-2.5 text-dark-800 border-r-4 border-gold-500 pr-3 mb-3">
              معلومات العميل
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">الاسم</Label>
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="h-9 text-sm rounded-lg border-dark-200 bg-dark-50/50"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">الهاتف</Label>
                <Input
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="h-9 text-sm rounded-lg border-dark-200 bg-dark-50/50"
                  dir="ltr"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">واتساب</Label>
                <Input
                  value={editWhatsApp}
                  onChange={(e) => setEditWhatsApp(e.target.value)}
                  className="h-9 text-sm rounded-lg border-dark-200 bg-dark-50/50"
                  dir="ltr"
                  placeholder="اختياري"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">البريد</Label>
                <Input
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="h-9 text-sm rounded-lg border-dark-200 bg-dark-50/50"
                  dir="ltr"
                  placeholder="اختياري"
                />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label className="text-xs">العنوان</Label>
                <Input
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  className="h-9 text-sm rounded-lg border-dark-200 bg-dark-50/50"
                  placeholder="اختياري"
                />
              </div>
            </div>
          </section>

          {/* ===== مواصفات الطباعة ===== */}
          <section className="bg-card border border-gold-500/8 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-4">
            <h3 className="text-sm font-semibold flex items-center gap-2.5 text-dark-800 border-r-4 border-gold-500 pr-3 mb-3">
              مواصفات الطباعة
            </h3>
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
                  <div
                    key={k}
                    className="rounded-xl bg-dark-50 border border-dark-200/60 px-3 py-2"
                  >
                    <div className="text-[11px] text-dark-400">
                      {translateOptionKey(k)}
                    </div>
                    <div className="text-xs font-semibold text-dark-800">
                      {translateOptionValue(String(v))}
                    </div>
                  </div>
                ))}
            </div>
          </section>

          {/* ===== الكميات والأسعار ===== */}
          <section className="bg-card border border-gold-500/8 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-4">
            <h3 className="text-sm font-semibold flex items-center gap-2.5 text-dark-800 border-r-4 border-gold-500 pr-3 mb-3">
              الكميات والأسعار
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">الصفحات</Label>
                <Input
                  type="number"
                  min={1}
                  value={editPages}
                  onChange={(e) => setEditPages(Number(e.target.value))}
                  className="h-9 text-sm rounded-lg border-dark-200 bg-dark-50/50"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">النسخ</Label>
                <Input
                  type="number"
                  min={1}
                  value={editCopies}
                  onChange={(e) => setEditCopies(Number(e.target.value))}
                  className="h-9 text-sm rounded-lg border-dark-200 bg-dark-50/50"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">تكلفة الإنتاج</Label>
                <Input
                  type="number"
                  min={0}
                  value={editCost}
                  onChange={(e) => setEditCost(Number(e.target.value))}
                  className="h-9 text-sm rounded-lg border-dark-200 bg-dark-50/50"
                  placeholder="0"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">المجموع</Label>
                <div className="h-9 flex items-center px-3 rounded-lg border border-dark-200 bg-dark-50/50 text-sm font-bold text-amber-700">
                  {formatDA(order.total)}
                </div>
              </div>
            </div>

            {/* الربح */}
            <div className="mt-2.5 flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-200/60">
              <span className="text-xs text-emerald-600">الربح:</span>
              <span className={cn("text-sm font-bold", profit >= 0 ? "text-emerald-700" : "text-rose-600")}>
                {formatDA(profit)}
              </span>
              <span className="text-[10px] text-dark-400 mr-auto">
                المجموع − التكلفة
              </span>
            </div>

            {/* تفاصيل التسعير */}
            <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1 text-xs text-dark-400">
              <div>سعر الصفحة: {formatDA(order.pricing.perPage)}</div>
              <div>تكلفة الصفحات: {formatDA(order.pricing.pagesCost)}</div>
              <div>تكلفة النسخ: {formatDA(order.pricing.copiesCost)}</div>
              <div>توفير الوجهين: {formatDA(order.pricing.sidesSaving)}</div>
              {order.pricing.paperTypeSurcharge != null && order.pricing.paperTypeSurcharge > 0 && (
                <div>رسوم الورق: {formatDA(order.pricing.paperTypeSurcharge)}</div>
              )}
              {order.pricing.bindingCost != null && order.pricing.bindingCost > 0 && (
                <div>التجليد: {formatDA(order.pricing.bindingCost)}</div>
              )}
              {order.pricing.extrasCost != null && order.pricing.extrasCost > 0 && (
                <div>إضافات: {formatDA(order.pricing.extrasCost)}</div>
              )}
              {order.pricing.finishingCost != null && order.pricing.finishingCost > 0 && (
                <div>التشطيب: {formatDA(order.pricing.finishingCost)}</div>
              )}
              <div>التوصيل: {formatDA(order.pricing.deliveryCost)}</div>
              <div>الخصم: {formatDA(order.pricing.discount)}</div>
            </div>
          </section>

          {/* ===== ملاحظات إدارية ===== */}
          <section className="bg-card border border-gold-500/8 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-4">
            <h3 className="text-sm font-semibold flex items-center gap-2.5 text-dark-800 border-r-4 border-gold-500 pr-3 mb-3">
              ملاحظات إدارية
            </h3>
            <Textarea
              value={editAdminNotes}
              onChange={(e) => setEditAdminNotes(e.target.value)}
              className="text-sm min-h-[60px] rounded-lg border-dark-200 bg-dark-50/50"
              placeholder="أضف ملاحظة داخلية..."
            />
          </section>

          {/* ===== الوسوم ===== */}
          <section className="bg-card border border-gold-500/8 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-4">
            <h3 className="text-sm font-semibold flex items-center gap-2.5 text-dark-800 border-r-4 border-gold-500 pr-3 mb-3">
              <Tag className="h-3.5 w-3.5" />
              الوسوم
            </h3>
            {/* وسوم محددة مسبقاً */}
            <div className="flex flex-wrap gap-2 mb-2.5">
              {PRESET_TAGS.map((tag) => (
                <Badge
                  key={tag}
                  variant={editTags.includes(tag) ? "default" : "outline"}
                  className={cn(
                    "cursor-pointer select-none text-xs rounded-lg transition-all duration-150",
                    editTags.includes(tag)
                      ? "bg-gold-500 hover:bg-gold-600 text-white border-gold-500"
                      : "border-dark-200 text-dark-600 hover:bg-gold-500/5",
                  )}
                  onClick={() => togglePresetTag(tag)}
                >
                  {tag}
                </Badge>
              ))}
            </div>
            {/* وسوم مخصصة */}
            <div className="flex items-center gap-2">
              <Input
                value={customTagInput}
                onChange={(e) => setCustomTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addCustomTag();
                  }
                }}
                placeholder="وسم مخصص..."
                className="h-8 text-xs rounded-lg border-dark-200 bg-dark-50/50 flex-1"
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-8 px-2.5 rounded-lg border-dark-200 hover:bg-gold-500/5 transition-all duration-200"
                onClick={addCustomTag}
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>
            {/* عرض الوسوم الفعالة */}
            {editTags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2.5">
                {editTags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-gold-50 text-gold-600 border border-gold-200/60"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="hover:text-foreground transition-colors"
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </section>

          {/* ===== معلومات الملف ===== */}
          {order.fileName && (
            <section className="bg-card border border-gold-500/8 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-4">
              <h3 className="text-sm font-semibold flex items-center gap-2.5 text-dark-800 border-r-4 border-gold-500 pr-3 mb-3">
                الملف المرفق
              </h3>
              <div className="flex items-center gap-3 rounded-xl bg-dark-50 border border-dark-200/60 p-3">
                <FileText className="h-8 w-8 text-gold-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate text-dark-800">{order.fileName}</div>
                  <div className="text-xs text-dark-400">
                    {order.fileType || "—"}{" "}
                    {order.fileSize ? `• ${Math.round(order.fileSize / 1024)} ك.ب` : ""}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs shrink-0 rounded-lg border-dark-200 hover:bg-gold-500/5 transition-all duration-200"
                  onClick={downloadFile}
                >
                  <Download className="h-3.5 w-3.5 ml-1" />
                  تنزيل
                </Button>
              </div>
            </section>
          )}

          {/* ===== التسليم ===== */}
          <section className="bg-card border border-gold-500/8 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-4">
            <h3 className="text-sm font-semibold flex items-center gap-2.5 text-dark-800 border-r-4 border-gold-500 pr-3 mb-3">
              التسليم
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-xl bg-dark-50 border border-dark-200/60 px-3 py-2">
                <div className="text-[11px] text-dark-400">الطريقة</div>
                <div className="text-xs font-semibold text-dark-800">
                  {order.delivery.mode === "pickup" ? "استلام من المحل" : "توصيل"}
                </div>
              </div>
              <div className="rounded-xl bg-dark-50 border border-dark-200/60 px-3 py-2">
                <div className="text-[11px] text-dark-400">الموعد</div>
                <div className="text-xs font-semibold text-dark-800">
                  {order.delivery.date || "—"} (≈{order.estimatedHours} س)
                </div>
              </div>
            </div>
          </section>

          {/* ===== سجل التغييرات ===== */}
          <section className="bg-card border border-gold-500/8 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-4">
            <button
              type="button"
              className="flex items-center gap-2 w-full text-right"
              onClick={() => setShowAudit(!showAudit)}
            >
              <h3 className="text-sm font-semibold flex items-center gap-2.5 text-dark-800 border-r-4 border-gold-500 pr-3 mb-0">
                سجل التغييرات
                {auditLogs.length > 0 && (
                  <span className="text-xs font-normal text-dark-400">
                    ({auditLogs.length})
                  </span>
                )}
              </h3>
              <span className="mr-auto text-dark-400">
                {showAudit ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </span>
            </button>
            {showAudit && (
              <div className="mt-3">
                {auditLoading ? (
                  <div className="text-xs text-dark-400 py-3 text-center">
                    <RefreshCw className="h-3 w-3 animate-spin inline-block ml-1" />
                    جارٍ التحميل...
                  </div>
                ) : auditLogs.length === 0 ? (
                  <p className="text-xs text-dark-400 py-3 text-center">
                    لا يوجد سجل تغييرات
                  </p>
                ) : (
                  <div className="max-h-48 overflow-y-auto custom-scroll space-y-1.5">
                    {auditLogs.map((log) => {
                      const icon =
                        log.action === "status_change"
                          ? "🔄"
                          : log.action === "edit"
                            ? "✏️"
                            : log.action === "create"
                              ? "➕"
                              : log.action === "delete"
                                ? "🗑️"
                                : "📝";
                      const actionLabel =
                        log.action === "status_change"
                          ? "تغيير الحالة"
                          : log.action === "edit"
                            ? "تعديل"
                            : log.action === "create"
                              ? "إنشاء"
                              : log.action === "delete"
                                ? "حذف"
                                : log.action;
                      return (
                        <div
                          key={log.id}
                          className="flex items-start gap-2 text-xs py-1.5 px-2.5 rounded-lg bg-dark-50 border border-dark-200/60"
                        >
                          <span className="shrink-0 mt-0.5">{icon}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-medium text-dark-800">
                                {actionLabel}
                              </span>
                              {log.field && (
                                <span className="text-dark-400">— {log.field}</span>
                              )}
                            </div>
                            {log.oldValue != null && log.newValue != null && (
                              <div className="text-dark-500 mt-0.5">
                                <span className="text-rose-500 line-through">
                                  {log.oldValue}
                                </span>
                                <span className="mx-1">→</span>
                                <span className="text-emerald-600 font-medium">
                                  {log.newValue}
                                </span>
                              </div>
                            )}
                            {log.details && (
                              <div className="text-dark-500 mt-0.5">{log.details}</div>
                            )}
                          </div>
                          <span className="text-[10px] text-dark-400/60 whitespace-nowrap shrink-0">
                            {formatDateTimeAr(log.createdAt)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </section>

          {/* ===== أزرار الحفظ والإجراءات ===== */}
          <div className="flex items-center justify-between pt-2 border-t border-dark-200/60">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-xs text-dark-500 hover:text-dark-700 rounded-lg"
              >
                <X className="h-3.5 w-3.5 ml-1" />
                إغلاق
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={openInvoice}
                className="text-xs rounded-lg border-dark-200 hover:bg-gold-500/5 transition-all duration-200"
              >
                <FileCheck className="h-3.5 w-3.5 ml-1" />
                فاتورة
              </Button>
              {hasReceiptPrinting && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { if (order) printReceipt(order, shopName, shopPhone, shopAddress); }}
                  className="text-xs rounded-lg border-dark-200 hover:bg-gold-500/5 transition-all duration-200"
                >
                  <Printer className="h-3.5 w-3.5 ml-1" />
                  طباعة إيصال
                </Button>
              )}
              {!showDeleteConfirm ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="text-xs rounded-lg border-rose-200 text-rose-600 hover:bg-rose-50 transition-all duration-200"
                >
                  <Trash2 className="h-3.5 w-3.5 ml-1" />
                  حذف
                </Button>
              ) : (
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-rose-600 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    تأكيد؟
                  </span>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={deleting}
                    className="h-8 text-xs rounded-lg"
                  >
                    {deleting ? "جارٍ..." : "نعم، احذف"}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowDeleteConfirm(false)}
                    className="h-8 text-xs text-dark-500 rounded-lg"
                  >
                    إلغاء
                  </Button>
                </div>
              )}
            </div>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={saving}
              className="text-xs bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-all duration-200 active:scale-[0.98]"
            >
              <Save className="h-3.5 w-3.5 ml-1" />
              {saving ? "جارٍ الحفظ..." : "حفظ التغييرات"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>

      {/* Print Job Ticket — hidden on screen, visible only when printing */}
      {hasDirectPrinting && order && (
        <PrintJobTicket
          order={order}
          shopName={shopName}
          shopPhone={shopPhone}
          shopAddress={shopAddress}
        />
      )}
    </>
  );
}