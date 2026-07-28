import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  allowedDevOrigins: [
    "preview-chat-25b4c095-e627-480e-ab7b-6e25473ffb45.space-z.ai",
  ],
  serverExternalPackages: ["sharp", "@libsql/client"],
  // تحسين حجم الحزمة — استيراد انتقائي للمكتبات الكبيرة (يعمل مع Turbopack)
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "recharts",
      "@radix-ui/react-dialog",
      "@radix-ui/react-select",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-popover",
      "@radix-ui/react-tooltip",
      "@radix-ui/react-tabs",
    ],
  },
};

export default nextConfig;
