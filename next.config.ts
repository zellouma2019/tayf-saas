import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Force clean build - v2
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default nextConfig;
