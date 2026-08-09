import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { orderListWhere } from "@/lib/order-lookup";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const shopId = req.nextUrl.searchParams.get("shopId");
    const where = orderListWhere(shopId, { orderId: id });
    const logs = await db.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return NextResponse.json({ logs });
  } catch (e) {
    console.error('[orders/[id]/audit]', e);
    return NextResponse.json(
      { error: "حدث خطأ أثناء جلب سجل التغييرات" },
      { status: 500 },
    );
  }
}