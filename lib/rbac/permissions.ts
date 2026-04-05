import type { OrgRole } from '@/types'

export type Permission =
  | 'leads:create'
  | 'leads:read'
  | 'leads:update'
  | 'leads:delete'
  | 'leads:convert'
  | 'contacts:create'
  | 'contacts:read'
  | 'contacts:update'
  | 'contacts:delete'
  | 'companies:create'
  | 'companies:read'
  | 'companies:update'
  | 'companies:delete'
  | 'opportunities:create'
  | 'opportunities:read'
  | 'opportunities:update'
  | 'opportunities:delete'
  | 'activities:create'
  | 'activities:read'
  | 'activities:update'
  | 'activities:delete'
  | 'tasks:create'
  | 'tasks:read'
  | 'tasks:update'
  | 'tasks:delete'
  | 'quotes:create'
  | 'quotes:read'
  | 'quotes:update'
  | 'quotes:delete'
  | 'reports:read'
  | 'team:read'
  | 'team:invite'
  | 'team:manage'
  | 'settings:read'
  | 'settings:update'
  | 'billing:read'
  | 'billing:manage'
  | 'pipeline:configure'
  | 'audit:read'
  | 'data:import'
  | 'data:merge'

const ROLE_PERMISSIONS: Record<OrgRole, Permission[]> = {
  org_admin: [
    'leads:create', 'leads:read', 'leads:update', 'leads:delete', 'leads:convert',
    'contacts:create', 'contacts:read', 'contacts:update', 'contacts:delete',
    'companies:create', 'companies:read', 'companies:update', 'companies:delete',
    'opportunities:create', 'opportunities:read', 'opportunities:update', 'opportunities:delete',
    'activities:create', 'activities:read', 'activities:update', 'activities:delete',
    'tasks:create', 'tasks:read', 'tasks:update', 'tasks:delete',
    'quotes:create', 'quotes:read', 'quotes:update', 'quotes:delete',
    'reports:read',
    'team:read', 'team:invite', 'team:manage',
    'settings:read', 'settings:update',
    'billing:read', 'billing:manage',
    'pipeline:configure',
    'audit:read',
    'data:import',
    'data:merge',
  ],
  sales_manager: [
    'leads:create', 'leads:read', 'leads:update', 'leads:delete', 'leads:convert',
    'contacts:create', 'contacts:read', 'contacts:update', 'contacts:delete',
    'companies:create', 'companies:read', 'companies:update', 'companies:delete',
    'opportunities:create', 'opportunities:read', 'opportunities:update', 'opportunities:delete',
    'activities:create', 'activities:read', 'activities:update', 'activities:delete',
    'tasks:create', 'tasks:read', 'tasks:update', 'tasks:delete',
    'quotes:create', 'quotes:read', 'quotes:update', 'quotes:delete',
    'reports:read',
    'team:read', 'team:invite',
    'settings:read',
    'billing:read',
    'data:import',
  ],
  sales_rep: [
    'leads:create', 'leads:read', 'leads:update', 'leads:convert',
    'contacts:create', 'contacts:read', 'contacts:update',
    'companies:create', 'companies:read', 'companies:update',
    'opportunities:create', 'opportunities:read', 'opportunities:update',
    'activities:create', 'activities:read', 'activities:update',
    'tasks:create', 'tasks:read', 'tasks:update',
    'quotes:create', 'quotes:read', 'quotes:update',
    'team:read',
    'settings:read',
    'billing:read',
  ],
  viewer: [
    'leads:read',
    'contacts:read',
    'companies:read',
    'opportunities:read',
    'activities:read',
    'tasks:read',
    'quotes:read',
    'reports:read',
    'team:read',
    'settings:read',
    'billing:read',
  ],
}

export function hasPermission(role: OrgRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false
}

export function can(role: OrgRole | undefined | null, permission: Permission): boolean {
  if (!role) return false
  return hasPermission(role, permission)
}

export function requirePermission(role: OrgRole | null, permission: Permission): void {
  if (!can(role, permission)) {
    throw new Error(`Unauthorized: missing permission ${permission}`)
  }
}

export function isAdmin(role: OrgRole | null): boolean {
  return role === 'org_admin'
}

export function isManagerOrAbove(role: OrgRole | null): boolean {
  return role === 'org_admin' || role === 'sales_manager'
}
