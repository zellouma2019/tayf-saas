import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import { addAuditLog } from "@/lib/audit";

export async function POST(req: NextRequest) {
  const { authorized, error: authError } = await requireAdmin(req);
  if (!authorized) return authError;

  try {
    const { orderId, discountPercent } = await req.json();

    if (!orderId || discountPercent === undefined || discountPercent === null) {
      return NextResponse.json({ error: "معاملات مفقودة" }, { status: 400 });
    }

    const percent = Math.min(100, Math.max(0, Number(discountPercent)));
    if (percent <= 0) {
      return NextResponse.json({ error: "نسبة الخصم غير صالحة" }, { status: 400 });
    }

    const existing = await db.printOrder.findUnique({ where: { id: orderId } });
    if (!existing) {
      return NextResponse.json({ error: "الطلب غير موجود" }, { status: 404 });
    }

    const oldTotal = existing.total;
    const discountAmount = Math.round(oldTotal * (percent / 100));
    const newTotal = Math.max(0, oldTotal - discountAmount);

    // تحديث الطلب
    const updated = await db.printOrder.update({
      where: { id: orderId },
      data: {
        total: newTotal,
      },
    });

    // تحديث حقل pricing JSON لإضافة الخصم
    let pricing = {};
    try { pricing = JSON.parse(existing.pricing); } catch { /* keep empty */ }
    const updatedPricing = {
      ...pricing,
      loyaltyDiscount: discountAmount,
      loyaltyDiscountPercent: percent,
      total: newTotal,
    };
    await db.printOrder.update({
      where: { id: orderId },
      data: { pricing: JSON.stringify(updatedPricing) },
    });

    // سجل التغييرات
    await addAuditLog({
      orderId,
      action: "edit",
      field: "total (خصم ولاء)",
      oldValue: String(oldTotal),
      newValue: String(newTotal),
      details: `تطبيق خصم ولاء ${percent}% على ${existing.reference} — خصم ${discountAmount} دج`,
    });

    return NextResponse.json({
      ...updated,
      options: JSON.parse(updated.options),
      customer: JSON.parse(updated.customer),
      delivery: JSON.parse(updated.delivery),
      pricing: updatedPricing,
      smartAnalysis: updated.smartAnalysis ? JSON.parse(updated.smartAnalysis) : null,
      discountApplied: discountAmount,
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}