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
  duration: 4200,
  footerText: "",
  bgColor: "#0a0a0b",
  accentColor: "#D4AF37",
  showProgress: true,
  showSpinningRing: false,
};

/* ──────────────────────────────────────────────
   Floating ambient orbs (CSS keyframes for perf)
   ────────────────────────────────────────────── */
const ORB_STYLES = [
  // orb 1 – large, top-left, slow drift
  {
    size: 340,
    top: "-8%",
    left: "-6%",
    animName: "orb-drift-1",
    duration: 18,
    opacity: 0.07,
  },
  // orb 2 – medium, bottom-right, medium drift
  {
    size: 260,
    top: "auto",
    bottom: "-5%",
    right: "-4%",
    left: "auto",
    animName: "orb-drift-2",
    duration: 22,
    opacity: 0.06,
  },
  // orb 3 – small, center-right, slow rise
  {
    size: 180,
    top: "30%",
    left: "65%",
    animName: "orb-drift-3",
    duration: 25,
    opacity: 0.05,
  },
  // orb 4 – tiny, top-right accent
  {
    size: 120,
    top: "15%",
    right: "10%",
    left: "auto",
    animName: "orb-drift-4",
    duration: 20,
    opacity: 0.04,
  },
];

function AmbientOrbs({ accent }: { accent: string }) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Keyframe definitions injected once */}
      <style>{`
        @keyframes orb-drift-1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, 20px) scale(1.05); }
          66% { transform: translate(-15px, 35px) scale(0.97); }
        }
        @keyframes orb-drift-2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(-25px, -20px) scale(1.03); }
          66% { transform: translate(20px, -30px) scale(0.96); }
        }
        @keyframes orb-drift-3 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-20px, -25px) scale(1.08); }
        }
        @keyframes orb-drift-4 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(15px, 20px) scale(1.1); }
        }
        @keyframes shimmer-sweep {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        @keyframes breathing-glow {
          0%, 100% { box-shadow: 0 0 30px var(--glow-color), 0 0 60px var(--glow-color-dim); }
          50% { box-shadow: 0 0 50px var(--glow-color), 0 0 100px var(--glow-color-dim); }
        }
        @keyframes progress-glow-pulse {
          0%, 100% { opacity: 0.8; }
          50% { opacity: 1; }
        }
      `}</style>

      {ORB_STYLES.map((orb, i) => (
        <div
          key={i}
          className="absolute rounded-full blur-3xl"
          style={{
            width: orb.size,
            height: orb.size,
            top: orb.top,
            bottom: orb.bottom,
            left: orb.left,
            right: orb.right,
            background: `radial-gradient(circle, ${accent} 0%, transparent 70%)`,
            opacity: orb.opacity,
            animation: `${orb.animName} ${orb.duration}s ease-in-out infinite`,
          }}
        />
      ))}
    </div>
  );
}

/* ──────────────────────────────────────────────
   Expanding ripple behind the logo
   ────────────────────────────────────────────── */
function LogoRipple({ accent }: { accent: string }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            border: `1px solid ${accent}25`,
          }}
          initial={{ width: 80, height: 80, opacity: 0.6 }}
          animate={{
            width: [80, 300 + i * 80],
            height: [80, 300 + i * 80],
            opacity: [0.5, 0],
          }}
          transition={{
            duration: 2.2,
            delay: 0.4 + i * 0.35,
            ease: [0.22, 1, 0.36, 1],
          }}
        />
      ))}
    </div>
  );
}

/* ──────────────────────────────────────────────
   Shimmer overlay that sweeps across the logo
   ────────────────────────────────────────────── */
function ShimmerOverlay() {
  return (
    <div className="absolute inset-0 overflow-hidden rounded-full pointer-events-none">
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.25) 50%, transparent 60%)",
          animation: "shimmer-sweep 1.5s ease-in-out 1.2s forwards",
          transform: "translateX(-100%)",
        }}
      />
    </div>
  );
}

/* ──────────────────────────────────────────────
   Main Intro Component
   ────────────────────────────────────────────── */
export function Intro({ onFinish }: IntroProps) {
  const [settings, setSettings] = useState<IntroSettings>(DEFAULT_INTRO);
  const [loaded, setLoaded] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [progress, setProgress] = useState(0);
  const { resolvedTheme } = useTheme();

  // Fetch intro settings from API
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
  const mutedColor = isDark ? "#a1a1aa" : "#71717a";
  const progressBg = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";

  // Stable callback to avoid re-triggering useEffect
  const stableOnFinish = useCallback(() => onFinish(), [onFinish]);

  // Progress bar animation
  useEffect(() => {
    if (!loaded || !settings.enabled || exiting) return;
    const duration = settings.duration || 4200;
    const interval = 40;
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
      stableOnFinish();
      return;
    }

    const duration = settings.duration || 4200;
    const exitTimer = setTimeout(() => {
      setExiting(true);
    }, duration - 600);
    const finishTimer = setTimeout(() => {
      stableOnFinish();
    }, duration);

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(finishTimer);
    };
  }, [loaded, settings, stableOnFinish]);

  // Split brand name into individual characters for staggered reveal
  const brandChars = useMemo(() => settings.title.split(""), [settings.title]);

  if (!loaded || !settings.enabled) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden"
        style={{ backgroundColor: bgColor }}
        dir="rtl"
        initial={{ opacity: 1 }}
        animate={
          exiting
            ? { opacity: 0, scale: 1.05, filter: "blur(8px)" }
            : { opacity: 1, scale: 1, filter: "blur(0px)" }
        }
        exit={{ opacity: 0, scale: 1.05, filter: "blur(8px)" }}
        transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
      >
        {/* ═══ Floating ambient orbs ═══ */}
        <AmbientOrbs accent={accent} />

        {/* ═══ Expanding ripple rings behind logo ═══ */}
        <LogoRipple accent={accent} />

        {/* ═══ Central soft radial glow (initial pulse) ═══ */}
        <motion.div
          className="absolute top-1/2 left-1/2 pointer-events-none rounded-full"
          style={{
            width: 280,
            height: 280,
            marginLeft: -140,
            marginTop: -140,
            background: `radial-gradient(circle, ${accent}15 0%, ${accent}05 50%, transparent 80%)`,
          }}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{
            opacity: [0, 0.8, 0.4],
            scale: [0.5, 1.2, 1.0],
          }}
          transition={{
            duration: 1.8,
            times: [0, 0.4, 1],
            ease: "easeOut",
          }}
        />

        {/* ═══ Main content column ═══ */}
        <div className="relative z-10 flex flex-col items-center gap-6 px-6">

          {/* ── Logo with cinematic multi-stage animation ── */}
          <motion.div
            className="relative"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              duration: 0.9,
              delay: 0.3,
              type: "spring",
              stiffness: 180,
              damping: 18,
              mass: 0.8,
            }}
          >
            {/* Breathing glow container */}
            <div
              className="w-28 h-28 sm:w-36 sm:h-36 rounded-full flex items-center justify-center overflow-hidden relative"
              style={{
                "--glow-color": `${accent}30`,
                "--glow-color-dim": `${accent}10`,
                animation: "breathing-glow 3s ease-in-out infinite",
              } as React.CSSProperties}
            >
              {/* Inner subtle border ring */}
              <div
                className="absolute inset-0 rounded-full"
                style={{
                  border: `1.5px solid ${accent}20`,
                }}
              />

              {/* Logo image */}
              <Image
                src="/n.png"
                alt="طيف"
                width={144}
                height={144}
                className="w-full h-full object-contain p-4 relative z-10"
                priority
              />

              {/* Shimmer sweep overlay */}
              <ShimmerOverlay />
            </div>
          </motion.div>

          {/* ── Brand name – character-by-character staggered fade-in ── */}
          <div className="flex gap-1 sm:gap-2">
            {brandChars.map((char, i) => (
              <motion.span
                key={`${char}-${i}`}
                className="text-4xl sm:text-5xl lg:text-6xl font-bold"
                style={{
                  color: accent,
                  display: "inline-block",
                }}
                initial={{ opacity: 0, y: 20, filter: "blur(6px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{
                  duration: 0.5,
                  delay: 1.0 + i * 0.12,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                {char}
              </motion.span>
            ))}
          </div>

          {/* ── Tagline – fade from below with blur-to-clear ── */}
          {settings.subtitle && (
            <motion.p
              className="text-sm sm:text-base font-medium tracking-wide text-center max-w-xs"
              style={{ color: mutedColor }}
              initial={{ opacity: 0, y: 16, filter: "blur(8px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{
                duration: 0.8,
                delay: 1.6,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              {settings.subtitle}
            </motion.p>
          )}
        </div>

        {/* ═══ Elegant progress bar ═══ */}
        {settings.showProgress && (
          <motion.div
            className="absolute bottom-12 left-1/2 -translate-x-1/2 w-52 sm:w-64"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6, ease: "easeOut" }}
          >
            {/* Track */}
            <div
              className="h-[2.5px] rounded-full overflow-visible relative"
              style={{ backgroundColor: progressBg }}
            >
              {/* Fill with gradient */}
              <motion.div
                className="h-full rounded-full relative"
                style={{
                  background: `linear-gradient(90deg, ${accent}40, ${accent}cc, ${accent})`,
                  width: `${progress}%`,
                }}
                transition={{ duration: 0.04, ease: "linear" }}
              >
                {/* Glowing leading edge dot */}
                {progress > 0 && (
                  <motion.div
                    className="absolute -right-1.5 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full"
                    style={{
                      backgroundColor: accent,
                      boxShadow: `0 0 8px ${accent}cc, 0 0 20px ${accent}60, 0 0 40px ${accent}30`,
                      animation: "progress-glow-pulse 1.5s ease-in-out infinite",
                    }}
                  />
                )}
              </motion.div>

              {/* Ambient glow trailing the bar */}
              <motion.div
                className="absolute top-1/2 -translate-y-1/2 h-3 rounded-full pointer-events-none"
                style={{
                  left: 0,
                  width: `${progress}%`,
                  background: `linear-gradient(90deg, transparent, ${accent}08)`,
                  filter: "blur(6px)",
                }}
                transition={{ duration: 0.04, ease: "linear" }}
              />
            </div>
          </motion.div>
        )}

        {/* ═══ Footer text ═══ */}
        {settings.footerText && (
          <motion.p
            className="absolute bottom-5 text-[10px]"
            style={{ color: mutedColor }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            transition={{ delay: 1.8, duration: 0.8 }}
          >
            {settings.footerText}
          </motion.p>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
