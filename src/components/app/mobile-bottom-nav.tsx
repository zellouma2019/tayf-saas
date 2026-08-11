"use client";

import { motion } from "framer-motion";
import { Plus, RotateCcw, Search, Home } from "lucide-react";
import { useAppStore } from "@/lib/store";
import type { View } from "@/lib/store";

const tabs: {
  key: View;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  iconActive: React.ComponentType<{ className?: string }>;
}[] = [
  { key: "new", label: "جديد", icon: Plus, iconActive: Plus },
  { key: "repeat", label: "تكرار", icon: RotateCcw, iconActive: RotateCcw },
  { key: "track", label: "تتبّع", icon: Search, iconActive: Search },
];

export function MobileBottomNav() {
  const view = useAppStore((s) => s.view);
  const setView = useAppStore((s) => s.setView);

  const activeIndex = tabs.findIndex((t) => t.key === view);

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-background/90 backdrop-blur-2xl border-t border-border/40 mobile-nav-safe no-print"
      role="tablist"
      aria-label="التنقل الرئيسي"
    >
      <div className="relative flex items-end h-14">
        {/* خلفية مؤشر التبويب النشط */}
        <motion.div
          layoutId="mobile-tab-bg"
          className="absolute bottom-0 h-11 w-1/3 rounded-t-2xl bg-primary/10"
          style={{
            right: `${activeIndex * 33.333}%`,
          }}
          transition={{ type: "spring", stiffness: 350, damping: 30 }}
        />

        {tabs.map((tab) => {
          const isActive = tab.key === view;
          const Icon = isActive ? tab.iconActive : tab.icon;

          return (
            <button
              key={tab.key}
              role="tab"
              aria-selected={isActive}
              aria-label={tab.label}
              onClick={() => setView(tab.key)}
              className={`relative flex-1 flex flex-col items-center justify-center py-1.5 gap-0.5 transition-all duration-200 active:scale-90 ${
                isActive
                  ? "text-primary"
                  : "text-muted-foreground/70"
              }`}
            >
              {/* أيقونة مع تأثير ارتفاع */}
              <div className="relative">
                <motion.div
                  animate={isActive ? { y: -2, scale: 1.15 } : { y: 0, scale: 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                >
                  <Icon className="h-[22px] w-[22px]" />
                </motion.div>

                {/* نقطة النشاط */}
                {isActive && (
                  <motion.span
                    layoutId="mobile-tab-dot"
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary"
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
              </div>

              <span className={`text-[10px] leading-none transition-all duration-200 ${
                isActive ? "font-bold" : "font-medium"
              }`}>
                {tab.label}
              </span>
            </button>
          );
        })}

        {/* شريط سفلي مضيء */}
        <motion.div
          layoutId="mobile-bottom-bar"
          className="absolute bottom-0 h-[3px] bg-primary rounded-full"
          style={{
            width: "33.333%",
            right: `${activeIndex * 33.333}%`,
          }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        />
      </div>
    </nav>
  );
}
