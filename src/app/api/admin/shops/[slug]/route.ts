import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tursoQuery, tursoExecute, safeJson, toNum } from "@/lib/turso-lite";
import { withRateLimit } from "@/lib/rate-limit";

/// جلب تفاصيل متجر مع كلمة المرور (للمدير العام فقط)
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const rl = withRateLimit(_req, "admin-shop-get");
  if (!rl.ok) return rl.response;

  try {
    const { slug } = await params;
    const rows = await tursoQuery(
      `SELECT s.*, COALESCE(o.cnt, 0) as orderCount
       FROM "Shop" s
       LEFT JOIN (SELECT "shopId", COUNT(*) as cnt FROM "PrintOrder" GROUP BY "shopId") o ON o."shopId" = s.id
       WHERE s.slug = ?`,
      [slug]
    );
    if (!rows.length) {
      return NextResponse.json({ error: "المتجر غير موجود" }, { status: 404 });
    }
    const s = rows[0];
    const shop = {
      id: String(s.id),
      slug: String(s.slug),
      name: String(s.name),
      adminPin: String(s.adminPin),
      phone: s.phone ? String(s.phone) : null,
      whatsapp: s.whatsapp ? String(s.whatsapp) : null,
      email: s.email ? String(s.email) : null,
      address: s.address ? String(s.address) : null,
      logoUrl: s.logoUrl ? String(s.logoUrl) : null,
      logoIcon: String(s.logoIcon || "Printer"),
      primaryColor: s.primaryColor ? String(s.primaryColor) : null,
      themeId: toNum(s.themeId) || 1,
      country: String(s.country || "DZ"),
      language: String(s.language || "ar"),
      customCurrency: s.customCurrency ? String(s.customCurrency) : null,
      settings: s.settings ? safeJson(s.settings as string, null) : null,
      ownerName: s.ownerName ? String(s.ownerName) : null,
      ownerPhone: s.ownerPhone ? String(s.ownerPhone) : null,
      isActive: Boolean(s.isActive),
      plan: String(s.plan || "free"),
      features: safeJson(s.features as string, {}),
      trialDays: s.trialDays ? toNum(s.trialDays) : null,
      trialStartsAt: s.trialStartsAt ? String(s.trialStartsAt) : null,
      ownerNotes: s.ownerNotes ? String(s.ownerNotes) : null,
      paymentInfo: s.paymentInfo ? String(s.paymentInfo) : null,
      createdAt: String(s.createdAt),
      updatedAt: String(s.updatedAt),
      _count: { orders: toNum(s.orderCount) },
    };
    return NextResponse.json({ shop });
  } catch (e) {
    console.error("[admin/shops/slug/GET]", e);
    return NextResponse.json({ error: "خطأ في جلب بيانات المتجر" }, { status: 500 });
  }
}

/// تحديث متجر من طرف المالك (بدون كلمة مرور)
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const rl = withRateLimit(req, "admin-shop");
  if (!rl.ok) return rl.response;

  try {
    const { ensureDb } = await import("@/lib/db");
    await ensureDb();
    const { slug } = await params;
    const body = await req.json();

    const shop = await db.shop.findUnique({ where: { slug } });
    if (!shop) {
      return NextResponse.json({ error: "المتجر غير موجود" }, { status: 404 });
    }

    // الحقول المسموح بتعديلها
    const allowed = [
      "name", "phone", "whatsapp", "email", "address",
      "ownerName", "ownerPhone", "adminPin", "primaryColor",
      "isActive", "trialDays", "trialStartsAt",
      "plan", "features", "paymentInfo", "ownerNotes",
      "logoUrl", "logoIcon", "themeId", "language", "customCurrency",
    ] as const;

    const updateData: Record<string, unknown> = {};
    for (const key of allowed) {
      if (body[key] !== undefined) {
        if (key === "trialDays" && body[key] === "") {
          updateData[key] = null;
        } else if (key === "trialStartsAt" && (body[key] === "" || body[key] === null)) {
          updateData[key] = null;
        } else if (key === "trialDays") {
          updateData[key] = Number(body[key]) || null;
        } else if (key === "features" && typeof body[key] === "object") {
          updateData[key] = JSON.stringify(body[key]);
        } else if (key === "paymentInfo" || key === "ownerNotes") {
          updateData[key] = body[key] || null;
        } else {
          updateData[key] = body[key];
        }
      }
    }

    // إذا تم تعيين مدة تجربة ولم يحدد تاريخ بداية، ابدأ من الآن
    if (updateData.trialDays && !updateData.trialStartsAt && !shop.trialStartsAt) {
      updateData.trialStartsAt = new Date();
    }

    const updated = await db.shop.update({
      where: { slug },
      data: updateData,
    });

    const { adminPin: _, ...safeShop } = updated;
    return NextResponse.json({ shop: safeShop });
  } catch (e) {
    console.error("[admin/shops/slug/PUT]", e);
    return NextResponse.json({ error: "خطأ في تحديث المتجر" }, { status: 500 });
  }
}

/// حذف متجر من طرف المالك
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const rl = withRateLimit(req, "admin-shop-delete");
  if (!rl.ok) return rl.response;

  try {
    const { slug } = await params;
    // Use tursoExecute for direct SQL (more reliable on Vercel)
    // First get shop ID
    const rows = await tursoQuery(`SELECT id FROM "Shop" WHERE slug = ?`, [slug]);
    if (!rows.length) {
      return NextResponse.json({ error: "المتجر غير موجود" }, { status: 404 });
    }
    const shopId = String(rows[0].id);

    await tursoExecute(`DELETE FROM "PrintOrder" WHERE "shopId" = ?`, [shopId]);
    await tursoExecute(`DELETE FROM "Setting" WHERE "shopId" = ?`, [shopId]);
    await tursoExecute(`DELETE FROM "Shop" WHERE id = ?`, [shopId]);

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("[admin/shops/slug/DELETE]", e);
    return NextResponse.json({ error: "خطأ في حذف المتجر" }, { status: 500 });
  }
}
