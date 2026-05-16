export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface PaginatedResponse<T> {
  success: boolean;
  message: string;
  data: T[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
  };
  links: {
    first: string | null;
    last: string | null;
    prev: string | null;
    next: string | null;
  };
}

export interface ApiError {
  success: false;
  message: string;
  code: number;
  errors?: Record<string, string[]>;
}

export interface MediaFile {
  id: string;
  name: string;
  file_name: string;
  mime_type: string;
  size: number;
  url: string;
  collection_name: string;
  created_at: string;
}

export type SortDir = 'asc' | 'desc';
