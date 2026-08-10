"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, FileText, Search, Calculator, HelpCircle } from "lucide-react";
import { useAppStore } from "@/lib/store";

const ACTIONS = [
  { label: "طلب جديد", icon: FileText, action: "new" as const, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-500/10" },
  { label: "تتبّع طلب", icon: Search, action: "track" as const, color: "text-teal-600 dark:text-teal-400", bg: "bg-teal-50 dark:bg-teal-500/10" },
  { label: "حاسبة الأسعار", icon: Calculator, action: "calculator" as const, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-500/10" },
  { label: "مساعدة", icon: HelpCircle, action: "help" as const, color: "text-orange-600 dark:text-orange-400", bg: "bg-orange-50 dark:bg-orange-500/10" },
];

export function QuickActions() {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { view, setView, setAssistantOpen } = useAppStore();

  const handleAction = useCallback(
    (action: string) => {
      setOpen(false);
      switch (action) {
        case "new":
          setView("new");
          break;
        case "track":
          setView("track");
          break;
        case "calculator": {
          const footer = document.querySelector("footer");
          if (footer) {
            footer.scrollIntoView({ behavior: "smooth" });
            const toggleBtn = footer.querySelector(
              "button[aria-expanded]"
            ) as HTMLButtonElement | null;
            if (toggleBtn && toggleBtn.getAttribute("aria-expanded") === "false") {
              setTimeout(() => toggleBtn.click(), 400);
            }
          }
          break;
        }
        case "help":
          setAssistantOpen(true);
          break;
      }
    },
    [setView, setAssistantOpen]
  );

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const timer = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }, 100);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [open]);

  if (view === "admin") return null;

  return (
    <div ref={containerRef} className="fixed bottom-20 right-3 z-50 md:bottom-6 md:right-6 no-print">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute bottom-16 right-0 w-44 bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl shadow-black/15 dark:shadow-black/40 border border-neutral-200/60 dark:border-neutral-700/40 overflow-hidden"
          >
            <div className="p-1.5">
              {ACTIONS.map((item, index) => (
                <motion.button
                  key={item.action}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.15 }}
                  onClick={() => handleAction(item.action)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-right transition-colors hover:bg-neutral-100 dark:hover:bg-white/5 active:scale-[0.98] ${index < ACTIONS.length - 1 ? "mb-0.5" : ""}`}
                >
                  <div className={`w-8 h-8 ${item.bg} rounded-lg flex items-center justify-center shrink-0`}>
                    <item.icon className={`h-4 w-4 ${item.color}`} />
                  </div>
                  <span className="text-sm font-medium text-foreground">{item.label}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => setOpen((prev) => !prev)}
        className="w-13 h-13 bg-gradient-to-br from-amber-400 to-amber-600 text-white rounded-full shadow-lg shadow-amber-500/25 flex items-center justify-center relative z-10 active:scale-95 transition-all hover:shadow-xl hover:shadow-amber-500/35"
        aria-label={open ? "إغلاق القائمة" : "إجراءات سريعة"}
        aria-expanded={open}
      >
        <motion.div
          animate={{ rotate: open ? 90 : 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
        >
          {open ? <X className="h-5.5 w-5.5" /> : <Plus className="h-5.5 w-5.5" />}
        </motion.div>
      </motion.button>
    </div>
  );
}
