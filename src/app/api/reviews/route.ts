import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * آراء العملاء الحقيقية — عام (لا يتطلب مصادقة إدارية)
 * يعرض فقط: التقييم، التعليق، الخدمة، التاريخ
 * لا يعرض: اسم العميل، رقم الهاتف، أو أي بيانات حساسة
 */
export async function GET() {
  try {
    const orders = await db.printOrder.findMany({
      where: {
        status: "delivered",
        rating: { not: null },
        review: { not: null },
      },
      select: {
        rating: true,
        review: true,
        serviceName: true,
        serviceType: true,
        createdAt: true,
        shopId: true,
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    const reviews = orders.map((o) => ({
      rating: o.rating!,
      review: o.review!,
      serviceName: o.serviceName,
      serviceType: o.serviceType,
      ratedAt: o.createdAt.toISOString(),
    }));

    return NextResponse.json({ reviews });
  } catch (e) {
    return NextResponse.json(
      { reviews: [], error: (e as Error).message },
      { status: 500 }
    );
  }
}
