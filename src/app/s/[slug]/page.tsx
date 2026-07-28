import type { Metadata } from "next";
import { ShopPage } from "@/components/app/shop-page";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://tayf-saas.vercel.app";
    const res = await fetch(`${baseUrl}/api/shops/${slug}`, { cache: "no-store" });
    if (!res.ok) return {};
    const { shop } = await res.json();
    return {
      title: `${shop.name} — طلب طباعة أونلاين`,
      description: `اطلب طباعتك من ${shop.name} عبر منصة طيف`,
      openGraph: {
        title: `${shop.name} — طلب طباعة أونلاين | طيف`,
        description: `اطلب طباعتك من ${shop.name} عبر منصة طيف`,
        images: [
          {
            url: "/brand/og-image.png",
            width: 1344,
            height: 768,
            alt: `${shop.name} — طلب طباعة أونلاين`,
          },
        ],
      },
    };
  } catch {
    return {};
  }
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  return <ShopPage slug={slug} />;
}
