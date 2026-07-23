import { NextRequest, NextResponse } from "next/server";
import { withRateLimit } from "@/lib/rate-limit";
import { getSuperAdmin, createSuperAdmin, updateSuperAdmin } from "@/lib/db-migrations";

const DEFAULT_PLATFORM_SETTINGS = {
  platformName: "طيف",
  platformTagline: "منصة إدارة متاجر الطباعة",
  platformLogo: "/platform-logo.png",
  platformLogoDark: "",
  platformFavicon: "/favicon.png",
  platformEmail: "",
  platformPhone: "",
  platformWhatsapp: "",
  platformDescription: "",
  maintenanceMode: false,
  maintenanceMessage: "المنصة تحت الصيانة المؤقتة. سنعود قريباً.",
  allowNewShops: true,
  maxShops: 100,
  defaultCountry: "DZ",
  defaultLanguage: "ar",
  defaultCurrency: "DZD",
  defaultThemeId: 1,
  defaultFeatures: {
    whatsappNotifications: true,
    orderTracking: true,
    darkMode: true,
    repeatOrders: true,
    customerLogin: false,
    advancedAnalytics: false,
  },
  defaultTrialDays: 30,
  defaultWelcomeMessage: "مرحباً بك! اطلب خدمات الطباعة بسهولة.",
  notifications: {
    newOrderSound: true,
    orderStatusChange: true,
    dailySummary: false,
    lowBalanceAlert: false,
  },
  customCss: "",
};

export async function GET(req: NextRequest) {
  const rl = withRateLimit(req, "platform-settings");
  if (!rl.ok) return rl.response;

  try {
    let admin = await getSuperAdmin() as { platformSettings: string | null } | null;
    if (!admin) {
      admin = await createSuperAdmin() as { platformSettings: string | null };
    }
    const settings = admin.platformSettings
      ? { ...DEFAULT_PLATFORM_SETTINGS, ...JSON.parse(admin.platformSettings) }
      : DEFAULT_PLATFORM_SETTINGS;
    return NextResponse.json({ settings });
  } catch {
    return NextResponse.json({ error: "خطأ في جلب الإعدادات" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const rl = withRateLimit(req, "platform-settings");
  if (!rl.ok) return rl.response;

  try {
    const body = await req.json();

    let admin = await getSuperAdmin() as { platformSettings: string | null } | null;
    if (!admin) {
      admin = await createSuperAdmin() as { platformSettings: string | null };
    }

    const current = admin.platformSettings
      ? { ...DEFAULT_PLATFORM_SETTINGS, ...JSON.parse(admin.platformSettings) }
      : DEFAULT_PLATFORM_SETTINGS;

    const updated = { ...current, ...body };
    for (const key of Object.keys(body)) {
      if (body[key] === undefined) delete updated[key];
    }

    await updateSuperAdmin({ platformSettings: JSON.stringify(updated) });
    return NextResponse.json({ success: true, settings: updated });
  } catch {
    return NextResponse.json({ error: "خطأ في تحديث الإعدادات" }, { status: 500 });
  }
}
