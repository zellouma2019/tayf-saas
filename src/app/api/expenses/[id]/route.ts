import { NextRequest, NextResponse } from "next/server";
import { tursoQuery, tursoExecute } from "@/lib/turso-lite";
import { requireAdmin } from "@/lib/admin-auth";

/// تحديث/حذف مصروف عبر turso-lite
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { authorized, error: authError } = await requireAdmin(req);
  if (!authorized) return authError;

  try {
    const { id } = await params;
    const shopId = req.nextUrl.searchParams.get("shopId");

    const existing = await tursoQuery<{ id: string }>(
      `SELECT id FROM "Expense" WHERE id = ? ${shopId ? `AND ("shopId" = ? OR "shopId" IS NULL)` : ""} LIMIT 1`,
      shopId ? [id, shopId] : [id]
    );
    if (existing.length === 0) {
      return NextResponse.json({ error: "المصروف غير موجود" }, { status: 404 });
    }

    const body = await req.json();
    const { category, amount, description, date } = body;

    const result = await tursoExecute(
      `UPDATE "Expense" SET category = ?, amount = ?, description = ?, date = ?, "updatedAt" = ? WHERE id = ? RETURNING *`,
      [category, amount, description || null, date || new Date().toISOString(), new Date().toISOString(), id]
    );

    return NextResponse.json(result.rows[0] || { success: true });
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

    const existing = await tursoQuery<{ id: string }>(
      `SELECT id FROM "Expense" WHERE id = ? ${shopId ? `AND ("shopId" = ? OR "shopId" IS NULL)` : ""} LIMIT 1`,
      shopId ? [id, shopId] : [id]
    );
    if (existing.length === 0) {
      return NextResponse.json({ error: "المصروف غير موجود" }, { status: 404 });
    }

    await tursoExecute(`DELETE FROM "Expense" WHERE id = ?`, [id]);
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('[expenses/[id]/DELETE]', e);
    return NextResponse.json({ error: "حدث خطأ أثناء حذف المصروف" }, { status: 500 });
  }
}
