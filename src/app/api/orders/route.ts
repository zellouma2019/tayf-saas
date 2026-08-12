import { NextRequest, NextResponse } from "next/server";
import { tursoQuery, tursoQuerySafe, tursoExecute, toNum, safeJson } from "@/lib/turso-lite";
import { applyOfferCode } from "@/lib/offers";
import fs from "fs";
import path from "path";

export const maxDuration = 30;

import {
  generateReference,
  calculatePricing,
  estimateDeliveryHours,
  SERVICE_MAP,
  type ServiceType,
} from "@/lib/print-config";

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

/// استعلام كامل: كل الأعمدة بدون JOIN (عند وجود shopId)
const FULL_ORDERS_SQL = `SELECT
  id, reference, "serviceType", "serviceName",
  "fileName", "fileType", "fileSize",
  options, customer, delivery, pricing,
  "estimatedHours", status, pages, copies, total,
  "createdAt", "updatedAt", "readyAt", "deliveredAt",
  "startedPrintingAt", "completedPrintingAt",
  cost, tags, "adminNotes", "shopId"
FROM "PrintOrder" o`;

/// استعلام خفيف: بدون أعمدة JSON كبيرة (pricing, delivery)
const LIGHT_ORDERS_SQL = `SELECT
  id, reference, "serviceType", "serviceName",
  "fileName", "fileType", "fileSize",
  options, customer,
  "estimatedHours", status, pages, copies, total,
  "createdAt", "updatedAt", "readyAt", "deliveredAt",
  "startedPrintingAt", "completedPrintingAt",
  cost, tags, "adminNotes", "shopId"
FROM "PrintOrder" o`;

/// استعلام بسيط: أعمدة أساسية فقط (بدون JSON إطلاقاً)
const MINIMAL_ORDERS_SQL = `SELECT
  id, reference, "serviceType", "serviceName",
  "fileName", "fileType", "fileSize",
  status, pages, copies, total,
  "createdAt", "updatedAt",
  cost, "shopId"
FROM "PrintOrder" o`;

/// معالجة صف طلب مع كل الأعمدة
function parseFullOrder(o: Record<string, unknown>, noPreview: boolean) {
  const fileName = (o.fileName as string) || null;
  const fileType = (o.fileType as string) || null;
  const filePreview = noPreview ? null : fileName ? getFilePreview(fileName, fileType) : null;
  return {
    id: o.id,
    reference: o.reference,
    serviceType: o.serviceType,
    serviceName: o.serviceName,
    fileName,
    fileType,
    fileSize: o.fileSize != null ? toNum(o.fileSize) : null,
    options: safeJson(o.options as string, { pages: 1, copies: 1, color: "", paperSize: "", sides: "", binding: "", paperType: "", printRange: "all" }),
    customer: safeJson(o.customer as string, { name: "", phone: "", deliveryMethod: "pickup" }),
    delivery: safeJson((o as Record<string, unknown>).delivery as string, { mode: "pickup", date: "" }),
    pricing: safeJson((o as Record<string, unknown>).pricing as string, { perPage: 0, pagesCost: 0, copiesCost: 0, sidesSaving: 0, deliveryCost: 0, discount: 0, total: 0 }),
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
    tags: safeJson<string[]>(o.tags as string, []),
    adminNotes: o.adminNotes,
    shopId: o.shopId,
    filePreview,
  };
}

/// معالجة صف طلب خفيف (بدون pricing/delivery)
function parseLightOrder(o: Record<string, unknown>) {
  return {
    id: o.id,
    reference: o.reference,
    serviceType: o.serviceType,
    serviceName: o.serviceName,
    fileName: (o.fileName as string) || null,
    fileType: (o.fileType as string) || null,
    fileSize: o.fileSize != null ? toNum(o.fileSize) : null,
    options: safeJson(o.options as string, { pages: 1, copies: 1 }),
    customer: safeJson(o.customer as string, { name: "", phone: "" }),
    delivery: { mode: "pickup", date: "" },
    pricing: { perPage: 0, pagesCost: 0, copiesCost: 0, sidesSaving: 0, deliveryCost: 0, discount: 0, total: toNum(o.total) },
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
    tags: safeJson<string[]>(o.tags as string, []),
    adminNotes: o.adminNotes,
    shopId: o.shopId,
    filePreview: null as null,
  };
}

/// معالجة صف طلب بسيط (أعمدة أساسية فقط)
function parseMinimalOrder(o: Record<string, unknown>) {
  return {
    id: o.id,
    reference: o.reference,
    serviceType: o.serviceType,
    serviceName: o.serviceName,
    fileName: (o.fileName as string) || null,
    fileType: (o.fileType as string) || null,
    fileSize: o.fileSize != null ? toNum(o.fileSize) : null,
    options: { pages: toNum(o.pages), copies: toNum(o.copies), color: "", paperSize: "", sides: "", binding: "", paperType: "", printRange: "all" },
    customer: { name: "", phone: "", deliveryMethod: "pickup" },
    delivery: { mode: "pickup", date: "" },
    pricing: { perPage: 0, pagesCost: 0, copiesCost: 0, sidesSaving: 0, deliveryCost: 0, discount: 0, total: toNum(o.total) },
    estimatedHours: 0,
    status: o.status,
    pages: toNum(o.pages),
    copies: toNum(o.copies),
    total: toNum(o.total),
    createdAt: o.createdAt,
    updatedAt: o.updatedAt,
    readyAt: null,
    deliveredAt: null,
    startedPrintingAt: null,
    completedPrintingAt: null,
    cost: toNum(o.cost),
    tags: [] as string[],
    adminNotes: null,
    shopId: o.shopId,
    filePreview: null as null,
  };
}

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
    const noPreview = searchParams.get("noPreview") !== "false";

    // بناء شروط WHERE ديناميكياً
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
      const refPattern = /^A-\d{4,6}$/;
      if (refPattern.test(search)) {
        args.push(search);
        whereParts.push(`o.reference = ?`);
      } else {
        args.push(`${search}%`, `%${search}%`);
        whereParts.push(`(o.reference LIKE ? OR o.customer LIKE ?)`);
      }
    }
    if (shopId) {
      args.push(shopId);
      whereParts.push(`o.\"shopId\" = ?`);
    }

    const whereClause = whereParts.length > 0
      ? `WHERE ${whereParts.join(" AND ")}`
      : "";

    const offset = (page - 1) * limit;
    const orderClause = `ORDER BY o."createdAt" DESC`;
    const paginationClause = `LIMIT ? OFFSET ?`;

    // ─── الموازاة: طلبات + عدد ───
    const [ordersResult, countResult] = await Promise.all([
      tursoQuerySafe<Record<string, unknown>>(
        `${FULL_ORDERS_SQL} ${whereClause} ${orderClause} ${paginationClause}`,
        [...args, limit, offset],
        15000
      ),
      tursoQuerySafe<{ cnt: unknown }>(
        `SELECT COUNT(*) as cnt FROM "PrintOrder" o ${whereClause}`,
        args,
        8000
      ),
    ]);

    let orderRows = ordersResult.rows;
    let queryError = ordersResult.error;
    const total = toNum(countResult.rows[0]?.cnt);

    // ─── المستوى 1: إذا فشل الاستعلام الكامل، جرب الخفيف ───
    if (queryError && orderRows.length === 0 && total > 0) {
      console.warn("[orders/GET] Full query failed, trying light query:", queryError);
      const lightResult = await tursoQuerySafe<Record<string, unknown>>(
        `${LIGHT_ORDERS_SQL} ${whereClause} ${orderClause} ${paginationClause}`,
        [...args, limit, offset],
        15000
      );
      if (lightResult.rows.length > 0) {
        orderRows = lightResult.rows;
        queryError = undefined;
      } else {
        queryError = lightResult.error || queryError;
      }
    }

    // ─── المستوى 2: إذا فشل الخفيف، جرب البسيط ───
    if (queryError && orderRows.length === 0 && total > 0) {
      console.warn("[orders/GET] Light query failed, trying minimal query:", queryError);
      const minResult = await tursoQuerySafe<Record<string, unknown>>(
        `${MINIMAL_ORDERS_SQL} ${whereClause} ${orderClause} ${paginationClause}`,
        [...args, limit, offset],
        15000
      );
      if (minResult.rows.length > 0) {
        orderRows = minResult.rows;
        queryError = undefined;
      } else {
        queryError = minResult.error || queryError;
      }
    }

    // ─── تحديد مستوى البيانات ───
    const hasDelivery = "delivery" in (orderRows[0] || {});
    const hasPricing = "pricing" in (orderRows[0] || {});
    const hasOptions = "options" in (orderRows[0] || {});
    const hasCustomer = "customer" in (orderRows[0] || {});

    const isFull = hasDelivery && hasPricing && hasOptions && hasCustomer;
    const isLight = hasOptions && hasCustomer && !hasDelivery;
    const isMinimal = !hasOptions;

    const parseOrder = isFull
      ? (o: Record<string, unknown>) => parseFullOrder(o, noPreview)
      : isLight
        ? (o: Record<string, unknown>) => parseLightOrder(o)
        : (o: Record<string, unknown>) => parseMinimalOrder(o);

    return NextResponse.json({
      orders: orderRows.map(parseOrder),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      // معلومات المزامنة — تساعد الواجهة في اتخاذ قرارات أفضل
      _meta: {
        queryLevel: isFull ? "full" : isLight ? "light" : isMinimal ? "minimal" : "empty",
        error: queryError || undefined,
        countMatch: orderRows.length === total || total <= limit,
      },
    }, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    console.error('[orders/GET]', e);
    return NextResponse.json({
      error: "حدث خطأ أثناء جلب الطلبات",
      orders: [],
      pagination: { page: 1, limit: 50, total: 0, totalPages: 0 },
      _meta: { queryLevel: "error", error: (e as Error).message },
    }, { status: 500 });
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
        // فشل التحقق من العرض — تجاهله
      }
    }

    const estimatedHours = estimateDeliveryHours(delivery.mode, pages, copies);
    const reference = generateReference();
    const newId = `o_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
    const now = new Date().toISOString();

    const result = await tursoExecute(
      `INSERT INTO "PrintOrder" (
        id, reference, "serviceType", "serviceName",
        "fileName", "fileType", "fileSize", "fileData", "smartAnalysis",
        options, customer, delivery, pricing,
        "estimatedHours", status, pages, copies, total, cost,
        tags, "createdAt", "updatedAt", "shopId"
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, '[]', ?, ?, ?)`,
      [
        newId, reference, serviceType, service.name,
        fileName || null, fileType || null, fileSize || null,
        resolvedFileData || null,
        smartAnalysis ? JSON.stringify(smartAnalysis) : null,
        JSON.stringify(options), JSON.stringify(customer), JSON.stringify(delivery), JSON.stringify(pricing),
        estimatedHours, "pending", pages, copies, pricing.total,
        now, now, shopId || null,
      ]
    );

    if (!result || result.rowsAffected === 0) {
      console.error('[orders/POST] INSERT failed — no rows affected');
      return NextResponse.json({ error: "فشل إنشاء الطلب في قاعدة البيانات" }, { status: 500 });
    }

    return NextResponse.json({
      id: newId, reference, serviceType, serviceName: service.name,
      fileName: fileName || null, fileType: fileType || null, fileSize: fileSize || null,
      smartAnalysis: smartAnalysis || null,
      options, customer, delivery, pricing, estimatedHours,
      status: "pending", pages, copies, total: pricing.total,
      cost: 0, tags: [], adminNotes: null, shopId: shopId || null,
      createdAt: now, updatedAt: now,
    });
  } catch (e) {
    console.error('[orders/POST]', e);
    return NextResponse.json({ error: "حدث خطأ أثناء إنشاء الطلب" }, { status: 500 });
  }
}
