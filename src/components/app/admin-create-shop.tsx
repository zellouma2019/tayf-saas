"use client";

import { useState } from "react";
import {
  Plus, ExternalLink, Lock, Link2, CheckCircle2,
  Store, Sparkles, Clock, CreditCard, MessageSquare, FileUp,
  Repeat, Star, Calculator, Receipt, Layers, Palette,
  LayoutDashboard, BarChart3, Users, Wallet, Settings, Kanban,
  FileText, Trash2, Download, SlidersHorizontal, Info, ChevronDown, ChevronUp,
  Globe, Phone, Mail, MapPin, User, Shield, Zap, Image,
  Bell, Printer, Scissors, BookOpen, BadgePercent, Headphones,
  Languages, Banknote, Truck, Clock4, Timer, AlertTriangle,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import {
  Dialog, DialogContent, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ARAB_COUNTRIES } from "@/lib/countries";
import { getNextThemeId } from "@/lib/themes";
import { robustCopy, openInNewTab } from "@/lib/admin-utils";
import { CopyButton } from "@/components/app/admin-shop-card";

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
  { key: "deliveryTracking", label: "تتبيع التوصيل", icon: Truck, desc: "تتبع حالة توصيل الطلب" },
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

const LOGO_ICONS = [
  { value: "Printer", label: "طابعة", emoji: "🖨️" },
  { value: "BookOpen", label: "كتاب", emoji: "📖" },
  { value: "Scissors", label: "مقص", emoji: "✂️" },
  { value: "Palette", label: "لوحة", emoji: "🎨" },
  { value: "Image", label: "صورة", emoji: "🖼️" },
  { value: "FileText", label: "مستند", emoji: "📄" },
  { value: "Store", label: "متجر", emoji: "🏪" },
  { value: "PenTool", label: "قلم", emoji: "🖊️" },
];

const LANGUAGES = [
  { value: "ar", label: "العربية", dir: "rtl" },
  { value: "fr", label: "الفرنسية", dir: "ltr" },
  { value: "en", label: "الإنجليزية", dir: "ltr" },
  { value: "tr", label: "التركية", dir: "ltr" },
  { value: "es", label: "الإسبانية", dir: "ltr" },
];

export function CreateShopDialog({ open, onClose, onCreated }: {
  open: boolean; onClose: () => void; onCreated: () => void;
}) {
  const [step, setStep] = useState(1);
  const totalSteps = 4;

  // Step 1: Basic info
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [adminPin, setAdminPin] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [ownerPhone, setOwnerPhone] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [country, setCountry] = useState("DZ");
  const [language, setLanguage] = useState("ar");
  const [customCurrency, setCustomCurrency] = useState("");

  // Step 2: Plan & Features
  const [plan, setPlan] = useState("free");
  const [trialDays, setTrialDays] = useState("");
  const [features, setFeatures] = useState<Record<string, boolean>>({});
  const [expandedFeatureSection, setExpandedFeatureSection] = useState<string | null>("customer");

  // Step 3: Appearance & Branding
  const [themeId, setThemeId] = useState(getNextThemeId());
  const [primaryColor, setPrimaryColor] = useState("");
  const [logoIcon, setLogoIcon] = useState("Printer");

  // Step 4: Merchant Admin Settings
  const [merchantFeatures, setMerchantFeatures] = useState<Record<string, boolean>>({
    tabOrders: true, tabAnalytics: true, tabCustomers: true,
    tabExpenses: true, tabSettings: true, tabKanban: true, tabTemplates: true,
    canDeleteOrders: true, canExportData: true, canEditServices: true,
    canChangePin: false, canManageTeam: false, canViewReports: true,
  });

  const [submitting, setSubmitting] = useState(false);
  const [createdSlug, setCreatedSlug] = useState("");
  const [createdPin, setCreatedPin] = useState("");
  const [createdName, setCreatedName] = useState("");

  const showSuccess = !!createdSlug;

  function handleNameChange(value: string) {
    setName(value);
    if (!slug || slug === generateSlug(name)) {
      setSlug(generateSlug(value));
    }
  }

  function generateSlug(text: string): string {
    return text
      .toLowerCase()
      .replace(/[\u0600-\u06FF]/g, (m) => {
        const map: Record<string, string> = {
          "ا": "a", "ب": "b", "ت": "t", "ث": "th", "ج": "j", "ح": "h", "خ": "kh",
          "د": "d", "ذ": "dh", "ر": "r", "ز": "z", "س": "s", "ش": "sh", "ص": "s",
          "ض": "dh", "ط": "t", "ظ": "dh", "ع": "a", "غ": "gh", "ف": "f", "ق": "k",
          "ك": "k", "ل": "l", "م": "m", "ن": "n", "ه": "h", "و": "w", "ي": "y",
        };
        return map[m] || "";
      })
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }

  function handleClose() {
    setCreatedSlug(""); setCreatedPin(""); setCreatedName("");
    setName(""); setSlug(""); setAdminPin(""); setOwnerName(""); setOwnerPhone("");
    setPhone(""); setWhatsapp(""); setEmail(""); setAddress("");
    setCountry("DZ"); setLanguage("ar"); setCustomCurrency("");
    setPlan("free"); setTrialDays(""); setFeatures({});
    setThemeId(getNextThemeId()); setPrimaryColor(""); setLogoIcon("Printer");
    setMerchantFeatures({
      tabOrders: true, tabAnalytics: true, tabCustomers: true,
      tabExpenses: true, tabSettings: true, tabKanban: true, tabTemplates: true,
      canDeleteOrders: true, canExportData: true, canEditServices: true,
      canChangePin: false, canManageTeam: false, canViewReports: true,
    });
    setStep(1);
    setExpandedFeatureSection("customer");
    onClose();
  }

  function toggleFeature(key: string) {
    setFeatures(prev => ({ ...prev, [key]: !prev[key] }));
  }

  function toggleMerchantFeature(key: string) {
    setMerchantFeatures(prev => ({ ...prev, [key]: !prev[key] }));
  }

  function selectAllFeatures() {
    const all: Record<string, boolean> = {};
    SHOP_FEATURES.forEach(f => { all[f.key] = true; });
    setFeatures(all);
  }

  function deselectAllFeatures() {
    setFeatures({});
  }

  async function handleSubmit() {
    if (!name || !slug || !adminPin) return;
    setSubmitting(true);
    try {
      const allFeatures = { ...features, ...merchantFeatures };
      const payload: Record<string, unknown> = {
        name, slug, adminPin, ownerName: ownerName || undefined,
        ownerPhone: ownerPhone || undefined, phone: phone || undefined,
        whatsapp: whatsapp || undefined, email: email || undefined,
        address: address || undefined, trialDays: trialDays ? Number(trialDays) : undefined,
        country, language, themeId,
        features: allFeatures,
        logoIcon, primaryColor: primaryColor || undefined,
        customCurrency: customCurrency || undefined,
        plan,
      };

      const res = await fetch("/api/shops", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "فشل الإنشاء");
      }
      setCreatedSlug(slug);
      setCreatedPin(adminPin);
      setCreatedName(name);
      onCreated();
    } catch (err) {
      toast.error("فشل إنشاء المتجر", { description: (err as Error).message });
    } finally {
      setSubmitting(false);
    }
  }

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const customerLink = `${baseUrl}/s/${createdSlug}`;
  const adminLink = `${customerLink}?admin=1`;

  async function copyText(text: string, label: string) {
    await robustCopy(text, `تم نسخ ${label}`, "");
  }

  const featureSections = [
    { key: "customer", label: "ميزات الزبائن", items: SHOP_FEATURES.slice(0, 10) },
    { key: "advanced", label: "ميزات متقدمة", items: SHOP_FEATURES.slice(10) },
  ];

  const enabledCount = Object.values(features).filter(Boolean).length;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-hidden flex flex-col p-0 rounded-2xl shadow-2xl" dir="rtl" aria-describedby={undefined}>
        <VisuallyHidden><DialogTitle>إنشاء متجر جديد</DialogTitle></VisuallyHidden>

        {showSuccess ? (
          /* ===== شاشة النجاح ===== */
          <div className="p-6 space-y-5 overflow-y-auto">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-500 flex items-center justify-center mb-3 shadow-lg">
                <CheckCircle2 className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-lg font-bold">تم إنشاء المتجر بنجاح!</h2>
              <p className="text-sm text-muted-foreground mt-1">{createdName}</p>
              <div className="flex justify-center gap-2 mt-3">
                <Badge variant="outline">{plan === "paid" ? "💼 مدفوعة" : "🆓 مجانية"}</Badge>
                {trialDays && <Badge variant="outline" className="text-amber-600 border-amber-300">⏰ تجربة {trialDays} يوم</Badge>}
                <Badge variant="outline">{enabledCount} ميزة مفعّلة</Badge>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-bold">
                  <div className="w-6 h-6 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center">
                    <Link2 className="h-3.5 w-3.5 text-emerald-500" />
                  </div>
                  رابط الزبائن
                </div>
                <div className="flex gap-2">
                  <Input value={customerLink} readOnly className="flex-1 bg-muted text-xs" dir="ltr" onClick={(e) => (e.target as HTMLInputElement).select()} />
                  <CopyButton text={customerLink} label="نسخ" className="px-2 py-2" />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-bold">
                  <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Lock className="h-3.5 w-3.5 text-primary" />
                  </div>
                  رابط الإدارة + كلمة المرور
                </div>
                <div className="flex gap-2">
                  <Input value={adminLink} readOnly className="flex-1 bg-muted text-xs" dir="ltr" onClick={(e) => (e.target as HTMLInputElement).select()} />
                  <CopyButton text={adminLink} label="نسخ" className="px-2 py-2" />
                </div>
                <div className="bg-primary/5 border border-primary/10 rounded-xl p-4">
                  <div className="text-xs font-bold text-primary mb-2">كلمة مرور الإدارة:</div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xl font-mono font-bold tracking-widest" dir="ltr">{createdPin}</span>
                    <CopyButton text={createdPin} label="نسخ" className="border-primary/20 text-primary hover:bg-primary/10" />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-muted rounded-xl p-4 space-y-2 border border-border">
              <h4 className="font-bold text-sm">📌 ماذا تفعل الآن؟</h4>
              <ol className="text-xs text-muted-foreground space-y-1.5 list-decimal list-inside">
                <li>أرسل <strong className="text-foreground/60">رابط الزبائن</strong> للعميل</li>
                <li>أرسل <strong className="text-foreground/60">رابط الإدارة + كلمة المرور</strong> للعميل</li>
                <li>العميل يفتح رابط الإدارة ويدخل كلمة المرور</li>
                <li>من هناك يستطيع تعديل متجره ومتابعة طلبات زبائنه</li>
              </ol>
            </div>

            <div className="flex gap-3">
              <button onClick={handleClose} className="flex-1 bg-foreground hover:bg-foreground/80 text-white rounded-xl px-4 py-2.5 text-sm font-medium transition-colors">
                تم، أغلق
              </button>
              <button onClick={() => openInNewTab(adminLink)} className="border border-border hover:bg-accent rounded-xl px-4 py-2.5 text-sm font-medium transition-colors inline-flex items-center gap-1.5">
                <ExternalLink className="h-4 w-4" /> فتح الإدارة
              </button>
            </div>
          </div>
        ) : (
          /* ===== نموذج الإنشاء متعدد الخطوات ===== */
          <div className="flex flex-col flex-1 overflow-hidden">
            {/* Header with stepper */}
            <div className="px-6 pt-5 pb-4 border-b border-border/50 shrink-0">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg">
                  <Plus className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="font-bold text-lg">إنشاء متجر جديد</h2>
                  <p className="text-xs text-muted-foreground">الخطوة {step} من {totalSteps}</p>
                </div>
              </div>
              {/* Stepper */}
              <div className="flex gap-1">
                {[1,2,3,4].map((s) => (
                  <div key={s} className="flex-1 flex flex-col items-center gap-1">
                    <div className={`h-1.5 rounded-full transition-all w-full ${s <= step ? "bg-amber-500" : "bg-muted"}`} />
                    <span className={`text-[10px] ${s === step ? "text-amber-600 font-bold" : "text-muted-foreground"}`}>
                      {s === 1 ? "المعلومات" : s === 2 ? "الميزات" : s === 3 ? "المظهر" : "الإدارة"}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {/* ===== STEP 1: Basic Info ===== */}
              {step === 1 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <Label className="text-sm font-medium">اسم المتجر <span className="text-rose-500">*</span></Label>
                      <Input value={name} onChange={(e) => handleNameChange(e.target.value)} placeholder="مثال: مطبعة النور" className="mt-1.5" required />
                    </div>
                    <div className="sm:col-span-2">
                      <Label className="text-sm font-medium">المعرّف (الرابط) <span className="text-rose-500">*</span></Label>
                      <div className="flex items-center gap-0 mt-1.5">
                        <span className="text-xs text-muted-foreground bg-muted px-3 py-2.5 rounded-r-lg border border-l-0 border-border whitespace-nowrap font-mono">/s/</span>
                        <Input value={slug} onChange={(e) => setSlug(e.target.value.replace(/[^a-z0-9-]/g, ""))} placeholder="matbaa-alnoor" className="rounded-l-lg rounded-r-none" dir="ltr" required />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{baseUrl}/s/{slug || "..."}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">كلمة مرور الإدارة <span className="text-rose-500">*</span></Label>
                      <Input type="text" value={adminPin} onChange={(e) => setAdminPin(e.target.value)} placeholder="4 أرقام على الأقل" className="mt-1.5" required dir="ltr" />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">الدولة والعملة</Label>
                      <Select value={country} onValueChange={setCountry}>
                        <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                        <SelectContent className="max-h-60">
                          {ARAB_COUNTRIES.map((c) => (
                            <SelectItem key={c.code} value={c.code}>{c.flag} {c.nameAr} — {c.currencySymbol}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="text-sm font-semibold flex items-center gap-2 mb-3"><User className="h-4 w-4" /> بيانات صاحب المتجر</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs text-muted-foreground">اسم العميل</Label>
                        <Input value={ownerName} onChange={(e) => setOwnerName(e.target.value)} placeholder="الاسم الكامل" className="mt-1" />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">هاتف العميل</Label>
                        <Input value={ownerPhone} onChange={(e) => setOwnerPhone(e.target.value)} placeholder="0XXX XXX XXX" className="mt-1" dir="ltr" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold flex items-center gap-2 mb-3"><Store className="h-4 w-4" /> بيانات التواصل</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs text-muted-foreground">هاتف المتجر</Label>
                        <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="رقم الهاتف" className="mt-1" dir="ltr" />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">واتساب</Label>
                        <Input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="رقم الواتساب" className="mt-1" dir="ltr" />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">البريد الإلكتروني</Label>
                        <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@example.com" className="mt-1" dir="ltr" />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">اللغة</Label>
                        <Select value={language} onValueChange={setLanguage}>
                          <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {LANGUAGES.map((l) => (
                              <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="sm:col-span-2">
                        <Label className="text-xs text-muted-foreground">العنوان</Label>
                        <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="عنوان المتجر" className="mt-1" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ===== STEP 2: Plan & Features ===== */}
              {step === 2 && (
                <div className="space-y-6">
                  {/* Plan */}
                  <div>
                    <Label className="text-sm font-semibold">نوع الخطة</Label>
                    <div className="grid grid-cols-2 gap-3 mt-2">
                      {[
                        { value: "free", label: "مجانية", desc: "ميزات أساسية محدودة", icon: "🆓", color: "border-neutral-300 dark:border-neutral-600" },
                        { value: "paid", label: "مدفوعة", desc: "جميع الميزات متاحة", icon: "💼", color: "border-amber-400" },
                      ].map((p) => (
                        <button
                          key={p.value}
                          type="button"
                          onClick={() => setPlan(p.value)}
                          className={`p-4 rounded-xl border-2 text-right transition-all ${
                            plan === p.value ? p.color + " bg-amber-50/50 dark:bg-amber-500/5 shadow-md" : "border-border/50 hover:border-border"
                          }`}
                        >
                          <div className="text-2xl mb-1">{p.icon}</div>
                          <div className="font-bold text-sm">{p.label}</div>
                          <div className="text-xs text-muted-foreground mt-1">{p.desc}</div>
                          {plan === p.value && <CheckCircle2 className="h-4 w-4 text-amber-500 mt-2" />}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Trial */}
                  <div>
                    <Label className="text-sm font-semibold">فترة التجربة</Label>
                    <p className="text-xs text-muted-foreground mt-1">اتركه فارغاً لبلا حدود</p>
                    <div className="flex gap-3 mt-2">
                      <div className="flex-1">
                        <Input type="number" min="0" max="365" value={trialDays} onChange={(e) => setTrialDays(e.target.value)} placeholder="عدد الأيام" dir="ltr" />
                      </div>
                      <div className="flex gap-1.5">
                        {["7", "14", "30", "90"].map((d) => (
                          <button key={d} type="button" onClick={() => setTrialDays(d)} className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all ${trialDays === d ? "bg-amber-500/10 text-amber-600 border-amber-300 dark:border-amber-500/30" : "border-border hover:border-border text-muted-foreground"}`}>
                            {d}d
                          </button>
                        ))}
                      </div>
                    </div>
                    {trialDays && (
                      <p className="text-xs text-amber-600 mt-2 flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> ستبدأ التجربة تلقائياً من الآن</p>
                    )}
                  </div>

                  <Separator />

                  {/* Features */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Label className="text-sm font-semibold">ميزات المتجر</Label>
                        <Badge variant="outline" className="text-[10px]">{enabledCount}/{SHOP_FEATURES.length}</Badge>
                      </div>
                      <div className="flex gap-1.5">
                        <button type="button" onClick={selectAllFeatures} className="text-[10px] text-amber-600 hover:underline">تحديد الكل</button>
                        <span className="text-muted-foreground">|</span>
                        <button type="button" onClick={deselectAllFeatures} className="text-[10px] text-muted-foreground hover:underline">إلغاء الكل</button>
                      </div>
                    </div>

                    {featureSections.map((section) => (
                      <div key={section.key} className="mb-3">
                        <button
                          type="button"
                          onClick={() => setExpandedFeatureSection(expandedFeatureSection === section.key ? null : section.key)}
                          className="flex items-center gap-2 text-sm font-medium w-full text-right py-2"
                        >
                          {expandedFeatureSection === section.key ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          {section.label}
                          <Badge variant="secondary" className="text-[10px]">
                            {section.items.filter(f => features[f.key]).length}/{section.items.length}
                          </Badge>
                        </button>
                        {expandedFeatureSection === section.key && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {section.items.map((f) => {
                              const enabled = !!features[f.key];
                              return (
                                <div
                                  key={f.key}
                                  className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                                    enabled ? "border-amber-300/50 bg-amber-50/50 dark:border-amber-500/20 dark:bg-amber-500/5" : "border-border/50 hover:border-border"
                                  }`}
                                  onClick={() => toggleFeature(f.key)}
                                >
                                  <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${enabled ? "bg-amber-100 dark:bg-amber-500/15" : "bg-muted/80"}`}>
                                      <f.icon className={`h-4 w-4 ${enabled ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"}`} />
                                    </div>
                                    <div>
                                      <div className="text-xs font-medium">{f.label}</div>
                                      <div className="text-[10px] text-muted-foreground">{f.desc}</div>
                                    </div>
                                  </div>
                                  <Switch checked={enabled} onCheckedChange={() => toggleFeature(f.key)} />
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ===== STEP 3: Appearance ===== */}
              {step === 3 && (
                <div className="space-y-6">
                  {/* Theme */}
                  <div>
                    <Label className="text-sm font-semibold">القالب اللوني</Label>
                    <div className="grid grid-cols-4 gap-2 mt-3">
                      {THEME_OPTIONS.map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setThemeId(t.id)}
                          className={`p-3 rounded-xl border-2 text-center transition-all ${
                            themeId === t.id ? "border-foreground shadow-md" : "border-border/50 hover:border-border"
                          }`}
                        >
                          <div className="w-8 h-8 rounded-full mx-auto mb-1.5" style={{ backgroundColor: t.color }} />
                          <div className="text-[10px] font-medium truncate">{t.name}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Custom color */}
                  <div>
                    <Label className="text-sm font-semibold">لون رئيسي مخصص</Label>
                    <p className="text-xs text-muted-foreground mt-1">اتركه فارغاً لاستخدام لون القالب</p>
                    <div className="flex items-center gap-3 mt-2">
                      <input type="color" value={primaryColor || "#D4AF37"} onChange={(e) => setPrimaryColor(e.target.value)} className="w-10 h-10 rounded-lg border border-border cursor-pointer" />
                      <Input value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} placeholder="#D4AF37" className="flex-1" dir="ltr" />
                    </div>
                  </div>

                  {/* Logo icon */}
                  <div>
                    <Label className="text-sm font-semibold">أيقونة الشعار</Label>
                    <p className="text-xs text-muted-foreground mt-1">تظهر في رأس المتجر والتبويب</p>
                    <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 mt-3">
                      {LOGO_ICONS.map((icon) => (
                        <button
                          key={icon.value}
                          type="button"
                          onClick={() => setLogoIcon(icon.value)}
                          className={`p-3 rounded-xl border-2 text-center transition-all ${
                            logoIcon === icon.value ? "border-foreground shadow-md bg-amber-50/50 dark:bg-amber-500/5" : "border-border/50 hover:border-border"
                          }`}
                        >
                          <div className="text-2xl mb-1">{icon.emoji}</div>
                          <div className="text-[9px] font-medium truncate">{icon.label}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Custom currency */}
                  <div>
                    <Label className="text-sm font-semibold">عملة مخصصة</Label>
                    <p className="text-xs text-muted-foreground mt-1">تجاوز عملة الدولة الافتراضية (مثلاً: USD, EUR)</p>
                    <Input value={customCurrency} onChange={(e) => setCustomCurrency(e.target.value)} placeholder="اتركه فارغاً لعملة الدولة" className="mt-2" dir="ltr" />
                  </div>
                </div>
              )}

              {/* ===== STEP 4: Merchant Admin ===== */}
              {step === 4 && (
                <div className="space-y-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Info className="h-4 w-4 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">تحكم في لوحة تحكم التاجر وصلاحياته</p>
                  </div>

                  {/* Admin tabs */}
                  <div>
                    <Label className="text-sm font-semibold">تبويبات لوحة التحكم</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
                      {MERCHANT_ADMIN_TABS.map((t) => {
                        const enabled = merchantFeatures[t.key] !== false;
                        return (
                          <div
                            key={t.key}
                            className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                              enabled ? "border-blue-200 dark:border-blue-500/20 bg-blue-50/50 dark:bg-blue-500/5" : "border-border/50 hover:border-border"
                            }`}
                            onClick={() => toggleMerchantFeature(t.key)}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${enabled ? "bg-blue-100 dark:bg-blue-500/15" : "bg-muted/80"}`}>
                                <t.icon className={`h-4 w-4 ${enabled ? "text-blue-600 dark:text-blue-400" : "text-muted-foreground"}`} />
                              </div>
                              <div>
                                <div className="text-xs font-medium">{t.label}</div>
                                <div className="text-[10px] text-muted-foreground">{t.desc}</div>
                              </div>
                            </div>
                            <Switch checked={enabled} onCheckedChange={() => toggleMerchantFeature(t.key)} />
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <Separator />

                  {/* Permissions */}
                  <div>
                    <Label className="text-sm font-semibold">صلاحيات التاجر</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
                      {MERCHANT_PERMISSIONS.map((p) => {
                        const enabled = merchantFeatures[p.key] !== false;
                        return (
                          <div
                            key={p.key}
                            className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                              enabled ? "border-emerald-200 dark:border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-500/5" : "border-border/50 hover:border-border"
                            }`}
                            onClick={() => toggleMerchantFeature(p.key)}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${enabled ? "bg-emerald-100 dark:bg-emerald-500/15" : "bg-muted/80"}`}>
                                <p.icon className={`h-4 w-4 ${enabled ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}`} />
                              </div>
                              <div>
                                <div className="text-xs font-medium">{p.label}</div>
                                <div className="text-[10px] text-muted-foreground">{p.desc}</div>
                              </div>
                            </div>
                            <Switch checked={enabled} onCheckedChange={() => toggleMerchantFeature(p.key)} />
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="bg-muted/50 rounded-xl p-4 border border-border/50">
                    <h4 className="text-sm font-semibold mb-2">📋 ملخص المتجر</h4>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>اسم: <strong>{name}</strong></div>
                      <div>الخطة: <strong>{plan === "paid" ? "مدفوعة" : "مجانية"}</strong></div>
                      <div>الدولة: <strong>{ARAB_COUNTRIES.find(c => c.code === country)?.nameAr || country}</strong></div>
                      <div>اللغة: <strong>{LANGUAGES.find(l => l.value === language)?.label || language}</strong></div>
                      <div>الميزات: <strong>{enabledCount} مفعّلة</strong></div>
                      <div>التجربة: <strong>{trialDays ? `${trialDays} يوم` : "بلا حدود"}</strong></div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Navigation */}
            <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-border/50 shrink-0">
              <div>
                {step > 1 && (
                  <button type="button" onClick={() => setStep(step - 1)} className="px-4 py-2 rounded-xl border border-border text-sm font-medium hover:bg-accent transition-colors">
                    السابق
                  </button>
                )}
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={handleClose} className="px-4 py-2 rounded-xl text-sm text-muted-foreground hover:text-foreground transition-colors">
                  إلغاء
                </button>
                {step < totalSteps ? (
                  <button type="button" onClick={() => setStep(step + 1)} className="px-6 py-2 rounded-xl bg-gradient-to-l from-amber-500 to-amber-600 text-white text-sm font-medium hover:opacity-90 transition-opacity">
                    التالي
                  </button>
                ) : (
                  <button type="button" onClick={handleSubmit} disabled={submitting || !name || !slug || !adminPin} className="px-6 py-2 rounded-xl bg-gradient-to-l from-amber-500 to-amber-600 text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                    {submitting ? "جارٍ الإنشاء..." : <><Plus className="h-4 w-4" /> إنشاء المتجر</>}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
