"use client";

import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={`relative w-9 h-9 rounded-full overflow-hidden transition-all hover:bg-muted ${
        isDark ? "bg-amber-400/10" : "bg-neutral-900/5"
      } ${className || ""}`}
      aria-label={isDark ? "التبديل للوضع النهاري" : "التبديل للوضع الليلي"}
      title={isDark ? "الوضع النهاري" : "الوضع الليلي"}
      suppressHydrationWarning
    >
      <Sun
        className={`h-4 w-4 text-amber-400 absolute transition-all duration-500 ${
          isDark
            ? "opacity-100 rotate-0 scale-100"
            : "opacity-0 rotate-90 scale-50"
        }`}
      />
      <Moon
        className={`h-4 w-4 text-neutral-700 absolute transition-all duration-500 ${
          isDark
            ? "opacity-0 -rotate-90 scale-50"
            : "opacity-100 rotate-0 scale-100"
        }`}
      />
    </Button>
  );
}
