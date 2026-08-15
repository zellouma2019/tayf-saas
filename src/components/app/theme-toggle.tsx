"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";

const emptySubscribe = () => () => {};

function getIsServer() {
  return false;
}

function getServerSnapshot() {
  return true;
}

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const isServer = useSyncExternalStore(emptySubscribe, getIsServer, getServerSnapshot);

  const isDark = !isServer && resolvedTheme === "dark";

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={`relative w-9 h-9 rounded-full transition-all hover:bg-muted ${
        isDark ? "bg-amber-400/10" : "bg-neutral-900/5"
      } ${className || ""}`}
      aria-label={isDark ? "التبديل للوضع النهاري" : "التبديل للوضع الليلي"}
      title={isDark ? "الوضع النهاري" : "الوضع الليلي"}
    >
      {isServer ? (
        <div className="h-4 w-4" />
      ) : isDark ? (
        <Sun className="h-4 w-4 text-amber-400" />
      ) : (
        <Moon className="h-4 w-4 text-neutral-700" />
      )}
    </Button>
  );
}
