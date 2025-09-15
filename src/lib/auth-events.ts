/**
 * Утилиты для работы с событиями аутентификации
 */

// Типы событий аутентификации
export type AuthEvent = 'login' | 'logout' | 'refresh';

/**
 * Отправляет событие обновления аутентификации
 * Используется для синхронизации состояния между компонентами
 */
export function triggerAuthUpdate(eventType: AuthEvent = 'refresh') {
  if (typeof window !== 'undefined') {
    // Отправляем кастомное событие
    window.dispatchEvent(new CustomEvent('auth-update', { 
      detail: { type: eventType } 
    }));
    
    // Также отправляем событие storage для обратной совместимости
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'auth-status',
      newValue: eventType,
      storageArea: localStorage
    }));
  }
}

/**
 * Очищает состояние аутентификации
 */
export function clearAuthState() {
  if (typeof window !== 'undefined') {
    triggerAuthUpdate('logout');
  }
}

/**
 * Уведомляет о успешном входе
 */
export function notifyAuthLogin() {
  if (typeof window !== 'undefined') {
    triggerAuthUpdate('login');
  }
}


