import type { JWT } from 'next-auth/jwt';
import type { NextAuthConfig } from 'next-auth';
import { CredentialsSignin } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import axios from 'axios';
import apiClient from '@/lib/api';
import { apiRoutes } from '@/config/apiRoutes';
import type { Agency, LoginResponse, UserRole } from '@/types/auth.types';

export class AccountSuspendedError extends CredentialsSignin {
  code = 'account-suspended';
}

// Refresh a bit before the backend JWT (JWT_TTL, 60min by default) actually
// expires — the SessionProvider's refetchInterval (5min, see providers.tsx)
// is what drives this callback to re-run periodically, so this only needs to
// be comfortably larger than that heartbeat, not razor-close to the real TTL.
const REFRESH_BUFFER_MS = 5 * 60 * 1000;

/**
 * Exchanges the current (still-valid) access token for a fresh one via the
 * backend's /auth/refresh. Deliberately uses a bare axios call instead of
 * apiClient — apiClient's request interceptor calls getSession()/auth(),
 * which would re-enter this same jwt callback while it's already running.
 */
async function refreshAccessToken(token: JWT): Promise<JWT> {
  try {
    const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000/api/v1';
    const { data } = await axios.post<{ data: LoginResponse }>(
      `${baseURL}/auth/refresh`,
      null,
      { headers: { Authorization: `Bearer ${token.accessToken}` } }
    );

    return {
      ...token,
      accessToken: data.data.access_token,
      accessTokenExpires: Date.now() + data.data.expires_in * 1000,
      error: undefined,
    };
  } catch (err) {
    console.error('[auth] Failed to refresh access token:', err);
    // Keep the old (now-expiring) token around but flag the error — the
    // client watches session.error and forces a sign-out on this.
    return { ...token, error: 'RefreshAccessTokenError' };
  }
}

export const authConfig = {
  providers: [
    Credentials({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials, request) {
        try {
          // authorize() runs server-side: the Laravel call below is made by
          // the Next.js server itself, so $request->ip() on the backend would
          // otherwise see this server's own IP, not the real browser's. Nginx
          // already puts the true client IP first in the incoming request's
          // X-Forwarded-For (see nginx `proxy_set_header X-Forwarded-For
          // $proxy_add_x_forwarded_for`) — forward just that value explicitly.
          const forwardedFor = request?.headers?.get('x-forwarded-for');
          const clientIp = forwardedFor?.split(',')[0]?.trim() || request?.headers?.get('x-real-ip') || undefined;

          const { data } = await apiClient.post<{ data: LoginResponse }>(
            apiRoutes.auth.login,
            {
              email: credentials?.email,
              password: credentials?.password,
            },
            clientIp ? { headers: { 'X-Client-Ip': clientIp } } : undefined
          );

          const { access_token, expires_in, user } = data.data;

          if (!access_token || !user) return null;

          return {
            id: user.id,
            firstName: user.first_name,
            lastName: user.last_name,
            email: user.email,
            roles: user.roles,
            permissions: user.permissions,
            agencies: user.agencies,
            avatarUrl: user.avatar_url,
            accessToken: access_token,
            accessTokenExpires: Date.now() + expires_in * 1000,
          };
        } catch (err: unknown) {
          const axiosErr = err as { response?: { data?: unknown; status?: number } };
          console.error('[auth] Login failed:', axiosErr?.response?.status, axiosErr?.response?.data ?? err);
          if (axiosErr?.response?.status === 403) {
            throw new AccountSuspendedError();
          }
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.accessToken = user.accessToken as string;
        token.accessTokenExpires = (user as { accessTokenExpires: number }).accessTokenExpires;
        token.id = user.id as string;
        token.firstName = (user as { firstName: string }).firstName;
        token.lastName = (user as { lastName: string }).lastName;
        token.email = user.email as string;
        token.roles = (user as { roles: UserRole[] }).roles;
        token.permissions = (user as { permissions: string[] }).permissions ?? [];
        token.agencies = (user as { agencies?: Agency[] }).agencies ?? [];
        token.avatarUrl = (user as { avatarUrl: string | null }).avatarUrl;
        return token;
      }

      // Still comfortably valid — nothing to do. This runs on every session
      // read (see SessionProvider's refetchInterval in providers.tsx), so
      // most of the time this is the path taken, not an actual refresh.
      if (Date.now() < token.accessTokenExpires - REFRESH_BUFFER_MS) {
        return token;
      }

      return refreshAccessToken(token);
    },

    async session({ session, token }) {
      session.accessToken = token.accessToken as string;
      session.error = token.error;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      session.user = {
        id: token.id as string,
        firstName: token.firstName as string,
        lastName: token.lastName as string,
        email: token.email as string,
        roles: token.roles as UserRole[],
        permissions: token.permissions as string[],
        agencies: (token.agencies as Agency[]) ?? [],
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
} satisfies NextAuthConfig;
