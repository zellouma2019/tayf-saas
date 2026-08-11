"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useShop } from "@/lib/shop-context";
import { useAppStore } from "@/lib/store";

export function WhatsAppButton() {
  const view = useAppStore((s) => s.view);
  const [hovered, setHovered] = useState(false);
  const { shop } = useShop();

  if (view === "admin") return null;

  const displayWhatsapp = shop?.whatsapp || shop?.phone || "0560000000";
  const whatsappUrl =
    `https://wa.me/${displayWhatsapp.replace(/\D/g, "")}?text=` +
    encodeURIComponent("مرحباً، أريد طلب طباعة.");

  return (
    <div className="fixed bottom-20 left-3 z-50 md:bottom-6 md:left-6 no-print">
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0, x: -8, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -8, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-1/2 right-full mb-0 mr-3 whitespace-nowrap"
          >
            <div className="bg-foreground text-background text-xs font-semibold px-3.5 py-2 rounded-xl shadow-lg">
              اطلب عبر واتساب
              <div className="absolute -right-1.5 top-1/2 -translate-y-1/2 rotate-45 w-3 h-3 bg-foreground shadow-sm" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onFocus={() => setHovered(true)}
        onBlur={() => setHovered(false)}
        aria-label="اطلب عبر واتساب"
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        className="relative w-11 h-11 md:w-12 md:h-12 bg-[#25D366] hover:bg-[#1EBE5A] rounded-full flex items-center justify-center shadow-lg shadow-[#25D366]/20 hover:shadow-xl hover:shadow-[#25D366]/30 transition-colors duration-200 cursor-pointer"
      >
        {/* Subtle pulse ring on idle */}
        {!hovered && (
          <span className="absolute inset-0 rounded-full animate-ping bg-[#25D366]/20" />
        )}

        {/* WhatsApp Icon */}
        <svg
          viewBox="0 0 32 32"
          fill="white"
          className="w-6 h-6 md:w-7 md:h-7 relative z-10"
          aria-hidden="true"
        >
          <path d="M16.003 2.668A13.263 13.263 0 0 0 2.742 15.93a13.17 13.17 0 0 0 1.762 6.6L2.668 29.33l6.993-1.825a13.2 13.2 0 0 0 6.342 1.615A13.263 13.263 0 0 0 29.332 15.93 13.263 13.263 0 0 0 16.003 2.668zm7.647 18.753a4.405 4.405 0 0 1-2.827 2.085 5.5 5.5 0 0 1-2.515-.157 22.8 22.8 0 0 1-2.22-.82 17.25 17.25 0 0 1-8.435-8.435 9.2 9.2 0 0 1-1.158-3.098 4.405 4.405 0 0 1 1.327-3.99 1.463 1.463 0 0 1 1.055-.488c.26 0 .52.003.753.013.24.012.563-.092.877.67.32.775 1.092 2.665 1.188 2.86.096.193.16.42.033.677-.128.257-.192.42-.383.647-.192.228-.405.508-.577.682-.192.193-.393.403-.17.79.224.387.994 1.64 2.135 2.655 1.467 1.297 2.703 1.7 3.088 1.893.385.193.61.162.835-.098.224-.26.96-1.12 1.217-1.503.256-.384.513-.32.865-.192.352.128 2.238 1.056 2.623 1.248.385.193.64.288.735.448.095.16.095.92-.227 1.803z" />
        </svg>
      </motion.a>
    </div>
  );
}
