import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { TEMPLATE_DEFINITIONS } from "@/lib/form-templates";

/// زرع قوالب النماذج في قاعدة البيانات إن لم تكن موجودة
export async function GET(req: NextRequest) {
  try {
    const shopId = req.nextUrl.searchParams.get("shopId");
    const where = shopId ? { shopId } : { shopId: null as string | null };
    const existing = await db.formTemplate.count({ where });
    if (existing === 0) {
      await db.formTemplate.createMany({
        data: TEMPLATE_DEFINITIONS.map((t) => ({
          title: t.name,
          icon: t.icon,
          category: t.category,
          fields: JSON.stringify(t.schema),
          isActive: true,
          ...(shopId ? { shopId } : {}),
        })),
      });
    }
    const templates = await db.formTemplate.findMany({
      where,
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json({
      templates: templates.map((t) => ({
        ...t,
        code: t.title,
        name: t.title,
        schema: JSON.parse(t.fields),
      })),
    });
  } catch (e) {
    console.error('[templates/GET]', e);
    return NextResponse.json(
      { error: "حدث خطأ أثناء جلب القوالب" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const shopId = req.nextUrl.searchParams.get("shopId");
    const body = await req.json();
    const template = await db.formTemplate.create({
      data: {
        title: body.name || body.title || "",
        icon: body.icon || "file-text",
        category: body.category || "عام",
        fields: JSON.stringify(body.schema || { sections: [] }),
        isActive: true,
        ...(shopId ? { shopId } : {}),
      },
    });
    return NextResponse.json({
      ...template,
      code: template.title,
      name: template.title,
      schema: JSON.parse(template.fields),
    });
  } catch (e) {
    console.error('[templates/POST]', e);
    return NextResponse.json(
      { error: "حدث خطأ أثناء إنشاء القالب" },
      { status: 500 },
    );
  }
}