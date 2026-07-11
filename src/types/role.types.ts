export interface Permission {
  id: string;
  name: string;
  label: string | null;
  module: string | null;
  guard_name: string;
  created_at: string;
}

export interface Role {
  id: string;
  name: string;
  guard_name: string;
  permissions: Permission[];
  users_count?: number;
  permissions_count?: number;
  created_at: string;
  updated_at: string;
}

export interface RoleUser {
  id: string;
  first_name: string;
  last_name: string;
  full_name?: string;
  email: string;
  is_active: boolean;
  agency?: { id: string; name: string } | null;
}

export interface CreateRoleInput {
  name: string;
  guard_name?: string;
  permissions?: string[];
}

export interface UpdateRoleInput {
  name?: string;
  permissions?: string[];
}

export interface AssignPermissionsInput {
  permissions: string[];
}
