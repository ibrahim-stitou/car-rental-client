import { auth } from './lib/auth';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { paths } from '@/config/paths';
import { permissionForPath } from '@/config/route-permissions';

const PUBLIC_ROUTES = [paths.auth.signIn, paths.auth.forgotPassword, paths.auth.resetPassword];

export default async function middleware(request: NextRequest) {
  const session = await auth();
  const { pathname } = request.nextUrl;
  // A session whose backend token could not be refreshed is dead: treat it as
  // signed out, otherwise pages load with a token every API call rejects
  const isAuthenticated = !!session?.accessToken && !session.error;

  const isPublicRoute = PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  if (pathname.startsWith('/api/')) return NextResponse.next();

  if (isPublicRoute) {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL(paths.dashboard.root, request.url));
    }
    return NextResponse.next();
  }

  if (!isAuthenticated || !session) {
    const url = new URL(paths.auth.signIn, request.url);
    return NextResponse.redirect(url);
  }

  if (pathname !== '/unauthorized') {
    const requiredPermission = permissionForPath(pathname);
    const isSuperAdmin = session.user?.roles?.includes('super-admin') ?? false;
    const hasPermission = isSuperAdmin || (session.user?.permissions?.includes(requiredPermission ?? '') ?? false);

    if (requiredPermission && !hasPermission) {
      const url = new URL('/unauthorized', request.url);
      url.searchParams.set('missing', requiredPermission);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|images|icons|fonts|logo).*)'],
};
