"use client";

import { Plus, RotateCcw, Search, User } from "lucide-react";
import { useAppStore } from "@/lib/store";
import type { View } from "@/lib/store";

const tabs: {
  key: View;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { key: "new", label: "جديد", icon: Plus },
  { key: "repeat", label: "تكرار", icon: RotateCcw },
  { key: "track", label: "تتبّع", icon: Search },
  { key: "new", label: "", icon: User },
];

export function MobileBottomNav() {
  const view = useAppStore((s) => s.view);
  const setView = useAppStore((s) => s.setView);

  const handleTabClick = (key: View) => {
    if (key) setView(key);
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-yellow-100/80 no-print"
      role="tablist"
      aria-label="التنقل الرئيسي"
    >
      <div className="max-w-md mx-auto flex items-center h-16 px-2">
        {/* Add / جديد — Active with yellow circle */}
        <button
          role="tab"
          aria-selected={view === "new"}
          aria-label="طلب جديد"
          onClick={() => setView("new")}
          className="flex-1 flex flex-col items-center justify-center gap-1"
        >
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 ${
              view === "new"
                ? "bg-yellow-400 text-neutral-900 shadow-md shadow-yellow-400/30"
                : "text-neutral-400"
            }`}
          >
            <Plus className="h-5 w-5" />
          </div>
          <span className={`text-[10px] font-medium transition-colors duration-200 ${
            view === "new" ? "text-neutral-900" : "text-neutral-400"
          }`}>
            جديد
          </span>
        </button>

        {/* Repeat / تكرار */}
        <button
          role="tab"
          aria-selected={view === "repeat"}
          aria-label="تكرار طلب"
          onClick={() => setView("repeat")}
          className="flex-1 flex flex-col items-center justify-center gap-1"
        >
          <div className="w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-200">
            <RotateCcw className={`h-5 w-5 transition-colors duration-200 ${
              view === "repeat" ? "text-neutral-900" : "text-neutral-400"
            }`} />
          </div>
          <span className={`text-[10px] font-medium transition-colors duration-200 ${
            view === "repeat" ? "text-neutral-900" : "text-neutral-400"
          }`}>
            تكرار
          </span>
        </button>

        {/* Track / تتبّع */}
        <button
          role="tab"
          aria-selected={view === "track"}
          aria-label="تتبّع طلب"
          onClick={() => setView("track")}
          className="flex-1 flex flex-col items-center justify-center gap-1"
        >
          <div className="w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-200">
            <Search className={`h-5 w-5 transition-colors duration-200 ${
              view === "track" ? "text-neutral-900" : "text-neutral-400"
            }`} />
          </div>
          <span className={`text-[10px] font-medium transition-colors duration-200 ${
            view === "track" ? "text-neutral-900" : "text-neutral-400"
          }`}>
            تتبّع
          </span>
        </button>

        {/* Profile */}
        <button
          aria-label="الملف الشخصي"
          className="flex-1 flex flex-col items-center justify-center gap-1"
        >
          <div className="w-10 h-10 rounded-full border-2 border-neutral-300 flex items-center justify-center text-neutral-400 transition-colors duration-200">
            <User className="h-5 w-5" />
          </div>
          <span className="text-[10px] font-medium text-neutral-400">
            حسابي
          </span>
        </button>
      </div>
    </nav>
  );
}
