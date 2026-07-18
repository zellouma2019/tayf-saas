import { NextRequest, NextResponse } from "next/server";
import { db, ensureDb } from "@/lib/db";

export async function PUT(req: NextRequest) {
  try {
    await ensureDb();
    const body = await req.json();
    const { reference } = body;
    if (!reference) {
      return NextResponse.json({ error: "رقم الطلب مطلوب" }, { status: 400 });
    }
    const order = await db.printOrder.findFirst({ where: { reference } });
    if (!order) {
      return NextResponse.json({ error: "الطلب غير موجود" }, { status: 404 });
    }
    if (order.status !== "pending") {
      return NextResponse.json({ error: "لا يمكن إلغاء طلب ليس في حالة الانتظار" }, { status: 400 });
    }
    await db.printOrder.update({ where: { id: order.id }, data: { status: "cancelled" } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Cancel order error:", error);
    return NextResponse.json({ error: "خطأ في إلغاء الطلب" }, { status: 500 });
  }
}