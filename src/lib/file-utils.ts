/**
 * Утилиты для работы с файлами и URL
 */

/**
 * Нормализует URL файла для корректного отображения
 * @param url - исходный URL файла
 * @returns нормализованный URL
 */
export function normalizeFileUrl(url: string): string {
  if (!url) return '';
  
  // Если URL уже абсолютный, возвращаем как есть
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  
  // Если URL начинается с blob:, возвращаем как есть (временный URL)
  if (url.startsWith('blob:')) {
    return url;
  }
  
  // Нормализуем относительные пути
  let normalizedUrl = url;
  
  // Убираем двойные слеши
  normalizedUrl = normalizedUrl.replace(/\/+/g, '/');
  
  // Убираем ведущий слеш если он есть и добавляем один
  if (normalizedUrl.startsWith('/')) {
    normalizedUrl = normalizedUrl.substring(1);
  }
  normalizedUrl = '/' + normalizedUrl;
  
  return normalizedUrl;
}

/**
 * Проверяет, является ли файл изображением по URL или MIME типу
 * @param url - URL файла
 * @param mimeType - MIME тип файла (опционально)
 * @returns true если файл является изображением
 */
export function isImageFile(url: string, mimeType?: string): boolean {
  if (mimeType) {
    return mimeType.startsWith('image/');
  }
  
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp'];
  const extension = url.split('.').pop()?.toLowerCase();
  return extension ? imageExtensions.some(ext => ext === '.' + extension) : false;
}

/**
 * Получает расширение файла из URL
 * @param url - URL файла
 * @returns расширение файла
 */
export function getFileExtension(url: string): string {
  return url.split('.').pop()?.toLowerCase() || '';
}

/**
 * Получает имя файла из URL
 * @param url - URL файла
 * @returns имя файла
 */
export function getFileName(url: string): string {
  return url.split('/').pop() || '';
}

/**
 * Создает безопасное имя файла
 * @param filename - исходное имя файла
 * @returns безопасное имя файла
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_{2,}/g, '_')
    .slice(0, 100);
}

/**
 * Форматирует размер файла в человекочитаемый вид
 * @param bytes - размер в байтах
 * @returns отформатированный размер
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Получает URL для API загрузки файлов в зависимости от окружения
 * @returns URL для API загрузки
 */
export function getUploadApiUrl(): string {
  return '/api/admin/upload';
}

/**
 * Получает базовый URL для файлов в зависимости от окружения
 * @returns базовый URL для файлов
 */
export function getFilesBaseUrl(): string {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return '';
}
