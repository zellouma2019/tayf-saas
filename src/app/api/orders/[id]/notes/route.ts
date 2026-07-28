import { NextRequest, NextResponse } from "next/server";
import { tursoQuery } from "@/lib/turso-lite";

// POST: Save a merchant note for an order
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { note, shopId } = body;

    if (!note || typeof note !== "string" || !note.trim()) {
      return NextResponse.json({ error: "الملاحظة مطلوبة" }, { status: 400 });
    }

    // Check if a note already exists for this order+shop combination
    const existing = await tursoQuery(
      `SELECT id FROM "MerchantNote" WHERE "orderId" = ? AND "shopId" = ? LIMIT 1`,
      [id, shopId || ""]
    );

    if (existing.length > 0) {
      // Update existing note
      await tursoQuery(
        `UPDATE "MerchantNote" SET note = ?, "updatedAt" = ? WHERE id = ?`,
        [note.trim(), new Date().toISOString(), existing[0].id]
      );
    } else {
      // Create new note
      await tursoQuery(
        `INSERT INTO "MerchantNote" ("orderId", "shopId", note", "createdAt", "updatedAt") VALUES (?, ?, ?, ?, ?)`,
        [id, shopId || "", note.trim(), new Date().toISOString(), new Date().toISOString()]
      );
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('[orders/[id]/notes]', e);
    return NextResponse.json(
      { error: "فشل حفظ الملاحظة" },
      { status: 500 },
    );
  }
}

// GET: Retrieve notes for an order
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const shopId = req.nextUrl.searchParams.get("shopId");

    // Ensure the MerchantNote table exists
    await tursoQuery(`CREATE TABLE IF NOT EXISTS "MerchantNote" (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(12)))),
      "orderId" TEXT NOT NULL,
      "shopId" TEXT NOT NULL DEFAULT '',
      note TEXT NOT NULL,
      "createdAt" TEXT NOT NULL,
      "updatedAt" TEXT NOT NULL
    )`);

    const rows = await tursoQuery(
      `SELECT * FROM "MerchantNote" WHERE "orderId" = ? AND "shopId" = ? LIMIT 1`,
      [id, shopId || ""]
    );

    if (rows.length > 0) {
      return NextResponse.json({ note: rows[0].note });
    }
    return NextResponse.json({ note: "" });
  } catch (e) {
    console.error('[orders/[id]/notes]', e);
    return NextResponse.json({ note: "" }, { status: 500 });
  }
}
