import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { withRateLimit } from "@/lib/rate-limit";

const APP_SECRET = "tayf_admin_session_2025";

async function simpleHash(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Raw SQL fallback — لا يعتمد على أعمدة قد تكون ناقصة في قاعدة البيانات
async function getAdminRaw(): Promise<{ id: string; key: string; password: string } | null> {
  try {
    const rows = await db.$queryRaw<Array<{ id: string; key: string; password: string }>>`
      SELECT id, key, password FROM "SuperAdmin" WHERE key = 'main' LIMIT 1
    `;
    return rows[0] ?? null;
  } catch {
    return null;
  }
}

async function createAdminRaw(): Promise<{ id: string; key: string; password: string }> {
  await db.$executeRawUnsafe(`
    INSERT INTO "SuperAdmin" (id, key, password, teamMembers, platformSettings, createdAt, updatedAt)
    VALUES (lower(hex(randomblob(8)) || hex(randomblob(8)) || hex(randomblob(4))), 'main', 'Admin@2026', '[]', '{}', datetime('now'), datetime('now'))
  `);
  const created = await getAdminRaw();
  return created!;
}

export async function POST(req: NextRequest) {
  const rl = withRateLimit(req, "super-admin-auth");
  if (!rl.ok) return rl.response;

  try {
    const { password } = await req.json();
    if (!password) {
      return NextResponse.json({ error: "كلمة المرور مطلوبة" }, { status: 400 });
    }

    // 1) محاولة Prisma مع select فقط (يتجنب الأعمدة الناقصة)
    let admin: { id: string; key: string; password: string } | null = null;
    let usedFallback = false;

    try {
      const result = await db.superAdmin.findUnique({
        where: { key: "main" },
        select: { id: true, key: true, password: true },
      });
      admin = result ? { id: result.id, key: result.key, password: result.password } : null;
    } catch {
      // Prisma فشل — نستخدم raw SQL
      usedFallback = true;
    }

    // 2) Fallback: raw SQL
    if (!admin) {
      admin = await getAdminRaw();
    }

    // 3) إنشاء الحساب إذا لم يكن موجوداً
    if (!admin) {
      try {
        // محاولة إنشاء عبر Prisma
        const result = await db.superAdmin.create({
          data: { key: "main" },
          select: { id: true, key: true, password: true },
        });
        admin = { id: result.id, key: result.key, password: result.password };
      } catch {
        // إنشاء عبر raw SQL
        admin = await createAdminRaw();
      }
    }

    const isFirstTime = !admin.password || admin.password === "Admin@2026";

    if (isFirstTime) {
      const ts = Date.now();
      const token = await simpleHash(`${admin.password || "Admin@2026"}:${ts}:${APP_SECRET}`);
      return NextResponse.json({ success: true, isFirstTime: true, ts, token });
    }

    if (admin.password === password) {
      const ts = Date.now();
      const token = await simpleHash(`${password}:${ts}:${APP_SECRET}`);
      return NextResponse.json({ success: true, isFirstTime: false, ts, token });
    }

    return NextResponse.json({ error: "كلمة المرور غير صحيحة" }, { status: 401 });
  } catch (e) {
    console.error("[super-admin/auth/POST]", e);
    return NextResponse.json({ error: "خطأ في التحقق" }, { status: 500 });
  }
}
