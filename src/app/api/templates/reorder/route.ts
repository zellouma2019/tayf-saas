import { NextRequest, NextResponse } from "next/server";
import { db, ensureDb } from "@/lib/db";

/**
 * PUT /api/templates/reorder
 * إعادة ترتيب القوالب — يرسل مصفوفة معرّفات بالترتيب الجديد
 */
export async function PUT(req: NextRequest) {
  try {
    await ensureDb();
    const shopId = req.nextUrl.searchParams.get("shopId");
    const { ids } = await req.json();

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: "يجب إرسال مصفوفة معرّفات" },
        { status: 400 },
      );
    }

    // تحديث ترتيب كل قالب عبر تبديل الـ createdAt
    // (بما أن Prisma SQLite لا يدعم orderBy مخصص، نستخدم حيلة التاريخ)
    const updates = ids.map((id: string, index: number) => {
      // نستخدم تاريخ مستقبلي مع فاصل صغير لضمان الترتيب
      const baseDate = new Date("2025-01-01T00:00:00.000Z");
      baseDate.setMinutes(baseDate.getMinutes() + index);

      // Verify the template belongs to the shop
      const findWhere: Record<string, unknown> = { id };
      if (shopId) findWhere.shopId = shopId;
      return db.formTemplate.findFirst({ where: findWhere }).then((t) => {
        if (!t) return Promise.resolve();
        return db.formTemplate.update({
          where: { id },
          data: { createdAt: baseDate },
        });
      });
    });

    await Promise.all(updates);

    return NextResponse.json({ success: true, message: "تم إعادة الترتيب بنجاح" });
  } catch (error) {
    console.error("[Template Reorder Error]", error);
    return NextResponse.json(
      { error: "فشل في إعادة الترتيب" },
      { status: 500 },
    );
  }
}