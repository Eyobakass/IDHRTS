import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// This middleware currently allows all routes through.
// Route protection is enforced client-side via API 401 responses redirecting to /login.
// For production, consider migrating auth token to HttpOnly cookies for server-side guard.
export function middleware(request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
  ],
};
