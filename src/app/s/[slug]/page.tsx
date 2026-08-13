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

  // JSON-LD Structured Data for SEO
  let jsonLdHtml = "";
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://tayf-saas.vercel.app";
    const res = await fetch(`${baseUrl}/api/shops/${slug}`, { cache: "no-store" });
    if (res.ok) {
      const { shop } = await res.json();
      jsonLdHtml = JSON.stringify({
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        name: shop.name,
        description: `مطبعة ${shop.name} — خدمة طباعة احترافية أونلاين عبر منصة طيف`,
        url: `${baseUrl}/s/${shop.slug}`,
        telephone: shop.phone || shop.ownerPhone || undefined,
        address: {
          "@type": "PostalAddress",
          addressCountry: shop.country || "DZ",
        },
        image: `${baseUrl}/brand/og-image.png`,
        priceRange: "$$",
        openingHoursSpecification: {
          "@type": "OpeningHoursSpecification",
          dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
          opens: "08:00",
          closes: "22:00",
        },
        areaServed: {
          "@type": "Country",
          name: shop.country === "MA" ? "Morocco" : "Algeria",
        },
      });
    }
  } catch {}

  return (
    <>
      {jsonLdHtml && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLdHtml }}
        />
      )}
      <ShopPage slug={slug} />
    </>
  );
}

