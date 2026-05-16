const BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000/api/v1';

export const apiRoutes = {
  files: {
    uploadTemp: `${BASE}/files/upload-temp`,
    cleanupTemp: `${BASE}/files/cleanup-temp`,
  },
} as const;
