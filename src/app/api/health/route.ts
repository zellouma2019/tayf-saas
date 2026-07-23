import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    await db.shop.count();
    return NextResponse.json({ status: "ok", db: "connected", v: "4" });
  } catch (e) {
    return NextResponse.json({ status: "error", db: "disconnected", error: String(e) }, { status: 503 });
  }
}
