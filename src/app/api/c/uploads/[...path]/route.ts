import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const MIME_MAP: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  gif: "image/gif",
  svg: "image/svg+xml",
  pdf: "application/pdf",
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  try {
    const { path: pathSegments } = await params;
    const relativePath = pathSegments.join("/");

    // Security: prevent directory traversal
    const resolvedPath = path.resolve(path.join(process.cwd(), "uploads", relativePath));
    const uploadsDir = path.resolve(path.join(process.cwd(), "uploads"));
    if (!resolvedPath.startsWith(uploadsDir)) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
    }

    if (!fs.existsSync(resolvedPath) || !fs.statSync(resolvedPath).isFile()) {
      return NextResponse.json({ error: "الملف غير موجود" }, { status: 404 });
    }

    const ext = resolvedPath.split(".").pop()?.toLowerCase() || "";
    const mimeType = MIME_MAP[ext] || "application/octet-stream";
    const buffer = fs.readFileSync(resolvedPath);

    // Cache images for 1 day, PDFs for 1 hour
    const maxAge = mimeType.startsWith("image/") ? 86400 : 3600;

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": mimeType,
        "Content-Length": buffer.length.toString(),
        "Cache-Control": `public, max-age=${maxAge}`,
      },
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
