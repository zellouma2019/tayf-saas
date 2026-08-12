import { NextRequest, NextResponse } from "next/server";
import { tursoQuery, safeJson } from "@/lib/turso-lite";
import ZAI from "z-ai-web-dev-sdk";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

const IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "webp", "gif", "bmp"];

function isImageFile(fileName: string | null | undefined): boolean {
  if (!fileName) return false;
  const ext = fileName.split(".").pop()?.toLowerCase() || "";
  return IMAGE_EXTENSIONS.includes(ext);
}

function isPdfFile(fileName: string | null | undefined, fileData: string | null | undefined): boolean {
  if (fileName?.toLowerCase().endsWith(".pdf")) return true;
  if (fileData?.startsWith("data:application/pdf")) return true;
  return false;
}

interface OrderRow {
  fileData: string | null;
  fileName: string | null;
  fileType: string | null;
  options: string | null;
  customer: string | null;
  adminNotes: string | null;
  smartAnalysis: string | null;
  pages: number;
  copies: number;
  serviceName: string;
  serviceType: string;
  tags: string | null;
}

/// بناء ملخص متطلبات العميل من بيانات الطلب
function buildRequirementsSummary(order: OrderRow): string {
  const lines: string[] = [];

  lines.push(`- نوع الخدمة: ${order.serviceName} (${order.serviceType})`);
  lines.push(`- عدد الصفحات: ${order.pages}`);
  lines.push(`- عدد النسخ المطلوبة: ${order.copies}`);

  if (order.options) {
    try {
      const opts = JSON.parse(order.options) as Record<string, unknown>;
      const optLines: string[] = [];
      for (const [k, v] of Object.entries(opts)) {
        if (v === undefined || v === null || v === "") continue;
        if (k === "notes" || k === "instructions" || k === "customerNotes") {
          optLines.push(`  • ملاحظات العميل: ${String(v)}`);
        } else {
          optLines.push(`  • ${k}: ${String(v)}`);
        }
      }
      if (optLines.length > 0) {
        lines.push("- خيارات الطباعة:");
        lines.push(...optLines);
      }
    } catch {}
  }

  if (order.adminNotes && order.adminNotes.trim()) {
    lines.push(`- ملاحظات/تعديلات مسجّلة: ${order.adminNotes.trim()}`);
  }

  if (order.tags) {
    try {
      const tags = JSON.parse(order.tags) as string[];
      if (Array.isArray(tags) && tags.length > 0) {
        lines.push(`- وسوم: ${tags.join("، ")}`);
      }
    } catch {}
  }

  return lines.join("\n");
}

const VERIFY_PROMPT = `أنت مساعد ذكي متخصص في مراجعة طلبات الطباعة قبل تنفيذها. مهمتك التحقق من أن الملف المراد طباعته يطابق متطلبات العميل، وتنبيه التاجر لأي اختلاف أو تعديل منسي قبل الطباعة لتفادي الخسائر.

إليك متطلبات العميل:
"""
{REQUIREMENTS}
"""

حلّل الملف/الصورة المرفق بدقة، وقارنه بالمتطلبات، ثم أجب بـ JSON فقط (بدون markdown، بدون نص إضافي، بدون \`\`\`):

{
  "canPrint": true|false,
  "confidence": <رقم 0-100>,
  "status": "match" | "warning" | "mismatch",
  "summary": "<جملة واحدة بالعربية تشرح حالة المطابقة>",
  "alerts": ["<تنبيه حرج 1>", "<تنبيه حرج 2>"],
  "warnings": ["<تحذير 1>", "<تحذير 2>"],
  "checks": [
    { "label": "<اسم الفحص>", "passed": true|false, "note": "<تفاصيل>" }
  ]
}

قواعد:
- "canPrint" = false فقط إذا كان هناك اختلاف جوهري يمنع الطباعة (مثلاً: العميل طلب تعديلاً ولم يُنفذ، أو الملف لا يطابق الخدمة المطلوبة إطلاقاً).
- "alerts" = مشاكل حرجة يجب على التاجر مراجعتها قبل الطباعة.
- "warnings" = ملاحظات غير حرجة لكن يستحسن الانتباه لها.
- "checks" = فحوصات منطقية مثل: "الصورة واضحة بما يكفي للطباعة"، "الألوان مطابقة للطلب"، "التعديلات المطلوبة منفّذة"، "اتجاه الصفحة صحيح".
- إذا كان الملف يحتوي على طلب تعديل صريح في الملاحظات (مثل: "أضف اسمي في الأعلى"، "غيّر اللون إلى أبيض وأسود")، تحقق من ظهور التعديل في الملف المعروض. إذا لم يظهر، ضع تنبيه حرج في alerts.
- كن دقيقاً ومحايداً. لا تخترع مشاكل غير موجودة. إذا كان كل شيء مطابقاً أعطِ canPrint=true و status="match" وقائمة alerts فارغة.

أجب بـ JSON فقط.`;

function parseVLMResponse(text: string) {
  let cleaned = text.trim();
  if (cleaned.startsWith("```json")) cleaned = cleaned.slice(7);
  else if (cleaned.startsWith("```")) cleaned = cleaned.slice(3);
  if (cleaned.endsWith("```")) cleaned = cleaned.slice(0, -3);
  cleaned = cleaned.trim();

  try {
    return JSON.parse(cleaned);
  } catch {}

  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    try {
      return JSON.parse(cleaned.substring(firstBrace, lastBrace + 1));
    } catch {}
  }
  throw new Error("تعذّر تحليل رد التحقق");
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const shopId = req.nextUrl.searchParams.get("shopId");

    const whereClause = shopId
      ? `WHERE id = ? AND ("shopId" = ? OR "shopId" IS NULL)`
      : `WHERE id = ?`;
    const args = shopId ? [id, shopId] : [id];

    const rows = await tursoQuery<OrderRow>(
      `SELECT "fileData", "fileName", "fileType", "options", "customer", "adminNotes", "smartAnalysis", "pages", "copies", "serviceName", "serviceType", "tags" FROM "PrintOrder" ${whereClause} LIMIT 1`,
      args,
    );

    const order = rows[0];
    if (!order) {
      return NextResponse.json({ error: "الطلب غير موجود" }, { status: 404 });
    }
    if (!order.fileData) {
      return NextResponse.json({
        success: false,
        canPrint: true,
        status: "no_file",
        summary: "لا يوجد ملف للتحقق منه — يمكن المتابعة يدوياً",
        alerts: [],
        warnings: ["لا يوجد ملف مرفق للتحقق الذكي"],
        checks: [],
        confidence: 0,
      });
    }

    const requirements = buildRequirementsSummary(order);
    const isImg = isImageFile(order.fileName);
    const isPdf = isPdfFile(order.fileName, order.fileData);

    let pdfThumbnail: string | null = null;
    if (isPdf && order.smartAnalysis) {
      const sa = safeJson<{ thumbnail?: string }>(order.smartAnalysis, {});
      if (sa?.thumbnail && sa.thumbnail.startsWith("data:image")) {
        pdfThumbnail = sa.thumbnail;
      }
    }

    let imageDataUrl: string | null = null;

    // دعم ملفات CDN: جلب البيانات عن بعد للتحقق
    let resolvedData = order.fileData;
    if (resolvedData?.startsWith("__cdn__:")) {
      try {
        const cdnUrl = resolvedData.replace("__cdn__:", "");
        const fetchRes = await fetch(cdnUrl);
        if (fetchRes.ok) {
          const contentType = fetchRes.headers.get("content-type") || "";
          if (contentType.startsWith("image/")) {
            const arrayBuf = await fetchRes.arrayBuffer();
            const base64 = Buffer.from(arrayBuf).toString("base64");
            resolvedData = `data:${contentType};base64,${base64}`;
          }
        }
      } catch {
        // فشل جلب CDN — نتابع بدون معاينة
      }
    }

    if (resolvedData?.startsWith("data:") && (isImg || isPdf)) {
      if (isImg) {
        imageDataUrl = resolvedData;
      } else if (pdfThumbnail) {
        imageDataUrl = pdfThumbnail;
      }
    }

    if (!imageDataUrl) {
      return NextResponse.json({
        success: true,
        canPrint: true,
        status: "no_preview",
        summary: "تعذّر التحليل البصري — راجع المتطلبات يدوياً قبل الطباعة",
        alerts: [],
        warnings: [
          "لا يمكن عرض معاينة بصرية لهذا النوع من الملفات",
          "تأكد يدوياً من أن الملف يطابق متطلبات العميل",
        ],
        checks: [],
        confidence: 0,
        requirements,
        fileName: order.fileName,
        fileType: order.fileType,
        isImage: isImg,
        isPdf,
      });
    }

    const prompt = VERIFY_PROMPT.replace("{REQUIREMENTS}", requirements);

    const zai = await ZAI.create();
    const response = await zai.chat.completions.createVision({
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: imageDataUrl } },
          ],
        },
      ],
      thinking: { type: "disabled" },
    });

    const raw = response.choices?.[0]?.message?.content;
    if (!raw) {
      return NextResponse.json({
        success: false,
        error: "لم يتم الحصول على رد من نموذج التحقق",
      });
    }

    let result;
    try {
      result = parseVLMResponse(raw);
    } catch {
      return NextResponse.json({
        success: false,
        error: "فشل تحليل رد التحقق",
      });
    }

    if (typeof result.canPrint !== "boolean") result.canPrint = true;
    if (typeof result.confidence !== "number") result.confidence = 50;
    result.confidence = Math.min(100, Math.max(0, Math.round(result.confidence)));
    if (!Array.isArray(result.alerts)) result.alerts = [];
    if (!Array.isArray(result.warnings)) result.warnings = [];
    if (!Array.isArray(result.checks)) result.checks = [];
    if (typeof result.summary !== "string") result.summary = "";
    if (!["match", "warning", "mismatch"].includes(result.status)) {
      result.status = result.alerts.length > 0 ? "mismatch" : result.warnings.length > 0 ? "warning" : "match";
    }

    return NextResponse.json({
      success: true,
      ...result,
      requirements,
      fileName: order.fileName,
      fileType: order.fileType,
      isImage: isImg,
      isPdf,
    });
  } catch (e) {
    console.error("[verify-print]", e);
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : "خطأ في التحقق" },
      { status: 500 },
    );
  }
}
