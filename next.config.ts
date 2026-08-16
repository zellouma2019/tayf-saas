import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Force clean build - v3
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default nextConfig;
