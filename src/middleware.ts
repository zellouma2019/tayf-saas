import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Middleware بسيط — لا يحجب الطلبات
// كل route عنده ensureSchema الخاص به
export async function middleware(request: NextRequest) {
  // تمرير مباشر بدون أي معالجة
  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*"],
};