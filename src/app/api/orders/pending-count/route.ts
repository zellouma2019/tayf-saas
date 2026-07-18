import { NextRequest, NextResponse } from "next/server";
import { db, ensureDb } from "@/lib/db";
import { orderListWhere } from "@/lib/order-lookup";

export async function GET(req: NextRequest) {
  try {
    await ensureDb();
    const { searchParams } = new URL(req.url);
    const shopId = searchParams.get("shopId");

    if (!shopId) {
      return NextResponse.json({ error: "shopId is required" }, { status: 400 });
    }

    const where = orderListWhere(shopId, { status: "pending" });

    const count = await db.printOrder.count({ where });

    return NextResponse.json({ count });
  } catch (error) {
    console.error("pending-count error:", error);
    return NextResponse.json({ count: 0 });
  }
}