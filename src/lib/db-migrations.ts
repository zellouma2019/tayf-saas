import { db } from '@/lib/db';

let migrationsRan = false;

/**
 * ميجريشن ذاتي — يضيف الأعمدة الناقصة باستخدام Raw SQL
 * يعمل قبل أي استعلام Prisma على SuperAdmin
 */
export async function runMigrations(): Promise<void> {
  if (migrationsRan) return;
  try {
    const cols = await db.$queryRaw<Array<{ name: string }>>`
      PRAGMA table_info("SuperAdmin")
    `;
    const colNames = new Set(cols.map(c => c.name));

    if (!colNames.has('platformSettings')) {
      await db.$executeRawUnsafe(
        `ALTER TABLE "SuperAdmin" ADD COLUMN "platformSettings" TEXT NOT NULL DEFAULT '{}'`
      );
      console.log('[migration] Added platformSettings to SuperAdmin');
    }

    migrationsRan = true;
  } catch (e) {
    console.warn('[migration] Failed:', e);
  }
}