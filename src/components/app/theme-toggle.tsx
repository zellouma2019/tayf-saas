"use client";

import { useTheme } from "next-themes";
import { useSyncExternalStore, useCallback } from "react";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

const emptySubscribe = () => () => {};
function useMounted() {
  return useSyncExternalStore(emptySubscribe, () => true, () => false);
}

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const mounted = useMounted();
  const toggle = useCallback(() => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  }, [setTheme, resolvedTheme]);

  if (!mounted) return <div className={cn("h-8 w-8", className)} />;

  const isDark = resolvedTheme === "dark";
  return (
    <button
      type="button"
      onClick={toggle}
      className={cn(
        "inline-flex items-center justify-center rounded-lg hover:bg-muted transition-colors",
        className
      )}
      aria-label={isDark ? "تبديل إلى الوضع الفاتح" : "تبديل إلى الوضع الداكن"}
    >
      {isDark ? (
        <Sun className="h-4 w-4 text-amber-400" />
      ) : (
        <Moon className="h-4 w-4 text-slate-600" />
      )}
    </button>
  );
}
