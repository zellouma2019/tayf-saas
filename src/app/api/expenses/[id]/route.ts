import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { authorized, error: authError } = await requireAdmin(req);
  if (!authorized) return authError;
  try {
    const { id } = await params;
    const shopId = req.nextUrl.searchParams.get("shopId");
    const findWhere: Record<string, unknown> = { id };
    if (shopId) findWhere.shopId = shopId;
    const existing = await db.expense.findFirst({ where: findWhere });
    if (!existing) {
      return NextResponse.json({ error: "المصروف غير موجود" }, { status: 404 });
    }
    const body = await req.json();
    const { category, amount, description, date } = body;
    const expense = await db.expense.update({
      where: { id },
      data: { category, amount, description, date },
    });
    return NextResponse.json(expense);
  } catch (e) {
    console.error('[expenses/[id]/PUT]', e);
    return NextResponse.json({ error: "حدث خطأ أثناء تحديث المصروف" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { authorized, error: authError } = await requireAdmin(req);
  if (!authorized) return authError;
  try {
    const { id } = await params;
    const shopId = req.nextUrl.searchParams.get("shopId");
    const findWhere: Record<string, unknown> = { id };
    if (shopId) findWhere.shopId = shopId;
    const existing = await db.expense.findFirst({ where: findWhere });
    if (!existing) {
      return NextResponse.json({ error: "المصروف غير موجود" }, { status: 404 });
    }
    await db.expense.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('[expenses/[id]/DELETE]', e);
    return NextResponse.json({ error: "حدث خطأ أثناء حذف المصروف" }, { status: 500 });
  }
}