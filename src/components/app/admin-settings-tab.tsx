"use client";

import { useState, useEffect, useCallback } from "react";
import { Settings, Copy, RotateCcw, Printer, ShoppingBag, FileText, RefreshCw, Palette } from "lucide-react";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { robustCopy } from "@/lib/admin-utils";

const ACCENT_PRESETS = [
  { name: "تيل (افتراضي)", color: "#0d7377" },
  { name: "أخضر زمردي", color: "#059669" },
  { name: "أزرق", color: "#2563eb" },
  { name: "نيلي", color: "#4f46e5" },
  { name: "بنفسجي", color: "#7c3aed" },
  { name: "وردي", color: "#db2777" },
  { name: "أحمر", color: "#dc2626" },
  { name: "برتقالي", color: "#ea580c" },
  { name: "ذهبي", color: "#d97706" },
  { name: "رمادي غامق", color: "#475569" },
];

function applyAccentColor(hex: string) {
  const root = document.documentElement;
  root.style.setProperty("--dashboard-accent", hex);
  // إنشاء نسخ فاتحة وغامقة تلقائياً
  root.style.setProperty("--dashboard-accent-light", hex);
  root.style.setProperty("--dashboard-accent-dark", hex);
  // حساب لون خفيف 50
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  root.style.setProperty("--dashboard-accent-50", `rgba(${r},${g},${b},0.05)`);
  root.style.setProperty("--dashboard-accent-100", `rgba(${r},${g},${b},0.1)`);
  root.style.setProperty("--dashboard-accent-200", `rgba(${r},${g},${b},0.2)`);
}

export function SettingsTab() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [services, setServices] = useState("");
  const [deliveryOptions, setDeliveryOptions] = useState("");
  const [general, setGeneral] = useState("");
  const [accentColor, setAccentColor] = useState("#0d7377");
  const [customColor, setCustomColor] = useState("");
  const [savingColor, setSavingColor] = useState(false);

  async function loadSettings() {
    setLoading(true);
    try {
      const res = await fetch("/api/settings");
      if (!res.ok) throw new Error("فشل");
      const data = await res.json();
      setServices(JSON.stringify(data.services || {}, null, 2));
      setDeliveryOptions(JSON.stringify(data.deliveryOptions || {}, null, 2));
      setGeneral(JSON.stringify(data.general || {}, null, 2));
      // تحميل لون الأكسنت
      const savedColor = data.general?.dashboardAccentColor;
      if (savedColor) {
        setAccentColor(savedColor);
        applyAccentColor(savedColor);
      }
    } catch {
      toast.error("خطأ في تحميل الإعدادات");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadSettings(); }, []);

  const saveAccentColor = useCallback(async (color: string) => {
    setSavingColor(true);
    setAccentColor(color);
    applyAccentColor(color);
    try {
      const parsed = JSON.parse(general || "{}");
      parsed.dashboardAccentColor = color;
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ general: parsed }),
      });
      if (!res.ok) throw new Error("فشل");
      setGeneral(JSON.stringify(parsed, null, 2));
      toast.success("تم تغيير اللون الأساسي");
    } catch {
      toast.error("فشل حفظ اللون");
    } finally {
      setSavingColor(false);
    }
  }, [general]);

  async function saveSection(section: string, value: string) {
    setSaving(section);
    try {
      let parsed: unknown;
      try {
        parsed = JSON.parse(value);
      } catch {
        toast.error("JSON غير صالح");
        setSaving(null);
        return;
      }
      const body: Record<string, unknown> = {};
      if (section === "services") body.services = parsed;
      else if (section === "deliveryOptions") body.deliveryOptions = parsed;
      else if (section === "general") body.general = parsed;

      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("فشل");
      toast.success("تم حفظ الإعدادات");
    } catch {
      toast.error("فشل حفظ الإعدادات");
    } finally {
      setSaving(null);
    }
  }

  function isValidJson(val: string): boolean {
    try { JSON.parse(val); return true; } catch { return false; }
  }

  function getLineCount(val: string): number {
    return val ? val.split("\n").length : 0;
  }

  const sections = [
    {
      key: "services" as const,
      label: "الخدمات (services)",
      description: "إعدادات الخدمات والأسعار الافتراضية",
      value: services,
      setValue: setServices,
      borderColor: "border-r-teal-400",
      iconBg: "bg-teal-50",
      iconColor: "text-teal-600",
      icon: <Printer className="h-4 w-4 text-teal-600" />,
      minH: "min-h-[160px]",
    },
    {
      key: "deliveryOptions" as const,
      label: "خيارات التوصيل (deliveryOptions)",
      description: "خيارات وأسعار التوصيل والتسليم",
      value: deliveryOptions,
      setValue: setDeliveryOptions,
      borderColor: "border-r-emerald-400",
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-600",
      icon: <ShoppingBag className="h-4 w-4 text-emerald-600" />,
      minH: "min-h-[120px]",
    },
    {
      key: "general" as const,
      label: "إعدادات عامة (general)",
      description: "إعدادات عامة للمتجر",
      value: general,
      setValue: setGeneral,
      borderColor: "border-r-blue-400",
      iconBg: "bg-blue-50",
      iconColor: "text-blue-600",
      icon: <FileText className="h-4 w-4 text-blue-600" />,
      minH: "min-h-[120px]",
    },
  ];

  return (
    <div className="space-y-5">
      <div className="bg-teal-50/60 rounded-xl border border-teal-200/40 p-4 flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center shrink-0 mt-0.5">
          <Settings className="h-4 w-4 text-teal-600" />
        </div>
        <div>
          <h3 className="text-sm text-teal-800 font-semibold">إعدادات النظام العامة</h3>
          <p className="text-xs text-teal-600/70 mt-0.5">
            هذه الإعدادات تُطبّق على جميع المتاجر الجديدة كقيم افتراضية
          </p>
        </div>
      </div>

      {/* ===== اللون الأساسي للوحة التحكم ===== */}
      {!loading && (
        <div className="bg-background rounded-xl border border-slate-200/60 dark:border-slate-700/60 shadow-[0_1px_3px_rgba(0,0,0,0.06)] border-r-[3px] border-r-teal-400 p-4">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center shrink-0">
              <Palette className="h-4 w-4 text-teal-600" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-700">اللون الأساسي للوحة التحكم</div>
              <div className="text-xs text-slate-400 mt-0.5">يُطبّق على جميع لوحات التحكم كاللون الافتراضي</div>
            </div>
          </div>

          {/* معاينة مباشرة */}
          <div className="flex items-center gap-3 mb-4 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
            <div
              className="w-10 h-10 rounded-xl shadow-md transition-colors duration-300"
              style={{ backgroundColor: accentColor }}
            />
            <div>
              <div className="text-xs text-slate-500">اللون الحالي</div>
              <div className="text-sm font-mono font-bold" style={{ color: accentColor }}>{accentColor}</div>
            </div>
            <div className="flex-1" />
            <div className="flex gap-1.5">
              <div className="w-6 h-6 rounded-md" style={{ backgroundColor: accentColor }} />
              <div className="w-6 h-6 rounded-md opacity-80" style={{ backgroundColor: accentColor }} />
              <div className="w-6 h-6 rounded-md opacity-60" style={{ backgroundColor: accentColor }} />
              <div className="w-6 h-6 rounded-md opacity-40" style={{ backgroundColor: accentColor }} />
            </div>
          </div>

          {/* ألوان جاهزة */}
          <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 mb-4">
            {ACCENT_PRESETS.map((preset) => (
              <button
                key={preset.color}
                type="button"
                title={preset.name}
                disabled={savingColor}
                onClick={() => saveAccentColor(preset.color)}
                className={cn(
                  "w-full aspect-square rounded-xl border-2 transition-all duration-200 hover:scale-110 active:scale-95",
                  accentColor === preset.color
                    ? "border-slate-800 dark:border-white scale-105 shadow-md"
                    : "border-transparent hover:border-slate-300"
                )}
                style={{ backgroundColor: preset.color }}
              />
            ))}
          </div>

          {/* لون مخصص */}
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <Label className="text-xs text-slate-500 mb-1.5 block">لون مخصص (Hex)</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={accentColor}
                  onChange={(e) => setCustomColor(e.target.value)}
                  className="w-10 h-10 p-0.5 cursor-pointer rounded-lg"
                />
                <Input
                  dir="ltr"
                  placeholder="#0d7377"
                  value={customColor}
                  onChange={(e) => setCustomColor(e.target.value)}
                  className="font-mono text-sm h-10"
                />
              </div>
            </div>
            <button
              onClick={() => {
                if (customColor && /^#[0-9a-fA-F]{6}$/.test(customColor)) {
                  saveAccentColor(customColor);
                  setCustomColor("");
                } else {
                  toast.error("أدخل لون صالح مثل #0d7377");
                }
              }}
              disabled={savingColor || !customColor}
              className="h-10 px-4 rounded-lg text-white text-sm font-medium transition-colors disabled:opacity-50 shrink-0"
              style={{ backgroundColor: accentColor }}
            >
              {savingColor ? "..." : "تطبيق"}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-10 text-slate-400 text-sm">
          <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-3 text-teal-500" />
          جارٍ التحميل...
        </div>
      ) : (
        <div className="space-y-4">
          {sections.map((sec) => {
            const valid = isValidJson(sec.value);
            const lines = getLineCount(sec.value);
            return (
              <div
                key={sec.key}
                className={cn(
                  "bg-background rounded-xl border border-slate-200/60 dark:border-slate-700/60 shadow-[0_1px_3px_rgba(0,0,0,0.06)] border-r-[3px] overflow-hidden",
                  sec.borderColor
                )}
              >
                <div className="p-4 pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", sec.iconBg)}>
                        {sec.icon}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <div className="text-sm font-bold text-slate-700">{sec.label}</div>
                          <button
                            type="button"
                            className="text-slate-300 hover:text-teal-500 transition-colors shrink-0"
                            onClick={() => robustCopy(sec.value, "تم نسخ القسم", sec.label)}
                            title="نسخ JSON"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5">{sec.description}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={cn(
                        "text-[10px] px-2 py-0.5 rounded-full font-medium",
                        valid
                          ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                          : "bg-rose-50 text-rose-600 border border-rose-200"
                      )}>
                        {valid ? "✓ Valid JSON" : "✗ Invalid JSON"}
                      </span>
                      <span className="text-[10px] text-slate-400 tabular-nums">{lines} سطر</span>
                    </div>
                  </div>
                </div>
                <div className="px-4 pb-4 space-y-3">
                  <Textarea
                    value={sec.value}
                    onChange={(e) => sec.setValue(e.target.value)}
                    className={cn(
                      "font-mono text-xs rounded-lg bg-slate-50/50 leading-relaxed",
                      sec.minH,
                      valid
                        ? "border-slate-200 focus:ring-teal-500/20 focus:border-teal-500"
                        : "border-rose-200 focus:ring-rose-500/20 focus:border-rose-500"
                    )}
                    dir="ltr"
                  />
                  <div className="flex items-center justify-between">
                    <button
                      className="text-xs text-slate-400 hover:text-slate-600 transition-colors flex items-center gap-1"
                      onClick={() => sec.setValue("{}")}
                    >
                      <RotateCcw className="h-3 w-3" />
                      إعادة تعيين
                    </button>
                    <button
                      className="bg-teal-600 hover:bg-teal-700 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50"
                      onClick={() => saveSection(sec.key, sec.value)}
                      disabled={saving === sec.key}
                    >
                      {saving === sec.key ? "جارٍ الحفظ..." : "حفظ"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}