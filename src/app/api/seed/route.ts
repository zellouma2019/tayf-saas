import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { TEMPLATE_DEFINITIONS } from "@/lib/form-templates";

/// إعادة زرع القوالب (في حال الحاجة) — محمي بكلمة سر المدير العام
export async function POST(req: NextRequest) {
  try {
    // تحقق من صلاحية المدير العام
    const authHeader = req.headers.get("authorization");
    const admin = await db.superAdmin.findFirst();
    if (!admin) return NextResponse.json({ error: "المدير العام غير موجود" }, { status: 500 });

    const expectedAuth = `Bearer ${admin.password}`;
    if (authHeader !== expectedAuth) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const shopId = req.nextUrl.searchParams.get("shopId");
    const deleteWhere = shopId ? { shopId } : { shopId: null as string | null };
    // حذف القوالب السابقة
    await db.formTemplate.deleteMany({ where: deleteWhere });
    await db.formTemplate.createMany({
      data: TEMPLATE_DEFINITIONS.map((t) => ({
        title: t.name,
        fields: JSON.stringify(t.schema),
        category: t.category,
        icon: t.icon,
        isActive: true,
        sortOrder: 0,
        ...(shopId ? { shopId } : {}),
      })),
    });
    const findWhere = shopId ? { shopId } : { shopId: null as string | null };
    const templates = await db.formTemplate.findMany({ where: findWhere });
    return NextResponse.json({
      success: true,
      count: templates.length,
      templates: templates.map((t) => ({ ...t, fields: JSON.parse(t.fields) })),
    });
  } catch (e) {
    console.error('[seed]', e);
    return NextResponse.json(
      { error: "حدث خطأ أثناء زرع القوالب" },
      { status: 500 },
    );
  }
}