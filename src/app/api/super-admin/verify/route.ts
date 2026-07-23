import { NextRequest, NextResponse } from "next/server";
import { withRateLimit } from "@/lib/rate-limit";
import { getSuperAdmin } from "@/lib/db-migrations";

const APP_SECRET = "tayf_admin_session_2025";

/** إنشاء تجزئة بسيطة */
async function simpleHash(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/// التحقق من صلاحية جلسة المدير
export async function POST(req: NextRequest) {
  const rl = withRateLimit(req, "super-admin-verify");
  if (!rl.ok) return rl.response;

  try {
    const { ts, token } = await req.json();
    if (!ts || !token) {
      return NextResponse.json({ valid: false }, { status: 200 });
    }

    // التحقق من انتهاء الصلاحية (4 ساعات)
    const SESSION_MS = 4 * 60 * 60 * 1000;
    if (Date.now() - ts > SESSION_MS) {
      return NextResponse.json({ valid: false, reason: "expired" }, { status: 200 });
    }

    // جلب كلمة المرور الحالية بأمان
    const admin = await getSuperAdmin({ id: true, key: true, password: true }) as { password: string } | null;
    if (!admin || !admin.password) {
      return NextResponse.json({ valid: false }, { status: 200 });
    }

    const expectedToken = await simpleHash(`${admin.password}:${ts}:${APP_SECRET}`);
    if (token === expectedToken) {
      return NextResponse.json({ valid: true }, { status: 200 });
    }

    return NextResponse.json({ valid: false, reason: "password_changed" }, { status: 200 });
  } catch {
    return NextResponse.json({ valid: false }, { status: 200 });
  }
}
