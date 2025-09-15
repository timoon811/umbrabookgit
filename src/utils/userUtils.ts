/**
 * Утилиты для работы с пользовательскими данными
 */

/**
 * Безопасно получает первый символ имени пользователя для аватара
 * @param name - Имя пользователя (может быть undefined, null или пустой строкой)
 * @returns Первый символ имени в верхнем регистре или '?' если имя недоступно
 */
export function getUserInitial(name?: string | null): string {
  // Строгая проверка типов и значений
  if (name === undefined || name === null || typeof name !== 'string') {
    return '?';
  }
  
  // Проверяем что trim() существует
  if (typeof name.trim !== 'function') {
    return '?';
  }
  
  const trimmedName = name.trim();
  if (!trimmedName || trimmedName.length === 0) {
    return '?';
  }
  
  // Проверяем что charAt существует
  if (typeof trimmedName.charAt !== 'function') {
    return '?';
  }
  
  // Получаем первый символ безопасно
  const firstChar = trimmedName.charAt(0);
  
  // Проверяем что символ существует
  if (!firstChar || typeof firstChar !== 'string') {
    return '?';
  }
  
  // Проверяем что toUpperCase существует
  if (typeof firstChar.toUpperCase !== 'function') {
    return firstChar; // Возвращаем символ как есть
  }
  
  return firstChar.toUpperCase();
}

/**
 * Безопасно получает отображаемое имя пользователя
 * @param name - Имя пользователя (может быть undefined, null или пустой строкой)
 * @param fallback - Fallback значение (по умолчанию "Пользователь")
 * @returns Имя пользователя или fallback значение
 */
export function getDisplayName(name?: string | null, fallback: string = 'Пользователь'): string {
  if (!name || !name.trim()) {
    return fallback;
  }
  
  return name.trim();
}

/**
 * Маскирует имя пользователя для отображения в списках (например, "И***в")
 * @param name - Имя пользователя
 * @returns Замаскированное имя
 */
export function maskUserName(name?: string | null): string {
  if (!name || !name.trim()) {
    return '?*';
  }
  
  const trimmedName = name.trim();
  if (trimmedName.length <= 2) {
    return getUserInitial(trimmedName) + '*';
  }
  
  // Безопасно получаем первый и последний символы
  const firstChar = trimmedName.charAt(0) || '?';
  const lastChar = trimmedName.charAt(trimmedName.length - 1) || '?';
  const middleLength = Math.max(0, trimmedName.length - 2);
  
  return firstChar + '*'.repeat(middleLength) + lastChar;
}
