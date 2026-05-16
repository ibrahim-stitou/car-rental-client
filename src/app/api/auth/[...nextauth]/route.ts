// app/api/auth/[...nextauth]/route.ts
import { handlers } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

export const GET = async (req: NextRequest) => {
  try {
    return await handlers.GET(req);
  } catch (error) {
    if (error instanceof Error && error.message === 'Token expired') {
      const url = new URL('/login', req.url);
      return NextResponse.redirect(url);
    }
    throw error;
  }
};

export const POST = handlers.POST;