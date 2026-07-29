"use client";

import { useState, useEffect, useCallback } from "react";
import { Activity, CheckCircle2, XCircle, Clock, Wifi, WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface HealthCheck {
  name: string;
  status: "loading" | "ok" | "error";
  latency?: number;
  error?: string;
}

const CHECKS: { name: string; url: string }[] = [
  { name: "API", url: "/api/shops" },
  { name: "الإحصائيات", url: "/api/admin/global-stats" },
];

export function SystemHealthWidget() {
  const [checks, setChecks] = useState<HealthCheck[]>(
    CHECKS.map((c) => ({ name: c.name, status: "loading" as const }))
  );
  const [expanded, setExpanded] = useState(false);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);

  const runChecks = useCallback(async () => {
    const start = Date.now();
    const results = await Promise.all(
      CHECKS.map(async (check) => {
        const checkStart = Date.now();
        try {
          const res = await fetch(check.url, { method: "HEAD" });
          const latency = Date.now() - checkStart;
          return {
            name: check.name,
            status: res.ok ? ("ok" as const) : ("error" as const),
            latency,
          };
        } catch {
          return {
            name: check.name,
            status: "error" as const,
            latency: Date.now() - checkStart,
          };
        }
      })
    );
    setChecks(results);
    setLastCheck(new Date());
  }, []);

  useEffect(() => {
    runChecks();
    const interval = setInterval(runChecks, 60000); // Check every 60s
    return () => clearInterval(interval);
  }, [runChecks]);

  const allOk = checks.every((c) => c.status === "ok");
  const anyError = checks.some((c) => c.status === "error");
  const avgLatency = checks.reduce((s, c) => s + (c.latency || 0), 0) / checks.length;

  return (
    <div
      className={cn(
        "rounded-lg border px-3 py-2 transition-all duration-200 cursor-pointer select-none",
        allOk
          ? "border-emerald-200/50 dark:border-emerald-800/30 bg-emerald-50/30 dark:bg-emerald-950/10"
          : anyError
          ? "border-rose-200/50 dark:border-rose-800/30 bg-rose-50/30 dark:bg-rose-950/10"
          : "border-amber-200/50 dark:border-amber-800/30 bg-amber-50/30 dark:bg-amber-950/10"
      )}
      onClick={() => setExpanded(!expanded)}
      title="حالة النظام"
    >
      {/* Compact view */}
      <div className="flex items-center gap-2">
        {checks.some((c) => c.status === "loading") ? (
          <Wifi className="h-3.5 w-3.5 text-amber-500 animate-pulse" />
        ) : allOk ? (
          <Wifi className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
        ) : (
          <WifiOff className="h-3.5 w-3.5 text-rose-500" />
        )}
        <span className="text-[10px] text-muted-foreground font-medium">
          {allOk ? `${Math.round(avgLatency)}ms` : "فحص..."}
        </span>
      </div>

      {/* Expanded view */}
      {expanded && (
        <div className="mt-2 pt-2 border-t border-border/50 space-y-1.5">
          {checks.map((check) => (
            <div key={check.name} className="flex items-center justify-between text-[10px]">
              <span className="text-muted-foreground">{check.name}</span>
              <div className="flex items-center gap-1">
                {check.status === "loading" ? (
                  <Clock className="h-3 w-3 text-amber-500 animate-pulse" />
                ) : check.status === "ok" ? (
                  <>
                    <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                    <span className="tabular-nums text-emerald-600 dark:text-emerald-400">{check.latency}ms</span>
                  </>
                ) : (
                  <XCircle className="h-3 w-3 text-rose-500" />
                )}
              </div>
            </div>
          ))}
          {lastCheck && (
            <p className="text-[9px] text-muted-foreground/60 text-center pt-1">
              آخر فحص: {lastCheck.toLocaleTimeString("ar-DZ")}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
