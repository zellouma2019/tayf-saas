import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Middleware — يعدّل الرؤوس الأمنية لصفحات المتاجر
 * السبب: Vercel يضيف X-Frame-Options: DENY تلقائياً مما يمنع عرض المتجر داخل iframe (المعاينة)
 */
export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // صفحات المتجر فقط — السماح بعرضها في iframe من نفس النطاق
  if (request.nextUrl.pathname.startsWith("/s/")) {
    response.headers.set("X-Frame-Options", "SAMEORIGIN");
    response.headers.set("Content-Security-Policy", "frame-ancestors 'self'");
  }

  return response;
}

export const config = {
  matcher: ["/s/:path*"],
};