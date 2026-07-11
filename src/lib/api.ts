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

    // For FormData uploads, remove Content-Type so the browser sets it
    // automatically with the correct multipart boundary, and use a longer
    // timeout — media conversions (resize/sharpen) run synchronously server-side
    // per file and can easily exceed the default 10s on multi-file uploads.
    if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
      delete config.headers['Content-Type'];
      config.timeout = 60000;
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

    // Only redirect for true permission-denial 403s (the backend includes
    // required_permissions exclusively for Spatie's UnauthorizedException).
    // Business-logic 403s (e.g. "already fully paid", "cannot delete system role")
    // don't carry this field and are left to their local try/catch + toast handling.
    const requiredPermissions = error.response?.data?.required_permissions;
    if (
      error.response?.status === 403 &&
      Array.isArray(requiredPermissions) &&
      requiredPermissions.length > 0 &&
      typeof window !== 'undefined' &&
      window.location.pathname !== '/unauthorized'
    ) {
      window.location.href = `/unauthorized?missing=${encodeURIComponent(requiredPermissions[0])}`;
    }

    return Promise.reject(error);
  }
);

export default apiClient;