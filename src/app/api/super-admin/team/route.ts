import { NextRequest, NextResponse } from "next/server";
import { withRateLimit } from "@/lib/rate-limit";
import { getSuperAdmin, createSuperAdmin, updateSuperAdmin } from "@/lib/db-migrations";

interface TeamMember {
  email: string;
  name: string;
  role: string;
  addedAt: string;
}

/// جلب قائمة أعضاء الفريق
export async function GET(req: NextRequest) {
  const rl = withRateLimit(req, "super-admin-team-get");
  if (!rl.ok) return rl.response;

  try {
    let admin = await getSuperAdmin({ id: true, key: true, teamMembers: true }) as { teamMembers: string | null } | null;
    if (!admin) {
      admin = await createSuperAdmin() as { teamMembers: string | null };
    }
    const members: TeamMember[] = JSON.parse(admin.teamMembers || "[]");
    return NextResponse.json({ members });
  } catch {
    return NextResponse.json({ members: [] });
  }
}

/// إضافة عضو فريق جديد
export async function POST(req: NextRequest) {
  const rl = withRateLimit(req, "super-admin-team-post");
  if (!rl.ok) return rl.response;

  try {
    const { email, name, role } = await req.json();
    if (!email || !name) {
      return NextResponse.json({ error: "الإيميل والاسم مطلوبان" }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "إيميل غير صالح" }, { status: 400 });
    }

    let admin = await getSuperAdmin({ id: true, key: true, teamMembers: true }) as { teamMembers: string | null } | null;
    if (!admin) {
      admin = await createSuperAdmin() as { teamMembers: string | null };
    }

    const members: TeamMember[] = JSON.parse(admin.teamMembers || "[]");

    if (members.some((m) => m.email.toLowerCase() === email.toLowerCase())) {
      return NextResponse.json({ error: "هذا الإيميل مضاف مسبقاً" }, { status: 409 });
    }

    members.push({
      email: email.toLowerCase().trim(),
      name: name.trim(),
      role: role || "member",
      addedAt: new Date().toISOString(),
    });

    await updateSuperAdmin({ teamMembers: JSON.stringify(members) });
    return NextResponse.json({ success: true, members });
  } catch {
    return NextResponse.json({ error: "خطأ في إضافة العضو" }, { status: 500 });
  }
}

/// حذف عضو فريق
export async function DELETE(req: NextRequest) {
  const rl = withRateLimit(req, "super-admin-team-delete");
  if (!rl.ok) return rl.response;

  try {
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ error: "الإيميل مطلوب" }, { status: 400 });
    }

    const admin = await getSuperAdmin({ id: true, key: true, teamMembers: true }) as { teamMembers: string | null } | null;
    if (!admin) {
      return NextResponse.json({ error: "لا توجد بيانات" }, { status: 404 });
    }

    const members: TeamMember[] = JSON.parse(admin.teamMembers || "[]");
    const filtered = members.filter((m) => m.email !== email);

    if (filtered.length === members.length) {
      return NextResponse.json({ error: "العضو غير موجود" }, { status: 404 });
    }

    await updateSuperAdmin({ teamMembers: JSON.stringify(filtered) });
    return NextResponse.json({ success: true, members: filtered });
  } catch {
    return NextResponse.json({ error: "خطأ في حذف العضو" }, { status: 500 });
  }
}
