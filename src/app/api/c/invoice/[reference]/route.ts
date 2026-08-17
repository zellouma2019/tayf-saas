import { NextRequest, NextResponse } from "next/server";
import { tursoQuery, toNum, safeJson } from "@/lib/turso-lite";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ reference: string }> }
) {
  try {
    const { reference } = await params;

    const rows = await tursoQuery<Record<string, unknown>>(
      `SELECT
        id, reference, "serviceType", "serviceName",
        "fileName", "fileType", "fileSize",
        options, customer, delivery, pricing,
        "estimatedHours", status, pages, copies, total, cost,
        "createdAt", "updatedAt", "readyAt", "deliveredAt",
        "startedPrintingAt", "completedPrintingAt",
        tags, "adminNotes", "shopId"
      FROM "PrintOrder" WHERE reference = ?`,
      [reference]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: "الطلب غير موجود" }, { status: 404 });
    }

    const o = rows[0];
    const order = {
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
      startedPrintingAt: o.startedPrintingAt,
      completedPrintingAt: o.completedPrintingAt,
      tags: safeJson<string[]>(o.tags as string, []),
      adminNotes: o.adminNotes,
      shopId: o.shopId,
    };

    return NextResponse.json({ order });
  } catch (e) {
    console.error('[c/invoice/GET]', e);
    return NextResponse.json({ error: "حدث خطأ أثناء جلب الفاتورة" }, { status: 500 });
  }
}
