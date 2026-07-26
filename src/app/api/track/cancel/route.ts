import { NextRequest, NextResponse } from "next/server";
import { tursoQuery, tursoExecute } from "@/lib/turso-lite";

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { reference } = body;
    if (!reference) {
      return NextResponse.json({ error: "رقم الطلب مطلوب" }, { status: 400 });
    }

    // ابحث عن الطلب بسرعة عبر turso-lite
    const rows = await tursoQuery<{ id: string; status: string }>(
      `SELECT id, status FROM "PrintOrder" WHERE reference = ? LIMIT 1`,
      [reference]
    );

    const order = rows[0];
    if (!order) {
      return NextResponse.json({ error: "الطلب غير موجود" }, { status: 404 });
    }
    if (order.status !== "pending") {
      return NextResponse.json({ error: "لا يمكن إلغاء طلب ليس في حالة الانتظار" }, { status: 400 });
    }

    // حدّث الحالة عبر turso-lite
    await tursoExecute(
      `UPDATE "PrintOrder" SET status = 'cancelled', "updatedAt" = ? WHERE id = ?`,
      [new Date().toISOString(), order.id]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Cancel order error:", error);
    return NextResponse.json({ error: "خطأ في إلغاء الطلب" }, { status: 500 });
  }
}
