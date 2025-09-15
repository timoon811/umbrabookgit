// Система ролей и прав доступа

export type UserRole = 
  | 'USER'              // Пользователь
  | 'ADMIN'             // Администратор
  | 'PROCESSOR'         // Менеджер
  | 'MEDIA_BUYER'       // Медиа Байер (устаревшая роль, заменена на BUYER)
  | 'ROP_PROCESSOR'     // РОП обработки
  | 'ROP_BUYER'         // РОП байер (устаревшая роль, заменена на LEAD_BUYER)
  | 'MODERATOR'         // Модератор
  | 'SUPPORT'           // Поддержка
  | 'BUYER'             // Байер
  | 'LEAD_BUYER'        // Лид Байер
  | 'FINANCE';          // Финансы

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
  | 'buyer.campaigns.view'            // Просмотр кампаний (байер) - УСТАРЕЛО
  | 'buyer.campaigns.edit'            // Редактирование кампаний - УСТАРЕЛО
  | 'buyer.stats.view'                // Просмотр статистики байера - УСТАРЕЛО
  | 'buyer.finance.view'              // Просмотр финансов байера - УСТАРЕЛО
  | 'support.tickets.view'            // Просмотр тикетов поддержки
  | 'support.tickets.edit'            // Обработка тикетов поддержки
  | 'support.users.assist'            // Помощь пользователям
  | 'content.projects.view'           // Просмотр проектов контента
  | 'content.projects.edit'           // Редактирование проектов контента
  // Новые права для Buyer системы
  | 'buyer.projects.view'             // Просмотр своих проектов
  | 'buyer.projects.create'           // Создание проектов
  | 'buyer.projects.edit'             // Редактирование своих проектов
  | 'buyer.dailylogs.view'            // Просмотр дневников
  | 'buyer.dailylogs.create'          // Создание дневников
  | 'buyer.dailylogs.edit'            // Редактирование дневников
  | 'buyer.requests.view'             // Просмотр заявок
  | 'buyer.requests.create'           // Создание заявок
  | 'buyer.requests.edit'             // Редактирование заявок
  | 'buyer.bonus.view'                // Просмотр бонусов
  | 'buyer.dashboard.view'            // Доступ к dashboard байера
  // Права для Lead Buyer
  | 'leadbuyer.team.view'             // Просмотр команды
  | 'leadbuyer.approve.local'         // Локальные аппрувы (рекомендации)
  // Админские права для buyer системы
  | 'admin.buyer.view'                // Просмотр всех байеров
  | 'admin.buyer.edit'                // Редактирование байеров
  | 'admin.buyer.projects.view'       // Просмотр всех проектов
  | 'admin.buyer.projects.edit'       // Редактирование всех проектов
  | 'admin.buyer.requests.approve'    // Аппрув заявок
  | 'admin.buyer.bonus.manage'        // Управление бонусными схемами
  | 'admin.buyer.sharedcosts.manage'  // Управление общими расходами
  | 'admin.buyer.signals.view'        // Просмотр сигналов
  | 'admin.buyer.reports.view'        // Просмотр отчетов
  // Финансовые права
  | 'finance.payouts.view'            // Просмотр выплат
  | 'finance.payouts.process';        // Обработка выплат

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
      'content.projects.edit',
      // Buyer система права для админа
      'admin.buyer.view',
      'admin.buyer.edit',
      'admin.buyer.projects.view',
      'admin.buyer.projects.edit',
      'admin.buyer.requests.approve',
      'admin.buyer.bonus.manage',
      'admin.buyer.sharedcosts.manage',
      'admin.buyer.signals.view',
      'admin.buyer.reports.view',
      'finance.payouts.view',
      'finance.payouts.process'
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
  },
  BUYER: {
    role: 'BUYER',
    displayName: 'Байер',
    description: 'Специалист по закупке трафика и ведению проектов',
    permissions: [
      'buyer.projects.view',
      'buyer.projects.create',
      'buyer.projects.edit',
      'buyer.dailylogs.view',
      'buyer.dailylogs.create',
      'buyer.dailylogs.edit',
      'buyer.requests.view',
      'buyer.requests.create',
      'buyer.requests.edit',
      'buyer.bonus.view',
      'buyer.dashboard.view',
      'content.projects.view'
    ],
    isSystem: true
  },
  LEAD_BUYER: {
    role: 'LEAD_BUYER',
    displayName: 'Лид Байер',
    description: 'Руководитель группы байеров с правами локального аппрува',
    permissions: [
      'admin.access',
      'buyer.projects.view',
      'buyer.projects.create',
      'buyer.projects.edit',
      'buyer.dailylogs.view',
      'buyer.dailylogs.create',
      'buyer.dailylogs.edit',
      'buyer.requests.view',
      'buyer.requests.create',
      'buyer.requests.edit',
      'buyer.bonus.view',
      'buyer.dashboard.view',
      'leadbuyer.team.view',
      'leadbuyer.approve.local',
      'admin.buyer.view',
      'admin.buyer.projects.view',
      'admin.buyer.signals.view',
      'content.projects.view'
    ],
    isSystem: true
  },
  FINANCE: {
    role: 'FINANCE',
    displayName: 'Финансы',
    description: 'Специалист по финансовым операциям и выплатам',
    permissions: [
      'admin.access',
      'admin.finance.view',
      'admin.finance.stats',
      'finance.payouts.view',
      'finance.payouts.process',
      'admin.buyer.view',
      'admin.buyer.requests.approve',
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
  { permission: 'content.projects.edit', displayName: 'Редактирование проектов', description: 'Создание и изменение проектов', category: 'Контент' },
  
  // Buyer система
  { permission: 'buyer.projects.view', displayName: 'Просмотр проектов', description: 'Просмотр своих проектов байера', category: 'Байер' },
  { permission: 'buyer.projects.create', displayName: 'Создание проектов', description: 'Создание новых проектов', category: 'Байер' },
  { permission: 'buyer.projects.edit', displayName: 'Редактирование проектов', description: 'Редактирование своих проектов', category: 'Байер' },
  { permission: 'buyer.dailylogs.view', displayName: 'Просмотр дневников', description: 'Просмотр дневных отчетов', category: 'Байер' },
  { permission: 'buyer.dailylogs.create', displayName: 'Создание дневников', description: 'Создание дневных отчетов', category: 'Байер' },
  { permission: 'buyer.dailylogs.edit', displayName: 'Редактирование дневников', description: 'Редактирование дневных отчетов', category: 'Байер' },
  { permission: 'buyer.requests.view', displayName: 'Просмотр заявок', description: 'Просмотр своих заявок', category: 'Байер' },
  { permission: 'buyer.requests.create', displayName: 'Создание заявок', description: 'Создание новых заявок', category: 'Байер' },
  { permission: 'buyer.requests.edit', displayName: 'Редактирование заявок', description: 'Редактирование своих заявок', category: 'Байер' },
  { permission: 'buyer.bonus.view', displayName: 'Просмотр бонусов', description: 'Просмотр своих бонусов и схем', category: 'Байер' },
  { permission: 'buyer.dashboard.view', displayName: 'Dashboard байера', description: 'Доступ к личному кабинету байера', category: 'Байер' },
  
  // Lead Buyer
  { permission: 'leadbuyer.team.view', displayName: 'Просмотр команды', description: 'Просмотр показателей своей группы', category: 'Лид Байер' },
  { permission: 'leadbuyer.approve.local', displayName: 'Локальные аппрувы', description: 'Рекомендации для аппрува (финально аппрувит админ)', category: 'Лид Байер' },
  
  // Админ для buyer системы
  { permission: 'admin.buyer.view', displayName: 'Просмотр всех байеров', description: 'Просмотр всех байеров в системе', category: 'Админ Buyer' },
  { permission: 'admin.buyer.edit', displayName: 'Редактирование байеров', description: 'Редактирование профилей байеров', category: 'Админ Buyer' },
  { permission: 'admin.buyer.projects.view', displayName: 'Просмотр всех проектов', description: 'Просмотр всех проектов байеров', category: 'Админ Buyer' },
  { permission: 'admin.buyer.projects.edit', displayName: 'Редактирование всех проектов', description: 'Редактирование любых проектов', category: 'Админ Buyer' },
  { permission: 'admin.buyer.requests.approve', displayName: 'Аппрув заявок', description: 'Утверждение заявок байеров', category: 'Админ Buyer' },
  { permission: 'admin.buyer.bonus.manage', displayName: 'Управление бонусами', description: 'Управление бонусными схемами', category: 'Админ Buyer' },
  { permission: 'admin.buyer.sharedcosts.manage', displayName: 'Управление общими расходами', description: 'Управление общими тратами и аллокацией', category: 'Админ Buyer' },
  { permission: 'admin.buyer.signals.view', displayName: 'Просмотр сигналов', description: 'Просмотр сигналов и алертов', category: 'Админ Buyer' },
  { permission: 'admin.buyer.reports.view', displayName: 'Просмотр отчетов', description: 'Просмотр отчетов по buyer системе', category: 'Админ Buyer' },
  
  // Финансы
  { permission: 'finance.payouts.view', displayName: 'Просмотр выплат', description: 'Просмотр запросов на выплаты', category: 'Финансы' },
  { permission: 'finance.payouts.process', displayName: 'Обработка выплат', description: 'Обработка и отметка выплат как оплаченных', category: 'Финансы' }
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
