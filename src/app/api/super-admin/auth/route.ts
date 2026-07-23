import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { withRateLimit } from "@/lib/rate-limit";
import { runMigrations } from "@/lib/db-migrations";

const APP_SECRET = "tayf_admin_session_2025";

async function simpleHash(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function POST(req: NextRequest) {
  const rl = withRateLimit(req, "super-admin-auth");
  if (!rl.ok) return rl.response;

  try {
    // ميجريشن ذاتي قبل أي استعلام Prisma
    await runMigrations();

    const { password } = await req.json();
    if (!password) {
      return NextResponse.json({ error: "كلمة المرور مطلوبة" }, { status: 400 });
    }

    let admin = await db.superAdmin.findUnique({ where: { key: "main" } });
    if (!admin) {
      admin = await db.superAdmin.create({ data: { key: "main" } });
    }

    const isFirstTime = !admin.password || admin.password === "Admin@2025";

    if (isFirstTime) {
      const ts = Date.now();
      const token = await simpleHash(`${admin.password || "Admin@2025"}:${ts}:${APP_SECRET}`);
      return NextResponse.json({ success: true, isFirstTime: true, ts, token });
    }

    if (admin.password === password) {
      const ts = Date.now();
      const token = await simpleHash(`${password}:${ts}:${APP_SECRET}`);
      return NextResponse.json({ success: true, isFirstTime: false, ts, token });
    }

    return NextResponse.json({ error: "كلمة المرور غير صحيحة" }, { status: 401 });
  } catch (e) {
    console.error('[super-admin/auth/POST]', e);
    return NextResponse.json({ error: "خطأ في التحقق" }, { status: 500 });
  }
}