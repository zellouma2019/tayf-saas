"use client";

import dynamic from "next/dynamic";
import { Heart, ShieldCheck, Loader2 } from "lucide-react";
import { SettingsProvider, useSettings } from "@/lib/customer/settings-provider";

const StandalonePreview = dynamic(
  () => import("@/components/customer/standalone-preview").then((m) => m.StandalonePreview),
  {
    ssr: false,
    loading: () => (
      <div className="flex-1 flex flex-col items-center justify-center py-32 gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
        <p className="text-sm text-muted-foreground">جارٍ تحميل التطبيق...</p>
      </div>
    ),
  }
);

function CustomerContent() {
  const { shopName, tagline } = useSettings();

  return (
    <main className="min-h-screen flex flex-col relative" dir="rtl">
      <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex-1">
        <StandalonePreview />
      </div>
      <footer className="mt-auto border-t bg-gradient-to-t from-muted/40 to-transparent backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 py-5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm text-foreground/70">
              {shopName && (
                <span className="font-semibold">{shopName}</span>
              )}
              {tagline && (
                <span className="text-muted-foreground">— {tagline}</span>
              )}
              {!shopName && !tagline && (
                <>
                  <span className="font-semibold">طيف</span>
                  <span className="text-muted-foreground">— منصة الطباعة الذكية</span>
                </>
              )}
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><ShieldCheck className="h-3 w-3 text-emerald-500" />ملفات آمنة</span>
              <span className="flex items-center gap-1"><Heart className="h-3 w-3 text-rose-400" />صُنع بحب</span>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}

export function CustomerPage() {
  return (
    <SettingsProvider>
      <CustomerContent />
    </SettingsProvider>
  );
}
