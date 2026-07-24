import { NextRequest, NextResponse } from "next/server";
import { withRateLimit } from "@/lib/rate-limit";
import { getSuperAdmin, createSuperAdmin, updateSuperAdmin } from "@/lib/db-migrations";

export async function PUT(req: NextRequest) {
  const rl = withRateLimit(req, "super-admin-password");
  if (!rl.ok) return rl.response;

  try {
    const { currentPassword, newPassword } = await req.json();
    if (!newPassword) {
      return NextResponse.json({ error: "كلمة المرور الجديدة مطلوبة" }, { status: 400 });
    }
    if (newPassword.length < 6) {
      return NextResponse.json({ error: "كلمة المرور يجب أن تكون 6 أحرف على الأقل" }, { status: 400 });
    }

    let admin = await getSuperAdmin({ id: true, key: true, password: true }) as { password: string } | null;
    if (!admin) {
      admin = await createSuperAdmin() as { password: string };
    }

    const isFirstTime = !admin.password || admin.password === "Admin@2026";
    if (!isFirstTime) {
      if (!currentPassword) {
        return NextResponse.json({ error: "كلمة المرور الحالية مطلوبة" }, { status: 400 });
      }
      if (admin.password !== currentPassword) {
        return NextResponse.json({ error: "كلمة المرور الحالية غير صحيحة" }, { status: 401 });
      }
    }

    await updateSuperAdmin({ password: newPassword });
    return NextResponse.json({ success: true, isFirstTime });
  } catch {
    return NextResponse.json({ error: "خطأ في تحديث كلمة المرور" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await updateSuperAdmin({ password: "Admin@2026" });
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
    const admin = await getSuperAdmin({ id: true, key: true, password: true }) as { password: string } | null;
    const isDefault = !admin || !admin.password || admin.password === "Admin@2026";
    return NextResponse.json({ isDefault });
  } catch {
    return NextResponse.json({ error: "قاعدة البيانات غير جاهزة بعد — حاول بعد قليل" }, { status: 503 });
  }
}
