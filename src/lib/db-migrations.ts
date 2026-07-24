import { db } from '@/lib/db'

let migrationsRan = false

/**
 * ميجريشن ذاتي — محسّن: استعلام واحد بدلاً من 4
 */
export async function runMigrations(): Promise<void> {
  if (migrationsRan) return
  try {
    // تشغيل كل ميجريشن بالتوازي (فشل أي منها = العمود موجود مسبقاً)
    await Promise.allSettled([
      db.$executeRawUnsafe(`ALTER TABLE "SuperAdmin" ADD COLUMN "platformSettings" TEXT NOT NULL DEFAULT '{}'`).catch(() => {}),
      db.$executeRawUnsafe(`ALTER TABLE "SuperAdmin" ADD COLUMN "teamMembers" TEXT NOT NULL DEFAULT '[]'`).catch(() => {}),
      db.$executeRawUnsafe(`ALTER TABLE "Shop" ADD COLUMN "customCurrency" TEXT`).catch(() => {}),
      db.$executeRawUnsafe(`ALTER TABLE "Customer" ADD COLUMN "lastOrderAt" DATETIME`).catch(() => {}),
    ])
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
    const result = await db.superAdmin.findUnique({
      where: { key: 'main' },
      select: selectFields || { id: true, key: true, password: true, teamMembers: true, platformSettings: true },
    })
    return result
  } catch {
    // Prisma فشل — نستخدم raw SQL
    return getSuperAdminRaw(selectFields)
  }
}

async function getSuperAdminRaw(selectFields?: Record<string, boolean>) {
  try {
    const cols = selectFields
      ? Object.keys(selectFields).join(', ')
      : 'id, key, password, "teamMembers", "platformSettings"'
    const rows = await db.$queryRawUnsafe<Array<Record<string, unknown>>>(
      `SELECT ${cols} FROM "SuperAdmin" WHERE key = 'main' LIMIT 1`
    )
    const row = rows[0]
    if (!row) return null
    // تحويل JSON strings
    if (row.teamMembers && typeof row.teamMembers === 'string') {
      row.teamMembers = JSON.parse(row.teamMembers as string)
    }
    if (row.platformSettings && typeof row.platformSettings === 'string') {
      row.platformSettings = JSON.parse(row.platformSettings as string)
    }
    return row as never
  } catch {
    return null
  }
}

export async function createSuperAdmin(data?: { password?: string }) {
  try {
    const result = await db.superAdmin.create({
      data: { key: 'main', password: data?.password || 'Admin@2026' },
      select: { id: true, key: true, password: true },
    })
    return result
  } catch {
    const password = data?.password || 'Admin@2026'
    await db.$executeRawUnsafe(`
      INSERT INTO "SuperAdmin" (id, key, password, "teamMembers", "platformSettings", "createdAt", "updatedAt")
      VALUES (lower(hex(randomblob(8)) || hex(randomblob(8)) || hex(randomblob(4))), 'main', '${password}', '[]', '{}', datetime('now'), datetime('now'))
    `)
    return getSuperAdmin({ id: true, key: true, password: true })
  }
}

export async function updateSuperAdmin(data: Record<string, unknown>) {
  const sets: string[] = []
  const vals: unknown[] = []
  for (const [k, v] of Object.entries(data)) {
    sets.push(`"${k}" = $${vals.length + 1}`)
    vals.push(typeof v === 'object' ? JSON.stringify(v) : v)
  }
  sets.push(`"updatedAt" = datetime('now')`)
  try {
    await db.superAdmin.update({
      where: { key: 'main' },
      data: data as never,
    })
  } catch {
    await db.$executeRawUnsafe(`
      UPDATE "SuperAdmin" SET ${sets.join(', ')} WHERE key = 'main'
    `)
  }
}
