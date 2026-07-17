import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

function generateReference(): string {
  const date = new Date();
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const rnd = Math.floor(1000 + Math.random() * 9000);
  return `${y}${m}${d}-${rnd}`;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const templateId = searchParams.get("templateId");
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const shopId = searchParams.get("shopId");

    const where: Record<string, unknown> = {};
    if (shopId) where.shopId = shopId;
    if (templateId) where.templateId = templateId;
    if (status && status !== "all") where.status = status;
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { data: { contains: search } },
      ];
    }

    const records = await db.formRecord.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { template: true },
    });

    return NextResponse.json({
      records: records.map((r) => ({
        ...r,
        data: JSON.parse(r.data),
      })),
    });
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const shopId = searchParams.get("shopId");
    const body = await req.json();
    const { templateId, title, status, priority, data } = body;

    // تأكد من وجود القالب
    const templateWhere: Record<string, unknown> = { id: templateId };
    if (shopId) templateWhere.shopId = shopId;
    const template = await db.formTemplate.findFirst({ where: templateWhere });
    if (!template) {
      return NextResponse.json({ error: "القالب غير موجود" }, { status: 404 });
    }

    // توليد رقم مرجعي فريد
    let reference = generateReference();
    let exists = await db.formRecord.findUnique({ where: { reference } });
    while (exists) {
      reference = generateReference();
      exists = await db.formRecord.findUnique({ where: { reference } });
    }

    const record = await db.formRecord.create({
      data: {
        reference,
        templateId,
        title: title || "—",
        status: status || "draft",
        priority: priority || "normal",
        data: JSON.stringify(data || {}),
        ...(shopId ? { shopId } : {}),
      },
      include: { template: true },
    });

    return NextResponse.json({
      ...record,
      data: JSON.parse(record.data),
    });
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message },
      { status: 500 },
    );
  }
}