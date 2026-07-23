import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const shopId = req.nextUrl.searchParams.get("shopId");
    const baseWhere: Record<string, unknown> = {};
    if (shopId) baseWhere.shopId = shopId;

    const totalRecords = await db.formRecord.count({ where: baseWhere });
    const totalTemplates = await db.formTemplate.count({ where: baseWhere });

    const statusCounts = await db.formRecord.groupBy({
      by: ["status"],
      _count: true,
      where: baseWhere,
    });

    const templateCounts = await db.formRecord.groupBy({
      by: ["templateId"],
      _count: true,
      where: baseWhere,
    });

    const templates = await db.formTemplate.findMany({ where: baseWhere });
    const templateMap = Object.fromEntries(templates.map((t) => [t.id, t]));

    const byTemplate = templateCounts.map((tc) => ({
      templateId: tc.templateId,
      code: templateMap[tc.templateId]?.title || "—",
      name: templateMap[tc.templateId]?.title || "—",
      count: tc._count,
    }));

    // آخر 7 أيام
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentWhere: Record<string, unknown> = { ...baseWhere, createdAt: { gte: sevenDaysAgo } };
    const recentRecords = await db.formRecord.count({ where: recentWhere });

    const statusMap: Record<string, number> = {};
    statusCounts.forEach((s) => {
      statusMap[s.status] = s._count;
    });

    return NextResponse.json({
      totalRecords,
      totalTemplates,
      recentRecords,
      statusCounts: statusMap,
      byTemplate,
    });
  } catch (e) {
    console.error('[stats]', e);
    return NextResponse.json(
      { error: "حدث خطأ أثناء جلب الإحصائيات" },
      { status: 500 },
    );
  }
}