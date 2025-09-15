// Система ролей и прав доступа

export type UserRole = 
  | 'USER'              // Пользователь
  | 'ADMIN'             // Администратор
  | 'PROCESSOR'         // Менеджер
  | 'MEDIA_BUYER'       // Медиа Байер
  | 'ROP_PROCESSOR'     // РОП обработки
  | 'ROP_BUYER'         // РОП байер
  | 'MODERATOR'         // Модератор
  | 'SUPPORT';          // Поддержка

export type Permission = 
  | 'admin.access'                    // Доступ к админ панели
  | 'admin.users.view'                // Просмотр пользователей
  | 'admin.users.edit'                // Редактирование пользователей
  | 'admin.users.delete'              // Удаление пользователей
  | 'admin.users.status'              // Изменение статуса пользователей
  | 'admin.finance.view'              // Просмотр финансов
  | 'admin.finance.edit'              // Редактирование финансов
  | 'admin.finance.stats'             // Просмотр финансовой статистики
  | 'admin.documentation.view'        // Просмотр документации
  | 'admin.documentation.edit'        // Редактирование документации
  | 'admin.processing.view'           // Просмотр обработки
  | 'admin.processing.edit'           // Редактирование настроек обработки
  | 'admin.settings.view'             // Просмотр настроек
  | 'admin.settings.edit'             // Редактирование настроек
  | 'admin.roles.view'                // Просмотр ролей
  | 'admin.roles.edit'                // Редактирование ролей
  | 'manager.deposits.view'         // Просмотр депозитов (менеджер)
  | 'manager.deposits.edit'         // Создание/редактирование депозитов
  | 'manager.stats.view'            // Просмотр статистики менеджера
  | 'manager.salary.view'           // Просмотр зарплатных данных
  | 'buyer.campaigns.view'            // Просмотр кампаний (байер)
  | 'buyer.campaigns.edit'            // Редактирование кампаний
  | 'buyer.stats.view'                // Просмотр статистики байера
  | 'buyer.finance.view'              // Просмотр финансов байера
  | 'support.tickets.view'            // Просмотр тикетов поддержки
  | 'support.tickets.edit'            // Обработка тикетов поддержки
  | 'support.users.assist'            // Помощь пользователям
  | 'content.projects.view'           // Просмотр проектов контента
  | 'content.projects.edit';          // Редактирование проектов контента

export interface RolePermissions {
  role: UserRole;
  displayName: string;
  description: string;
  permissions: Permission[];
  isSystem: boolean; // Системная роль (нельзя удалить)
}

// Конфигурация ролей по умолчанию
export const DEFAULT_ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  USER: {
    role: 'USER',
    displayName: 'Пользователь',
    description: 'Обычный пользователь системы',
    permissions: [
      'content.projects.view'
    ],
    isSystem: true
  },
  ADMIN: {
    role: 'ADMIN',
    displayName: 'Администратор',
    description: 'Полный доступ ко всем функциям системы',
    permissions: [
      'admin.access',
      'admin.users.view',
      'admin.users.edit',
      'admin.users.delete',
      'admin.users.status',
      'admin.finance.view',
      'admin.finance.edit',
      'admin.finance.stats',
      'admin.documentation.view',
      'admin.documentation.edit',
      'admin.processing.view',
      'admin.processing.edit',
      'admin.settings.view',
      'admin.settings.edit',
      'admin.roles.view',
      'admin.roles.edit',
      'content.projects.view',
      'content.projects.edit'
    ],
    isSystem: true
  },
  PROCESSOR: {
    role: 'PROCESSOR',
    displayName: 'Менеджер',
    description: 'Менеджер по работе с депозитами',
    permissions: [
      'manager.deposits.view',
      'manager.deposits.edit',
      'manager.stats.view',
      'manager.salary.view',
      'content.projects.view'
    ],
    isSystem: true
  },
  MEDIA_BUYER: {
    role: 'MEDIA_BUYER',
    displayName: 'Медиа Байер',
    description: 'Специалист по медиа закупкам',
    permissions: [
      'buyer.campaigns.view',
      'buyer.campaigns.edit',
      'buyer.stats.view',
      'buyer.finance.view',
      'content.projects.view',
      'admin.access'
    ],
    isSystem: true
  },
  ROP_PROCESSOR: {
    role: 'ROP_PROCESSOR',
    displayName: 'РОП обработки',
    description: 'Руководитель отдела обработки',
    permissions: [
      'admin.access',
      'admin.processing.view',
      'admin.processing.edit',
      'admin.users.view',
      'admin.finance.view',
      'admin.finance.stats',
      'manager.deposits.view',
      'manager.deposits.edit',
      'manager.stats.view',
      'content.projects.view'
    ],
    isSystem: true
  },
  ROP_BUYER: {
    role: 'ROP_BUYER',
    displayName: 'РОП байер',
    description: 'Руководитель отдела байеров',
    permissions: [
      'admin.access',
      'admin.users.view',
      'admin.finance.view',
      'admin.finance.stats',
      'buyer.campaigns.view',
      'buyer.campaigns.edit',
      'buyer.stats.view',
      'buyer.finance.view',
      'content.projects.view'
    ],
    isSystem: true
  },
  MODERATOR: {
    role: 'MODERATOR',
    displayName: 'Модератор',
    description: 'Модератор контента и пользователей',
    permissions: [
      'admin.access',
      'admin.users.view',
      'admin.users.status',
      'admin.documentation.view',
      'admin.documentation.edit',
      'content.projects.view',
      'content.projects.edit'
    ],
    isSystem: true
  },
  SUPPORT: {
    role: 'SUPPORT',
    displayName: 'Поддержка',
    description: 'Служба технической поддержки',
    permissions: [
      'admin.access',
      'admin.users.view',
      'support.tickets.view',
      'support.tickets.edit',
      'support.users.assist',
      'content.projects.view'
    ],
    isSystem: true
  }
};

// Все доступные права
export const ALL_PERMISSIONS: { permission: Permission; displayName: string; description: string; category: string }[] = [
  // Админ панель
  { permission: 'admin.access', displayName: 'Доступ к админ панели', description: 'Базовый доступ к административному интерфейсу', category: 'Админ панель' },
  
  // Пользователи
  { permission: 'admin.users.view', displayName: 'Просмотр пользователей', description: 'Просмотр списка и профилей пользователей', category: 'Пользователи' },
  { permission: 'admin.users.edit', displayName: 'Редактирование пользователей', description: 'Изменение данных пользователей', category: 'Пользователи' },
  { permission: 'admin.users.delete', displayName: 'Удаление пользователей', description: 'Удаление учетных записей пользователей', category: 'Пользователи' },
  { permission: 'admin.users.status', displayName: 'Изменение статуса', description: 'Изменение статуса пользователей (одобрение/отклонение)', category: 'Пользователи' },
  
  // Финансы
  { permission: 'admin.finance.view', displayName: 'Просмотр финансов', description: 'Просмотр финансовых данных', category: 'Финансы' },
  { permission: 'admin.finance.edit', displayName: 'Редактирование финансов', description: 'Создание и изменение финансовых записей', category: 'Финансы' },
  { permission: 'admin.finance.stats', displayName: 'Финансовая статистика', description: 'Просмотр финансовой аналитики и отчетов', category: 'Финансы' },
  
  // Документация
  { permission: 'admin.documentation.view', displayName: 'Просмотр документации', description: 'Доступ к редактору документации', category: 'Документация' },
  { permission: 'admin.documentation.edit', displayName: 'Редактирование документации', description: 'Создание и изменение документации', category: 'Документация' },
  
  // Обработка
  { permission: 'admin.processing.view', displayName: 'Просмотр обработки', description: 'Просмотр настроек и данных обработки', category: 'Обработка' },
  { permission: 'admin.processing.edit', displayName: 'Настройки обработки', description: 'Изменение настроек системы обработки', category: 'Обработка' },
  
  // Настройки
  { permission: 'admin.settings.view', displayName: 'Просмотр настроек', description: 'Просмотр системных настроек', category: 'Настройки' },
  { permission: 'admin.settings.edit', displayName: 'Редактирование настроек', description: 'Изменение системных настроек', category: 'Настройки' },
  
  // Роли
  { permission: 'admin.roles.view', displayName: 'Просмотр ролей', description: 'Просмотр ролей и прав доступа', category: 'Роли' },
  { permission: 'admin.roles.edit', displayName: 'Редактирование ролей', description: 'Изменение ролей и прав доступа', category: 'Роли' },
  
  // Менеджер
  { permission: 'manager.deposits.view', displayName: 'Просмотр депозитов', description: 'Просмотр депозитов для обработки', category: 'Менеджер' },
  { permission: 'manager.deposits.edit', displayName: 'Обработка депозитов', description: 'Создание и редактирование депозитов', category: 'Менеджер' },
  { permission: 'manager.stats.view', displayName: 'Статистика менеджера', description: 'Просмотр личной статистики работы', category: 'Менеджер' },
  { permission: 'manager.salary.view', displayName: 'Зарплатные данные', description: 'Просмотр зарплаты и бонусов', category: 'Менеджер' },
  
  // Байер
  { permission: 'buyer.campaigns.view', displayName: 'Просмотр кампаний', description: 'Просмотр рекламных кампаний', category: 'Байер' },
  { permission: 'buyer.campaigns.edit', displayName: 'Редактирование кампаний', description: 'Создание и изменение кампаний', category: 'Байер' },
  { permission: 'buyer.stats.view', displayName: 'Статистика байера', description: 'Просмотр статистики закупок', category: 'Байер' },
  { permission: 'buyer.finance.view', displayName: 'Финансы байера', description: 'Просмотр финансовых данных байера', category: 'Байер' },
  
  // Поддержка
  { permission: 'support.tickets.view', displayName: 'Просмотр тикетов', description: 'Просмотр обращений в поддержку', category: 'Поддержка' },
  { permission: 'support.tickets.edit', displayName: 'Обработка тикетов', description: 'Ответы на обращения поддержки', category: 'Поддержка' },
  { permission: 'support.users.assist', displayName: 'Помощь пользователям', description: 'Оказание помощи пользователям', category: 'Поддержка' },
  
  // Контент
  { permission: 'content.projects.view', displayName: 'Просмотр проектов', description: 'Просмотр проектов контента', category: 'Контент' },
  { permission: 'content.projects.edit', displayName: 'Редактирование проектов', description: 'Создание и изменение проектов', category: 'Контент' }
];

// Функции для работы с правами
export function hasPermission(userRole: UserRole, permission: Permission): boolean {
  const roleConfig = DEFAULT_ROLE_PERMISSIONS[userRole];
  return roleConfig?.permissions.includes(permission) || false;
}

export function getRoleDisplayName(role: UserRole): string {
  return DEFAULT_ROLE_PERMISSIONS[role]?.displayName || role;
}

export function getRolePermissions(role: UserRole): Permission[] {
  return DEFAULT_ROLE_PERMISSIONS[role]?.permissions || [];
}

export function getAllRoles(): UserRole[] {
  return Object.keys(DEFAULT_ROLE_PERMISSIONS) as UserRole[];
}
