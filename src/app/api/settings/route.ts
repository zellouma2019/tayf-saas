import { NextRequest, NextResponse } from "next/server";
import { db, ensureDb } from "@/lib/db";
import { DEFAULT_SETTINGS, type AppSettings } from "@/lib/default-settings";
import { requireAdmin } from "@/lib/admin-auth";

/// Helper: upsert setting with compound unique [shopId, key]
async function upsertSetting(key: string, value: string, shopId?: string) {
  if (shopId) {
    return db.setting.upsert({
      where: { shopId_key: { shopId, key } },
      update: { value },
      create: { key, value, shopId },
    });
  }
  const existing = await db.setting.findFirst({ where: { key, shopId: null } });
  if (existing) {
    return db.setting.update({ where: { id: existing.id }, data: { value } });
  }
  return db.setting.create({ data: { key, value } });
}

/// مزامنة الإعدادات إلى حقل shop.settings على نموذج Shop
/// هذا يضمن أن صفحة الزبون (التي تقرأ من shop.settings) تحصل على أحدث البيانات
async function syncSettingsToShop(shopId: string, body: { services?: unknown; deliveryOptions?: unknown; general?: unknown; intro?: unknown }) {
  try {
    // قراءة shop.settings الحالي
    const shop = await db.shop.findUnique({ where: { id: shopId }, select: { settings: true } });
    let existing: Record<string, unknown> = {};
    if (shop?.settings) {
      try { existing = JSON.parse(shop.settings); } catch {}
    }
    // دمج الحقول المحدّثة
    const merged = { ...existing };
    if (body.services !== undefined) merged.services = body.services;
    if (body.deliveryOptions !== undefined) merged.deliveryOptions = body.deliveryOptions;
    if (body.general !== undefined) merged.general = body.general;
    if (body.intro !== undefined) merged.intro = body.intro;
    await db.shop.update({
      where: { id: shopId },
      data: { settings: JSON.stringify(merged) },
    });
  } catch (e) {
    console.error('[settings/syncToShop]', e);
  }
}

/// الحصول على الإعدادات (يُنشئ الافتراضية إن لم تكن موجودة)
export async function GET(req: NextRequest) {
  try {
    await ensureDb();
    const shopId = req.nextUrl.searchParams.get("shopId");
    const where = shopId ? { shopId } : { shopId: null as string | null };
    const rows = await db.setting.findMany({ where });
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
    return NextResponse.json(settings, {
      headers: {
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
      },
    });
  } catch (e) {
    console.error('[settings/GET]', e);
    return NextResponse.json({ error: "حدث خطأ أثناء جلب الإعدادات" }, { status: 500 });
  }
}

/// تحديث الإعدادات (يتطلب كود الإدارة)
export async function PUT(req: NextRequest) {
  const { authorized, error: authError } = await requireAdmin(req);
  if (!authorized) return authError;

  try {
    await ensureDb();
    const body = await req.json();
    const { services, deliveryOptions, general, intro } = body as AppSettings;

    // استخراج shopId من query params (لأن shopApi يضيفه هناك)
    const shopId = req.nextUrl.searchParams.get("shopId");

    const updates: Promise<unknown>[] = [];
    if (services) {
      updates.push(upsertSetting("services", JSON.stringify(services), shopId || undefined));
    }
    if (deliveryOptions) {
      updates.push(upsertSetting("deliveryOptions", JSON.stringify(deliveryOptions), shopId || undefined));
    }
    if (general) {
      updates.push(upsertSetting("general", JSON.stringify(general), shopId || undefined));
    }
    if (intro) {
      updates.push(upsertSetting("intro", JSON.stringify(intro), shopId || undefined));
    }
    await Promise.all(updates);

    // مزامنة إلى shop.settings لكي يراها الزبون فوراً
    if (shopId) {
      await syncSettingsToShop(shopId, { services, deliveryOptions, general, intro });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('[settings/PUT]', e);
    return NextResponse.json({ error: "حدث خطأ أثناء تحديث الإعدادات" }, { status: 500 });
  }
}

/// إعادة التعيين للإعدادات الافتراضية
export async function DELETE(req: NextRequest) {
  const { authorized, error: authError } = await requireAdmin(req);
  if (!authorized) return authError;

  try {
    await ensureDb();
    const shopId = req.nextUrl.searchParams.get("shopId");
    const where = shopId ? { shopId } : { shopId: null as string | null };
    await db.setting.deleteMany({ where });

    // مسح shop.settings أيضاً
    if (shopId) {
      await db.shop.update({
        where: { id: shopId },
        data: { settings: null },
      });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('[settings/DELETE]', e);
    return NextResponse.json({ error: "حدث خطأ أثناء إعادة التعيين" }, { status: 500 });
  }
}