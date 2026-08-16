"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Printer, Heart, ShieldCheck, Loader2, Settings } from "lucide-react";
import { SimpleAdmin } from "@/components/app/simple-admin";
import { SettingsProvider, useSettings } from "@/lib/settings-provider";

const StandalonePreview = dynamic(
  () => import("@/components/app/standalone-preview").then((m) => m.StandalonePreview),
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

function AppContent() {
  const [adminOpen, setAdminOpen] = useState(false);
  const { shopName, tagline, loading } = useSettings();

  return (
    <main className="min-h-screen flex flex-col relative">
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
              {!shopName && !tagline && !loading && (
                <>
                  <span className="font-semibold">مطبعة الذكي</span>
                  <span className="text-muted-foreground">— الطباعة تبدأ قبل وصولك</span>
                </>
              )}
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><ShieldCheck className="h-3 w-3 text-emerald-500" />ملفات آمنة</span>
              <span className="flex items-center gap-1"><Heart className="h-3 w-3 text-rose-400" />صُنع بحب</span>
              <button
                onClick={() => setAdminOpen(true)}
                className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground/50 hover:text-foreground/80"
                aria-label="لوحة الإدارة"
                title="لوحة الإدارة"
              >
                <Settings className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </footer>
      <SimpleAdmin open={adminOpen} onOpenChange={setAdminOpen} />
    </main>
  );
}

export default function Home() {
  return (
    <SettingsProvider>
      <AppContent />
    </SettingsProvider>
  );
}
