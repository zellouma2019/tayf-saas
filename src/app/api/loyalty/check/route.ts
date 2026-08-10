import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// مستويات الولاء
const LOYALTY_TIERS = [
  { tier: "platinum", tierName: "بلاتيني", minAmount: 30000, discountPercent: 15, icon: "💎", color: "#8ECAE6" },
  { tier: "gold",     tierName: "ذهبي",   minAmount: 15000, discountPercent: 10, icon: "🥇", color: "#D4AF37" },
  { tier: "silver",   tierName: "فضي",     minAmount: 5000,  discountPercent: 5,  icon: "🥈", color: "#C0C0C0" },
  { tier: "bronze",   tierName: "برونزي",  minAmount: 0,     discountPercent: 0,  icon: "🥉", color: "#CD7F32" },
] as const;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const phone = (searchParams.get("phone") || "").replace(/[\s\-+]/g, "");

    if (!phone || phone.length < 8) {
      return NextResponse.json({ error: "رقم الهاتف غير صالح" }, { status: 400 });
    }

    // البحث عن العميل — نستخدم findFirst لأن phone ليس فريداً بمفرده
    // (الفهرس الفريد مركّب: [shopId, phone])
    let customer = await db.customer.findFirst({ where: { phone } });

    // إذا لم يكن العميل مسجلاً، نحاول إنشاؤه من الطلبات السابقة
    if (!customer) {
      const orders = await db.printOrder.findMany({
        where: { customer: { contains: phone } },
        orderBy: { createdAt: "desc" },
      });

      if (orders.length > 0) {
        const totalSpent = orders.reduce((sum, o) => sum + (o.total || 0), 0);
        const lastOrder = orders[0];
        let customerName = "";
        try {
          const parsed = JSON.parse(lastOrder.customer);
          customerName = parsed.name || "";
        } catch { /* ignore */ }

        customer = await db.customer.create({
          data: {
            phone,
            name: customerName || "عميل",
            totalOrders: orders.length,
            totalSpent,
            lastOrderAt: lastOrder.createdAt,
          },
        });
      } else {
        // عميل جديد بدون طلبات
        customer = await db.customer.create({
          data: {
            phone,
            name: "عميل جديد",
            totalOrders: 0,
            totalSpent: 0,
          },
        });
      }
    }

    // تحديد المستوى الحالي
    let currentTier = LOYALTY_TIERS[LOYALTY_TIERS.length - 1]; // bronze
    for (const t of LOYALTY_TIERS) {
      if (customer.totalSpent >= t.minAmount) {
        currentTier = t;
        break;
      }
    }

    // تحديد المستوى التالي
    const currentTierIndex = LOYALTY_TIERS.findIndex((t) => t.tier === currentTier.tier);
    const nextTier = currentTierIndex > 0 ? LOYALTY_TIERS[currentTierIndex - 1] : null;
    const pointsToNext = nextTier ? nextTier.minAmount - customer.totalSpent : 0;

    return NextResponse.json({
      phone: customer.phone,
      name: customer.name,
      totalOrders: customer.totalOrders,
      totalSpent: customer.totalSpent,
      tier: currentTier.tier,
      tierName: currentTier.tierName,
      tierIcon: currentTier.icon,
      tierColor: currentTier.color,
      discountPercent: currentTier.discountPercent,
      nextTier: nextTier ? nextTier.tierName : null,
      nextTierIcon: nextTier?.icon || null,
      nextTierAmount: nextTier ? nextTier.minAmount : null,
      pointsToNext,
      lastOrderAt: customer.lastOrderAt,
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}