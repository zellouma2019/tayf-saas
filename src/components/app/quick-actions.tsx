"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, FileText, Search, Calculator, HelpCircle } from "lucide-react";
import { useAppStore } from "@/lib/store";

const ACTIONS = [
  {
    label: "طلب جديد",
    icon: FileText,
    action: "new" as const,
    color: "text-amber-600 dark:text-amber-400",
  },
  {
    label: "تتبّع طلب",
    icon: Search,
    action: "track" as const,
    color: "text-teal-600 dark:text-teal-400",
  },
  {
    label: "حاسبة الأسعار",
    icon: Calculator,
    action: "calculator" as const,
    color: "text-emerald-600 dark:text-emerald-400",
  },
  {
    label: "مساعدة",
    icon: HelpCircle,
    action: "help" as const,
    color: "text-orange-600 dark:text-orange-400",
  },
];

export function QuickActions() {
  const [open, setOpen] = useState(false);
  const fabRef = useRef<HTMLDivElement>(null);
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
          // التمرير إلى التذييل حيث حاسبة الأسعار
          const footer = document.querySelector("footer");
          if (footer) {
            footer.scrollIntoView({ behavior: "smooth" });
            // فتح التذييل إذا كان مطوياً على الجوال
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

  // الإغلاق عند النقر خارج القائمة
  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (fabRef.current && !fabRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    // تأخير صغير لمنع إغلاق فوري من نفس النقرة
    const timer = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }, 50);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [open]);

  // إخفاء في وضع الإدارة
  if (view === "admin") return null;

  // حساب زوايا المروحة لكل زر (تنتشر لأعلى ولليسار لأن RTL)
  const fanAngles = [-30, -50, -70, -90];
  const fanDistance = 72;

  return (
    <div
      ref={fabRef}
      className="fixed bottom-24 right-4 z-50 md:hidden no-print"
    >
      <AnimatePresence>
        {open && (
          <>
            {/* خلفية معتمة خفيفة */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[-1]"
              onClick={() => setOpen(false)}
            />

            {/* أزرار الإجراءات */}
            {ACTIONS.map((item, index) => {
              const angle = fanAngles[index];
              const rad = (angle * Math.PI) / 180;
              const x = Math.cos(rad) * fanDistance;
              const y = Math.sin(rad) * fanDistance;

              return (
                <motion.button
                  key={item.action}
                  initial={{ opacity: 0, scale: 0.3, x: 0, y: 0 }}
                  animate={{
                    opacity: 1,
                    scale: 1,
                    x: x,
                    y: y,
                  }}
                  exit={{ opacity: 0, scale: 0.3, x: 0, y: 0 }}
                  transition={{
                    type: "spring",
                    stiffness: 350,
                    damping: 22,
                    delay: index * 0.04,
                  }}
                  onClick={() => handleAction(item.action)}
                  className="absolute bottom-0 right-0 group flex items-center gap-2.5 outline-none"
                  style={{
                    transformOrigin: "bottom right",
                  }}
                  aria-label={item.label}
                >
                  {/* التسمية */}
                  <motion.span
                    initial={{ opacity: 0, x: 8, scale: 0.8 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: 8, scale: 0.8 }}
                    transition={{
                      type: "spring",
                      stiffness: 300,
                      damping: 20,
                      delay: index * 0.04 + 0.05,
                    }}
                    className="bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 text-xs font-medium px-2.5 py-1.5 rounded-lg shadow-lg whitespace-nowrap pointer-events-none"
                  >
                    {item.label}
                  </motion.span>

                  {/* الزر الدائري */}
                  <span className="w-11 h-11 bg-white dark:bg-neutral-800 rounded-full shadow-lg shadow-black/15 dark:shadow-black/40 flex items-center justify-center border border-neutral-200/60 dark:border-neutral-700/60 group-active:scale-90 transition-transform duration-150">
                    <item.icon className={`h-5 w-5 ${item.color}`} />
                  </span>
                </motion.button>
              );
            })}
          </>
        )}
      </AnimatePresence>

      {/* زر FAB الرئيسي */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => setOpen((prev) => !prev)}
        className="w-14 h-14 bg-neutral-900 dark:bg-white dark:text-neutral-900 text-white rounded-full shadow-xl shadow-neutral-900/30 dark:shadow-white/10 flex items-center justify-center relative z-10 active:scale-95 transition-shadow hover:shadow-2xl hover:shadow-neutral-900/40 dark:hover:shadow-white/15"
        aria-label={open ? "إغلاق القائمة" : "إجراءات سريعة"}
        aria-expanded={open}
      >
        <motion.div
          animate={{ rotate: open ? 135 : 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
        >
          <Plus className="h-6 w-6" />
        </motion.div>
      </motion.button>
    </div>
  );
}