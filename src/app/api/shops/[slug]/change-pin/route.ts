import { NextRequest, NextResponse } from "next/server";
import { tursoQuerySafe, tursoExecute } from "@/lib/turso-lite";
import { withRateLimit } from "@/lib/rate-limit";

/// تغيير كلمة مرور المتجر (PIN) — عبر turso-lite (أسرع من Prisma)
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

    // التحقق من المتجر وكلمة المرور الحالية عبر turso-lite
    const { rows, error } = await tursoQuerySafe<{ adminPin: string }>(
      `SELECT "adminPin" FROM "Shop" WHERE slug = ? LIMIT 1`,
      [slug],
      10000
    );

    if (error) {
      return NextResponse.json(
        { error: "مشكلة في الاتصال بقاعدة البيانات", code: "DB_ERROR" },
        { status: 503 }
      );
    }

    const shop = rows[0];
    if (!shop) {
      return NextResponse.json({ error: "المتجر غير موجود" }, { status: 404 });
    }

    // التحقق من كلمة المرور الحالية
    if (!currentPin || shop.adminPin !== String(currentPin)) {
      return NextResponse.json({ error: "كلمة المرور الحالية غير صحيحة" }, { status: 401 });
    }

    // تحديث كلمة المرور عبر turso-lite
    await tursoExecute(
      `UPDATE "Shop" SET "adminPin" = ?, "updatedAt" = ? WHERE slug = ?`,
      [newPin, new Date().toISOString(), slug]
    );

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('[shops/[slug]/change-pin]', e);
    return NextResponse.json({ error: "حدث خطأ أثناء تغيير كلمة المرور" }, { status: 500 });
  }
}
