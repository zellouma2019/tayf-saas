"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { useTheme } from "next-themes";
import type { IntroSettings } from "@/lib/default-settings";

interface IntroProps {
  onFinish: () => void;
}

const DEFAULT_INTRO: IntroSettings = {
  enabled: true,
  title: "طيف",
  subtitle: "منصة طباعة احترافية",
  emoji: "🖨️",
  bgIcon: "Printer",
  duration: 3500,
  footerText: "",
  bgColor: "#0a0a0b",
  accentColor: "#D4AF37",
  showProgress: true,
  showSpinningRing: false,
};

export function Intro({ onFinish }: IntroProps) {
  const [settings, setSettings] = useState<IntroSettings>(DEFAULT_INTRO);
  const [loaded, setLoaded] = useState(false);
  const [phase, setPhase] = useState(0);
  const { resolvedTheme } = useTheme();
  const rafRef = useRef<number>(0);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => {
        if (d.intro) setSettings({ ...DEFAULT_INTRO, ...d.intro });
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  const isDark = resolvedTheme === "dark" || resolvedTheme === undefined;
  const accent = settings.accentColor || "#D4AF37";

  const stableFinish = useCallback(() => onFinish(), [onFinish]);

  // Phase-based animation timeline
  useEffect(() => {
    if (!loaded || !settings.enabled) {
      if (loaded) stableFinish();
      return;
    }
    const dur = settings.duration || 3500;
    const t1 = setTimeout(() => setPhase(1), 200);     // Logo appears
    const t2 = setTimeout(() => setPhase(2), dur * 0.4); // Title appears
    const t3 = setTimeout(() => setPhase(3), dur * 0.7); // Subtitle + progress
    const t4 = setTimeout(() => setPhase(4), dur - 400);  // Exit start
    const t5 = setTimeout(() => stableFinish(), dur);
    return () => {
      clearTimeout(t1); clearTimeout(t2); clearTimeout(t3);
      clearTimeout(t4); clearTimeout(t5);
    };
  }, [loaded, settings, stableFinish]);

  if (!loaded || !settings.enabled) return null;

  const bg = isDark
    ? `radial-gradient(ellipse at 50% 40%, ${accent}10 0%, transparent 60%), #0f1117`
    : `radial-gradient(ellipse at 50% 40%, ${accent}10 0%, transparent 60%), #faf8f2`;

  const textColor = isDark ? "rgba(255,255,255,0.92)" : "#1a1510";
  const mutedColor = isDark ? "rgba(255,255,255,0.5)" : "#7a7060";

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden"
      dir="rtl"
      initial={{ opacity: 0 }}
      animate={{ opacity: phase >= 0 ? 1 : 0 }}
      exit={{ opacity: 0, scale: 1.02 }}
      transition={{ duration: 0.4 }}
      style={{ background: bg }}
    >
      {/* Subtle grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(${accent} 1px, transparent 1px), linear-gradient(90deg, ${accent} 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />

      {/* Accent glow behind logo */}
      <motion.div
        className="absolute w-64 h-64 rounded-full blur-3xl"
        style={{ backgroundColor: accent, opacity: 0.06 }}
        animate={{
          scale: phase >= 1 ? [1, 1.3, 1] : 0.8,
          opacity: phase >= 1 ? [0.06, 0.1, 0.06] : 0,
        }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Logo container */}
      <motion.div
        className="relative z-10 mb-8"
        initial={{ opacity: 0, scale: 0.6, y: 20 }}
        animate={
          phase >= 1
            ? { opacity: 1, scale: 1, y: 0 }
            : phase >= 4
            ? { opacity: 0, scale: 0.9, y: -10 }
            : { opacity: 0, scale: 0.6, y: 20 }
        }
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      >
        <div
          className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl flex items-center justify-center overflow-hidden shadow-2xl"
          style={{
            background: `linear-gradient(135deg, ${accent}20, ${accent}08)`,
            border: `1.5px solid ${accent}25`,
          }}
        >
          <Image
            src="/n.png"
            alt="طيف"
            width={96}
            height={96}
            className="w-16 h-16 sm:w-20 sm:h-20 object-contain"
            priority
          />
        </div>
      </motion.div>

      {/* Brand name */}
      <motion.h1
        className="relative z-10 text-5xl sm:text-6xl font-black tracking-tight"
        style={{ color: accent }}
        initial={{ opacity: 0, y: 16, letterSpacing: "0.3em" }}
        animate={
          phase >= 2
            ? { opacity: 1, y: 0, letterSpacing: "0.05em" }
            : phase >= 4
            ? { opacity: 0, y: -8 }
            : { opacity: 0, y: 16, letterSpacing: "0.3em" }
        }
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      >
        {settings.title}
      </motion.h1>

      {/* Tagline */}
      <motion.p
        className="relative z-10 mt-3 text-sm sm:text-base font-light tracking-wide"
        style={{ color: mutedColor }}
        initial={{ opacity: 0, y: 12 }}
        animate={
          phase >= 3
            ? { opacity: 0.8, y: 0 }
            : phase >= 4
            ? { opacity: 0, y: -6 }
            : { opacity: 0, y: 12 }
        }
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        {settings.subtitle}
      </motion.p>

      {/* Progress indicator */}
      {settings.showProgress && (
        <motion.div
          className="relative z-10 mt-10 w-32"
          initial={{ opacity: 0 }}
          animate={{ opacity: phase >= 3 && phase < 4 ? 1 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="h-[2px] rounded-full overflow-hidden" style={{ backgroundColor: `${accent}15` }}>
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: accent }}
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 800, ease: "linear" }}
            />
          </div>
        </motion.div>
      )}

      {/* Decorative corner lines */}
      <motion.div
        className="absolute top-6 right-6 w-12 h-12"
        style={{ borderColor: `${accent}15` }}
        initial={{ opacity: 0 }}
        animate={{ opacity: phase >= 2 ? 0.6 : 0 }}
        transition={{ duration: 1 }}
      >
        <div className="absolute top-0 right-0 w-full h-[1px]" style={{ backgroundColor: `${accent}25` }} />
        <div className="absolute top-0 right-0 h-full w-[1px]" style={{ backgroundColor: `${accent}25` }} />
      </motion.div>
      <motion.div
        className="absolute bottom-6 left-6 w-12 h-12"
        initial={{ opacity: 0 }}
        animate={{ opacity: phase >= 2 ? 0.6 : 0 }}
        transition={{ duration: 1, delay: 0.2 }}
      >
        <div className="absolute bottom-0 left-0 w-full h-[1px]" style={{ backgroundColor: `${accent}25` }} />
        <div className="absolute bottom-0 left-0 h-full w-[1px]" style={{ backgroundColor: `${accent}25` }} />
      </motion.div>

      {/* Footer text */}
      {settings.footerText && (
        <motion.span
          className="absolute bottom-5 text-[10px]"
          style={{ color: mutedColor }}
          initial={{ opacity: 0 }}
          animate={{ opacity: phase >= 3 ? 0.3 : 0 }}
        >
          {settings.footerText}
        </motion.span>
      )}
    </motion.div>
  );
}
