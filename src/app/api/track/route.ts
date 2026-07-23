import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { runAutoCleanup } from "@/lib/cleanup";
import { orderListWhere } from "@/lib/order-lookup";

/// تتبّع الطلب برقم المرجع أو رقم الهاتف
export async function GET(req: NextRequest) {
  try {
    await runAutoCleanup();

    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") || "").trim();
    const shopId = searchParams.get("shopId");

    if (!q) {
      return NextResponse.json({ orders: [] });
    }

    const baseWhere: Record<string, unknown> = {
      OR: [
        { reference: { contains: q } },
        { customer: { contains: q } },
      ],
    };
    const where = orderListWhere(shopId, baseWhere);

    const orders = await db.printOrder.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({
      orders: orders.map((o) => ({
        ...o,
        options: JSON.parse(o.options),
        customer: JSON.parse(o.customer),
        delivery: JSON.parse(o.delivery),
        pricing: JSON.parse(o.pricing),
        smartAnalysis: o.smartAnalysis ? JSON.parse(o.smartAnalysis) : null,
      })),
    });
  } catch (e) {
    console.error('[track]', e);
    return NextResponse.json({ error: "حدث خطأ أثناء البحث" }, { status: 500 });
  }
}