import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { withRateLimit } from "@/lib/rate-limit";
import { runMigrations } from "@/lib/db-migrations";

export async function PUT(req: NextRequest) {
  const rl = withRateLimit(req, "super-admin-password");
  if (!rl.ok) return rl.response;

  try {
    await runMigrations();

    const { currentPassword, newPassword } = await req.json();
    if (!newPassword) {
      return NextResponse.json({ error: "كلمة المرور الجديدة مطلوبة" }, { status: 400 });
    }
    if (newPassword.length < 6) {
      return NextResponse.json({ error: "كلمة المرور يجب أن تكون 6 أحرف على الأقل" }, { status: 400 });
    }

    let admin = await db.superAdmin.findUnique({ where: { key: "main" } });
    if (!admin) {
      admin = await db.superAdmin.create({ data: { key: "main" } });
    }

    const isFirstTime = !admin.password || admin.password === "Admin@2025";
    if (!isFirstTime) {
      if (!currentPassword) {
        return NextResponse.json({ error: "كلمة المرور الحالية مطلوبة" }, { status: 400 });
      }
      if (admin.password !== currentPassword) {
        return NextResponse.json({ error: "كلمة المرور الحالية غير صحيحة" }, { status: 401 });
      }
    }

    await db.superAdmin.update({ where: { key: "main" }, data: { password: newPassword } });
    return NextResponse.json({ success: true, isFirstTime });
  } catch {
    return NextResponse.json({ error: "خطأ في تحديث كلمة المرور" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await runMigrations();
    // إعادة تعيين كلمة المرور للافتراضية (طوارئ فقط)
    await db.superAdmin.update({
      where: { key: "main" },
      data: { password: "Admin@2025" },
    });
    return NextResponse.json({ success: true, message: "تم إعادة تعيين كلمة المرور" });
  } catch (e) {
    console.error('[password/PATCH]', e);
    return NextResponse.json({ error: "فشل إعادة التعيين" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const rl = withRateLimit(req, "super-admin-password-get");
  if (!rl.ok) return rl.response;

  try {
    await runMigrations();
    const admin = await db.superAdmin.findUnique({ where: { key: "main" } });
    const isDefault = !admin || !admin.password || admin.password === "Admin@2025";
    return NextResponse.json({ isDefault });
  } catch {
    return NextResponse.json({ error: "قاعدة البيانات غير جاهزة بعد — حاول بعد قليل" }, { status: 503 });
  }
}
