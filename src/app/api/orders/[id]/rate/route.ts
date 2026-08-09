import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

/// تقييم طلب تم تسليمه
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const body = await req.json();
    const { rating, review } = body;

    // تحقق من صحة التقييم
    if (
      typeof rating !== "number" ||
      !Number.isInteger(rating) ||
      rating < 1 ||
      rating > 5
    ) {
      return NextResponse.json(
        { error: "التقييم يجب أن يكون رقماً صحيحاً بين 1 و 5" },
        { status: 400 }
      );
    }

    // تحقق من أن الطلب موجود ومُسلَّم
    const order = await db.printOrder.findUnique({ where: { id } });

    if (!order) {
      return NextResponse.json(
        { error: "الطلب غير موجود" },
        { status: 404 }
      );
    }

    if (order.status !== "delivered") {
      return NextResponse.json(
        { error: "لا يمكن تقييم طلب لم يتم تسليمه بعد" },
        { status: 400 }
      );
    }

    if (order.rating !== null) {
      return NextResponse.json(
        { error: "تم تقييم هذا الطلب مسبقاً" },
        { status: 400 }
      );
    }

    // تحديث التقييم
    const updated = await db.printOrder.update({
      where: { id },
      data: {
        rating,
        review: review?.trim() || null,
        ratedAt: new Date(),
      },
    });

    // تسجيل في سجل التغييرات
    await db.auditLog.create({
      data: {
        orderId: id,
        action: "rating_added",
        field: "rating",
        newValue: String(rating),
        details: review?.trim()
          ? `تقييم: ${rating} نجوم — ${review.trim()}`
          : `تقييم: ${rating} نجوم`,
      },
    });

    return NextResponse.json({
      reference: updated.reference,
      rating: updated.rating,
      review: updated.review,
      ratedAt: updated.ratedAt,
    });
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message },
      { status: 500 }
    );
  }
}