'use client';

import { useSession } from 'next-auth/react';
import type { UserRole } from '@/types/auth.types';

export function useAuth() {
  const { data: session, status } = useSession();

  const hasRole = (role: UserRole) => session?.user?.roles?.includes(role) ?? false;
  const isSuperAdmin = hasRole('super-admin');
  const isAdmin = isSuperAdmin || hasRole('admin');
  const isManager = isAdmin || hasRole('manager');
  const hasPermission = (permission: string) =>
    isSuperAdmin || (session?.user?.permissions?.includes(permission) ?? false);

  return {
    session,
    user: session?.user ?? null,
    status,
    isAuthenticated: status === 'authenticated',
    isLoading: status === 'loading',
    isSuperAdmin,
    isAdmin,
    isManager,
    hasRole,
    permissions: session?.user?.permissions ?? [],
    hasPermission,
  };
}
