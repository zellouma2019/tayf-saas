import { NextRequest, NextResponse } from "next/server";
import { tursoQuery } from "@/lib/turso-lite";

export const maxDuration = 30;
export const dynamic = "force-dynamic";

/// عرض الملف المرفوع للطلب (inline — للمعاينة في المتصفح)
/// عبر turso-lite (أسرع من Prisma على Vercel)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const shopId = req.nextUrl.searchParams.get("shopId");

    // يدعم الطلبات القديمة (shopId = null)
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

    // استخراج الامتداد من اسم الملف الفعلي (وليس من fileData الذي قد يكون data URL)
    const ext = (order.fileName?.split(".").pop() || order.fileData.split(".").pop() || "").toLowerCase();
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
    const safeName = encodeURIComponent(order.fileName || order.fileData);

    // data URL (base64) — الحالة الأكثر شيوعاً
    const dataUrl = order.fileData;
    const matches = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (!matches) {
      // ليست data URL — قد تكون اسم ملف على القرص
      if (dataUrl.startsWith("file_")) {
        // محاولة قراءة من القرص (للطلبات القديمة في التطوير المحلي)
        try {
          // استيراد ديناميكي لتجنب fs على Vercel
          const fs = await import("fs");
          const path = await import("path");
          const filePath = path.join(process.cwd(), "uploads", dataUrl);
          if (!fs.existsSync(filePath)) {
            return NextResponse.json({ error: "الملف غير موجود على الخادم" }, { status: 404 });
          }
          const buffer = fs.readFileSync(filePath);
          return new NextResponse(buffer, {
            headers: {
              "Content-Type": mimeType,
              "Content-Disposition": `inline; filename*=UTF-8''${safeName}`,
              "Content-Length": buffer.length.toString(),
              "Cache-Control": "private, max-age=3600",
            },
          });
        } catch {
          return NextResponse.json({ error: "الملف غير موجود على الخادم" }, { status: 404 });
        }
      }
      return new NextResponse(dataUrl, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Content-Disposition": `inline; filename*=UTF-8''${safeName}`,
        },
      });
    }
    const urlMime = matches[1];
    const buffer = Buffer.from(matches[2], "base64");
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": urlMime,
        "Content-Disposition": `inline; filename*=UTF-8''${safeName}`,
        "Content-Length": buffer.length.toString(),
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (e) {
    console.error('[orders/[id]/preview]', e);
    return NextResponse.json({ error: "حدث خطأ أثناء معاينة الملف" }, { status: 500 });
  }
}
