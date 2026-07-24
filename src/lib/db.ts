import { PrismaClient } from '@prisma/client'
import { PrismaLibSQL } from '@prisma/adapter-libsql'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
  dbInitialized: boolean
  _ensureDbPromise: Promise<void> | undefined
  _migrationsRan: boolean
  _migrationsPromise: Promise<void> | undefined
}

function createPrismaClient() {
  const tursoUrl = process.env.TURSO_DATABASE_URL
  const tursoToken = process.env.TURSO_AUTH_TOKEN

  if (tursoUrl && tursoToken) {
    const adapter = new PrismaLibSQL({
      url: tursoUrl,
      authToken: tursoToken,
    })
    return new PrismaClient({
      adapter,
      log: ['error'],
    })
  }

  if (process.env.NODE_ENV === 'production') {
    console.warn(
      '[DB] ⚠️ TURSO_DATABASE_URL or TURSO_AUTH_TOKEN not set. ' +
      'Using local SQLite fallback. For Vercel deployment, add these env vars in Vercel Settings → Environment Variables.'
    )
  }

  return new PrismaClient({
    log: ['error'],
  })
}

export const db = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db

/**
 * Ensure the database is ready for queries.
 * - Without options: just ensures Prisma client is connected
 * - With { runMigrations: true }: also runs ALTER TABLE migrations for SuperAdmin table
 *
 * Important: Calls with runMigrations are tracked independently so they're never
 * skipped even if ensureDb() was called first without migrations.
 */
export async function ensureDb(options?: { runMigrations?: boolean }) {
  // If migrations requested and already done, just ensure DB is initialized
  if (options?.runMigrations && globalForPrisma._migrationsRan) {
    if (globalForPrisma.dbInitialized) return
    if (globalForPrisma._ensureDbPromise) return globalForPrisma._ensureDbPromise
  }

  // If DB already initialized and no migrations needed, return immediately
  if (globalForPrisma.dbInitialized && !options?.runMigrations) return

  // If there's already a pending init promise, return it
  if (globalForPrisma._ensureDbPromise) return globalForPrisma._ensureDbPromise

  // If migrations are needed and there's a pending migrations promise, wait for it
  if (options?.runMigrations && globalForPrisma._migrationsPromise) {
    return globalForPrisma._migrationsPromise
  }

  // Start the initialization
  globalForPrisma._ensureDbPromise = (async () => {
    try {
      if (options?.runMigrations && !globalForPrisma._migrationsRan) {
        globalForPrisma._migrationsPromise = (async () => {
          try {
            const { runMigrations } = await import('@/lib/db-migrations')
            await runMigrations()
            globalForPrisma._migrationsRan = true
          } catch {
            // Migration failed - non-critical, continue
          }
        })()
        await globalForPrisma._migrationsPromise
        globalForPrisma._migrationsPromise = undefined
      }
      globalForPrisma.dbInitialized = true
    } catch {
      globalForPrisma._ensureDbPromise = undefined
    }
  })()

  return globalForPrisma._ensureDbPromise
}
