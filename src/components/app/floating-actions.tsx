"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Search, MessageCircle } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { useShop } from "@/lib/shop-context";
import { getTheme } from "@/lib/themes";

interface ActionItem {
  label: string;
  icon: React.ElementType;
  color: string;
  onClick: () => void;
}

export function FloatingActions() {
  const view = useAppStore((s) => s.view);
  const setView = useAppStore((s) => s.setView);
  const { shop } = useShop();
  const theme = getTheme(shop?.themeId || 1);

  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  if (view === "admin") return null;

  const whatsappNumber = shop?.whatsapp || shop?.phone || "";
  const whatsappUrl =
    `https://wa.me/${whatsappNumber.replace(/\D/g, "")}?text=` +
    encodeURIComponent("مرحبا، أريد طلب طباعة.");

  const actions: ActionItem[] = [
    {
      label: "طلب جديد",
      icon: Plus,
      color: theme.fab.bg,
      onClick: () => {
        setView("new");
        setIsOpen(false);
      },
    },
    {
      label: "تتبّع طلب",
      icon: Search,
      color: "#059669",
      onClick: () => {
        setView("track");
        setIsOpen(false);
      },
    },
    {
      label: "واتساب",
      icon: MessageCircle,
      color: "#25D366",
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
      className="fixed bottom-24 left-3 z-[9999] md:bottom-6 md:left-6"
      style={{ position: "fixed", zIndex: 9999 }}
    >
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-16 left-0 flex flex-col-reverse items-start gap-3 mb-1"
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
                className="flex items-center gap-3"
              >
                {/* Tooltip label */}
                <div className="pointer-events-none">
                  <motion.div
                    initial={{ opacity: 0, x: 8, scale: 0.9 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: 8, scale: 0.9 }}
                    transition={{ duration: 0.2, delay: index * 0.05 + 0.05 }}
                    className="bg-foreground text-background text-xs font-semibold px-3.5 py-2 rounded-xl shadow-lg whitespace-nowrap"
                  >
                    {action.label}
                    <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 rotate-45 w-3 h-3 bg-foreground shadow-sm" />
                  </motion.div>
                </div>

                {/* Action button */}
                <motion.button
                  onClick={action.onClick}
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.92 }}
                  className="w-11 h-11 rounded-full flex items-center justify-center shadow-lg backdrop-blur-sm cursor-pointer border border-white/10"
                  style={{ backgroundColor: action.color, color: "#fff" }}
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
        className="relative w-[52px] h-[52px] rounded-full shadow-lg flex items-center justify-center cursor-pointer border border-white/10"
        style={{
          backgroundColor: theme.fab.bg,
          color: theme.fab.icon,
          boxShadow: `0 4px 14px ${theme.fab.bg}40`,
        }}
        aria-label={isOpen ? "إغلاق القائمة" : "خيارات سريعة"}
        aria-expanded={isOpen}
      >
        {!isOpen && (
          <span className="absolute inset-0 rounded-full animate-ping" style={{ backgroundColor: theme.fab.bg + "20" }} />
        )}
        <Plus className="w-6 h-6 relative z-10" strokeWidth={2.5} />
      </motion.button>
    </div>
  );
}
