"use client";

import { useState, useEffect, useRef } from "react";
import {
  Globe, Palette, Store, Bell, Shield, Save, Info, Settings,
  Zap, Megaphone, Upload, Image as ImageIcon, X, RefreshCw,
  Mail, Phone, MessageSquare, Monitor, FileText, Globe2, Trash2, Eye,
  Receipt, Code2,
} from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface PlatformSettings {
  platformName: string;
  platformTagline: string;
  platformLogo: string;
  platformLogoDark: string;
  platformFavicon: string;
  platformEmail: string;
  platformPhone: string;
  platformWhatsapp: string;
  platformDescription: string;
  maintenanceMode: boolean;
  maintenanceMessage: string;
  allowNewShops: boolean;
  maxShops: number;
  defaultCountry: string;
  defaultLanguage: string;
  defaultCurrency: string;
  defaultThemeId: number;
  defaultFeatures: Record<string, boolean>;
  defaultTrialDays: number;
  defaultWelcomeMessage: string;
  notifications: Record<string, boolean>;
  customCss: string;
  autoApproveShops: boolean;
  maxFileSize: number;
  allowCustomerDelete: boolean;
  orderPrefix: string;
  receiptFooter: string;
  whatsappApiUrl: string;
  enableRegistration: boolean;
  defaultCopiesMin: number;
  defaultCopiesMax: number;
  platformUrl: string;
  enableOffers: boolean;
  offerText: string;
  enableFileAnalysis: boolean;
}

const DEFAULT_SETTINGS: PlatformSettings = {
  platformName: "طيف",
  platformTagline: "منصة إدارة متاجر الطباعة",
  platformLogo: "/platform-logo.png",
  platformLogoDark: "",
  platformFavicon: "/favicon.png",
  platformEmail: "",
  platformPhone: "",
  platformWhatsapp: "",
  platformDescription: "",
  maintenanceMode: false,
  maintenanceMessage: "المنصة تحت الصيانة المؤقتة. سنعود قريباً.",
  allowNewShops: true,
  maxShops: 100,
  defaultCountry: "DZ",
  defaultLanguage: "ar",
  defaultCurrency: "DZD",
  defaultThemeId: 1,
  defaultFeatures: {
    whatsappNotifications: true,
    orderTracking: true,
    darkMode: true,
    repeatOrders: true,
    customerLogin: false,
    advancedAnalytics: false,
  },
  defaultTrialDays: 30,
  defaultWelcomeMessage: "مرحباً بك! اطلب خدمات الطباعة بسهولة.",
  notifications: {
    newOrderSound: true,
    orderStatusChange: true,
    dailySummary: false,
    lowBalanceAlert: false,
  },
  customCss: "",
  autoApproveShops: true,
  maxFileSize: 50,
  allowCustomerDelete: false,
  orderPrefix: "A",
  receiptFooter: "",
  whatsappApiUrl: "",
  enableRegistration: true,
  defaultCopiesMin: 1,
  defaultCopiesMax: 100,
  platformUrl: "",
  enableOffers: true,
  offerText: "",
  enableFileAnalysis: true,
};

const COUNTRIES = [
  { value: "DZ", label: "الجزائر 🇩🇿" },
  { value: "MA", label: "المغرب 🇲🇦" },
  { value: "TN", label: "تونس 🇹🇳" },
  { value: "SA", label: "السعودية 🇸🇦" },
  { value: "AE", label: "الإمارات 🇦🇪" },
  { value: "EG", label: "مصر 🇪🇬" },
  { value: "JO", label: "الأردن 🇯🇴" },
  { value: "IQ", label: "العراق 🇮🇶" },
  { value: "TR", label: "تركيا 🇹🇷" },
  { value: "FR", label: "فرنسا 🇫🇷" },
];

const LANGUAGES = [
  { value: "ar", label: "العربية" },
  { value: "fr", label: "الفرنسية" },
  { value: "en", label: "الإنجليزية" },
  { value: "tr", label: "التركية" },
];

const CURRENCIES = [
  { value: "DZD", label: "دينار جزائري (DZD)" },
  { value: "MAD", label: "درهم مغربي (MAD)" },
  { value: "TND", label: "دينار تونسي (TND)" },
  { value: "SAR", label: "ريال سعودي (SAR)" },
  { value: "AED", label: "درهم إماراتي (AED)" },
  { value: "EGP", label: "جنيه مصري (EGP)" },
  { value: "EUR", label: "يورو (EUR)" },
  { value: "USD", label: "دولار أمريكي (USD)" },
  { value: "TRY", label: "ليرة تركية (TRY)" },
  { value: "JOD", label: "دينار أردني (JOD)" },
  { value: "IQD", label: "دينار عراقي (IQD)" },
];

const THEME_OPTIONS = [
  { value: "1", label: "كلاسيكي ذهبي", color: "#d4a853" },
  { value: "2", label: "أخضر زمردي", color: "#059669" },
  { value: "3", label: "أزرق محترف", color: "#2563eb" },
  { value: "4", label: "بني دافئ", color: "#b45309" },
  { value: "5", label: "بنفسجي عصري", color: "#7c3aed" },
  { value: "6", label: "أحمر أنيق", color: "#dc2626" },
  { value: "7", label: "تيل هادئ", color: "#0d9488" },
  { value: "8", label: "برتقالي حيوي", color: "#ea580c" },
];

const FEATURE_OPTIONS = [
  { key: "whatsappNotifications", label: "إشعارات واتساب", desc: "إرسال إشعارات الطلبات عبر واتساب" },
  { key: "orderTracking", label: "تتبع الطلبات", desc: "السماح للعملاء بتتبع حالة طلباتهم" },
  { key: "darkMode", label: "الوضع الليلي", desc: "تفعيل مظهر داكن لصفحة المتجر" },
  { key: "repeatOrders", label: "تكرار الطلب", desc: "السماح للعملاء بإعادة طلب سابق بسرعة" },
  { key: "customerLogin", label: "تسجيل دخول العملاء", desc: "تفعيل نظام حسابات للعملاء" },
  { key: "advancedAnalytics", label: "تحليلات متقدمة", desc: "إحصائيات وتقارير تفصيلية للمتجر" },
];

const NOTIFICATION_OPTIONS = [
  { key: "newOrderSound", label: "صوت الطلب الجديد", desc: "تشغيل صوت عند ورود طلب جديد" },
  { key: "orderStatusChange", label: "تغيير حالة الطلب", desc: "إشعار عند تغيير حالة أي طلب" },
  { key: "dailySummary", label: "ملخص يومي", desc: "إرسال ملخص يومي للطلبات والإيرادات" },
];

/* ===== Reusable Components ===== */

function SettingSection({ title, description, icon: Icon, iconBg, children, className }: {
  title: string; description?: string;
  icon: React.ElementType; iconBg?: string;
  children: React.ReactNode; className?: string;
}) {
  return (
    <div className={cn("bg-card border border-border rounded-xl overflow-hidden", className)}>
      <div className="p-5 pb-3">
        <div className="flex items-center gap-2.5">
          <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", iconBg || "bg-primary/10")}>
            <Icon className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-foreground">{title}</h3>
            {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
          </div>
        </div>
      </div>
      <div className="px-5 pb-5 pt-1">{children}</div>
    </div>
  );
}

function Toggle({ checked, onChange, label, description }: {
  checked: boolean; onChange: (v: boolean) => void;
  label: string; description?: string;
}) {
  return (
    <label className="flex items-center justify-between gap-3 py-2.5 cursor-pointer group">
      <div className="min-w-0">
        <div className="text-sm font-medium text-foreground">{label}</div>
        {description && <div className="text-xs text-muted-foreground mt-0.5">{description}</div>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative w-11 h-6 rounded-full transition-colors shrink-0",
          checked ? "bg-primary" : "bg-input"
        )}
      >
        <span className={cn(
          "absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all",
          checked ? "left-0.5" : "left-[22px]"
        )} />
      </button>
    </label>
  );
}

/* ===== Logo Upload Component ===== */

function LogoUpload({ label, value, onChange, hint, uploadType }: {
  label: string; value: string; onChange: (url: string) => void; hint?: string; uploadType: "logo" | "logoDark" | "favicon";
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("type", uploadType);
      const res = await fetch("/api/super-admin/upload-logo", { method: "POST", body: fd });
      const data = await res.json();
      if (res.ok && data.url) {
        onChange(data.url);
        toast.success("تم رفع الشعار بنجاح");
      } else {
        toast.error(data.error || "فشل رفع الشعار");
      }
    } catch {
      toast.error("خطأ في الاتصال");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-2">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="flex items-center gap-3">
        <div className="w-16 h-16 rounded-xl border-2 border-dashed border-border flex items-center justify-center overflow-hidden bg-muted/30 shrink-0">
          {value ? (
            <img src={value} alt={label} className="w-full h-full object-contain p-1" />
          ) : (
            <ImageIcon className="h-6 w-6 text-muted-foreground/40" />
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 text-xs rounded-lg"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
              رفع صورة
            </Button>
            {value && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 text-xs rounded-lg text-destructive hover:text-destructive"
                onClick={() => onChange("")}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
          {hint && <p className="text-[10px] text-muted-foreground">{hint}</p>}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/svg+xml,image/webp"
          className="hidden"
          onChange={handleUpload}
        />
      </div>
    </div>
  );
}

/* ===== Main Component ===== */

export function PlatformSettingsTab() {
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [activeSection, setActiveSection] = useState("branding");

  useEffect(() => {
    fetch("/api/super-admin/platform-settings")
      .then((r) => r.json())
      .then((d) => {
        setSettings({ ...DEFAULT_SETTINGS, ...d.settings });
        setLoading(false);
      })
      .catch(() => {
        toast.error("خطأ في تحميل الإعدادات");
        setLoading(false);
      });
  }, []);

  function update(partial: Partial<PlatformSettings>) {
    setSettings((prev) => (prev ? { ...prev, ...partial } : prev));
    setDirty(true);
  }

  function updateFeature(key: string, value: boolean) {
    if (!settings) return;
    update({ defaultFeatures: { ...settings.defaultFeatures, [key]: value } });
  }

  function updateNotification(key: string, value: boolean) {
    if (!settings) return;
    update({ notifications: { ...settings.notifications, [key]: value } });
  }

  async function handleSave() {
    if (!settings) return;
    setSaving(true);
    try {
      const res = await fetch("/api/super-admin/platform-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        const data = await res.json();
        setSettings({ ...DEFAULT_SETTINGS, ...data.settings });
        setDirty(false);
        toast.success("تم حفظ إعدادات المنصة بنجاح");
        // إبلاغ الصفحة الرئيسية بتحديث الشعار
        window.dispatchEvent(new CustomEvent("platform-settings-updated", { detail: data.settings }));
      } else {
        toast.error("فشل حفظ الإعدادات");
      }
    } catch {
      toast.error("خطأ في الاتصال");
    } finally {
      setSaving(false);
    }
  }

  if (loading || !settings) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw className="h-6 w-6 text-primary animate-spin" />
      </div>
    );
  }

  const sections = [
    { key: "branding", label: "الهوية والشعار", icon: Globe },
    { key: "contact", label: "التواصل", icon: Phone },
    { key: "appearance", label: "المظهر", icon: Palette },
    { key: "defaults", label: "إعدادات المتاجر", icon: Store },
    { key: "features", label: "الميزات", icon: Zap },
    { key: "notifications", label: "الإشعارات", icon: Bell },
    { key: "orders", label: "الطلبات والفاتورة", icon: Receipt },
    { key: "integration", label: "التكامل والتقنية", icon: Code2 },
    { key: "maintenance", label: "الصيانة والوصول", icon: Shield },
    { key: "advanced", label: "متقدم", icon: Settings },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            إعدادات المنصة
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            التحكم الكامل في المنصة والمظهر والتحكم بالميزات
          </p>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving || !dirty}
          className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg h-10 px-5"
        >
          {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          <span className="mr-1.5">حفظ التغييرات</span>
        </Button>
      </div>

      {/* Maintenance Banner */}
      {settings.maintenanceMode && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center shrink-0">
            <Megaphone className="h-5 w-5 text-destructive" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-destructive">وضع الصيانة مفعّل</p>
            <p className="text-xs text-muted-foreground mt-0.5">{settings.maintenanceMessage}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => update({ maintenanceMode: false })}
            className="border-destructive/30 text-destructive hover:bg-destructive/10 shrink-0"
          >
            إيقاف
          </Button>
        </div>
      )}

      {/* Section Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1 -mx-1 px-1">
        {sections.map((s) => (
          <button
            key={s.key}
            onClick={() => setActiveSection(s.key)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors",
              activeSection === s.key
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            <s.icon className="h-3.5 w-3.5" />
            {s.label}
          </button>
        ))}
      </div>

      {/* ===== BRANDING SECTION ===== */}
      {activeSection === "branding" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <SettingSection title="شعار المنصة" description="الشعار الظاهر في لوحة التحكم والصفحات العامة" icon={Globe}>
            <div className="space-y-4">
              <LogoUpload
                label="الشعار (الوضع الفاتح)"
                value={settings.platformLogo}
                onChange={(url) => update({ platformLogo: url })}
                hint="PNG أو SVG، ينصح بمقاس 200×200 بكسل"
                uploadType="logo"
              />
              <LogoUpload
                label="الشعار (الوضع الداكن)"
                value={settings.platformLogoDark}
                onChange={(url) => update({ platformLogoDark: url })}
                hint="نسخة مخصصة للوضع الداكن (اختياري)"
                uploadType="logoDark"
              />
            </div>
          </SettingSection>

          <SettingSection title="اسم المنصة والوصف" description="الاسم والشعار النصي الظاهر للمنصة" icon={FileText} iconBg="bg-emerald-500/10">
            <div className="space-y-3">
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">اسم المنصة</Label>
                <Input
                  value={settings.platformName}
                  onChange={(e) => update({ platformName: e.target.value })}
                  className="h-10 text-sm rounded-lg"
                  placeholder="طيف"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">الشعار النصي (Tagline)</Label>
                <Input
                  value={settings.platformTagline}
                  onChange={(e) => update({ platformTagline: e.target.value })}
                  className="h-10 text-sm rounded-lg"
                  placeholder="منصة إدارة متاجر الطباعة"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">وصف المنصة (SEO)</Label>
                <Textarea
                  value={settings.platformDescription}
                  onChange={(e) => update({ platformDescription: e.target.value })}
                  className="text-sm rounded-lg min-h-[60px] resize-none"
                  placeholder="وصف مختصر يظهر في محركات البحث..."
                  rows={2}
                />
              </div>
            </div>
          </SettingSection>
        </div>
      )}

      {/* ===== CONTACT SECTION ===== */}
      {activeSection === "contact" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <SettingSection title="معلومات التواصل" description="بيانات الاتصال الظاهرة للتجار والعملاء" icon={Phone} iconBg="bg-emerald-500/10">
            <div className="space-y-3">
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">البريد الإلكتروني</Label>
                <Input
                  type="email"
                  value={settings.platformEmail}
                  onChange={(e) => update({ platformEmail: e.target.value })}
                  className="h-10 text-sm rounded-lg"
                  placeholder="support@tayf.app"
                  dir="ltr"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">رقم الهاتف</Label>
                <Input
                  type="tel"
                  value={settings.platformPhone}
                  onChange={(e) => update({ platformPhone: e.target.value })}
                  className="h-10 text-sm rounded-lg"
                  placeholder="+213 XXX XXX XXX"
                  dir="ltr"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">رقم واتساب</Label>
                <Input
                  type="tel"
                  value={settings.platformWhatsapp}
                  onChange={(e) => update({ platformWhatsapp: e.target.value })}
                  className="h-10 text-sm rounded-lg"
                  placeholder="+213 XXX XXX XXX"
                  dir="ltr"
                />
              </div>
            </div>
          </SettingSection>

          <SettingSection title="Favicon" description="أيقونة المتصفح الظاهرة في تبويب الموقع" icon={Monitor} iconBg="bg-violet-500/10">
            <LogoUpload
              label="Favicon"
              value={settings.platformFavicon}
              onChange={(url) => update({ platformFavicon: url })}
              hint="PNG أو ICO، مقاس 32×32 أو 64×64 بكسل"
              uploadType="favicon"
            />
          </SettingSection>
        </div>
      )}

      {/* ===== APPEARANCE SECTION ===== */}
      {activeSection === "appearance" && (
        <SettingSection title="القالب اللوني الافتراضي" description="القالب اللوني الذي يُطبّق على المتاجر الجديدة تلقائياً" icon={Palette} iconBg="bg-violet-500/10">
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
            {THEME_OPTIONS.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => update({ defaultThemeId: parseInt(t.value) })}
                className={cn(
                  "flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all",
                  settings.defaultThemeId === parseInt(t.value)
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/30"
                )}
              >
                <div className="w-8 h-8 rounded-lg" style={{ backgroundColor: t.color }} />
                <span className="text-[10px] font-medium text-foreground text-center leading-tight">{t.label}</span>
              </button>
            ))}
          </div>
        </SettingSection>
      )}

      {/* ===== DEFAULTS SECTION ===== */}
      {activeSection === "defaults" && (
        <SettingSection title="إعدادات المتجر الافتراضية" description="تُطبّق تلقائياً على كل متجر جديد يُنشأ" icon={Store} iconBg="bg-emerald-500/10">
          <div className="space-y-4 max-w-lg">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">الدولة</Label>
                <Select value={settings.defaultCountry} onValueChange={(v) => update({ defaultCountry: v })}>
                  <SelectTrigger className="h-10 text-sm rounded-lg"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {COUNTRIES.map((c) => (<SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">اللغة</Label>
                <Select value={settings.defaultLanguage} onValueChange={(v) => update({ defaultLanguage: v })}>
                  <SelectTrigger className="h-10 text-sm rounded-lg"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {LANGUAGES.map((l) => (<SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">العملة</Label>
                <Select value={settings.defaultCurrency} onValueChange={(v) => update({ defaultCurrency: v })}>
                  <SelectTrigger className="h-10 text-sm rounded-lg"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((c) => (<SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">مدة التجربة (أيام)</Label>
                <Input
                  type="number"
                  value={settings.defaultTrialDays}
                  onChange={(e) => update({ defaultTrialDays: parseInt(e.target.value) || 0 })}
                  className="h-10 text-sm rounded-lg"
                  min={0}
                />
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">رسالة الترحيب الافتراضية</Label>
              <Input
                value={settings.defaultWelcomeMessage}
                onChange={(e) => update({ defaultWelcomeMessage: e.target.value })}
                className="h-10 text-sm rounded-lg"
              />
            </div>
          </div>
        </SettingSection>
      )}

      {/* ===== FEATURES SECTION ===== */}
      {activeSection === "features" && (
        <div className="space-y-5">
          <SettingSection title="الميزات الافتراضية" description="الميزات المفعّلة تلقائياً في المتاجر الجديدة" icon={Zap} iconBg="bg-amber-500/10">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-0 divide-y divide-border sm:divide-y-0 sm:divide-x sm:divide-x-reverse">
              {FEATURE_OPTIONS.map((f) => (
                <div key={f.key} className="px-0 sm:px-4 first:sm:pr-0 last:sm:pl-0">
                  <Toggle
                    checked={!!settings.defaultFeatures[f.key]}
                    onChange={(v) => updateFeature(f.key, v)}
                    label={f.label}
                    description={f.desc}
                  />
                </div>
              ))}
            </div>
          </SettingSection>

          <SettingSection title="ميزات المنصة" description="التحكم في ميزات عامة على مستوى المنصة" icon={Globe2} iconBg="bg-emerald-500/10">
            <div className="space-y-0">
              <Toggle
                checked={settings.enableOffers}
                onChange={(v) => update({ enableOffers: v })}
                label="العرض الترويجي"
                description="عرض نافذة منبثقة بالعروض عند دخول المتجر"
              />
              {settings.enableOffers && (
                <div className="py-2.5 pr-0 sm:pr-4">
                  <Label className="text-xs text-muted-foreground mb-1 block">نص العرض الترويجي</Label>
                  <Textarea
                    value={settings.offerText}
                    onChange={(e) => update({ offerText: e.target.value })}
                    className="text-sm rounded-lg min-h-[60px] resize-none max-w-md"
                    placeholder="مثال: خصم 20% على الطلبات الأولى!"
                    rows={2}
                  />
                </div>
              )}
              <Toggle
                checked={settings.enableRegistration}
                onChange={(v) => update({ enableRegistration: v })}
                label="التسجيل المفتوح"
                description="السماح بالتسجيل التلقائي للمتاجر الجديدة"
              />
            </div>
          </SettingSection>
        </div>
      )}

      {/* ===== ORDERS & INVOICING SECTION ===== */}
      {activeSection === "orders" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <SettingSection title="إعدادات الطلبات" description="التحكم في أرقام الطلبات وصلاحيات العملاء" icon={Receipt} iconBg="bg-amber-500/10">
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">بادئة رقم الطلب</Label>
                  <Input
                    value={settings.orderPrefix}
                    onChange={(e) => update({ orderPrefix: e.target.value })}
                    className="h-10 text-sm rounded-lg w-24"
                    placeholder="A"
                    maxLength={5}
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">الحد الأدنى للنسخ</Label>
                  <Input
                    type="number"
                    value={settings.defaultCopiesMin}
                    onChange={(e) => update({ defaultCopiesMin: parseInt(e.target.value) || 1 })}
                    className="h-10 text-sm rounded-lg"
                    min={1}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">الحد الأقصى للنسخ</Label>
                  <Input
                    type="number"
                    value={settings.defaultCopiesMax}
                    onChange={(e) => update({ defaultCopiesMax: parseInt(e.target.value) || 100 })}
                    className="h-10 text-sm rounded-lg"
                    min={1}
                  />
                </div>
              </div>
              <Toggle
                checked={settings.allowCustomerDelete}
                onChange={(v) => update({ allowCustomerDelete: v })}
                label="السماح للعملاء بحذف الطلبات"
                description="تفعيل خيار حذف الطلب من طرف العميل"
              />
              <Toggle
                checked={settings.autoApproveShops}
                onChange={(v) => update({ autoApproveShops: v })}
                label="الموافقة التلقائية على المتاجر"
                description="تفعيل المتاجر الجديدة تلقائياً دون مراجعة"
              />
            </div>
          </SettingSection>

          <SettingSection title="إعدادات الفاتورة" description="تخصيص محتوى الفواتير والإيصالات" icon={FileText} iconBg="bg-violet-500/10">
            <div className="space-y-3">
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">تذييل الفاتورة</Label>
                <p className="text-[10px] text-muted-foreground mb-1.5">نص يظهر في أسفل كل فاتورة أو إيصال</p>
                <Textarea
                  value={settings.receiptFooter}
                  onChange={(e) => update({ receiptFooter: e.target.value })}
                  className="text-sm rounded-lg min-h-[80px] resize-none"
                  placeholder="شكراً لتعاملكم معنا..."
                  rows={3}
                />
              </div>
            </div>
          </SettingSection>
        </div>
      )}

      {/* ===== NOTIFICATIONS SECTION ===== */}
      {activeSection === "notifications" && (
        <SettingSection title="إشعارات المنصة" description="إعدادات الإشعارات العامة" icon={Bell} iconBg="bg-sky-500/10">
          <div className="space-y-0">
            {NOTIFICATION_OPTIONS.map((n) => (
              <Toggle
                key={n.key}
                checked={!!settings.notifications[n.key]}
                onChange={(v) => updateNotification(n.key, v)}
                label={n.label}
                description={n.desc}
              />
            ))}
          </div>
        </SettingSection>
      )}

      {/* ===== INTEGRATION & TECH SECTION ===== */}
      {activeSection === "integration" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <SettingSection title="التكاملات" description="روابط API وخدمات خارجية متصلة بالمنصة" icon={Code2} iconBg="bg-sky-500/10">
            <div className="space-y-3">
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">رابط WhatsApp API</Label>
                <Input
                  value={settings.whatsappApiUrl}
                  onChange={(e) => update({ whatsappApiUrl: e.target.value })}
                  className="h-10 text-sm rounded-lg"
                  placeholder="https://api.whatsapp.com/..."
                  dir="ltr"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">رابط المنصة العام</Label>
                <Input
                  value={settings.platformUrl}
                  onChange={(e) => update({ platformUrl: e.target.value })}
                  className="h-10 text-sm rounded-lg"
                  placeholder="https://app.tayf.dz"
                  dir="ltr"
                />
              </div>
            </div>
          </SettingSection>

          <SettingSection title="إعدادات تقنية" description="قيود الملفات والتحليل الذكي" icon={Settings} iconBg="bg-amber-500/10">
            <div className="space-y-3">
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">الحد الأقصى لحجم الملف (ميجابايت)</Label>
                <Input
                  type="number"
                  value={settings.maxFileSize}
                  onChange={(e) => update({ maxFileSize: parseInt(e.target.value) || 50 })}
                  className="h-10 text-sm rounded-lg w-32"
                  min={1}
                  max={500}
                />
              </div>
              <Toggle
                checked={settings.enableFileAnalysis}
                onChange={(v) => update({ enableFileAnalysis: v })}
                label="التحليل الذكي للملفات"
                description="تفعيل تحليل الملفات المرفوعة تلقائياً باستخدام الذكاء الاصطناعي"
              />
            </div>
          </SettingSection>
        </div>
      )}

      {/* ===== MAINTENANCE SECTION ===== */}
      {activeSection === "maintenance" && (
        <SettingSection title="الصيانة والوصول" description="التحكم في صلاحيات إنشاء المتاجر ووضع الصيانة" icon={Shield} iconBg="bg-rose-500/10">
          <div className="space-y-4 max-w-md">
            <Toggle
              checked={settings.maintenanceMode}
              onChange={(v) => update({ maintenanceMode: v })}
              label="وضع الصيانة"
              description="تعطيل الوصول للمنصة مؤقتاً"
            />
            {settings.maintenanceMode && (
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">رسالة الصيانة</Label>
                <Textarea
                  value={settings.maintenanceMessage}
                  onChange={(e) => update({ maintenanceMessage: e.target.value })}
                  className="text-sm rounded-lg min-h-[60px] resize-none"
                  rows={2}
                />
              </div>
            )}
            <Toggle
              checked={settings.allowNewShops}
              onChange={(v) => update({ allowNewShops: v })}
              label="السماح بإنشاء متاجر جديدة"
              description="عطّل لمنع إنشاء متاجر جديدة"
            />
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">الحد الأقصى للمتاجر</Label>
              <Input
                type="number"
                value={settings.maxShops}
                onChange={(e) => update({ maxShops: parseInt(e.target.value) || 100 })}
                className="h-10 text-sm rounded-lg w-32"
                min={1}
              />
            </div>
          </div>
        </SettingSection>
      )}

      {/* ===== ADVANCED SECTION ===== */}
      {activeSection === "advanced" && (
        <SettingSection title="تخصيص متقدم" description="CSS مخصص وتغييرات متقدمة على المظهر" icon={Settings} iconBg="bg-amber-500/10">
          <div className="space-y-3 max-w-2xl">
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">CSS مخصص</Label>
              <p className="text-[10px] text-muted-foreground mb-2">أضف أنماط CSS مخصصة لتغيير مظهر المنصة. استخدم بحذر.</p>
              <Textarea
                value={settings.customCss}
                onChange={(e) => update({ customCss: e.target.value })}
                className="text-sm rounded-lg font-mono min-h-[100px] resize-none"
                placeholder="/* مثال */&#10;.custom-class { color: red; }"
                rows={5}
                dir="ltr"
              />
            </div>
          </div>
        </SettingSection>
      )}

      {/* Info note */}
      <div className="bg-secondary/50 border border-border rounded-xl p-4 flex items-start gap-3">
        <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground leading-relaxed">
          هذه الإعدادات تُطبّق على المتاجر الجديدة فقط. لتعديل إعدادات متجر موجود، اذهب إلى صفحة المتجر من قسم &quot;المتاجر&quot;.
        </p>
      </div>
    </div>
  );
}