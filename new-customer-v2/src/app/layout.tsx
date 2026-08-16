import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "next-themes";

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "مطبعة الذكي — الطباعة تبدأ قبل وصولك",
  description:
    "خدمة طباعة احترافية وسريعة في المملكة العربية السعودية. اطبع مستنداتك وصورك وبطاقاتك أونلاين وتابع طلبك لحظة بلحظة. اطلب خلال دقيقة، جاهز خلال ساعة.",
  keywords: [
    "مطبعة",
    "طباعة",
    "طباعة مستندات",
    "طباعة صور",
    "تجليد",
    "مطبعة الرياض",
    "مطبعة الذكي",
  ],
  authors: [{ name: "مطبعة الذكي" }],
  manifest: "/manifest.json",
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
    "apple-mobile-web-app-title": "مطبعة الذكي",
    "theme-color": "#1a1a1a",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body
        className={`${cairo.variable} font-cairo antialiased bg-background text-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
