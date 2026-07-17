import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Middleware بسيط — يتحقق من تهيئة قاعدة البيانات بشكل غير متزامن
let initAttempted = false;

function ensureDbAsync() {
  if (initAttempted) return;
  initAttempted = true;
  
  const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    
  fetch(`${baseUrl}/api/setup`, {
    method: "POST",
    signal: AbortSignal.timeout(10000),
  }).then((res) => {
    if (res.ok) console.log("[middleware] ✓ DB init triggered");
  }).catch(() => {
    // Silent fail — routes have their own fallback
  });
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip setup endpoint
  if (pathname === "/api/setup" || pathname === "/api/setup/") {
    return NextResponse.next();
  }

  // Only for API routes — trigger DB init asynchronously
  if (pathname.startsWith("/api/")) {
    ensureDbAsync();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*"],
};