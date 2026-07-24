import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  // لا نحتاج أي تهيئة هنا - التهيئة تتم داخل كل API route مباشرة عبر ensureDb()
  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*"],
};
