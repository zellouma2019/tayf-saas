import { NextRequest, NextResponse } from "next/server";
import { tursoQuery, tursoExecute, safeJson, toNum } from "@/lib/turso-lite";

export const dynamic = "force-dynamic";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "PUT, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { rating, review, shopId } = body;

    // Validate rating
    if (rating === undefined || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "التقييم يجب أن يكون بين 1 و 5" },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    // Build query with optional shopId filter
    const whereClause = shopId
      ? `WHERE id = ? AND "shopId" = ?`
      : `WHERE id = ?`;
    const args = shopId ? [id, shopId] : [id];

    const orders = await tursoQuery<Record<string, unknown>>(
      `SELECT id, reference, status, rating, review, "shopId" FROM "PrintOrder" ${whereClause} LIMIT 1`,
      args
    );

    const order = orders[0];
    if (!order) {
      return NextResponse.json(
        { error: "الطلب غير موجود" },
        { status: 404, headers: CORS_HEADERS }
      );
    }

    if (order.status !== "delivered") {
      return NextResponse.json(
        { error: "يمكن تقييم الطلبات المسلّمة فقط" },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    if (order.rating !== null && toNum(order.rating) > 0) {
      return NextResponse.json(
        { error: "تم تقييم هذا الطلب مسبقاً" },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    // Update the order with rating and review
    const updateResult = await tursoExecute<Record<string, unknown>>(
      `UPDATE "PrintOrder" SET rating = ?, review = ?, "updatedAt" = ? WHERE id = ? RETURNING *`,
      [rating, review || null, new Date().toISOString(), id]
    );

    const updated = updateResult.rows[0];
    if (!updated) {
      return NextResponse.json(
        { error: "فشل تحديث التقييم" },
        { status: 500, headers: CORS_HEADERS }
      );
    }

    // Create AuditLog entry
    const orderShopId = order.shopId as string | null;
    await tursoExecute(
      `INSERT INTO "AuditLog" (id, "shopId", "orderId", action, field, "oldValue", "newValue", details, "createdAt")
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        `audit_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        orderShopId,
        id,
        "rating_added",
        "rating",
        null,
        String(rating),
        `${order.reference} — تقييم ${rating} نجوم${review ? `: ${review}` : ""}`,
        new Date().toISOString(),
      ]
    );

    return NextResponse.json(
      {
        id: updated.id,
        reference: updated.reference,
        serviceType: updated.serviceType,
        serviceName: updated.serviceName,
        status: updated.status,
        total: toNum(updated.total),
        rating: toNum(updated.rating),
        review: updated.review,
        customer: safeJson(String(updated.customer || "{}"), {}),
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
      },
      { headers: CORS_HEADERS }
    );
  } catch (e) {
    console.error("[orders/[id]/rate/PUT]", e);
    return NextResponse.json(
      { error: "حدث خطأ أثناء تسجيل التقييم" },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
