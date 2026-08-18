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
    // Check /tmp/uploads (Vercel) first, then cwd/uploads (local dev)
    const tmpDir = "/tmp/uploads";
    const cwdDir = path.join(process.cwd(), "uploads");
    let resolvedPath: string | null = null;
    let baseDir = "";

    const tmpCandidate = path.resolve(path.join(tmpDir, relativePath));
    const cwdCandidate = path.resolve(path.join(cwdDir, relativePath));

    if (tmpCandidate.startsWith(path.resolve(tmpDir)) && fs.existsSync(tmpCandidate) && fs.statSync(tmpCandidate).isFile()) {
      resolvedPath = tmpCandidate;
      baseDir = tmpDir;
    } else if (cwdCandidate.startsWith(path.resolve(cwdDir)) && fs.existsSync(cwdCandidate) && fs.statSync(cwdCandidate).isFile()) {
      resolvedPath = cwdCandidate;
      baseDir = cwdDir;
    }

    if (!resolvedPath) {
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
