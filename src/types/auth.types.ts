export type UserRole = 'super-admin' | 'admin' | 'manager' | 'agent' | 'viewer';

export interface Agency {
  id: string;
  name: string;
  city: string;
  email: string;
  phone: string;
  is_active: boolean;
}

export interface AuthUser {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  is_active: boolean;
  roles: UserRole[];
  agency: Agency | null;
  avatar_url: string | null;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: AuthUser;
}
