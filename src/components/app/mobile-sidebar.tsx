"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  RotateCcw,
  Search,
  Calculator,
  X,
  Phone,
  MessageCircle,
  MapPin,
  Clock,
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import { ThemeToggle } from "@/components/app/theme-toggle";
import { Button } from "@/components/ui/button";

type View = "new" | "repeat" | "track" | "admin";

interface MobileSidebarProps {
  open: boolean;
  onClose: () => void;
  onNavClick: (key: View) => void;
  onCalcOpen: () => void;
}

const navItems: {
  key: View;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  activeColor: string;
}[] = [
  {
    key: "new",
    label: "طلب جديد",
    icon: Plus,
    color: "text-amber-600",
    activeColor: "bg-amber-50 text-amber-700",
  },
  {
    key: "repeat",
    label: "تكرار طلب",
    icon: RotateCcw,
    color: "text-teal-600",
    activeColor: "bg-teal-50 text-teal-700",
  },
  {
    key: "track",
    label: "تتبّع طلب",
    icon: Search,
    color: "text-blue-600",
    activeColor: "bg-blue-50 text-blue-700",
  },
];

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

const sidebarVariants = {
  hidden: { x: "-100%" },
  visible: { x: 0, transition: { type: "spring", stiffness: 300, damping: 30 } },
  exit: { x: "-100%", transition: { duration: 0.2, ease: "easeIn" } },
};

export function MobileSidebar({ open, onClose, onNavClick, onCalcOpen }: MobileSidebarProps) {
  const view = useAppStore((s) => s.view);

  // منع التمرير عند فتح الشريط الجانبي
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // إغلاق بمفتاح Escape
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [open, onClose]);

  const handleNav = useCallback(
    (key: View) => {
      onNavClick(key);
      onClose();
    },
    [onNavClick, onClose]
  );

  const handleCalc = useCallback(() => {
    onCalcOpen();
    onClose();
  }, [onCalcOpen, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* خلفية معتمة */}
          <motion.div
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm md:hidden"
            onClick={onClose}
          />

          {/* الشريط الجانبي */}
          <motion.div
            variants={sidebarVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed top-0 left-0 bottom-0 z-50 w-[280px] max-w-[80vw] bg-white shadow-2xl md:hidden flex flex-col"
            dir="rtl"
          >
            {/* رأس الشريط */}
            <div className="flex items-center justify-between px-4 h-14 border-b border-border">
              <span className="font-bold text-sm">القائمة</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-9 w-9"
                aria-label="إغلاق"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* محتوى الشريط */}
            <div className="flex-1 overflow-y-auto py-3">
              {/* عناصر التنقل */}
              <div className="px-3 mb-2">
                <p className="text-[11px] font-medium text-muted-foreground px-3 mb-2">
                  التنقل
                </p>
                <div className="space-y-1">
                  {navItems.map((item) => {
                    const isActive = view === item.key;
                    return (
                      <button
                        key={item.key}
                        onClick={() => handleNav(item.key)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all active:scale-[0.98] ${
                          isActive
                            ? item.activeColor
                            : "text-foreground hover:bg-muted/60"
                        }`}
                      >
                        <item.icon
                          className={`h-5 w-5 ${
                            isActive ? item.color : "text-muted-foreground"
                          }`}
                        />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* فاصل */}
              <div className="mx-4 my-3 h-px bg-border/60" />

              {/* أدوات */}
              <div className="px-3 mb-2">
                <p className="text-[11px] font-medium text-muted-foreground px-3 mb-2">
                  أدوات
                </p>
                <div className="space-y-1">
                  {/* حاسبة الأسعار */}
                  <button
                    onClick={handleCalc}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-foreground hover:bg-muted/60 transition-all active:scale-[0.98]"
                  >
                    <Calculator className="h-5 w-5 text-emerald-600" />
                    <span>حاسبة الأسعار</span>
                  </button>

                  {/* تبديل المظهر */}
                  <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-foreground">
                    <ThemeToggle />
                    <span>تبديل المظهر</span>
                  </div>
                </div>
              </div>

              {/* فاصل */}
              <div className="mx-4 my-3 h-px bg-border/60" />

              {/* معلومات التواصل */}
              <div className="px-3">
                <p className="text-[11px] font-medium text-muted-foreground px-3 mb-2">
                  تواصل معنا
                </p>
                <div className="space-y-1 text-sm">
                  <a
                    href="tel:0560000000"
                    className="flex items-center gap-3 px-3 py-2 rounded-xl text-foreground hover:bg-muted/60 transition-colors"
                  >
                    <Phone className="h-4 w-4 text-amber-500" />
                    <span className="text-xs">0560 00 00 00</span>
                  </a>
                  <a
                    href="https://wa.me/213560000000"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 px-3 py-2 rounded-xl text-foreground hover:bg-muted/60 transition-colors"
                  >
                    <MessageCircle className="h-4 w-4 text-emerald-500" />
                    <span className="text-xs">واتساب</span>
                  </a>
                  <div className="flex items-center gap-3 px-3 py-2 text-muted-foreground">
                    <MapPin className="h-4 w-4 shrink-0" />
                    <span className="text-xs">شارع ديدوش مراد، الجزائر العاصمة</span>
                  </div>
                  <div className="flex items-center gap-3 px-3 py-2 text-muted-foreground">
                    <Clock className="h-4 w-4 shrink-0" />
                    <span className="text-xs">السبت - الخميس: 8ص - 7م</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
