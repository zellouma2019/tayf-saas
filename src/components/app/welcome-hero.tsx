"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles } from "lucide-react";
import { useShop } from "@/lib/shop-context";
import { Button } from "@/components/ui/button";

const STORAGE_KEY_PREFIX = "tayf_welcome_dismissed_";

export function WelcomeHero({ onDismiss }: { onDismiss?: () => void }) {
  const { shop } = useShop();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!shop?.slug) return;
    const dismissed = localStorage.getItem(STORAGE_KEY_PREFIX + shop.slug);
    if (!dismissed) {
      // Small delay to let the page render first
      const timer = setTimeout(() => setVisible(true), 600);
      return () => clearTimeout(timer);
    }
  }, [shop?.slug]);

  const handleDismiss = () => {
    if (shop?.slug) {
      localStorage.setItem(STORAGE_KEY_PREFIX + shop.slug, "true");
    }
    setVisible(false);
    onDismiss?.();
  };

  if (!shop) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          dir="rtl"
          initial={{ opacity: 0, y: -20, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.98 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className={
            "relative w-full overflow-hidden rounded-2xl " +
            "bg-gradient-to-bl from-emerald-500 via-teal-500 to-cyan-600 " +
            "shadow-xl"
          }
        >
          {/* Animated background pattern */}
          <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
            <motion.div
              className="absolute -top-10 -left-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"
              animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className="absolute -bottom-10 -right-10 w-48 h-48 bg-white/10 rounded-full blur-2xl"
              animate={{ x: [0, -20, 0], y: [0, 20, 0] }}
              transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className="absolute top-1/2 left-1/2 w-32 h-32 bg-white/5 rounded-full blur-xl"
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>

          {/* Close button */}
          <button
            onClick={handleDismiss}
            className="absolute top-3 left-3 z-10 p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
            aria-label="إغلاق"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Content */}
          <div className="relative z-10 flex flex-col items-center gap-4 px-6 py-10 text-center md:py-14 md:px-10">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.3, duration: 0.6, type: "spring", stiffness: 150 }}
              className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center"
            >
              <Sparkles className="h-7 w-7 text-white" />
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="text-2xl md:text-3xl font-bold text-white leading-snug"
            >
              مرحباً بك في {shop.name}! 🖨️
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55, duration: 0.5 }}
              className="text-white/85 text-sm md:text-base max-w-md leading-relaxed"
            >
              نقدم لك خدمات الطباعة الاحترافية بأعلى جودة وأسرع وقت تسليم.
              <br />
              اطلب الآن واستمتع بتجربة فريدة!
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.5 }}
            >
              <Button
                size="lg"
                onClick={handleDismiss}
                className={
                  "bg-white text-teal-700 hover:bg-white/90 font-bold " +
                  "shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                }
              >
                ابدأ طلبك الآن
              </Button>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
