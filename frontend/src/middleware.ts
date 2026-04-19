import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/request';

/**
 * Middleware to protect /admin routes
 * Auth check is performed by verifying the existence of the 'admin_token' cookie.
 * This cookie is set as httpOnly by the backend, but is accessible to the Next.js middleware.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only protect routes starting with /admin
  if (pathname.startsWith('/admin')) {
    // Exemptions: Login and Setup pages
    if (pathname === '/admin/login' || pathname === '/admin/setup' || pathname.startsWith('/admin/setup/')) {
      return NextResponse.next();
    }

    const token = request.cookies.get('admin_token');

    // If no token exists, redirect to the admin login page
    if (!token) {
      const loginUrl = new URL('/admin/login', request.url);
      
      // Optionally add a redirect parameter to return here after login
      loginUrl.searchParams.set('callbackUrl', pathname);
      
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: ['/admin/:path*'],
};
