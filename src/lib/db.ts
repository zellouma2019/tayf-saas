import { PrismaClient } from '@prisma/client'
import { PrismaLibSQL } from '@prisma/adapter-libsql'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
  dbInitialized: boolean
  _ensureDbPromise: Promise<void> | undefined
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

export async function ensureDb() {
  if (globalForPrisma.dbInitialized) return

  // تجنب الاستعلامات المتكررة خلال نفس الطلب
  if (globalForPrisma._ensureDbPromise) return globalForPrisma._ensureDbPromise

  globalForPrisma._ensureDbPromise = (async () => {
    try {
      await db.shop.count()
      globalForPrisma.dbInitialized = true
    } catch {
      // فشل الاتصال — إعادة تعيين للسماح بالمحاولة مرة أخرى
      globalForPrisma._ensureDbPromise = undefined
      console.log('[DB] Database connection failed, will retry on next request')
    }
  })()

  return globalForPrisma._ensureDbPromise
}