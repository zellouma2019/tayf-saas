import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { withRateLimit } from "@/lib/rate-limit";

const APP_SECRET = "tayf_admin_session_2025";

/** إنشاء تجزئة بسيطة */
async function simpleHash(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// تهيئة قاعدة البيانات تلقائياً (لأول مرة على Vercel/Turso)
async function ensureSchema() {
  try {
    await db.shop.count();
    return true;
  } catch {
    // الجداول غير موجودة — محاولة إنشائها
    try {
      const baseUrl = process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
      const res = await fetch(`${baseUrl}/api/setup`, { method: 'POST' });
      return res.ok;
    } catch {
      return false;
    }
  }
}

/// تسجيل دخول المدير الأول
export async function POST(req: NextRequest) {
  const rl = withRateLimit(req, "super-admin-auth");
  if (!rl.ok) return rl.response;

  try {
    // التأكد من وجود الجداول
    const ready = await ensureSchema();
    if (!ready) {
      return NextResponse.json({ error: "قاعدة البيانات غير جاهزة بعد — حاول بعد قليل" }, { status: 503 });
    }

    const { password } = await req.json();
    if (!password) {
      return NextResponse.json({ error: "كلمة المرور مطلوبة" }, { status: 400 });
    }

    // جلب إعدادات المدير الأول
    let admin = await db.superAdmin.findUnique({ where: { key: "main" } });

    // إنشاء الصف الأول إذا لم يكن موجوداً
    if (!admin) {
      admin = await db.superAdmin.create({ data: { key: "main" } });
    }

    const isFirstTime = !admin.password || admin.password === "Admin@2025";

    if (isFirstTime) {
      // أول مرة: أنشئ رمز جلسة من كلمة المرور الافتراضية
      const ts = Date.now();
      const token = await simpleHash(`${admin.password || "Admin@2025"}:${ts}:${APP_SECRET}`);
      return NextResponse.json({ success: true, isFirstTime: true, ts, token });
    }

    if (admin.password === password) {
      // إنشاء رمز جلسة موقَّع
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