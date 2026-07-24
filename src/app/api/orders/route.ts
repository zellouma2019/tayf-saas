import { NextRequest, NextResponse } from "next/server";
import { db, ensureDb } from "@/lib/db";
import fs from "fs";
import path from "path";
import { orderListWhere } from "@/lib/order-lookup";

export const maxDuration = 30;

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

    const baseWhere: Record<string, unknown> = {};
    if (status && status !== "all") baseWhere.status = status;
    if (phone) {
      baseWhere.customer = { contains: phone };
    }
    if (search) {
      baseWhere.OR = [
        { reference: { contains: search } },
        { customer: { contains: search } },
      ];
    }
    const where = orderListWhere(shopId, baseWhere);

    const selectForQuery = shopId
      ? { ...ORDER_LIST_SELECT, shop: false as const }
      : ORDER_LIST_SELECT;

    const [orders, total] = await Promise.all([
      db.printOrder.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        select: selectForQuery,
      }),
      db.printOrder.count({ where }),
    ]);

    return NextResponse.json({
      orders: (orders as OrderListRow[]).map((o) => {
        const filePreview = noPreview ? null : o.fileName ? getFilePreview(o.fileName, o.fileType) : null;
        let parsedTags: string[] = [];
        try { parsedTags = JSON.parse(o.tags || "[]"); } catch { parsedTags = []; }
        let parsedCustomer = { name: "", phone: "", deliveryMethod: "pickup" };
        try { parsedCustomer = { ...parsedCustomer, ...JSON.parse(o.customer || "{}") }; } catch { /* keep default */ }
        let parsedOptions = { pages: 1, copies: 1, color: "", paperSize: "", sides: "", binding: "", paperType: "", printRange: "all" };
        try { parsedOptions = { ...parsedOptions, ...JSON.parse(o.options || "{}") }; } catch { /* keep default */ }
        let parsedDelivery = { mode: "pickup", date: "" };
        try { parsedDelivery = { ...parsedDelivery, ...JSON.parse(o.delivery || "{}") }; } catch { /* keep default */ }
        let parsedPricing = { perPage: 0, pagesCost: 0, copiesCost: 0, sidesSaving: 0, deliveryCost: 0, discount: 0, total: 0 };
        try { parsedPricing = { ...parsedPricing, ...JSON.parse(o.pricing || "{}") }; } catch { /* keep default */ }
        return {
          ...o,
          options: parsedOptions,
          customer: parsedCustomer,
          delivery: parsedDelivery,
          pricing: parsedPricing,
          tags: parsedTags,
          filePreview,
          ...(o.shop ? { shopName: o.shop.name, shopSlug: o.shop.slug } : {}),
        };
      }),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (e) {
    console.error('[orders/GET]', e);
    return NextResponse.json({ error: "حدث خطأ أثناء جلب الطلبات" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureDb();
    const body = await req.json();
    const {
      serviceType,
      fileName,
      fileType,
      fileSize,
      fileData,
      smartAnalysis,
      options,
      customer,
      delivery,
      shopId: bodyShopId,
    } = body;
    const shopId = bodyShopId || req.nextUrl.searchParams.get("shopId");

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
    const clientTotal = typeof body.finalTotal === 'number' ? body.finalTotal : null;
    const finalTotal = clientTotal && clientTotal > 0 ? clientTotal : pricing.total;
    if (clientTotal && clientTotal > 0) {
      pricing.total = finalTotal;
      pricing.extrasCost = Math.max(0, finalTotal - pricing.copiesCost - (pricing.bindingCost || 0) - pricing.deliveryCost + (pricing.discount || 0));
    }
    const estimatedHours = estimateDeliveryHours(delivery.mode, pages, copies);

    let reference = generateReference();
    let exists = await db.printOrder.findUnique({ where: { reference } });
    while (exists) {
      reference = generateReference();
      exists = await db.printOrder.findUnique({ where: { reference } });
    }

    const order = await db.printOrder.create({
      data: {
        reference,
        serviceType,
        serviceName: service.name,
        fileName: fileName || null,
        fileType: fileType || null,
        fileSize: fileSize || null,
        fileData: fileData || null,
        smartAnalysis: smartAnalysis ? JSON.stringify(smartAnalysis) : null,
        options: JSON.stringify(options),
        customer: JSON.stringify(customer),
        delivery: JSON.stringify(delivery),
        pricing: JSON.stringify(pricing),
        estimatedHours,
        status: "pending",
        pages,
        copies,
        total: pricing.total,
        ...(shopId ? { shopId } : {}),
      },
    });

    return NextResponse.json({
      ...order,
      options: JSON.parse(order.options),
      customer: JSON.parse(order.customer),
      delivery: JSON.parse(order.delivery),
      pricing: JSON.parse(order.pricing),
      smartAnalysis: order.smartAnalysis ? JSON.parse(order.smartAnalysis) : null,
    });
  } catch (e) {
    console.error('[orders/POST]', e);
    return NextResponse.json({ error: "حدث خطأ أثناء إنشاء الطلب" }, { status: 500 });
  }
}
