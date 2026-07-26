import { NextRequest, NextResponse } from "next/server";
import { withRateLimit } from "@/lib/rate-limit";

/**
 * رفع الشعار — يحوّل الصورة إلى base64 data URL
 *
 * ملاحظة: على Vercel، نظام الملفات للقراءة فقط (لا يمكن الكتابة إلى public/uploads/).
 * الحل: نحوّل الصورة إلى data URL ونرجعه مباشرة، ويُخزَّن في platformSettings (DB).
 *
 * الحد الأقصى: 512 كيلوبايت (base64 يزيد الحجم ~33%، فيصبح ~683KB في DB — مقبول).
 */
export async function POST(req: NextRequest) {
  const rl = withRateLimit(req, "upload-logo");
  if (!rl.ok) return rl.response;

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const type = formData.get("type") as string | null;

    if (!file) {
      return NextResponse.json({ error: "لم يتم إرسال ملف" }, { status: 400 });
    }

    const validTypes = ["logo", "logoDark", "favicon"];
    if (!type || !validTypes.includes(type)) {
      return NextResponse.json({ error: "نوع الملف غير صالح" }, { status: 400 });
    }

    // 512KB limit — base64 encoding inflates by ~33%
    const MAX_SIZE = 512 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: `حجم الملف يتجاوز ${Math.round(MAX_SIZE / 1024)} كيلوبايت. يُرجى استخدام صورة أصغر.` },
        { status: 400 }
      );
    }

    const validMime = ["image/png", "image/jpeg", "image/svg+xml", "image/webp"];
    if (!validMime.includes(file.type)) {
      return NextResponse.json({ error: "نوع غير مدعوم. الأنواع المدعومة: PNG, JPEG, SVG, WebP" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Convert to base64 data URL — no filesystem write needed (works on Vercel)
    const base64 = buffer.toString("base64");
    const dataUrl = `data:${file.type};base64,${base64}`;

    return NextResponse.json({ success: true, url: dataUrl });
  } catch (e) {
    console.error("[upload-logo] error:", e);
    return NextResponse.json({ error: "خطأ في معالجة الصورة" }, { status: 500 });
  }
}
