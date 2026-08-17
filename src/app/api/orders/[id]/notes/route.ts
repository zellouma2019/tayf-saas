import { NextRequest, NextResponse } from "next/server";
import { tursoQuery, tursoExecute } from "@/lib/turso-lite";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const notes = await tursoQuery<Record<string, unknown>>(
      `SELECT * FROM "AuditLog" WHERE "orderId" = ? ORDER BY "createdAt" DESC LIMIT 50`,
      [id],
    );
    return NextResponse.json(notes);
  } catch (error) {
    console.error("[order-notes GET]", error);
    return NextResponse.json({ error: "Failed to fetch notes" }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { content, adminCode } = await request.json();
    if (!content?.trim()) {
      return NextResponse.json({ error: "ملاحظة مطلوبة" }, { status: 400 });
    }

    // إنشاء سجل تدقيق كملاحظة
    const auditId = 'note-' + Math.random().toString(36).substring(2, 10);
    await tursoExecute(
      `INSERT INTO "AuditLog" (id, "orderId", action, details, "userId", "createdAt") VALUES (?, ?, ?, ?, ?, datetime('now'))`,
      [auditId, id, 'note', content, adminCode || 'admin'],
    );
    return NextResponse.json({ 
      success: true, 
      note: { id: auditId, content, createdAt: new Date().toISOString() } 
    });
  } catch (error) {
    console.error("[order-notes POST]", error);
    return NextResponse.json({ error: "Failed to add note" }, { status: 500 });
  }
}
