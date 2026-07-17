import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { withRateLimit } from "@/lib/rate-limit";

export const maxDuration = 30;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const rl = withRateLimit(req, "shop-detail");
  if (!rl.ok) return rl.response;
  try {
    const { slug } = await params;
    const shop = await db.shop.findUnique({ where: { slug } });

    if (!shop || !shop.isActive) {
      return NextResponse.json({ error: "المتجر غير موجود" }, { status: 404 });
    }

    const { adminPin: _, ...safeShop } = shop;
    return NextResponse.json(
      { shop: safeShop },
      {
        headers: {
          "Cache-Control": "public, s-maxage=10, stale-while-revalidate=59",
        },
      },
    );
  } catch (e) {
    console.error('[shops/[slug]/GET]', e);
    return NextResponse.json({ error: "الخدمة غير متاحة حالياً" }, { status: 503 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const rl = withRateLimit(req, "shop-detail");
  if (!rl.ok) return rl.response;
  try {
    const { slug } = await params;
    const body = await req.json();

    const shop = await db.shop.findUnique({ where: { slug } });
    if (!shop || !body.adminPin || shop.adminPin !== String(body.adminPin)) {
      return NextResponse.json({ error: "كلمة المرور غير صحيحة" }, { status: 403 });
    }

    const { adminPin: _pin, slug: _slug, id: _id, createdAt: _c, updatedAt: _u, ...updateData } = body;

    const updated = await db.shop.update({
      where: { slug },
      data: updateData,
    });

    const { adminPin: __, ...safeShop } = updated;
    return NextResponse.json({ shop: safeShop });
  } catch (e) {
    console.error('[shops/[slug]/PUT]', e);
    return NextResponse.json({ error: "الخدمة غير متاحة حالياً" }, { status: 503 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const rl = withRateLimit(req, "shop-detail");
  if (!rl.ok) return rl.response;
  try {
    const { slug } = await params;
    const { adminPin } = await req.json();

    const shop = await db.shop.findUnique({ where: { slug } });
    if (!shop || shop.adminPin !== String(adminPin)) {
      return NextResponse.json({ error: "كلمة المرور غير صحيحة" }, { status: 403 });
    }

    await db.printOrder.deleteMany({ where: { shopId: shop.id } });
    await db.setting.deleteMany({ where: { shopId: shop.id } });
    await db.shop.delete({ where: { id: shop.id } });

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('[shops/[slug]/DELETE]', e);
    return NextResponse.json({ error: "الخدمة غير متاحة حالياً" }, { status: 503 });
  }
}