import { NextRequest, NextResponse } from "next/server";
import { tursoQuery, tursoExecute, toNum, safeJson } from "@/lib/turso-lite";
import { TEMPLATE_DEFINITIONS } from "@/lib/form-templates";

/// جلب القوالب عبر turso-lite (أسرع 10x من Prisma على Vercel)
export async function GET(req: NextRequest) {
  try {
    const shopId = req.nextUrl.searchParams.get("shopId");
    const shopFilter = shopId ? `("shopId" = ? OR "shopId" IS NULL)` : `("shopId" IS NULL)`;
    const args: unknown[] = shopId ? [shopId] : [];

    // زرع القوالب الافتراضية إن لم تكن موجودة
    const countRows = await tursoQuery<{ cnt: unknown }>(
      `SELECT COUNT(*) as cnt FROM "FormTemplate" WHERE ${shopFilter}`,
      args
    );
    const existingCount = toNum(countRows[0]?.cnt);

    if (existingCount === 0) {
      const now = new Date().toISOString();
      for (const t of TEMPLATE_DEFINITIONS) {
        const newId = `tpl_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
        await tursoExecute(
          `INSERT INTO "FormTemplate" (id, title, icon, category, fields, "isActive", "createdAt", "updatedAt", "shopId")
           VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?)`,
          [newId, t.name, t.icon, t.category, JSON.stringify(t.schema), now, now, shopId || null]
        );
      }
    }

    const templates = await tursoQuery(
      `SELECT * FROM "FormTemplate" WHERE ${shopFilter} ORDER BY "createdAt" ASC`,
      args
    );

    return NextResponse.json({
      templates: templates.map((t) => ({
        ...t,
        code: t.title,
        name: t.title,
        schema: safeJson(String(t.fields || "{}"), { sections: [] }),
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

/// إنشاء قالب عبر turso-lite
export async function POST(req: NextRequest) {
  try {
    const shopId = req.nextUrl.searchParams.get("shopId");
    const body = await req.json();

    const newId = `tpl_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
    const now = new Date().toISOString();

    const result = await tursoExecute(
      `INSERT INTO "FormTemplate" (id, title, icon, category, fields, "isActive", "createdAt", "updatedAt", "shopId")
       VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?) RETURNING *`,
      [newId, body.name || body.title || "", body.icon || "file-text", body.category || "عام", JSON.stringify(body.schema || { sections: [] }), now, now, shopId || null]
    );

    const template = result.rows[0];
    if (!template) {
      return NextResponse.json({ error: "فشل إنشاء القالب" }, { status: 500 });
    }

    return NextResponse.json({
      ...template,
      code: template.title,
      name: template.title,
      schema: safeJson(String(template.fields || "{}"), { sections: [] }),
    });
  } catch (e) {
    console.error('[templates/POST]', e);
    return NextResponse.json(
      { error: "حدث خطأ أثناء إنشاء القالب" },
      { status: 500 },
    );
  }
}
