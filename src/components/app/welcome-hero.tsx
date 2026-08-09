"use client";

import { motion } from "framer-motion";

/** Inline SVG printer illustration */
function PrinterIllustration({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 180"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <rect x="55" y="8" width="90" height="62" rx="4" fill="oklch(0.99 0.005 85)" stroke="oklch(0.85 0.06 85)" strokeWidth="1.5" />
      <rect x="68" y="20" width="50" height="4" rx="2" fill="oklch(0.85 0.06 85)" opacity="0.7" />
      <rect x="68" y="30" width="64" height="4" rx="2" fill="oklch(0.85 0.06 85)" opacity="0.5" />
      <rect x="68" y="40" width="40" height="4" rx="2" fill="oklch(0.85 0.06 85)" opacity="0.4" />
      <rect x="68" y="50" width="56" height="4" rx="2" fill="oklch(0.85 0.06 85)" opacity="0.3" />
      <rect x="30" y="65" width="140" height="70" rx="12" fill="oklch(0.78 0.13 85)" />
      <rect x="30" y="65" width="140" height="70" rx="12" fill="url(#printerBodyShine)" />
      <rect x="50" y="120" width="100" height="55" rx="4" fill="oklch(0.99 0.005 85)" stroke="oklch(0.85 0.06 85)" strokeWidth="1.5" />
      <rect x="64" y="132" width="56" height="3.5" rx="1.75" fill="oklch(0.85 0.06 85)" opacity="0.5" />
      <rect x="64" y="141" width="44" height="3.5" rx="1.75" fill="oklch(0.85 0.06 85)" opacity="0.4" />
      <rect x="64" y="150" width="60" height="3.5" rx="1.75" fill="oklch(0.85 0.06 85)" opacity="0.3" />
      <rect x="52" y="62" width="96" height="8" rx="2" fill="oklch(0.72 0.14 75)" />
      <circle cx="55" cy="82" r="4" fill="oklch(0.7 0.2 145)" />
      <circle cx="55" cy="82" r="6" fill="oklch(0.7 0.2 145)" opacity="0.25" />
      <rect x="140" y="78" width="14" height="8" rx="3" fill="oklch(0.85 0.1 85)" />
      <rect x="140" y="92" width="14" height="8" rx="3" fill="oklch(0.85 0.1 85)" />
      <rect x="70" y="78" width="58" height="28" rx="4" fill="oklch(0.18 0.02 60)" />
      <text x="99" y="96" textAnchor="middle" fill="oklch(0.82 0.13 85)" fontSize="12" fontFamily="monospace" fontWeight="bold">جاهز ✓</text>
      <defs>
        <linearGradient id="printerBodyShine" x1="30" y1="65" x2="170" y2="135" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="oklch(1 0 0 / 18%)" />
          <stop offset="50%" stopColor="oklch(1 0 0 / 0%)" />
          <stop offset="100%" stopColor="oklch(0 0 0 / 10%)" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/** A single floating decorative particle */
function Particle({ className }: { className: string }) {
  return (
    <span
      className={`absolute rounded-full pointer-events-none ${className}`}
      aria-hidden="true"
    />
  );
}

/**
 * WelcomeHero — مكون ترحيب بدون بيانات إدارية.
 * لا يستدعي أي API محمي ولا يعرض إيرادات أو إحصائيات حساسة.
 */
export function WelcomeHero() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="relative overflow-hidden rounded-2xl border border-amber-200/50 dark:border-amber-800/30"
    >
      <div className="absolute inset-0 hero-gradient-animated" />

      <Particle className="hero-particle-1 w-3 h-3 bg-amber-400/40 dark:bg-amber-500/25 top-[12%] right-[8%]" />
      <Particle className="hero-particle-2 w-2 h-2 bg-orange-300/50 dark:bg-orange-400/20 top-[30%] right-[75%]" />
      <Particle className="hero-particle-3 w-2.5 h-2.5 bg-yellow-400/35 dark:bg-yellow-500/20 top-[55%] right-[18%]" />
      <Particle className="hero-particle-4 w-2 h-2 bg-amber-300/45 dark:bg-amber-400/20 top-[70%] right-[65%]" />
      <Particle className="hero-particle-5 w-3.5 h-3.5 bg-orange-400/30 dark:bg-orange-500/15 top-[20%] right-[45%]" />

      <div className="relative z-10 p-6 sm:p-8 md:p-10">
        <div className="flex flex-col items-center md:flex-row md:items-center md:gap-10 lg:gap-14">
          <div className="flex max-[399px]:hidden justify-center mb-4 md:mb-0 md:flex-shrink-0 w-full md:w-auto md:order-last">
            <motion.div
              initial={{ opacity: 0, scale: 0.85, x: -20 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
              className="w-44 sm:w-48 md:w-52 lg:w-56 drop-shadow-lg"
            >
              <PrinterIllustration className="w-full h-auto" />
            </motion.div>
          </div>

          <div className="flex-1 text-center md:text-right min-w-0 md:order-first">
            <motion.h1
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="text-xl sm:text-2xl md:text-3xl font-bold leading-relaxed text-amber-950 dark:text-amber-50"
            >
              مرحباً بك في{" "}
              <span className="text-gradient-gold">مطبعة الذكي</span>! 🖨️
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.45 }}
              className="mt-3 text-xs sm:text-sm text-amber-700/60 dark:text-amber-300/50 hero-typing-cursor inline-block"
            >
              اطبع خلال دقيقة واحدة — جاهز خلال ساعة ⚡
            </motion.p>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
