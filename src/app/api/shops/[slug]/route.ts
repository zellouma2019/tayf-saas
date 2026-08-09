import { NextRequest, NextResponse } from "next/server";
import { tursoQuery, tursoQuerySafe, tursoExecute } from "@/lib/turso-lite";
import { withRateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

/// أعمدة متجر آمنة للإرجاع للعميل (بدون adminPin)
const SHOP_SELECT_COLUMNS = `
  id, slug, name, phone, whatsapp, email, address,
  "logoUrl", "logoIcon", "primaryColor", "themeId",
  settings, "ownerName", "ownerPhone", "isActive",
  plan, features, "createdAt", "updatedAt",
  "trialDays", "trialStartsAt", country, language, "customCurrency"
`;

interface ShopRow {
  id: string;
  slug: string;
  name: string;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  address: string | null;
  logoUrl: string | null;
  logoIcon: string;
  primaryColor: string | null;
  themeId: number;
  settings: string | null;
  ownerName: string | null;
  ownerPhone: string | null;
  isActive: boolean | number;
  plan: string;
  features: string | null;
  createdAt: string;
  updatedAt: string | null;
  trialDays: number | null;
  trialStartsAt: string | null;
  country: string;
  language: string;
  customCurrency: string | null;
  adminPin?: string;
}

/// جلب بيانات متجر محدد — عبر turso-lite (أسرع 10x من Prisma على Vercel)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const rl = withRateLimit(req, "shop-detail");
  if (!rl.ok) return rl.response;
  try {
    const { slug } = await params;
    const rows = await tursoQuery<ShopRow>(
      `SELECT ${SHOP_SELECT_COLUMNS}, "adminPin" FROM "Shop" WHERE slug = ? LIMIT 1`,
      [slug]
    );
    const shop = rows[0];

    if (!shop || !shop.isActive) {
      return NextResponse.json({ error: "المتجر غير موجود" }, { status: 404 });
    }

    // لا نُرجع كلمة المرور
    const { adminPin: _pin, ...safeShop } = shop;
    void _pin;
    // تحويل القيم المنطقية (SQLite يخزنها 0/1)
    if (typeof safeShop.isActive === "number") {
      safeShop.isActive = safeShop.isActive === 1;
    }
    return NextResponse.json({ shop: safeShop });
  } catch (e) {
    console.error('[shops/[slug]/GET]', e);
    // محاولة تهيئة قاعدة البيانات إن لم تكن الجداول موجودة
    try {
      const baseUrl = process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
      await fetch(`${baseUrl}/api/setup`, { method: 'POST' });
      // إعادة المحاولة بعد التهيئة
      const { slug } = await params;
      const rows = await tursoQuery<ShopRow>(
        `SELECT ${SHOP_SELECT_COLUMNS} FROM "Shop" WHERE slug = ? AND "isActive" = 1 LIMIT 1`,
        [slug]
      );
      const shop = rows[0];
      if (!shop) {
        return NextResponse.json({ error: "المتجر غير موجود" }, { status: 404 });
      }
      if (typeof shop.isActive === "number") shop.isActive = shop.isActive === 1;
      return NextResponse.json({ shop });
    } catch (retryErr) {
      console.error('[shops/[slug]/GET retry]', retryErr);
      return NextResponse.json({ error: "الخدمة غير متاحة حالياً" }, { status: 503 });
    }
  }
}

/// تحديث بيانات المتجر — عبر turso-lite
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
    const { rows: pinRows, error: pinError } = await tursoQuerySafe<{ adminPin: string }>(
      `SELECT "adminPin" FROM "Shop" WHERE slug = ? LIMIT 1`,
      [slug],
      10000
    );

    // إذا حدث خطأ في قاعدة البيانات (timeout أو اتصال)، أرجع خطأ مناسب
    if (pinError) {
      return NextResponse.json(
        { error: "مشكلة في الاتصال بقاعدة البيانات، يرجى المحاولة مرة أخرى", code: "DB_ERROR" },
        { status: 503 }
      );
    }

    const shop = pinRows[0];
    if (!shop) {
      return NextResponse.json({ error: "المتجر غير موجود" }, { status: 404 });
    }
    if (!body.adminPin || String(shop.adminPin) !== String(body.adminPin)) {
      return NextResponse.json({ error: "كلمة المرور غير صحيحة" }, { status: 403 });
    }

    // البيانات القابلة للتعديل
    const allowedFields = [
      "name", "phone", "whatsapp", "email", "address",
      "logoUrl", "logoIcon", "primaryColor", "themeId",
      "settings", "ownerName", "ownerPhone", "isActive",
      "plan", "features", "trialDays", "trialStartsAt",
      "country", "language", "customCurrency",
    ];

    const setClauses: string[] = [];
    const args: unknown[] = [];
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        setClauses.push(`"${field}" = ?`);
        args.push(body[field]);
      }
    }

    // حالة خاصة: إذا كان الطلب يحتوي فقط على adminPin (للتحقق من PIN)
    // نرجع بيانات المتجر الحالية بدون تحديث
    if (setClauses.length === 0) {
      const currentRows = await tursoQuery<ShopRow>(
        `SELECT ${SHOP_SELECT_COLUMNS} FROM "Shop" WHERE slug = ? LIMIT 1`,
        [slug]
      );
      const current = currentRows[0];
      if (!current) {
        return NextResponse.json({ error: "المتجر غير موجود" }, { status: 404 });
      }
      if (typeof current.isActive === "number") current.isActive = current.isActive === 1;
      return NextResponse.json({ shop: current });
    }

    setClauses.push(`"updatedAt" = ?`);
    args.push(new Date().toISOString());
    args.push(slug); // WHERE slug = ?

    const result = await tursoExecute<ShopRow>(
      `UPDATE "Shop" SET ${setClauses.join(", ")} WHERE slug = ? RETURNING ${SHOP_SELECT_COLUMNS}`,
      args
    );

    const updated = result.rows[0];
    if (!updated) {
      return NextResponse.json({ error: "فشل تحديث المتجر" }, { status: 500 });
    }
    if (typeof updated.isActive === "number") updated.isActive = updated.isActive === 1;

    return NextResponse.json({ shop: updated });
  } catch (e) {
    console.error('[shops/[slug]/PUT]', e);
    return NextResponse.json({ error: "الخدمة غير متاحة حالياً" }, { status: 503 });
  }
}

/// حذف متجر — عبر turso-lite
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const rl = withRateLimit(req, "shop-detail");
  if (!rl.ok) return rl.response;
  try {
    const { slug } = await params;
    const { adminPin } = await req.json();

    const rows = await tursoQuery<{ id: string; adminPin: string }>(
      `SELECT id, "adminPin" FROM "Shop" WHERE slug = ? LIMIT 1`,
      [slug]
    );
    const shop = rows[0];
    if (!shop || String(shop.adminPin) !== String(adminPin)) {
      return NextResponse.json({ error: "كلمة المرور غير صحيحة" }, { status: 403 });
    }

    // حذف الطلبات والإعدادات المرتبطة أولاً
    await tursoExecute(
      `DELETE FROM "PrintOrder" WHERE "shopId" = ?`,
      [shop.id]
    );
    await tursoExecute(
      `DELETE FROM "Setting" WHERE "shopId" = ?`,
      [shop.id]
    );
    await tursoExecute(
      `DELETE FROM "Shop" WHERE id = ?`,
      [shop.id]
    );

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('[shops/[slug]/DELETE]', e);
    return NextResponse.json({ error: "الخدمة غير متاحة حالياً" }, { status: 503 });
  }
}
