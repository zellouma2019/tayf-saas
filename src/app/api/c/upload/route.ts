import { NextRequest, NextResponse } from "next/server";
import { tursoExecute } from "@/lib/turso-lite";
import { randomUUID } from "crypto";
import fs from "fs";
import path from "path";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 ميغابايت

const ACCEPTED_EXTENSIONS = [
  "pdf", "jpg", "jpeg", "png", "webp", "gif", "svg", "bmp", "tiff", "tif", "avif",
  "doc", "docx", "xlsx", "xls", "pptx", "ppt", "txt", "rtf", "csv",
  "ai", "eps", "psd", "indd",
];

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "لم يتم إرسال ملف" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `حجم الملف ${(file.size / (1024 * 1024)).toFixed(1)} ميغابايت يتجاوز الحد الأقصى (50 ميغابايت)` },
        { status: 413 },
      );
    }

    const originalName = file.name || "unknown";
    const ext = originalName.split(".").pop()?.toLowerCase() || "";

    if (!ACCEPTED_EXTENSIONS.includes(ext)) {
      return NextResponse.json(
        { error: `صيغة الملف ".${ext}" غير مدعومة` },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const base64 = buffer.toString("base64");
    const mimeMap: Record<string, string> = {
      pdf: "application/pdf", jpg: "image/jpeg", jpeg: "image/jpeg",
      png: "image/png", webp: "image/webp", gif: "image/gif",
      svg: "image/svg+xml", bmp: "image/bmp",
      docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      doc: "application/msword",
      xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      txt: "text/plain", rtf: "application/rtf", csv: "text/csv",
    };
    const mime = mimeMap[ext] || "application/octet-stream";
    const dataUrl = `data:${mime};base64,${base64}`;

    const uploadId = randomUUID();

    // محاولة حفظ في قاعدة البيانات أولاً (يعمل على Vercel + local)
    try {
      await tursoExecute(
        `INSERT INTO "FileUpload" (id, fileName, fileSize, fileExt, totalChunks, receivedCount, status, assembledBase64, "createdAt") VALUES (?, ?, ?, ?, 1, 1, 'complete', ?, datetime('now'))`,
        [uploadId, originalName, file.size, ext, dataUrl],
      );
      // إرجاع معرّف مع بادئة __chunked__ ليتمكن file-resolver من إيجاده في قاعدة البيانات
      const storedFileName = `__chunked__:${uploadId}`;
      return NextResponse.json({ storedFileName, originalName, size: file.size, type: ext });
    } catch (dbErr) {
      // إذا فشل الحفظ في قاعدة البيانات (ملف كبير جداً)، نحفظ على القرص
      console.warn("[upload] DB save failed, falling back to disk:", dbErr);
      const uploadsDir = path.join(process.cwd(), "uploads");
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      const timestamp = Date.now();
      const suffix = uploadId.slice(0, 8);
      const diskFileName = `file_${timestamp}_${suffix}.${ext}`;
      fs.writeFileSync(path.join(uploadsDir, diskFileName), buffer);
      return NextResponse.json({ storedFileName: diskFileName, originalName, size: file.size, type: ext });
    }
  } catch (e) {
    console.error("[upload] Error:", e);
    return NextResponse.json(
      { error: "فشل في رفع الملف" },
      { status: 500 },
    );
  }
}
