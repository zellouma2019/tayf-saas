"use client";

import { useState, useEffect } from "react";
import { Settings, Copy, RotateCcw, Printer, ShoppingBag, FileText, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { robustCopy } from "@/lib/admin-utils";

export function SettingsTab() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [services, setServices] = useState("");
  const [deliveryOptions, setDeliveryOptions] = useState("");
  const [general, setGeneral] = useState("");

  async function loadSettings() {
    setLoading(true);
    try {
      const res = await fetch("/api/settings");
      if (!res.ok) throw new Error("فشل");
      const data = await res.json();
      setServices(JSON.stringify(data.services || {}, null, 2));
      setDeliveryOptions(JSON.stringify(data.deliveryOptions || {}, null, 2));
      setGeneral(JSON.stringify(data.general || {}, null, 2));
    } catch {
      toast.error("خطأ في تحميل الإعدادات");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadSettings(); }, []);

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
      borderColor: "border-r-violet-400",
      iconBg: "bg-primary/10",
      iconColor: "text-primary",
      icon: <Printer className="h-4 w-4 text-primary" />,
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
      iconBg: "bg-primary/10",
      iconColor: "text-primary",
      icon: <FileText className="h-4 w-4 text-primary" />,
      minH: "min-h-[120px]",
    },
  ];

  return (
    <div className="space-y-5">
      <div className="bg-primary/5 rounded-xl border border-primary/10 p-4 flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
          <Settings className="h-4 w-4 text-primary" />
        </div>
        <div>
          <h3 className="text-sm text-foreground font-semibold">إعدادات النظام العامة</h3>
          <p className="text-xs text-primary/70 mt-0.5">
            هذه الإعدادات تُطبّق على جميع المتاجر الجديدة كقيم افتراضية
          </p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-10 text-muted-foreground/70 text-sm">
          <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-3 text-primary" />
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
                  "bg-background rounded-xl border border-border shadow-[0_1px_3px_rgba(0,0,0,0.06)] border-r-[3px] overflow-hidden",
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
                          <div className="text-sm font-bold text-foreground/80">{sec.label}</div>
                          <button
                            type="button"
                            className="text-muted-foreground/40 hover:text-primary transition-colors shrink-0"
                            onClick={() => robustCopy(sec.value, "تم نسخ القسم", sec.label)}
                            title="نسخ JSON"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <div className="text-xs text-muted-foreground/70 mt-0.5">{sec.description}</div>
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
                      <span className="text-[10px] text-muted-foreground/70 tabular-nums">{lines} سطر</span>
                    </div>
                  </div>
                </div>
                <div className="px-4 pb-4 space-y-3">
                  <Textarea
                    value={sec.value}
                    onChange={(e) => sec.setValue(e.target.value)}
                    className={cn(
                      "font-mono text-xs rounded-lg bg-muted/50 leading-relaxed",
                      sec.minH,
                      valid
                        ? "border-border focus:ring-ring focus:border-ring"
                        : "border-rose-200 focus:ring-rose-500/20 focus:border-rose-500"
                    )}
                    dir="ltr"
                  />
                  <div className="flex items-center justify-between">
                    <button
                      className="text-xs text-muted-foreground/70 hover:text-foreground/60 transition-colors flex items-center gap-1"
                      onClick={() => sec.setValue("{}")}
                    >
                      <RotateCcw className="h-3 w-3" />
                      إعادة تعيين
                    </button>
                    <button
                      className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50"
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