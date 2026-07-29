import { NextRequest, NextResponse } from "next/server";
import { tursoQuery, tursoExecute } from "@/lib/turso-lite";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const result = await tursoQuery(
      `SELECT n.*, u.name as authorName FROM "OrderNote" n LEFT JOIN "User" u ON n.authorId = u.id WHERE n.orderId = ? ORDER BY n."createdAt" DESC`,
      [id],
    );
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("[order-notes GET]", error);
    return NextResponse.json({ error: "Failed to fetch notes" }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { content, authorId = "system", authorName = "النظام" } = await request.json();
    if (!content?.trim()) {
      return NextResponse.json({ error: "Note content is required" }, { status: 400 });
    }
    // Ensure OrderNote table exists
    try {
      await tursoQuery(`SELECT 1 FROM "OrderNote" LIMIT 1`, []);
    } catch {
      await tursoExecute(`CREATE TABLE IF NOT EXISTS "OrderNote" (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
        orderId TEXT NOT NULL,
        content TEXT NOT NULL,
        authorId TEXT DEFAULT 'system',
        authorName TEXT DEFAULT 'النظام',
        createdAt TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (orderId) REFERENCES "PrintOrder"(id)
      )`, []);
    }
    const noteId = 'note-' + Math.random().toString(36).substring(2, 10);
    await tursoExecute(
      `INSERT INTO "OrderNote" (id, orderId, content, authorId, authorName, "createdAt") VALUES (?, ?, ?, ?, ?, datetime('now'))`,
      [noteId, id, content, authorId, authorName],
    );
    return NextResponse.json({ success: true, note: { id: noteId, content, authorName, createdAt: new Date().toISOString() } });
  } catch (error) {
    console.error("[order-notes POST]", error);
    return NextResponse.json({ error: "Failed to add note" }, { status: 500 });
  }
}
