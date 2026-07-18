// تهيئة قاعدة البيانات — مباشرة بدون طلب HTTP
// يستخدم ensureDb من db.ts الذي ينشئ الجداول عبر SQL مباشرة
import { ensureDb } from "@/lib/db";

export async function ensureSchema(): Promise<boolean> {
  try {
    await ensureDb();
    return true;
  } catch {
    return false;
  }
}