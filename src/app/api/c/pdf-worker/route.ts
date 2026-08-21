import { NextResponse } from "next/server";
import { readFileSync } from "fs";
import path from "path";

/**
 * Serves the pdfjs worker file.
 * Used instead of public/ because Vercel sometimes doesn't serve large static files reliably.
 */
export async function GET() {
  try {
    const workerPath = require.resolve("pdfjs-dist/build/pdf.worker.min.mjs");
    const content = readFileSync(workerPath);
    return new NextResponse(content, {
      headers: {
        "Content-Type": "application/javascript",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new NextResponse("Worker file not found", { status: 404 });
  }
}
