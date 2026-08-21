import { NextResponse } from "next/server";
import { readFileSync } from "fs";
import path from "path";

/**
 * Serves the pdfjs worker file via API route.
 * On Vercel, public/ static files can be unreliable for large JS files,
 * so we serve from node_modules directly.
 */
export async function GET() {
  try {
    // Try multiple path resolution strategies for Vercel serverless compatibility
    const possiblePaths = [
      path.join(process.cwd(), "node_modules", "pdfjs-dist", "build", "pdf.worker.min.mjs"),
      path.join(process.cwd(), ".next", "server", "node_modules", "pdfjs-dist", "build", "pdf.worker.min.mjs"),
    ];
    
    let content: Buffer | null = null;
    for (const p of possiblePaths) {
      try {
        content = readFileSync(p);
        break;
      } catch {
        continue;
      }
    }
    
    if (!content) {
      console.error("[pdf-worker] File not found in any path");
      return new NextResponse("Worker file not found", { status: 404 });
    }
    
    return new NextResponse(content, {
      headers: {
        "Content-Type": "application/javascript",
        "Cache-Control": "public, max-age=31536000, immutable",
        },
    });
  } catch (err) {
    console.error("[pdf-worker] Error:", err);
    return new NextResponse("Worker file error", { status: 500 });
  }
}
