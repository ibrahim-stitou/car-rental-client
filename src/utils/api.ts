
import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL|| 'http://localhost:8000/api/v1';

export const createAxiosInstance = (locale: string = 'en'): AxiosInstance => {
  const instance: AxiosInstance = axios.create({
    baseURL: BASE_URL,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Accept-Language': locale
    }
  });

  instance.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    if (typeof window === 'undefined') {
      return config;
    }

    const language = localStorage.getItem('appLanguage') || locale;
    config.headers['Accept-Language'] = language;

    const token = localStorage.getItem('token') || 
                 sessionStorage.getItem('next-auth.session-token');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  });

  return instance;
};