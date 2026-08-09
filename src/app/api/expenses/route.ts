import { NextRequest, NextResponse } from "next/server";
import { tursoQuery, tursoExecute, toNum } from "@/lib/turso-lite";
import { requireAdmin } from "@/lib/admin-auth";

/// جلب المصروفات عبر turso-lite (أسرع 10x من Prisma على Vercel)
export async function GET(request: NextRequest) {
  const { authorized, error: authError } = await requireAdmin(request);
  if (!authorized) return authError;

  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const shopId = searchParams.get("shopId");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50", 10)));

    // بناء شروط WHERE ديناميكياً
    const whereParts: string[] = [];
    const args: unknown[] = [];

    if (shopId) {
      args.push(shopId);
      whereParts.push(`("shopId" = ? OR "shopId" IS NULL)`);
    }
    if (category) {
      args.push(category);
      whereParts.push(`category = ?`);
    }
    if (from) {
      args.push(from);
      whereParts.push(`date >= ?`);
    }
    if (to) {
      args.push(to);
      whereParts.push(`date <= ?`);
    }

    const whereClause = whereParts.length > 0 ? `WHERE ${whereParts.join(" AND ")}` : "";
    const offset = (page - 1) * limit;

    // استعلامان موازيان: المصروفات + العدد + المجموع
    const [expenseRows, countRows, sumRows] = await Promise.all([
      tursoQuery(
        `SELECT * FROM "Expense" ${whereClause} ORDER BY date DESC LIMIT ? OFFSET ?`,
        [...args, limit, offset]
      ),
      tursoQuery<{ cnt: unknown }>(
        `SELECT COUNT(*) as cnt FROM "Expense" ${whereClause}`,
        args
      ),
      tursoQuery<{ total: unknown }>(
        `SELECT COALESCE(SUM(amount), 0) as total FROM "Expense" ${whereClause}`,
        args
      ),
    ]);

    const total = toNum(countRows[0]?.cnt);
    const totalAmount = toNum(sumRows[0]?.total);

    return NextResponse.json({
      expenses: expenseRows,
      totalAmount,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (e) {
    console.error('[expenses/GET]', e);
    return NextResponse.json({ error: "حدث خطأ أثناء جلب المصروفات" }, { status: 500 });
  }
}

/// إضافة مصروف عبر turso-lite
export async function POST(request: NextRequest) {
  const { authorized, error: authError } = await requireAdmin(request);
  if (!authorized) return authError;

  try {
    const { searchParams } = new URL(request.url);
    const shopId = searchParams.get("shopId");
    const body = await request.json();
    const { category, amount, description, date } = body;

    if (!category || !amount) {
      return NextResponse.json({ error: "الفئة والمبلغ مطلوبان" }, { status: 400 });
    }

    const newId = `exp_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
    const now = new Date().toISOString();
    const expenseDate = date ? new Date(date).toISOString() : now;

    const result = await tursoExecute(
      `INSERT INTO "Expense" (id, category, amount, description, date, "createdAt", "updatedAt", "shopId")
       VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING *`,
      [newId, category, Number(amount), description || null, expenseDate, now, now, shopId || null]
    );

    const expense = result.rows[0];
    if (!expense) {
      return NextResponse.json({ error: "فشل إضافة المصروف" }, { status: 500 });
    }

    return NextResponse.json(expense);
  } catch (e) {
    console.error('[expenses/POST]', e);
    return NextResponse.json({ error: "حدث خطأ أثناء إضافة المصروف" }, { status: 500 });
  }
}
