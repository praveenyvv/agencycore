import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Allow internal Next.js assets, public files, and login page
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/favicon') ||
    pathname === '/login'
  ) {
    return NextResponse.next();
  }

  // 2. Check for active authenticated session cookie
  const authCookie = request.cookies.get('holabusiness_auth_session')?.value;

  if (!authCookie) {
    const loginUrl = new URL('/login', request.url);
    // Add return_to parameter so after login, user returns to their destination
    if (pathname !== '/') {
      loginUrl.searchParams.set('return_to', pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
