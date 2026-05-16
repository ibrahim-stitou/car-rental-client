import type { NextAuthConfig } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import apiClient from '@/lib/api';
import { apiRoutes } from '@/config/apiRoutes';
import type { LoginResponse, UserRole } from '@/types/auth.types';

export const authConfig = {
  providers: [
    Credentials({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        try {
          const { data } = await apiClient.post<{ data: LoginResponse }>(
            apiRoutes.auth.login,
            {
              email: credentials?.email,
              password: credentials?.password,
            }
          );

          const { access_token, user } = data.data;

          if (!access_token || !user) return null;

          return {
            id: user.id,
            firstName: user.first_name,
            lastName: user.last_name,
            email: user.email,
            roles: user.roles,
            agency: user.agency,
            avatarUrl: user.avatar_url,
            accessToken: access_token,
          };
        } catch {
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.accessToken = user.accessToken as string;
        token.id = user.id as string;
        token.firstName = (user as { firstName: string }).firstName;
        token.lastName = (user as { lastName: string }).lastName;
        token.email = user.email as string;
        token.roles = (user as { roles: UserRole[] }).roles;
        token.agency = (user as { agency: unknown }).agency;
        token.avatarUrl = (user as { avatarUrl: string | null }).avatarUrl;
      }
      return token;
    },

    async session({ session, token }) {
      session.accessToken = token.accessToken as string;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      session.user = {
        id: token.id as string,
        firstName: token.firstName as string,
        lastName: token.lastName as string,
        email: token.email as string,
        roles: token.roles as UserRole[],
        agency: token.agency as null,
        avatarUrl: token.avatarUrl as string | null,
      } as typeof session.user;
      return session;
    },
  },
  events: {
    async signOut(message) {
      if ('token' in message && message.token?.accessToken) {
        try {
          await apiClient.post(apiRoutes.auth.logout, null, {
            headers: { Authorization: `Bearer ${message.token.accessToken}` },
          });
        } catch {
          // Ignore logout errors — token invalidation is best-effort
        }
      }
    },
  },
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60,
  },
  pages: {
    signIn: '/sign-in',
    signOut: '/sign-in',
    error: '/sign-in',
  },
  secret: process.env.NEXTAUTH_SECRET,
} satisfies NextAuthConfig;
