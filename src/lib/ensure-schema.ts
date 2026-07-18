export async function ensureSchema(): Promise<boolean> {
  try {
    const { db } = await import("@/lib/db");
    await db.shop.count();
    return true;
  } catch {
    try {
      const baseUrl = process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
      const res = await fetch(`${baseUrl}/api/setup`, { method: 'POST' });
      return res.ok;
    } catch {
      return false;
    }
  }
}