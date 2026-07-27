import { NextRequest, NextResponse } from "next/server";
import { tursoQuery, tursoExecute } from "@/lib/turso-lite";
import { requireAdmin } from "@/lib/admin-auth";

/// تحديث/حذف زبون عبر turso-lite
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { authorized, error: authError } = await requireAdmin(req);
  if (!authorized) return authError;

  try {
    const { id } = await params;
    const shopId = req.nextUrl.searchParams.get("shopId");

    const existing = await tursoQuery<{ id: string }>(
      `SELECT id FROM "Customer" WHERE id = ? ${shopId ? `AND ("shopId" = ? OR "shopId" IS NULL)` : ""} LIMIT 1`,
      shopId ? [id, shopId] : [id]
    );
    if (existing.length === 0) {
      return NextResponse.json({ error: "الزبون غير موجود" }, { status: 404 });
    }

    const body = await req.json();
    const result = await tursoExecute(
      `UPDATE "Customer" SET name = ?, email = ?, address = ?, notes = ?, "updatedAt" = ? WHERE id = ? RETURNING *`,
      [body.name, body.email || null, body.address || null, body.notes || null, new Date().toISOString(), id]
    );

    return NextResponse.json(result.rows[0] || { success: true });
  } catch (e) {
    console.error('[customers/[id]/PUT]', e);
    return NextResponse.json({ error: "حدث خطأ أثناء تحديث الزبون" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { authorized, error: authError } = await requireAdmin(req);
  if (!authorized) return authError;

  try {
    const { id } = await params;
    const shopId = req.nextUrl.searchParams.get("shopId");

    const existing = await tursoQuery<{ id: string }>(
      `SELECT id FROM "Customer" WHERE id = ? ${shopId ? `AND ("shopId" = ? OR "shopId" IS NULL)` : ""} LIMIT 1`,
      shopId ? [id, shopId] : [id]
    );
    if (existing.length === 0) {
      return NextResponse.json({ error: "الزبون غير موجود" }, { status: 404 });
    }

    await tursoExecute(`DELETE FROM "Customer" WHERE id = ?`, [id]);
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('[customers/[id]/DELETE]', e);
    return NextResponse.json({ error: "حدث خطأ أثناء حذف الزبون" }, { status: 500 });
  }
}
