import { NextRequest, NextResponse } from "next/server";
import { tursoQuery, tursoExecute, toNum } from "@/lib/turso-lite";
import { requireAdmin } from "@/lib/admin-auth";

/// جلب الزبائن عبر turso-lite (أسرع 10x من Prisma على Vercel)
export async function GET(request: NextRequest) {
  const { authorized, error: authError } = await requireAdmin(request);
  if (!authorized) return authError;

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const shopId = searchParams.get("shopId");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));

    // بناء شروط WHERE
    const whereParts: string[] = [];
    const args: unknown[] = [];

    if (shopId) {
      args.push(shopId);
      whereParts.push(`("shopId" = ? OR "shopId" IS NULL)`);
    }
    if (search) {
      args.push(`%${search}%`, `%${search}%`);
      whereParts.push(`(name LIKE ? OR phone LIKE ?)`);
    }

    const whereClause = whereParts.length > 0 ? `WHERE ${whereParts.join(" AND ")}` : "";
    const offset = (page - 1) * limit;

    // استعلامان موازيان: الزبائن + العدد
    const [customerRows, countRows] = await Promise.all([
      tursoQuery(
        `SELECT * FROM "Customer" ${whereClause} ORDER BY "totalSpent" DESC LIMIT ? OFFSET ?`,
        [...args, limit, offset]
      ),
      tursoQuery<{ cnt: unknown }>(
        `SELECT COUNT(*) as cnt FROM "Customer" ${whereClause}`,
        args
      ),
    ]);

    const total = toNum(countRows[0]?.cnt);

    // تحويل البيانات لضمان الأنواع الصحيحة
    const customers = customerRows.map((r) => ({
      ...r,
      totalOrders: toNum(r.totalOrders),
      totalSpent: toNum(r.totalSpent),
    }));

    return NextResponse.json({
      customers,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (e) {
    console.error('[customers/GET]', e);
    return NextResponse.json({ error: "حدث خطأ أثناء جلب الزبائن" }, { status: 500 });
  }
}

/// إنشاء/مزامنة زبائن عبر turso-lite
export async function POST(request: NextRequest) {
  const { authorized, error: authError } = await requireAdmin(request);
  if (!authorized) return authError;

  try {
    const { searchParams } = new URL(request.url);
    const shopId = searchParams.get("shopId");
    const body = await request.json();
    const { action, phone, name, email, address, notes } = body;

    if (action === "sync") {
      // مزامنة الزبائن من الطلبات
      const orderWhere = shopId ? `WHERE ("shopId" = ? OR "shopId" IS NULL)` : "";
      const orderArgs = shopId ? [shopId] : [];

      const orderRows = await tursoQuery<{ customer: string; total: number; createdAt: string; status: string }>(
        `SELECT customer, total, "createdAt", status FROM "PrintOrder" ${orderWhere}`,
        orderArgs
      );

      const customerMap: Record<string, { name: string; email: string; address: string; orders: number; spent: number; lastOrder: string }> = {};

      for (const o of orderRows) {
        try {
          const c = JSON.parse(String(o.customer));
          const p = c.phone || c.whatsapp;
          if (!p) continue;
          if (!customerMap[p]) {
            customerMap[p] = { name: c.name || "", email: c.email || "", address: c.address || "", orders: 0, spent: 0, lastOrder: "0" };
          }
          customerMap[p].orders += 1;
          if (String(o.status) !== "cancelled") customerMap[p].spent += toNum(o.total);
          if (String(o.createdAt) > customerMap[p].lastOrder) customerMap[p].lastOrder = String(o.createdAt);
          if (c.email && !customerMap[p].email) customerMap[p].email = c.email;
          if (c.address && !customerMap[p].address) customerMap[p].address = c.address;
          if (c.name && !customerMap[p].name) customerMap[p].name = c.name;
        } catch { /* skip */ }
      }

      let synced = 0;
      const now = new Date().toISOString();
      for (const [custPhone, data] of Object.entries(customerMap)) {
        // التحقق من وجود الزبون
        const existingRows = await tursoQuery<{ id: string }>(
          `SELECT id FROM "Customer" WHERE phone = ? ${shopId ? `AND ("shopId" = ? OR "shopId" IS NULL)` : ""} LIMIT 1`,
          shopId ? [custPhone, shopId] : [custPhone]
        );

        if (existingRows.length > 0) {
          await tursoExecute(
            `UPDATE "Customer" SET name = ?, email = ?, address = ?, "totalOrders" = ?, "totalSpent" = ?, "lastOrderAt" = ?, "updatedAt" = ? WHERE id = ?`,
            [data.name || null, data.email || null, data.address || null, data.orders, data.spent, data.lastOrder, now, existingRows[0].id]
          );
        } else {
          await tursoExecute(
            `INSERT INTO "Customer" (id, phone, name, email, address, "totalOrders", "totalSpent", "lastOrderAt", "createdAt", "updatedAt", "shopId")
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [`c_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`, custPhone, data.name || null, data.email || null, data.address || null, data.orders, data.spent, data.lastOrder, now, now, shopId || null]
          );
        }
        synced++;
      }

      return NextResponse.json({ synced });
    }

    // إنشاء يدوي
    if (!phone || !name) {
      return NextResponse.json({ error: "الاسم والهاتف مطلوبان" }, { status: 400 });
    }

    const newId = `c_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
    const now = new Date().toISOString();

    const result = await tursoExecute(
      `INSERT INTO "Customer" (id, phone, name, email, address, notes, "createdAt", "updatedAt", "shopId")
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING *`,
      [newId, phone, name, email || null, address || null, notes || null, now, now, shopId || null]
    );

    const customer = result.rows[0];
    if (!customer) {
      return NextResponse.json({ error: "فشل إنشاء الزبون" }, { status: 500 });
    }

    return NextResponse.json(customer);
  } catch (e) {
    console.error('[customers/POST]', e);
    return NextResponse.json({ error: "حدث خطأ أثناء معالجة الطلب" }, { status: 500 });
  }
}
