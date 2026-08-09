"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ColorPalette {
  name: string;
  primary: string;
  accent: string;
}

interface FontOption {
  name: string;
  family: string;
}

interface LayoutOption {
  name: string;
  label: string;
}

const colorPalettes: ColorPalette[] = [
  { name: "نيلي", primary: "#6366f1", accent: "#8b5cf6" },
  { name: "زمردي", primary: "#10b981", accent: "#06b6d4" },
  { name: "عنبري", primary: "#f59e0b", accent: "#ef4444" },
];

const fontOptions: FontOption[] = [
  { name: "عصري", family: "'Noto Sans SC', sans-serif" },
  { name: "كلاسيكي", family: "'Noto Serif SC', serif" },
  { name: "مدمج", family: "'LXGW WenKai', cursive" },
];

const layoutOptions: LayoutOption[] = [
  { name: "عصري", label: "تخطيط عصري" },
  { name: "كلاسيكي", label: "تخطيط كلاسيكي" },
];

export default function ShopCustomizationPreview() {
  const [selectedPalette, setSelectedPalette] = useState(0);
  const [selectedFont, setSelectedFont] = useState(0);
  const [selectedLayout, setSelectedLayout] = useState(0);

  const palette = colorPalettes[selectedPalette];
  const font = fontOptions[selectedFont];

  return (
    <div className="space-y-5">
      <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
        تخصيص واجهة المتجر
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Live Preview */}
        <div className="card-spotlight p-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${selectedPalette}-${selectedFont}-${selectedLayout}`}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.3 }}
              className="rounded-2xl overflow-hidden"
              style={{ fontFamily: font.family }}
            >
              {/* Preview Header */}
              <div
                className="px-6 py-5"
                style={{
                  background: `linear-gradient(135deg, ${palette.primary}, ${palette.accent})`,
                }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white font-bold text-lg">
                    ط
                  </div>
                  <div>
                    <p className="text-white font-bold text-sm">مطبعة الريان</p>
                    <p className="text-white/70 text-xs">طباعة أونلاين</p>
                  </div>
                </div>
                <p className="text-white/90 text-xs">
                  {layoutOptions[selectedLayout].label} — خط: {font.name}
                </p>
              </div>

              {/* Preview Body */}
              <div className="p-6 bg-white dark:bg-neutral-800 space-y-3">
                <div
                  className="h-2 rounded-full"
                  style={{ backgroundColor: palette.primary + "20" }}
                />
                <div className="flex gap-2">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="flex-1 h-16 rounded-lg"
                      style={{
                        backgroundColor:
                          palette.primary + (i === 1 ? "15" : i === 2 ? "10" : "08"),
                      }}
                    />
                  ))}
                </div>
                <div className="flex gap-2">
                  <div
                    className="flex-1 h-8 rounded-lg"
                    style={{ backgroundColor: palette.primary }}
                  />
                  <div className="flex-1 h-8 rounded-lg bg-neutral-200 dark:bg-neutral-700" />
                </div>
                <div className="flex gap-3 text-xs text-neutral-400">
                  <span>خدمة 1</span>
                  <span>خدمة 2</span>
                  <span>خدمة 3</span>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Customization Controls */}
        <div className="space-y-5">
          {/* Color Palettes */}
          <div className="space-y-2">
            <p className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">الألوان</p>
            <div className="flex gap-3">
              {colorPalettes.map((p, i) => (
                <button
                  key={p.name}
                  onClick={() => setSelectedPalette(i)}
                  className={`flex-1 p-3 rounded-xl border-2 transition-all cursor-pointer ${
                    selectedPalette === i
                      ? "border-current scale-105"
                      : "border-transparent hover:border-neutral-200 dark:hover:border-neutral-700"
                  }`}
                  style={{
                    background: `linear-gradient(135deg, ${p.primary}20, ${p.accent}20)`,
                    borderColor: selectedPalette === i ? p.primary : undefined,
                  }}
                >
                  <div className="flex gap-2 justify-center mb-2">
                    <div
                      className="w-5 h-5 rounded-full"
                      style={{ backgroundColor: p.primary }}
                    />
                    <div
                      className="w-5 h-5 rounded-full"
                      style={{ backgroundColor: p.accent }}
                    />
                  </div>
                  <p
                    className="text-xs font-medium text-center"
                    style={{ color: p.primary }}
                  >
                    {p.name}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Font Options */}
          <div className="space-y-2">
            <p className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">الخط</p>
            <div className="flex gap-2">
              {fontOptions.map((f, i) => (
                <button
                  key={f.name}
                  onClick={() => setSelectedFont(i)}
                  className={`flex-1 py-3 rounded-xl border-2 text-sm font-medium transition-all cursor-pointer ${
                    selectedFont === i
                      ? "bg-white dark:bg-neutral-800 border-gold-500 text-gold-600 dark:text-gold-400 shadow-sm"
                      : "bg-neutral-50 dark:bg-neutral-800/50 border-transparent hover:border-neutral-200 dark:hover:border-neutral-700 text-neutral-600 dark:text-neutral-400"
                  }`}
                  style={{ fontFamily: f.family }}
                >
                  {f.name}
                </button>
              ))}
            </div>
          </div>

          {/* Layout Options */}
          <div className="space-y-2">
            <p className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">التخطيط</p>
            <div className="flex gap-2">
              {layoutOptions.map((l, i) => (
                <button
                  key={l.name}
                  onClick={() => setSelectedLayout(i)}
                  className={`flex-1 py-3 rounded-xl border-2 text-sm font-medium transition-all cursor-pointer ${
                    selectedLayout === i
                      ? "bg-white dark:bg-neutral-800 border-gold-500 text-gold-600 dark:text-gold-400 shadow-sm"
                      : "bg-neutral-50 dark:bg-neutral-800/50 border-transparent hover:border-neutral-200 dark:hover:border-neutral-700 text-neutral-600 dark:text-neutral-400"
                  }`}
                >
                  {l.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
