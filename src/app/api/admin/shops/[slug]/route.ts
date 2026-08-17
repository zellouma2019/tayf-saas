import { NextRequest, NextResponse } from "next/server";
import { tursoQuery, tursoExecute, tursoQuerySafe, safeJson, toNum } from "@/lib/turso-lite";
import { withRateLimit } from "@/lib/rate-limit";

const SHOP_SELECT_COLUMNS = `
  id, slug, name, phone, whatsapp, email, address,
  "logoUrl", "logoIcon", "primaryColor", "themeId",
  settings, "ownerName", "ownerPhone", "isActive",
  plan, features, "createdAt", "updatedAt",
  "trialDays", "trialStartsAt", country, language, "customCurrency"
`;

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

/// تحديث متجر من طرف المالك — عبر turso-lite (متسق مع باقي APIs)
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const rl = withRateLimit(req, "admin-shop");
  if (!rl.ok) return rl.response;

  try {
    const { slug } = await params;
    const body = await req.json();

    // التحقق من وجود المتجر
    const existing = await tursoQuery(`SELECT id, "trialStartsAt" FROM "Shop" WHERE slug = ? LIMIT 1`, [slug]);
    if (!existing.length) {
      return NextResponse.json({ error: "المتجر غير موجود" }, { status: 404 });
    }

    // الحقول المسموح بتعديلها
    const allowed = [
      "name", "phone", "whatsapp", "email", "address",
      "ownerName", "ownerPhone", "adminPin", "primaryColor",
      "isActive", "trialDays", "trialStartsAt",
      "plan", "features", "paymentInfo", "ownerNotes",
      "logoUrl", "logoIcon", "themeId", "language", "customCurrency",
    ];

    const setClauses: string[] = [];
    const args: unknown[] = [];

    for (const key of allowed) {
      if (body[key] !== undefined) {
        if (key === "trialDays" && body[key] === "") {
          setClauses.push(`"${key}" = NULL`);
        } else if (key === "trialStartsAt" && (body[key] === "" || body[key] === null)) {
          setClauses.push(`"${key}" = NULL`);
        } else if (key === "trialDays") {
          setClauses.push(`"${key}" = ?`);
          args.push(Number(body[key]) || null);
        } else if (key === "features" && typeof body[key] === "object") {
          setClauses.push(`"${key}" = ?`);
          args.push(JSON.stringify(body[key]));
        } else if (key === "paymentInfo" || key === "ownerNotes") {
          setClauses.push(`"${key}" = ?`);
          args.push(body[key] || null);
        } else if (key === "isActive" && typeof body[key] === "boolean") {
          setClauses.push(`"${key}" = ?`);
          args.push(body[key] ? 1 : 0);
        } else if (key === "themeId" || key === "trialDays") {
          setClauses.push(`"${key}" = ?`);
          args.push(Number(body[key]) || null);
        } else {
          setClauses.push(`"${key}" = ?`);
          args.push(body[key]);
        }
      }
    }

    if (setClauses.length === 0) {
      // لا توجد حقول للتحديث — أرجع البيانات الحالية
      const currentRows = await tursoQuery(`SELECT ${SHOP_SELECT_COLUMNS} FROM "Shop" WHERE slug = ? LIMIT 1`, [slug]);
      if (!currentRows.length) {
        return NextResponse.json({ error: "المتجر غير موجود" }, { status: 404 });
      }
      return NextResponse.json({ shop: currentRows[0] });
    }

    // إذا تم تعيين مدة تجربة ولم يحدد تاريخ بداية، ابدأ من الآن
    if (body.trialDays && !body.trialStartsAt && !existing[0].trialStartsAt) {
      setClauses.push(`"trialStartsAt" = ?`);
      args.push(new Date().toISOString());
    }

    setClauses.push(`"updatedAt" = ?`);
    args.push(new Date().toISOString());
    args.push(slug); // WHERE clause

    const result = await tursoExecute<{ id: string }>(
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
