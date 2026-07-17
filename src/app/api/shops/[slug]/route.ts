import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { withRateLimit } from "@/lib/rate-limit";

// زيادة حد حجم الطلب لرفع الشعار
export const maxDuration = 30;

/// تهيئة قاعدة البيانات إن لم تكن جاهزة
let dbChecked = false;
async function ensureSchema(): Promise<boolean> {
  if (dbChecked) return true;
  try {
    await db.shop.count();
    dbChecked = true;
    return true;
  } catch {
    try {
      const baseUrl = process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
      const res = await fetch(`${baseUrl}/api/setup`, { method: 'POST' });
      if (res.ok) dbChecked = true;
      return res.ok;
    } catch {
      return false;
    }
  }
}

/// جلب بيانات متجر محدد
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const rl = withRateLimit(req, "shop-detail");
  if (!rl.ok) return rl.response;
  try {
    const { slug } = await params;
    const shop = await db.shop.findUnique({
      where: { slug },
    });

    if (!shop || !shop.isActive) {
      return NextResponse.json({ error: "المتجر غير موجود" }, { status: 404 });
    }

    // لا نُرجع كلمة المرور
    const { adminPin: _, ...safeShop } = shop;

    return NextResponse.json({ shop: safeShop });
  } catch (e) {
    // محاولة تهيئة قاعدة البيانات إن لم تكن الجداول موجودة
    const ready = await ensureSchema();
    if (!ready) {
      return NextResponse.json({ error: "الخدمة غير متاحة حالياً" }, { status: 503 });
    }
    try {
      const { slug } = await params;
      const shop = await db.shop.findUnique({
        where: { slug },
      });
      if (!shop || !shop.isActive) {
        return NextResponse.json({ error: "المتجر غير موجود" }, { status: 404 });
      }
      const { adminPin: _, ...safeShop } = shop;
      return NextResponse.json({ shop: safeShop });
    } catch (retryErr) {
      console.error('[shops/[slug]/GET]', retryErr);
      return NextResponse.json({ error: "الخدمة غير متاحة حالياً" }, { status: 503 });
    }
  }
}

/// تحديث بيانات المتجر
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const rl = withRateLimit(req, "shop-detail");
  if (!rl.ok) return rl.response;
  try {
    const { slug } = await params;
    const body = await req.json();

    // التحقق من كلمة المرور (إلزامي دائماً)
    const shop = await db.shop.findUnique({ where: { slug } });
    if (!shop || !body.adminPin || shop.adminPin !== String(body.adminPin)) {
      return NextResponse.json({ error: "كلمة المرور غير صحيحة" }, { status: 403 });
    }

    // البيانات القابلة للتعديل (بدون كلمة المرور والمعرّف)
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

/// حذف متجر
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

    // حذف الطلبات والإعدادات المرتبطة أولاً
    await db.printOrder.deleteMany({ where: { shopId: shop.id } });
    await db.setting.deleteMany({ where: { shopId: shop.id } });
    await db.shop.delete({ where: { id: shop.id } });

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('[shops/[slug]/DELETE]', e);
    return NextResponse.json({ error: "الخدمة غير متاحة حالياً" }, { status: 503 });
  }
}