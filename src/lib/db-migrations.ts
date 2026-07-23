import { db } from '@/lib/db'

let migrationsRan = false

/**
 * ميجريشن ذاتي — يضيف الأعمدة الناقصة باستخدام Raw SQL
 * يعمل قبل أي استعلام Prisma على SuperAdmin
 */
export async function runMigrations(): Promise<void> {
  if (migrationsRan) return
  try {
    // محاولة إضافة الأعمدة الناقصة — نتجاهل الخطأ إذا كانت موجودة مسبقاً
    try {
      await db.$executeRawUnsafe(`
        ALTER TABLE "SuperAdmin" ADD COLUMN "platformSettings" TEXT NOT NULL DEFAULT '{}'
      `)
      console.log('[migration] Added platformSettings to SuperAdmin')
    } catch {
      // العمود موجود مسبقاً — هذا طبيعي
    }

    // التأكد من وجود عمود teamMembers
    try {
      await db.$executeRawUnsafe(`
        ALTER TABLE "SuperAdmin" ADD COLUMN "teamMembers" TEXT NOT NULL DEFAULT '[]'
      `)
      console.log('[migration] Added teamMembers to SuperAdmin')
    } catch {
      // العمود موجود مسبقاً — هذا طبيعي
    }

    migrationsRan = true
  } catch (e) {
    console.warn('[migration] Failed:', e)
  }
}

/**
 * Helper: جلب بيانات SuperAdmin بأمان (يتجنب الأعمدة الناقصة)
 */
export async function getSuperAdmin(selectFields?: Record<string, boolean>) {
  try {
    // محاولة عبر Prisma مع select
    const result = await db.superAdmin.findUnique({
      where: { key: 'main' },
      select: selectFields || { id: true, key: true, password: true, teamMembers: true, platformSettings: true },
    })
    return result
  } catch {
    // Fallback: raw SQL
    const fields = selectFields 
      ? Object.keys(selectFields).join(', ')
      : 'id, key, password, teamMembers, platformSettings'
    const rows = await db.$queryRawUnsafe<Record<string, unknown>[]>(
      `SELECT ${fields} FROM "SuperAdmin" WHERE key = 'main' LIMIT 1`
    )
    return rows[0] ?? null
  }
}

/**
 * Helper: إنشاء SuperAdmin بأمان عبر raw SQL
 */
export async function createSuperAdmin() {
  try {
    return await db.superAdmin.create({
      data: { key: 'main' },
      select: { id: true, key: true, password: true, teamMembers: true, platformSettings: true },
    })
  } catch {
    await db.$executeRawUnsafe(`
      INSERT INTO "SuperAdmin" (id, key, password, teamMembers, platformSettings, createdAt, updatedAt)
      VALUES (lower(hex(randomblob(8)) || hex(randomblob(8)) || hex(randomblob(4))), 'main', 'Admin@2025', '[]', '{}', datetime('now'), datetime('now'))
    `)
    return getSuperAdmin()
  }
}

/**
 * Helper: تحديث SuperAdmin بأمان
 */
export async function updateSuperAdmin(data: Record<string, unknown>) {
  const setClauses = Object.entries(data)
    .map(([k, v]) => {
      if (v === null || v === undefined) return `"${k}" = NULL`
      if (typeof v === 'string') return `"${k}" = '${v.replace(/'/g, "''")}'`
      return `"${k}" = ${v}`
    })
    .join(', ')

  try {
    await db.superAdmin.update({
      where: { key: 'main' },
      data: data as Record<string, string>,
    })
  } catch {
    await db.$executeRawUnsafe(
      `UPDATE "SuperAdmin" SET ${setClauses}, updatedAt = datetime('now') WHERE key = 'main'`
    )
  }
}
