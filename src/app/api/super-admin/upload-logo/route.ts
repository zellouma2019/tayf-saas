import { NextRequest, NextResponse } from "next/server";
import { withRateLimit } from "@/lib/rate-limit";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

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

    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json({ error: "حجم الملف يتجاوز 2 ملف" }, { status: 400 });
    }

    const validMime = ["image/png", "image/jpeg", "image/svg+xml", "image/webp"];
    if (!validMime.includes(file.type)) {
      return NextResponse.json({ error: "نوع غير مدعوم" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const ext = file.name.split(".").pop() || "png";
    const fileName = `platform-${type}-${Date.now()}.${ext}`;
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadsDir, { recursive: true });
    await writeFile(path.join(uploadsDir, fileName), buffer);

    return NextResponse.json({ success: true, url: `/uploads/${fileName}` });
  } catch {
    return NextResponse.json({ error: "خطأ" }, { status: 500 });
  }
}