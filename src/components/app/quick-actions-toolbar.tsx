"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ActionItem {
  id: string;
  label: string;
  icon: string;
  color: string;
}

const actions: ActionItem[] = [
  { id: "new-order", label: "طلب جديد", icon: "📄", color: "#d4a853" },
  { id: "add-customer", label: "إضافة عميل", icon: "👤", color: "#22c55e" },
  { id: "quick-print", label: "طباعة سريعة", icon: "🖨️", color: "#f59e0b" },
  { id: "scan-qr", label: "مسح QR", icon: "📱", color: "#14b8a6" },
  { id: "daily-report", label: "تقرير يومي", icon: "📊", color: "#f43f5e" },
];

export default function QuickActionsToolbar() {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setIsOpen(false);
    }
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  function handleAction(action: ActionItem) {
    console.log(`Action clicked: ${action.id} — ${action.label}`);
    setIsOpen(false);
  }

  return (
    <div ref={containerRef} className="fixed bottom-6 right-6 z-50">
      {/* Action Items */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="absolute bottom-16 right-0 flex flex-col-reverse gap-3"
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ duration: 0.25 }}
          >
            {actions.map((action, i) => (
              <motion.div
                key={action.id}
                className="relative"
                initial={{ opacity: 0, x: 20, scale: 0.8 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 20, scale: 0.8 }}
                transition={{
                  delay: i * 0.05,
                  type: "spring",
                  stiffness: 400,
                  damping: 20,
                }}
              >
                {/* Tooltip */}
                <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg bg-neutral-800 dark:bg-neutral-700 text-white text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-lg">
                  {action.label}
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1 border-4 border-transparent border-l-neutral-800 dark:border-l-neutral-700" />
                </div>

                <button
                  onClick={() => handleAction(action)}
                  className="group flex items-center gap-2 pr-4 pl-3 py-2.5 rounded-xl bg-white dark:bg-neutral-800 shadow-lg hover:shadow-xl border border-neutral-100 dark:border-neutral-700 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                >
                  <span className="text-base">{action.icon}</span>
                  <span className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
                    {action.label}
                  </span>
                  <div
                    className="w-1.5 h-8 rounded-full -mr-1 opacity-60"
                    style={{ backgroundColor: action.color }}
                  />
                </button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 rounded-full flex items-center justify-center text-white shadow-xl hover:shadow-2xl transition-shadow cursor-pointer"
        style={{
          background: isOpen
            ? "linear-gradient(135deg, #ef4444, #f43f5e)"
            : "linear-gradient(135deg, #d4a853, #c49000)",
        }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        animate={{ rotate: isOpen ? 45 : 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        >
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </motion.button>
    </div>
  );
}
