import axios, { AxiosError } from 'axios';
import { getSession, signOut } from 'next-auth/react';
import { auth } from '@/lib/auth';

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000/api/v1',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

const getAuthToken = async (isServerSide: boolean): Promise<string | null> => {
  try {
    if (isServerSide) {
      const session = await auth();
      return session?.accessToken || null;
    } else {
      const session = await getSession();
      return session?.accessToken || null;
    }
  } catch {
    return null;
  }
};

const isServerSide = (): boolean => typeof window === 'undefined';

apiClient.interceptors.request.use(
  async (config: any) => {
    const isAuthEndpoint =
      config.url?.includes('/login') ||
      config.url?.includes('/refresh-token');

    if (!isAuthEndpoint) {
      const token = await getAuthToken(isServerSide());
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    config._requestTimestamp = Date.now();

    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);


apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      try {
        const isApiCall = window.location.pathname.startsWith('/api/');

        if (!isApiCall) {

          await signOut({ redirect: false });

          if (window.location.pathname !== '/') {
            window.location.href = '/?reason=session_expired';
          }
        }
      } catch (signOutError) {
        console.error('Error during sign out:', signOutError);
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;