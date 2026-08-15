"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calculator,
  ChevronDown,
  FileText,
  Image,
  BookOpen,
  Copy,
  CreditCard,
  Megaphone,
  Sparkles,
  Check,
  Minus,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  COLORS,
  PAPER_SIZES,
  SIDES,
  BINDINGS,
  DELIVERY_OPTIONS,
  formatDA,
} from "@/lib/print-config";
import type { ServiceType } from "@/lib/print-config";

interface PriceResult {
  perPage: number;
  pagesCost: number;
  copiesCost: number;
  sidesSaving: number;
  bindingCost: number;
  deliveryCost: number;
  discount: number;
  total: number;
}

const SERVICE_OPTIONS: {
  type: ServiceType;
  label: string;
  emoji: string;
  hasPages: boolean;
  hasCopies: boolean;
  hasColor: boolean;
  hasSides: boolean;
  hasBinding: boolean;
  hasDelivery: boolean;
}[] = [
  { type: "document", label: "طباعة مستند", emoji: "📄", hasPages: true, hasCopies: true, hasColor: true, hasSides: true, hasBinding: true, hasDelivery: true },
  { type: "photo", label: "طباعة صور", emoji: "🖼️", hasPages: false, hasCopies: true, hasColor: false, hasSides: false, hasBinding: false, hasDelivery: true },
  { type: "copy", label: "نسخ مستندات", emoji: "📋", hasPages: true, hasCopies: true, hasColor: true, hasSides: true, hasBinding: false, hasDelivery: true },
  { type: "binding", label: "تجليد", emoji: "📚", hasPages: false, hasCopies: false, hasColor: false, hasSides: false, hasBinding: true, hasDelivery: true },
  { type: "card", label: "بطاقات", emoji: "🪪", hasPages: false, hasCopies: true, hasColor: false, hasSides: false, hasBinding: false, hasDelivery: true },
  { type: "poster", label: "ملصقات", emoji: "📜", hasPages: false, hasCopies: false, hasColor: true, hasSides: false, hasBinding: false, hasDelivery: true },
];

function getBreakdownItems(price: PriceResult, pages: number, copies: number, binding: string) {
  const items: { id: string; content: React.ReactNode }[] = [];
  items.push({
    id: "perPage",
    content: (
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">سعر الصفحة</span>
        <span className="font-bold">{formatDA(price.perPage)} دج</span>
      </div>
    ),
  });
  if (price.pagesCost > 0) {
    items.push({
      id: "pagesCost",
      content: (
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">
            × {pages} صفحة = <span className="text-muted-foreground">{formatDA(price.pagesCost)} دج</span>
          </span>
        </div>
      ),
    });
  }
  if (price.copiesCost > 0) {
    items.push({
      id: "copiesCost",
      content: (
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">
            × {copies} نسخة = <span className="font-medium">{formatDA(price.copiesCost)} دج</span>
          </span>
        </div>
      ),
    });
  }
  if (price.sidesSaving > 0) {
    items.push({
      id: "sidesSaving",
      content: (
        <div className="flex justify-between text-xs text-emerald-700">
          <span>وجهين يوفّر 50%</span>
          <span>−{formatDA(price.sidesSaving)} دج</span>
        </div>
      ),
    });
  }
  if (price.bindingCost > 0) {
    items.push({
      id: "bindingCost",
      content: (
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">{binding || "بدون تجليد"}</span>
          <span>{formatDA(price.bindingCost)} دج</span>
        </div>
      ),
    });
  }
  if (price.deliveryCost > 0) {
    items.push({
      id: "deliveryCost",
      content: (
        <div className="flex justify-between text-xs text-amber-700">
          <span>⚡ توصيل عاجل</span>
          <span>+{formatDA(price.deliveryCost)} دج</span>
        </div>
      ),
    });
  }
  if (price.discount > 0) {
    items.push({
      id: "discount",
      content: (
        <motion.div
          initial={{ scale: 0.8, rotate: -3, opacity: 0 }}
          animate={{ scale: 1, rotate: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 15, delay: items.length * 0.05 + 0.1 }}
          className="flex justify-between text-xs text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 rounded-lg px-3 py-1.5"
        >
          <span>🎁 خصم الكمية ({copies >= 50 ? "15%" : "10%"})</span>
          <span>−{formatDA(price.discount)} دج</span>
        </motion.div>
      ),
    });
  }
  return items;
}

export function QuickPriceCalculator() {
  const [serviceType, setServiceType] = useState<ServiceType>("document");
  const [pages, setPages] = useState(10);
  const [copies, setCopies] = useState(1);
  const [color, setColor] = useState("bw");
  const [paperSize, setPaperSize] = useState("A4");
  const [sides, setSides] = useState("single");
  const [binding, setBinding] = useState("none");
  const [delivery, setDelivery] = useState("today");

  const price = useMemo<PriceResult>(() => {
    let perPage = 5;
    if (serviceType === "document") perPage = color === "color" ? 15 : 5;
    else if (serviceType === "photo") perPage = 25;
    else if (serviceType === "copy") perPage = color === "color" ? 10 : 4;
    else if (serviceType === "card") perPage = 30;
    else if (serviceType === "poster") perPage = 50;
    else if (serviceType === "binding") perPage = 20;

    const sizeMultiplier: Record<string, number> = { "A5": 0.6, "A4": 1, "A3": 2, "Legal": 1.2 };
    const sizeMult = sizeMultiplier[paperSize] || 1;

    const pagesCost = perPage * Math.max(1, pages) * sizeMult;
    const copiesCost = pagesCost * Math.max(1, copies);
    const sidesSaving = sides === "double" ? Math.floor(pagesCost * 0.5) : 0;

    let bindingCost = 0;
    if (serviceType === "document" || serviceType === "binding") {
      const costs: Record<string, number> = { none: 0, staple: 20, spiral: 150, glue: 200, "spiral-metal": 250, thermal: 350, "hardcover": 800 };
      bindingCost = costs[binding] || 0;
    }

    const deliveryCost = delivery === "hour" ? 100 : 0;

    const subtotal = copiesCost + bindingCost + deliveryCost - sidesSaving;
    let discount = 0;
    if (copies >= 50) discount = Math.floor(subtotal * 0.15);
    else if (copies >= 10) discount = Math.floor(subtotal * 0.1);

    const total = subtotal - discount;

    return { perPage, pagesCost, copiesCost, sidesSaving, bindingCost, deliveryCost, discount, total };
  }, [serviceType, pages, copies, color, paperSize, sides, binding, delivery]);

  const breakdownItems = getBreakdownItems(price, pages, copies, binding);

  const volumeDiscountInfo = useMemo(() => {
    if (copies >= 50) {
      return { label: "خصم 15% مفعّل ✨", color: "bg-emerald-500", textColor: "text-emerald-700 dark:text-emerald-400", fill: 100, stage: 3 as const };
    } else if (copies >= 10) {
      const fill = Math.min(100, ((copies - 10) / 40) * 100);
      return { label: "خصم 10% قريباً", color: "bg-amber-400", textColor: "text-amber-700 dark:text-amber-400", fill, stage: 2 as const };
    } else {
      const fill = (copies / 10) * 30;
      return { label: "خصم الكمية: لا يوجد", color: "bg-gray-300 dark:bg-gray-600", textColor: "text-muted-foreground", fill, stage: 1 as const };
    }
  }, [copies]);

  const fmt = (n: number) => formatDA(n);

  const handleCopyPrice = async () => {
    const text = `${fmt(price.total)} دج`;
    try {
      await navigator.clipboard.writeText(text);
      toast.success("تم نسخ السعر", {
        description: text,
        duration: 2000,
      });
    } catch {
      toast.error("فشل النسخ");
    }
  };

  const handleQuickCopies = (num: number) => {
    setCopies(num);
  };

  const inputClass =
    "h-9 w-full text-sm rounded-lg border-input bg-background pr-2 focus:ring-2 focus:ring-ring transition-colors";

  const priceKey = `${price.total}-${serviceType}-${pages}-${copies}-${color}-${paperSize}-${sides}-${binding}-${delivery}`;

  return (
    <div className="space-y-5">
        <div className="space-y-2">
          <Label className="text-xs font-medium">الخدمة</Label>
          <div className="grid grid-cols-3 gap-2">
            {SERVICE_OPTIONS.map((svc) => (
              <button
                key={svc.type}
                onClick={() => setServiceType(svc.type)}
                title={serviceType !== svc.type ? "اختر هذا النوع" : undefined}
                className={`relative rounded-xl p-3 border-2 text-center transition-all hover:shadow-md ${
                  serviceType === svc.type
                    ? "border-amber-400 bg-amber-50 dark:bg-amber-950/40 shadow-sm"
                    : "border-transparent bg-background hover:bg-muted/50"
                }`}
              >
                {serviceType === svc.type && (
                  <motion.span
                    className="absolute inset-0 rounded-xl border-2 border-amber-400"
                    initial={{ scale: 1, opacity: 0.8 }}
                    animate={{ scale: 1.06, opacity: 0 }}
                    transition={{ duration: 1.2, repeat: Infinity, ease: "easeOut" }}
                  />
                )}
                <div className="text-2xl mb-1">{svc.emoji}</div>
                <div className="text-[11px] font-medium leading-tight">{svc.label}</div>
                {serviceType === svc.type && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -left-1 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center"
                  >
                    <Check className="h-3 w-3 text-white" />
                  </motion.div>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {serviceType === "document" && (
            <div className="space-y-1.5">
              <div className="space-y-1">
                <Label className="text-xs font-medium">اللون</Label>
                <div className="grid grid-cols-2 gap-1.5">
                  {COLORS.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setColor(c.id)}
                      className={`rounded-lg py-2 text-xs font-medium transition-colors border-2 ${
                        color === c.id
                          ? "border-amber-400 bg-amber-50 text-amber-800 dark:bg-amber-950/40 shadow-sm"
                          : "border-transparent bg-background hover:bg-muted/50"
                      }`}
                    >
                      <span>{c.emoji}</span>
                      <span className="text-[10px]">{c.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">مقاس الورق</Label>
                <div className="grid grid-cols-2 gap-1.5">
                  {PAPER_SIZES.filter((s) => s.id !== "A5" && s.id !== "A3" && s.id !== "Legal").map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setPaperSize(s.id)}
                      className={`rounded-lg py-2 text-xs font-medium transition-colors border-2 ${
                        paperSize === s.id
                          ? "border-amber-400 bg-amber-50 text-amber-800 dark:bg-amber-950/40 shadow-sm"
                          : "border-transparent bg-background hover:bg-muted/50"
                      }`}
                    >
                      <span className="text-[10px]">{s.id}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <Label className="text-xs font-medium">
              {serviceType === "document" ? "وجهان" : "العدد"}
            </Label>
            {serviceType === "document" && (
              <div className="grid grid-cols-2 gap-1.5">
                {SIDES.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSides(s.id)}
                    className={`rounded-lg py-2 text-xs font-medium transition-colors border-2 ${
                      sides === s.id
                        ? "border-amber-400 bg-amber-50 text-amber-800 dark:bg-amber-950/40 shadow-sm"
                        : "border-transparent bg-background hover:bg-muted/50"
                    }`}
                  >
                    <span>{s.emoji}</span>
                    <span className="text-[10px]">{s.label}</span>
                  </button>
                ))}
              </div>
            )}
            {serviceType === "document" && (
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">التجليد</Label>
                <div className="grid grid-cols-3 gap-1">
                  {BINDINGS.filter((b) => b.id !== "none").map((b) => (
                    <button
                      key={b.id}
                      onClick={() => setBinding(b.id)}
                      className={`rounded-lg py-2 text-[10px] font-medium transition-colors border-2 ${
                        binding === b.id
                          ? "border-amber-400 bg-amber-50 text-amber-800 dark:bg-amber-950/40 shadow-sm"
                          : "border-transparent bg-background hover:bg-muted/50"
                      }`}
                    >
                      <span className="text-[9px]">{b.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            {serviceType !== "binding" && (
              <div className="flex items-center gap-2">
                <Label className="text-xs font-medium shrink-0">
                  {serviceType === "document" ? "الصفحات" : "العدد"}
                </Label>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-8 h-8 p-0"
                    onClick={() => setPages(Math.max(1, pages - 1))}
                  >
                    −
                  </Button>
                  <Input
                    type="number"
                    value={pages}
                    onChange={(e) => setPages(Math.max(1, parseInt(e.target.value) || 1))}
                    className={inputClass}
                    min={1}
                    max={serviceType === "photo" ? 100 : 500}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-8 h-8 p-0"
                    onClick={() => setPages(pages + 1)}
                  >
                    +
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Label className="text-xs font-medium shrink-0">النسخ</Label>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                className="w-8 h-8 p-0"
                onClick={() => setCopies(Math.max(1, copies - 1))}
              >
                −
              </Button>
              <Input
                type="number"
                value={copies}
                onChange={(e) => setCopies(Math.max(1, parseInt(e.target.value) || 1))}
                className={inputClass}
                min={1}
                max={9999}
              />
              <Button
                variant="outline"
                size="sm"
                className="w-8 h-8 p-0"
                onClick={() => setCopies(copies + 1)}
              >
                +
              </Button>
            </div>
          </div>

          <div className="space-y-1">
            <div className="h-1.5 w-full rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${volumeDiscountInfo.color}`}
                initial={{ width: 0 }}
                animate={{ width: `${volumeDiscountInfo.fill}%` }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            </div>
            <p className={`text-[10px] font-medium ${volumeDiscountInfo.textColor} text-center`}>
              {volumeDiscountInfo.label}
            </p>
          </div>
        </div>

          <div className="space-y-1.5">
            {serviceType !== "binding" && (
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">التوصيل</Label>
                <div className="grid grid-cols-3 gap-1.5">
                  {DELIVERY_OPTIONS.map((d) => (
                    <button
                      key={d.id}
                      onClick={() => setDelivery(d.id)}
                      className={`rounded-lg py-2 text-[10px] font-medium transition-colors border-2 ${
                        delivery === d.id
                          ? "border-amber-400 bg-amber-50 text-amber-800 dark:bg-amber-950/40 shadow-sm"
                          : "border-transparent bg-background hover:bg-muted/50"
                      }`}
                    >
                      <span className="text-[9px]">{d.emoji}</span>
                      <span className="text-[9px]">{d.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <motion.div
            key={priceKey}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="rounded-xl border-2 border-amber-200 dark:border-amber-800/60 bg-gradient-to-br from-white to-amber-50/80 dark:from-neutral-900 to-neutral-800 p-5 space-y-3"
          >
            <div className="text-center mb-3">
              <span className="text-xs text-amber-700 dark:text-amber-400 font-medium">
                {SERVICE_OPTIONS.find((s) => s.type === serviceType)?.emoji}{" "}
                {SERVICE_OPTIONS.find((s) => s.type === serviceType)?.label}
              </span>
              <div className="text-xs text-muted-foreground mb-3">السعر التقديري</div>
            </div>

            <div className="space-y-2">
              <AnimatePresence mode="popLayout">
                {breakdownItems.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 8 }}
                    transition={{ duration: 0.25, delay: index * 0.04 }}
                  >
                    {item.content}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            <div className="border-t border-dashed border-amber-200 dark:border-amber-800/40 pt-3 mt-1" />

            <div className="flex justify-between items-end">
              <div className="text-xs text-muted-foreground">المجموع الإجمالي</div>
              <div className="flex items-center gap-2">
                <motion.span
                  key={price.total}
                  initial={{ scale: 1 }}
                  animate={{ scale: [1, 1.08, 1] }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                  className="text-2xl font-black text-amber-800 dark:text-amber-400 inline-block"
                >
                  {fmt(price.total)} دج
                </motion.span>
                <motion.button
                  onClick={handleCopyPrice}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-900/60 transition-colors"
                  title="نسخ السعر"
                >
                  <Copy className="h-3.5 w-3.5" />
                </motion.button>
              </div>
            </div>

            {serviceType === "document" && (
              <div className="grid grid-cols-3 gap-2 text-[10px] text-muted-foreground mt-2 pt-2 border-t border-dashed border-amber-200/60 dark:border-amber-800/40">
                {[
                  { num: 10, priceVal: price.pagesCost * 10 },
                  { num: 50, priceVal: price.pagesCost * 50 - Math.floor(price.pagesCost * 50 * 0.1) },
                  { num: 100, priceVal: price.pagesCost * 100 - Math.floor(price.pagesCost * 100 * 0.15) },
                ].map((ref) => (
                  <motion.button
                    key={ref.num}
                    onClick={() => handleQuickCopies(ref.num)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="text-center p-1.5 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-colors cursor-pointer"
                    title={`تعيين ${ref.num} نسخة`}
                  >
                    <div className="font-medium">{ref.num} نسخ</div>
                    <div className="text-emerald-700 font-bold">{fmt(ref.priceVal)}</div>
                  </motion.button>
                ))}
              </div>
            )}
          </motion.div>
      </div>
  );
}