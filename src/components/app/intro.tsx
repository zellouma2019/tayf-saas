"use client";

import { useEffect, useState, useMemo } from "react";
import { Sparkles } from "lucide-react";
import { useShop } from "@/lib/shop-context";
import { DEFAULT_SETTINGS, type IntroSettings } from "@/lib/default-settings";

interface IntroProps {
  onFinish: () => void;
}

// مواقع ثابتة للنقاط بدلاً من Math.random() لتجنب مشاكل الـ hydration
const DOT_POSITIONS = [
  { top: 12, left: 8 },
  { top: 25, left: 85 },
  { top: 45, left: 15 },
  { top: 60, left: 92 },
  { top: 78, left: 25 },
  { top: 15, left: 55 },
  { top: 35, left: 70 },
  { top: 55, left: 40 },
  { top: 72, left: 60 },
  { top: 88, left: 10 },
  { top: 90, left: 78 },
  { top: 5, left: 35 },
];

export function Intro({ onFinish }: IntroProps) {
  const { shop } = useShop();
  const [phase, setPhase] = useState(0);
  const [skipping, setSkipping] = useState(false);

  // قراءة إعدادات الإنترو من سياق المتجر (بدلاً من API مباشرة)
  const introSettings = useMemo((): IntroSettings => {
    try {
      const raw = (shop?.settings as string) || "{}";
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_SETTINGS.intro, ...(parsed.intro ?? {}) };
    } catch {
      return DEFAULT_SETTINGS.intro;
    }
  }, [shop?.settings]);

  useEffect(() => {
    if (!introSettings.enabled) {
      onFinish();
      return;
    }

    const duration = introSettings.duration || 4200;
    const timers: ReturnType<typeof setTimeout>[] = [];
    timers.push(setTimeout(() => setPhase(1), 200));
    timers.push(setTimeout(() => setPhase(2), Math.min(1000, duration * 0.24)));
    timers.push(setTimeout(() => setPhase(3), Math.min(1800, duration * 0.43)));
    timers.push(setTimeout(() => setPhase(4), duration - 1000));
    timers.push(setTimeout(() => onFinish(), duration));
    return () => timers.forEach(clearTimeout);
  }, [introSettings, onFinish]);

  // إذا الإنترو معطّل، لا تعرض شيئاً
  if (!introSettings.enabled) return null;

  const accent = introSettings.accentColor || "#D4AF37";
  const bg = introSettings.bgColor || "#1a1a1a";

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center transition-all duration-700 ${
        phase >= 4 ? "opacity-0 scale-105 pointer-events-none" : "opacity-100"
      }`}
      style={{ backgroundColor: bg, color: "#fff" }}
      dir="rtl"
    >
      {/* ===== خلفية متدرجة متحركة ===== */}
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="absolute -top-1/4 -right-1/4 w-[600px] h-[600px] rounded-full blur-3xl animate-pulse"
          style={{ backgroundColor: accent + "1A" }}
        />
        <div
          className="absolute -bottom-1/4 -left-1/4 w-[500px] h-[500px] rounded-full blur-3xl animate-pulse"
          style={{ backgroundColor: accent + "14", animationDelay: "0.5s" }}
        />
        {/* نقاط متفرقة — مواقع ثابتة لتجنب مشاكل الـ hydration */}
        {DOT_POSITIONS.map((pos, i) => (
          <span
            key={i}
            className="absolute w-1 h-1 rounded-full"
            style={{
              backgroundColor: accent + "4D",
              top: `${pos.top}%`,
              left: `${pos.left}%`,
              animation: `pulse 2s ease-in-out ${(i * 0.18) % 2}s infinite`,
            }}
          />
        ))}
      </div>

      {/* ===== المحتوى ===== */}
      <div className="relative z-10 flex flex-col items-center gap-4 px-6">
        {/* الأيقونة / الإيموجي */}
        <div
          className={`relative transition-all duration-700 ${
            phase >= 1
              ? "opacity-100 scale-100 translate-y-0"
              : "opacity-0 scale-50 translate-y-8"
          } ${phase >= 1 && phase < 4 ? 'animate-float-gentle' : ''}`}
        >
          {/* الشعار */}
          <img src="/brand/tayf-logo.png" alt="طيف" className="w-20 h-20 sm:w-24 sm:h-24 dark:hidden" />
          <img src="/brand/tayf-logo-dark.png" alt="طيف" className="w-20 h-20 sm:w-24 sm:h-24 hidden dark:block" />
          {/* حلقة دوارة */}
          {introSettings.showSpinningRing && (
            <div
              className="absolute inset-0 -m-2 rounded-2xl border-2 animate-spin"
              style={{
                borderColor: accent + "4D",
                borderTopColor: accent,
                animationDuration: "1.2s",
              }}
            />
          )}
        </div>

        {/* العنوان */}
        <div
          className={`text-center transition-all duration-500 ${
            phase >= 2 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
          style={{ transitionDelay: "0.1s" }}
        >
          <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
            {introSettings.title}
          </h1>
        </div>

        {/* الشعار السفلي */}
        {introSettings.subtitle && (
          <div
            className={`flex items-center gap-2 transition-all duration-500 ${
              phase >= 3 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
            }`}
            style={{ transitionDelay: "0.15s" }}
          >
            <Sparkles className="h-3.5 w-3.5" style={{ color: accent }} />
            <p className={`text-sm sm:text-base font-medium ${phase >= 3 ? 'animate-text-shimmer' : ''}`} style={{ color: phase >= 3 ? undefined : accent + "E6" }}>
              {introSettings.subtitle}
            </p>
            <Sparkles className="h-3.5 w-3.5" style={{ color: accent }} />
          </div>
        )}

        {/* شريط التحميل */}
        {introSettings.showProgress && (
          <div
            className={`mt-2 w-32 h-1 rounded-full overflow-hidden transition-all duration-500 ${
              phase >= 3 ? "opacity-100" : "opacity-0"
            }`}
            style={{ transitionDelay: "0.2s", backgroundColor: bg === "#1a1a1a" ? "#404040" : "#ffffff20" }}
          >
            <div
              className="h-full rounded-full animate-intro-progress"
              style={{
                background: `linear-gradient(to right, ${accent}AA, ${accent})`,
              }}
            />
          </div>
        )}
      </div>

      {/* ===== تذييل ===== */}
      {introSettings.footerText && (
        <div
          className={`absolute bottom-6 text-center transition-opacity duration-500 ${
            phase >= 3 ? "opacity-60" : "opacity-0"
          }`}
        >
          <p className="text-xs text-neutral-500">{introSettings.footerText}</p>
        </div>
      )}

      {/* ===== زر تخطي ===== */}
      {phase < 4 && (
        <button
          onClick={() => { setSkipping(true); onFinish(); }}
          disabled={skipping}
          className={`absolute top-6 left-6 z-20 flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border transition-all duration-300 ${skipping ? 'opacity-40 cursor-not-allowed' : 'opacity-60 hover:opacity-100 hover:bg-white/10'}`}
          style={{ borderColor: accent + "4D", color: accent + "CC" }}
          aria-label="تخطي الإنترو"
        >
          تخطي ←
        </button>
      )}
    </div>
  );
}