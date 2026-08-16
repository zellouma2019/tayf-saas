import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { DEFAULT_SETTINGS, type AppSettings } from "@/lib/customer/default-settings";
import { requireAdmin } from "@/lib/admin-auth";

/// الحصول على الإعدادات (يُنشئ الافتراضية إن لم تكن موجودة)
export async function GET() {
  try {
    const rows = await db.setting.findMany();
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

/// تحديث الإعدادات (يتطلب كود الإدارة)
export async function PUT(req: NextRequest) {
  const { authorized, error: authError } = await requireAdmin(req);
  if (!authorized) return authError;

  try {
    const body = await req.json();
    const { services, deliveryOptions, general } = body as AppSettings;

    const updates: Promise<unknown>[] = [];
    if (services) {
      updates.push(
        db.setting.upsert({
          where: { key: "services" },
          update: { value: JSON.stringify(services) },
          create: { key: "services", value: JSON.stringify(services) },
        }),
      );
    }
    if (deliveryOptions) {
      updates.push(
        db.setting.upsert({
          where: { key: "deliveryOptions" },
          update: { value: JSON.stringify(deliveryOptions) },
          create: { key: "deliveryOptions", value: JSON.stringify(deliveryOptions) },
        }),
      );
    }
    if (general) {
      updates.push(
        db.setting.upsert({
          where: { key: "general" },
          update: { value: JSON.stringify(general) },
          create: { key: "general", value: JSON.stringify(general) },
        }),
      );
    }
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
    await db.setting.deleteMany({});
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
