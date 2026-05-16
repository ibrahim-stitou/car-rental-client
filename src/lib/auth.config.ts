import { NextAuthConfig } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import apiClient from '@/lib/api';
import { apiRoutes } from '@/config/apiRoutes';

interface User {
  id: string;
  name: string;
  email?: string;
  full_name?: string;
  accessToken: string;
  refreshToken: string;
  role: {
    id: number;
    name: string;
    code: string;
    description: string;
  };
}

declare module 'next-auth' {
  interface Session {
    error?: string;
    accessToken?: string;
    refreshToken?: string;
    user: {
      role?: {
        id: number;
        name: string;
        code: string;
        description: string;
      };
      name?: string | null;
      full_name?: string;
      email?: string | null;
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    //@ts-ignore
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: number;
    error?: 'TokenExpired' | 'SessionExpired';
    //@ts-ignore
    role?: {
      id: number;
      name: string;
      code: string;
      description: string;
    };
  }
}

export const authConfig = {
  providers: [
    Credentials({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials): Promise<User | null> {
        try {
          const { data } = await apiClient.post(apiRoutes.auth.login, {
            email: credentials?.email,
            password: credentials?.password
          });

          if (!data.access_token) {
            return null;
          }

          return {
            id: data.role.id.toString(),
            full_name: data.full_name,
            name: data.full_name,
            email: typeof credentials?.email === 'string' ? credentials.email : undefined,
            accessToken: data.access_token,
            refreshToken: data.refresh_token,
            role: {
              id: data.role.id,
              name: data.role.name,
              code: data.role.code,
              description: data.role.description
            }
          };
        } catch {
          return null;
        }
      }
    })
  ],
  callbacks: {
    //@ts-ignore
    async jwt({ token, user }) {
      if (user && 'accessToken' in user && 'refreshToken' in user && 'role' in user) {
        return {
          ...token,
          accessToken: user.accessToken,
          refreshToken: user.refreshToken,
          role: user.role,
          expiresAt: Date.now() + 365 * 24 * 60 * 60 * 1000
        };
      }

      if (token.expiresAt && Date.now() > token.expiresAt) {
        return {
          ...token,
          error: 'SessionExpired',
          accessToken: undefined,
          refreshToken: undefined,
          expiresAt: undefined
        };
      }

      return token;
    },

    async session({ session, token }) {
      // Always set these values based on the token
      session.accessToken = token.accessToken;
      session.refreshToken = token.refreshToken;
      session.error = token.error;

      if (token.role) {
        session.user.role = token.role;
      }

      return session;
    }
  },
  events: {
    //@ts-ignore
    async signOut({ token }) {
      try {
        if (token?.accessToken) {
          await apiClient.post(apiRoutes.auth.logout, null, {
            headers: {
              Authorization: `Bearer ${token.accessToken}`
            }
          });
        }
      } catch {
        // Ignore logout errors
      } finally {
        token.accessToken = undefined;
        token.refreshToken = undefined;
        token.expiresAt = undefined;
      }
    }
  },
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60 * 365,
  },
  pages: {
    signIn: '/',
    signOut: '/',
    error: '/'
  },
  secret: process.env.NEXTAUTH_SECRET,
} satisfies NextAuthConfig;