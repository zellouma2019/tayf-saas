import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { addAuditLog } from "@/lib/audit";
import { STATUS_META, calculatePricing, estimateDeliveryHours } from "@/lib/print-config";
import type { ServiceType } from "@/lib/print-config";
import { tursoQuery, tursoExecute, safeJson, toNum } from "@/lib/turso-lite";

export const dynamic = "force-dynamic";

/// قراءة طلب واحد عبر turso-lite (أسرع من Prisma على Vercel)
async function fetchOrderRaw(id: string, shopId: string | null) {
  const whereClause = shopId
    ? `WHERE id = ? AND ("shopId" = ? OR "shopId" IS NULL)`
    : `WHERE id = ?`;
  const args = shopId ? [id, shopId] : [id];
  const rows = await tursoQuery<Record<string, unknown>>(
    `SELECT * FROM "PrintOrder" ${whereClause} LIMIT 1`,
    args
  );
  return rows[0] || null;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const shopId = req.nextUrl.searchParams.get("shopId");
    const order = await fetchOrderRaw(id, shopId);
    if (!order) {
      return NextResponse.json({ error: "الطلب غير موجود" }, { status: 404 });
    }
    return NextResponse.json({
      ...order,
      total: toNum(order.total),
      pages: toNum(order.pages),
      copies: toNum(order.copies),
      cost: toNum(order.cost),
      estimatedHours: toNum(order.estimatedHours),
      fileSize: order.fileSize != null ? toNum(order.fileSize) : null,
      options: safeJson(String(order.options || "{}"), {}),
      customer: safeJson(String(order.customer || "{}"), {}),
      delivery: safeJson(String(order.delivery || "{}"), {}),
      pricing: safeJson(String(order.pricing || "{}"), {}),
      smartAnalysis: order.smartAnalysis ? safeJson(String(order.smartAnalysis), null) : null,
      statusNotes: order.statusNotes || null,
      adminNotes: order.adminNotes || null,
    });
  } catch (e) {
    console.error('[orders/[id]/GET]', e);
    return NextResponse.json({ error: "حدث خطأ أثناء جلب الطلب" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { authorized, error: authError } = await requireAdmin(req);
  if (!authorized) return authError;

  try {
    const { id } = await params;
    const body = await req.json();
    const shopId = body.shopId || req.nextUrl.searchParams.get("shopId");

    // جلب الطلب الحالي عبر turso-lite
    const existing = await fetchOrderRaw(id, shopId);
    if (!existing) {
      return NextResponse.json({ error: "الطلب غير موجود" }, { status: 404 });
    }

    // ===== تعديل حقول الطلب =====
    if (body.action === "edit") {
      const setClauses: string[] = [];
      const sqlArgs: unknown[] = [];
      const auditEntries: Array<{ field: string; oldValue: string; newValue: string }> = [];

      // حقول العميل (دمج جزئي)
      if (body.customer) {
        const oldCustomer = safeJson<Record<string, unknown>>(String(existing.customer || "{}"), {});
        const newCustomer = { ...oldCustomer, ...body.customer };
        setClauses.push(`customer = ?`);
        sqlArgs.push(JSON.stringify(newCustomer));
        for (const key of Object.keys(body.customer)) {
          if (String(oldCustomer[key]) !== String(body.customer[key])) {
            auditEntries.push({
              field: `customer.${key}`,
              oldValue: String(oldCustomer[key] || ""),
              newValue: String(body.customer[key]),
            });
          }
        }
      }

      if (body.adminNotes !== undefined) {
        setClauses.push(`"adminNotes" = ?`);
        sqlArgs.push(body.adminNotes);
        if ((existing.adminNotes as string) !== body.adminNotes) {
          auditEntries.push({
            field: "adminNotes",
            oldValue: String(existing.adminNotes || ""),
            newValue: body.adminNotes,
          });
        }
      }

      if (body.tags !== undefined) {
        setClauses.push(`tags = ?`);
        sqlArgs.push(typeof body.tags === "string" ? body.tags : JSON.stringify(body.tags));
      }

      if (body.cost !== undefined) {
        setClauses.push(`cost = ?`);
        sqlArgs.push(Number(body.cost));
      }

      // إعادة حساب الأسعار إذا تغيرت النسخ أو الصفحات
      const oldOptions = safeJson<Record<string, unknown>>(String(existing.options || "{}"), {});
      const oldDelivery = safeJson<{ mode?: string }>(String(existing.delivery || "{}"), {});
      let needsPriceRecalc = false;
      const existingCopies = toNum(existing.copies);
      const existingPages = toNum(existing.pages);

      if (body.copies !== undefined && body.copies !== existingCopies) {
        setClauses.push(`copies = ?`);
        sqlArgs.push(Number(body.copies));
        needsPriceRecalc = true;
        auditEntries.push({
          field: "copies",
          oldValue: String(existingCopies),
          newValue: String(body.copies),
        });
      }
      if (body.pages !== undefined && body.pages !== existingPages) {
        setClauses.push(`pages = ?`);
        sqlArgs.push(Number(body.pages));
        needsPriceRecalc = true;
        auditEntries.push({
          field: "pages",
          oldValue: String(existingPages),
          newValue: String(body.pages),
        });
      }

      if (needsPriceRecalc) {
        const pricing = calculatePricing({
          serviceType: existing.serviceType as ServiceType,
          pages: body.pages !== undefined ? Number(body.pages) : existingPages,
          copies: body.copies !== undefined ? Number(body.copies) : existingCopies,
          color: oldOptions.color as string | undefined,
          paperSize: oldOptions.paperSize as string | undefined,
          sides: oldOptions.sides as string | undefined,
          binding: oldOptions.binding as string | undefined,
          paperType: oldOptions.paperType as string | undefined,
          delivery: oldDelivery.mode,
        });
        setClauses.push(`total = ?`);
        sqlArgs.push(pricing.total);
        setClauses.push(`pricing = ?`);
        sqlArgs.push(JSON.stringify(pricing));
        const newEstimate = estimateDeliveryHours(
          oldDelivery.mode,
          body.pages !== undefined ? Number(body.pages) : existingPages,
          body.copies !== undefined ? Number(body.copies) : existingCopies,
        );
        setClauses.push(`"estimatedHours" = ?`);
        sqlArgs.push(newEstimate);
      }

      if (setClauses.length === 0) {
        return NextResponse.json({ error: "لا توجد بيانات للتحديث" }, { status: 400 });
      }

      setClauses.push(`"updatedAt" = ?`);
      sqlArgs.push(new Date().toISOString());
      sqlArgs.push(id);

      const result = await tursoExecute<Record<string, unknown>>(
        `UPDATE "PrintOrder" SET ${setClauses.join(", ")} WHERE id = ? RETURNING *`,
        sqlArgs
      );
      const updated = result.rows[0];
      if (!updated) {
        return NextResponse.json({ error: "فشل تحديث الطلب" }, { status: 500 });
      }

      // تسجيل كل التغييرات في السجل
      for (const entry of auditEntries) {
        await addAuditLog({
          orderId: id,
          action: "edit",
          field: entry.field,
          oldValue: entry.oldValue,
          newValue: entry.newValue,
          details: `${existing.reference} — تعديل ${entry.field}`,
        });
      }

      // استثناء fileData و smartAnalysis من الاستجابة
      const { fileData: _fd, smartAnalysis: _sa, ...orderWithoutFile } = updated;
      void _fd; void _sa;

      return NextResponse.json({
        ...orderWithoutFile,
        total: toNum(orderWithoutFile.total),
        pages: toNum(orderWithoutFile.pages),
        copies: toNum(orderWithoutFile.copies),
        cost: toNum(orderWithoutFile.cost),
        estimatedHours: toNum(orderWithoutFile.estimatedHours),
        fileSize: (orderWithoutFile as Record<string, unknown>).fileSize != null
          ? toNum((orderWithoutFile as Record<string, unknown>).fileSize)
          : null,
        options: safeJson(String(updated.options || "{}"), {}),
        customer: safeJson(String(updated.customer || "{}"), {}),
        delivery: safeJson(String(updated.delivery || "{}"), {}),
        pricing: safeJson(String(updated.pricing || "{}"), {}),
      });
    }

    // ===== تغيير الحالة =====
    const { status, statusNotes } = body;
    const oldStatus = String(existing.status);
    const setClauses: string[] = [`status = ?`];
    const sqlArgs: unknown[] = [status];

    // Save status notes if provided
    if (statusNotes !== undefined && statusNotes !== null && statusNotes !== '') {
      setClauses.push(`"statusNotes" = ?`);
      sqlArgs.push(statusNotes);
    }

    if (status === "printing" && !existing.startedPrintingAt) {
      setClauses.push(`"startedPrintingAt" = ?`);
      sqlArgs.push(new Date().toISOString());
    }
    if (status === "ready" && !existing.readyAt) {
      setClauses.push(`"readyAt" = ?`);
      sqlArgs.push(new Date().toISOString());
    }
    if (status === "ready" && !existing.completedPrintingAt) {
      setClauses.push(`"completedPrintingAt" = ?`);
      sqlArgs.push(new Date().toISOString());
    }
    if (status === "delivered" && !existing.deliveredAt) {
      setClauses.push(`"deliveredAt" = ?`);
      sqlArgs.push(new Date().toISOString());
    }

    setClauses.push(`"updatedAt" = ?`);
    sqlArgs.push(new Date().toISOString());
    sqlArgs.push(id);

    const result = await tursoExecute<Record<string, unknown>>(
      `UPDATE "PrintOrder" SET ${setClauses.join(", ")} WHERE id = ? RETURNING *`,
      sqlArgs
    );
    const order = result.rows[0];
    if (!order) {
      return NextResponse.json({ error: "فشل تحديث الحالة" }, { status: 500 });
    }

    await addAuditLog({
      orderId: id,
      action: "status_change",
      field: "status",
      oldValue: oldStatus,
      newValue: status,
      details: statusNotes
        ? `${existing.reference} → ${STATUS_META[status]?.label || status} (${statusNotes})`
        : `${existing.reference} → ${STATUS_META[status]?.label || status}`,
    });

    // استثناء fileData و smartAnalysis من استجابة تغيير الحالة
    const { fileData: _fd2, smartAnalysis: _sa2, ...orderWithoutFile } = order;
    void _fd2; void _sa2;

    return NextResponse.json({
      ...orderWithoutFile,
      total: toNum(orderWithoutFile.total),
      pages: toNum(orderWithoutFile.pages),
      copies: toNum(orderWithoutFile.copies),
      cost: toNum(orderWithoutFile.cost),
      estimatedHours: toNum(orderWithoutFile.estimatedHours),
      fileSize: (orderWithoutFile as Record<string, unknown>).fileSize != null
        ? toNum((orderWithoutFile as Record<string, unknown>).fileSize)
        : null,
      options: safeJson(String(order.options || "{}"), {}),
      customer: safeJson(String(order.customer || "{}"), {}),
      delivery: safeJson(String(order.delivery || "{}"), {}),
      pricing: safeJson(String(order.pricing || "{}"), {}),
    });
  } catch (e) {
    console.error('[orders/[id]/PUT]', e);
    return NextResponse.json({ error: "حدث خطأ أثناء تحديث الطلب" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { authorized, error: authError } = await requireAdmin(req);
  if (!authorized) return authError;

  try {
    const { id } = await params;
    const shopId = req.nextUrl.searchParams.get("shopId");
    const existing = await fetchOrderRaw(id, shopId);
    if (!existing) {
      return NextResponse.json({ error: "الطلب غير موجود" }, { status: 404 });
    }
    await addAuditLog({
      orderId: id,
      action: "delete",
      details: `حذف طلب ${existing.reference}`,
    });
    await tursoExecute(
      `DELETE FROM "PrintOrder" WHERE id = ?`,
      [id]
    );
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('[orders/[id]/DELETE]', e);
    return NextResponse.json({ error: "حدث خطأ أثناء حذف الطلب" }, { status: 500 });
  }
}
