import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { withRateLimit } from "@/lib/rate-limit";

/// تغيير كلمة مرور المتجر (PIN) — نقطة نهاية مخصصة
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const rl = withRateLimit(req, "shop-change-pin");
  if (!rl.ok) return rl.response;

  try {
    const { slug } = await params;
    const body = await req.json();
    const { currentPin, newPin } = body;

    if (!newPin) {
      return NextResponse.json({ error: "كلمة المرور الجديدة مطلوبة" }, { status: 400 });
    }

    if (newPin.length < 4) {
      return NextResponse.json(
        { error: "كلمة المرور يجب أن تكون 4 أحرف على الأقل" },
        { status: 400 },
      );
    }

    const shop = await db.shop.findUnique({ where: { slug } });
    if (!shop) {
      return NextResponse.json({ error: "المتجر غير موجود" }, { status: 404 });
    }

    // التحقق من كلمة المرور الحالية
    if (!currentPin || shop.adminPin !== String(currentPin)) {
      return NextResponse.json({ error: "كلمة المرور الحالية غير صحيحة" }, { status: 401 });
    }

    // تحديث كلمة المرور
    await db.shop.update({
      where: { slug },
      data: { adminPin: newPin },
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('[shops/[slug]/change-pin]', e);
    return NextResponse.json({ error: "حدث خطأ أثناء تغيير كلمة المرور" }, { status: 500 });
  }
}