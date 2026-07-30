"use client";

import { useState } from "react";
import { Palette, Droplets, Layers, Package, Eye, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDA } from "@/lib/print-config";

type FinishType = "مات" | "لامع" | "نصف لامع";

interface ColorSwatch {
  name: string;
  hex: string;
}

interface PaperType {
  id: string;
  name: string;
  colors: ColorSwatch[];
  pricePerPage: number;
  stock: number;
  weight: number;
  finish: FinishType;
  description: string;
}

const ALL_COLORS: ColorSwatch[] = [
  { name: "أبيض", hex: "#FFFFFF" }, { name: "أسود", hex: "#1a1a1a" },
  { name: "أحمر", hex: "#ef4444" }, { name: "أزرق", hex: "#3b82f6" },
  { name: "أخضر", hex: "#22c55e" }, { name: "أصفر", hex: "#eab308" },
  { name: "بنفسجي", hex: "#a855f7" }, { name: "بني", hex: "#92400e" },
  { name: "رمادي", hex: "#6b7280" }, { name: "بيج", hex: "#f5f0e8" },
  { name: "برتقالي", hex: "#f97316" }, { name: "سمائي", hex: "#0ea5e9" },
];

const PAPER_TYPES: PaperType[] = [
  { id: "p1", name: "ورق أبيض عادي", colors: [{ name: "أبيض", hex: "#FFFFFF" }], pricePerPage: 5, stock: 15000, weight: 80, finish: "مات", description: "ورق عادي متعدد الاستخدامات" },
  { id: "p2", name: "ورق مصقول", colors: [{ name: "أبيض", hex: "#FFFFFF" }, { name: "أبيض كريمي", hex: "#FFF8F0" }], pricePerPage: 12, stock: 8000, weight: 120, finish: "لامع", description: "ورق مصقول عالي الجودة" },
  { id: "p3", name: "ورق فوتو", colors: [{ name: "لامع", hex: "#f0f0f0" }, { name: "مات", hex: "#e8e8e8" }], pricePerPage: 25, stock: 3000, weight: 200, finish: "لامع", description: "مثالي للصور والطباعة الفنية" },
  { id: "p4", name: "كرتون", colors: [{ name: "أبيض", hex: "#f5f5f4" }, { name: "بني", hex: "#92400e" }, { name: "أسود", hex: "#1a1a1a" }], pricePerPage: 15, stock: 5000, weight: 250, finish: "مات", description: "كرتون قوي للتغليف والطباعة" },
  { id: "p5", name: "ورق ملون", colors: [{ name: "أحمر", hex: "#ef4444" }, { name: "أزرق", hex: "#3b82f6" }, { name: "أخضر", hex: "#22c55e" }, { name: "أصفر", hex: "#eab308" }, { name: "برتقالي", hex: "#f97316" }], pricePerPage: 18, stock: 4000, weight: 100, finish: "نصف لامع", description: "ورق ملون للدعوات والفلايرات" },
  { id: "p6", name: "ستكر", colors: [{ name: "شفاف", hex: "#f0f9ff" }, { name: "أبيض", hex: "#FFFFFF" }, { name: "مصقول", hex: "#fefce8" }, { name: "مات", hex: "#f5f5f4" }], pricePerPage: 35, stock: 1200, weight: 280, finish: "مات", description: "ستكر ذاتي اللصق للملصقات" },
];

const FINISH_CONFIG: Record<FinishType, { label: string; color: string; bg: string }> = {
  "مات": { label: "مات", color: "text-slate-600 dark:text-slate-400", bg: "bg-slate-100 dark:bg-slate-800/50" },
  "لامع": { label: "لامع", color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-100 dark:bg-amber-900/50" },
  "نصف لامع": { label: "نصف لامع", color: "text-sky-600 dark:text-sky-400", bg: "bg-sky-100 dark:bg-sky-900/50" },
};

function ColorSwatchDot({ swatch, size = "md" }: { swatch: ColorSwatch; size?: "sm" | "md" }) {
  const sizeClass = size === "sm" ? "w-5 h-5" : "w-7 h-7";
  const needsBorder = swatch.hex === "#FFFFFF" || swatch.hex === "#FFF8F0" || swatch.hex === "#f0f0f0";

  return (
    <div className="group relative inline-flex items-center justify-center">
      <div
        className={`${sizeClass} rounded-full ${needsBorder ? "border-border" : "border-transparent"} border-2 shadow-sm transition-transform duration-200 group-hover:scale-110 group-hover:shadow-md`}
        style={{ backgroundColor: swatch.hex }}
      />
      <div className="absolute -top-7 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
        <div className="bg-popover text-popover-foreground text-[9px] px-2 py-1 rounded-md shadow-lg border whitespace-nowrap">
          {swatch.name} <span className="text-muted-foreground font-mono text-[8px]">{swatch.hex}</span>
        </div>
      </div>
    </div>
  );
}

export function ColorMaterialPreview() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showComparison, setShowComparison] = useState(false);

  return (
    <Card className="rounded-xl border border-border/50 overflow-hidden">
      <CardHeader className="pb-3 pt-4 px-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Palette className="h-4 w-4 text-primary" />
            معاينة الألوان والمواد
          </CardTitle>
          <button
            onClick={() => setShowComparison(!showComparison)}
            className="text-[10px] font-medium px-2.5 py-1 rounded-lg border transition-all duration-200 flex items-center gap-1 hover:bg-muted/50 border-border/50 text-muted-foreground hover:text-foreground"
          >
            <Info className="h-3 w-3" />
            {showComparison ? "إخفاء المقارنة" : "مقارنة المواد"}
          </button>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-3">
        {/* Color Palette Grid */}
        <div className="rounded-lg bg-muted/30 border border-border/30 p-3">
          <p className="text-[10px] font-medium text-muted-foreground mb-2.5 flex items-center gap-1">
            <Droplets className="h-3 w-3" />
            لوحة الألوان المتاحة ({ALL_COLORS.length} لون)
          </p>
          <div className="flex flex-wrap gap-2">
            {ALL_COLORS.map((color) => (
              <ColorSwatchDot key={color.hex} swatch={color} size="sm" />
            ))}
          </div>
        </div>

        {/* Material Comparison Table */}
        {showComparison && (
          <div className="rounded-lg bg-muted/20 border border-border/30 p-3">
            <p className="text-[10px] font-medium text-muted-foreground mb-2 flex items-center gap-1">
              <Layers className="h-3 w-3" />
              مقارنة أنواع الورق (الوزن والنوع)
            </p>
            <div className="space-y-1">
              {PAPER_TYPES.map((paper) => {
                const finishConf = FINISH_CONFIG[paper.finish];
                return (
                  <div key={paper.id} className="flex items-center justify-between text-[10px] py-1.5 px-2 rounded-lg hover:bg-muted/40 transition-colors duration-150">
                    <span className="font-medium">{paper.name}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={`text-[8px] px-1.5 py-0 ${finishConf.color} ${finishConf.bg} border-0`}>
                        {finishConf.label}
                      </Badge>
                      <span className="text-muted-foreground font-mono">{paper.weight}gsm</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Paper Types List */}
        <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
          {PAPER_TYPES.map((paper) => {
            const isSelected = selectedId === paper.id;
            const finishConf = FINISH_CONFIG[paper.finish];
            const stockPct = Math.min((paper.stock / 15000) * 100, 100);
            const stockColor = stockPct > 50 ? "bg-emerald-500" : stockPct > 20 ? "bg-amber-500" : "bg-rose-500";
            const stockLabel = stockPct > 50 ? "متوفر" : stockPct > 20 ? "محدود" : "شبه نفاد";

            return (
              <div
                key={paper.id}
                onClick={() => setSelectedId(isSelected ? null : paper.id)}
                className={`rounded-xl border p-3 cursor-pointer transition-all duration-200 hover:shadow-sm ${
                  isSelected ? "bg-primary/5 border-primary/30 shadow-sm" : "bg-card border-border/50 hover:bg-muted/30"
                }`}
              >
                {/* Header Row */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Layers className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs font-bold">{paper.name}</p>
                      <p className="text-[9px] text-muted-foreground">{paper.description}</p>
                    </div>
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold text-primary">{formatDA(paper.pricePerPage)}</p>
                    <p className="text-[9px] text-muted-foreground">/صفحة</p>
                  </div>
                </div>

                {/* Specs Row */}
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className={`text-[8px] px-1.5 py-0 ${finishConf.color} ${finishConf.bg} border-0`}>
                    {finishConf.label}
                  </Badge>
                  <span className="text-[9px] text-muted-foreground font-mono">{paper.weight}gsm</span>
                  <div className="flex items-center gap-1">
                    <Eye className="h-3 w-3 text-muted-foreground" />
                    <span className="text-[9px] text-muted-foreground">{stockLabel}</span>
                  </div>
                </div>

                {/* Color Swatches */}
                <div className="flex items-center gap-1.5 mb-2">
                  {paper.colors.map((c) => (
                    <ColorSwatchDot key={`${paper.id}-${c.hex}`} swatch={c} />
                  ))}
                  <span className="text-[9px] text-muted-foreground mr-1">{paper.colors.length} لون</span>
                </div>

                {/* Stock Bar */}
                <div className="flex items-center gap-2">
                  <Package className="h-3 w-3 text-muted-foreground" />
                  <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className={`h-full ${stockColor} rounded-full transition-all duration-500`} style={{ width: `${stockPct}%` }} />
                  </div>
                  <span className="text-[9px] text-muted-foreground font-mono">{paper.stock.toLocaleString("ar-SA-u-nu-latn")}</span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
