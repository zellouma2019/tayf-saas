import { NextRequest, NextResponse } from "next/server";
import { db, ensureDb } from "@/lib/db";
import { withRateLimit } from "@/lib/rate-limit";

export const maxDuration = 15;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const rl = withRateLimit(req, "shop-logo");
  if (!rl.ok) return rl.response;
  try {
    await ensureDb();
    const { slug } = await params;
    const body = await req.json();
    const { logoDataUrl, adminPin } = body;

    if (!logoDataUrl || !adminPin) {
      return NextResponse.json({ error: "بيانات غير مكتملة" }, { status: 400 });
    }

    const shop = await db.shop.findUnique({ where: { slug } });
    if (!shop || shop.adminPin !== String(adminPin)) {
      return NextResponse.json({ error: "كلمة المرور غير صحيحة" }, { status: 403 });
    }

    // استخراج البيانات من Data URL للتحقق من الصيغة والحجم
    const dataUrlParts = logoDataUrl.split(",");
    if (dataUrlParts.length < 2 || !dataUrlParts[0].startsWith("data:image/")) {
      return NextResponse.json({ error: "صيغة الصورة غير صالحة" }, { status: 400 });
    }

    const base64Data = dataUrlParts.slice(1).join(",");
    const buffer = Buffer.from(base64Data, "base64");

    // حد أقصى 1.5 م.ب (بعد الضغط)
    if (buffer.length > 1500 * 1024) {
      return NextResponse.json({ error: "حجم الصورة كبير جداً (الحد 1.5 م.ب)" }, { status: 400 });
    }

    // تخزين Data URL مباشرة في قاعدة البيانات (يعمل على Vercel وكل البيئات)
    await db.shop.update({
      where: { slug },
      data: { logoUrl: logoDataUrl },
    });

    return NextResponse.json({ success: true, logoUrl: logoDataUrl });
  } catch (e) {
    console.error('[shops/[slug]/logo]', e);
    return NextResponse.json({ error: "فشل رفع الشعار" }, { status: 500 });
  }
}