import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { verifyAdminRequest } from "@/lib/admin-auth";

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2 MB
const ACCEPTED_EXTENSIONS = ["png", "jpg", "jpeg", "webp", "svg"];
const ACCEPTED_MIME: Record<string, string[]> = {
  png: ["image/png"],
  jpg: ["image/jpeg"],
  jpeg: ["image/jpeg"],
  webp: ["image/webp"],
  svg: ["image/svg+xml"],
};

export async function POST(req: NextRequest) {
  try {
    // Verify admin
    if (!(await verifyAdminRequest(req))) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "لم يتم إرسال ملف" }, { status: 400 });
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `حجم الملف ${(file.size / (1024 * 1024)).toFixed(1)} ميغابايت يتجاوز الحد الأقصى (2 ميغابايت)` },
        { status: 413 },
      );
    }

    // Extract and validate extension
    const originalName = file.name || "unknown";
    const ext = originalName.split(".").pop()?.toLowerCase() || "";

    if (!ACCEPTED_EXTENSIONS.includes(ext)) {
      return NextResponse.json(
        { error: `صيغة غير مدعومة. المدعوم: ${ACCEPTED_EXTENSIONS.join(", ")}` },
        { status: 400 },
      );
    }

    // Validate MIME type
    const allowedMimes = ACCEPTED_MIME[ext] || [];
    if (allowedMimes.length > 0 && !allowedMimes.includes(file.type)) {
      return NextResponse.json(
        { error: `نوع الملف غير مطابق للصيغة المحددة` },
        { status: 400 },
      );
    }

    // Ensure uploads directory exists
    const uploadsDir = path.join(process.cwd(), "uploads");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Generate unique filename
    const randomSuffix = crypto.randomBytes(8).toString("hex");
    const timestamp = Date.now();
    const storedFileName = `logo_${timestamp}_${randomSuffix}.${ext}`;
    const finalPath = path.join(uploadsDir, storedFileName);

    // Write file to disk
    const buffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(finalPath, buffer);

    return NextResponse.json({
      url: `/uploads/${storedFileName}`,
      storedFileName,
    });
  } catch (e) {
    console.error("Image upload error:", e);
    return NextResponse.json(
      { error: "فشل في رفع الصورة" },
      { status: 500 },
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    // Verify admin
    if (!(await verifyAdminRequest(req))) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const body = await req.json();
    const { url } = body;

    if (!url || typeof url !== "string" || !url.startsWith("/uploads/")) {
      return NextResponse.json({ error: "رابط غير صالح" }, { status: 400 });
    }

    const filename = url.replace("/uploads/", "");
    const filePath = path.join(process.cwd(), "uploads", filename);

    // Security: prevent directory traversal
    const resolvedPath = path.resolve(filePath);
    const uploadsDir = path.resolve(path.join(process.cwd(), "uploads"));
    if (!resolvedPath.startsWith(uploadsDir)) {
      return NextResponse.json({ error: "رابط غير صالح" }, { status: 400 });
    }

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: true, message: "الملف غير موجود بالفعل" });
  } catch (e) {
    console.error("Image delete error:", e);
    return NextResponse.json(
      { error: "فشل في حذف الصورة" },
      { status: 500 },
    );
  }
}
