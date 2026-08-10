import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || "https://tayf-saas.vercel.app"),
  title: {
    default: "طيف — منصة إدارة المطابع",
    template: "%s | طيف",
  },
  description: "منصة طيف لإدارة المطابع وطلبات الطباعة الأونلاين",
  keywords: ["طيف", "مطبعة", "طباعة", "إدارة", "أونلاين", "SaaS"],
  authors: [{ name: "طيف" }],
  openGraph: {
    title: "طيف — منصة إدارة المطابع",
    description: "منصة طيف لإدارة المطابع وطلبات الطباعة الأونلاين",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "طيف — منصة إدارة المطابع",
    description: "منصة طيف لإدارة المطابع وطلبات الطباعة الأونلاين",
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
