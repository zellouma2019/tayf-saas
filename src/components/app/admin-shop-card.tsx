"use client";

import { useState, useMemo } from "react";
import {
  Store, Copy, Trash2, ExternalLink, Eye, EyeOff,
  Pencil, Timer, ToggleLeft, Hourglass, Crown,
  Users, Lock, Settings, CalendarDays, CreditCard,
  Zap, Infinity, XCircle, Check, CheckCircle2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  STATUS_META, formatDA,
} from "@/lib/print-config";
import {
  FEATURES, parseFeatures, countEnabledFeatures, TOTAL_FEATURES,
  FREE_FEATURES, isFeatureFree,
  type FeatureKey, type ShopFeatures,
} from "@/lib/shop-features";
import { getCountry } from "@/lib/countries";
import {
  robustCopy, openInNewTab, adminFetch,
  STATUS_COLORS,
} from "@/lib/admin-utils";
import type { ShopStat } from "@/lib/admin-types";

// ===== زر نسخ مع تأكيد بصري =====
export function CopyButton({ text, label, className }: { text: string; label: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  async function handleCopy() {
    await robustCopy(text, `تم نسخ ${label}`, "");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <button
      className={
        "shrink-0 border rounded-lg px-3 py-2 text-xs font-medium transition-all duration-200 inline-flex items-center gap-1.5 " +
        (copied
          ? "border-emerald-300 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600"
          : "border-border text-foreground/80 hover:bg-accent" +
            (className ? " " + className : ""))
      }
      onClick={handleCopy}
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? "تم!" : label}
    </button>
  );
}

// ===== بطاقة متجر في نظرة عامة =====
export function ShopOverviewCard({ shop, onRefresh }: {
  shop: ShopStat;
  onRefresh: () => void;
}) {
  return (
    <Card className={cn("bg-card border border-border shadow-sm hover:shadow-md transition-all overflow-hidden", shop.isActive ? "border-r-4 border-r-emerald-400" : "border-r-4 border-r-rose-400")}>
      <div className="h-1 bg-primary/100" />
      <CardHeader className="pb-2 px-5 pt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Store className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <CardTitle className="text-sm truncate text-foreground">{shop.name}</CardTitle>
              <div className="text-xs text-muted-foreground/70 truncate">
                {shop.ownerName || "—"} · {shop.ownerPhone || shop.phone || "—"}
              </div>
            </div>
          </div>
          <span className={`text-xs px-2.5 py-1 rounded-lg shrink-0 font-medium ${
            shop.isActive
              ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600"
              : "bg-rose-50 dark:bg-rose-950/30 text-rose-600"
          }`}>
            {shop.isActive ? "نشط" : "متوقف"}
          </span>
          {shop.plan === "pro" || shop.plan === "paid" ? (
            <span className="text-xs px-2.5 py-1 rounded-lg shrink-0 font-medium bg-primary/10 text-primary flex items-center gap-1">
              <Crown className="h-3 w-3" /> PRO
            </span>
          ) : (
            <span className="text-xs px-2.5 py-1 rounded-lg shrink-0 font-medium bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600">
              مجاني
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="px-5 pb-5 space-y-4">
        <div className="grid grid-cols-3 gap-2.5 text-center">
          <div className="bg-muted/50 rounded-xl p-3">
            <div className="text-lg font-bold text-foreground">{shop.orders}</div>
            <div className="text-xs text-muted-foreground/70">طلبات</div>
          </div>
          <div className="bg-emerald-50/60 rounded-xl p-3">
            <div className="text-lg font-bold text-emerald-600">{formatDA(shop.revenue)}</div>
            <div className="text-xs text-muted-foreground/70">إيرادات</div>
          </div>
          <div className="bg-amber-50/60 rounded-xl p-3">
            <div className="text-lg font-bold text-amber-600">{shop.todayOrders}</div>
            <div className="text-xs text-muted-foreground/70">اليوم</div>
          </div>
        </div>

        {shop.recentOrders.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs font-semibold text-muted-foreground">آخر الطلبات:</div>
            {shop.recentOrders.slice(0, 3).map((o) => (
              <div key={o.id} className="flex items-center justify-between text-xs bg-muted/60 rounded-lg px-3 py-2.5">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-mono font-bold text-foreground/80">{o.reference}</span>
                  <span className="text-muted-foreground/70 truncate">{o.customer.name}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-bold text-foreground">{formatDA(o.total)}</span>
                  <span className={`px-2 py-0.5 rounded-lg text-xs ${STATUS_COLORS[o.status] || ""}`}>
                    {STATUS_META[o.status]?.label || o.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-wrap gap-2 pt-1">
          <CopyButton text={`${window.location.origin}/s/${shop.slug}`} label="رابط الزبون" />
          <CopyButton text={`${window.location.origin}/s/${shop.slug}?admin=1`} label="رابط الإدارة" />
          <button className="border border-border text-foreground/80 hover:bg-accent rounded-lg px-3 py-2 text-xs font-medium transition-colors inline-flex items-center gap-1.5" onClick={() => openInNewTab(`/s/${shop.slug}?admin=1`)}>
            <ExternalLink className="h-3.5 w-3.5" /> فتح الإدارة
          </button>
          <button className="border border-border text-foreground/80 hover:bg-accent rounded-lg px-3 py-2 text-xs font-medium transition-colors inline-flex items-center gap-1.5" onClick={() => openInNewTab(`/s/${shop.slug}?preview=1`)}>
            <Eye className="h-3.5 w-3.5" /> معاينة زبون
          </button>
        </div>
      </CardContent>
    </Card>
  );
}

// ===== حساب حالة التجربة =====
function getTrialInfo(shop: ShopStat): { label: string; color: string; daysLeft: number | null } {
  if (!shop.trialDays || !shop.trialStartsAt) {
    return { label: "بلا حدود", color: "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600", daysLeft: null };
  }
  const start = new Date(shop.trialStartsAt);
  const end = new Date(start.getTime() + shop.trialDays * 86400000);
  const now = new Date();
  const daysLeft = Math.ceil((end.getTime() - now.getTime()) / 86400000);
  if (daysLeft <= 0) {
    return { label: "انتهت", color: "bg-rose-50 dark:bg-rose-950/30 text-rose-600", daysLeft: 0 };
  }
  if (daysLeft <= 3) {
    return { label: `${daysLeft} يوم متبقي`, color: "bg-amber-50 dark:bg-amber-950/30 text-amber-600", daysLeft };
  }
  return { label: `${daysLeft} يوم متبقي`, color: "bg-primary/10 text-primary", daysLeft };
}

// ===== بطاقة إدارة متجر =====
export function ShopManageCard({ shop, onCopyLink, onCopyAdminLink, onRefresh }: {
  shop: ShopStat;
  onCopyLink: (slug: string) => void;
  onCopyAdminLink: (slug: string) => void;
  onRefresh: () => void;
}) {
  const [toggling, setToggling] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const trial = getTrialInfo(shop);
  const parsedFeatures = parseFeatures(shop.features, shop.plan);
  const enabledCount = countEnabledFeatures(parsedFeatures);
  const isPaid = shop.plan === "paid";

  async function toggleActive() {
    setToggling(true);
    try {
      const res = await adminFetch(`/api/admin/shops/${shop.slug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !shop.isActive }),
      });
      if (!res.ok) throw new Error("فشل");
      toast.success(shop.isActive ? `تم تعطيل "${shop.name}"` : `تم تفعيل "${shop.name}"`);
      onRefresh();
    } catch {
      toast.error("فشل التحديث");
    } finally {
      setToggling(false);
    }
  }

  async function deleteShop() {
    setDeleting(true);
    try {
      const res = await adminFetch(`/api/admin/shops/${shop.slug}`, { method: "DELETE" });
      if (!res.ok) throw new Error("فشل");
      toast.success(`تم حذف "${shop.name}"`);
      onRefresh();
    } catch {
      toast.error("فشل الحذف");
    } finally {
      setDeleting(false);
    }
  }

  async function quickTrial(days: number) {
    try {
      const all: ShopFeatures = {};
      FEATURES.forEach((f) => { all[f.key] = true; });
      const today = new Date().toISOString();
      const res = await adminFetch(`/api/admin/shops/${shop.slug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: "free", trialDays: days, trialStartsAt: today, features: all }),
      });
      if (!res.ok) throw new Error("فشل");
      toast.success(`تم تفعيل تجربة ${days} يوم لـ "${shop.name}" ✅`);
      onRefresh();
    } catch {
      toast.error("فشل تفعيل التجربة");
    }
  }

  return (
    <>
    <Card className={cn("bg-card border border-border shadow-sm hover:shadow-md transition-all overflow-hidden", shop.isActive ? "border-r-4 border-r-emerald-400" : "border-r-4 border-r-rose-400")}>
      {/* شريط لون المتجر في الأعلى */}
      <div
        className="h-1.5"
        style={{ background: shop.primaryColor ? `linear-gradient(to left, ${shop.primaryColor}, ${shop.primaryColor}cc)` : "linear-gradient(to left, #d4a853, #a88850)" }}
      />
      <CardContent className="p-0">
        <div className="flex flex-col gap-4 p-5">
          {/* السطر الأول: اسم المتجر + الحالة + التجربة */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Store className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <div className="font-bold text-sm truncate text-foreground">{getCountry(shop.country)?.flag} {shop.name}</div>
                <div className="text-xs text-muted-foreground/70 truncate">
                  {shop.ownerName && `${shop.ownerName} · `}
                  {shop.orders} طلب · {formatDA(shop.revenue, shop.country)}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
              <span className={`text-xs px-2.5 py-1 rounded-lg font-medium ${
                shop.isActive
                  ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600"
                  : "bg-rose-50 dark:bg-rose-950/30 text-rose-600"
              }`}>
                {shop.isActive ? "نشط" : "متوقف"}
              </span>
              <span className={`text-xs px-2.5 py-1 rounded-lg font-medium ${
                isPaid
                  ? "bg-primary/10 text-primary"
                  : "bg-muted/50 text-muted-foreground"
              }`}>
                {isPaid ? "✦ مدفوع" : "مجاني"}
              </span>
              <span className={`text-xs px-2.5 py-1 rounded-lg font-medium ${trial.color}`}>
                <Timer className="h-3 w-3 inline-block ml-0.5 -mt-px" />
                {trial.label}
              </span>
              <span className={`text-xs px-2.5 py-1 rounded-lg font-medium ${
                shop.paymentInfo
                  ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600"
                  : "bg-muted/50 text-muted-foreground/70"
              }`}>
                {shop.paymentInfo ? "✓ مدفوع" : "غير مدفوع"}
              </span>
            </div>
          </div>

          {/* السطر الثاني: أزرار الإدارة + عدد الميزات */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-1.5 flex-wrap">
              <button className="border border-border text-foreground/80 hover:bg-accent rounded-lg px-3 py-2.5 text-xs font-medium transition-colors inline-flex items-center gap-1.5" onClick={() => setEditOpen(true)}>
                <Pencil className="h-3.5 w-3.5" /> إعدادات
              </button>
              <button className="border border-border text-foreground/80 hover:bg-accent rounded-lg px-3 py-2.5 text-xs font-medium transition-colors inline-flex items-center gap-1.5" onClick={toggleActive} disabled={toggling}>
                {shop.isActive ? <><EyeOff className="h-3.5 w-3.5" /> تعطيل</> : <><Eye className="h-3.5 w-3.5" /> تفعيل</>}
              </button>
              <button className="border border-border text-foreground/80 hover:bg-accent rounded-lg px-3 py-2.5 text-xs font-medium transition-colors inline-flex items-center gap-1.5" onClick={() => onCopyLink(shop.slug)}>
                <Copy className="h-3.5 w-3.5" /> رابط الزبون
              </button>
              <button className="border border-border text-foreground/80 hover:bg-accent rounded-lg px-3 py-2.5 text-xs font-medium transition-colors inline-flex items-center gap-1.5" onClick={() => onCopyAdminLink(shop.slug)}>
                <Copy className="h-3.5 w-3.5" /> رابط الإدارة
              </button>
              {/* قائمة التجربة السريعة */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="border border-amber-200 dark:border-amber-800/40 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 rounded-lg px-3 py-2.5 text-xs font-medium transition-colors inline-flex items-center gap-1.5">
                    <Hourglass className="h-3.5 w-3.5" /> تفعيل تجربة
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-lg border-border">
                  <DropdownMenuItem className="rounded-lg cursor-pointer text-xs" onClick={() => quickTrial(7)}>
                    <Timer className="h-3.5 w-3.5 ml-2 text-sky-500" /> تجربة 7 أيام
                  </DropdownMenuItem>
                  <DropdownMenuItem className="rounded-lg cursor-pointer text-xs" onClick={() => quickTrial(15)}>
                    <Timer className="h-3.5 w-3.5 ml-2 text-primary/60" /> تجربة 15 يوم
                  </DropdownMenuItem>
                  <DropdownMenuItem className="rounded-lg cursor-pointer text-xs" onClick={() => quickTrial(30)}>
                    <Timer className="h-3.5 w-3.5 ml-2 text-amber-500" /> تجربة 30 يوم
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <button className="border border-border text-foreground/80 hover:bg-accent rounded-lg px-3 py-2.5 text-xs font-medium transition-colors inline-flex items-center gap-1.5" onClick={() => openInNewTab(`/s/${shop.slug}?admin=1`)}>
                <ExternalLink className="h-3.5 w-3.5" /> فتح الإدارة
              </button>
              <button className="border border-primary/20 text-primary hover:bg-primary/10 rounded-lg px-3 py-2.5 text-xs font-medium transition-colors inline-flex items-center gap-1.5" onClick={() => openInNewTab(`/s/${shop.slug}`)}>
                <Eye className="h-3.5 w-3.5" /> معاينة
              </button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button className="bg-red-50 text-red-600 hover:bg-red-100 rounded-lg px-3 py-2.5 text-xs font-medium transition-colors inline-flex items-center gap-1.5" disabled={deleting}>
                    <Trash2 className="h-3.5 w-3.5" /> {deleting ? "جارٍ الحذف..." : "حذف"}
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent dir="rtl" className="rounded-xl shadow-2xl">
                  <AlertDialogHeader>
                    <AlertDialogTitle>حذف متجر &quot;{shop.name}&quot;؟</AlertDialogTitle>
                    <AlertDialogDescription>
                      سيتم حذف المتجر وجميع طلباته نهائياً. هذا الإجراء لا يمكن التراجع عنه.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="rounded-lg">إلغاء</AlertDialogCancel>
                    <AlertDialogAction onClick={deleteShop} className="bg-red-600 hover:bg-red-700 rounded-lg">تأكيد الحذف</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
            <span className="text-xs text-muted-foreground/70 whitespace-nowrap">
              <ToggleLeft className="h-3 w-3 inline-block ml-0.5 -mt-px" />
              {enabledCount}/{TOTAL_FEATURES} ميزة
            </span>
          </div>
        </div>
      </CardContent>
    </Card>

    <EditShopDialog
      shop={shop}
      open={editOpen}
      onClose={() => setEditOpen(false)}
      onSaved={onRefresh}
    />
    </>
  );
}

// ===== نافذة تعديل متجر =====
function EditShopDialog({ shop, open, onClose, onSaved }: {
  shop: ShopStat;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [plan, setPlan] = useState(shop.plan || "free");
  const [features, setFeatures] = useState<ShopFeatures>(() => parseFeatures(shop.features, shop.plan));
  const [paymentInfo, setPaymentInfo] = useState(shop.paymentInfo || "");
  const [ownerNotes, setOwnerNotes] = useState(shop.ownerNotes || "");
  const [form, setForm] = useState({
    name: shop.name,
    phone: shop.phone || "",
    whatsapp: shop.whatsapp || "",
    email: shop.email || "",
    address: shop.address || "",
    ownerName: shop.ownerName || "",
    ownerPhone: shop.ownerPhone || "",
    adminPin: shop.adminPin || "",
    primaryColor: shop.primaryColor || "",
    trialDays: shop.trialDays ?? "",
    trialStartsAt: shop.trialStartsAt ? shop.trialStartsAt.slice(0, 10) : "",
  });

  function updateField(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  const enabledCount = countEnabledFeatures(features);
  const isPaidPlan = plan === "paid" || plan === "pro" || plan === "premium";

  // ===== حالة التجربة / الخطة =====
  const trialStatus = useMemo(() => {
    if (isPaidPlan) return { type: "paid" as const, label: "مدفوع - دائم", daysLeft: 0 };
    const days = Number(form.trialDays);
    const start = form.trialStartsAt;
    if (!days || !start) return { type: "free" as const, label: "مجاني", daysLeft: 0 };
    const now = new Date();
    const startDate = new Date(start);
    const endDate = new Date(startDate.getTime() + days * 86400000);
    const diffMs = endDate.getTime() - now.getTime();
    const daysLeft = Math.ceil(diffMs / 86400000);
    if (daysLeft > 0) return { type: "trial" as const, label: `تجربة - ${daysLeft} يوم متبقي`, daysLeft };
    return { type: "expired" as const, label: "انتهت التجربة", daysLeft: 0 };
  }, [plan, form.trialDays, form.trialStartsAt]);

  const STATUS_BADGE_STYLE: Record<string, string> = {
    paid: "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/40",
    trial: "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/40",
    expired: "bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/40",
    free: "bg-muted/50 text-muted-foreground border-border",
  };

  function toggleFeature(key: FeatureKey) {
    setFeatures((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function enableAllForGroup(groupFeatures: typeof FEATURES) {
    const updated = { ...features };
    groupFeatures.forEach((f) => { updated[f.key] = true; });
    setFeatures(updated);
  }

  function disableAllForGroup(groupFeatures: typeof FEATURES) {
    const updated = { ...features };
    groupFeatures.forEach((f) => { updated[f.key] = false; });
    setFeatures(updated);
  }

  function enableAllFeatures() {
    const all: ShopFeatures = {};
    FEATURES.forEach((f) => { all[f.key] = true; });
    setFeatures(all);
  }

  function disableAllFeatures() {
    const all: ShopFeatures = {};
    FEATURES.forEach((f) => { all[f.key] = false; });
    setFeatures(all);
    setPlan("free");
  }

  function quickAction(mode: "permanent" | "trial7" | "trial15" | "trial30") {
    enableAllFeatures();
    if (mode === "permanent") {
      setPlan("paid");
      setForm((prev) => ({ ...prev, trialDays: "", trialStartsAt: "" }));
    } else {
      setPlan("free");
      const days = mode === "trial7" ? 7 : mode === "trial15" ? 15 : 30;
      const today = new Date().toISOString();
      setForm((prev) => ({ ...prev, trialDays: String(days), trialStartsAt: today }));
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        name: form.name,
        phone: form.phone || null,
        whatsapp: form.whatsapp || null,
        email: form.email || null,
        address: form.address || null,
        ownerName: form.ownerName || null,
        ownerPhone: form.ownerPhone || null,
        adminPin: form.adminPin,
        primaryColor: form.primaryColor || null,
        trialDays: form.trialDays ? Number(form.trialDays) : "",
        trialStartsAt: form.trialStartsAt || null,
        plan,
        features,
        paymentInfo: paymentInfo || null,
        ownerNotes: ownerNotes || null,
      };

      const res = await adminFetch(`/api/admin/shops/${shop.slug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "فشل التحديث");
      }
      toast.success(`تم تحديث "${form.name}"`);
      onSaved();
      onClose();
    } catch (err) {
      toast.error("فشل التحديث", { description: (err as Error).message });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-[95vw] sm:max-w-3xl max-h-[90vh] overflow-y-auto rounded-xl shadow-2xl p-4 sm:p-6" dir="rtl">
        <DialogTitle className="flex items-center justify-between">
          <span className="text-foreground">إعدادات متجر &quot;{shop.name}&quot;</span>
          <Badge variant="outline" className={`text-xs font-semibold rounded-lg ${STATUS_BADGE_STYLE[trialStatus.type]}`}>
            {trialStatus.type === "paid" && <Infinity className="h-3 w-3 ml-1 inline" />}
            {trialStatus.type === "trial" && <Timer className="h-3 w-3 ml-1 inline" />}
            {trialStatus.type === "expired" && <XCircle className="h-3 w-3 ml-1 inline" />}
            {trialStatus.label}
          </Badge>
        </DialogTitle>

        <form onSubmit={handleSave} className="space-y-6 mt-2">
          {/* معلومات المتجر */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold flex items-center gap-2 text-foreground/80 border-r-2 border-primary pr-3">
              <Store className="h-4 w-4 text-primary" /> معلومات المتجر
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Label className="text-foreground/60">اسم المتجر</Label>
                <Input value={form.name} onChange={(e) => updateField("name", e.target.value)} className="mt-1.5 rounded-lg border-border focus:ring-ring focus:border-ring" required />
              </div>
              <div>
                <Label className="text-foreground/60">هاتف المتجر</Label>
                <Input value={form.phone} onChange={(e) => updateField("phone", e.target.value)} className="mt-1.5 rounded-lg border-border focus:ring-ring focus:border-ring" dir="ltr" placeholder="0XXX..." />
              </div>
              <div>
                <Label className="text-foreground/60">واتساب</Label>
                <Input value={form.whatsapp} onChange={(e) => updateField("whatsapp", e.target.value)} className="mt-1.5 rounded-lg border-border focus:ring-ring focus:border-ring" dir="ltr" placeholder="0XXX..." />
              </div>
              <div>
                <Label className="text-foreground/60">البريد الإلكتروني</Label>
                <Input value={form.email} onChange={(e) => updateField("email", e.target.value)} className="mt-1.5 rounded-lg border-border focus:ring-ring focus:border-ring" dir="ltr" type="email" />
              </div>
              <div>
                <Label className="text-foreground/60">العنوان</Label>
                <Input value={form.address} onChange={(e) => updateField("address", e.target.value)} className="mt-1.5 rounded-lg border-border focus:ring-ring focus:border-ring" />
              </div>
            </div>
          </div>

          {/* معلومات صاحب المتجر */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold flex items-center gap-2 text-foreground/80 border-r-2 border-emerald-400 pr-3">
              <Users className="h-4 w-4 text-emerald-500" /> بيانات العميل (صاحب المتجر)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-foreground/60">اسم العميل</Label>
                <Input value={form.ownerName} onChange={(e) => updateField("ownerName", e.target.value)} className="mt-1.5 rounded-lg border-border focus:ring-ring focus:border-ring" />
              </div>
              <div>
                <Label className="text-foreground/60">هاتف العميل</Label>
                <Input value={form.ownerPhone} onChange={(e) => updateField("ownerPhone", e.target.value)} className="mt-1.5 rounded-lg border-border focus:ring-ring focus:border-ring" dir="ltr" placeholder="0XXX..." />
              </div>
            </div>
          </div>

          {/* الأمان */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold flex items-center gap-2 text-foreground/80 border-r-2 border-rose-400 pr-3">
              <Lock className="h-4 w-4 text-rose-500" /> الأمان
            </h4>
            <div>
              <Label className="text-foreground/60">كلمة مرور الإدارة</Label>
              <Input value={form.adminPin} onChange={(e) => updateField("adminPin", e.target.value)} className="mt-1.5 rounded-lg border-border focus:ring-ring focus:border-ring" dir="ltr" required />
              <p className="text-xs text-muted-foreground/70 mt-1.5">أرسل هذه الكلمة للعميل مع رابط الإدارة</p>
            </div>
          </div>

          {/* المظهر */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold flex items-center gap-2 text-foreground/80 border-r-2 border-primary pr-3">
              <Settings className="h-4 w-4 text-primary/60" /> المظهر
            </h4>
            <div>
              <Label className="text-foreground/60">اللون الرئيسي</Label>
              <div className="flex gap-3 mt-1.5">
                <Input value={form.primaryColor} onChange={(e) => updateField("primaryColor", e.target.value)} className="flex-1 rounded-lg border-border focus:ring-ring focus:border-ring" dir="ltr" placeholder="#d4a853" />
                {form.primaryColor && (
                  <div className="w-10 h-10 rounded-lg border border-border shrink-0 shadow-sm" style={{ backgroundColor: form.primaryColor }} />
                )}
              </div>
            </div>
          </div>

          {/* فترة التجربة + إجراءات سريعة */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold flex items-center gap-2 text-foreground/80 border-r-2 border-primary pr-3">
              <CalendarDays className="h-4 w-4 text-primary" /> فترة التجربة والمدة
            </h4>

            {/* إجراءات سريعة */}
            <div className="space-y-3 bg-muted/40 rounded-xl p-4 border border-border">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-lg bg-primary/15 flex items-center justify-center">
                  <Zap className="h-3.5 w-3.5 text-primary" />
                </div>
                <span className="text-sm font-bold text-foreground/80">إجراءات سريعة</span>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  className="text-xs h-10 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-colors inline-flex items-center justify-center gap-1.5"
                  onClick={() => quickAction("permanent")}
                >
                  <Infinity className="h-3.5 w-3.5 ml-1.5" />
                  مدفوع (دائم)
                </button>
                <button
                  type="button"
                  className="text-xs h-10 rounded-lg bg-sky-600 hover:bg-sky-700 text-white shadow-sm transition-colors inline-flex items-center justify-center gap-1.5"
                  onClick={() => quickAction("trial7")}
                >
                  <Timer className="h-3.5 w-3.5 ml-1.5" />
                  تجربة 7 أيام
                </button>
                <button
                  type="button"
                  className="text-xs h-10 rounded-lg bg-primary/100 hover:bg-primary/90 text-white shadow-sm transition-colors inline-flex items-center justify-center gap-1.5"
                  onClick={() => quickAction("trial15")}
                >
                  <Timer className="h-3.5 w-3.5 ml-1.5" />
                  تجربة 15 يوم
                </button>
                <button
                  type="button"
                  className="text-xs h-10 rounded-lg bg-amber-600 hover:bg-amber-700 text-white shadow-sm transition-colors inline-flex items-center justify-center gap-1.5"
                  onClick={() => quickAction("trial30")}
                >
                  <Timer className="h-3.5 w-3.5 ml-1.5" />
                  تجربة 30 يوم
                </button>
              </div>
              <button
                type="button"
                className="w-full text-xs h-9 rounded-lg bg-muted hover:bg-accent text-foreground/60 border border-border transition-colors inline-flex items-center justify-center gap-1.5 mt-1"
                onClick={disableAllFeatures}
              >
                <XCircle className="h-3.5 w-3.5 ml-1" />
                إغلاق كل الميزات (مجاني فقط)
              </button>
            </div>

            {/* حقول التجربة اليدوية */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-foreground/60">مدة التجربة (أيام)</Label>
                <Input
                  type="number"
                  min="0"
                  value={form.trialDays}
                  onChange={(e) => updateField("trialDays", e.target.value)}
                  className="mt-1.5 rounded-lg border-border focus:ring-ring focus:border-ring"
                  dir="ltr"
                  placeholder="اتركه فارغاً = بلا حدود"
                />
              </div>
              <div>
                <Label className="text-foreground/60">تاريخ البداية</Label>
                <Input
                  type="date"
                  value={form.trialStartsAt}
                  onChange={(e) => updateField("trialStartsAt", e.target.value)}
                  className="mt-1.5 rounded-lg border-border focus:ring-ring focus:border-ring"
                  dir="ltr"
                />
                <p className="text-xs text-muted-foreground/70 mt-1.5">
                  {form.trialStartsAt ? "" : "سيُحدد تلقائياً عند الحفظ"}
                </p>
              </div>
            </div>
            {form.trialDays && trialStatus.type === "trial" && (
              <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/40 rounded-lg p-4 text-xs text-amber-700 dark:text-amber-400">
                ⏰ متبقي <strong>{trialStatus.daysLeft} يوم</strong> على انتهاء فترة التجربة
              </div>
            )}
            {trialStatus.type === "expired" && (
              <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-800/40 rounded-lg p-4 text-xs text-rose-700 dark:text-rose-400">
                ⛔ انتهت فترة التجربة — المتجر لا يستطيع استخدام الميزات المدفوعة
              </div>
            )}
          </div>

          <Separator className="bg-muted" />

          {/* الخطة */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold flex items-center gap-2 text-foreground/80 border-r-2 border-primary pr-3">
              <CreditCard className="h-4 w-4 text-primary" /> الخطة
            </h4>
            <div>
              <Label className="text-foreground/60">نوع الخطة</Label>
              <Select value={plan} onValueChange={(v) => {
                setPlan(v);
                if (v === "paid") {
                  const all: ShopFeatures = {};
                  FEATURES.forEach((f) => { all[f.key] = true; });
                  setFeatures(all);
                }
              }}>
                <SelectTrigger className="mt-1.5 rounded-lg border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">مجاني</SelectItem>
                  <SelectItem value="paid">مدفوع</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {isPaidPlan && (
              <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 text-xs text-primary/80">
                ✅ الخطة المدفوعة: جميع الميزات مفعّلة تلقائياً. يمكنك تعطيل ميزة معينة يدوياً إذا أردت.
              </div>
            )}
            <div>
              <Label className="text-foreground/60">معلومات الدفع</Label>
              <Textarea
                value={paymentInfo}
                onChange={(e) => setPaymentInfo(e.target.value)}
                className="mt-1.5 text-xs rounded-lg border-border focus:ring-ring focus:border-ring"
                rows={3}
                placeholder="طريقة الدفع، المبلغ، التاريخ..."
              />
            </div>
            <div>
              <Label className="text-foreground/60">ملاحظات المالك</Label>
              <Textarea
                value={ownerNotes}
                onChange={(e) => setOwnerNotes(e.target.value)}
                className="mt-1.5 text-xs rounded-lg border-border focus:ring-ring focus:border-ring"
                rows={3}
                placeholder="ملاحظات خاصة عن هذا المتجر..."
              />
            </div>
          </div>

          <Separator className="bg-muted" />

          {/* إدارة الميزات */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold flex items-center gap-2 text-foreground/80 border-r-2 border-primary pr-3">
                <ToggleLeft className="h-4 w-4 text-primary" /> إدارة الميزات
              </h4>
              <Badge variant="outline" className="text-xs rounded-lg border-border text-muted-foreground">
                {enabledCount}/{TOTAL_FEATURES} مفعّلة
              </Badge>
            </div>

            {isPaidPlan && (
              <div className="text-xs text-primary/80 bg-primary/10 border border-primary/20 rounded-lg p-3">
                ✨ الخطة المدفوعة — جميع الميزات مفعّلة افتراضياً. يمكنك تعطيل ميزة معينة يدوياً.
              </div>
            )}
            {!isPaidPlan && (
              <div className="text-xs text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/40 rounded-lg p-3">
                ✅ الميزات المجانية (7) مفتوحة تلقائياً لكل متجر. يمكنك تفعيل ميزات مدفوعة يدوياً.
              </div>
            )}

            {(() => {
              const freeFeatures = FEATURES.filter((f) => f.isFree);
              const paidFeatures = FEATURES.filter((f) => !f.isFree);

              return (
                <>
                  {/* ===== الميزات المجانية — دائماً مفعّلة ===== */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-1.5 h-5 rounded-full bg-emerald-400" />
                      <span className="text-xs font-bold text-emerald-700">مجانية — دائماً مفعّلة ({freeFeatures.length})</span>
                    </div>
                    <div className="space-y-1 max-h-64 overflow-y-auto rounded-lg border border-emerald-100 bg-emerald-50/30 p-2.5">
                      {freeFeatures.map((f) => (
                        <div key={f.key} className="flex items-start gap-3 py-1 px-2 rounded-lg">
                          <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center shrink-0 mt-0.5">
                            <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-medium text-foreground/80 flex items-center gap-2">
                              {f.label}
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-600 font-medium">مجاني</span>
                            </div>
                            <div className="text-[11px] text-muted-foreground/70 leading-relaxed">{f.description}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* ===== الميزات المدفوعة — قابلة للتبديل ===== */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-5 rounded-full bg-primary" />
                        <span className="text-xs font-bold text-primary/80">مدفوعة ({paidFeatures.length})</span>
                        <span className="text-[10px] text-primary/60">— قابلة للتبديل</span>
                      </div>
                      <div className="flex gap-1">
                        <button type="button" className="text-[11px] h-6 px-2 text-primary hover:text-primary/80 hover:bg-primary/10 rounded-md transition-colors" onClick={() => enableAllForGroup(paidFeatures)}>
                          تفعيل الكل
                        </button>
                        <button type="button" className="text-[11px] h-6 px-2 text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-md transition-colors" onClick={() => disableAllForGroup(paidFeatures)}>
                          تعطيل الكل
                        </button>
                      </div>
                    </div>
                    <div className="space-y-0.5 max-h-72 overflow-y-auto rounded-lg border border-border bg-primary/10 p-2.5">
                      {paidFeatures.map((f) => (
                        <label key={f.key} className="flex items-start gap-3 cursor-pointer py-1 px-2 rounded-lg hover:bg-accent/50 transition-colors">
                          <Checkbox
                            checked={features[f.key] === true}
                            onCheckedChange={() => toggleFeature(f.key)}
                            className="mt-0.5 data-[state=checked]:bg-primary/100 data-[state=checked]:border-primary"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-medium text-foreground/80 flex items-center gap-2">
                              {f.label}
                              <span className={cn(
                                "text-[10px] px-1.5 py-0.5 rounded font-medium",
                                features[f.key]
                                  ? "bg-primary/15 text-primary"
                                  : "bg-muted text-muted-foreground/70"
                              )}>
                                {features[f.key] ? "مفعّل" : "مدفوع"}
                              </span>
                            </div>
                            <div className="text-[11px] text-muted-foreground/70 leading-relaxed">{f.description}</div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                </>
              );
            })()}
          </div>

          {/* أزرار الحفظ */}
          <div className="flex gap-3 pt-3">
            <button type="submit" className="flex-1 bg-primary/100 hover:bg-primary/90 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors" disabled={saving}>
              {saving ? "جارٍ الحفظ..." : "حفظ التعديلات"}
            </button>
            <button type="button" onClick={onClose} className="border border-border text-foreground/80 hover:bg-accent rounded-lg px-4 py-2 text-sm font-medium transition-colors">
              إلغاء
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}