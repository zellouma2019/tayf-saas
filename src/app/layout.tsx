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
  title: "طيف — منصة إدارة المطابع",
  description:
    "منصة طيف المتكاملة لإدارة المطابع. إنشاء المتاجر، إدارة الطلبات، تتبع العملاء، وتحليل الأرباح.",
  keywords: [
    "مطبعة",
    "طباعة",
    "طباعة مستندات",
    "طباعة صور",
    "تجليد",
    "طيف",
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
    title: "طيف — منصة إدارة المطابع",
    description: "منصة متكاملة لإدارة المطابع والخدمات الطباعية",
    type: "website",
    siteName: "طيف",
  },
  manifest: "/manifest.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="icon" href="/favicon.png" sizes="32x32" type="image/png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" sizes="180x180" type="image/png" />
        <link rel="manifest" href="/manifest.webmanifest" />
        <meta name="theme-color" content="#d4a853" />
        <meta property="og:title" content="طيف — منصة إدارة المطابع" />
        <meta property="og:description" content="منصة متكاملة لإدارة المطابع والخدمات الطباعية" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="طيف" />
      </head>
      <body
        className={`${cairo.variable} font-cairo antialiased bg-background text-foreground`}
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