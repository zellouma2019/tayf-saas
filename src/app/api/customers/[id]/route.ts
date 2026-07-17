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
    const existing = await db.customer.findFirst({ where: findWhere });
    if (!existing) {
      return NextResponse.json({ error: "الزبون غير موجود" }, { status: 404 });
    }
    const body = await req.json();
    const customer = await db.customer.update({
      where: { id },
      data: {
        name: body.name,
        email: body.email,
        address: body.address,
        notes: body.notes,
      },
    });
    return NextResponse.json(customer);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
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
    const existing = await db.customer.findFirst({ where: findWhere });
    if (!existing) {
      return NextResponse.json({ error: "الزبون غير موجود" }, { status: 404 });
    }
    await db.customer.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}