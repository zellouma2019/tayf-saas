import type { Metadata } from "next";
import { Suspense } from "react";
import { TrackPageClient } from "@/components/app/track-page-client";

export const metadata: Metadata = {
  title: "تتبّع الطلب — طيف",
  description: "تتبّع حالة طلبك في أي متجر على منصة طيف",
  openGraph: {
    title: "تتبّع الطلب — طيف",
    description: "تتبّع حالة طلبك في أي متجر على منصة طيف",
  },
};

export default function TrackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin h-6 w-6 rounded-full border-2 border-primary border-t-transparent" />
      </div>
    }>
      <TrackPageClient />
    </Suspense>
  );
}
