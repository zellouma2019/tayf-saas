import { NextRequest, NextResponse } from "next/server";
import { withRateLimit } from "@/lib/rate-limit";
import { getSuperAdmin } from "@/lib/db-migrations";

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
    const { password } = await req.json();
    if (!password) {
      return NextResponse.json({ error: "كلمة المرور مطلوبة" }, { status: 400 });
    }

    // استخدم turso-lite السريع
    const admin = await getSuperAdmin({ id: true, key: true, password: true, name: true }) as
      | { id: string; key: string; password: string; name?: string }
      | null;

    const isFirstTime = !admin || !admin.password || admin.password === "Admin@2026";
    const adminPassword = admin?.password || "Admin@2026";

    if (isFirstTime) {
      const ts = Date.now();
      const token = await simpleHash(`${adminPassword}:${ts}:${APP_SECRET}`);
      return NextResponse.json({ success: true, isFirstTime: true, ts, token });
    }

    if (adminPassword === password) {
      const ts = Date.now();
      const token = await simpleHash(`${password}:${ts}:${APP_SECRET}`);
      return NextResponse.json({ success: true, isFirstTime: false, ts, token, adminName: admin?.name });
    }

    return NextResponse.json({ error: "كلمة المرور غير صحيحة" }, { status: 401 });
  } catch (e) {
    console.error("[super-admin/auth/POST]", e);
    return NextResponse.json(
      { error: "خطأ في التحقق", detail: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
}
