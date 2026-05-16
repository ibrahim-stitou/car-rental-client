'use client';

import { useMeStore } from '@/stores/me-store';
import { useSession } from 'next-auth/react';
import { useEffect } from 'react';

export const useAuth = () => {
  const { data: session, status } = useSession();
  const { user, loading, error, fetchMe, clear } = useMeStore();

  useEffect(() => {
    if (status === 'authenticated' && !user && !loading) {
      fetchMe();
    } else if (status === 'unauthenticated') {
      clear();
    }
  }, [status, user, loading, fetchMe, clear]);
  const isAdmin = user?.role?.code === 'admin';
  return {
    user,
    loading: status === 'loading' || loading,
    error,
    isAuthenticated: status === 'authenticated',
    isAdmin,
    session,
  };
};