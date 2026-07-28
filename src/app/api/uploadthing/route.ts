import { createRouteHandler } from "uploadthing/next";
import { ourFileRouter } from "./core";

export const { GET, POST } = createRouteHandler({
  router: ourFileRouter,
  config: {
    // لا تحتاج لتحديد callbackUrl هنا — نستخدم onUploadComplete في core.ts
  },
});
