import { NextRequest, NextResponse } from "next/server";
import { tursoQuery, toNum, safeJson } from "@/lib/turso-lite";

/**
 * GET /api/c/order-lookup?phone=05XXXXXXXX&shopId=xxx
 * Returns all orders for a given phone number (customer order lookup).
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const phone = searchParams.get("phone");
    const shopId = searchParams.get("shopId");

    if (!phone) {
      return NextResponse.json({ error: "رقم الهاتف مطلوب" }, { status: 400 });
    }

    const whereParts: string[] = [];
    const args: unknown[] = [];

    args.push(`%${phone}%`);
    whereParts.push(`o.customer LIKE ?`);

    if (shopId) {
      args.push(shopId);
      whereParts.push(`o."shopId" = ?`);
    }

    const whereClause = `WHERE ${whereParts.join(" AND ")}`;

    const rows = await tursoQuery<Record<string, unknown>>(
      `SELECT
        id, reference, "serviceType", "serviceName",
        "fileName", "fileType", "fileSize",
        options, customer, delivery, pricing,
        "estimatedHours", status, pages, copies, total, cost,
        "createdAt", "updatedAt", "readyAt", "deliveredAt",
        tags, "shopId"
      FROM "PrintOrder" o
      ${whereClause}
      ORDER BY o."createdAt" DESC
      LIMIT 50`,
      args
    );

    const orders = rows.map((o) => ({
      id: o.id,
      reference: o.reference,
      serviceType: o.serviceType,
      serviceName: o.serviceName,
      fileName: (o.fileName as string) || null,
      fileType: (o.fileType as string) || null,
      fileSize: o.fileSize != null ? toNum(o.fileSize) : null,
      options: safeJson(o.options as string, { pages: 1, copies: 1, color: "", paperSize: "", sides: "", binding: "", paperType: "", printRange: "all" }),
      customer: safeJson(o.customer as string, { name: "", phone: "", deliveryMethod: "pickup" }),
      delivery: safeJson((o as Record<string, unknown>).delivery as string, { mode: "pickup", date: "" }),
      pricing: safeJson((o as Record<string, unknown>).pricing as string, { perPage: 0, pagesCost: 0, copiesCost: 0, sidesSaving: 0, deliveryCost: 0, discount: 0, total: 0 }),
      estimatedHours: toNum(o.estimatedHours),
      status: o.status,
      pages: toNum(o.pages),
      copies: toNum(o.copies),
      total: toNum(o.total),
      cost: toNum(o.cost),
      createdAt: o.createdAt,
      updatedAt: o.updatedAt,
      readyAt: o.readyAt,
      deliveredAt: o.deliveredAt,
      tags: safeJson<string[]>(o.tags as string, []),
      shopId: o.shopId,
    }));

    return NextResponse.json({ orders });
  } catch (e) {
    console.error('[c/order-lookup/GET]', e);
    return NextResponse.json({ error: "حدث خطأ أثناء البحث" }, { status: 500 });
  }
}
