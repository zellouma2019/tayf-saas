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
  experimental: {
    serverActions: {
      bodySizeLimit: "5mb",
    },
  },
};

export default nextConfig;
