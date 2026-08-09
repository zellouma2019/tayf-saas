import { NextRequest, NextResponse } from "next/server";
import { tursoQuery, safeJson, toNum } from "@/lib/turso-lite";

export const dynamic = "force-dynamic";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET(req: NextRequest) {
  try {
    const shopId = req.nextUrl.searchParams.get("shopId");
    if (!shopId) {
      return NextResponse.json(
        { error: "shopId مطلوب" },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const rows = await tursoQuery<Record<string, unknown>>(
      `SELECT
        id, reference, "serviceType", "serviceName",
        rating, review, customer, "createdAt"
      FROM "PrintOrder"
      WHERE "shopId" = ?
        AND status = 'delivered'
        AND rating IS NOT NULL
        AND rating > 0
      ORDER BY "createdAt" DESC
      LIMIT 50`,
      [shopId]
    );

    const SERVICE_EMOJIS: Record<string, string> = {
      document: "🖨️",
      photo: "📸",
      binding: "📚",
      copy: "📄",
      card: "🪪",
      poster: "📜",
    };

    const reviews = rows.map((row) => {
      const customer = safeJson<{ name?: string; phone?: string }>(
        String(row.customer || "{}"),
        {}
      );
      const createdDate = row.createdAt
        ? String(row.createdAt)
        : "";

      return {
        id: row.id,
        serviceType: row.serviceType,
        serviceName: row.serviceName,
        serviceEmoji: SERVICE_EMOJIS[String(row.serviceType)] || "🖨️",
        rating: toNum(row.rating),
        review: row.review || null,
        createdAt: createdDate,
        customerName: customer.name || "عميل",
      };
    });

    return NextResponse.json({ reviews }, { headers: CORS_HEADERS });
  } catch (e) {
    console.error("[reviews/GET]", e);
    return NextResponse.json(
      { error: "حدث خطأ أثناء جلب المراجعات" },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
