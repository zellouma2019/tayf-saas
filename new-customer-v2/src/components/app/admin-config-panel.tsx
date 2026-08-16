"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Store, DollarSign, Upload, X, Loader2, Save, RotateCcw,
  Image as ImageIcon2, Type, Phone, Mail, MapPin, Clock, Hash, Truck,
  FileText, MessageSquare, Palette, CheckCircle2, AlertTriangle,
  ChevronDown, Sparkles, Globe, Building2, Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import type { AppSettings, PricingRules, WorkHoursConfig } from "@/lib/default-settings";
import { DEFAULT_SETTINGS, DEFAULT_PRICING_RULES } from "@/lib/default-settings";

/* ═══════════════════════════════════════════════════════════════════ */
/*  Constants                                                        */
/* ═══════════════════════════════════════════════════════════════════ */

const ADMIN_CODE = "2514";

const CONFIG_TABS = [
  { key: "branding", label: "البيانات والعلامة التجارية", icon: Store, mobileLabel: "العلامة التجارية" },
  { key: "contact", label: "معلومات الاتصال", icon: Phone, mobileLabel: "الاتصال" },
  { key: "pricing", label: "الأسعار والقواعد", icon: DollarSign, mobileLabel: "الأسعار" },
  { key: "content", label: "النصوص والمحتوى", icon: FileText, mobileLabel: "المحتوى" },
  { key: "delivery", label: "إعدادات التوصيل", icon: Truck, mobileLabel: "التوصيل" },
] as const;

type ConfigTabKey = (typeof CONFIG_TABS)[number]["key"];

/* ═══════════════════════════════════════════════════════════════════ */
/*  Reusable Field Components                                        */
/* ═══════════════════════════════════════════════════════════════════ */

interface FieldRowProps {
  label: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  hint?: string;
  className?: string;
}

function FieldRow({ label, icon, children, hint, className = "" }: FieldRowProps) {
  return (
    <div className={`grid gap-1.5 ${className}`}>
      <Label className="text-xs font-medium flex items-center gap-1.5 text-muted-foreground">
        {icon}{label}
      </Label>
      {children}
      {hint && <p className="text-[10px] text-muted-foreground/60 leading-relaxed">{hint}</p>}
    </div>
  );
}

function SectionCard({
  title,
  icon,
  children,
  className = "",
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-xl border bg-card/50 p-4 sm:p-5 ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center text-amber-600 dark:text-amber-400">
          {icon}
        </div>
        <h3 className="text-sm font-bold">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function SaveIndicator({ dirty, saving, onSave }: { dirty: boolean; saving: boolean; onSave: () => void }) {
  return (
    <div className="flex items-center gap-2">
      {dirty && (
        <motion.span
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-[10px] sm:text-xs text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1"
        >
          <AlertTriangle className="h-3 w-3" />
          <span className="hidden sm:inline">تغييرات غير محفوظة</span>
          <span className="sm:hidden">غير محفوظ</span>
        </motion.span>
      )}
      {!dirty && (
        <span className="text-[10px] text-emerald-500 font-medium flex items-center gap-1">
          <CheckCircle2 className="h-3 w-3" />
          <span className="hidden sm:inline">محفوظ</span>
        </span>
      )}
      <Button
        size="sm"
        className="h-8 text-xs gap-1.5 bg-amber-600 hover:bg-amber-700 text-white shrink-0"
        onClick={onSave}
        disabled={saving || !dirty}
      >
        {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
        <span className="hidden sm:inline">حفظ التغييرات</span>
        <span className="sm:hidden">حفظ</span>
      </Button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
/*  Logo Uploader                                                    */
/* ═══════════════════════════════════════════════════════════════════ */

function LogoUploader({
  value,
  onChange,
}: {
  value: string;
  onChange: (url: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const upload = useCallback(async (file: File) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload/image", {
        method: "POST",
        headers: { "x-admin-code": ADMIN_CODE },
        body: fd,
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      onChange(data.url);
    } catch { /* ignore */ }
    setUploading(false);
  }, [onChange]);

  const remove = useCallback(async () => {
    if (value.startsWith("/uploads/")) {
      try {
        await fetch("/api/upload/image", {
          method: "DELETE",
          headers: { "Content-Type": "application/json", "x-admin-code": ADMIN_CODE },
          body: JSON.stringify({ url: value }),
        });
      } catch { /* ignore */ }
    }
    onChange("");
  }, [value, onChange]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) upload(file);
  }, [upload]);

  return (
    <div className="space-y-2">
      <div
        className={`relative flex items-center justify-center h-36 sm:h-44 rounded-xl border-2 border-dashed transition-all cursor-pointer bg-muted/20 overflow-hidden group ${
          dragOver
            ? "border-amber-400 bg-amber-50/50 dark:bg-amber-900/20"
            : "border-border hover:border-amber-400/60"
        }`}
        onClick={() => inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        {value ? (
          <>
            <img src={value} alt="الشعار" className="max-h-full max-w-full object-contain p-3" />
            <button
              type="button"
              onClick={e => { e.stopPropagation(); remove(); }}
              className="absolute top-2 left-2 w-7 h-7 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </>
        ) : uploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
            <p className="text-xs text-muted-foreground">جارٍ الرفع...</p>
          </div>
        ) : (
          <div className="text-center gap-2 px-4">
            <Upload className="h-8 w-8 mx-auto text-muted-foreground/30" />
            <p className="text-xs text-muted-foreground font-medium">اسحب الشعار هنا أو انقر للاختيار</p>
            <p className="text-[10px] text-muted-foreground/50">PNG, JPG, WEBP, SVG — حتى 2MB</p>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/svg+xml"
          className="hidden"
          onChange={e => {
            const f = e.target.files?.[0];
            if (f) upload(f);
            e.target.value = "";
          }}
        />
      </div>
      {value && (
        <p className="text-[10px] text-muted-foreground truncate font-mono" dir="ltr" title={value}>{value}</p>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
/*  Tab: Branding                                                    */
/* ═══════════════════════════════════════════════════════════════════ */

function BrandingTab({
  general,
  onChange,
}: {
  general: AppSettings["general"];
  onChange: (key: string, value: string | number) => void;
}) {
  return (
    <div className="space-y-5">
      <SectionCard title="الشعار" icon={<ImageIcon2 className="h-4 w-4" />}>
        <LogoUploader
          value={general.shopLogo}
          onChange={url => onChange("shopLogo", url)}
        />
      </SectionCard>

      <SectionCard title="البيانات الأساسية" icon={<Building2 className="h-4 w-4" />}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FieldRow label="اسم المطبعة" icon={<Type className="h-3.5 w-3.5" />} hint="يظهر في كل أجزاء التطبيق">
            <Input value={general.shopName} onChange={e => onChange("shopName", e.target.value)} className="h-9" />
          </FieldRow>
          <FieldRow label="الشعار النصي (Tagline)" icon={<Sparkles className="h-3.5 w-3.5" />} hint="يظهر بجانب اسم المطبعة">
            <Input value={general.tagline} onChange={e => onChange("tagline", e.target.value)} className="h-9" />
          </FieldRow>
        </div>
      </SectionCard>

      <SectionCard title="خصومات الكميات" icon={<Hash className="h-4 w-4" />}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <FieldRow label="خصم 10 نسخ (%)" icon={<Hash className="h-3 w-3" />} hint="عند 10 نسخ فأكثر">
            <Input type="number" min="0" max="100" value={general.quantityDiscount10} onChange={e => onChange("quantityDiscount10", parseFloat(e.target.value) || 0)} className="h-9" dir="ltr" />
          </FieldRow>
          <FieldRow label="خصم 50 نسخ (%)" icon={<Hash className="h-3 w-3" />} hint="عند 50 نسخ فأكثر">
            <Input type="number" min="0" max="100" value={general.quantityDiscount50} onChange={e => onChange("quantityDiscount50", parseFloat(e.target.value) || 0)} className="h-9" dir="ltr" />
          </FieldRow>
          <FieldRow label="خصم الوجهين (%)" icon={<Hash className="h-3 w-3" />} hint="خصم تلقائي عند الطباعة على الوجهين">
            <Input type="number" min="0" max="100" value={general.sidesDiscount} onChange={e => onChange("sidesDiscount", parseFloat(e.target.value) || 0)} className="h-9" dir="ltr" />
          </FieldRow>
        </div>
      </SectionCard>

      <SectionCard title="إعدادات عامة" icon={<Globe className="h-4 w-4" />}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FieldRow label="الحد الأدنى للطلب (نسخ)" icon={<Hash className="h-3 w-3" />}>
            <Input type="number" min="1" value={general.minOrder} onChange={e => onChange("minOrder", parseInt(e.target.value) || 1)} className="h-9" dir="ltr" />
          </FieldRow>
          <FieldRow label="حذف الملفات تلقائياً (أيام)" icon={<Clock className="h-3 w-3" />} hint="بعد انتهاء الصلاحية">
            <Input type="number" min="1" max="90" value={general.autoDeleteDays} onChange={e => onChange("autoDeleteDays", parseInt(e.target.value) || 10)} className="h-9" dir="ltr" />
          </FieldRow>
        </div>
      </SectionCard>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
/*  Tab: Contact                                                     */
/* ═══════════════════════════════════════════════════════════════════ */

function ContactTab({
  general,
  onChange,
}: {
  general: AppSettings["general"];
  onChange: (key: string, value: string | number) => void;
}) {
  return (
    <div className="space-y-5">
      <SectionCard title="أرقام الاتصال" icon={<Phone className="h-4 w-4" />}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FieldRow label="رقم الواتساب" icon={<Phone className="h-3.5 w-3.5" />} hint="يُستخدم لأزرار التواصل السريع">
            <Input value={general.whatsappNumber} onChange={e => onChange("whatsappNumber", e.target.value)} className="h-9" dir="ltr" placeholder="05XXXXXXXX" />
          </FieldRow>
          <FieldRow label="رقم الهاتف" icon={<Phone className="h-3.5 w-3.5" />} hint="يظهر في الفوتر والفواتير">
            <Input value={general.phoneNumber} onChange={e => onChange("phoneNumber", e.target.value)} className="h-9" dir="ltr" placeholder="05XXXXXXXX" />
          </FieldRow>
        </div>
      </SectionCard>

      <SectionCard title="البريد والعنوان" icon={<Mail className="h-4 w-4" />}>
        <div className="space-y-4">
          <FieldRow label="البريد الإلكتروني" icon={<Mail className="h-3.5 w-3.5" />} hint="يظهر في الفواتير والتواصل">
            <Input value={general.email} onChange={e => onChange("email", e.target.value)} className="h-9" dir="ltr" placeholder="info@example.com" />
          </FieldRow>
          <FieldRow label="العنوان" icon={<MapPin className="h-3.5 w-3.5" />} hint="عنوان المطبعة الفعلي">
            <Textarea
              value={general.address}
              onChange={e => onChange("address", e.target.value)}
              className="min-h-[60px] text-sm resize-none"
              placeholder="المدينة، الحي، الشارع..."
            />
          </FieldRow>
        </div>
      </SectionCard>

      <SectionCard title="ساعات العمل" icon={<Clock className="h-4 w-4" />}>
        <div className="space-y-4">
          <FieldRow label="نص ساعات العمل المعروض" icon={<Clock className="h-3.5 w-3.5" />} hint="يظهر للعملاء في الواجهة">
            <Textarea
              value={general.workHours}
              onChange={e => onChange("workHours", e.target.value)}
              className="min-h-[60px] text-sm resize-none"
              placeholder="الأحد - الخميس: 10:00 ص — 11:00 م"
            />
          </FieldRow>
          <Separator />
          <WorkHoursConfigEditor
            config={general.workHoursConfig}
            onChange={val => onChange("workHoursConfig", val as unknown as string)}
          />
        </div>
      </SectionCard>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
/*  Work Hours Config Editor                                         */
/* ═══════════════════════════════════════════════════════════════════ */

const DAY_LABELS = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

function WorkHoursConfigEditor({
  config,
  onChange,
}: {
  config: WorkHoursConfig;
  onChange: (config: WorkHoursConfig) => void;
}) {
  const toggleDay = (dayIdx: number) => {
    const daysOff = config.daysOff.includes(dayIdx)
      ? config.daysOff.filter(d => d !== dayIdx)
      : [...config.daysOff, dayIdx];
    onChange({ ...config, daysOff });
  };

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground flex items-center gap-1">
        <Info className="h-3 w-3" />
        حدد أيام الإجازة (الرمادية = إجازة)
      </p>
      <div className="flex flex-wrap gap-2">
        {DAY_LABELS.map((label, idx) => {
          const isOff = config.daysOff.includes(idx);
          return (
            <button
              key={idx}
              type="button"
              onClick={() => toggleDay(idx)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                isOff
                  ? "bg-muted/50 text-muted-foreground/50 border-muted line-through"
                  : "bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
        <FieldRow label="وقت الافتتاح" icon={<Clock className="h-3 w-3" />}>
          <div className="flex items-center gap-2">
            <Input
              type="number" min="0" max="23"
              value={config.startHour}
              onChange={e => onChange({ ...config, startHour: parseInt(e.target.value) || 8 })}
              className="h-9 w-20" dir="ltr"
            />
            <span className="text-xs text-muted-foreground">:00</span>
          </div>
        </FieldRow>
        <FieldRow label="وقت الإغلاق" icon={<Clock className="h-3 w-3" />}>
          <div className="flex items-center gap-2">
            <Input
              type="number" min="0" max="23"
              value={config.endHour}
              onChange={e => onChange({ ...config, endHour: parseInt(e.target.value) || 19 })}
              className="h-9 w-20" dir="ltr"
            />
            <span className="text-xs text-muted-foreground">:00</span>
          </div>
        </FieldRow>
      </div>

      <Separator />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FieldRow label="رسوم الاستعجال الأساسية (ر.س)" icon={<DollarSign className="h-3 w-3" />} hint="مبلغ ثابت يُضاف للطلبات المستعجلة">
          <Input
            type="number" step="1" min="0"
            value={config.urgentBaseSurcharge}
            onChange={e => onChange({ ...config, urgentBaseSurcharge: parseFloat(e.target.value) || 0 })}
            className="h-9" dir="ltr"
          />
        </FieldRow>
        <FieldRow label="رسوم الاستعجال لكل صفحة (ر.س)" icon={<DollarSign className="h-3 w-3" />}>
          <Input
            type="number" step="0.01" min="0"
            value={config.urgentPerPageRate}
            onChange={e => onChange({ ...config, urgentPerPageRate: parseFloat(e.target.value) || 0 })}
            className="h-9" dir="ltr"
          />
        </FieldRow>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
/*  Tab: Pricing                                                     */
/* ═══════════════════════════════════════════════════════════════════ */

function PricingTab({
  pricing,
  onChange,
  onResetPricing,
}: {
  pricing: PricingRules;
  onChange: (key: keyof PricingRules, value: unknown) => void;
  onResetPricing: () => void;
}) {
  return (
    <div className="space-y-5">
      <SectionCard title="قواعد التسعير الأساسية" icon={<DollarSign className="h-4 w-4" />}>
        <div className="flex items-center justify-end mb-2">
          <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-muted-foreground" onClick={onResetPricing}>
            <RotateCcw className="h-3 w-3" />إعادة تعيين للقيم الافتراضية
          </Button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <FieldRow label="سعر الصفحة — أبيض وأسود (ر.س)" icon={<DollarSign className="h-3.5 w-3.5" />} hint="التكلفة الأساسية لكل صفحة">
            <Input type="number" step="0.01" min="0" value={pricing.bwCostPerPage} onChange={e => onChange("bwCostPerPage", parseFloat(e.target.value) || 0)} className="h-9" dir="ltr" />
          </FieldRow>
          <FieldRow label="سعر الصفحة — ملون (ر.س)" icon={<Palette className="h-3.5 w-3.5" />} hint="التكلفة لكل صفحة ملونة">
            <Input type="number" step="0.01" min="0" value={pricing.colorCostPerPage} onChange={e => onChange("colorCostPerPage", parseFloat(e.target.value) || 0)} className="h-9" dir="ltr" />
          </FieldRow>
          <FieldRow label="غلاف بلاستيكي (ر.س)" icon={<DollarSign className="h-3.5 w-3.5" />}>
            <Input type="number" step="0.1" min="0" value={pricing.clearCoverCost} onChange={e => onChange("clearCoverCost", parseFloat(e.target.value) || 0)} className="h-9" dir="ltr" />
          </FieldRow>
          <FieldRow label="رسوم الوجهين لكل صفحة (ر.س)" icon={<DollarSign className="h-3.5 w-3.5" />}>
            <Input type="number" step="0.01" min="0" value={pricing.duplexPerPageRate} onChange={e => onChange("duplexPerPageRate", parseFloat(e.target.value) || 0)} className="h-9" dir="ltr" />
          </FieldRow>
          <FieldRow label="نسبة ضريبة القيمة المضافة" icon={<DollarSign className="h-3.5 w-3.5" />} hint="مثال: 15 لـ 15%">
            <Input type="number" step="0.01" min="0" max="100" value={pricing.vatRate} onChange={e => onChange("vatRate", parseFloat(e.target.value) || 0)} className="h-9" dir="ltr" />
          </FieldRow>
        </div>
      </SectionCard>

      <SectionCard title="مضاعفات أوزان الورق" icon={<FileText className="h-4 w-4" />}>
        <p className="text-xs text-muted-foreground mb-3 flex items-center gap-1">
          <Info className="h-3 w-3" />
          المضاعف يُطبق على سعر الصفحة الأساسي (1.0 = بدون زيادة)
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {Object.entries(pricing.paperSurcharge).map(([key, val]) => (
            <FieldRow key={key} label={`ورق ${key}`} icon={<FileText className="h-3 w-3" />}>
              <Input
                type="number" step="0.05" min="0.5"
                value={val}
                onChange={e => {
                  const next = { ...pricing.paperSurcharge, [key]: parseFloat(e.target.value) || 1 };
                  onChange("paperSurcharge", next);
                }}
                className="h-9" dir="ltr"
              />
            </FieldRow>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="أسعار التجليد (ر.س/نسخة)" icon={<BookIcon className="h-4 w-4" />}>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {Object.entries(pricing.bindingCosts).map(([key, val]) => {
            const labels: Record<string, string> = {
              none: "بدون تجليد", perfect: "تجليد كامل",
              spiral: "حلزوني", staple: "دباسة", brochure: "كتيب مطوي",
            };
            return (
              <FieldRow key={key} label={labels[key] || key} icon={<DollarSign className="h-3 w-3" />}>
                <Input
                  type="number" step="0.5" min="0"
                  value={val}
                  onChange={e => {
                    const next = { ...pricing.bindingCosts, [key]: parseFloat(e.target.value) || 0 };
                    onChange("bindingCosts", next);
                  }}
                  className="h-9" dir="ltr"
                />
              </FieldRow>
            );
          })}
        </div>
      </SectionCard>

      <SectionCard title="معاينة حسابية مباشرة" icon={<Sparkles className="h-4 w-4" />}>
        <PricingPreview pricing={pricing} />
      </SectionCard>
    </div>
  );
}

function BookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
/*  Live Pricing Preview                                              */
/* ═══════════════════════════════════════════════════════════════════ */

function PricingPreview({ pricing }: { pricing: PricingRules }) {
  const [pages, setPages] = useState(20);
  const [copies, setCopies] = useState(1);
  const [isColor, setIsColor] = useState(false);
  const [binding, setBinding] = useState("none");
  const [duplex, setDuplex] = useState(false);
  const [cover, setCover] = useState(false);
  const [paper, setPaper] = useState("80gsm");

  const base = isColor ? pricing.colorCostPerPage : pricing.bwCostPerPage;
  const paperMul = pricing.paperSurcharge[paper] || 1;
  const printCost = base * pages * copies * paperMul;
  const bindCost = (pricing.bindingCosts[binding] || 0) * copies;
  const coverCost = cover ? pricing.clearCoverCost * copies : 0;
  const duplexCost = duplex && pages > 1 ? pricing.duplexPerPageRate * pages * copies : 0;
  const subtotal = printCost + bindCost + coverCost + duplexCost;
  const vat = subtotal * (pricing.vatRate / 100);
  const total = Math.round((subtotal + vat) * 100) / 100;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <FieldRow label="صفحات" icon={<Hash className="h-3 w-3" />}>
          <Input type="number" min={1} value={pages} onChange={e => setPages(parseInt(e.target.value) || 1)} className="h-8 text-xs" dir="ltr" />
        </FieldRow>
        <FieldRow label="نسخ" icon={<Hash className="h-3 w-3" />}>
          <Input type="number" min={1} value={copies} onChange={e => setCopies(parseInt(e.target.value) || 1)} className="h-8 text-xs" dir="ltr" />
        </FieldRow>
        <div className="grid gap-1.5">
          <Label className="text-[10px] text-muted-foreground">اللون</Label>
          <Button variant={isColor ? "default" : "outline"} size="sm" className="h-8 text-xs" onClick={() => setIsColor(!isColor)}>
            {isColor ? "ملون 🎨" : "أبيض وأسود"}
          </Button>
        </div>
        <div className="grid gap-1.5">
          <Label className="text-[10px] text-muted-foreground">الوجهين</Label>
          <Button variant={duplex ? "default" : "outline"} size="sm" className="h-8 text-xs" onClick={() => setDuplex(!duplex)}>
            {duplex ? "نعم" : "لا"}
          </Button>
        </div>
        <div className="grid gap-1.5">
          <Label className="text-[10px] text-muted-foreground">غلاف</Label>
          <Button variant={cover ? "default" : "outline"} size="sm" className="h-8 text-xs" onClick={() => setCover(!cover)}>
            {cover ? "نعم" : "لا"}
          </Button>
        </div>
        <FieldRow label="الورق" icon={<FileText className="h-3 w-3" />}>
          <select
            value={paper} onChange={e => setPaper(e.target.value)}
            className="h-8 text-xs rounded-md border bg-background px-2 w-full"
          >
            {Object.keys(pricing.paperSurcharge).map(k => <option key={k} value={k}>{k}</option>)}
          </select>
        </FieldRow>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
        <div className="flex justify-between p-2.5 rounded-lg bg-background/80 border">
          <span className="text-muted-foreground">تكلفة الطباعة</span>
          <span className="font-semibold tabular-nums">{printCost.toFixed(2)} ر.س</span>
        </div>
        <div className="flex justify-between p-2.5 rounded-lg bg-background/80 border">
          <span className="text-muted-foreground">التجليد</span>
          <span className="font-semibold tabular-nums">{bindCost.toFixed(2)} ر.س</span>
        </div>
        <div className="flex justify-between p-2.5 rounded-lg bg-background/80 border">
          <span className="text-muted-foreground">الغلاف</span>
          <span className="font-semibold tabular-nums">{coverCost.toFixed(2)} ر.س</span>
        </div>
        <div className="flex justify-between p-2.5 rounded-lg bg-background/80 border">
          <span className="text-muted-foreground">رسوم الوجهين</span>
          <span className="font-semibold tabular-nums">{duplexCost.toFixed(2)} ر.س</span>
        </div>
        <div className="flex justify-between p-2.5 rounded-lg bg-background/80 border">
          <span className="text-muted-foreground">ضريبة ({pricing.vatRate}%)</span>
          <span className="font-semibold tabular-nums">{vat.toFixed(2)} ر.س</span>
        </div>
        <div className="flex justify-between p-2.5 rounded-lg bg-gradient-to-l from-amber-500 to-orange-500 text-white font-bold">
          <span>الإجمالي</span>
          <span className="tabular-nums">{total.toFixed(2)} ر.س</span>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
/*  Tab: Content                                                     */
/* ═══════════════════════════════════════════════════════════════════ */

function ContentTab({
  general,
  onChange,
}: {
  general: AppSettings["general"];
  onChange: (key: string, value: string | number) => void;
}) {
  return (
    <div className="space-y-5">
      <SectionCard title="رسائل الترحيب والإعلان" icon={<MessageSquare className="h-4 w-4" />}>
        <div className="space-y-4">
          <FieldRow label="رسالة الترحيب" icon={<MessageSquare className="h-3.5 w-3.5" />} hint="تظهر عند فتح التطبيق لأول مرة">
            <Textarea
              value={(general as Record<string, unknown>).welcomeMessage as string || ""}
              onChange={e => onChange("welcomeMessage", e.target.value)}
              className="min-h-[80px] text-sm resize-none"
              placeholder="مرحباً بك في مطبعتنا! نقدم لك أفضل خدمات الطباعة..."
            />
          </FieldRow>
          <FieldRow label="نص البانر الإعلاني" icon={<Sparkles className="h-3.5 w-3.5" />} hint="يظهر في أعلى الصفحة">
            <Textarea
              value={(general as Record<string, unknown>).promoText as string || ""}
              onChange={e => onChange("promoText", e.target.value)}
              className="min-h-[60px] text-sm resize-none"
              placeholder="خصم 20% على جميع الطلبات هذا الأسبوع!"
            />
          </FieldRow>
          <FieldRow label="كود الخصم الإعلاني" icon={<Hash className="h-3.5 w-3.5" />}>
            <Input
              value={(general as Record<string, unknown>).promoCode as string || ""}
              onChange={e => onChange("promoCode", e.target.value)}
              className="h-9" dir="ltr" placeholder="SAVE20"
            />
          </FieldRow>
        </div>
      </SectionCard>

      <SectionCard title="الوصف التعريفي" icon={<FileText className="h-4 w-4" />}>
        <div className="space-y-4">
          <FieldRow label="وصف مختصر للمتجر" icon={<Info className="h-3.5 w-3.5" />} hint={"يظهر في قسم \"من نحن\" ومحركات البحث"}>
            <Textarea
              value={(general as Record<string, unknown>).shopDescription as string || ""}
              onChange={e => onChange("shopDescription", e.target.value)}
              className="min-h-[100px] text-sm resize-none"
              placeholder="مطبعة متخصصة في تقديم خدمات الطباعة الرقمية بجودة عالية وأسعار تنافسية..."
            />
          </FieldRow>
          <FieldRow label="مميزات المتجر (واحدة في كل سطر)" icon={<CheckCircle2 className="h-3.5 w-3.5" />} hint="تظهر كنقاط مميزة في الصفحة">
            <Textarea
              value={(general as Record<string, unknown>).shopFeatures as string || ""}
              onChange={e => onChange("shopFeatures", e.target.value)}
              className="min-h-[100px] text-sm resize-none"
              placeholder={"طباعة فورية بأعلى جودة\nتوصيل سريع لجميع مناطق المملكة\nأسعار تنافسية مع خصومات للكميات الكبيرة"}
            />
          </FieldRow>
        </div>
      </SectionCard>

      <SectionCard title="مفتاح خرائط جوجل" icon={<Globe className="h-4 w-4" />}>
        <FieldRow label="Google Maps API Key" icon={<Globe className="h-3.5 w-3.5" />} hint="يُستخدم لعرض خريطة التوصيل (اختياري)">
          <Input
            value={general.googleMapsKey}
            onChange={e => onChange("googleMapsKey", e.target.value)}
            className="h-9 font-mono text-xs" dir="ltr" placeholder="AIza..."
          />
        </FieldRow>
      </SectionCard>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
/*  Tab: Delivery                                                    */
/* ═══════════════════════════════════════════════════════════════════ */

function DeliveryTab({
  general,
  onChange,
}: {
  general: AppSettings["general"];
  onChange: (key: string, value: string | number) => void;
}) {
  return (
    <div className="space-y-5">
      <SectionCard title="إعدادات التوصيل العامة" icon={<Truck className="h-4 w-4" />}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FieldRow label="سعر التوصيل الافتراضي (ر.س)" icon={<DollarSign className="h-3.5 w-3.5" />} hint="يُطبق عند عدم تحديد منطقة">
            <Input
              type="number" step="1" min="0"
              value={general.deliveryPrice}
              onChange={e => onChange("deliveryPrice", parseFloat(e.target.value) || 0)}
              className="h-9" dir="ltr"
            />
          </FieldRow>
          <FieldRow label="نقاط الاستلام والتوصيل" icon={<MapPin className="h-3.5 w-3.5" />}>
            <div className="text-xs text-muted-foreground bg-muted/30 rounded-lg p-2.5">
              <span className="font-medium">{general.deliveryPoints?.length || 0}</span> نقطة مسجلة
            </div>
          </FieldRow>
        </div>
      </SectionCard>

      <SectionCard title="مناطق التوصيل" icon={<MapPin className="h-4 w-4" />}>
        {general.deliveryZones && general.deliveryZones.length > 0 ? (
          <div className="space-y-3">
            <div className="grid grid-cols-12 gap-2 text-[10px] text-muted-foreground font-medium px-2">
              <div className="col-span-1">#</div>
              <div className="col-span-3">المنطقة</div>
              <div className="col-span-3">السعر (ر.س)</div>
              <div className="col-span-3">الوقت (ساعات)</div>
              <div className="col-span-2">النطاق (كم)</div>
            </div>
            {general.deliveryZones.map((zone, idx) => (
              <div
                key={zone.id}
                className="grid grid-cols-12 gap-2 items-center text-xs p-2 rounded-lg bg-muted/20 hover:bg-muted/40 transition-colors"
              >
                <div className="col-span-1 text-center">
                  <span className="text-base">{zone.emoji}</span>
                </div>
                <div className="col-span-3 font-medium truncate">{zone.name}</div>
                <div className="col-span-3 tabular-nums">{zone.price} ر.س</div>
                <div className="col-span-3 tabular-nums">{zone.estimatedHours} ساعة</div>
                <div className="col-span-2 tabular-nums">{zone.radiusKm > 0 ? `${zone.radiusKm} كم` : "—"}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 gap-2 text-muted-foreground">
            <Truck className="h-8 w-8 opacity-20" />
            <p className="text-xs">لا توجد مناطق توصيل مسجلة</p>
          </div>
        )}
      </SectionCard>

      <SectionCard title="إدارة نقاط الاستلام" icon={<Building2 className="h-4 w-4" />}>
        {general.deliveryPoints && general.deliveryPoints.length > 0 ? (
          <div className="space-y-2">
            {general.deliveryPoints.map((point, idx) => (
              <div
                key={point.id || idx}
                className="flex items-start gap-3 p-3 rounded-lg bg-muted/20 border text-xs"
              >
                <span className="text-lg mt-0.5">{point.emoji || "📍"}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{point.name}</p>
                  <p className="text-muted-foreground truncate mt-0.5">{point.address}</p>
                </div>
                <div className="text-left shrink-0">
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{point.price === 0 ? "مجاني" : `${point.price} ر.س`}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 gap-2 text-muted-foreground">
            <Building2 className="h-8 w-8 opacity-20" />
            <p className="text-xs">لا توجد نقاط استلام مسجلة</p>
          </div>
        )}
      </SectionCard>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
/*  Main Export — Admin Config Panel (Embeddable, Not Modal)         */
/* ═══════════════════════════════════════════════════════════════════ */

export function AdminConfigPanel({
  onSaved,
}: {
  onSaved: () => void;
}) {
  const [tab, setTab] = useState<ConfigTabKey>("branding");
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [toast, setToast] = useState("");
  const [loading, setLoading] = useState(true);
  const [showMobileTabs, setShowMobileTabs] = useState(false);

  // Working copy of general settings
  const [general, setGeneral] = useState<AppSettings["general"]>(DEFAULT_SETTINGS.general);

  // Load settings on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/settings");
        if (res.ok && !cancelled) {
          const data = await res.json();
          const merged: AppSettings["general"] = {
            ...DEFAULT_SETTINGS.general,
            ...data.general,
            pricingRules: {
              ...DEFAULT_SETTINGS.general.pricingRules,
              ...(data.general?.pricingRules || {}),
            },
            workHoursConfig: {
              ...DEFAULT_SETTINGS.general.workHoursConfig,
              ...(data.general?.workHoursConfig || {}),
            },
          };
          setGeneral(merged);
          setDirty(false);
        }
      } catch { /* keep defaults */ }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const handleFieldChange = useCallback((key: string, value: string | number) => {
    setGeneral(prev => ({ ...prev, [key]: value }));
    setDirty(true);
  }, []);

  const handlePricingChange = useCallback((key: keyof PricingRules, value: unknown) => {
    setGeneral(prev => ({
      ...prev,
      pricingRules: { ...prev.pricingRules, [key]: value },
    }));
    setDirty(true);
  }, []);

  const resetPricing = useCallback(() => {
    setGeneral(prev => ({ ...prev, pricingRules: { ...DEFAULT_PRICING_RULES } }));
    setDirty(true);
  }, []);

  const save = useCallback(async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json", "x-admin-code": ADMIN_CODE },
        body: JSON.stringify({ general }),
      });
      if (res.ok) {
        setDirty(false);
        setToast("تم حفظ الإعدادات بنجاح ✓");
        onSaved();
        setTimeout(() => setToast(""), 3000);
      }
    } catch { /* ignore */ }
    setSaving(false);
  }, [general, onSaved]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <div className="flex gap-1.5">
          {[0, 1, 2].map(i => (
            <div key={i} className="w-2 h-2 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
          ))}
        </div>
        <p className="text-xs text-muted-foreground">جارٍ تحميل الإعدادات...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full relative">
      {/* ─── Tab Navigation (Desktop: horizontal, Mobile: dropdown) ─── */}
      <div className="border-b shrink-0 bg-background/80 backdrop-blur-sm">
        {/* Mobile dropdown */}
        <div className="sm:hidden px-3 py-2">
          <button
            onClick={() => setShowMobileTabs(!showMobileTabs)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg border text-sm font-medium bg-muted/30"
          >
            <span className="flex items-center gap-2">
              {(() => { const t = CONFIG_TABS.find(c => c.key === tab); return t ? <t.icon className="h-4 w-4" /> : null; })()}
              {CONFIG_TABS.find(c => c.key === tab)?.mobileLabel}
            </span>
            <ChevronDown className={`h-4 w-4 transition-transform ${showMobileTabs ? "rotate-180" : ""}`} />
          </button>
          <AnimatePresence>
            {showMobileTabs && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden mt-1 rounded-lg border bg-background shadow-lg"
              >
                {CONFIG_TABS.map(t => {
                  const Ic = t.icon;
                  return (
                    <button
                      key={t.key}
                      onClick={() => { setTab(t.key); setShowMobileTabs(false); }}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors text-right border-b last:border-b-0 ${
                        tab === t.key
                          ? "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 font-medium"
                          : "hover:bg-muted/50 text-muted-foreground"
                      }`}
                    >
                      <Ic className="h-4 w-4" />
                      {t.label}
                    </button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Desktop horizontal tabs */}
        <div className="hidden sm:flex px-4">
          {CONFIG_TABS.map(t => {
            const Ic = t.icon;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`py-3 px-4 text-xs font-medium flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
                  tab === t.key
                    ? "border-amber-500 text-amber-700 dark:text-amber-400"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30"
                }`}
              >
                <Ic className="h-3.5 w-3.5" />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── Content Area ─── */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="max-w-3xl mx-auto p-4 sm:p-6">
          <AnimatePresence mode="wait">
            {tab === "branding" && (
              <motion.div key="branding" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.15 }}>
                <BrandingTab general={general} onChange={handleFieldChange} />
              </motion.div>
            )}
            {tab === "contact" && (
              <motion.div key="contact" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.15 }}>
                <ContactTab general={general} onChange={handleFieldChange} />
              </motion.div>
            )}
            {tab === "pricing" && (
              <motion.div key="pricing" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.15 }}>
                <PricingTab
                  pricing={general.pricingRules}
                  onChange={handlePricingChange}
                  onResetPricing={resetPricing}
                />
              </motion.div>
            )}
            {tab === "content" && (
              <motion.div key="content" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.15 }}>
                <ContentTab general={general} onChange={handleFieldChange} />
              </motion.div>
            )}
            {tab === "delivery" && (
              <motion.div key="delivery" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.15 }}>
                <DeliveryTab general={general} onChange={handleFieldChange} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ─── Bottom Save Bar ─── */}
      <div className="border-t shrink-0 px-4 sm:px-6 py-3 bg-background/90 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto flex items-center justify-end gap-3">
          <SaveIndicator dirty={dirty} saving={saving} onSave={save} />
        </div>
      </div>

      {/* ─── Toast ─── */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-16 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-emerald-600 text-white text-xs font-medium shadow-lg z-50"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
