import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

/// عرض ملف من مجلد uploads بالاسم (للمعاينة قبل إنشاء الطلب)
export async function GET(req: NextRequest) {
  try {
    const file = req.nextUrl.searchParams.get("file");
    if (!file) {
      return NextResponse.json({ error: "missing file param" }, { status: 400 });
    }

    // منع path traversal
    const safeName = path.basename(file).replace(/\.\./g, "");
    if (!safeName || safeName.startsWith("/")) {
      return NextResponse.json({ error: "invalid file name" }, { status: 400 });
    }

    const filePath = path.join(process.cwd(), "uploads", safeName);

    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: "file not found" }, { status: 404 });
    }

    const ext = safeName.split(".").pop()?.toLowerCase() || "";
    const mimeMap: Record<string, string> = {
      pdf: "application/pdf",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      webp: "image/webp",
      gif: "image/gif",
      docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    };
    const contentType = mimeMap[ext] || "application/octet-stream";

    const buffer = fs.readFileSync(filePath);
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(safeName)}`,
        "Content-Length": buffer.length.toString(),
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
