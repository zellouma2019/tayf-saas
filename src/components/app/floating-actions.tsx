"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Search, MessageCircle } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { useShop } from "@/lib/shop-context";

interface ActionItem {
  label: string;
  icon: React.ElementType;
  color: string;
  borderAccent: string;
  shadowColor: string;
  onClick: () => void;
}

export function FloatingActions() {
  const view = useAppStore((s) => s.view);
  const setView = useAppStore((s) => s.setView);
  const { shop } = useShop();

  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
      setIsOpen(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, handleClickOutside]);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Hide in admin view (after all hooks)
  if (view === "admin") return null;

  const whatsappNumber = shop?.whatsapp || shop?.phone || "0560000000";
  const whatsappUrl =
    `https://wa.me/${whatsappNumber.replace(/\D/g, "")}?text=` +
    encodeURIComponent("مرحبا، أريد طلب طباعة.");

  const actions: ActionItem[] = [
    {
      label: "طلب جديد",
      icon: Plus,
      color: "bg-primary text-primary-foreground",
      borderAccent: "border-l-primary",
      shadowColor: "shadow-primary/20",
      onClick: () => {
        setView("new");
        setIsOpen(false);
      },
    },
    {
      label: "تتبّع طلب",
      icon: Search,
      color: "bg-emerald-500 text-white",
      borderAccent: "border-l-emerald-500",
      shadowColor: "shadow-emerald-500/20",
      onClick: () => {
        setView("track");
        setIsOpen(false);
      },
    },
    {
      label: "واتساب",
      icon: MessageCircle,
      color: "bg-emerald-600 text-white",
      borderAccent: "border-l-emerald-600",
      shadowColor: "shadow-emerald-600/20",
      onClick: () => {
        window.open(whatsappUrl, "_blank", "noopener,noreferrer");
        setIsOpen(false);
      },
    },
  ];

  const springTransition = { type: "spring" as const, stiffness: 350, damping: 25 };

  return (
    <div
      ref={containerRef}
      className="fixed bottom-20 left-3 z-[60] md:bottom-6 md:left-6 no-print"
      style={{ overflow: "visible" }}
    >
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-16 left-0 flex flex-col-reverse items-start gap-3 mb-1 pointer-events-auto"
            style={{ zIndex: 61 }}
          >
            {actions.map((action, index) => (
              <motion.div
                key={action.label}
                initial={{ opacity: 0, y: 20, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.8 }}
                transition={{
                  ...springTransition,
                  delay: index * 0.05,
                }}
                className="flex items-center gap-3 pointer-events-auto"
              >
                {/* Tooltip label (right side in RTL) */}
                <div className="relative pointer-events-none">
                  <motion.div
                    initial={{ opacity: 0, x: 8, scale: 0.9 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: 8, scale: 0.9 }}
                    transition={{ duration: 0.2, delay: index * 0.05 + 0.05 }}
                    className="bg-foreground text-background text-xs font-semibold px-3.5 py-2 rounded-xl shadow-lg whitespace-nowrap"
                  >
                    {action.label}
                    {/* Pointer arrow pointing left toward the icon (RTL) */}
                    <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 rotate-45 w-3 h-3 bg-foreground shadow-sm" />
                  </motion.div>
                </div>

                {/* Action button */}
                <motion.button
                  onClick={action.onClick}
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.92 }}
                  className={`
                    w-11 h-11 rounded-full flex items-center justify-center
                    border-l-[3px] ${action.borderAccent}
                    ${action.color}
                    shadow-lg ${action.shadowColor}
                    backdrop-blur-sm
                    cursor-pointer pointer-events-auto
                  `}
                  aria-label={action.label}
                >
                  <action.icon className="w-5 h-5" strokeWidth={2.2} />
                </motion.button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main FAB button */}
      <motion.button
        onClick={() => setIsOpen((prev) => !prev)}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.92 }}
        animate={{ rotate: isOpen ? 45 : 0 }}
        transition={springTransition}
        className="
          relative w-[52px] h-[52px] rounded-full
          bg-primary text-primary-foreground
          shadow-lg shadow-primary/25
          hover:shadow-xl hover:shadow-primary/35
          flex items-center justify-center
          cursor-pointer
          border border-primary-foreground/10
        "
        aria-label={isOpen ? "إغلاق القائمة" : "خيارات سريعة"}
        aria-expanded={isOpen}
      >
        {/* Idle pulse ring */}
        {!isOpen && (
          <span className="absolute inset-0 rounded-full animate-ping bg-primary/20" />
        )}

        <Plus className="w-6 h-6 relative z-10" strokeWidth={2.5} />
      </motion.button>
    </div>
  );
}
