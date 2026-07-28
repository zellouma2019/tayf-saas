import type { Metadata } from "next";
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
  return <TrackPageClient />;
}
