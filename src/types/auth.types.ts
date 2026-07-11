/** Admin-configurable via the Roles module — not a fixed enum. The five names below
 * remain as documentation of the seeded defaults, but any custom role name is valid. */
export type UserRole = string;

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
  permissions: string[];
  agency: Agency | null;
  avatar_url: string | null;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: AuthUser;
}
