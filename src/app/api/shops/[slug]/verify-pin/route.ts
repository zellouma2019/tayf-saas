import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { withRateLimit } from "@/lib/rate-limit";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const rl = withRateLimit(req, "shop-verify-pin");
  if (!rl.ok) return rl.response;
  try {
    const { slug } = await params;
    const { pin } = await req.json();
    if (!pin || !slug) return NextResponse.json({ error: "البيانات مطلوبة" }, { status: 400 });
    const shop = await db.shop.findUnique({ where: { slug }, select: { adminPin: true } });
    if (!shop) return NextResponse.json({ error: "المتجر غير موجود" }, { status: 404 });
    if (shop.adminPin === String(pin)) return NextResponse.json({ success: true });
    return NextResponse.json({ error: "رمز PIN غير صحيح" }, { status: 403 });
  } catch (e) {
    console.error("[verify-pin/POST]", e);
    return NextResponse.json({ error: "خطأ في التحقق" }, { status: 500 });
  }
}