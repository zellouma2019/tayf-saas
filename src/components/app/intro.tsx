"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import type { IntroSettings } from "@/lib/default-settings";

interface IntroProps {
  onFinish: () => void;
  /** إعدادات الإنترو — تُمرَّر مباشرة من بيانات المتجر (لا حاجة لطلب API) */
  introSettings: IntroSettings | null;
}

const DEFAULT_INTRO: IntroSettings = {
  enabled: true,
  title: "طيف",
  subtitle: "اطبع بسهولة — أسرع من واتساب",
  emoji: "🖨️",
  bgIcon: "Printer",
  duration: 4200,
  footerText: "طيف — منصة إدارة المطابع",
  bgColor: "#1a1a1a",
  accentColor: "#D4AF37",
  showProgress: true,
  showSpinningRing: true,
};

export function Intro({ onFinish, introSettings }: IntroProps) {
  const [phase, setPhase] = useState(0);
  const [skipping, setSkipping] = useState(false);

  const settings: IntroSettings = introSettings
    ? { ...DEFAULT_INTRO, ...introSettings }
    : DEFAULT_INTRO;

  // إذا كان الإنترو معطّل، أنهِ فوراً
  if (!settings.enabled) {
    return null;
  }

  const duration = settings.duration || 4200;

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    timers.push(setTimeout(() => setPhase(1), 200));
    timers.push(setTimeout(() => setPhase(2), Math.min(1000, duration * 0.24)));
    timers.push(setTimeout(() => setPhase(3), Math.min(1800, duration * 0.43)));
    timers.push(setTimeout(() => setPhase(4), duration - 1000));
    timers.push(setTimeout(() => onFinish(), duration));
    return () => timers.forEach(clearTimeout);
  }, [duration, onFinish]);

  const accent = settings.accentColor || "#D4AF37";
  const bg = settings.bgColor || "#1a1a1a";

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
        {/* نقاط متفرقة */}
        {Array.from({ length: 12 }).map((_, i) => (
          <span
            key={i}
            className="absolute w-1 h-1 rounded-full"
            style={{
              backgroundColor: accent + "4D",
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animation: `pulse 2s ease-in-out ${Math.random() * 2}s infinite`,
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
          {settings.showSpinningRing && (
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
            {settings.title}
          </h1>
        </div>

        {/* الشعار السفلي */}
        {settings.subtitle && (
          <div
            className={`flex items-center gap-2 transition-all duration-500 ${
              phase >= 3 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
            }`}
            style={{ transitionDelay: "0.15s" }}
          >
            <Sparkles className="h-3.5 w-3.5" style={{ color: accent }} />
            <p className={`text-sm sm:text-base font-medium ${phase >= 3 ? 'animate-text-shimmer' : ''}`} style={{ color: phase >= 3 ? undefined : accent + "E6" }}>
              {settings.subtitle}
            </p>
            <Sparkles className="h-3.5 w-3.5" style={{ color: accent }} />
          </div>
        )}

        {/* شريط التحميل */}
        {settings.showProgress && (
          <div
            className={`mt-2 w-32 h-1 rounded-full overflow-hidden transition-all duration-500 ${
              phase >= 3 ? "opacity-100" : "opacity-0"
            }`}
            style={{ transitionDelay: "0.2s", backgroundColor: bg === "#1a1a1a" ? "#404040" : "#ffffff20" }}
          >
            <div
              className="h-full rounded-full"
              style={{
                background: `linear-gradient(to right, ${accent}AA, ${accent})`,
                animation: "introProgress 3s ease-out forwards",
              }}
            />
          </div>
        )}
      </div>

      {/* ===== تذييل ===== */}
      {settings.footerText && (
        <div
          className={`absolute bottom-6 text-center transition-opacity duration-500 ${
            phase >= 3 ? "opacity-60" : "opacity-0"
          }`}
        >
          <p className="text-xs text-neutral-500">{settings.footerText}</p>
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

      {/* ===== أنيميشن CSS ===== */}
      <style jsx>{`
        @keyframes introProgress {
          0% { width: 0%; }
          100% { width: 100%; }
        }
      `}</style>
    </div>
  );
}