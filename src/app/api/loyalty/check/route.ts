import { NextRequest, NextResponse } from "next/server";
import { tursoQuery, tursoExecute, toNum, safeJson } from "@/lib/turso-lite";

export const dynamic = "force-dynamic";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

interface LoyaltyTier {
  tier: string;
  tierLabel: string;
  tierLabelAr: string;
  minOrders: number;
  discount: number; // percentage
}

const TIERS: LoyaltyTier[] = [
  { tier: "bronze",    tierLabel: "Bronze",    tierLabelAr: "برونزي",   minOrders: 0,  discount: 0  },
  { tier: "silver",    tierLabel: "Silver",    tierLabelAr: "فضي",     minOrders: 5,  discount: 5  },
  { tier: "gold",      tierLabel: "Gold",      tierLabelAr: "ذهبي",    minOrders: 15, discount: 10 },
  { tier: "platinum",  tierLabel: "Platinum",  tierLabelAr: "بلاتيني", minOrders: 30, discount: 15 },
  { tier: "diamond",   tierLabel: "Diamond",   tierLabelAr: "ألماسي",   minOrders: 50, discount: 20 },
];

function getTier(orderCount: number): LoyaltyTier {
  let current = TIERS[0];
  for (const t of TIERS) {
    if (orderCount >= t.minOrders) current = t;
    else break;
  }
  return current;
}

function getNextTier(currentTier: LoyaltyTier): LoyaltyTier | null {
  const idx = TIERS.findIndex((t) => t.tier === currentTier.tier);
  if (idx < TIERS.length - 1) return TIERS[idx + 1];
  return null;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const phone = (searchParams.get("phone") || "").trim();
    const shopId = (searchParams.get("shopId") || "").trim();

    if (!phone) {
      return NextResponse.json(
        { error: "رقم الهاتف مطلوب" },
        { status: 400, headers: CORS_HEADERS }
      );
    }
    if (!shopId) {
      return NextResponse.json(
        { error: "shopId مطلوب" },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    // Count non-cancelled orders and sum totals for this phone + shopId
    const stats = await tursoQuery<Record<string, unknown>>(
      `SELECT
        COUNT(*) as orderCount,
        COALESCE(SUM(total), 0) as totalSpent
      FROM "PrintOrder"
      WHERE customer LIKE ?
        AND "shopId" = ?
        AND status != 'cancelled'`,
      [`%"phone":"${phone}"%`, shopId]
    );

    const totalOrders = toNum(stats[0]?.orderCount);
    const totalSpent = toNum(stats[0]?.totalSpent);

    const currentTier = getTier(totalOrders);
    const nextTier = getNextTier(currentTier);

    // Calculate progress towards next tier
    let progress = 100;
    if (nextTier) {
      const range = nextTier.minOrders - currentTier.minOrders;
      const current = totalOrders - currentTier.minOrders;
      progress = Math.min(100, Math.round((current / range) * 100));
    }

    // Upsert Customer record
    const existingCustomer = await tursoQuery<Record<string, unknown>>(
      `SELECT id, name FROM "Customer" WHERE phone = ? AND "shopId" = ? LIMIT 1`,
      [phone, shopId]
    );

    const now = new Date().toISOString();
    if (existingCustomer.length > 0) {
      await tursoExecute(
        `UPDATE "Customer" SET "totalOrders" = ?, "totalSpent" = ?, "lastOrderAt" = ?, "updatedAt" = ? WHERE id = ?`,
        [totalOrders, totalSpent, now, now, existingCustomer[0].id]
      );
    } else {
      await tursoExecute(
        `INSERT INTO "Customer" (id, "shopId", name, phone, "totalOrders", "totalSpent", "lastOrderAt", "createdAt", "updatedAt")
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          `cust_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          shopId,
          "",
          phone,
          totalOrders,
          totalSpent,
          now,
          now,
          now,
        ]
      );
    }

    return NextResponse.json(
      {
        tier: currentTier.tier,
        tierLabel: currentTier.tierLabel,
        tierLabelAr: currentTier.tierLabelAr,
        discount: currentTier.discount,
        totalOrders,
        totalSpent,
        minOrdersCurrent: currentTier.minOrders,
        minOrdersNext: nextTier?.minOrders ?? null,
        nextTier: nextTier?.tierLabel ?? null,
        nextTierAr: nextTier?.tierLabelAr ?? null,
        progress,
      },
      { headers: CORS_HEADERS }
    );
  } catch (e) {
    console.error("[loyalty/check/GET]", e);
    return NextResponse.json(
      { error: "حدث خطأ أثناء فحص مستوى الولاء" },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
