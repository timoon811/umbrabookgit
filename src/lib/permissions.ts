import { UserRole, Permission, hasPermission as hasRolePermission } from '@/types/roles';

// Роли с доступом к админ панели
export const ADMIN_ROLES: UserRole[] = [
  'ADMIN',
  'ROP_PROCESSOR', 
  'ROP_BUYER',
  'MODERATOR',
  'SUPPORT',
  'MEDIA_BUYER'
];

// Проверка доступа к админ панели
export function hasAdminAccess(userRole: UserRole): boolean {
  return ADMIN_ROLES.includes(userRole) || hasRolePermission(userRole, 'admin.access');
}

// Проверка конкретного права
export function hasPermission(userRole: UserRole, permission: Permission): boolean {
  return hasRolePermission(userRole, permission);
}

// Проверка прав для API эндпоинтов
export function checkApiPermission(userRole: UserRole, requiredPermissions: Permission[]): boolean {
  return requiredPermissions.some(permission => hasPermission(userRole, permission));
}

// Массив всех админских ролей для быстрой проверки
export function isAdminRole(role: string): boolean {
  return ADMIN_ROLES.includes(role as UserRole);
}
