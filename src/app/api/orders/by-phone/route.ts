import { NextRequest, NextResponse } from "next/server";
import { tursoQuery, toNum, safeJson } from "@/lib/turso-lite";

/// جلب الطلبات المرتبطة برقم هاتف عبر turso-lite (أسرع 10x من Prisma على Vercel)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const phone = (searchParams.get("phone") || "").trim();
    const shopId = searchParams.get("shopId");

    if (!phone || phone.length < 8) {
      return NextResponse.json({ orders: [], message: "رقم الهاتف قصير جداً" });
    }

    // تطبيع الرقم
    const normalized = phone.replace(/[\s\-+]/g, "");
    const phonePattern = `%${normalized.substring(0, 8)}%`;

    const shopFilter = shopId ? `AND ("shopId" = ? OR "shopId" IS NULL)` : "";
    const args: unknown[] = shopId ? [phonePattern, shopId] : [phonePattern];

    const orders = await tursoQuery(
      `SELECT * FROM "PrintOrder" WHERE customer LIKE ? ${shopFilter} ORDER BY "createdAt" DESC LIMIT 50`,
      args
    );

    return NextResponse.json({
      orders: orders.map((o) => ({
        ...o,
        options: safeJson(String(o.options || "{}"), {}),
        customer: safeJson(String(o.customer || "{}"), { name: "", phone: "" }),
        delivery: safeJson(String(o.delivery || "{}"), { mode: "pickup" }),
        pricing: safeJson(String(o.pricing || "{}"), { total: 0 }),
        smartAnalysis: o.smartAnalysis ? safeJson(String(o.smartAnalysis), null) : null,
        total: toNum(o.total),
        pages: toNum(o.pages),
        copies: toNum(o.copies),
        cost: toNum(o.cost),
      })),
      count: orders.length,
    });
  } catch (e) {
    console.error('[orders/by-phone]', e);
    return NextResponse.json({ error: "حدث خطأ أثناء البحث" }, { status: 500 });
  }
}
