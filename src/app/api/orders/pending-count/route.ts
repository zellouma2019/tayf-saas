import { NextRequest, NextResponse } from "next/server";
import { tursoQuery, toNum } from "@/lib/turso-lite";

/// عدد الطلبات المعلقة — عبر turso-lite (أسرع من Prisma على Vercel)
/// يُستدعى كل 30 ثانية من لوحة التاجر
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const shopId = searchParams.get("shopId");

    if (!shopId) {
      return NextResponse.json({ error: "shopId is required" }, { status: 400 });
    }

    // يدعم الطلبات القديمة (shopId = null)
    const rows = await tursoQuery<{ cnt: unknown }>(
      `SELECT COUNT(*) as cnt FROM "PrintOrder" WHERE status = ? AND ("shopId" = ? OR "shopId" IS NULL)`,
      ["pending", shopId]
    );

    return NextResponse.json({ count: toNum(rows[0]?.cnt) });
  } catch (error) {
    console.error("pending-count error:", error);
    return NextResponse.json({ count: 0 });
  }
}
