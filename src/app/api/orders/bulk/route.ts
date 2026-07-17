import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { withRateLimit } from "@/lib/rate-limit";

const VALID_STATUSES = new Set(["pending", "printing", "ready", "delivered", "cancelled"]);
const MAX_BULK_IDS = 100;

function getShopId(req: NextRequest): string | undefined {
  return req.nextUrl.searchParams.get("shopId") || undefined;
}

export async function PUT(req: NextRequest) {
  const rl = withRateLimit(req, "bulk-update");
  if (!rl.ok) return rl.response;

  const queryShopId = getShopId(req);
  let ids: string[], status: string, bodyShopId: string | undefined = undefined;
  try {
    const body = await req.json();
    ids = body.ids;
    status = body.status;
    bodyShopId = body.shopId;
  } catch {
    return NextResponse.json({ error: "بيانات غير صالحة" }, { status: 400 });
  }
  if (!ids?.length || !status) {
    return NextResponse.json({ error: "بيانات ناقصة" }, { status: 400 });
  }
  if (!Array.isArray(ids) || ids.length > MAX_BULK_IDS) {
    return NextResponse.json({ error: "عدد الطلبات كبير جداً" }, { status: 400 });
  }
  if (!VALID_STATUSES.has(status)) {
    return NextResponse.json({ error: "حالة غير صالحة" }, { status: 400 });
  }
  const shopId = queryShopId || bodyShopId;
  const where: Record<string, unknown> = { id: { in: ids } };
  if (shopId) where.shopId = shopId;
  await db.printOrder.updateMany({
    where,
    data: { status },
  });
  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const rl = withRateLimit(req, "bulk-delete");
  if (!rl.ok) return rl.response;

  const queryShopId = getShopId(req);
  let ids: string[], bodyShopId: string | undefined = undefined;
  try {
    const body = await req.json();
    ids = body.ids;
    bodyShopId = body.shopId;
  } catch {
    return NextResponse.json({ error: "بيانات غير صالحة" }, { status: 400 });
  }
  if (!ids?.length) {
    return NextResponse.json({ error: "بيانات ناقصة" }, { status: 400 });
  }
  if (!Array.isArray(ids) || ids.length > MAX_BULK_IDS) {
    return NextResponse.json({ error: "عدد الطلبات كبير جداً" }, { status: 400 });
  }
  const shopId = queryShopId || bodyShopId;
  const where: Record<string, unknown> = { id: { in: ids } };
  if (shopId) where.shopId = shopId;
  await db.printOrder.deleteMany({
    where,
  });
  return NextResponse.json({ success: true });
}