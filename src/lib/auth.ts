import NextAuth from 'next-auth';
import { authConfig } from './auth.config';

// @ts-ignore
export const { auth, handlers, signOut, signIn } = NextAuth(authConfig);
