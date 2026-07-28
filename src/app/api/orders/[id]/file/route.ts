import { NextRequest, NextResponse } from "next/server";
import { tursoQuery } from "@/lib/turso-lite";
import { resolveFileData, extractCdnUrl } from "@/lib/file-resolver";

export const maxDuration = 30;
export const dynamic = "force-dynamic";

/// تنزيل الملف المرفوع للطلب — عبر turso-lite (أسرع من Prisma على Vercel)
/// يدعم: data URL, ملفات مجزأة (__chunked__), ملفات CDN (__cdn__), ملفات على القرص (file_)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const shopId = req.nextUrl.searchParams.get("shopId");

    // استعلام مباشر يجلب fileData + fileName فقط
    const whereClause = shopId
      ? `WHERE id = ? AND ("shopId" = ? OR "shopId" IS NULL)`
      : `WHERE id = ?`;
    const args = shopId ? [id, shopId] : [id];

    const rows = await tursoQuery<{ fileData: string | null; fileName: string | null }>(
      `SELECT "fileData", "fileName" FROM "PrintOrder" ${whereClause} LIMIT 1`,
      args
    );

    const order = rows[0];
    if (!order) {
      return NextResponse.json({ error: "الطلب غير موجود" }, { status: 404 });
    }
    if (!order.fileData) {
      return NextResponse.json({ error: "لا يوجد ملف لهذا الطلب" }, { status: 404 });
    }

    // 🚀 ملف CDN — إعادة توجيه مباشرة (لا يمر عبر الخادم!)
    const cdnUrl = extractCdnUrl(order.fileData);
    if (cdnUrl) {
      const safeName = encodeURIComponent(order.fileName || "download");
      // إضافة معلمة download لتنزيل مباشر بدلاً من العرض
      const separator = cdnUrl.includes("?") ? "&" : "?";
      const downloadUrl = `${cdnUrl}${separator}download=1`;
      return NextResponse.redirect(downloadUrl);
    }

    // حلّ بيانات الملف (يدعم data URL, __chunked__, file_)
    const resolvedData = await resolveFileData(order.fileData);
    if (!resolvedData) {
      return NextResponse.json({ error: "تعذّر تحميل بيانات الملف" }, { status: 404 });
    }

    const ext = (order.fileName?.split(".").pop() || "").toLowerCase();
    const mimeTypes: Record<string, string> = {
      pdf: "application/pdf",
      png: "image/png",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      gif: "image/gif",
      webp: "image/webp",
      docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      doc: "application/msword",
    };
    const mimeType = mimeTypes[ext] || "application/octet-stream";
    const safeName = encodeURIComponent(order.fileName || "download");

    // ملف على القرص (يبدأ بـ "file_") — يحتاج fs
    if (resolvedData.startsWith("file_")) {
      try {
        const fs = await import("fs");
        const path = await import("path");
        const filePath = path.join(process.cwd(), "uploads", resolvedData);
        if (!fs.existsSync(filePath)) {
          return NextResponse.json({ error: "الملف غير موجود على الخادم" }, { status: 404 });
        }
        const buffer = fs.readFileSync(filePath);
        return new NextResponse(buffer, {
          headers: {
            "Content-Type": mimeType,
            "Content-Disposition": `attachment; filename*=UTF-8''${safeName}`,
            "Content-Length": buffer.length.toString(),
            "Cache-Control": "private, max-age=0, no-cache",
          },
        });
      } catch {
        return NextResponse.json({ error: "الملف غير موجود على الخادم" }, { status: 404 });
      }
    }

    // data URL (الصيغة الأكثر شيوعاً + الملفات المجزأة بعد الحلّ)
    const matches = resolvedData.match(/^data:([^;]+);base64,(.+)$/);
    if (!matches) {
      return new NextResponse(resolvedData, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Content-Disposition": `attachment; filename*=UTF-8''${safeName}`,
        },
      });
    }
    const urlMime = matches[1];
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, "base64");
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": urlMime,
        "Content-Disposition": `attachment; filename*=UTF-8''${safeName}`,
        "Content-Length": buffer.length.toString(),
        "Cache-Control": "private, max-age=0, no-cache",
      },
    });
  } catch (e) {
    console.error('[orders/[id]/file]', e);
    return NextResponse.json({ error: "حدث خطأ أثناء تنزيل الملف" }, { status: 500 });
  }
}
