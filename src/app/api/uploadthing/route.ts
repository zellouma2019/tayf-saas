import { createRouteHandler } from "uploadthing/next";
import { ourFileRouter } from "./core";

/**
 * UploadThing API Route Handler
 *
 * الملفات تُرفع مباشرة من المتصفح إلى UploadThing CDN
 * دون المرور عبر Vercel serverless = سرعة فائقة!
 *
 * UPLOADTHING_TOKEN يُقرأ من:
 * 1. config.token (fallback — مُشفّر في المصدر)
 * 2. UPLOADTHING_TOKEN env var (الأفضل — اضبطه في Vercel Dashboard)
 */
export const { GET, POST } = createRouteHandler({
  router: ourFileRouter,
  config: {
    // Token مباشر — UploadThing CDN token
    token: process.env.UPLOADTHING_TOKEN || "eyJhcGlLZXkiOiJza19saXZlXzVjMDZkYzY4YmY2MTI1ODRiZDM3MDY1NjU5ZWFlOGUzNDNlZjliZTg3N2RjMTU2MjZhZTQ3MTk4NmE5ZWU0MGQiLCJhcHBJZCI6ImxqZXZyd2ZwZTYiLCJyZWdpb25zIjpbInNlYTEiXX0=",
  },
});
