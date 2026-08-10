"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
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

/* ─────────────────────────────────────────────
   Three rotating rings + scattered dots
   ───────────────────────────────────────────── */
function FloatingGeometry({ accent }: { accent: string }) {
  const dots = useMemo(
    () => [
      { x: "22%", y: "28%", s: 3, d: 0 },
      { x: "76%", y: "15%", s: 2.5, d: 0.5 },
      { x: "82%", y: "68%", s: 3.5, d: 1.0 },
      { x: "14%", y: "72%", s: 2, d: 0.8 },
      { x: "52%", y: "10%", s: 2.5, d: 0.3 },
    ],
    []
  );

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Ring 1 — large, slow clockwise */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: 260,
          height: 260,
          top: "-15%",
          right: "-12%",
          border: `1.5px solid ${accent}18`,
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
      />

      {/* Ring 2 — medium, slow counter-clockwise */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: 180,
          height: 180,
          bottom: "5%",
          left: "-6%",
          border: `1px solid ${accent}14`,
        }}
        animate={{ rotate: -360 }}
        transition={{ duration: 38, repeat: Infinity, ease: "linear" }}
      />

      {/* Ring 3 — small, faster clockwise */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: 110,
          height: 110,
          top: "30%",
          left: "18%",
          border: `1px solid ${accent}20`,
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 28, repeat: Infinity, ease: "linear" }}
      />

      {/* Scattered dots */}
      {dots.map((dot, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: dot.s,
            height: dot.s,
            left: dot.x,
            top: dot.y,
            backgroundColor: accent,
          }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: [0, 0.3, 0.12, 0.3], scale: [0, 1, 0.7, 1] }}
          transition={{
            duration: 5,
            delay: dot.d,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Main Intro — Modern Minimal Split-Screen
   ───────────────────────────────────────────── */
export function Intro({ onFinish }: IntroProps) {
  const [settings, setSettings] = useState<IntroSettings>(DEFAULT_INTRO);
  const [loaded, setLoaded] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [progress, setProgress] = useState(0);
  const { resolvedTheme } = useTheme();

  // Fetch & merge settings from API
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

  const topBg = useMemo(() => {
    if (isDark)
      return `linear-gradient(155deg, ${settings.bgColor || "#0a0a0b"} 0%, #111113 60%, #0c0c0e 100%)`;
    return `linear-gradient(155deg, #f3efe7 0%, #ebe7df 60%, #f7f3ec 100%)`;
  }, [isDark, settings.bgColor]);

  const bottomBg = isDark
    ? settings.bgColor || "#0a0a0b"
    : "#faf8f3";

  const mutedColor = isDark ? "#8b8b96" : "#7c7c85";
  const progressTrack = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";

  const stableFinish = useCallback(() => onFinish(), [onFinish]);

  // Progress ticker
  useEffect(() => {
    if (!loaded || !settings.enabled || exiting) return;
    const dur = settings.duration || 3500;
    const step = 40;
    const inc = (step / dur) * 100;
    const id = setInterval(() => {
      setProgress((p) => {
        const n = p + inc;
        if (n >= 100) {
          clearInterval(id);
          return 100;
        }
        return n;
      });
    }, step);
    return () => clearInterval(id);
  }, [loaded, settings.enabled, settings.duration, exiting]);

  // Exit & finish timers
  useEffect(() => {
    if (!loaded) return;
    if (!settings.enabled) {
      stableFinish();
      return;
    }
    const dur = settings.duration || 3500;
    const t1 = setTimeout(() => setExiting(true), dur - 480);
    const t2 = setTimeout(() => stableFinish(), dur);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [loaded, settings, stableFinish]);

  if (!loaded || !settings.enabled) return null;

  const easeOut = [0.22, 1, 0.36, 1] as const;
  const easeIn = [0.4, 0, 0.2, 1] as const;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[100] flex flex-col overflow-hidden"
        dir="rtl"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5, ease: easeIn }}
      >
        {/* ═══════════ TOP 55% — gradient + rings + logo ═══════════ */}
        <motion.div
          className="relative w-full flex items-center justify-center overflow-hidden"
          style={{ height: "55%", background: topBg }}
          initial={{ y: 0, opacity: 1 }}
          animate={
            exiting
              ? { y: "-25%", opacity: 0 }
              : { y: 0, opacity: 1 }
          }
          transition={{ duration: 0.48, ease: easeIn }}
        >
          <FloatingGeometry accent={accent} />

          {/* Logo — scale-in from 0 */}
          <motion.div
            className="relative z-10"
            initial={{ opacity: 0, scale: 0 }}
            animate={
              exiting
                ? { opacity: 0, scale: 0.85, y: -20 }
                : { opacity: 1, scale: 1, y: 0 }
            }
            transition={{
              duration: 0.9,
              delay: 0.15,
              ease: easeOut,
            }}
          >
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center overflow-hidden">
              <Image
                src="/n.png"
                alt="طيف"
                width={96}
                height={96}
                className="w-full h-full object-contain p-2.5"
                priority
              />
            </div>
          </motion.div>
        </motion.div>

        {/* ═══════════ BOTTOM 45% — slides up ═══════════ */}
        <motion.div
          className="relative w-full flex flex-col items-center justify-center gap-5 px-6"
          style={{ height: "45%", backgroundColor: bottomBg }}
          initial={{ y: "100%", opacity: 0 }}
          animate={
            exiting
              ? { y: "30%", opacity: 0 }
              : { y: 0, opacity: 1 }
          }
          transition={{ duration: 0.48, ease: easeIn }}
        >
          {/* Brand name — accent, bold */}
          <motion.h1
            className="text-4xl sm:text-5xl font-extrabold tracking-tight"
            style={{ color: accent }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: exiting ? 0 : 1, y: exiting ? 10 : 0 }}
            transition={{ duration: 0.65, delay: 0.55, ease: easeOut }}
          >
            {settings.title}
          </motion.h1>

          {/* Tagline — muted */}
          {settings.subtitle && (
            <motion.p
              className="text-sm sm:text-[15px] font-light tracking-wide text-center max-w-[260px]"
              style={{ color: mutedColor }}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: exiting ? 0 : 0.85, y: exiting ? 8 : 0 }}
              transition={{ duration: 0.6, delay: 0.75, ease: easeOut }}
            >
              {settings.subtitle}
            </motion.p>
          )}

          {/* Thin progress line */}
          {settings.showProgress && (
            <motion.div
              className="w-40 sm:w-48 mt-1"
              initial={{ opacity: 0, scaleX: 0 }}
              animate={{ opacity: exiting ? 0 : 1, scaleX: exiting ? 0.5 : 1 }}
              transition={{ duration: 0.5, delay: 0.6, ease: "easeOut" }}
            >
              <div
                className="h-[1.5px] rounded-full overflow-hidden"
                style={{ backgroundColor: progressTrack }}
              >
                <motion.div
                  className="h-full rounded-full"
                  style={{
                    background: accent,
                    width: `${progress}%`,
                    opacity: 0.5,
                  }}
                  transition={{ duration: 0.04, ease: "linear" }}
                />
              </div>
            </motion.div>
          )}

          {/* Footer text if any */}
          {settings.footerText && (
            <motion.span
              className="absolute bottom-4 text-[10px]"
              style={{ color: mutedColor }}
              initial={{ opacity: 0 }}
              animate={{ opacity: exiting ? 0 : 0.35 }}
              transition={{ delay: 1.4, duration: 0.8 }}
            >
              {settings.footerText}
            </motion.span>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
