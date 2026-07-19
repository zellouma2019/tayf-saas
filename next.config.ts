import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  allowedDevOrigins: [
    "preview-chat-25b4c095-e627-480e-ab7b-6e25473ffb45.space-z.ai",
  ],
  // حزم ثقيلة لا تُضمَّن في وظائف Serverless — تُحمَّل من node_modules مباشرة
  serverExternalPackages: [
    "sharp",
    "@libsql/client",
    "xlsx",
    "qrcode",
  ],
  experimental: {
    serverActions: {
      bodySizeLimit: "5mb",
    },
    // تحسين حزم العميل
    optimizePackageImports: [
      "lucide-react",
      "recharts",
      "date-fns",
      "@radix-ui/react-icons",
    ],
  },
  // السماح بتحميل صفحات المتاجر داخل iframe (للمعاينة في لوحة التحكم)
  async headers() {
    return [
      {
        source: "/s/:path*",
        headers: [
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "Content-Security-Policy",
            value: "frame-ancestors 'self'",
          },
        ],
      },
    ];
  },
};

export default nextConfig;