import { NextRequest, NextResponse } from "next/server";
import { tursoQuery, tursoExecute, safeJson } from "@/lib/turso-lite";
import { requireAdmin } from "@/lib/admin-auth";
import { DEFAULT_SETTINGS, type AppSettings } from "@/lib/default-settings";

export const dynamic = "force-dynamic";

/// Helper: upsert setting عبر turso-lite
async function upsertSetting(key: string, value: string, shopId?: string) {
  if (shopId) {
    // التحقق من وجود الإعداد
    const existing = await tursoQuery<{ id: string }>(
      `SELECT id FROM "Setting" WHERE "shopId" = ? AND key = ? LIMIT 1`,
      [shopId, key]
    );
    if (existing.length > 0) {
      await tursoExecute(
        `UPDATE "Setting" SET value = ?, "updatedAt" = ? WHERE id = ?`,
        [value, new Date().toISOString(), existing[0].id]
      );
    } else {
      await tursoExecute(
        `INSERT INTO "Setting" (id, key, value, "shopId", "createdAt", "updatedAt")
         VALUES (?, ?, ?, ?, ?, ?)`,
        [`set_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`, key, value, shopId, new Date().toISOString(), new Date().toISOString()]
      );
    }
  } else {
    const existing = await tursoQuery<{ id: string }>(
      `SELECT id FROM "Setting" WHERE key = ? AND "shopId" IS NULL LIMIT 1`,
      [key]
    );
    if (existing.length > 0) {
      await tursoExecute(
        `UPDATE "Setting" SET value = ?, "updatedAt" = ? WHERE id = ?`,
        [value, new Date().toISOString(), existing[0].id]
      );
    } else {
      await tursoExecute(
        `INSERT INTO "Setting" (id, key, value, "createdAt", "updatedAt")
         VALUES (?, ?, ?, ?, ?)`,
        [`set_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`, key, value, new Date().toISOString(), new Date().toISOString()]
      );
    }
  }
}

/// الحصول على الإعدادات عبر turso-lite (أسرع 10x من Prisma على Vercel)
export async function GET(req: NextRequest) {
  try {
    const shopId = req.nextUrl.searchParams.get("shopId");
    const shopFilter = shopId ? `("shopId" = ? OR "shopId" IS NULL)` : `("shopId" IS NULL)`;
    const args: unknown[] = shopId ? [shopId] : [];

    const rows = await tursoQuery<{ key: string; value: string }>(
      `SELECT key, value FROM "Setting" WHERE ${shopFilter}`,
      args
    );

    const settings: AppSettings = { ...DEFAULT_SETTINGS };
    for (const row of rows) {
      try {
        const parsed = JSON.parse(row.value);
        if (row.key === "services") settings.services = parsed;
        else if (row.key === "deliveryOptions") settings.deliveryOptions = parsed;
        else if (row.key === "general") settings.general = { ...settings.general, ...parsed };
        else if (row.key === "intro") settings.intro = { ...settings.intro, ...parsed };
      } catch {}
    }
    return NextResponse.json(settings);
  } catch (e) {
    console.error('[settings/GET]', e);
    return NextResponse.json({ error: "حدث خطأ أثناء جلب الإعدادات" }, { status: 500 });
  }
}

/// تحديث الإعدادات عبر turso-lite
export async function PUT(req: NextRequest) {
  const { authorized, error: authError } = await requireAdmin(req);
  if (!authorized) return authError;

  try {
    const body = await req.json();
    const { services, deliveryOptions, general, intro } = body as AppSettings;
    const shopId = req.nextUrl.searchParams.get("shopId") || (body.shopId as string) || undefined;

    const updates: Promise<unknown>[] = [];
    if (services) updates.push(upsertSetting("services", JSON.stringify(services), shopId));
    if (deliveryOptions) updates.push(upsertSetting("deliveryOptions", JSON.stringify(deliveryOptions), shopId));
    if (general) updates.push(upsertSetting("general", JSON.stringify(general), shopId));
    if (intro) updates.push(upsertSetting("intro", JSON.stringify(intro), shopId));
    await Promise.all(updates);

    // مزامنة الإعدادات مع عمود Shop.settings
    if (shopId) {
      try {
        const allRows = await tursoQuery<{ key: string; value: string }>(
          `SELECT key, value FROM "Setting" WHERE "shopId" = ?`,
          [shopId]
        );
        const syncedSettings: Record<string, unknown> = {};
        for (const row of allRows) {
          try { syncedSettings[row.key] = JSON.parse(row.value); } catch {}
        }
        if (Object.keys(syncedSettings).length > 0) {
          await tursoExecute(
            `UPDATE "Shop" SET settings = ?, "updatedAt" = ? WHERE id = ?`,
            [JSON.stringify(syncedSettings), new Date().toISOString(), shopId]
          );
        }
      } catch (syncErr) {
        console.error('[settings/PUT] Failed to sync to Shop.settings:', syncErr);
      }
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('[settings/PUT]', e);
    return NextResponse.json({ error: "حدث خطأ أثناء تحديث الإعدادات" }, { status: 500 });
  }
}

/// إعادة التعيين للإعدادات الافتراضية عبر turso-lite
export async function DELETE(req: NextRequest) {
  const { authorized, error: authError } = await requireAdmin(req);
  if (!authorized) return authError;

  try {
    const shopId = req.nextUrl.searchParams.get("shopId");
    const shopFilter = shopId ? `("shopId" = ? OR "shopId" IS NULL)` : `("shopId" IS NULL)`;
    const args: unknown[] = shopId ? [shopId] : [];

    await tursoExecute(`DELETE FROM "Setting" WHERE ${shopFilter}`, args);

    if (shopId) {
      try {
        await tursoExecute(
          `UPDATE "Shop" SET settings = NULL, "updatedAt" = ? WHERE id = ?`,
          [new Date().toISOString(), shopId]
        );
      } catch {}
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('[settings/DELETE]', e);
    return NextResponse.json({ error: "حدث خطأ أثناء إعادة التعيين" }, { status: 500 });
  }
}
