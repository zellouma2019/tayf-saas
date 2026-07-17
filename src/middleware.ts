import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// In-memory flag to track if DB initialization has been attempted.
// In serverless (Vercel), each cold-start instance will run init once.
let dbInitDone = false;

async function ensureDatabase(): Promise<void> {
  if (dbInitDone) return;
  dbInitDone = true;

  try {
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

    // Check if DB is already initialized
    try {
      const checkRes = await fetch(`${baseUrl}/api/setup`, {
        method: "GET",
        signal: AbortSignal.timeout(5000),
      });
      if (checkRes.ok) {
        const checkData = await checkRes.json() as { initialized?: boolean };
        if (checkData.initialized) {
          console.log("[middleware] Database already initialized");
          return;
        }
      }
    } catch {
      // GET failed, proceed to init
    }

    // Initialize the database
    console.log("[middleware] Initializing database...");
    const initRes = await fetch(`${baseUrl}/api/setup`, {
      method: "POST",
      signal: AbortSignal.timeout(30000),
    });
    if (initRes.ok) {
      console.log("[middleware] ✓ Database initialized via middleware");
    } else {
      console.error("[middleware] Database initialization returned:", initRes.status);
    }
  } catch (e) {
    console.error("[middleware] Database check/init error:", e);
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip setup endpoint itself (avoid infinite loop)
  if (pathname === "/api/setup" || pathname === "/api/setup/") {
    return NextResponse.next();
  }

  // Only intercept API routes
  if (!pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // On first API request, ensure DB is ready before proceeding
  await ensureDatabase();

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*"],
};