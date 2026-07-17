import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { withRateLimit } from "@/lib/rate-limit";
import fs from "fs";
import path from "path";

export const maxDuration = 15;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const rl = withRateLimit(req, "shop-logo");
  if (!rl.ok) return rl.response;
  try {
    const { slug } = await params;
    const body = await req.json();
    const { logoDataUrl, adminPin } = body;

    if (!logoDataUrl || !adminPin) {
      return NextResponse.json({ error: "بيانات غير مكتملة" }, { status: 400 });
    }

    const shop = await db.shop.findUnique({ where: { slug } });
    if (!shop || shop.adminPin !== String(adminPin)) {
      return NextResponse.json({ error: "كلمة المرور غير صحيحة" }, { status: 403 });
    }

    // استخراج البيانات من Data URL
    const matches = logoDataUrl.match(/^data:image\/(\w+);base64,(.+)$/);
    if (!matches) {
      return NextResponse.json({ error: "صيغة الصورة غير صالحة" }, { status: 400 });
    }

    const ext = matches[1] === "jpeg" ? "jpg" : matches[1];
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, "base64");

    // حد أقصى 500KB
    if (buffer.length > 500 * 1024) {
      return NextResponse.json({ error: "حجم الصورة كبير جداً (الحد 500 ك.ب)" }, { status: 400 });
    }

    // حفظ الملف
    const uploadsDir = path.join(process.cwd(), "uploads", "logos");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const fileName = `logo_${slug}_${Date.now()}.${ext}`;
    const filePath = path.join(uploadsDir, fileName);

    // حذف الشعار القديم إذا كان ملفاً محلياً
    if (shop.logoUrl && shop.logoUrl.startsWith("/uploads/logos/")) {
      const oldPath = path.join(process.cwd(), shop.logoUrl);
      if (fs.existsSync(oldPath)) {
        try { fs.unlinkSync(oldPath); } catch {}
      }
    }

    fs.writeFileSync(filePath, buffer);
    const logoUrl = `/uploads/logos/${fileName}`;

    // تحديث المتجر
    await db.shop.update({
      where: { slug },
      data: { logoUrl },
    });

    return NextResponse.json({ success: true, logoUrl });
  } catch (e) {
    console.error('[shops/[slug]/logo]', e);
    return NextResponse.json({ error: "فشل رفع الشعار" }, { status: 500 });
  }
}