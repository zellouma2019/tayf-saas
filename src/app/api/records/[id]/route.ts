import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const shopId = req.nextUrl.searchParams.get("shopId");
    const where: Record<string, unknown> = { id };
    if (shopId) where.shopId = shopId;
    const record = await db.formRecord.findFirst({
      where,
      include: { template: true },
    });
    if (!record) {
      return NextResponse.json({ error: "السجل غير موجود" }, { status: 404 });
    }
    return NextResponse.json({
      ...record,
      data: JSON.parse(record.data),
    });
  } catch (e) {
    console.error('[records/[id]/GET]', e);
    return NextResponse.json(
      { error: "حدث خطأ أثناء جلب السجل" },
      { status: 500 },
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const shopId = req.nextUrl.searchParams.get("shopId");
    const findWhere: Record<string, unknown> = { id };
    if (shopId) findWhere.shopId = shopId;
    const existing = await db.formRecord.findFirst({ where: findWhere });
    if (!existing) {
      return NextResponse.json({ error: "السجل غير موجود" }, { status: 404 });
    }

    const body = await req.json();
    const { title, status, priority, data } = body;

    const record = await db.formRecord.update({
      where: { id },
      data: {
        title: title ?? existing.title,
        status: status ?? existing.status,
        priority: priority ?? existing.priority,
        data: data ? JSON.stringify(data) : existing.data,
      },
      include: { template: true },
    });

    return NextResponse.json({
      ...record,
      data: JSON.parse(record.data),
    });
  } catch (e) {
    console.error('[records/[id]/PUT]', e);
    return NextResponse.json(
      { error: "حدث خطأ أثناء تحديث السجل" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const shopId = req.nextUrl.searchParams.get("shopId");
    const findWhere: Record<string, unknown> = { id };
    if (shopId) findWhere.shopId = shopId;
    const existing = await db.formRecord.findFirst({ where: findWhere });
    if (!existing) {
      return NextResponse.json({ error: "السجل غير موجود" }, { status: 404 });
    }
    await db.formRecord.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('[records/[id]/DELETE]', e);
    return NextResponse.json(
      { error: "حدث خطأ أثناء حذف السجل" },
      { status: 500 },
    );
  }
}