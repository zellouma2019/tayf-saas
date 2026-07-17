import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "طيف",
    short_name: "طيف",
    description: "خدمة طباعة احترافية وسريعة",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#d4af37",
    icons: [
      {
        src: "/favicon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
      {
        src: "/brand/tayf-logo.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/tayf-icon.png",
        sizes: "192x192",
        type: "image/png",
      },
    ],
  };
}