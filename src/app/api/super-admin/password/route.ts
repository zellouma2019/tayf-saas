import { NextRequest, NextResponse } from "next/server";
import { db, ensureDb } from "@/lib/db";
import { withRateLimit } from "@/lib/rate-limit";

/// تغيير كلمة مرور المدير الأول
export async function PUT(req: NextRequest) {
  const rl = withRateLimit(req, "super-admin-password");
  if (!rl.ok) return rl.response;

  try {
    // يجب انتظار تهيئة قاعدة البيانات
    await ensureDb();

    const { currentPassword, newPassword } = await req.json();

    if (!newPassword) {
      return NextResponse.json({ error: "كلمة المرور الجديدة مطلوبة" }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: "كلمة المرور يجب أن تكون 6 أحرف على الأقل" },
        { status: 400 },
      );
    }

    let admin = await db.superAdmin.findUnique({ where: { key: "main" } });
    if (!admin) {
      admin = await db.superAdmin.create({ data: { key: "main" } });
    }

    // أول مرة: لا نطلب كلمة المرور الحالية
    const isFirstTime = !admin.password || admin.password === "Admin@2025";
    if (!isFirstTime) {
      if (!currentPassword) {
        return NextResponse.json({ error: "كلمة المرور الحالية مطلوبة" }, { status: 400 });
      }
      if (admin.password !== currentPassword) {
        return NextResponse.json({ error: "كلمة المرور الحالية غير صحيحة" }, { status: 401 });
      }
    }

    await db.superAdmin.update({
      where: { key: "main" },
      data: { password: newPassword },
    });

    // التحقق من الحفظ الفعلي
    const saved = await db.superAdmin.findUnique({ where: { key: "main" } });
    if (!saved || saved.password !== newPassword) {
      console.error('[super-admin/password/PUT] Password save verification failed');
      return NextResponse.json({ error: "فشل حفظ كلمة المرور" }, { status: 500 });
    }

    return NextResponse.json({ success: true, isFirstTime });
  } catch (e) {
    console.error('[super-admin/password/PUT]', e);
    return NextResponse.json({ error: "خطأ في تحديث كلمة المرور" }, { status: 500 });
  }
}

/// جلب حالة كلمة المرور (هل هي الافتراضية؟)
export async function GET(req: NextRequest) {
  const rl = withRateLimit(req, "super-admin-password-get");
  if (!rl.ok) return rl.response;

  try {
    // يجب انتظار تهيئة قاعدة البيانات
    await ensureDb();

    const admin = await db.superAdmin.findUnique({ where: { key: "main" } });
    const isDefault = !admin || !admin.password || admin.password === "Admin@2025";
    const hasPassword = admin && admin.password && admin.password !== "Admin@2025";
    return NextResponse.json({ isDefault, hasPassword });
  } catch (e) {
    console.error('[super-admin/password/GET]', e);
    return NextResponse.json({ error: "خطأ في جلب حالة كلمة المرور" }, { status: 500 });
  }
}