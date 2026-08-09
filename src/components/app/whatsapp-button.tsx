"use client";

import { useState } from "react";
import { useAppStore } from "@/lib/store";

export function WhatsAppButton() {
  const view = useAppStore((s) => s.view);
  const [showTooltip, setShowTooltip] = useState(false);

  if (view === "admin") return null;

  const whatsappUrl =
    "https://wa.me/0560000000?text=" +
    encodeURIComponent("مرحباً، أريد طلب طباعة.");

  return (
    <div className="fixed bottom-24 left-4 z-50 flex flex-col items-center gap-2 no-print">
      {/* Tooltip */}
      <div
        className={`transition-all duration-200 ${
          showTooltip
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-2 pointer-events-none"
        }`}
      >
        <div className="bg-neutral-900 dark:bg-neutral-800 text-white text-xs font-medium px-3 py-1.5 rounded-lg shadow-lg whitespace-nowrap">
          اطلب عبر واتساب
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 rotate-45 w-2.5 h-2.5 bg-neutral-900 dark:bg-neutral-800" />
        </div>
      </div>

      {/* Button */}
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onFocus={() => setShowTooltip(true)}
        onBlur={() => setShowTooltip(false)}
        aria-label="اطلب عبر واتساب"
        className="animate-whatsapp-pulse group w-14 h-14 sm:w-14 sm:h-14 max-[640px]:w-12 max-[640px]:h-12 bg-[#25D366] hover:bg-[#1EBE5A] rounded-full flex items-center justify-center shadow-lg shadow-[#25D366]/30 hover:shadow-xl hover:shadow-[#25D366]/40 transition-all duration-200 hover:scale-105 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#25D366]"
      >
        {/* WhatsApp SVG Icon */}
        <svg
          viewBox="0 0 32 32"
          fill="white"
          className="w-7 h-7 max-[640px]:w-6 max-[640px]:h-6 transition-transform duration-200 group-hover:scale-110"
          aria-hidden="true"
        >
          <path d="M16.003 2.668A13.263 13.263 0 0 0 2.742 15.93a13.17 13.17 0 0 0 1.762 6.6L2.668 29.33l6.993-1.825a13.2 13.2 0 0 0 6.342 1.615A13.263 13.263 0 0 0 29.332 15.93 13.263 13.263 0 0 0 16.003 2.668zm7.647 18.753a4.405 4.405 0 0 1-2.827 2.085 5.5 5.5 0 0 1-2.515-.157 22.8 22.8 0 0 1-2.22-.82 17.25 17.25 0 0 1-8.435-8.435 9.2 9.2 0 0 1-1.158-3.098 4.405 4.405 0 0 1 1.327-3.99 1.463 1.463 0 0 1 1.055-.488c.26 0 .52.003.753.013.24.012.563-.092.877.67.32.775 1.092 2.665 1.188 2.86.096.193.16.42.033.677-.128.257-.192.42-.383.647-.192.228-.405.508-.577.682-.192.193-.393.403-.17.79.224.387.994 1.64 2.135 2.655 1.467 1.297 2.703 1.7 3.088 1.893.385.193.61.162.835-.098.224-.26.96-1.12 1.217-1.503.256-.384.513-.32.865-.192.352.128 2.238 1.056 2.623 1.248.385.193.64.288.735.448.095.16.095.92-.227 1.803z" />
        </svg>
      </a>
    </div>
  );
}