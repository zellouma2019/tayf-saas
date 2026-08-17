import { NextRequest, NextResponse } from "next/server";
import { tursoQuery, tursoExecute } from "@/lib/turso-lite";
import { DEFAULT_SETTINGS, type AppSettings } from "@/lib/customer/default-settings";
import { requireAdmin } from "@/lib/admin-auth";

/// الحصول على الإعدادات
export async function GET() {
  try {
    const rows = await tursoQuery<{ key: string; value: string }>(
      `SELECT key, value FROM "Setting" WHERE ("shopId" IS NULL) ORDER BY key`
    );
    const settings: AppSettings = { ...DEFAULT_SETTINGS };
    for (const row of rows) {
      try {
        const parsed = JSON.parse(row.value);
        if (row.key === "services") settings.services = parsed;
        else if (row.key === "deliveryOptions") settings.deliveryOptions = parsed;
        else if (row.key === "general") settings.general = { ...settings.general, ...parsed };
      } catch {}
    }
    return NextResponse.json(settings);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

/// تحديث إعداد واحد عبر turso-lite
async function upsertSetting(key: string, value: string) {
  const existing = await tursoQuery<{ id: string }>(
    `SELECT id FROM "Setting" WHERE key = ? AND ("shopId" IS NULL) LIMIT 1`,
    [key]
  );
  if (existing.length > 0) {
    await tursoExecute(
      `UPDATE "Setting" SET value = ?, "updatedAt" = ? WHERE id = ?`,
      [value, new Date().toISOString(), existing[0].id]
    );
  } else {
    const id = `set_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
    await tursoExecute(
      `INSERT INTO "Setting" (id, key, value, "createdAt", "updatedAt") VALUES (?, ?, ?, ?, ?)`,
      [id, key, value, new Date().toISOString(), new Date().toISOString()]
    );
  }
}

/// تحديث الإعدادات (يتطلب كود الإدارة)
export async function PUT(req: NextRequest) {
  const { authorized, error: authError } = await requireAdmin(req);
  if (!authorized) return authError;

  try {
    const body = await req.json();
    const { services, deliveryOptions, general } = body as AppSettings;

    const updates: Promise<unknown>[] = [];
    if (services) updates.push(upsertSetting("services", JSON.stringify(services)));
    if (deliveryOptions) updates.push(upsertSetting("deliveryOptions", JSON.stringify(deliveryOptions)));
    if (general) updates.push(upsertSetting("general", JSON.stringify(general)));
    await Promise.all(updates);
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

/// إعادة التعيين للإعدادات الافتراضية
export async function DELETE(req: NextRequest) {
  const { authorized, error: authError } = await requireAdmin(req);
  if (!authorized) return authError;

  try {
    await tursoExecute(`DELETE FROM "Setting" WHERE ("shopId" IS NULL)`, []);
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
