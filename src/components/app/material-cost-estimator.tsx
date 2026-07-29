"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Palette, Ruler, Layers, DollarSign, Check } from "lucide-react";
import { cn } from "@/lib/utils";

const PAPER_TYPES = [
  { id: "matte", label: "سادة (مات)", pricePer: 3, icon: "📄" },
  { id: "glossy", label: "لامع (غلاف)", pricePer: 5, icon: "✨" },
  { id: "kraft", label: "كرافت (بني)", pricePer: 7, icon: "🪵" },
] as const;

const PAPER_SIZES = [
  { id: "A4", label: "A4", width: 210, height: 297 },
  { id: "A3", label: "A3", width: 297, height: 420 },
  { id: "A5", label: "A5", width: 148, height: 210 },
] as const;

const COLOR_MODES = [
  { id: "cmyk", label: "CMYK", desc: "طباعة احترافية", color: "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300" },
  { id: "rgb", label: "RGB", desc: "رقمي/شاشة", color: "bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300" },
  { id: "bw", label: "أبيض وأسود", desc: "اقتصادي", color: "bg-zinc-100 dark:bg-zinc-900/30 text-zinc-700 dark:text-zinc-300" },
] as const;

interface MaterialCostEstimatorProps {
  paperType: string;
  setPaperType: (t: string) => void;
  paperSize: string;
  setPaperSize: (s: string) => void;
  colorMode: string;
  setColorMode: (c: string) => void;
  pages: number;
  copies: number;
}

export function MaterialCostEstimator({
  paperType, setPaperType, paperSize, setPaperSize,
  colorMode, setColorMode, pages, copies,
}: MaterialCostEstimatorProps) {
  const paper = PAPER_TYPES.find(p => p.id === paperType);
  const size = PAPER_SIZES.find(s => s.id === paperSize);
  const mode = COLOR_MODES.find(m => m.id === colorMode);

  const colorMultiplier = colorMode === "cmyk" ? 1.5 : colorMode === "rgb" ? 1.2 : 1.0;
  const sizeMultiplier = paperSize === "A3" ? 2.0 : paperSize === "A5" ? 0.7 : 1.0;
  const baseCost = (paper?.pricePer ?? 3) * pages * copies;
  const totalCost = Math.round(baseCost * colorMultiplier * sizeMultiplier);

  return (
    <div className="space-y-5" dir="rtl">
      {/* نوع الورق */}
      <div>
        <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
          <Layers className="h-4 w-4 text-primary" />
          نوع الورق
        </h3>
        <div className="grid grid-cols-3 gap-2">
          {PAPER_TYPES.map((pt) => (
            <button
              key={pt.id}
              type="button"
              onClick={() => setPaperType(pt.id)}
              className={cn(
                "paper-type-card p-3 rounded-xl border-2 text-center transition-all duration-200",
                paperType === pt.id
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-border bg-card hover:border-primary/40"
              )}
            >
              <div className="text-2xl mb-1">{pt.icon}</div>
              <div className="text-xs font-medium text-foreground">{pt.label}</div>
              <div className="text-[10px] text-muted-foreground">{pt.pricePer} د.ج/صفحة</div>
            </button>
          ))}
        </div>
      </div>

      {/* حجم الورق */}
      <div>
        <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
          <Ruler className="h-4 w-4 text-primary" />
          حجم الورق
        </h3>
        <div className="flex gap-2">
          {PAPER_SIZES.map((ps) => (
            <button
              key={ps.id}
              type="button"
              onClick={() => setPaperSize(ps.id)}
              className={cn(
                "paper-size-indicator flex-1 p-3 rounded-xl border-2 text-center transition-all",
                paperSize === ps.id
                  ? "border-primary bg-primary/5"
                  : "border-border bg-card hover:border-primary/40"
              )}
            >
              <div className="text-lg font-bold text-foreground">{ps.id}</div>
              <div className="text-[10px] text-muted-foreground">{ps.width}×{ps.height}مم</div>
            </button>
          ))}
        </div>
      </div>

      {/* وضع الألوان */}
      <div>
        <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
          <Palette className="h-4 w-4 text-primary" />
          وضع الألوان
        </h3>
        <div className="flex gap-2">
          {COLOR_MODES.map((cm) => (
            <button
              key={cm.id}
              type="button"
              onClick={() => setColorMode(cm.id)}
              className={cn(
                "color-mode-badge flex-1 p-3 rounded-xl border-2 text-center transition-all",
                colorMode === cm.id
                  ? "border-primary bg-primary/5"
                  : "border-border bg-card hover:border-primary/40"
              )}
            >
              <div className={cn("text-xs font-bold px-2 py-0.5 rounded-lg inline-block mb-1", cm.color)}>
                {cm.label}
              </div>
              <div className="text-[10px] text-muted-foreground">{cm.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* التكلفة المقدّرة */}
      <motion.div
        key={totalCost}
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-gradient-to-l from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 border border-emerald-200/60 dark:border-emerald-800/30 rounded-xl p-4"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-emerald-600" />
            <span className="text-sm font-bold text-foreground">التكلفة المقدّرة</span>
          </div>
          <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">
            {totalCost.toLocaleString("ar-DZ")} د.ج
          </div>
        </div>
        <div className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
          <Check className="h-3 w-3 text-emerald-500" />
          {pages} صفحة × {copies} نسخة · {paper?.label} · {size?.id} · {mode?.label}
        </div>
      </motion.div>
    </div>
  );
}
