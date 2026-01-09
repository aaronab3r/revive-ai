import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const authSession = request.cookies.get('auth_session');
  const isDashboard = request.nextUrl.pathname.startsWith('/dashboard');
  const isLoginPage = request.nextUrl.pathname === '/login';

  // If user is on dashboard and NOT logged in -> redirect to login
  if (isDashboard && !authSession) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If user is on login page and IS logged in -> redirect to dashboard
  if (isLoginPage && authSession) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/login'],
};
