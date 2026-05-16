export interface Permission {
  id: string;
  name: string;
  guard_name: string;
  created_at: string;
}

export interface Role {
  id: string;
  name: string;
  guard_name: string;
  permissions: Permission[];
  users_count?: number;
  created_at: string;
  updated_at: string;
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
