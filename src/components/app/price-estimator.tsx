"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Calculator,
  Plus,
  Minus,
  RotateCcw,
  Printer,
  Palette,
  FileText,
  Bookmark,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ===== الأسعار الأساسية (DZD) =====
const BASE_PRICES: Record<string, { bw: number; color: number }> = {
  document: { bw: 5, color: 20 },
  photo: { bw: 50, color: 50 },
  binding: { bw: 0, color: 0 },
  card: { bw: 15, color: 15 },
};

const PAPER_MULTIPLIERS: Record<string, number> = {
  A4: 1,
  A3: 2,
  A5: 0.6,
  Letter: 0.9,
};

const BINDING_PRICES: Record<string, number> = {
  none: 0,
  staple: 50,
  spiral: 150,
  glue: 100,
};

const DOUBLE_SIDED_MULTIPLIER = 1.5;

const SERVICE_OPTIONS = [
  { value: "document", label: "طباعة مستند", icon: FileText },
  { value: "photo", label: "طباعة صور", icon: Printer },
  { value: "binding", label: "تجليد", icon: Bookmark },
  { value: "card", label: "بطاقات", icon: Palette },
];

const PAPER_OPTIONS = [
  { value: "A4", label: "A4" },
  { value: "A3", label: "A3" },
  { value: "A5", label: "A5" },
  { value: "Letter", label: "Letter" },
];

const BINDING_OPTIONS = [
  { value: "none", label: "بدون" },
  { value: "staple", label: "تدبيس" },
  { value: "spiral", label: "لولبي" },
  { value: "glue", label: "غراء" },
];

// ===== مكون العداد =====
function Stepper({
  value,
  onChange,
  min = 1,
  max = 9999,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
}) {
  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        className="w-8 h-8 rounded-lg bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors"
      >
        <Minus className="h-3.5 w-3.5 text-muted-foreground" />
      </button>
      <Input
        type="number"
        value={value}
        onChange={(e) => {
          const n = parseInt(e.target.value, 10);
          if (!isNaN(n)) onChange(Math.min(max, Math.max(min, n)));
        }}
        className="w-16 h-8 text-center text-sm tabular-nums rounded-lg"
        min={min}
        max={max}
      />
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        className="w-8 h-8 rounded-lg bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors"
      >
        <Plus className="h-3.5 w-3.5 text-muted-foreground" />
      </button>
    </div>
  );
}

// ===== المكون الرئيسي =====
export function PriceEstimator({
  onRequestOrder,
}: {
  onRequestOrder?: () => void;
}) {
  const [serviceType, setServiceType] = useState("document");
  const [pages, setPages] = useState(10);
  const [copies, setCopies] = useState(1);
  const [isColor, setIsColor] = useState(false);
  const [paperSize, setPaperSize] = useState("A4");
  const [isDoubleSided, setIsDoubleSided] = useState(false);
  const [binding, setBinding] = useState("none");

  // السعر المعروض مع تأثير العداد
  const [displayPrice, setDisplayPrice] = useState(0);
  const animRef = useRef<ReturnType<typeof requestAnimationFrame>>();

  // حساب السعر
  const calculatePrice = useCallback(() => {
    const base = BASE_PRICES[serviceType] ?? BASE_PRICES.document;
    const pricePerPage = isColor ? base.color : base.bw;
    const paperMult = PAPER_MULTIPLIERS[paperSize] ?? 1;
    const sidesMult = isDoubleSided ? DOUBLE_SIDED_MULTIPLIER : 1;
    const bindingCost = BINDING_PRICES[binding] ?? 0;
    const unitCount = serviceType === "card" ? pages : pages;
    return Math.round(unitCount * copies * pricePerPage * paperMult * sidesMult + bindingCost);
  }, [serviceType, pages, copies, isColor, paperSize, isDoubleSided, binding]);

  const price = calculatePrice();

  // تحريك العداد
  useEffect(() => {
    const start = displayPrice;
    const end = price;
    if (start === end) return;
    const duration = 400;
    const startTime = performance.now();

    function animate(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayPrice(Math.round(start + (end - start) * eased));
      if (progress < 1) {
        animRef.current = requestAnimationFrame(animate);
      }
    }
    animRef.current = requestAnimationFrame(animate);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [price, displayPrice]);

  const handleReset = () => {
    setServiceType("document");
    setPages(10);
    setCopies(1);
    setIsColor(false);
    setPaperSize("A4");
    setIsDoubleSided(false);
    setBinding("none");
  };

  const formatDA = (n: number) =>
    new Intl.NumberFormat("ar-DZ", {
      style: "decimal",
      maximumFractionDigits: 0,
    }).format(n) + " د.ج";

  return (
    <Card className="w-full overflow-hidden border-border shadow-xl">
      {/* Gradient header */}
      <div className="relative bg-gradient-to-l from-violet-600 via-indigo-600 to-purple-700 px-5 py-4">
        <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/10 rounded-full blur-xl" />
        <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-white/10 rounded-full blur-lg" />
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Calculator className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-white font-bold text-sm">حاسبة الأسعار</h2>
              <p className="text-white/70 text-[11px]">قدّر تكلفة طباعتك</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleReset}
            className="w-8 h-8 rounded-lg bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors"
            title="إعادة تعيين"
          >
            <RotateCcw className="h-3.5 w-3.5 text-white" />
          </button>
        </div>
      </div>

      <CardContent className="p-4 space-y-4">
        {/* نوع الخدمة */}
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground">نوع الخدمة</Label>
          <div className="grid grid-cols-2 gap-1.5">
            {SERVICE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setServiceType(opt.value)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-medium transition-all border",
                  serviceType === opt.value
                    ? "bg-primary/10 border-primary/30 text-primary shadow-sm"
                    : "bg-card border-border text-muted-foreground hover:bg-muted/50"
                )}
              >
                <opt.icon className="h-3.5 w-3.5 shrink-0" />
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* عدد الصفحات */}
        <div className="flex items-center justify-between">
          <Label className="text-xs font-medium text-muted-foreground">
            عدد الصفحات
          </Label>
          <Stepper value={pages} onChange={setPages} min={1} max={9999} />
        </div>

        {/* عدد النسخ */}
        <div className="flex items-center justify-between">
          <Label className="text-xs font-medium text-muted-foreground">
            عدد النسخ
          </Label>
          <Stepper value={copies} onChange={setCopies} min={1} max={999} />
        </div>

        {/* وضع الألوان */}
        <div className="flex items-center justify-between">
          <Label className="text-xs font-medium text-muted-foreground">
            <Palette className="h-3.5 w-3.5 inline ml-1" />
            اللون
          </Label>
          <div className="flex items-center bg-muted rounded-lg p-0.5">
            <button
              type="button"
              onClick={() => setIsColor(false)}
              className={cn(
                "px-3 py-1.5 rounded-md text-[11px] font-medium transition-all",
                !isColor
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              أبيض وأسود
            </button>
            <button
              type="button"
              onClick={() => setIsColor(true)}
              className={cn(
                "px-3 py-1.5 rounded-md text-[11px] font-medium transition-all",
                isColor
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              ملون
            </button>
          </div>
        </div>

        {/* حجم الورق */}
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground">
            حجم الورق
          </Label>
          <div className="flex gap-1.5">
            {PAPER_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setPaperSize(opt.value)}
                className={cn(
                  "flex-1 py-2 rounded-lg text-[11px] font-bold tabular-nums transition-all border",
                  paperSize === opt.value
                    ? "bg-primary/10 border-primary/30 text-primary shadow-sm"
                    : "bg-card border-border text-muted-foreground hover:bg-muted/50"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* الوجهين */}
        <div className="flex items-center justify-between">
          <Label className="text-xs font-medium text-muted-foreground">
            الوجهين
          </Label>
          <div className="flex items-center bg-muted rounded-lg p-0.5">
            <button
              type="button"
              onClick={() => setIsDoubleSided(false)}
              className={cn(
                "px-3 py-1.5 rounded-md text-[11px] font-medium transition-all",
                !isDoubleSided
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              وجه واحد
            </button>
            <button
              type="button"
              onClick={() => setIsDoubleSided(true)}
              className={cn(
                "px-3 py-1.5 rounded-md text-[11px] font-medium transition-all",
                isDoubleSided
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              وجهين
            </button>
          </div>
        </div>

        {/* التجليد */}
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground">
            <Bookmark className="h-3.5 w-3.5 inline ml-1" />
            التجليد
          </Label>
          <div className="flex gap-1.5">
            {BINDING_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setBinding(opt.value)}
                className={cn(
                  "flex-1 py-2 rounded-lg text-[11px] font-medium transition-all border",
                  binding === opt.value
                    ? "bg-primary/10 border-primary/30 text-primary shadow-sm"
                    : "bg-card border-border text-muted-foreground hover:bg-muted/50"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* عرض السعر */}
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-l from-violet-50 via-indigo-50/50 to-purple-50 dark:from-violet-950/30 dark:via-indigo-950/20 dark:to-purple-950/30 border border-primary/10 p-4">
          <div className="absolute -top-4 -left-4 w-16 h-16 bg-primary/5 rounded-full blur-xl" />
          <div className="relative text-center">
            <p className="text-[11px] text-muted-foreground mb-1">السعر التقديري</p>
            <p className="text-2xl font-bold text-primary tabular-nums">
              {formatDA(displayPrice)}
            </p>
          </div>
        </div>

        {/* زر الطلب */}
        {onRequestOrder && (
          <Button
            onClick={onRequestOrder}
            className="w-full bg-gradient-to-l from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-medium shadow-lg hover:shadow-xl transition-all"
          >
            <Printer className="h-4 w-4 ml-2" />
            اطلب الآن
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
