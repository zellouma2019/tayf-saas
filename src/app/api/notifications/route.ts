import { NextRequest, NextResponse } from "next/server";
import { tursoQuery, tursoExecute, toNum, safeJson } from "@/lib/turso-lite";
import { requireAdmin } from "@/lib/admin-auth";

interface Notification {
  id: string;
  type: "new_order" | "status_change" | "stale_order" | "system";
  title: string;
  body: string;
  orderId?: string;
  read: boolean;
  createdAt: string;
}

/// إشعارات عبر turso-lite (أسرع 10x من Prisma على Vercel)
export async function GET(request: NextRequest) {
  const { authorized, error: authError } = await requireAdmin(request);
  if (!authorized) return authError;

  try {
    const { searchParams } = new URL(request.url);
    const since = searchParams.get("since");
    const shopId = searchParams.get("shopId");

    const sinceDate = since ? new Date(since) : new Date(Date.now() - 24 * 60 * 60 * 1000);
    const sinceISO = sinceDate.toISOString();

    const shopFilter = shopId ? `("shopId" = ? OR "shopId" IS NULL)` : "1=1";
    const args: unknown[] = shopId ? [shopId] : [];

    // جلب الطلبات الجديدة منذ since
    const newOrders = await tursoQuery(
      `SELECT id, customer, "serviceName", reference, "createdAt"
       FROM "PrintOrder"
       WHERE ${shopFilter} AND "createdAt" >= ?
       ORDER BY "createdAt" DESC LIMIT 20`,
      [...args, sinceISO]
    );

    const notifications: Notification[] = newOrders.map((o) => {
      const customer = safeJson(String(o.customer || "{}"), { name: "" });
      return {
        id: `new-${o.id}`,
        type: "new_order" as const,
        title: "طلب جديد",
        body: `${customer.name || "عميل"} — ${o.serviceName} — ${o.reference}`,
        orderId: String(o.id),
        read: false,
        createdAt: String(o.createdAt),
      };
    });

    // التحقق من الطلبات المتأخرة (pending > 2 ساعة أو printing > 4 ساعات)
    const staleThreshold = new Date(Date.now() - 2 * 60 * 60 * 1000);
    const staleISO = staleThreshold.toISOString();

    const staleOrders = await tursoQuery(
      `SELECT id, reference, status, "updatedAt"
       FROM "PrintOrder"
       WHERE ${shopFilter}
       AND status IN ('pending', 'printing')
       AND "createdAt" < ?
       ORDER BY "createdAt" ASC LIMIT 5`,
      [...args, staleISO]
    );

    for (const o of staleOrders) {
      notifications.push({
        id: `stale-${o.id}`,
        type: "stale_order",
        title: "طلب متأخر",
        body: `${o.reference} — ${String(o.status) === "pending" ? "لم يُبدأ بعد" : "قيد الطباعة منذ فترة"}`,
        orderId: String(o.id),
        read: false,
        createdAt: String(o.updatedAt),
      });
    }

    notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({ notifications: notifications.slice(0, 30) });
  } catch (e) {
    console.error('[notifications]', e);
    return NextResponse.json({ error: "حدث خطأ أثناء جلب الإشعارات" }, { status: 500 });
  }
}
