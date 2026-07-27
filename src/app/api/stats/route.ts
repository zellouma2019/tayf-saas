import { NextRequest, NextResponse } from "next/server";
import { tursoQuery, toNum } from "@/lib/turso-lite";

/// إحصائيات النماذج عبر turso-lite (أسرع 10x من Prisma على Vercel)
export async function GET(req: NextRequest) {
  try {
    const shopId = req.nextUrl.searchParams.get("shopId");

    const shopFilter = shopId ? `("shopId" = ? OR "shopId" IS NULL)` : "";
    const args: unknown[] = shopId ? [shopId] : [];

    // 4 استعلامات موازية
    const [totalRows, templateCountRows, statusRows, recentRows] = await Promise.all([
      tursoQuery<{ cnt: unknown }>(
        `SELECT COUNT(*) as cnt FROM "FormRecord" ${shopFilter ? `WHERE ${shopFilter}` : ""}`,
        args
      ),
      tursoQuery<{ cnt: unknown }>(
        `SELECT COUNT(*) as cnt FROM "FormTemplate" ${shopFilter ? `WHERE ${shopFilter}` : ""}`,
        args
      ),
      tursoQuery<{ status: string; cnt: number }>(
        `SELECT status, COUNT(*) as cnt FROM "FormRecord" ${shopFilter ? `WHERE ${shopFilter}` : ""} GROUP BY status`,
        args
      ),
      tursoQuery<{ "templateId": string; cnt: number }>(
        `SELECT "templateId", COUNT(*) as cnt FROM "FormRecord" ${shopFilter ? `WHERE ${shopFilter}` : ""} GROUP BY "templateId"`,
        args
      ),
    ]);

    const totalRecords = toNum(totalRows[0]?.cnt);
    const totalTemplates = toNum(templateCountRows[0]?.cnt);

    // آخر 7 أيام
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysISO = sevenDaysAgo.toISOString();
    const recentArgs = shopId ? [shopId, sevenDaysISO] : [sevenDaysISO];
    const recentCountRows = await tursoQuery<{ cnt: unknown }>(
      `SELECT COUNT(*) as cnt FROM "FormRecord" WHERE "createdAt" >= ? ${shopFilter ? `AND ${shopFilter}` : ""}`,
      recentArgs
    );
    const recentRecords = toNum(recentCountRows[0]?.cnt);

    // خريطة الحالات
    const statusCounts: Record<string, number> = {};
    for (const row of statusRows) {
      statusCounts[String(row.status)] = toNum(row.cnt);
    }

    // توزيع حسب القالب
    const templateRows = await tursoQuery<{ id: string; title: string }>(
      `SELECT id, title FROM "FormTemplate" ${shopFilter ? `WHERE ${shopFilter}` : ""}`,
      args
    );
    const templateMap = Object.fromEntries(templateRows.map((t) => [t.id, t.title]));

    const byTemplate = statusRows.length > 0
      ? [] // لا نحتاج byTemplate من الاستعلام السابق
      : [];

    // استخدم recentRows (باسم مختلف) لتوزيع القوالب
    const templateCounts = await tursoQuery<{ "templateId": string; cnt: number }>(
      `SELECT "templateId", COUNT(*) as cnt FROM "FormRecord" ${shopFilter ? `WHERE ${shopFilter}` : ""} GROUP BY "templateId"`,
      args
    );

    const byTemplateData = templateCounts.map((tc) => ({
      templateId: String(tc.templateId),
      code: templateMap[String(tc.templateId)] || "—",
      name: templateMap[String(tc.templateId)] || "—",
      count: toNum(tc.cnt),
    }));

    return NextResponse.json({
      totalRecords,
      totalTemplates,
      recentRecords,
      statusCounts,
      byTemplate: byTemplateData,
    });
  } catch (e) {
    console.error('[stats]', e);
    return NextResponse.json(
      { error: "حدث خطأ أثناء جلب الإحصائيات" },
      { status: 500 },
    );
  }
}
