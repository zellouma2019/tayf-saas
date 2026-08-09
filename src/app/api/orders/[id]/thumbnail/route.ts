import { NextRequest, NextResponse } from "next/server";
import { tursoQuery } from "@/lib/turso-lite";
import { resolveFileData } from "@/lib/file-resolver";

export const maxDuration = 30;
export const dynamic = "force-dynamic";

/// توليد صورة مصغّرة من الملف المرفوع
/// يدعم: data URL, ملفات مجزأة (__chunked__), ملفات على القرص (file_)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const shopId = req.nextUrl.searchParams.get("shopId");

    const whereClause = shopId
      ? `WHERE id = ? AND ("shopId" = ? OR "shopId" IS NULL)`
      : `WHERE id = ?`;
    const args = shopId ? [id, shopId] : [id];

    const rows = await tursoQuery<{ fileData: string | null; fileName: string | null; fileType: string | null }>(
      `SELECT "fileData", "fileName", "fileType" FROM "PrintOrder" ${whereClause} LIMIT 1`,
      args
    );

    const order = rows[0];
    if (!order) {
      return NextResponse.json({ error: "الطلب غير موجود" }, { status: 404 });
    }
    if (!order.fileData) {
      return NextResponse.json({ error: "لا يوجد ملف" }, { status: 404 });
    }

    // حلّ بيانات الملف (يدعم data URL, __chunked__, file_)
    const resolvedData = await resolveFileData(order.fileData);
    if (!resolvedData) {
      return NextResponse.json({ error: "تعذّر تحميل بيانات الملف" }, { status: 404 });
    }

    // تحديد نوع الملف من الامتداد أو fileType
    const fileType = order.fileType || order.fileName?.split(".").pop()?.toUpperCase() || "";
    const isImage = ["PNG", "JPG", "JPEG", "GIF", "WEBP"].includes(fileType.toUpperCase());

    // ملف على القرص (يبدأ بـ "file_") — التطوير المحلي فقط
    if (resolvedData.startsWith("file_")) {
      try {
        const fs = await import("fs");
        const path = await import("path");
        const filePath = path.join(process.cwd(), "uploads", resolvedData);
        if (!fs.existsSync(filePath)) {
          return NextResponse.json({ error: "الملف غير موجود" }, { status: 404 });
        }
        // الصور: أرجع الملف مباشرة كـ مصغّرة
        if (isImage) {
          const buffer = fs.readFileSync(filePath);
          return new NextResponse(buffer, {
            headers: {
              "Content-Type": `image/${fileType.toLowerCase()}`,
              "Cache-Control": "public, max-age=86400",
              "Content-Length": buffer.length.toString(),
            },
          });
        }
        return NextResponse.json({ error: "غير مدعوم" }, { status: 400 });
      } catch {
        return NextResponse.json({ error: "الملف غير موجود" }, { status: 404 });
      }
    }

    // data URL — الصور فقط نرجعها مباشرة كـ مصغّرة
    if (resolvedData.startsWith("data:")) {
      const matches = resolvedData.match(/^data:([^;]+);base64,(.+)$/);
      if (!matches) {
        return NextResponse.json({ error: "صيغة غير مدعومة" }, { status: 400 });
      }
      const mime = matches[1];
      if (mime.startsWith("image/")) {
        const buffer = Buffer.from(matches[2], "base64");
        return new NextResponse(buffer, {
          headers: {
            "Content-Type": mime,
            "Cache-Control": "public, max-age=86400",
            "Content-Length": buffer.length.toString(),
          },
        });
      }
      // PDF أو ملفات أخرى — لا نولّد مصغّرة
      return NextResponse.json({ error: "غير مدعوم" }, { status: 400 });
    }

    return NextResponse.json({ error: "صيغة غير مدعومة" }, { status: 400 });
  } catch (e) {
    console.error('[orders/[id]/thumbnail]', e);
    return NextResponse.json({ error: "حدث خطأ أثناء جلب المصغّرة" }, { status: 500 });
  }
}
