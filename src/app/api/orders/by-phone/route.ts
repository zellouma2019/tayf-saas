import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { runAutoCleanup } from "@/lib/cleanup";
import { orderListWhere } from "@/lib/order-lookup";

/// جلب جميع الطلبات المرتبطة برقم هاتف معين (لتكرار الطلب)
export async function GET(req: NextRequest) {
  try {
    await runAutoCleanup();

    const { searchParams } = new URL(req.url);
    const phone = (searchParams.get("phone") || "").trim();
    const shopId = searchParams.get("shopId");

    if (!phone || phone.length < 8) {
      return NextResponse.json({ orders: [], message: "رقم الهاتف قصير جداً" });
    }

    // تطبيع الرقم: إزالة المسافات والشرطات
    const normalized = phone.replace(/[\s\-+]/g, "");

    const where = orderListWhere(shopId, {
      customer: { contains: normalized.substring(0, 8) },
    });

    const orders = await db.printOrder.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({
      orders: orders.map((o) => {
        const { fileData, smartAnalysis, ...rest } = o;
        return {
          ...rest,
          options: JSON.parse(o.options),
          customer: JSON.parse(o.customer),
          delivery: JSON.parse(o.delivery),
          pricing: JSON.parse(o.pricing),
        };
      }),
      count: orders.length,
    });
  } catch (e) {
    console.error('[orders/by-phone]', e);
    return NextResponse.json({ error: "حدث خطأ أثناء البحث" }, { status: 500 });
  }
}