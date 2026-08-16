import { NextRequest, NextResponse } from "next/server";
import { toNum } from "@/lib/turso-lite";
import { withRateLimit } from "@/lib/rate-limit";

/// جلب كل المتاجر عبر turso-lite (أسرع 10x من Prisma على Vercel)
export async function GET(req: NextRequest) {
  const rl = withRateLimit(req, "shops");
  if (!rl.ok) return rl.response;
  try {
    const { rows: shops, error: dbError } = await import("@/lib/turso-lite").then(m =>
      m.tursoQuerySafe(
        `SELECT
          s.id, s.slug, s.name, s.phone, s."ownerName", s."ownerPhone",
          s."isActive", s.country, s.language, s."themeId", s."createdAt",
          COALESCE(o.cnt, 0) as orderCount
        FROM "Shop" s
        LEFT JOIN (
          SELECT "shopId", COUNT(*) as cnt FROM "PrintOrder" GROUP BY "shopId"
        ) o ON o."shopId" = s.id
        ORDER BY s."createdAt" DESC`
      )
    );

    if (dbError) {
      console.error('[shops/GET] DB error:', dbError);
      return NextResponse.json({ shops: [], error: "DB_ERROR" });
    }

    return NextResponse.json({
      shops: shops.map((s: Record<string, unknown>) => ({
        id: String(s.id),
        slug: String(s.slug),
        name: String(s.name),
        phone: s.phone ? String(s.phone) : null,
        ownerName: s.ownerName ? String(s.ownerName) : null,
        ownerPhone: s.ownerPhone ? String(s.ownerPhone) : null,
        isActive: Boolean(s.isActive),
        country: String(s.country || "SA"),
        language: String(s.language || "ar"),
        themeId: toNum(s.themeId),
        createdAt: String(s.createdAt),
        _count: { orders: toNum(s.orderCount) },
      })),
    });
  } catch (e) {
    console.error('[shops/GET]', e);
    return NextResponse.json({ shops: [], error: "FETCH_ERROR" });
  }
}

/// إنشاء متجر جديد — يبقى باستخدام Prisma (عملية كتابة معقدة)
export async function POST(req: NextRequest) {
  const rl = withRateLimit(req, "shops");
  if (!rl.ok) return rl.response;
  try {
    const { db } = await import("@/lib/db");
    const { getNextThemeId } = await import("@/lib/themes");

    const body = await req.json();
    const {
      name, slug, adminPin, ownerName, ownerPhone,
      phone, whatsapp, email, address, trialDays,
      country, language, features, logoIcon,
      primaryColor, plan, customCurrency, themeId,
    } = body;

    if (!name || !slug || !adminPin) {
      return NextResponse.json({ error: "الاسم والمعرّف وكلمة المرور مطلوبة" }, { status: 400 });
    }

    // التحقق من عدم تكرار المعرّف
    const existing = await db.shop.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json({ error: "هذا المعرّف مستخدم بالفعل" }, { status: 409 });
    }

    // معالجة فترة التجربة: 0 أو null = بدون حدود
    const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
    const trialDaysNum = trialDays && Number(trialDays) > 0 ? Number(trialDays) : null;

    const shop = await db.shop.create({
      data: {
        name,
        slug: cleanSlug,
        adminPin: String(adminPin),
        themeId: themeId || getNextThemeId(),
        ownerName: ownerName || null,
        ownerPhone: ownerPhone || null,
        phone: phone || null,
        whatsapp: whatsapp || null,
        email: email || null,
        address: address || null,
        country: country || "SA", // الافتراضي: السعودية (السوق المستهدف)
        language: language || "ar",
        customCurrency: customCurrency || null,
        logoIcon: logoIcon || "Printer",
        primaryColor: primaryColor || null,
        plan: plan || "free",
        features: features && typeof features === "object" ? JSON.stringify(features) : null,
        trialDays: trialDaysNum,
        trialStartsAt: trialDaysNum ? new Date() : null,
      },
    });

    // إنشاء الإعدادات الافتراضية للمتجر الجديد (تهيئة "مجلد" المتجر)
    try {
      const { DEFAULT_SETTINGS } = await import("@/lib/default-settings");
      const shopId = shop.id;

      // إنشاء إعدادات الخدمات
      await db.setting.create({
        data: {
          key: "services",
          value: JSON.stringify(DEFAULT_SETTINGS.services),
          shopId,
        },
      });

      // إنشاء إعدادات التوصيل
      await db.setting.create({
        data: {
          key: "deliveryOptions",
          value: JSON.stringify(DEFAULT_SETTINGS.deliveryOptions),
          shopId,
        },
      });

      // إنشاء الإعدادات العامة مع بيانات المتجر
      const generalSettings = {
        ...DEFAULT_SETTINGS.general,
        shopName: name,
        phoneNumber: phone || DEFAULT_SETTINGS.general.phoneNumber,
        whatsappNumber: whatsapp || DEFAULT_SETTINGS.general.whatsappNumber,
        email: email || DEFAULT_SETTINGS.general.email,
        address: address || DEFAULT_SETTINGS.general.address,
        adminCode: String(adminPin),
      };
      await db.setting.create({
        data: {
          key: "general",
          value: JSON.stringify(generalSettings),
          shopId,
        },
      });

      // إنشاء إعدادات الشاشة الترحيبية
      await db.setting.create({
        data: {
          key: "intro",
          value: JSON.stringify({
            ...DEFAULT_SETTINGS.intro,
            title: name,
          }),
          shopId,
        },
      });

      console.log(`[shops/POST] Initialized settings for shop ${cleanSlug} (${shopId})`);
    } catch (settingsErr) {
      // لا نوقف الإنشاء إذا فشلت تهيئة الإعدادات
      console.error(`[shops/POST] Failed to initialize settings for ${cleanSlug}:`, settingsErr);
    }

    return NextResponse.json(shop, { status: 201 });
  } catch (e) {
    console.error('[shops/POST]', e);
    return NextResponse.json({ error: "حدث خطأ أثناء إنشاء المتجر" }, { status: 500 });
  }
}
