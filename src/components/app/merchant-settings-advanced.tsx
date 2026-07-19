"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { shopApi } from "@/lib/shop-api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Settings,
  Save,
  RotateCcw,
  Plus,
  Trash2,
  Truck,
  Layers,
  RefreshCw,
  CircleAlert,
  CheckCircle2,
  Star,
  Phone,
  Mail,
  MapPin,
  Clock,
  MessageCircle,
  CalendarClock,
  Percent,
  Sparkles,
  AlertTriangle,
  Printer,
  SlidersHorizontal,
  Palette,
  ChevronLeft,
  ShieldCheck,
  Lock,
  Check,
  Globe,
  DollarSign,
  ToggleLeft,
  Megaphone,
  Tag,
  Hash,
} from "lucide-react";
import { useShop } from "@/lib/shop-context";
import {
  FEATURES,
  FREE_FEATURES,
  TOTAL_FEATURES,
  TOTAL_FREE_FEATURES,
  TOTAL_PAID_FEATURES,
  countEnabledFeatures,
  isFeatureFree,
} from "@/lib/shop-features";
import { toast } from "sonner";
import {
  DEFAULT_SETTINGS,
  type AppSettings,
  type IntroSettings,
} from "@/lib/default-settings";
import type {
  ServiceSpec,
  SpecSection,
  SpecOption,
  ServiceType,
} from "@/lib/service-specs";
import type { DeliveryOption } from "@/lib/print-config";
import { ARAB_COUNTRIES, getCountry, formatCurrency } from "@/lib/countries";

// ============================================================
// Props
// ============================================================

interface MerchantSettingsAdvancedProps {
  shopId: string;
  shopSlug: string;
  adminPin: string;
  onSaved?: () => void;
}

// ============================================================
// Helper utilities
// ============================================================

/** Generate a short unique id */
function uid(prefix = "id"): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

/** Safe deep clone for JSON-serializable objects */
function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

/** Deep equality for JSON-serializable objects */
function deepEqual(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

/** Convert a string value to number safely */
function toNumber(value: string): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

/** Extended delivery option with enabled/estimatedHours */
interface MerchantDeliveryOption extends DeliveryOption {
  enabled?: boolean;
  estimatedHours?: number;
}

// ============================================================
// Small field component: label + input
// ============================================================

interface FieldProps {
  label: string;
  value: string | number;
  onChange: (v: string) => void;
  type?: "text" | "number";
  placeholder?: string;
  dir?: "rtl" | "ltr";
  className?: string;
  hint?: string;
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  dir,
  className,
  hint,
}: FieldProps) {
  return (
    <div className={`space-y-1.5 ${className ?? ""}`}>
      <Label className="text-xs font-medium dark:text-slate-400 text-slate-500">{label}</Label>
      <Input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        dir={dir}
        className="h-9 text-sm dark:border-slate-700 border-slate-200/60 focus:border-teal-400 focus:ring-teal-400/20"
      />
      {hint && <p className="text-[11px] dark:text-slate-500 text-slate-400">{hint}</p>}
    </div>
  );
}

// ============================================================
// Service type label map
// ============================================================

const SERVICE_TYPE_LABELS: Record<string, string> = {
  document: "مستند",
  photo: "صور",
  binding: "تجليد",
  copy: "نسخ",
  card: "بطاقات",
  poster: "ملصقات",
};

// ============================================================
// Section header component (teal right border)
// ============================================================

function SectionHeader({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType;
  title: string;
  description?: string;
}) {
  return (
    <div className="flex items-start gap-3 border-r-4 border-teal-500 pr-3 mb-1">
      <div className="w-9 h-9 rounded-lg bg-teal-50 flex items-center justify-center shrink-0">
        <Icon className="h-4 w-4 text-teal-600" />
      </div>
      <div>
        <h3 className="text-sm font-semibold dark:text-slate-100 text-slate-800">{title}</h3>
        {description && (
          <p className="text-[11px] dark:text-slate-500 text-slate-400 mt-0.5">{description}</p>
        )}
      </div>
    </div>
  );
}

// ============================================================
// Main component
// ============================================================

// ============================================================
// Features Tab — read-only view of active/locked features
// ============================================================

function FeaturesTab() {
  const { parsedFeatures, shop } = useShop();
  const enabledCount = countEnabledFeatures(parsedFeatures);
  const isPaid = shop?.plan === "paid";

  const freeFeatures = FEATURES.filter((f) => f.isFree);
  const paidFeatures = FEATURES.filter((f) => !f.isFree);
  const activePaidFeatures = paidFeatures.filter((f) => parsedFeatures[f.key] === true);
  const lockedPaidFeatures = paidFeatures.filter((f) => parsedFeatures[f.key] !== true);

  return (
    <div className="space-y-4">
      {/* Summary */}
      <Card className="dark:bg-slate-900 bg-slate-50 dark:border-slate-700 border-slate-200/60 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <SectionHeader
              icon={ShieldCheck}
              title="حالة الميزات"
              description="ميزات متجرك الحالية"
            />
            <Badge
              variant="outline"
              className="text-xs rounded-lg dark:border-slate-700 border-slate-200 dark:text-slate-400 text-slate-500"
            >
              {enabledCount}/{TOTAL_FEATURES} مفعّلة
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {isPaid ? (
            <div className="text-xs text-teal-700 bg-teal-50 border border-teal-200/80 rounded-lg p-3">
              ✨ الخطة المدفوعة — جميع الميزات مفعّلة ({TOTAL_FEATURES})
            </div>
          ) : (
            <div className="text-xs dark:text-slate-400 text-slate-500 dark:bg-slate-900 bg-slate-50 border dark:border-slate-700 border-slate-200/60 rounded-lg p-3">
              الخطة المجانية — {TOTAL_FREE_FEATURES} ميزات مجانية مفعّلة + {activePaidFeatures.length} ميزات مدفوعة مفعّلة من أصل {TOTAL_PAID_FEATURES}.
              <span className="text-teal-600 font-medium"> تواصل مع الإدارة للترقية.</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Free features — always active */}
      <Card className="bg-emerald-50/40 border-emerald-100/60 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-5 rounded-full bg-emerald-400" />
            <CardTitle className="text-sm font-bold text-emerald-700">
              ميزات مجانية ({freeFeatures.length})
            </CardTitle>
            <Badge
              variant="outline"
              className="text-[10px] rounded-md bg-emerald-100 text-emerald-600 border-emerald-200"
            >
              مفعّلة مجاناً
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {freeFeatures.map((f) => (
              <div
                key={f.key}
                className="flex items-center gap-2.5 dark:bg-slate-800 bg-white rounded-lg px-3 py-2.5 border border-emerald-100/80"
              >
                <div className="w-7 h-7 rounded-lg dark:bg-emerald-900/40 bg-emerald-100 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-medium dark:text-slate-200 text-slate-700 flex items-center gap-1.5">
                    {f.label}
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-600 font-medium">مفعّل مجاناً</span>
                  </div>
                  <div className="text-[10px] dark:text-slate-500 text-slate-400 truncate">{f.description}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Active paid features */}
      {activePaidFeatures.length > 0 && (
        <Card className="bg-teal-50/40 border-teal-100/60 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-5 rounded-full bg-teal-400" />
              <CardTitle className="text-sm font-bold text-teal-700">
                ميزات مدفوعة مفعّلة ({activePaidFeatures.length})
              </CardTitle>
              <Badge
                variant="outline"
                className="text-[10px] rounded-md bg-teal-100 text-teal-600 border-teal-200"
              >
                مفعّل
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {activePaidFeatures.map((f) => (
                <div
                  key={f.key}
                  className="flex items-center gap-2.5 dark:bg-slate-800 bg-white rounded-lg px-3 py-2.5 border border-teal-100/80"
                >
                  <div className="w-7 h-7 rounded-lg dark:bg-teal-900/40 bg-teal-100 flex items-center justify-center shrink-0">
                    <Check className="h-3.5 w-3.5 text-teal-600" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-medium dark:text-slate-200 text-slate-700 flex items-center gap-1.5">
                      {f.label}
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-teal-100 text-teal-600 font-medium">مفعّل</span>
                    </div>
                    <div className="text-[10px] dark:text-slate-500 text-slate-400 truncate">{f.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Locked paid features */}
      {lockedPaidFeatures.length > 0 && (
        <Card className="dark:bg-slate-900/60 bg-slate-50/60 dark:border-slate-700 border-slate-200/60 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-5 rounded-full dark:bg-slate-600 bg-slate-300" />
              <CardTitle className="text-sm font-bold dark:text-slate-400 text-slate-500">
                ميزات مقفلة ({lockedPaidFeatures.length})
              </CardTitle>
              <Badge
                variant="outline"
                className="text-[10px] rounded-md dark:bg-slate-800 bg-slate-100 dark:text-slate-400 text-slate-500 dark:border-slate-700 border-slate-200"
              >
                مقفل
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {lockedPaidFeatures.map((f) => (
                <div
                  key={f.key}
                  className="flex items-center gap-2.5 dark:bg-slate-800/60 bg-white/60 rounded-lg px-3 py-2.5 border dark:border-slate-700 border-slate-200/60 opacity-70"
                >
                  <div className="w-7 h-7 rounded-lg dark:bg-slate-800 bg-slate-100 flex items-center justify-center shrink-0">
                    <Lock className="h-3.5 w-3.5 dark:text-slate-500 text-slate-400" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-medium dark:text-slate-400 text-slate-500 flex items-center gap-1.5">
                      {f.label}
                      <span className="text-[9px] px-1 py-0.5 rounded dark:bg-slate-800 bg-slate-100 dark:text-slate-400 text-slate-500 font-medium">مقفل</span>
                    </div>
                    <div className="text-[10px] dark:text-slate-500 text-slate-400 truncate">{f.description}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="text-xs text-teal-600 bg-teal-50 border border-teal-200/80 rounded-lg p-3 mt-2">
              🔒 هذه الميزات متاحة فقط في الخطة المدفوعة. تواصل مع الإدارة للترقية.
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export function MerchantSettingsAdvanced({
  shopId: _shopId,
  shopSlug,
  adminPin,
  onSaved,
}: MerchantSettingsAdvancedProps) {
  const { shop, refreshShop } = useShop();
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [original, setOriginal] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [activeTab, setActiveTab] = useState("general");

  // Country state (Shop model field)
  const [selectedCountry, setSelectedCountry] = useState(shop?.country || "DZ");
  const [savingShopFields, setSavingShopFields] = useState(false);

  // Sync country from shop context when it refreshes
  useEffect(() => {
    if (shop?.country) setSelectedCountry(shop.country);
  }, [shop?.country]);

  // ---------- Load settings ----------
  const loadSettings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await shopApi("/api/settings");
      if (!res.ok) throw new Error("فشل تحميل الإعدادات");
      const data = (await res.json()) as AppSettings;
      const safe: AppSettings = {
        services: data.services ?? DEFAULT_SETTINGS.services,
        deliveryOptions: data.deliveryOptions ?? DEFAULT_SETTINGS.deliveryOptions,
        general: { ...DEFAULT_SETTINGS.general, ...(data.general ?? {}) },
        intro: { ...DEFAULT_SETTINGS.intro, ...(data.intro ?? {}) },
      };
      setSettings(safe);
      setOriginal(deepClone(safe));
    } catch (e) {
      toast.error("تعذّر تحميل الإعدادات", {
        description: (e as Error).message,
      });
      setSettings(deepClone(DEFAULT_SETTINGS));
      setOriginal(deepClone(DEFAULT_SETTINGS));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  // ---------- Change detection ----------
  const hasChanges = useMemo(() => {
    if (!settings || !original) return false;
    return !deepEqual(settings, original);
  }, [settings, original]);

  // ========== State updaters ==========

  /** Update a field in general settings */
  function updateGeneral<K extends keyof AppSettings["general"]>(
    key: K,
    value: AppSettings["general"][K],
  ) {
    setSettings((prev) =>
      prev
        ? { ...prev, general: { ...prev.general, [key]: value } }
        : prev,
    );
  }

  /** Update a field in intro settings */
  function updateIntro<K extends keyof IntroSettings>(
    key: K,
    value: IntroSettings[K],
  ) {
    setSettings((prev) => {
      if (!prev) return prev;
      return { ...prev, intro: { ...prev.intro, [key]: value } };
    });
  }

  /** Update a field in a specific service */
  function updateService(serviceIdx: number, patch: Partial<ServiceSpec>) {
    setSettings((prev) => {
      if (!prev) return prev;
      const services = [...prev.services];
      services[serviceIdx] = { ...services[serviceIdx], ...patch };
      return { ...prev, services };
    });
  }

  /** Update a field in a section within a service */
  function updateSection(
    serviceIdx: number,
    sectionIdx: number,
    patch: Partial<SpecSection>,
  ) {
    setSettings((prev) => {
      if (!prev) return prev;
      const services = prev.services.map((s, i) => {
        if (i !== serviceIdx) return s;
        const sections = s.sections.map((sec, j) =>
          j === sectionIdx ? { ...sec, ...patch } : sec,
        );
        return { ...s, sections };
      });
      return { ...prev, services };
    });
  }

  /** Update a field in a specific option */
  function updateOption(
    serviceIdx: number,
    sectionIdx: number,
    optionIdx: number,
    patch: Partial<SpecOption>,
  ) {
    setSettings((prev) => {
      if (!prev) return prev;
      const services = prev.services.map((s, i) => {
        if (i !== serviceIdx) return s;
        const sections = s.sections.map((sec, j) => {
          if (j !== sectionIdx) return sec;
          const options = sec.options.map((opt, k) =>
            k === optionIdx ? { ...opt, ...patch } : opt,
          );
          return { ...sec, options };
        });
        return { ...s, sections };
      });
      return { ...prev, services };
    });
  }

  /** Add a new option to a section */
  function addOption(serviceIdx: number, sectionIdx: number) {
    setSettings((prev) => {
      if (!prev) return prev;
      const services = prev.services.map((s, i) => {
        if (i !== serviceIdx) return s;
        const sections = s.sections.map((sec, j) => {
          if (j !== sectionIdx) return sec;
          const newOpt: SpecOption = {
            id: uid("opt"),
            label: "خيار جديد",
            emoji: "✨",
            description: "",
          };
          return { ...sec, options: [...sec.options, newOpt] };
        });
        return { ...s, sections };
      });
      return { ...prev, services };
    });
    toast.success("تمت إضافة خيار جديد");
  }

  /** Delete an option */
  function deleteOption(
    serviceIdx: number,
    sectionIdx: number,
    optionIdx: number,
  ) {
    setSettings((prev) => {
      if (!prev) return prev;
      const services = prev.services.map((s, i) => {
        if (i !== serviceIdx) return s;
        const sections = s.sections.map((sec, j) => {
          if (j !== sectionIdx) return sec;
          return {
            ...sec,
            options: sec.options.filter((_, k) => k !== optionIdx),
          };
        });
        return { ...s, sections };
      });
      return { ...prev, services };
    });
    toast.success("تم حذف الخيار");
  }

  /** Add a new section to a service */
  function addSection(serviceIdx: number) {
    setSettings((prev) => {
      if (!prev) return prev;
      const services = prev.services.map((s, i) => {
        if (i !== serviceIdx) return s;
        const newSection: SpecSection = {
          id: uid("sec"),
          title: "قسم جديد",
          hint: "",
          optionKey: `new_${uid("k")}`,
          options: [],
        };
        return { ...s, sections: [...s.sections, newSection] };
      });
      return { ...prev, services };
    });
    toast.success("تمت إضافة قسم جديد");
  }

  /** Add a new service */
  function addService() {
    setSettings((prev) => {
      if (!prev) return prev;
      const newType = `custom_${uid("")}`;
      const newService: ServiceSpec = {
        type: newType as ServiceType,
        name: "خدمة جديدة",
        emoji: "✨",
        description: "خدمة مخصصة",
        popularity: 50,
        basePricePerPage: 10,
        accepts: ["pdf", "docx", "jpg", "jpeg", "png", "webp"],
        isPopular: false,
        sections: [],
        hasPageCount: true,
        hasPrintRange: true,
        unit: "صفحة",
      };
      return { ...prev, services: [...prev.services, newService] };
    });
    toast.success("تمت إضافة خدمة جديدة");
  }

  /** Delete a service */
  function deleteService(serviceIdx: number) {
    setSettings((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        services: prev.services.filter((_, i) => i !== serviceIdx),
      };
    });
    toast.success("تم حذف الخدمة");
  }

  /** Delete a section */
  function deleteSection(serviceIdx: number, sectionIdx: number) {
    setSettings((prev) => {
      if (!prev) return prev;
      const services = prev.services.map((s, i) => {
        if (i !== serviceIdx) return s;
        return {
          ...s,
          sections: s.sections.filter((_, j) => j !== sectionIdx),
        };
      });
      return { ...prev, services };
    });
    toast.success("تم حذف القسم");
  }

  // ========== Delivery option helpers ==========

  function updateDelivery(
    idx: number,
    patch: Partial<MerchantDeliveryOption>,
  ) {
    setSettings((prev) => {
      if (!prev) return prev;
      const deliveryOptions = prev.deliveryOptions.map((d, i) =>
        i === idx ? { ...d, ...patch } : d,
      );
      return { ...prev, deliveryOptions };
    });
  }

  function toggleDeliveryEnabled(idx: number) {
    setSettings((prev) => {
      if (!prev) return prev;
      const del = prev.deliveryOptions[idx] as MerchantDeliveryOption;
      const deliveryOptions = prev.deliveryOptions.map((d, i) =>
        i === idx
          ? { ...d, enabled: !(del?.enabled ?? true) }
          : d,
      );
      return { ...prev, deliveryOptions };
    });
  }

  function addDelivery() {
    setSettings((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        deliveryOptions: [
          ...prev.deliveryOptions,
          {
            id: uid("del"),
            label: "خيار توصيل جديد",
            emoji: "🚚",
            description: "",
            badge: "",
            surcharge: 0,
            enabled: true,
            estimatedHours: 24,
          },
        ],
      };
    });
    toast.success("تمت إضافة خيار توصيل");
  }

  function deleteDelivery(idx: number) {
    setSettings((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        deliveryOptions: prev.deliveryOptions.filter((_, i) => i !== idx),
      };
    });
    toast.success("تم حذف خيار التوصيل");
  }

  // ========== Save / Reset / Discard ==========

  async function handleSave() {
    if (!settings) return;
    setSaving(true);
    try {
      const res = await shopApi("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "فشل الحفظ");
      }
      setOriginal(deepClone(settings));
      // تحديث بيانات المتجر لنعكس التغييرات في shop.settings
      refreshShop();
      onSaved?.();
      toast.success("تم حفظ الإعدادات بنجاح", {
        description: "ستظهر التغييرات للعملاء فوراً",
        icon: <CheckCircle2 className="h-4 w-4 text-emerald-500" />,
      });
    } catch (e) {
      toast.error("فشل حفظ الإعدادات", {
        description: (e as Error).message,
      });
    } finally {
      setSaving(false);
    }
  }

  // Save country/language (Shop model fields via /api/shops/[slug])
  async function handleSaveCountryLanguage() {
    if (!adminPin) {
      toast.error("لا يمكن الحفظ", { description: "كلمة المرور غير متوفرة. أعد تحميل الصفحة." });
      return;
    }
    setSavingShopFields(true);
    try {
      const res = await fetch(`/api/shops/${encodeURIComponent(shopSlug)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ country: selectedCountry, adminPin }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "فشل الحفظ");
      }
      toast.success("تم حفظ الدولة والعملة", {
        description: "ستظهر التغييرات للعملاء فوراً",
        icon: <CheckCircle2 className="h-4 w-4 text-emerald-500" />,
      });
      refreshShop();
    } catch (e) {
      toast.error("فشل حفظ الدولة والعملة", {
        description: (e as Error).message,
      });
    } finally {
      setSavingShopFields(false);
    }
  }

  async function handleReset() {
    setResetting(true);
    try {
      const res = await shopApi("/api/settings", { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "فشل إعادة التعيين");
      }
      const fresh = deepClone(DEFAULT_SETTINGS);
      setSettings(fresh);
      setOriginal(deepClone(fresh));
      toast.success("تمت إعادة التعيين للإعدادات الافتراضية", {
        description: "عادت كل القيم إلى الوضع الأصلي",
        icon: <RotateCcw className="h-4 w-4 text-amber-500" />,
      });
      setActiveTab("general");
    } catch (e) {
      toast.error("فشلت إعادة التعيين", {
        description: (e as Error).message,
      });
    } finally {
      setResetting(false);
    }
  }

  function handleDiscard() {
    if (!original) return;
    setSettings(deepClone(original));
    toast.info("تم التراجع عن التغييرات");
  }

  // ========== Loading state ==========

  if (loading || !settings) {
    return (
      <div className="flex flex-col items-center justify-center py-24 dark:text-slate-500 text-slate-400">
        <RefreshCw className="h-8 w-8 animate-spin mb-3 text-teal-500" />
        <p className="text-sm">جارٍ تحميل الإعدادات...</p>
      </div>
    );
  }

  // ============================================================
  // Render
  // ============================================================

  return (
    <div className="space-y-5" dir="rtl">
      {/* ===== Header ===== */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl bg-teal-600 flex items-center justify-center shrink-0 shadow-sm">
            <Settings className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2 dark:text-slate-100 text-slate-800">
              الإعدادات المتقدمة
              {hasChanges && (
                <Badge
                  variant="outline"
                  className="bg-amber-50 text-amber-700 border-amber-200 text-xs gap-1"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                  تغييرات غير محفوظة
                </Badge>
              )}
            </h1>
            <p className="text-xs dark:text-slate-500 text-slate-400 mt-0.5">
              إعدادات متقدمة: عامة، تسليم، ترحيب، خدمات
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {/* Reset to defaults */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="dark:text-slate-400 text-slate-500 dark:border-slate-700 border-slate-200/60 hover:bg-red-50 hover:text-red-600 hover:border-red-200 gap-1.5 h-9 text-xs"
                disabled={resetting}
              >
                <RotateCcw className="h-3.5 w-3.5" />
                استعادة الافتراضي
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent dir="rtl">
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2 text-red-600">
                  <AlertTriangle className="h-5 w-5" />
                  تأكيد إعادة التعيين
                </AlertDialogTitle>
                <AlertDialogDescription>
                  هل أنت متأكد من إعادة ضبط كل الإعدادات إلى القيم الافتراضية؟
                  سيتم حذف جميع التخصيصات نهائياً ولا يمكن التراجع.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>إلغاء</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleReset}
                  className="bg-red-600 text-white hover:bg-red-700 gap-1.5"
                >
                  <RotateCcw className="h-4 w-4" />
                  نعم، أعد التعيين
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {hasChanges && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleDiscard}
              disabled={saving}
              className="dark:text-slate-400 text-slate-500 dark:border-slate-700 border-slate-200/60 h-9 text-xs"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              تراجع
            </Button>
          )}

          <Button
            size="sm"
            onClick={handleSave}
            disabled={!hasChanges || saving}
            className="bg-teal-600 hover:bg-teal-700 text-white gap-1.5 h-9 text-xs"
          >
            {saving ? (
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Save className="h-3.5 w-3.5" />
            )}
            {hasChanges ? "حفظ التغييرات" : "لا توجد تغييرات"}
          </Button>
        </div>
      </div>

      {/* ===== Tabs ===== */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-5"
      >
        <TabsList className="grid w-full grid-cols-3 sm:grid-cols-5 h-auto p-1 dark:bg-slate-800 bg-slate-100 border dark:border-slate-700 border-slate-200/60 rounded-xl">
          <TabsTrigger
            value="general"
            className="flex items-center gap-1.5 py-2.5 text-xs sm:text-sm data-[state=active]:bg-teal-600 data-[state=active]:text-white rounded-lg"
          >
            <SlidersHorizontal className="h-4 w-4" />
            إعدادات عامة
          </TabsTrigger>
          <TabsTrigger
            value="delivery"
            className="flex items-center gap-1.5 py-2.5 text-xs sm:text-sm data-[state=active]:bg-teal-600 data-[state=active]:text-white rounded-lg"
          >
            <Truck className="h-4 w-4" />
            خيارات التسليم
          </TabsTrigger>
          <TabsTrigger
            value="intro"
            className="flex items-center gap-1.5 py-2.5 text-xs sm:text-sm data-[state=active]:bg-teal-600 data-[state=active]:text-white rounded-lg"
          >
            <Sparkles className="h-4 w-4" />
            شاشة الترحيب
          </TabsTrigger>
          <TabsTrigger
            value="services"
            className="flex items-center gap-1.5 py-2.5 text-xs sm:text-sm data-[state=active]:bg-teal-600 data-[state=active]:text-white rounded-lg"
          >
            <Layers className="h-4 w-4" />
            الخدمات المتقدمة
          </TabsTrigger>
          <TabsTrigger
            value="features"
            className="flex items-center gap-1.5 py-2.5 text-xs sm:text-sm data-[state=active]:bg-teal-600 data-[state=active]:text-white rounded-lg"
          >
            <ShieldCheck className="h-4 w-4" />
            الميزات
          </TabsTrigger>
        </TabsList>

        {/* ==========================================
            TAB 1: General Settings (إعدادات عامة)
            ========================================== */}
        <TabsContent value="general" className="space-y-4 outline-none">
          <Card className="dark:bg-slate-900 bg-slate-50 dark:border-slate-700 border-slate-200/60 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
            <CardHeader className="pb-3">
              <SectionHeader
                icon={Percent}
                title="الخصومات والحدود"
                description="خصومات الكميات والإعدادات المالية"
              />
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Field
                label="خصم 10 نسخ (%)"
                type="number"
                value={settings.general.quantityDiscount10}
                onChange={(v) =>
                  updateGeneral("quantityDiscount10", toNumber(v))
                }
                hint="يُطبّق تلقائياً عند 10 نسخ فأكثر"
              />
              <Field
                label="خصم 50 نسخة (%)"
                type="number"
                value={settings.general.quantityDiscount50}
                onChange={(v) =>
                  updateGeneral("quantityDiscount50", toNumber(v))
                }
                hint="يُطبّق تلقائياً عند 50 نسخة فأكثر"
              />
              <Field
                label="خصم الوجهين (%)"
                type="number"
                value={settings.general.sidesDiscount}
                onChange={(v) => updateGeneral("sidesDiscount", toNumber(v))}
                hint="نسبة التوفير عند الطباعة على الوجهين"
              />
              <Field
                label="أدنى مبلغ للطلب"
                type="number"
                value={settings.general.minOrder}
                onChange={(v) => updateGeneral("minOrder", toNumber(v))}
                hint={`الحد الأدنى لقيمة الطلب المسموح به (${getCountry(selectedCountry)?.currencySymbol || "د.ج"})`}
              />
              <Field
                label="حذف الطلبات القديمة تلقائياً (أيام)"
                type="number"
                value={settings.general.autoDeleteDays}
                onChange={(v) =>
                  updateGeneral("autoDeleteDays", toNumber(v))
                }
                hint="تُحذف الطلبات المكتملة بعد هذه المدة"
              />
            </CardContent>
          </Card>

          <Card className="dark:bg-slate-900 bg-slate-50 dark:border-slate-700 border-slate-200/60 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
            <CardHeader className="pb-3">
              <SectionHeader
                icon={Clock}
                title="معلومات المتجر"
                description="تظهر في واجهة العملاء والتذييل"
              />
            </CardHeader>
            <CardContent className="space-y-4">
              <Field
                label="ساعات العمل"
                value={settings.general.workHours}
                onChange={(v) => updateGeneral("workHours", v)}
                placeholder="السبت - الخميس: 8:00 ص — 7:00 م"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium dark:text-slate-400 text-slate-500 flex items-center gap-1.5">
                    <MessageCircle className="h-3.5 w-3.5 text-emerald-500" />
                    رقم الواتساب
                  </Label>
                  <Input
                    value={settings.general.whatsappNumber}
                    onChange={(e) =>
                      updateGeneral("whatsappNumber", e.target.value)
                    }
                    dir="ltr"
                    className="h-9 text-sm dark:border-slate-700 border-slate-200/60 focus:border-teal-400 focus:ring-teal-400/20"
                    placeholder="0560000000"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium dark:text-slate-400 text-slate-500 flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-blue-500" />
                    رقم الهاتف
                  </Label>
                  <Input
                    value={settings.general.phoneNumber}
                    onChange={(e) =>
                      updateGeneral("phoneNumber", e.target.value)
                    }
                    dir="ltr"
                    className="h-9 text-sm dark:border-slate-700 border-slate-200/60 focus:border-teal-400 focus:ring-teal-400/20"
                    placeholder="0560000000"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium dark:text-slate-400 text-slate-500 flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-rose-500" />
                  البريد الإلكتروني
                </Label>
                <Input
                  value={settings.general.email}
                  onChange={(e) => updateGeneral("email", e.target.value)}
                  dir="ltr"
                  className="h-9 text-sm dark:border-slate-700 border-slate-200/60 focus:border-teal-400 focus:ring-teal-400/20"
                  placeholder="contact@example.com"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium dark:text-slate-400 text-slate-500 flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-amber-500" />
                  العنوان
                </Label>
                <Textarea
                  value={settings.general.address}
                  onChange={(e) => updateGeneral("address", e.target.value)}
                  className="text-sm min-h-[60px] dark:border-slate-700 border-slate-200/60 focus:border-teal-400 focus:ring-teal-400/20"
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          {/* ==========================================
              الدولة والعملة
              ========================================== */}
          <Card className="dark:bg-slate-900 bg-slate-50 dark:border-slate-700 border-slate-200/60 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
            <CardHeader className="pb-3">
              <SectionHeader
                icon={Globe}
                title="الدولة والعملة"
                description="حدد الدولة — العملة تتحدد تلقائياً حسب الدولة"
              />
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Country dropdown */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium dark:text-slate-400 text-slate-500 flex items-center gap-1.5">
                  <Globe className="h-3.5 w-3.5 text-teal-500" />
                  الدولة
                </Label>
                <Select
                  value={selectedCountry}
                  onValueChange={(v) => setSelectedCountry(v)}
                >
                  <SelectTrigger className="h-9 text-sm dark:border-slate-700 border-slate-200/60 focus:border-teal-400 focus:ring-teal-400/20">
                    <SelectValue placeholder="اختر الدولة" />
                  </SelectTrigger>
                  <SelectContent className="max-h-64 overflow-y-auto">
                    {ARAB_COUNTRIES.map((c) => (
                      <SelectItem key={c.code} value={c.code}>
                        <span className="flex items-center gap-2">
                          <span>{c.flag}</span>
                          <span>{c.nameAr}</span>
                          <span className="text-[10px] dark:text-slate-500 text-slate-400">({c.code})</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Currency display (read-only) */}
              {(() => {
                const country = getCountry(selectedCountry);
                return (
                  <div className="flex items-center gap-4 p-3 rounded-lg dark:bg-slate-800 bg-white border dark:border-slate-700 border-slate-200/60">
                    <div className="flex items-center gap-2 flex-1">
                      <DollarSign className="h-4 w-4 text-amber-500 shrink-0" />
                      <div>
                        <div className="text-xs dark:text-slate-400 text-slate-500">العملة</div>
                        <div className="text-sm font-semibold dark:text-slate-200 text-slate-700">
                          {country?.currencySymbol} {country?.currencyCode}
                          <span className="text-xs dark:text-slate-500 text-slate-400 font-normal mr-2">({country?.nameAr})</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-left">
                      <div className="text-xs dark:text-slate-500 text-slate-400">مثال</div>
                      <div className="text-sm font-medium dark:text-slate-300 text-slate-600">
                        {formatCurrency(1500, selectedCountry)}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Save button for country/language */}
              {(selectedCountry !== shop?.country) && (
                <Button
                  size="sm"
                  onClick={handleSaveCountryLanguage}
                  disabled={savingShopFields}
                  className="bg-teal-600 hover:bg-teal-700 text-white gap-1.5 h-9 text-xs"
                >
                  {savingShopFields ? (
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Save className="h-3.5 w-3.5" />
                  )}
                  حفظ الدولة والعملة
                </Button>
              )}
            </CardContent>
          </Card>

          {/* ==========================================
              تخصيص إضافي
              ========================================== */}
          <Card className="dark:bg-slate-900 bg-slate-50 dark:border-slate-700 border-slate-200/60 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
            <CardHeader className="pb-3">
              <SectionHeader
                icon={Sparkles}
                title="تخصيص إضافي"
                description="تحكم في مظهر واجهة العملاء والسلوك الأساسي"
              />
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Business name override */}
              <Field
                label="اسم الأعمال (بديل عن اسم المتجر)"
                value={settings.general.businessName ?? ""}
                onChange={(v) => updateGeneral("businessName", v)}
                placeholder="إذا تركته فارغاً يُعرض اسم المتجر الافتراضي"
                hint="يظهر في رأس الصفحة للعملاء بدلاً من اسم المتجر"
              />

              {/* Custom tagline */}
              <Field
                label="شعار نصي مخصص"
                value={settings.general.tagline ?? ""}
                onChange={(v) => updateGeneral("tagline", v)}
                placeholder="أسرع طباعة في المدينة"
                hint="يظهر أسفل اسم المتجر في صفحة العملاء"
              />

              {/* WhatsApp button number */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium dark:text-slate-400 text-slate-500 flex items-center gap-1.5">
                  <MessageCircle className="h-3.5 w-3.5 text-emerald-500" />
                  رقم الواتساب للزر العائم
                </Label>
                <Input
                  value={settings.general.whatsappButtonNumber ?? ""}
                  onChange={(e) => updateGeneral("whatsappButtonNumber", e.target.value)}
                  dir="ltr"
                  className="h-9 text-sm dark:border-slate-700 border-slate-200/60 focus:border-teal-400 focus:ring-teal-400/20"
                  placeholder="اتركه فارغاً لاستخدام رقم الواتساب الرئيسي"
                />
                <p className="text-[11px] dark:text-slate-500 text-slate-400">
                  رقم منفصل يُستخدم لزر واتساب العائم في صفحة العملاء. إذا فارغ يُستخدم الرقم الرئيسي.
                </p>
              </div>

              {/* Enable order tracking toggle */}
              <div className="flex items-center justify-between p-3 rounded-lg dark:bg-slate-800 bg-white border dark:border-slate-700 border-slate-200/60">
                <div>
                  <div className="text-sm font-medium dark:text-slate-200 text-slate-700 flex items-center gap-2">
                    <ToggleLeft className="h-4 w-4 text-teal-500" />
                    تفعيل تتبع الطلبات
                  </div>
                  <div className="text-xs dark:text-slate-500 text-slate-400 mt-0.5">
                    السماح للعملاء بتتبع طلباتهم عبر الرقم
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] dark:text-slate-500 text-slate-400">
                    {settings.general.enableOrderTracking ? "مفعّل" : "معطّل"}
                  </span>
                  <Switch
                    checked={settings.general.enableOrderTracking ?? true}
                    onCheckedChange={(v) => updateGeneral("enableOrderTracking", v)}
                  />
                </div>
              </div>

              {/* Welcome message */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium dark:text-slate-400 text-slate-500 flex items-center gap-1.5">
                  <Megaphone className="h-3.5 w-3.5 text-rose-500" />
                  رسالة الترحيب
                </Label>
                <Textarea
                  value={settings.general.welcomeMessage ?? ""}
                  onChange={(e) => updateGeneral("welcomeMessage", e.target.value)}
                  className="text-sm min-h-[60px] dark:border-slate-700 border-slate-200/60 focus:border-teal-400 focus:ring-teal-400/20"
                  rows={2}
                  placeholder="رسالة ترحيب مخصصة تظهر للعملاء (اختياري)"
                />
                <p className="text-[11px] dark:text-slate-500 text-slate-400">
                  إذا تركتها فارغة لن تظهر رسالة إضافية
                </p>
              </div>

              {/* Minimum order amount */}
              <Field
                label="الحد الأدنى للطلب"
                type="number"
                value={settings.general.minOrderAmount ?? 0}
                onChange={(v) => updateGeneral("minOrderAmount", toNumber(v))}
                hint={`بالعملة المحلية (${getCountry(selectedCountry)?.currencySymbol || "د.ج"}). 0 = بدون حد أدنى`}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ==========================================
            TAB 2: Delivery Options (خيارات التسليم)
            ========================================== */}
        <TabsContent value="delivery" className="space-y-4 outline-none">
          <Card className="dark:bg-slate-900 bg-slate-50 dark:border-slate-700 border-slate-200/60 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
            <CardContent className="p-4 flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-teal-50 flex items-center justify-center shrink-0">
                <Truck className="h-4 w-4 text-teal-600" />
              </div>
              <div className="text-xs dark:text-slate-500 text-slate-400 leading-relaxed">
                تحكّم في خيارات التوصيل المعروضة للعملاء. يمكنك تفعيل أو تعطيل
                كل خيار، وتعديل الرسوم والوقت المتوقع.
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {settings.deliveryOptions.map((del, dIdx) => {
              const mdel = del as MerchantDeliveryOption;
              const isEnabled = mdel.enabled ?? true;
              return (
                <Card
                  key={del.id}
                  className={`dark:bg-slate-900 bg-slate-50 border rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden transition-opacity ${
                    isEnabled
                      ? "dark:border-slate-700 border-slate-200/60"
                      : "dark:border-slate-700 border-slate-200/40 opacity-60"
                  }`}
                >
                  <CardHeader className="pb-3 dark:bg-slate-800/50 bg-white/50">
                    <div className="flex items-center justify-between gap-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <span className="text-lg">{del.emoji}</span>
                        <Input
                          value={del.label}
                          onChange={(e) =>
                            updateDelivery(dIdx, { label: e.target.value })
                          }
                          className="h-8 text-sm max-w-[180px] dark:border-slate-700 border-slate-200/60"
                        />
                        {isEnabled ? (
                          <Badge className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200">
                            مفعّل
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] dark:text-slate-500 text-slate-400">
                            معطّل
                          </Badge>
                        )}
                      </CardTitle>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50"
                        onClick={() => deleteDelivery(dIdx)}
                        title="حذف خيار التوصيل"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <CardDescription className="text-xs mt-1">
                      معرّف:{" "}
                      <span dir="ltr" className="font-mono dark:text-slate-500 text-slate-400">
                        {del.id}
                      </span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 space-y-3">
                    {/* Enable toggle */}
                    <div className="flex items-center justify-between p-2.5 rounded-lg dark:bg-slate-800 bg-white border dark:border-slate-700 border-slate-200/60">
                      <span className="text-xs dark:text-slate-300 text-slate-600 font-medium">
                        تفعيل / تعطيل
                      </span>
                      <Switch
                        checked={isEnabled}
                        onCheckedChange={() => toggleDeliveryEnabled(dIdx)}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <Field
                        label="الإيموجي"
                        value={del.emoji}
                        onChange={(v) =>
                          updateDelivery(dIdx, { emoji: v })
                        }
                        dir="ltr"
                      />
                      <Field
                        label="الشارة"
                        value={del.badge ?? ""}
                        onChange={(v) =>
                          updateDelivery(dIdx, { badge: v })
                        }
                        placeholder="اختياري"
                      />
                    </div>
                    <Field
                      label="الوصف"
                      value={del.description}
                      onChange={(v) =>
                        updateDelivery(dIdx, { description: v })
                      }
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <Field
                        label="رسوم إضافية (د.ج)"
                        type="number"
                        value={del.surcharge}
                        onChange={(v) =>
                          updateDelivery(dIdx, {
                            surcharge: toNumber(v),
                          })
                        }
                        hint="0 = بدون رسوم"
                      />
                      <Field
                        label="الوقت المتوقع (ساعات)"
                        type="number"
                        value={mdel.estimatedHours ?? 0}
                        onChange={(v) =>
                          updateDelivery(dIdx, {
                            estimatedHours: toNumber(v),
                          })
                        }
                        hint="0 = حسب الحساب التلقائي"
                      />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Button
            variant="outline"
            className="w-full border-dashed h-11 text-sm gap-1.5 dark:text-slate-500 text-slate-400 dark:hover:text-slate-300 hover:text-slate-600 dark:border-slate-700 border-slate-200/60 hover:border-teal-300 rounded-xl"
            onClick={addDelivery}
          >
            <Plus className="h-4 w-4" />
            إضافة خيار توصيل جديد
          </Button>
        </TabsContent>

        {/* ==========================================
            TAB 3: Intro / Welcome Screen (شاشة الترحيب)
            ========================================== */}
        <TabsContent value="intro" className="space-y-4 outline-none">
          <Card className="dark:bg-slate-900 bg-slate-50 dark:border-slate-700 border-slate-200/60 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
            <CardContent className="p-4 flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-teal-50 flex items-center justify-center shrink-0">
                <Sparkles className="h-4 w-4 text-teal-600" />
              </div>
              <div className="text-xs dark:text-slate-500 text-slate-400 leading-relaxed">
                خصّص شاشة الترحيب التي تظهر عند دخول العميل. يمكنك تغيير
                العنوان، الألوان، المدة، والمحتوى. اضغط &quot;حفظ
                التغييرات&quot; لتثبيت التعديلات.
              </div>
            </CardContent>
          </Card>

          <Card className="dark:bg-slate-900 bg-slate-50 dark:border-slate-700 border-slate-200/60 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
            <CardHeader>
              <SectionHeader
                icon={Palette}
                title="إعدادات شاشة الترحيب"
                description="عدّل محتوى ومظهر شاشة الترحيب"
              />
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Enable toggle */}
              <div className="flex items-center justify-between p-3 rounded-lg dark:bg-slate-800 bg-white border dark:border-slate-700 border-slate-200/60">
                <div>
                  <div className="text-sm font-medium dark:text-slate-200 text-slate-700">
                    تفعيل شاشة الترحيب
                  </div>
                  <div className="text-xs dark:text-slate-500 text-slate-400">
                    إذا تم التعطيل، سيُفتح الموقع مباشرة بدون إنترو
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] dark:text-slate-500 text-slate-400">
                    {settings.intro?.enabled ? "مفعّل" : "معطّل"}
                  </span>
                  <Switch
                    checked={settings.intro?.enabled ?? true}
                    onCheckedChange={(v) => updateIntro("enabled", v)}
                  />
                </div>
              </div>

              {/* Title & Subtitle */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field
                  label="العنوان الرئيسي"
                  value={settings.intro?.title ?? ""}
                  onChange={(v) => updateIntro("title", v)}
                  placeholder="طيف"
                />
                <Field
                  label="الشعار السفلي"
                  value={settings.intro?.subtitle ?? ""}
                  onChange={(v) => updateIntro("subtitle", v)}
                  placeholder="اطبع بسهولة — أسرع من واتساب"
                />
              </div>

              {/* Emoji & Footer */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field
                  label="الإيموجي / الأيقونة"
                  value={settings.intro?.emoji ?? ""}
                  onChange={(v) => updateIntro("emoji", v)}
                  placeholder="🖨️"
                  dir="ltr"
                  hint="ضع إيموجي أو اتركه فارغاً لأيقونة افتراضية"
                />
                <Field
                  label="نص التذييل"
                  value={settings.intro?.footerText ?? ""}
                  onChange={(v) => updateIntro("footerText", v)}
                  placeholder="صُمّم بحب ❤️"
                />
              </div>

              {/* Colors */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium dark:text-slate-400 text-slate-500">
                    لون الخلفية
                  </Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={settings.intro?.bgColor ?? "#1a1a1a"}
                      onChange={(e) => updateIntro("bgColor", e.target.value)}
                      className="w-10 h-10 rounded-lg border dark:border-slate-700 border-slate-200/60 cursor-pointer"
                    />
                    <Field
                      value={settings.intro?.bgColor ?? "#1a1a1a"}
                      onChange={(v) => updateIntro("bgColor", v)}
                      placeholder="#1a1a1a"
                      dir="ltr"
                      className="flex-1"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium dark:text-slate-400 text-slate-500">
                    اللون المميز
                  </Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={
                        settings.intro?.accentColor ?? "#D4AF37"
                      }
                      onChange={(e) =>
                        updateIntro("accentColor", e.target.value)
                      }
                      className="w-10 h-10 rounded-lg border dark:border-slate-700 border-slate-200/60 cursor-pointer"
                    />
                    <Field
                      value={
                        settings.intro?.accentColor ?? "#D4AF37"
                      }
                      onChange={(v) => updateIntro("accentColor", v)}
                      placeholder="#D4AF37"
                      dir="ltr"
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>

              {/* Duration */}
              <Field
                label="مدة العرض (بالملي ثانية — 3000 = 3 ثوانٍ)"
                type="number"
                value={settings.intro?.duration ?? 4200}
                onChange={(v) => updateIntro("duration", toNumber(v))}
                placeholder="4200"
                hint="الحد الأدنى 2000 (ثانيتان)، الحد الأقصى 10000 (10 ثوانٍ)"
              />

              {/* Extra toggles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-center justify-between p-3 rounded-lg dark:bg-slate-800 bg-white border dark:border-slate-700 border-slate-200/60">
                  <span className="text-sm dark:text-slate-200 text-slate-700">شريط التحميل</span>
                  <Switch
                    checked={settings.intro?.showProgress ?? true}
                    onCheckedChange={(v) => updateIntro("showProgress", v)}
                  />
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg dark:bg-slate-800 bg-white border dark:border-slate-700 border-slate-200/60">
                  <span className="text-sm dark:text-slate-200 text-slate-700">
                    الحلقة الدوارة
                  </span>
                  <Switch
                    checked={settings.intro?.showSpinningRing ?? true}
                    onCheckedChange={(v) =>
                      updateIntro("showSpinningRing", v)
                    }
                  />
                </div>
              </div>

              {/* Live preview */}
              <div className="rounded-xl border dark:border-slate-700 border-slate-200/60 overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
                <div className="px-4 py-2 bg-teal-50 border-b dark:border-slate-700 border-slate-200/60 text-xs font-bold text-teal-700">
                  معاينة مباشرة
                </div>
                <div
                  className="flex flex-col items-center justify-center gap-3 py-8"
                  style={{
                    backgroundColor: settings.intro?.bgColor ?? "#1a1a1a",
                  }}
                >
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg text-3xl"
                    style={{
                      background: `linear-gradient(135deg, ${settings.intro?.accentColor ?? "#D4AF37"}, ${settings.intro?.accentColor ?? "#D4AF37"}CC)`,
                    }}
                  >
                    {settings.intro?.emoji &&
                    settings.intro.emoji.length <= 4 ? (
                      settings.intro.emoji
                    ) : (
                      <Printer
                        className="h-8 w-8"
                        style={{
                          color: settings.intro?.bgColor ?? "#1a1a1a",
                        }}
                      />
                    )}
                  </div>
                  <h3 className="text-xl font-bold text-white">
                    {settings.intro?.title}
                  </h3>
                  {settings.intro?.subtitle && (
                    <p
                      className="text-sm font-medium"
                      style={{
                        color: settings.intro?.accentColor ?? "#D4AF37",
                      }}
                    >
                      {settings.intro.subtitle}
                    </p>
                  )}
                  {settings.intro?.showProgress && (
                    <div className="w-24 h-1 rounded-full bg-neutral-700 overflow-hidden mt-1">
                      <div
                        className="h-full rounded-full"
                        style={{
                          backgroundColor:
                            settings.intro?.accentColor ?? "#D4AF37",
                          width: "60%",
                        }}
                      />
                    </div>
                  )}
                  {settings.intro?.footerText && (
                    <p className="text-xs text-neutral-500 mt-2">
                      {settings.intro.footerText}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ==========================================
            TAB 4: Advanced Service Specs (الخدمات المتقدمة)
            ========================================== */}
        <TabsContent value="services" className="space-y-4 outline-none">
          <Card className="dark:bg-slate-900 bg-slate-50 dark:border-slate-700 border-slate-200/60 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
            <CardContent className="p-4 flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-teal-50 flex items-center justify-center shrink-0">
                <Layers className="h-4 w-4 text-teal-600" />
              </div>
              <div className="text-xs dark:text-slate-500 text-slate-400 leading-relaxed">
                اضغط على أي خدمة لتوسيعها وتعديل أقسامها وخياراتها.
                تذكر أن الحقول الرقمية مثل المضاعف تؤثر مباشرة
                في حساب الأسعار.
              </div>
            </CardContent>
          </Card>

          <Accordion type="multiple" className="space-y-3">
            {settings.services.map((service, sIdx) => (
              <AccordionItem
                key={service.type}
                value={`service-${service.type}`}
                className="border dark:border-slate-700 border-slate-200/60 rounded-xl dark:bg-slate-800 bg-white overflow-hidden px-0 data-[state=open]:shadow-[0_1px_3px_rgba(0,0,0,0.06)]"
              >
                <AccordionTrigger className="px-4 hover:no-underline dark:hover:bg-slate-700 hover:bg-slate-50">
                  <div className="flex items-center gap-3 w-full pr-2">
                    <div className="w-10 h-10 rounded-lg dark:bg-teal-900/40 bg-teal-100 flex items-center justify-center text-xl shrink-0">
                      {service.emoji}
                    </div>
                    <div className="flex-1 text-right">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm dark:text-slate-100 text-slate-800">
                          {service.name}
                        </span>
                        <Badge
                          variant="outline"
                          className="text-xs dark:bg-slate-900 bg-slate-50 dark:text-slate-400 text-slate-500 dark:border-slate-700 border-slate-200/60"
                        >
                          {SERVICE_TYPE_LABELS[service.type] || service.type}
                        </Badge>
                        {service.isPopular && (
                          <Badge className="text-xs bg-teal-100 text-teal-700 border-teal-200 gap-0.5">
                            <Star className="h-2.5 w-2.5 fill-current" />
                            شائع
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs dark:text-slate-500 text-slate-400 mt-0.5">
                        {service.description} · {service.sections.length} قسم
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-left shrink-0">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50"
                            title="حذف الخدمة"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent dir="rtl">
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              حذف خدمة &quot;{service.name}&quot;؟
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              سيتم حذف الخدمة نهائياً من القائمة. الطلبات
                              الحالية لن تتأثر.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>إلغاء</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteService(sIdx)}
                              className="bg-red-600 text-white hover:bg-red-700"
                            >
                              حذف الخدمة
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                      <div>
                        <div className="text-sm font-bold text-teal-600">
                          {service.basePricePerPage} د.ج
                        </div>
                        <div className="text-xs dark:text-slate-500 text-slate-400">
                          لكل صفحة
                        </div>
                      </div>
                    </div>
                  </div>
                </AccordionTrigger>

                <AccordionContent className="px-4 pb-4 space-y-4">
                  {/* Service basic properties */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3 rounded-lg dark:bg-slate-900 bg-slate-50 border dark:border-slate-700 border-slate-200/60">
                    <Field
                      label="اسم الخدمة"
                      value={service.name}
                      onChange={(v) =>
                        updateService(sIdx, { name: v })
                      }
                      className="col-span-2"
                    />
                    <Field
                      label="الإيموجي"
                      value={service.emoji}
                      onChange={(v) =>
                        updateService(sIdx, { emoji: v })
                      }
                      dir="ltr"
                    />
                    <Field
                      label="السعر الأساسي/صفحة"
                      type="number"
                      value={service.basePricePerPage}
                      onChange={(v) =>
                        updateService(sIdx, {
                          basePricePerPage: toNumber(v),
                        })
                      }
                    />
                    <Field
                      label="الوصف"
                      value={service.description}
                      onChange={(v) =>
                        updateService(sIdx, { description: v })
                      }
                      className="col-span-2"
                    />
                    <Field
                      label="الشعبية (0-100)"
                      type="number"
                      value={service.popularity}
                      onChange={(v) =>
                        updateService(sIdx, {
                          popularity: toNumber(v),
                        })
                      }
                    />
                    <div className="flex items-end pb-1">
                      <label className="flex items-center gap-2 text-xs cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={!!service.isPopular}
                          onChange={(e) =>
                            updateService(sIdx, {
                              isPopular: e.target.checked,
                            })
                          }
                          className="w-4 h-4 rounded accent-teal-600"
                        />
                        <span className="dark:text-slate-400 text-slate-500">خدمة شائعة</span>
                      </label>
                    </div>
                  </div>

                  {/* Service flags */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="flex items-center justify-between p-3 rounded-lg dark:bg-slate-800 bg-white border dark:border-slate-700 border-slate-200/60">
                      <div>
                        <div className="text-xs font-medium dark:text-slate-300 text-slate-600">
                          تعتمد على عدد الصفحات
                        </div>
                        <div className="text-[11px] dark:text-slate-500 text-slate-400">
                          hasPageCount
                        </div>
                      </div>
                      <Switch
                        checked={service.hasPageCount ?? true}
                        onCheckedChange={(v) =>
                          updateService(sIdx, { hasPageCount: v })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg dark:bg-slate-800 bg-white border dark:border-slate-700 border-slate-200/60">
                      <div>
                        <div className="text-xs font-medium dark:text-slate-300 text-slate-600">
                          نطاق الطباعة
                        </div>
                        <div className="text-[11px] dark:text-slate-500 text-slate-400">
                          hasPrintRange
                        </div>
                      </div>
                      <Switch
                        checked={service.hasPrintRange ?? false}
                        onCheckedChange={(v) =>
                          updateService(sIdx, { hasPrintRange: v })
                        }
                      />
                    </div>
                    <Field
                      label="أنواع الملفات المقبولة (مفصولة بفواصل)"
                      value={service.accepts.join(", ")}
                      onChange={(v) =>
                        updateService(sIdx, {
                          accepts: v
                            .split(",")
                            .map((s) => s.trim().toUpperCase())
                            .filter(Boolean),
                        })
                      }
                      dir="ltr"
                      hint="مثال: PDF, DOCX, JPG, PNG"
                    />
                  </div>

                  {/* Sections */}
                  <div className="space-y-3">
                    <div className="border-r-4 border-teal-500 pr-3">
                      <h4 className="text-sm font-semibold dark:text-slate-200 text-slate-700">
                        الأقسام ({service.sections.length})
                      </h4>
                      <p className="text-[11px] dark:text-slate-500 text-slate-400">
                        أقسام خيارات الخدمة
                      </p>
                    </div>

                    {service.sections.map((section, secIdx) => (
                      <div
                        key={section.id}
                        className="rounded-lg border dark:border-slate-700 border-slate-200/60 dark:bg-slate-800 bg-white overflow-hidden"
                      >
                        {/* Section header */}
                        <div className="flex items-center justify-between gap-2 p-3 border-b dark:border-slate-700 border-slate-200/60 dark:bg-slate-900/50 bg-slate-50/50">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <ChevronLeft className="h-3.5 w-3.5 dark:text-slate-500 text-slate-400 shrink-0" />
                            <span className="text-xs font-medium dark:text-slate-500 text-slate-400 shrink-0">
                              القسم {secIdx + 1}
                            </span>
                            <Input
                              value={section.title}
                              onChange={(e) =>
                                updateSection(sIdx, secIdx, {
                                  title: e.target.value,
                                })
                              }
                              className="h-8 text-sm flex-1 min-w-0 dark:border-slate-700 border-slate-200/60"
                            />
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50"
                            onClick={() => deleteSection(sIdx, secIdx)}
                            title="حذف القسم"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>

                        {/* Section details */}
                        <div className="p-3 space-y-3">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <Field
                              label="تلميح"
                              value={section.hint ?? ""}
                              onChange={(v) =>
                                updateSection(sIdx, secIdx, { hint: v })
                              }
                            />
                            <Field
                              label="المعرّف الفريد للخيار"
                              value={section.optionKey}
                              onChange={(v) =>
                                updateSection(sIdx, secIdx, {
                                  optionKey: v,
                                })
                              }
                              dir="ltr"
                            />
                            <div className="space-y-1.5">
                              <Label className="text-xs font-medium dark:text-slate-400 text-slate-500">
                                نوع الاختيار
                              </Label>
                              <Select
                                value={
                                  section.multiple ? "multiple" : "single"
                                }
                                onValueChange={(v) =>
                                  updateSection(sIdx, secIdx, {
                                    multiple: v === "multiple",
                                  })
                                }
                              >
                                <SelectTrigger className="h-9 text-sm dark:border-slate-700 border-slate-200/60">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="single">
                                    اختيار واحد
                                  </SelectItem>
                                  <SelectItem value="multiple">
                                    اختيار متعدد
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          {/* Options */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label className="text-xs font-medium dark:text-slate-400 text-slate-500">
                                الخيارات ({section.options.length})
                              </Label>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs gap-1 dark:border-slate-700 border-slate-200/60 text-teal-600 dark:hover:bg-teal-900/30 hover:bg-teal-50 hover:border-teal-200"
                                onClick={() => addOption(sIdx, secIdx)}
                              >
                                <Plus className="h-3 w-3" />
                                خيار
                              </Button>
                            </div>

                            {section.options.length === 0 ? (
                              <div className="text-center py-4 text-xs dark:text-slate-500 text-slate-400 border border-dashed dark:border-slate-700 border-slate-200/60 rounded-lg">
                                لا توجد خيارات. اضغط &quot;خيار&quot;
                                للإضافة.
                              </div>
                            ) : (
                              <div className="space-y-2">
                                {section.options.map((opt, oIdx) => (
                                  <div
                                    key={opt.id}
                                    className="rounded-lg border dark:border-slate-700 border-slate-200/60 p-3 dark:bg-slate-900/50 bg-slate-50/50 space-y-2"
                                  >
                                    <div className="flex items-center gap-2">
                                      <span className="text-base shrink-0">
                                        {opt.emoji || "•"}
                                      </span>
                                      <Input
                                        value={opt.label}
                                        onChange={(e) =>
                                          updateOption(
                                            sIdx,
                                            secIdx,
                                            oIdx,
                                            { label: e.target.value },
                                          )
                                        }
                                        className="h-8 text-sm font-medium flex-1 dark:border-slate-700 border-slate-200/60"
                                      />
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50 shrink-0"
                                        onClick={() =>
                                          deleteOption(
                                            sIdx,
                                            secIdx,
                                            oIdx,
                                          )
                                        }
                                        title="حذف الخيار"
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </Button>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                      <Field
                                        label="الإيموجي"
                                        value={opt.emoji ?? ""}
                                        onChange={(v) =>
                                          updateOption(
                                            sIdx,
                                            secIdx,
                                            oIdx,
                                            { emoji: v },
                                          )
                                        }
                                        dir="ltr"
                                      />
                                      <Field
                                        label="سعر ثابت"
                                        type="number"
                                        value={opt.price ?? 0}
                                        onChange={(v) =>
                                          updateOption(
                                            sIdx,
                                            secIdx,
                                            oIdx,
                                            { price: toNumber(v) },
                                          )
                                        }
                                      />
                                      <Field
                                        label="سعر/صفحة"
                                        type="number"
                                        value={opt.pricePerPage ?? 0}
                                        onChange={(v) =>
                                          updateOption(
                                            sIdx,
                                            secIdx,
                                            oIdx,
                                            {
                                              pricePerPage: toNumber(v),
                                            },
                                          )
                                        }
                                      />
                                      <Field
                                        label="المضاعف"
                                        type="number"
                                        value={opt.multiplier ?? 1}
                                        onChange={(v) =>
                                          updateOption(
                                            sIdx,
                                            secIdx,
                                            oIdx,
                                            { multiplier: toNumber(v) },
                                          )
                                        }
                                      />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                      <Field
                                        label="الوصف"
                                        value={opt.description ?? ""}
                                        onChange={(v) =>
                                          updateOption(
                                            sIdx,
                                            secIdx,
                                            oIdx,
                                            { description: v },
                                          )
                                        }
                                      />
                                      <Field
                                        label="ملاحظة"
                                        value={opt.note ?? ""}
                                        onChange={(v) =>
                                          updateOption(
                                            sIdx,
                                            secIdx,
                                            oIdx,
                                            { note: v },
                                          )
                                        }
                                      />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Add section button */}
                    <Button
                      variant="outline"
                      className="w-full border-dashed h-10 text-sm gap-1.5 dark:text-slate-500 text-slate-400 dark:hover:text-slate-300 hover:text-slate-600 hover:border-teal-300 rounded-lg"
                      onClick={() => addSection(sIdx)}
                    >
                      <Plus className="h-4 w-4" />
                      إضافة قسم جديد لخدمة {service.name}
                    </Button>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          {/* Add service button */}
          <Button
            variant="outline"
            className="w-full border-dashed border-2 border-teal-200 text-teal-600 dark:hover:bg-teal-900/30 hover:bg-teal-50 hover:border-teal-300 gap-2 h-12 rounded-xl"
            onClick={addService}
          >
            <Plus className="h-5 w-5" />
            إضافة خدمة جديدة
          </Button>
        </TabsContent>

        {/* =============================================
            TAB 5: Features (الميزات)
            ============================================= */}
        <TabsContent value="features" className="space-y-4 outline-none">
          <FeaturesTab />
        </TabsContent>
      </Tabs>

      {/* ===== Floating save bar (shows when there are unsaved changes) ===== */}
      {hasChanges && (
        <div className="sticky bottom-4 z-30 mx-auto max-w-md">
          <div className="bg-slate-800 text-white rounded-xl shadow-lg p-3 flex items-center justify-between gap-3 border border-teal-500/30">
            <div className="flex items-center gap-2 text-xs">
              <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
              <span>لديك تغييرات غير محفوظة</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                className="text-slate-300 hover:text-white hover:bg-slate-700 h-8 text-xs"
                onClick={handleDiscard}
                disabled={saving}
              >
                تراجع
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={saving}
                className="bg-teal-600 hover:bg-teal-700 text-white h-8 gap-1.5 text-xs"
              >
                {saving ? (
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Save className="h-3.5 w-3.5" />
                )}
                حفظ
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MerchantSettingsAdvanced;