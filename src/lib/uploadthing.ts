/**
 * Uploadthing Client Helpers — React hooks ومكونات لرفع الملفات
 *
 * الملفات تُرفع مباشرة من المتصفح إلى Uploadthing CDN
 * = لا يمر أي بيانات ملف عبر Vercel serverless = سرعة فائقة!
 */
import type { OurFileRouter } from "@/app/api/uploadthing/core";
import { generateUploadButton, generateUploadDropzone, generateReactHelpers } from "@uploadthing/react";

/** زر رفع الملفات */
export const UploadButton = generateUploadButton<OurFileRouter>();

/** منطقة سحب وإفلات للملفات */
export const UploadDropzone = generateUploadDropzone<OurFileRouter>();

/** React hook لرفع الملفات برمجياً */
export const { useUploadThing } = generateReactHelpers<OurFileRouter>({
  url: "/api/uploadthing",
});
