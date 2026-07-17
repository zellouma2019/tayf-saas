import { PrismaClient } from '@prisma/client'
import { PrismaLibSQL } from '@prisma/adapter-libsql'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
  dbInitialized: boolean
}

function createPrismaClient() {
  const tursoUrl = process.env.TURSO_DATABASE_URL
  const tursoToken = process.env.TURSO_AUTH_TOKEN

  // إذا توفرت بيانات Turso → نستخدمها (Production / Vercel)
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

  // بدون Turso في بيئة الإنتاج → تحذير
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

// تهيئة تلقائية لقاعدة البيانات عند أول طلب (لـ Turso/Vercel)
export async function ensureDb() {
  if (globalForPrisma.dbInitialized) return
  try {
    await db.shop.count()
    globalForPrisma.dbInitialized = true
  } catch {
    // الجداول غير موجودة — تهيئة أولية
    console.log('[DB] Initializing database schema...')
    try {
      const res = await fetch(`${process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'}/api/setup`, {
        method: 'POST',
      })
      if (res.ok) {
        globalForPrisma.dbInitialized = true
        console.log('[DB] ✓ Database initialized successfully')
      }
    } catch (e) {
      console.error('[DB] Auto-initialization failed:', e)
    }
  }
}