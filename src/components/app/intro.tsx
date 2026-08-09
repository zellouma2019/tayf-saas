"use client";

import { useEffect, useState, useMemo } from "react";
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
  duration: 4200,
  footerText: "",
  bgColor: "#0a0a0b",
  accentColor: "#D4AF37",
  showProgress: true,
  showSpinningRing: false,
};

export function Intro({ onFinish }: IntroProps) {
  const [settings, setSettings] = useState<IntroSettings>(DEFAULT_INTRO);
  const [loaded, setLoaded] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [progress, setProgress] = useState(0);
  const { resolvedTheme } = useTheme();

  // تحميل إعدادات الإنترو من API
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

  const bgColor = useMemo(() => {
    if (isDark) return settings.bgColor || "#0a0a0b";
    return "#faf8f2";
  }, [isDark, settings.bgColor]);

  const accent = settings.accentColor || "#D4AF37";
  const textColor = isDark ? "#f5f5f5" : "#1a1a1a";
  const mutedColor = isDark ? "#a1a1aa" : "#71717a";
  const progressBg = isDark ? "#1f1f23" : "#e7e5e4";

  // Progress bar animation
  useEffect(() => {
    if (!loaded || !settings.enabled || exiting) return;
    const duration = settings.duration || 4200;
    const interval = 50;
    const step = (interval / duration) * 100;
    const timer = setInterval(() => {
      setProgress((prev) => {
        const next = prev + step;
        if (next >= 100) {
          clearInterval(timer);
          return 100;
        }
        return next;
      });
    }, interval);
    return () => clearInterval(timer);
  }, [loaded, settings.enabled, settings.duration, exiting]);

  // Exit & finish timing
  useEffect(() => {
    if (!loaded) return;
    if (!settings.enabled) {
      onFinish();
      return;
    }

    const duration = settings.duration || 4200;
    const exitTimer = setTimeout(() => {
      setExiting(true);
    }, duration - 600);
    const finishTimer = setTimeout(() => {
      onFinish();
    }, duration);

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(finishTimer);
    };
  }, [loaded, settings, onFinish]);

  if (!loaded || !settings.enabled) return null;

  return (
    <AnimatePresence>
      {!exiting ? null : null}
      <motion.div
        className="fixed inset-0 z-[100] flex flex-col items-center justify-center"
        style={{ backgroundColor: bgColor }}
        dir="rtl"
        initial={{ opacity: 1 }}
        animate={exiting ? { opacity: 0, scale: 1.02 } : { opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
      >
        {/* Subtle radial glow behind logo */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full pointer-events-none"
          style={{
            background: `radial-gradient(circle, ${accent}12 0%, transparent 70%)`,
          }}
        />

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center gap-5 px-6">
          {/* Logo with scale + fade animation */}
          <motion.div
            initial={{ opacity: 0, scale: 0.7, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{
              duration: 0.9,
              ease: [0.22, 1, 0.36, 1],
              delay: 0.15,
            }}
            className="relative"
          >
            <div
              className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl flex items-center justify-center overflow-hidden"
              style={{
                boxShadow: `0 0 60px ${accent}18, 0 8px 32px rgba(0,0,0,0.3)`,
              }}
            >
              <Image
                src="/n.png"
                alt="طيف"
                width={128}
                height={128}
                className="w-full h-full object-contain p-3"
                priority
              />
            </div>
            {/* Thin golden ring around logo */}
            <motion.div
              className="absolute inset-0 -m-1.5 rounded-[1.35rem] pointer-events-none"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.2, delay: 0.3, ease: "easeOut" }}
              style={{
                border: `1.5px solid ${accent}30`,
              }}
            />
          </motion.div>

          {/* Brand name "طيف" */}
          <motion.h1
            className="text-4xl sm:text-5xl font-bold tracking-tight"
            style={{ color: accent }}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.7,
              ease: [0.22, 1, 0.36, 1],
              delay: 0.6,
            }}
          >
            {settings.title}
          </motion.h1>

          {/* Tagline */}
          {settings.subtitle && (
            <motion.p
              className="text-sm sm:text-base font-medium tracking-wide"
              style={{ color: mutedColor }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.6,
                ease: [0.22, 1, 0.36, 1],
                delay: 0.85,
              }}
            >
              {settings.subtitle}
            </motion.p>
          )}
        </div>

        {/* Progress bar at bottom */}
        {settings.showProgress && (
          <motion.div
            className="absolute bottom-10 left-1/2 -translate-x-1/2 w-48 sm:w-56"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            <div
              className="h-[2px] rounded-full overflow-hidden"
              style={{ backgroundColor: progressBg }}
            >
              <motion.div
                className="h-full rounded-full"
                style={{
                  background: `linear-gradient(90deg, ${accent}80, ${accent})`,
                  width: `${progress}%`,
                }}
                transition={{ duration: 0.05, ease: "linear" }}
              />
            </div>
          </motion.div>
        )}

        {/* Footer text if set */}
        {settings.footerText && (
          <motion.p
            className="absolute bottom-4 text-[10px]"
            style={{ color: mutedColor }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            transition={{ delay: 1, duration: 0.8 }}
          >
            {settings.footerText}
          </motion.p>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
