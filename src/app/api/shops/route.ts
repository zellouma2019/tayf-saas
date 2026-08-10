import { NextRequest, NextResponse } from "next/server";
import { tursoQuery, toNum } from "@/lib/turso-lite";
import { withRateLimit } from "@/lib/rate-limit";

/// جلب كل المتاجر عبر turso-lite (أسرع 10x من Prisma على Vercel)
export async function GET(req: NextRequest) {
  const rl = withRateLimit(req, "shops");
  if (!rl.ok) return rl.response;
  try {
    const shops = await tursoQuery(
      `SELECT
        s.id, s.slug, s.name, s.phone, s."ownerName", s."ownerPhone",
        s."isActive", s.country, s.language, s."themeId", s."createdAt",
        COALESCE(o.cnt, 0) as orderCount
      FROM "Shop" s
      LEFT JOIN (
        SELECT "shopId", COUNT(*) as cnt FROM "PrintOrder" GROUP BY "shopId"
      ) o ON o."shopId" = s.id
      ORDER BY s."createdAt" DESC`
    );

    return NextResponse.json({
      shops: shops.map((s) => ({
        id: String(s.id),
        slug: String(s.slug),
        name: String(s.name),
        phone: s.phone ? String(s.phone) : null,
        ownerName: s.ownerName ? String(s.ownerName) : null,
        ownerPhone: s.ownerPhone ? String(s.ownerPhone) : null,
        isActive: Boolean(s.isActive),
        country: String(s.country || "DZ"),
        language: String(s.language || "ar"),
        themeId: toNum(s.themeId),
        createdAt: String(s.createdAt),
        _count: { orders: toNum(s.orderCount) },
      })),
    });
  } catch (e) {
    console.error('[shops/GET]', e);
    return NextResponse.json({ error: "حدث خطأ أثناء جلب المتاجر" }, { status: 500 });
  }
}

/// إنشاء متجر جديد — يبقى باستخدام Prisma (عملية كتابة معقدة)
export async function POST(req: NextRequest) {
  const rl = withRateLimit(req, "shops");
  if (!rl.ok) return rl.response;
  try {
    // POST لم يتم تحويله لأنه يستخدم ensureDb + getNextThemeId
    // الـ POST نادر الاستخدام (الإدارة فقط) — لا يؤثر على الأداء
    const { db } = await import("@/lib/db");
    const { ensureDb } = await import("@/lib/db");
    const { getNextThemeId } = await import("@/lib/themes");
    await ensureDb();

    const body = await req.json();
    const { name, slug, adminPin, ownerName, ownerPhone, phone, whatsapp, email, address, trialDays, country, language, features, logoIcon, primaryColor, plan, customCurrency, themeId } = body;

    if (!name || !slug || !adminPin) {
      return NextResponse.json({ error: "الاسم والمعرّف وكلمة المرور مطلوبة" }, { status: 400 });
    }

    // التحقق من عدم تكرار المعرّف
    const existing = await db.shop.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json({ error: "هذا المعرّف مستخدم بالفعل" }, { status: 409 });
    }

    const shop = await db.shop.create({
      data: {
        name,
        slug: slug.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, ""),
        adminPin: String(adminPin),
        themeId: themeId || getNextThemeId(),
        ownerName: ownerName || null,
        ownerPhone: ownerPhone || null,
        phone: phone || null,
        whatsapp: whatsapp || null,
        email: email || null,
        address: address || null,
        country: country || "DZ",
        language: language || "ar",
        customCurrency: customCurrency || null,
        logoIcon: logoIcon || "Printer",
        primaryColor: primaryColor || null,
        plan: plan || "free",
        features: features && typeof features === "object" ? JSON.stringify(features) : null,
        trialDays: trialDays ? Number(trialDays) : null,
        trialStartsAt: trialDays ? new Date() : null,
      },
    });

    return NextResponse.json(shop, { status: 201 });
  } catch (e) {
    console.error('[shops/POST]', e);
    return NextResponse.json({ error: "حدث خطأ أثناء إنشاء المتجر" }, { status: 500 });
  }
}
