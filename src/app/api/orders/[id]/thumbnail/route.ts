import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import crypto from "crypto";
import { orderFindWhere } from "@/lib/order-lookup";

/// توليد صورة مصغّرة من الصفحة الأولى لملف PDF
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const shopId = req.nextUrl.searchParams.get("shopId");
    const findWhere = orderFindWhere(id, shopId);
    const order = await db.printOrder.findFirst({ where: findWhere });
    if (!order) {
      return NextResponse.json({ error: "الطلب غير موجود" }, { status: 404 });
    }
    if (!order.fileData) {
      return NextResponse.json({ error: "لا يوجد ملف" }, { status: 404 });
    }

    // data URL — لملفات base64 المخزنة مباشرة في DB
    if (order.fileData.startsWith("data:")) {
      const matches = order.fileData.match(/^data:([^;]+);base64,(.+)$/);
      if (!matches) {
        return NextResponse.json({ error: "صيغة غير مدعومة" }, { status: 400 });
      }
      const mime = matches[1];
      // الصور فقط — نرجعها مباشرة كـ مصغّرة
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
      // PDF كـ base64 — لا نولّد مصغّرة (يتطلب أدوات غير متوفرة على serverless)
      return NextResponse.json({ error: "غير مدعوم" }, { status: 400 });
    }

    // ملف على القرص (يبدأ بـ "file_")
    let sourcePath = "";
    if (order.fileData.startsWith("file_")) {
      sourcePath = path.join(process.cwd(), "uploads", order.fileData);
    } else {
      return NextResponse.json({ error: "صيغة غير مدعومة" }, { status: 400 });
    }

    if (!fs.existsSync(sourcePath)) {
      return NextResponse.json({ error: "الملف غير موجود" }, { status: 404 });
    }

    // توليد مفتاح ذاكرة مؤقتة بناءً على المسار + التعديل
    const stat = fs.statSync(sourcePath);
    const cacheKey = crypto
      .createHash("md5")
      .update(`${sourcePath}-${stat.mtimeMs}`)
      .digest("hex")
      .substring(0, 12);

    const thumbDir = path.join(process.cwd(), ".thumbnails");
    const thumbPath = path.join(thumbDir, `${cacheKey}.png`);

    // إذا كانت المصغّرة موجودة، أرجعها
    if (fs.existsSync(thumbPath)) {
      const buffer = fs.readFileSync(thumbPath);
      return new NextResponse(buffer, {
        headers: {
          "Content-Type": "image/png",
          "Cache-Control": "public, max-age=86400, immutable",
          "Content-Length": buffer.length.toString(),
        },
      });
    }

    // تحقق إن كان PDF
    const ext = order.fileData.split(".").pop()?.toLowerCase() || "";
    if (ext !== "pdf") {
      // للملفات الأخرى (صور إلخ) — أرجع الملف الأصلي
      const buffer = fs.readFileSync(sourcePath);
      const mimeTypes: Record<string, string> = {
        png: "image/png",
        jpg: "image/jpeg",
        jpeg: "image/jpeg",
        gif: "image/gif",
        webp: "image/webp",
      };
      return new NextResponse(buffer, {
        headers: {
          "Content-Type": mimeTypes[ext] || "application/octet-stream",
          "Cache-Control": "public, max-age=86400",
          "Content-Length": buffer.length.toString(),
        },
      });
    }

    // توليد المصغّرة باستخدام pdftoppm
    const tmpOutput = path.join(thumbDir, `tmp_${cacheKey}`);
    try {
      execSync(
        `pdftoppm -png -f 1 -l 1 -r 150 -singlefile "${sourcePath}" "${tmpOutput}"`,
        { timeout: 10000 },
      );

      const generatedPath = `${tmpOutput}.png`;
      if (!fs.existsSync(generatedPath)) {
        return NextResponse.json({ error: "فشل توليد المصغّرة" }, { status: 500 });
      }

      // أعد تسمية إلى الملف النهائي
      fs.renameSync(generatedPath, thumbPath);

      const buffer = fs.readFileSync(thumbPath);
      return new NextResponse(buffer, {
        headers: {
          "Content-Type": "image/png",
          "Cache-Control": "public, max-age=86400, immutable",
          "Content-Length": buffer.length.toString(),
        },
      });
    } catch (err) {
      console.error("خطأ في توليد المصغّرة:", err);
      return NextResponse.json({ error: "فشل توليد المصغّرة" }, { status: 500 });
    }
  } catch (e) {
    console.error('[orders/[id]/thumbnail]', e);
    return NextResponse.json({ error: "حدث خطأ أثناء جلب المصغّرة" }, { status: 500 });
  }
}