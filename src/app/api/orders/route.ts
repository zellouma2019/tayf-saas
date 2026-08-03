import { NextRequest, NextResponse } from "next/server";
import { tursoQuery, tursoExecute, toNum, safeJson } from "@/lib/turso-lite";
import { applyOfferCode } from "@/lib/offers";
import fs from "fs";
import path from "path";

export const maxDuration = 30;
// إزالة force-dynamic للسماح بـ edge cache على GET (POST يبقى ديناميكي تلقائياً)

// استعلام قائمة الطلبات عبر turso-lite (أسرع 10x من Prisma على Vercel)
// كل الأعمدة النصية JSON تُمرّر كما هي ويتم parse على العميل
const ORDERS_LIST_SQL = `
  SELECT
    o.id, o.reference, o."serviceType", o."serviceName",
    o."fileName", o."fileType", o."fileSize",
    o.options, o.customer, o.delivery, o.pricing,
    o."estimatedHours", o.status, o.pages, o.copies, o.total,
    o."createdAt", o."updatedAt", o."readyAt", o."deliveredAt",
    o."startedPrintingAt", o."completedPrintingAt",
    o.cost, o.tags, o."adminNotes", o."shopId",
    s.name as "shopName", s.slug as "shopSlug"
  FROM "PrintOrder" o
  LEFT JOIN "Shop" s ON s.id = o."shopId"
`;

/// قراءة ملف مخزَّن على القرص وتحويله إلى Data URL (للصور فقط)
function getFilePreview(storedName: string, fileType: string | null): string | null {
  try {
    if (!storedName || !storedName.startsWith("file_")) return null;
    const imageTypes = ["PNG", "JPG", "JPEG", "WEBP", "GIF"];
    if (fileType && !imageTypes.includes(fileType.toUpperCase())) return null;

    const filePath = path.join(process.cwd(), "uploads", storedName);
    if (!fs.existsSync(filePath)) return null;
    const buffer = fs.readFileSync(filePath);
    const ext = storedName.split(".").pop()?.toLowerCase() || "";
    const mimeTypes: Record<string, string> = {
      png: "image/png",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      gif: "image/gif",
      webp: "image/webp",
    };
    const mime = mimeTypes[ext] || "image/png";
    return `data:${mime};base64,${buffer.toString("base64")}`;
  } catch {
    return null;
  }
}
import {
  generateReference,
  calculatePricing,
  estimateDeliveryHours,
  SERVICE_MAP,
  type ServiceType,
} from "@/lib/print-config";

// استثناء fileData و smartAnalysis من قوائم الطلبات لتجنب 504
const ORDER_LIST_SELECT = {
  id: true,
  reference: true,
  serviceType: true,
  serviceName: true,
  fileName: true,
  fileType: true,
  fileSize: true,
  options: true,
  customer: true,
  delivery: true,
  pricing: true,
  estimatedHours: true,
  status: true,
  pages: true,
  copies: true,
  total: true,
  createdAt: true,
  updatedAt: true,
  readyAt: true,
  deliveredAt: true,
  startedPrintingAt: true,
  completedPrintingAt: true,
  cost: true,
  tags: true,
  adminNotes: true,
  shopId: true,
  shop: { select: { name: true, slug: true } },
} as const;

type OrderListRow = {
  id: string;
  reference: string;
  serviceType: string;
  serviceName: string;
  fileName: string | null;
  fileType: string | null;
  fileSize: number | null;
  options: string;
  customer: string;
  delivery: string;
  pricing: string;
  estimatedHours: number;
  status: string;
  pages: number;
  copies: number;
  total: number;
  createdAt: Date;
  updatedAt: Date;
  readyAt: Date | null;
  deliveredAt: Date | null;
  startedPrintingAt: Date | null;
  completedPrintingAt: Date | null;
  cost: number;
  tags: string;
  adminNotes: string | null;
  shopId: string | null;
  shop?: { name: string; slug: string } | null;
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const phone = searchParams.get("phone");
    const shopId = searchParams.get("shopId");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const rawLimit = parseInt(searchParams.get("limit") || "50", 10);
    const limit = Math.min(10000, Math.max(1, rawLimit));
    const noPreview = searchParams.get("noPreview") !== "false"; // الافتراضي = بدون معاينة على Vercel

    // بناء شروط WHERE ديناميكياً (SQL مباشر بدلاً من Prisma)
    const whereParts: string[] = [];
    const args: unknown[] = [];
    if (status && status !== "all") {
      args.push(status);
      whereParts.push(`o.status = ?`);
    }
    if (phone) {
      args.push(`%${phone}%`);
      whereParts.push(`o.customer LIKE ?`);
    }
    if (search) {
      // تحسين: إذا كان البحث يطابق نمط المرجع نستخدم = (فهرس فريد)
      const refPattern = /^A-\d{4,6}$/;
      if (refPattern.test(search)) {
        args.push(search);
        whereParts.push(`o.reference = ?`);
      } else {
        args.push(`${search}%`, `%${search}%`);
        whereParts.push(`(o.reference LIKE ? OR o.customer LIKE ?)`);
      }
    }
    // دعم shopId — تحسين: استخدام = مباشرة (يستخدم الفهرس) بدلاً من OR IS NULL
    // الطلبات القديمة بدون shopId ستُظهر في لوحة الإدارة العامة فقط
    if (shopId) {
      args.push(shopId);
      whereParts.push(`o."shopId" = ?`);
    }

    const whereClause = whereParts.length > 0
      ? `WHERE ${whereParts.join(" AND ")}`
      : "";

    const offset = (page - 1) * limit;

    // استعلامان موازيان: الطلبات + العدد الإجمالي
    // turso-lite يستخدم HTTP mode مباشرة (أسرع 10x من Prisma على Vercel)
    // عند تحديد shopId: نستخدم استعلام بسيط بدون JOIN (أسرع وأكثر موثوقية)
    // بدون shopId: نستخدم LEFT JOIN لعرض اسم المتجر
    const useJoin = !shopId;
    const MAIN_SQL = useJoin
      ? `${ORDERS_LIST_SQL} ${whereClause} ORDER BY o."createdAt" DESC LIMIT ? OFFSET ?`
      : `SELECT id, reference, "serviceType", "serviceName",
          "fileName", "fileType", "fileSize",
          options, customer, delivery, pricing,
          "estimatedHours", status, pages, copies, total,
          "createdAt", "updatedAt", "readyAt", "deliveredAt",
          "startedPrintingAt", "completedPrintingAt",
          cost, tags, "adminNotes", "shopId",
          NULL as "shopName", NULL as "shopSlug"
        FROM "PrintOrder" o ${whereClause} ORDER BY o."createdAt" DESC LIMIT ? OFFSET ?`;

    let orderRows = await tursoQuery(
      MAIN_SQL,
      [...args, limit, offset]
    );
    const countRows = await tursoQuery<{ cnt: unknown }>(
      `SELECT COUNT(*) as cnt FROM "PrintOrder" o ${whereClause}`,
      args
    );

    // Turso DB fallback: if query returns 0 but COUNT > 0,
    // retry with simpler query (no JOIN)
    const total = toNum(countRows[0]?.cnt);
    if ((orderRows as unknown[]).length === 0 && total > 0) {
      const SIMPLE_ORDERS_SQL = `
        SELECT
          id, reference, "serviceType", "serviceName",
          "fileName", "fileType", "fileSize",
          options, customer, delivery, pricing,
          "estimatedHours", status, pages, copies, total,
          "createdAt", "updatedAt", "readyAt", "deliveredAt",
          "startedPrintingAt", "completedPrintingAt",
          cost, tags, "adminNotes", "shopId",
          NULL as "shopName", NULL as "shopSlug"
        FROM "PrintOrder" o
      `;
      orderRows = await tursoQuery(
        `${SIMPLE_ORDERS_SQL} ${whereClause} ORDER BY "createdAt" DESC LIMIT ? OFFSET ?`,
        [...args, limit, offset]
      );
    }

    return NextResponse.json({
      orders: (orderRows as Record<string, unknown>[]).map((o) => {
        const fileName = (o.fileName as string) || null;
        const fileType = (o.fileType as string) || null;
        const filePreview = noPreview ? null : fileName ? getFilePreview(fileName, fileType) : null;
        const parsedTags: string[] = safeJson<string[]>(o.tags as string, []);
        const parsedCustomer = safeJson(
          o.customer as string,
          { name: "", phone: "", deliveryMethod: "pickup" }
        );
        const parsedOptions = safeJson(
          o.options as string,
          { pages: 1, copies: 1, color: "", paperSize: "", sides: "", binding: "", paperType: "", printRange: "all" }
        );
        const parsedDelivery = safeJson(o.delivery as string, { mode: "pickup", date: "" });
        const parsedPricing = safeJson(
          o.pricing as string,
          { perPage: 0, pagesCost: 0, copiesCost: 0, sidesSaving: 0, deliveryCost: 0, discount: 0, total: 0 }
        );
        const shopName = o.shopName as string | undefined;
        const shopSlug = o.shopSlug as string | undefined;
        return {
          id: o.id,
          reference: o.reference,
          serviceType: o.serviceType,
          serviceName: o.serviceName,
          fileName,
          fileType,
          fileSize: o.fileSize != null ? toNum(o.fileSize) : null,
          options: parsedOptions,
          customer: parsedCustomer,
          delivery: parsedDelivery,
          pricing: parsedPricing,
          estimatedHours: toNum(o.estimatedHours),
          status: o.status,
          pages: toNum(o.pages),
          copies: toNum(o.copies),
          total: toNum(o.total),
          createdAt: o.createdAt,
          updatedAt: o.updatedAt,
          readyAt: o.readyAt,
          deliveredAt: o.deliveredAt,
          startedPrintingAt: o.startedPrintingAt,
          completedPrintingAt: o.completedPrintingAt,
          cost: toNum(o.cost),
          tags: parsedTags,
          adminNotes: o.adminNotes,
          shopId: o.shopId,
          filePreview,
          ...(shopName ? { shopName, shopSlug } : {}),
        };
      }),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }, {
      headers: {
        // لا تخزن مؤقتاً على edge — البيانات تتغير بسرعة مع طلبات جديدة
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    console.error('[orders/GET]', e);
    return NextResponse.json({ error: "حدث خطأ أثناء جلب الطلبات" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      serviceType,
      fileName,
      fileType,
      fileSize,
      fileData,
      storedFileName: bodyStoredFileName,
      smartAnalysis,
      options,
      customer,
      delivery,
      shopId: bodyShopId,
      appliedOfferCode,
    } = body;
    const shopId = bodyShopId || req.nextUrl.searchParams.get("shopId");

    // ─── معالجة بيانات الملف ───
    // ملفات صغيرة: fileData كـ base64 data URL
    // ملفات كبيرة: storedFileName يحتوي uploadId → نخزنه ببادئة __chunked__:
    // endpoints الـ file/preview تعرف تحلّ البيانات عبر file-resolver.ts
    let resolvedFileData: string | null = fileData || null;
    if (!resolvedFileData && bodyStoredFileName) {
      resolvedFileData = `__chunked__:${bodyStoredFileName}`;
    }

    const service = SERVICE_MAP[serviceType as ServiceType];
    if (!service) {
      return NextResponse.json({ error: "خدمة غير صالحة" }, { status: 400 });
    }

    const pages = Number(options.pages) || 1;
    const copies = Number(options.copies) || 1;
    // 🔒 احسب السعر على الخادم فقط — لا تثق أبداً بقيمة العميل
    const pricing = calculatePricing({
      serviceType: serviceType as ServiceType,
      pages,
      copies,
      color: options.color,
      paperSize: options.paperSize,
      sides: options.sides,
      binding: options.binding,
      paperType: options.paperType,
      delivery: delivery.mode,
    });

    // طبّق كود العرض على الخادم إن وُجد (تحقق صارم — بدون import ديناميكي)
    if (appliedOfferCode && typeof appliedOfferCode === "string") {
      try {
        const offerResult = applyOfferCode(
          appliedOfferCode,
          serviceType as ServiceType,
          pages,
          copies,
          pricing,
        );
        if (offerResult.valid && offerResult.pricing) {
          Object.assign(pricing, offerResult.pricing);
        }
      } catch {
        // فشل التحقق من العرض — تجاهله واستخدم السعر الأساسي
      }
    }

    const estimatedHours = estimateDeliveryHours(delivery.mode, pages, copies);

    // 🔥 مرجع فريد بدون فحص DB — generateReference يولّد 900,000 قيمة ممكنة
    const reference = generateReference();

    // ─── INSERT سريع بدون RETURNING * ───
    // يعود فقط بالـ id لتأكيد النجاح — نستخدم القيم المعروفة لبناء الاستجابة
    // هذا يوفر: قراءة البيانات الضخمة (fileData) من Turso + parse على الخادم
    const newId = `o_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
    const now = new Date().toISOString();

    await tursoExecute(
      `INSERT INTO "PrintOrder" (
        id, reference, "serviceType", "serviceName",
        "fileName", "fileType", "fileSize", "fileData", "smartAnalysis",
        options, customer, delivery, pricing,
        "estimatedHours", status, pages, copies, total, cost,
        tags, "createdAt", "updatedAt", "shopId"
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, '[]', ?, ?, ?)`,
      [
        newId,
        reference,
        serviceType,
        service.name,
        fileName || null,
        fileType || null,
        fileSize || null,
        resolvedFileData || null,
        smartAnalysis ? JSON.stringify(smartAnalysis) : null,
        JSON.stringify(options),
        JSON.stringify(customer),
        JSON.stringify(delivery),
        JSON.stringify(pricing),
        estimatedHours,
        "pending",
        pages,
        copies,
        pricing.total,
        now,
        now,
        shopId || null,
      ]
    );

    // ─── بناء الاستجابة مباشرة من القيم المعروفة ───
    // لا حاجة لـ RETURNING * — العميل يحتاج فقط: id, reference, serviceName, total, status
    // نتجنب إعادة fileData الضخم (ليس هناك حاجة له في الاستجابة)
    return NextResponse.json({
      id: newId,
      reference,
      serviceType,
      serviceName: service.name,
      fileName: fileName || null,
      fileType: fileType || null,
      fileSize: fileSize || null,
      // fileData: لا يُعاد للعميل (غير ضروري + يسبب بطء كبير)
      smartAnalysis: smartAnalysis || null,
      options,
      customer,
      delivery,
      pricing,
      estimatedHours,
      status: "pending",
      pages,
      copies,
      total: pricing.total,
      cost: 0,
      tags: [],
      adminNotes: null,
      shopId: shopId || null,
      createdAt: now,
      updatedAt: now,
    });
  } catch (e) {
    console.error('[orders/POST]', e);
    return NextResponse.json({ error: "حدث خطأ أثناء إنشاء الطلب" }, { status: 500 });
  }
}
