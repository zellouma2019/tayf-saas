import { NextRequest, NextResponse } from "next/server";
import { tursoQuery, toNum, safeJson } from "@/lib/turso-lite";

export const maxDuration = 30;
export const dynamic = "force-dynamic";

/// تتبّع الطلب برقم المرجع أو رقم الهاتف (turso-lite — أسرع 10x من Prisma على Vercel)
/// يستخدم قائمة أعمدة محددة (بدون fileData/smartAnalysis) لتسريع الاستجابة
const TRACK_SQL = `
  SELECT
    o.id, o.reference, o."serviceType", o."serviceName",
    o."fileName", o."fileType", o."fileSize",
    o.options, o.customer, o.delivery, o.pricing,
    o."estimatedHours", o.status, o.pages, o.copies, o.total, o.cost,
    o.tags, o."adminNotes", o."shopId",
    o."createdAt", o."updatedAt",
    o."readyAt", o."deliveredAt",
    o."startedPrintingAt", o."completedPrintingAt"
  FROM "PrintOrder" o
`;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") || "").trim();
    const shopId = searchParams.get("shopId");

    if (!q) {
      return NextResponse.json({ orders: [] });
    }

    // بناء WHERE مباشرة بـ SQL
    const whereParts: string[] = [];
    const args: unknown[] = [`%${q}%`, `%${q}%`];
    whereParts.push(`(o.reference LIKE ? OR o.customer LIKE ?)`);

    if (shopId) {
      args.push(shopId);
      whereParts.push(`(o."shopId" = ? OR o."shopId" IS NULL)`);
    }
    const whereClause = `WHERE ${whereParts.join(" AND ")}`;

    const rows = await tursoQuery<Record<string, unknown>>(
      `${TRACK_SQL} ${whereClause} ORDER BY o."createdAt" DESC LIMIT 50`,
      args
    );

    return NextResponse.json({
      orders: rows.map((o) => ({
        id: o.id,
        reference: o.reference,
        serviceType: o.serviceType,
        serviceName: o.serviceName,
        fileName: o.fileName,
        fileType: o.fileType,
        fileSize: o.fileSize != null ? toNum(o.fileSize) : null,
        options: safeJson(o.options as string, {}),
        customer: safeJson(o.customer as string, { name: "", phone: "" }),
        delivery: safeJson(o.delivery as string, { mode: "pickup", date: "" }),
        pricing: safeJson(o.pricing as string, { total: 0 }),
        estimatedHours: toNum(o.estimatedHours),
        status: o.status,
        pages: toNum(o.pages),
        copies: toNum(o.copies),
        total: toNum(o.total),
        cost: toNum(o.cost),
        tags: safeJson<string[]>(o.tags as string, []),
        adminNotes: o.adminNotes,
        shopId: o.shopId,
        createdAt: o.createdAt,
        updatedAt: o.updatedAt,
        readyAt: o.readyAt,
        deliveredAt: o.deliveredAt,
        startedPrintingAt: o.startedPrintingAt,
        completedPrintingAt: o.completedPrintingAt,
        smartAnalysis: null,
      })),
    });
  } catch (e) {
    console.error('[track]', e);
    return NextResponse.json({ error: "حدث خطأ أثناء البحث" }, { status: 500 });
  }
}

