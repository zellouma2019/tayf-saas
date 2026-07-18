import { NextRequest, NextResponse } from "next/server";
import { db, ensureDb } from "@/lib/db";
import { withRateLimit } from "@/lib/rate-limit";

/// تسجيل دخول المدير الأول
export async function POST(req: NextRequest) {
  const rl = withRateLimit(req, "super-admin-auth");
  if (!rl.ok) return rl.response;

  try {
    ensureDb(); // لا ننتظر — التهيئة تحدث بالتوازي

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
      return NextResponse.json({ requiresSetup: true, isFirstTime: true });
    }

    if (admin.password === password) {
      return NextResponse.json({ success: true, isFirstTime: false });
    }

    return NextResponse.json({ error: "كلمة المرور غير صحيحة" }, { status: 401 });
  } catch (e) {
    console.error('[super-admin/auth/POST]', e);
    return NextResponse.json({ error: "خطأ في التحقق" }, { status: 500 });
  }
}