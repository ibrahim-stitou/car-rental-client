import { NextResponse } from 'next/server';
import { auth, signOut } from '@/lib/auth';

export async function GET(request: Request) {
  const session = await auth();

  // @ts-ignore
  if (session?.accessToken) {
    try {

      await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000/api/v1'}/logout`, {
        method: 'POST',
        headers: {
          // @ts-ignore
          'Authorization': `Bearer ${session.accessToken}`,
          'Content-Type': 'application/json',
        },
      });
    } catch (error) {
      console.error('Logout API error:', error);
    }
  }

  // Déconnexion NextAuth et redirection
  await signOut({ redirectTo: '/' });
  return NextResponse.redirect(new URL('/', request.url));
}