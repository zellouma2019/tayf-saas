"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error for debugging
    console.error("[Page Error Boundary] Error:", error);
    console.error("[Page Error Boundary] Message:", error.message);
    console.error("[Page Error Boundary] Stack:", error.stack);
  }, [error]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6" dir="rtl">
      <div className="max-w-md w-full space-y-6">
        {/* Error icon */}
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-950/50 flex items-center justify-center">
            <AlertTriangle className="h-8 w-8 text-red-500" />
          </div>
        </div>

        {/* Error message */}
        <div className="text-center space-y-2">
          <h2 className="text-xl font-bold text-foreground">حدث خطأ غير متوقع</h2>
          <p className="text-sm text-muted-foreground">
            عذراً، حدث خطأ أثناء تحميل الصفحة. يمكنك المحاولة مرة أخرى.
          </p>
        </div>

        {/* Error details */}
        <details className="rounded-lg border border-border bg-muted/30 overflow-hidden">
          <summary className="px-4 py-2 text-xs text-muted-foreground cursor-pointer hover:bg-muted/50 transition-colors">
            تفاصيل الخطأ
          </summary>
          <div className="px-4 pb-3">
            <pre className="text-[10px] text-red-500 dark:text-red-400 font-mono whitespace-pre-wrap break-all overflow-auto max-h-40">
              {error.message}
              {"\n\n"}
              {error.stack?.slice(0, 500)}
            </pre>
          </div>
        </details>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={reset}
            className="flex-1 h-10 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium flex items-center justify-center gap-2 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            إعادة المحاولة
          </button>
          <button
            onClick={() => { window.location.href = "/"; }}
            className="h-10 px-4 rounded-lg border border-border hover:bg-muted/50 text-muted-foreground hover:text-foreground text-sm font-medium flex items-center justify-center gap-2 transition-colors"
          >
            <Home className="h-4 w-4" />
            الرئيسية
          </button>
        </div>

        <p className="text-center text-[10px] text-muted-foreground/40">
          طيف v4.6 — منصة إدارة المطابع الذكية
        </p>
      </div>
    </div>
  );
}
