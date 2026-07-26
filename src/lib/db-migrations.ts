/**
 * SuperAdmin data layer — uses turso-lite (fast HTTP SQL client)
 * Replaces slow Prisma that caused 5-15s delays and PostgreSQL-style params ($1) bug.
 *
 * turso-lite forces HTTPS mode (no WebSocket) → 10x faster on Vercel serverless.
 * Uses SQLite positional params (?) — NOT PostgreSQL ($1).
 */
import { tursoQuery, tursoQueries, safeJson } from '@/lib/turso-lite'

let migrationsRan = false

/**
 * Self-migration — runs ALTER TABLE for any missing columns (idempotent).
 * Failures (column already exists) are silently ignored.
 */
export async function runMigrations(): Promise<void> {
  if (migrationsRan) return
  try {
    await Promise.allSettled([
      tursoQuery(`ALTER TABLE "SuperAdmin" ADD COLUMN "platformSettings" TEXT NOT NULL DEFAULT '{}'`).catch(() => {}),
      tursoQuery(`ALTER TABLE "SuperAdmin" ADD COLUMN "teamMembers" TEXT NOT NULL DEFAULT '[]'`).catch(() => {}),
      tursoQuery(`ALTER TABLE "SuperAdmin" ADD COLUMN "name" TEXT NOT NULL DEFAULT 'مدير'`).catch(() => {}),
      tursoQuery(`ALTER TABLE "Shop" ADD COLUMN "customCurrency" TEXT`).catch(() => {}),
      tursoQuery(`ALTER TABLE "Customer" ADD COLUMN "lastOrderAt" DATETIME`).catch(() => {}),
    ])
    migrationsRan = true
  } catch (e) {
    console.warn('[migration] Failed:', e)
  }
}

/**
 * Fetch the single SuperAdmin row. Returns only requested fields (or all by default).
 */
export async function getSuperAdmin(selectFields?: Record<string, boolean>) {
  const fields = selectFields
    ? Object.keys(selectFields).map((k) => `"${k}"`).join(', ')
    : 'id, key, password, name, "teamMembers", "platformSettings"'

  const rows = await tursoQuery<Record<string, unknown>>(
    `SELECT ${fields} FROM "SuperAdmin" WHERE key = 'main' LIMIT 1`
  )
  const row = rows[0]
  if (!row) return null

  // Parse JSON columns if present
  if (row.teamMembers && typeof row.teamMembers === 'string') {
    row.teamMembers = safeJson(row.teamMembers as string, [])
  }
  if (row.platformSettings && typeof row.platformSettings === 'string') {
    row.platformSettings = safeJson(row.platformSettings as string, {})
  }
  return row as never
}

/**
 * Create the SuperAdmin row with defaults. Used on first setup.
 */
export async function createSuperAdmin(data?: { password?: string; name?: string }) {
  const password = data?.password || 'Admin@2026'
  const name = data?.name || 'مدير'
  await tursoQuery(
    `INSERT INTO "SuperAdmin" (id, key, password, name, "teamMembers", "platformSettings", "createdAt", "updatedAt")
     VALUES (lower(hex(randomblob(8)) || hex(randomblob(8)) || hex(randomblob(4))), 'main', ?, ?, '[]', '{}', datetime('now'), datetime('now'))`,
    [password, name]
  )
  return getSuperAdmin({ id: true, key: true, password: true, name: true })
}

/**
 * Update SuperAdmin fields. Uses SQLite positional params (?), NOT PostgreSQL ($1).
 */
export async function updateSuperAdmin(data: Record<string, unknown>) {
  const sets: string[] = []
  const vals: unknown[] = []
  for (const [k, v] of Object.entries(data)) {
    sets.push(`"${k}" = ?`)
    vals.push(typeof v === 'object' ? JSON.stringify(v) : v)
  }
  sets.push(`"updatedAt" = datetime('now')`)
  await tursoQuery(
    `UPDATE "SuperAdmin" SET ${sets.join(', ')} WHERE key = 'main'`,
    vals
  )
}

/**
 * Get-or-create SuperAdmin in a single round-trip pattern.
 * Used by auth routes to guarantee a row exists.
 */
export async function ensureSuperAdmin() {
  let admin = await getSuperAdmin({ id: true, key: true, password: true, name: true })
  if (!admin) {
    await createSuperAdmin()
    admin = await getSuperAdmin({ id: true, key: true, password: true, name: true })
  }
  return admin as { id: string; key: string; password: string; name: string } | null
}
