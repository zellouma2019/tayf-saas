import { NextRequest, NextResponse } from "next/server";
import { tursoExecute } from "@/lib/turso-lite";

const VALID_STATUSES = new Set(["pending", "printing", "ready", "delivered", "cancelled"]);
const MAX_BULK_IDS = 100;

export async function POST(request: NextRequest) {
  try {
    const { orderIds, status } = await request.json();
    if (!orderIds?.length || !status) {
      return NextResponse.json({ error: "Missing orderIds or status" }, { status: 400 });
    }
    if (!Array.isArray(orderIds) || orderIds.length > MAX_BULK_IDS) {
      return NextResponse.json({ error: "Too many orders" }, { status: 400 });
    }
    if (!VALID_STATUSES.has(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    const placeholders = orderIds.map(() => "?").join(", ");
    const now = new Date().toISOString();
    await tursoExecute(
      `UPDATE "PrintOrder" SET status = ?, "updatedAt" = ? WHERE id IN (${placeholders})`,
      [status, now, ...orderIds],
    );
    return NextResponse.json({ success: true, updated: orderIds.length });
  } catch (error) {
    console.error("[bulk-status]", error);
    return NextResponse.json({ error: "Bulk update failed" }, { status: 500 });
  }
}
