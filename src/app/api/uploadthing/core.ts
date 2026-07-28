import { createUploadthing, type FileRouter } from "uploadthing/next";

const f = createUploadthing();

/**
 * Uploadthing File Router — رفع الملفات مباشرة إلى CDN
 *
 * الملفات تذهب مباشرة من المتصفح إلى Uploadthing CDN
 * دون المرور عبر Vercel serverless function = سرعة فائقة
 *
 * الأنواع المدعومة: PDF, DOCX, JPG, PNG, WEBP
 * الحجم الأقصى: 50 ميغابايت
 */
export const ourFileRouter = {
  printFileUploader: f({
    pdf: { maxFileSize: "50MB", maxFileCount: 1 },
    image: { maxFileSize: "50MB", maxFileCount: 1 },
    blob: { maxFileSize: "50MB", maxFileCount: 1 },
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": {
      maxFileSize: "50MB",
      maxFileCount: 1,
    },
    "image/webp": { maxFileSize: "50MB", maxFileCount: 1 },
  }).onUploadComplete(async ({ file }) => {
    // الملف تم رفعه بنجاح إلى CDN — لا حاجة لأي معالجة
    return {
      url: file.url,
      name: file.name,
      size: file.size,
      key: file.key,
      type: file.type,
    };
  }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
