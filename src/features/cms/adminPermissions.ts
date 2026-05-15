import type { AdminPermission, AdminRole } from './types';

const permissionsByRole: Record<AdminRole, AdminPermission[]> = {
  super_admin: [
    'dashboard:view',
    'analytics:view',
    'audit:view',
    'content:edit',
    'content:publish',
    'content:delete',
    'settings:edit',
    'media:edit',
    'taxonomy:edit',
    'team:manage',
    'store:view',
    'store:edit',
    'store:manage_orders',
    'store:manage_customers'
  ],
  admin: [
    'dashboard:view',
    'analytics:view',
    'audit:view',
    'content:edit',
    'content:publish',
    'content:delete',
    'settings:edit',
    'media:edit',
    'taxonomy:edit',
    'store:view',
    'store:edit',
    'store:manage_orders',
    'store:manage_customers'
  ],
  editor: ['dashboard:view', 'content:edit', 'media:edit'],
  analyst: ['dashboard:view', 'analytics:view', 'audit:view'],
  store_manager: [
    'dashboard:view',
    'store:view',
    'store:edit',
    'store:manage_orders',
    'store:manage_customers',
    'media:edit'
  ]
};

export function normalizeAdminRole(value: string | null | undefined): AdminRole {
  const normalized = (value ?? '').trim().toLowerCase();
  if (normalized === 'super_admin' || normalized === 'admin' || normalized === 'editor' || normalized === 'analyst' || normalized === 'store_manager') {
    return normalized as AdminRole;
  }
  return 'analyst';
}

export function permissionsForRole(role: AdminRole): AdminPermission[] {
  return permissionsByRole[role];
}

export function hasAdminPermission(role: AdminRole, permission: AdminPermission) {
  return permissionsByRole[role].includes(permission);
}

export function formatAdminRoleLabel(role: AdminRole) {
  return role.replace(/_/g, ' ');
}
