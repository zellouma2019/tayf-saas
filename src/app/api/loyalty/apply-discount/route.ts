import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { tursoQuery, tursoExecute, toNum, safeJson } from "@/lib/turso-lite";

export const dynamic = "force-dynamic";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, x-admin-code",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

interface LoyaltyTier {
  tier: string;
  tierLabel: string;
  minOrders: number;
  discount: number;
}

const TIERS: LoyaltyTier[] = [
  { tier: "bronze",   tierLabel: "Bronze",   minOrders: 0,  discount: 0  },
  { tier: "silver",   tierLabel: "Silver",   minOrders: 5,  discount: 5  },
  { tier: "gold",     tierLabel: "Gold",     minOrders: 15, discount: 10 },
  { tier: "platinum", tierLabel: "Platinum", minOrders: 30, discount: 15 },
  { tier: "diamond",  tierLabel: "Diamond",  minOrders: 50, discount: 20 },
];

function getTier(orderCount: number): LoyaltyTier {
  let current = TIERS[0];
  for (const t of TIERS) {
    if (orderCount >= t.minOrders) current = t;
    else break;
  }
  return current;
}

export async function POST(req: NextRequest) {
  // Auth check
  const { authorized, error: authError } = await requireAdmin(req);
  if (!authorized) {
    return NextResponse.json(
      { error: "غير مصرح" },
      { status: 401, headers: CORS_HEADERS }
    );
  }

  try {
    const body = await req.json();
    const { orderId, shopId } = body;

    if (!orderId || !shopId) {
      return NextResponse.json(
        { error: "orderId و shopId مطلوبان" },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    // Fetch order with shopId isolation
    const orders = await tursoQuery<Record<string, unknown>>(
      `SELECT id, reference, total, customer, pricing, "shopId" FROM "PrintOrder" WHERE id = ? AND "shopId" = ? LIMIT 1`,
      [orderId, shopId]
    );

    const order = orders[0];
    if (!order) {
      return NextResponse.json(
        { error: "الطلب غير موجود" },
        { status: 404, headers: CORS_HEADERS }
      );
    }

    // Extract customer phone from JSON
    const customer = safeJson<{ phone?: string; name?: string }>(
      String(order.customer || "{}"),
      {}
    );
    const phone = customer.phone;
    if (!phone) {
      return NextResponse.json(
        { error: "لا يوجد رقم هاتف للعميل في الطلب" },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    // Count non-cancelled orders for loyalty calculation
    const stats = await tursoQuery<Record<string, unknown>>(
      `SELECT COUNT(*) as orderCount FROM "PrintOrder"
       WHERE customer LIKE ? AND "shopId" = ? AND status != 'cancelled'`,
      [`%"phone":"${phone}"%`, shopId]
    );

    const orderCount = toNum(stats[0]?.orderCount);
    const tier = getTier(orderCount);

    if (tier.discount === 0) {
      return NextResponse.json(
        { error: "العميل في مستوى برونزي ولا يوجد خصم متاح", tier: tier.tier },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    // Calculate discount
    const originalTotal = toNum(order.total);
    const discountAmount = Math.round(originalTotal * (tier.discount / 100));
    const newTotal = originalTotal - discountAmount;

    // Update pricing JSON with loyalty discount info
    const pricing = safeJson<Record<string, unknown>>(
      String(order.pricing || "{}"),
      {}
    );
    pricing.loyaltyDiscount = tier.discount;
    pricing.loyaltyDiscountAmount = discountAmount;
    pricing.loyaltyTier = tier.tier;
    pricing.originalTotal = originalTotal;
    pricing.total = newTotal;

    // Update the order
    const updateResult = await tursoExecute<Record<string, unknown>>(
      `UPDATE "PrintOrder" SET total = ?, pricing = ?, "updatedAt" = ? WHERE id = ? RETURNING *`,
      [newTotal, JSON.stringify(pricing), new Date().toISOString(), orderId]
    );

    if (!updateResult.rows[0]) {
      return NextResponse.json(
        { error: "فشل تطبيق الخصم" },
        { status: 500, headers: CORS_HEADERS }
      );
    }

    // Create AuditLog entry
    await tursoExecute(
      `INSERT INTO "AuditLog" (id, "shopId", "orderId", action, field, "oldValue", "newValue", details, "createdAt")
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        `audit_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        shopId,
        orderId,
        "loyalty_discount_applied",
        "total",
        String(originalTotal),
        String(newTotal),
        `${order.reference} — خصم ولاء ${tier.discount}% (${tier.tierLabel}) على طلب بقيمة ${originalTotal} → ${newTotal}`,
        new Date().toISOString(),
      ]
    );

    return NextResponse.json(
      {
        success: true,
        discount: tier.discount,
        discountAmount,
        newTotal,
        tier: tier.tier,
      },
      { headers: CORS_HEADERS }
    );
  } catch (e) {
    console.error("[loyalty/apply-discount/POST]", e);
    return NextResponse.json(
      { error: "حدث خطأ أثناء تطبيق الخصم" },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
