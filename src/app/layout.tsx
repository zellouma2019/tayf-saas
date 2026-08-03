import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";
import { Toaster as SonnerToaster } from "sonner";
import { ThemeProvider } from "next-themes";

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "طيف — منصة إدارة المطابع الذكية",
    template: "%s | طيف",
  },
  description:
    "منصة طيف لإدارة المطابع — طلبات أونلاين، تتبع الطلبات، لوحة تحكم للتاجر، وإحصائيات متقدمة",
  keywords: [
    "مطبعة",
    "طباعة",
    "إدارة",
    "أونلاين",
    "طلب طباعة",
    "طيف",
    "لوحة تحكم",
    "إدارة المطابع",
  ],
  authors: [{ name: "طيف" }],
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  openGraph: {
    type: "website",
    locale: "ar_DZ",
    url: "https://tayf-saas.vercel.app",
    siteName: "طيف",
    title: "طيف — منصة إدارة المطابع الذكية",
    description:
      "منصة طيف لإدارة المطابع — طلبات أونلاين، تتبع الطلبات، لوحة تحكم للتاجر",
    images: [
      {
        url: "/brand/og-image.png",
        width: 1344,
        height: 768,
        alt: "طيف — منصة إدارة المطابع",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "طيف — منصة إدارة المطابع الذكية",
    description: "منصة طيف لإدارة المطابع",
    images: ["/brand/og-image.png"],
  },
  robots: { index: true, follow: true },
  manifest: "/manifest.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning className="overflow-x-hidden">
      <head>
        <meta name="theme-color" content="#d4a853" />
      </head>
      <body
        className={`${cairo.variable} font-cairo antialiased bg-background text-foreground overflow-x-hidden`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
        {children}
        <SonnerToaster position="top-center" dir="rtl" richColors />
        </ThemeProvider>
      </body>
    </html>
  );
}
