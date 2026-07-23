import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { withRateLimit } from "@/lib/rate-limit";

export const maxDuration = 30;

export async function GET() {
  const t0 = Date.now();
  try {
    const c1 = await db.printOrder.count();
    const t1 = Date.now();
    return NextResponse.json({
      totalOrders: c1,
      phase1_ms: t1 - t0,
      v: "prisma-test",
    });
  } catch (e) {
    const t1 = Date.now();
    return NextResponse.json({
      error: String(e),
      ms: t1 - t0,
    }, { status: 500 });
  }
}
