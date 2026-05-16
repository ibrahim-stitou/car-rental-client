import { auth } from './lib/auth';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export default async function middleware(request: NextRequest) {
  const session = await auth();
  const { pathname } = request.nextUrl;


  const publicRoutes = ['/', '/login', '/register', '/api/auth', '/unauthorized', '/auth/forgot-password'];
  const isPublicRoute = publicRoutes.some(route =>
    pathname === route || pathname.startsWith(`${route}/`)
  );

  if (isPublicRoute) {
    if (pathname === '/' && session && !session.error && session.accessToken) {
      const userRole = session.user?.role?.code;

      if (userRole === 'admin') {
        return NextResponse.redirect(new URL('/admin/overview', request.url));
      } else if (userRole === 'consultant') {
        return NextResponse.redirect(new URL('/consultant/overview', request.url));
      }
    }

    return NextResponse.next();
  }


  if (pathname.startsWith('/api/')) {
    return NextResponse.next();
  }


  if (!session || !session.accessToken || session.error) {

    const reason = session?.error ? `reason=${session.error.toLowerCase()}` : 'reason=session_expired';
    const url = new URL(`/?${reason}`, request.url);
    return NextResponse.redirect(url);
  }


  const userRole = session.user?.role?.code;

  if (pathname.startsWith('/admin') && userRole !== 'admin') {
    return NextResponse.redirect(new URL('/unauthorized', request.url));
  }

  if (pathname.startsWith('/consultant') && userRole !== 'consultant') {
    return NextResponse.redirect(new URL('/unauthorized', request.url));
  }

  const commonRoutes = ['/dashboard', '/profile', '/settings'];
  const isCommonRoute = commonRoutes.some(route =>
    pathname === route || pathname.startsWith(`${route}/`)
  );

  if (isCommonRoute && !['admin', 'consultant'].includes(userRole || '')) {
    return NextResponse.redirect(new URL('/unauthorized', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|images|icons|fonts).*)',
  ],
};