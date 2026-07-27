import { NextRequest, NextResponse } from "next/server";
import { tursoQuery, tursoExecute, toNum, safeJson } from "@/lib/turso-lite";

/// جلب السجلات عبر turso-lite (أسرع 10x من Prisma على Vercel)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const templateId = searchParams.get("templateId");
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const shopId = searchParams.get("shopId");

    // بناء شروط WHERE
    const whereParts: string[] = [];
    const args: unknown[] = [];

    if (shopId) {
      args.push(shopId);
      whereParts.push(`("shopId" = ? OR "shopId" IS NULL)`);
    }
    if (templateId) {
      args.push(templateId);
      whereParts.push(`"templateId" = ?`);
    }
    if (status && status !== "all") {
      args.push(status);
      whereParts.push(`status = ?`);
    }
    if (search) {
      args.push(`%${search}%`, `%${search}%`);
      whereParts.push(`(title LIKE ? OR data LIKE ?)`);
    }

    const whereClause = whereParts.length > 0 ? `WHERE ${whereParts.join(" AND ")}` : "";

    // استعلام السجلات مع بيانات القالب المرتبط
    const records = await tursoQuery(
      `SELECT r.*, t.title as "templateTitle", t.icon as "templateIcon"
       FROM "FormRecord" r
       LEFT JOIN "FormTemplate" t ON t.id = r."templateId"
       ${whereClause}
       ORDER BY r."createdAt" DESC`,
      args
    );

    return NextResponse.json({
      records: records.map((r) => ({
        ...r,
        data: safeJson(String(r.data || "{}"), {}),
        template: r.templateTitle ? {
          id: r.templateId,
          title: r.templateTitle,
          icon: r.templateIcon,
        } : null,
      })),
    });
  } catch (e) {
    console.error('[records/GET]', e);
    return NextResponse.json(
      { error: "حدث خطأ أثناء جلب السجلات" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const shopId = searchParams.get("shopId");
    const body = await req.json();
    const { templateId, title, status, priority, data } = body;

    // التحقق من وجود القالب
    const templateRows = await tursoQuery<{ id: string }>(
      `SELECT id FROM "FormTemplate" WHERE id = ? ${shopId ? `AND ("shopId" = ? OR "shopId" IS NULL)` : ""} LIMIT 1`,
      shopId ? [templateId, shopId] : [templateId]
    );
    if (templateRows.length === 0) {
      return NextResponse.json({ error: "القالب غير موجود" }, { status: 404 });
    }

    // توليد رقم مرجعي فريد
    const date = new Date();
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    let reference = `${y}${m}${d}-${Math.floor(1000 + Math.random() * 9000)}`;

    let existsRows = await tursoQuery<{ id: string }>(
      `SELECT id FROM "FormRecord" WHERE reference = ? LIMIT 1`,
      [reference]
    );
    while (existsRows.length > 0) {
      reference = `${y}${m}${d}-${Math.floor(1000 + Math.random() * 9000)}`;
      existsRows = await tursoQuery<{ id: string }>(
        `SELECT id FROM "FormRecord" WHERE reference = ? LIMIT 1`,
        [reference]
      );
    }

    const newId = `rec_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
    const now = new Date().toISOString();

    const result = await tursoExecute(
      `INSERT INTO "FormRecord" (id, reference, "templateId", title, status, priority, data, "createdAt", "updatedAt", "shopId")
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING *`,
      [newId, reference, templateId, title || "—", status || "draft", priority || "normal", JSON.stringify(data || {}), now, now, shopId || null]
    );

    const record = result.rows[0];
    if (!record) {
      return NextResponse.json({ error: "فشل إنشاء السجل" }, { status: 500 });
    }

    return NextResponse.json({
      ...record,
      data: safeJson(String(record.data || "{}"), {}),
    });
  } catch (e) {
    console.error('[records/POST]', e);
    return NextResponse.json(
      { error: "حدث خطأ أثناء إنشاء السجل" },
      { status: 500 },
    );
  }
}
