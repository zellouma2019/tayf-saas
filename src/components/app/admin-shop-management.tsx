"use client";

import { useEffect, useState } from "react";
import {
  Button
} from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Dialog, DialogContent, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Save, X, Store, Palette, Sparkles, Clock, CreditCard,
  MessageSquare, FileUp, Repeat, Star, Calculator, Receipt, Layers,
  LayoutDashboard, BarChart3, Users, Wallet, Settings, Kanban,
  FileText, Trash2, Download, SlidersHorizontal, RefreshCw,
  AlertTriangle, CheckCircle2, Info, Globe, Languages,
  Printer, BadgePercent, Headphones, Truck, Zap, Shield, MapPin, Bell,
} from "lucide-react";
import { toast } from "sonner";
import { ARAB_COUNTRIES } from "@/lib/countries";

// ===== Feature Definitions =====
const SHOP_FEATURES = [
  { key: "aiAssistant", label: "المساعد الذكي", icon: Sparkles, desc: "دردشة AI للإجابة عن أسئلة الزبائن" },
  { key: "whatsappNotifications", label: "إشعارات واتساب", icon: MessageSquare, desc: "إرسال إشعارات حالة الطلب" },
  { key: "fileUpload", label: "رفع الملفات", icon: FileUp, desc: "رفع ملفات الطباعة من الزبون" },
  { key: "orderTracking", label: "تتبّع الطلبات", icon: Clock, desc: "تتبّع حالة الطلب للزبون" },
  { key: "repeatOrders", label: "إعادة الطلب", icon: Repeat, desc: "إعادة طلب سابق بضغطة" },
  { key: "loyaltyProgram", label: "برنامج الولاء", icon: Star, desc: "نقاط ومكافآت للعملاء" },
  { key: "priceCalculator", label: "حاسبة الأسعار", icon: Calculator, desc: "حاسبة أسعار ظاهرة للزبون" },
  { key: "customerReviews", label: "تقييمات العملاء", icon: Star, desc: "السماح بتقييم الخدمة" },
  { key: "invoiceGeneration", label: "إنشاء فواتير", icon: Receipt, desc: "فواتير PDF للطلبات" },
  { key: "bulkOrders", label: "طلبات جماعية", icon: Layers, desc: "طلبات متعددة دفعة واحدة" },
  { key: "directPrint", label: "طباعة مباشرة", icon: Printer, desc: "طباعة الطلب مباشرة من لوحة التحكم" },
  { key: "autoReminder", label: "تذكير تلقائي", icon: Bell, desc: "تذكير الزبائن بالطلبات المنسية" },
  { key: "customBranding", label: "هوية بصرية", icon: Palette, desc: "تخصيص شعار وألوان المتجر" },
  { key: "multiBranch", label: "فروع متعددة", icon: MapPin, desc: "إدارة عدة فروع من حساب واحد" },
  { key: "couponSystem", label: "نظام الكوبونات", icon: BadgePercent, desc: "إنشاء أكواد خصم للزبائن" },
  { key: "deliveryTracking", label: "تتبّع التوصيل", icon: Truck, desc: "تتبع حالة توصيل الطلب" },
  { key: "customerSupport", label: "دعم الزبائن", icon: Headphones, desc: "نظام تذاكر دعم للزبائن" },
  { key: "smartPricing", label: "تسعير ذكي", icon: Zap, desc: "أسعار ديناميكية حسب الكمية" },
];

const MERCHANT_ADMIN_TABS = [
  { key: "tabOrders", label: "الطلبات", icon: FileText, desc: "عرض وإدارة الطلبات" },
  { key: "tabAnalytics", label: "التحليلات", icon: BarChart3, desc: "إحصائيات وتقارير" },
  { key: "tabCustomers", label: "العملاء", icon: Users, desc: "قائمة العملاء" },
  { key: "tabExpenses", label: "المصاريف", icon: Wallet, desc: "تتبع المصاريف" },
  { key: "tabSettings", label: "الإعدادات", icon: Settings, desc: "تعديل الخدمات والأسعار" },
  { key: "tabKanban", label: "كانبان", icon: Kanban, desc: "لوحة كانبان للطلبات" },
  { key: "tabTemplates", label: "النماذج", icon: Layers, desc: "قوالب النماذج الرسمية" },
];

const MERCHANT_PERMISSIONS = [
  { key: "canDeleteOrders", label: "حذف الطلبات", icon: Trash2, desc: "السماح بحذف الطلبات نهائياً" },
  { key: "canExportData", label: "تصدير البيانات", icon: Download, desc: "تصدير التقارير والطلبات" },
  { key: "canEditServices", label: "تعديل الخدمات", icon: SlidersHorizontal, desc: "تعديل أسعار وخيارات الخدمات" },
  { key: "canChangePin", label: "تغيير كلمة المرور", icon: Shield, desc: "السماح بتغيير PIN الإدارة" },
  { key: "canManageTeam", label: "إدارة الفريق", icon: Users, desc: "إضافة/حذف أعضاء الفريق" },
  { key: "canViewReports", label: "عرض التقارير", icon: BarChart3, desc: "الوصول لتقارير الأداء" },
];

const THEME_OPTIONS = [
  { id: 1, name: "ذهبي كلاسيكي", color: "#D4AF37" },
  { id: 2, name: "أزرق احترافي", color: "#3B82F6" },
  { id: 3, name: "أخضر طبيعي", color: "#10B981" },
  { id: 4, name: "بنفسجي ملكي", color: "#8B5CF6" },
  { id: 5, name: "وردي عصري", color: "#EC4899" },
  { id: 6, name: "برتقالي نشط", color: "#F97316" },
  { id: 7, name: "أحمر جريء", color: "#EF4444" },
  { id: 8, name: "رمادي أنيق", color: "#6B7280" },
];

interface ShopData {
  slug: string; name: string; phone: string | null;
  ownerName: string | null; ownerPhone: string | null;
  whatsapp: string | null; email: string | null; address: string | null;
  country: string | null; language: string | null; customCurrency: string | null;
  isActive: boolean; plan: string;
  primaryColor: string | null; adminPin: string;
  themeId: number | null;
  logoIcon: string | null;
  trialDays: number | null; trialStartsAt: string | null;
  features: Record<string, boolean>;
  ownerNotes: string | null;
  paymentInfo: string | null;
}

interface AdminShopManagementProps {
  open: boolean;
  onClose: () => void;
  shop: { slug: string; name: string } | null;
  onSaved: () => void;
}

export function AdminShopManagement({ open, onClose, shop, onSaved }: AdminShopManagementProps) {
  const [data, setData] = useState<ShopData | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState("basic");
  const [hasChanges, setHasChanges] = useState(false);
  const [originalData, setOriginalData] = useState<ShopData | null>(null);

  useEffect(() => {
    if (!open || !shop) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setTab("basic");
      try {
        const res = await fetch(`/api/admin/shops/${shop.slug}`);
        if (res.ok && !cancelled) {
          const d = await res.json();
          const s = d.shop;
          const parsed: ShopData = {
            slug: s.slug, name: s.name, phone: s.phone,
            ownerName: s.ownerName, ownerPhone: s.ownerPhone,
            whatsapp: s.whatsapp, email: s.email, address: s.address,
            country: s.country, language: s.language || "ar",
            customCurrency: s.customCurrency || null,
            isActive: s.isActive,
            plan: s.plan || "free", primaryColor: s.primaryColor,
            adminPin: s.adminPin, themeId: s.themeId || 1,
            logoIcon: s.logoIcon || "Printer",
            trialDays: s.trialDays, trialStartsAt: s.trialStartsAt,
            features: s.features ? (typeof s.features === "string" ? JSON.parse(s.features) : s.features) : {},
            ownerNotes: s.ownerNotes, paymentInfo: s.paymentInfo,
          };
          setData(parsed);
          setOriginalData(JSON.parse(JSON.stringify(parsed)));
          setHasChanges(false);
        } else if (!cancelled) {
          toast.error("فشل تحميل بيانات المتجر");
          onClose();
        }
      } catch { if (!cancelled) { toast.error("خطأ في الاتصال"); onClose(); } }
      finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [open, shop, onClose]);

  function setField<K extends keyof ShopData>(key: K, val: ShopData[K]) {
    setData((prev) => prev ? { ...prev, [key]: val } : prev);
    setHasChanges(true);
  }

  function toggleFeature(key: string) {
    setData((prev) => {
      if (!prev) return prev;
      return { ...prev, features: { ...prev.features, [key]: !prev.features[key] } };
    });
    setHasChanges(true);
  }

  async function handleSave() {
    if (!data) return;
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        name: data.name, phone: data.phone, whatsapp: data.whatsapp,
        email: data.email, address: data.address, country: data.country,
        language: data.language, customCurrency: data.customCurrency,
        ownerName: data.ownerName, ownerPhone: data.ownerPhone,
        adminPin: data.adminPin, isActive: data.isActive, plan: data.plan,
        primaryColor: data.primaryColor, themeId: data.themeId,
        logoIcon: data.logoIcon, trialDays: data.trialDays,
        features: data.features, ownerNotes: data.ownerNotes,
        paymentInfo: data.paymentInfo,
      };
      const res = await fetch(`/api/admin/shops/${data.slug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        toast.success("تم حفظ إعدادات المتجر");
        setOriginalData(JSON.parse(JSON.stringify(data)));
        setHasChanges(false);
        onSaved();
      } else {
        toast.error("فشل حفظ الإعدادات");
      }
    } catch { toast.error("خطأ في الاتصال"); }
    finally { setSaving(false); }
  }

  const tabs = [
    { key: "basic", label: "الأساسيات", icon: Store },
    { key: "plan", label: "الخطة والتجربة", icon: CreditCard },
    { key: "features", label: "ميزات المتجر", icon: Sparkles },
    { key: "merchant", label: "لوحة التحكم", icon: LayoutDashboard },
    { key: "appearance", label: "المظهر", icon: Palette },
    { key: "notes", label: "ملاحظات", icon: FileText },
  ];

  // Trial status
  const trialStatus = (() => {
    if (!data?.trialDays || !data?.trialStartsAt) return null;
    const start = new Date(data.trialStartsAt).getTime();
    const end = start + data.trialDays * 86400000;
    const now = Date.now();
    const remaining = Math.max(0, Math.ceil((end - now) / 86400000));
    const active = now < end;
    return { active, remaining, total: data.trialDays, start: data.trialStartsAt, end: new Date(end).toISOString() };
  })();

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v && hasChanges) { /* could warn */ } onClose(); }}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col p-0" dir="rtl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/50 shrink-0">
          <div>
            <DialogTitle className="text-lg font-bold">إدارة المتجر</DialogTitle>
            <DialogDescription className="text-xs mt-0.5">تحكم شامل بإعدادات وميزات المتجر</DialogDescription>
          </div>
          {hasChanges && (
            <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50 dark:bg-amber-500/10 dark:border-amber-500/30 dark:text-amber-400">
              تعديلات غير محفوظة
            </Badge>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-4 pt-3 pb-0 overflow-x-auto no-scrollbar shrink-0">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                tab === t.key
                  ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              <t.icon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <div className="space-y-4">
              {[1,2,3].map((i) => <div key={i} className="h-10 rounded-lg bg-muted animate-pulse" />)}
            </div>
          ) : !data ? null : (
            <>
              {/* ===== BASIC TAB ===== */}
              {tab === "basic" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <Label>اسم المتجر</Label>
                    <Input value={data.name} onChange={(e) => setField("name", e.target.value)} className="mt-1" />
                  </div>
                  <div>
                    <Label>المعرف (slug)</Label>
                    <Input value={data.slug} disabled className="mt-1 bg-muted/50" />
                    <p className="text-[10px] text-muted-foreground mt-1">لا يمكن تغييره بعد الإنشاء</p>
                  </div>
                  <div>
                    <Label>هاتف المتجر</Label>
                    <Input value={data.phone || ""} onChange={(e) => setField("phone", e.target.value || null)} className="mt-1" dir="ltr" />
                  </div>
                  <div>
                    <Label>واتساب</Label>
                    <Input value={data.whatsapp || ""} onChange={(e) => setField("whatsapp", e.target.value || null)} className="mt-1" dir="ltr" />
                  </div>
                  <div>
                    <Label>البريد الإلكتروني</Label>
                    <Input type="email" value={data.email || ""} onChange={(e) => setField("email", e.target.value || null)} className="mt-1" dir="ltr" />
                  </div>
                  <div className="sm:col-span-2">
                    <Label>العنوان</Label>
                    <Input value={data.address || ""} onChange={(e) => setField("address", e.target.value || null)} className="mt-1" />
                  </div>
                  <div>
                    <Label>الدولة</Label>
                    <Select value={data.country || "DZ"} onValueChange={(v) => setField("country", v)}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {ARAB_COUNTRIES.map((c) => <SelectItem key={c.code} value={c.code}>{c.name} ({c.code})</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>اللغة</Label>
                    <Select value={data.language || "ar"} onValueChange={(v) => setField("language", v)}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ar">العربية</SelectItem>
                        <SelectItem value="fr">الفرنسية</SelectItem>
                        <SelectItem value="en">الإنجليزية</SelectItem>
                        <SelectItem value="tr">التركية</SelectItem>
                        <SelectItem value="es">الإسبانية</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>عملة مخصصة</Label>
                    <Input value={data.customCurrency || ""} onChange={(e) => setField("customCurrency", e.target.value || null)} className="mt-1" dir="ltr" placeholder="USD, EUR... (اتركه فارغاً)" />
                    <p className="text-[10px] text-muted-foreground mt-1">تجاوز عملة الدولة الافتراضية</p>
                  </div>
                  <div>
                    <Label>اسم صاحب المتجر</Label>
                    <Input value={data.ownerName || ""} onChange={(e) => setField("ownerName", e.target.value || null)} className="mt-1" />
                  </div>
                  <div>
                    <Label>هاتف صاحب المتجر</Label>
                    <Input value={data.ownerPhone || ""} onChange={(e) => setField("ownerPhone", e.target.value || null)} className="mt-1" dir="ltr" />
                  </div>
                  <div>
                    <Label>رمز PIN الإدارة</Label>
                    <Input value={data.adminPin} onChange={(e) => setField("adminPin", e.target.value)} className="mt-1" dir="ltr" />
                  </div>
                  <div className="sm:col-span-2 flex items-center justify-between p-3 rounded-lg border border-border/50">
                    <div>
                      <div className="font-medium text-sm">حالة المتجر</div>
                      <div className="text-xs text-muted-foreground">تفعيل أو إيقاف المتجر</div>
                    </div>
                    <Switch checked={data.isActive} onCheckedChange={(v) => setField("isActive", v)} />
                  </div>
                </div>
              )}

              {/* ===== PLAN & TRIAL TAB ===== */}
              {tab === "plan" && (
                <div className="space-y-6">
                  {/* Plan selection */}
                  <div>
                    <Label className="text-sm font-semibold">الخطة الحالية</Label>
                    <div className="grid grid-cols-2 gap-3 mt-2">
                      {[{ value: "free", label: "مجانية", desc: "ميزات أساسية محدودة", color: "border-neutral-300 dark:border-neutral-600" },
                        { value: "paid", label: "مدفوعة", desc: "جميع الميزات متاحة", color: "border-amber-400" }
                      ].map((p) => (
                        <button
                          key={p.value}
                          type="button"
                          onClick={() => setField("plan", p.value)}
                          className={`p-4 rounded-xl border-2 text-right transition-all ${
                            data.plan === p.value ? p.color + " bg-amber-50/50 dark:bg-amber-500/5" : "border-border/50 hover:border-border"
                          }`}
                        >
                          <div className="font-bold text-sm">{p.label}</div>
                          <div className="text-xs text-muted-foreground mt-1">{p.desc}</div>
                          {data.plan === p.value && <CheckCircle2 className="h-4 w-4 text-amber-500 mt-2" />}
                        </button>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  {/* Trial period */}
                  <div>
                    <Label className="text-sm font-semibold">فترة التجربة</Label>
                    <p className="text-xs text-muted-foreground mt-1">تحديد مدة تجربة مجانية للتاجر. اتركه فارغاً لبلا حدود.</p>
                    <div className="grid grid-cols-2 gap-3 mt-3">
                      <div>
                        <Label className="text-xs">مدة التجربة (أيام)</Label>
                        <Input
                          type="number" min="0" max="365"
                          value={data.trialDays ?? ""}
                          onChange={(e) => setField("trialDays", e.target.value ? Number(e.target.value) : null)}
                          className="mt-1" dir="ltr" placeholder="مثلاً: 14"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">تاريخ البداية</Label>
                        <Input
                          type="date"
                          value={data.trialStartsAt ? new Date(data.trialStartsAt).toISOString().split("T")[0] : ""}
                          onChange={(e) => setField("trialStartsAt", e.target.value || null)}
                          className="mt-1" dir="ltr"
                        />
                      </div>
                    </div>

                    {/* Trial status card */}
                    {trialStatus && (
                      <div className={`mt-4 p-4 rounded-xl border ${
                        trialStatus.active
                          ? "bg-emerald-50 dark:bg-emerald-500/5 border-emerald-200 dark:border-emerald-500/20"
                          : "bg-rose-50 dark:bg-rose-500/5 border-rose-200 dark:border-rose-500/20"
                      }`}>
                        <div className="flex items-center gap-2 mb-2">
                          {trialStatus.active ? (
                            <><Clock className="h-4 w-4 text-emerald-600" /><span className="font-semibold text-sm text-emerald-700 dark:text-emerald-400">التجربة سارية</span></>
                          ) : (
                            <><AlertTriangle className="h-4 w-4 text-rose-600" /><span className="font-semibold text-sm text-rose-700 dark:text-rose-400">انتهت فترة التجربة</span></>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground space-y-1">
                          <div>المدة الكلية: {trialStatus.total} يوم</div>
                          {trialStatus.active ? (
                            <div>المتبقي: <span className="font-bold text-foreground">{trialStatus.remaining} يوم</span></div>
                          ) : (
                            <div>انتهت منذ {Math.abs(trialStatus.remaining)} يوم</div>
                          )}
                          <div>تاريخ البداية: {new Date(trialStatus.start).toLocaleDateString("ar-DZ")}</div>
                        </div>
                        {!trialStatus.active && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="mt-3 gap-1 text-xs"
                            onClick={() => {
                              setField("trialStartsAt", new Date().toISOString());
                            }}
                          >
                            <RefreshCw className="h-3 w-3" /> إعادة تفعيل التجربة
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ===== FEATURES TAB ===== */}
              {tab === "features" && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-4">
                    <Info className="h-4 w-4 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">تفعيل أو تعطيل ميزات المتجر التي تظهر للزبائن</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {SHOP_FEATURES.map((f) => {
                      const enabled = !!data.features[f.key];
                      return (
                        <div
                          key={f.key}
                          className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                            enabled
                              ? "border-amber-300/50 bg-amber-50/50 dark:border-amber-500/20 dark:bg-amber-500/5"
                              : "border-border/50 hover:border-border"
                          }`}
                          onClick={() => toggleFeature(f.key)}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                              enabled ? "bg-amber-100 dark:bg-amber-500/15" : "bg-muted/80"
                            }`}>
                              <f.icon className={`h-4 w-4 ${enabled ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"}`} />
                            </div>
                            <div>
                              <div className="text-sm font-medium">{f.label}</div>
                              <div className="text-[11px] text-muted-foreground">{f.desc}</div>
                            </div>
                          </div>
                          <Switch checked={enabled} onCheckedChange={() => toggleFeature(f.key)} />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ===== MERCHANT ADMIN TAB ===== */}
              {tab === "merchant" && (
                <div className="space-y-6">
                  {/* Admin tabs visibility */}
                  <div>
                    <Label className="text-sm font-semibold">تبويبات لوحة تحكم التاجر</Label>
                    <p className="text-xs text-muted-foreground mt-1">تحكم في التبويبات التي تظهر للتاجر في لوحة التحكم</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
                      {MERCHANT_ADMIN_TABS.map((t) => {
                        const enabled = data.features[t.key] !== false;
                        return (
                          <div
                            key={t.key}
                            className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                              enabled ? "border-blue-200 dark:border-blue-500/20 bg-blue-50/50 dark:bg-blue-500/5" : "border-border/50 hover:border-border"
                            }`}
                            onClick={() => toggleFeature(t.key)}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                enabled ? "bg-blue-100 dark:bg-blue-500/15" : "bg-muted/80"
                              }`}>
                                <t.icon className={`h-4 w-4 ${enabled ? "text-blue-600 dark:text-blue-400" : "text-muted-foreground"}`} />
                              </div>
                              <div>
                                <div className="text-sm font-medium">{t.label}</div>
                                <div className="text-[11px] text-muted-foreground">{t.desc}</div>
                              </div>
                            </div>
                            <Switch checked={enabled} onCheckedChange={() => toggleFeature(t.key)} />
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <Separator />

                  {/* Merchant permissions */}
                  <div>
                    <Label className="text-sm font-semibold">صلاحيات التاجر</Label>
                    <p className="text-xs text-muted-foreground mt-1">تحكم في الأفعال التي يمكن للتاجر القيام بها</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
                      {MERCHANT_PERMISSIONS.map((p) => {
                        const enabled = data.features[p.key] !== false;
                        return (
                          <div
                            key={p.key}
                            className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                              enabled ? "border-emerald-200 dark:border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-500/5" : "border-border/50 hover:border-border"
                            }`}
                            onClick={() => toggleFeature(p.key)}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                enabled ? "bg-emerald-100 dark:bg-emerald-500/15" : "bg-muted/80"
                              }`}>
                                <p.icon className={`h-4 w-4 ${enabled ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}`} />
                              </div>
                              <div>
                                <div className="text-sm font-medium">{p.label}</div>
                                <div className="text-[11px] text-muted-foreground">{p.desc}</div>
                              </div>
                            </div>
                            <Switch checked={enabled} onCheckedChange={() => toggleFeature(p.key)} />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* ===== APPEARANCE TAB ===== */}
              {tab === "appearance" && (
                <div className="space-y-6">
                  <div>
                    <Label className="text-sm font-semibold">القالب اللوني</Label>
                    <div className="grid grid-cols-4 gap-2 mt-3">
                      {THEME_OPTIONS.map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setField("themeId", t.id)}
                          className={`p-3 rounded-xl border-2 text-center transition-all ${
                            data.themeId === t.id ? "border-foreground shadow-md" : "border-border/50 hover:border-border"
                          }`}
                        >
                          <div className="w-8 h-8 rounded-full mx-auto mb-1.5" style={{ backgroundColor: t.color }} />
                          <div className="text-[10px] font-medium truncate">{t.name}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-semibold">لون رئيسي مخصص</Label>
                    <div className="flex items-center gap-3 mt-2">
                      <input
                        type="color"
                        value={data.primaryColor || "#D4AF37"}
                        onChange={(e) => setField("primaryColor", e.target.value)}
                        className="w-10 h-10 rounded-lg border border-border cursor-pointer"
                      />
                      <Input
                        value={data.primaryColor || ""}
                        onChange={(e) => setField("primaryColor", e.target.value || null)}
                        placeholder="#D4AF37"
                        className="flex-1" dir="ltr"
                      />
                      {data.primaryColor && (
                        <Button size="sm" variant="ghost" onClick={() => setField("primaryColor", null)}>
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <Label className="text-sm font-semibold">أيقونة الشعار</Label>
                    <p className="text-xs text-muted-foreground mt-1">تظهر في رأس المتجر والتبويب</p>
                    <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 mt-3">
                      {["Printer", "BookOpen", "Scissors", "Palette", "Image", "FileText", "Store", "PenTool"].map((icon) => (
                        <button
                          key={icon}
                          type="button"
                          onClick={() => setField("logoIcon", icon)}
                          className={`p-2.5 rounded-xl border-2 text-center transition-all ${
                            data.logoIcon === icon ? "border-foreground shadow-md bg-amber-50/50 dark:bg-amber-500/5" : "border-border/50 hover:border-border"
                          }`}
                        >
                          <div className="text-xl">{icon === "Printer" ? "🖨️" : icon === "BookOpen" ? "📖" : icon === "Scissors" ? "✂️" : icon === "Palette" ? "🎨" : icon === "Image" ? "🖼️" : icon === "FileText" ? "📄" : icon === "Store" ? "🏪" : "🖊️"}</div>
                          <div className="text-[9px] font-medium mt-1">{icon === "Printer" ? "طابعة" : icon === "BookOpen" ? "كتاب" : icon === "Scissors" ? "مقص" : icon === "Palette" ? "لوحة" : icon === "Image" ? "صورة" : icon === "FileText" ? "مستند" : icon === "Store" ? "متجر" : "قلم"}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ===== NOTES TAB ===== */}
              {tab === "notes" && (
                <div className="space-y-4">
                  <div>
                    <Label>ملاحظات المالك عن التاجر</Label>
                    <Textarea
                      value={data.ownerNotes || ""}
                      onChange={(e) => setField("ownerNotes", e.target.value || null)}
                      className="mt-1 min-h-[120px]"
                      placeholder="ملاحظات داخلية عن هذا التاجر..."
                    />
                  </div>
                  <div>
                    <Label>معلومات الدفع</Label>
                    <Textarea
                      value={data.paymentInfo || ""}
                      onChange={(e) => setField("paymentInfo", e.target.value || null)}
                      className="mt-1 min-h-[120px]"
                      placeholder="بيانات الدفع أو الاشتراك..."
                    />
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-border/50 shrink-0">
          <Button variant="outline" onClick={onClose}>إغلاق</Button>
          <Button
            onClick={handleSave}
            disabled={saving || !hasChanges}
            className="gap-2 bg-gradient-to-l from-amber-500 to-amber-600 text-white"
          >
            <Save className="h-4 w-4" />
            {saving ? "جاري الحفظ..." : "حفظ التغييرات"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
