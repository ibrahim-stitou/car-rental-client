import type { UserRole, Agency } from './auth.types';
import type { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    accessToken: string;
    user: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      roles: UserRole[];
      agency: Agency | null;
      avatarUrl: string | null;
    } & DefaultSession['user'];
  }

  interface User {
    id?: string;
    firstName: string;
    lastName: string;
    email?: string | null;
    roles: UserRole[];
    agency: Agency | null;
    avatarUrl: string | null;
    accessToken: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    accessToken: string;
    id: string;
    firstName: string;
    lastName: string;
    roles: UserRole[];
    agency: Agency | null;
    avatarUrl: string | null;
  }
}
