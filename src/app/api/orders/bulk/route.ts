import { NextRequest, NextResponse } from "next/server";
import { tursoExecute } from "@/lib/turso-lite";
import { withRateLimit } from "@/lib/rate-limit";
import { requireShopOrGlobalAdmin } from "@/lib/admin-auth";

const VALID_STATUSES = new Set(["pending", "printing", "ready", "delivered", "cancelled"]);
const MAX_BULK_IDS = 100;

function getShopId(req: NextRequest): string | undefined {
  return req.nextUrl.searchParams.get("shopId") || undefined;
}

/// عمليات جماعية عبر turso-lite (أسرع 10x من Prisma على Vercel)
export async function PUT(req: NextRequest) {
  const queryShopId = getShopId(req);
  const { authorized, error: authError } = await requireShopOrGlobalAdmin(req, queryShopId);
  if (!authorized) return authError;

  const rl = withRateLimit(req, "bulk-update");
  if (!rl.ok) return rl.response;
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

  // بناء معاملات IN كـ مواقع
  const placeholders = ids.map(() => "?").join(", ");
  const now = new Date().toISOString();
  const args = [...ids, status, now];
  if (shopId) args.push(shopId);

  const sql = shopId
    ? `UPDATE "PrintOrder" SET status = ?, "updatedAt" = ? WHERE id IN (${placeholders}) AND ("shopId" = ? OR "shopId" IS NULL)`
    : `UPDATE "PrintOrder" SET status = ?, "updatedAt" = ? WHERE id IN (${placeholders})`;

  await tursoExecute(sql, args);
  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const queryShopId = getShopId(req);
  const { authorized, error: authError } = await requireShopOrGlobalAdmin(req, queryShopId);
  if (!authorized) return authError;

  const rl = withRateLimit(req, "bulk-delete");
  if (!rl.ok) return rl.response;
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
  const placeholders = ids.map(() => "?").join(", ");
  const args = [...ids];
  if (shopId) args.push(shopId);

  const sql = shopId
    ? `DELETE FROM "PrintOrder" WHERE id IN (${placeholders}) AND ("shopId" = ? OR "shopId" IS NULL)`
    : `DELETE FROM "PrintOrder" WHERE id IN (${placeholders})`;

  await tursoExecute(sql, args);
  return NextResponse.json({ success: true });
}
