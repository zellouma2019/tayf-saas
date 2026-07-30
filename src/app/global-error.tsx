"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Global Error]", error);
  }, [error]);

  return (
    <html lang="ar" dir="rtl">
      <body className="bg-background text-foreground font-cairo antialiased">
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="max-w-md w-full space-y-6 text-center">
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-950/50 flex items-center justify-center">
                <AlertTriangle className="h-8 w-8 text-red-500" />
              </div>
            </div>
            <h2 className="text-xl font-bold">حدث خطأ غير متوقع</h2>
            <p className="text-sm text-muted-foreground">
              حدث خطأ أثناء تحميل التطبيق
            </p>
            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <pre className="text-[10px] font-mono whitespace-pre-wrap break-all text-red-500">
                {error.message}
              </pre>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="h-10 px-6 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium flex items-center justify-center gap-2 transition-colors mx-auto"
            >
              <RefreshCw className="h-4 w-4" />
              إعادة تحميل
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
