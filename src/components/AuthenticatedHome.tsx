"use client";

import Link from "next/link";
import UmbraLogo from "@/components/UmbraLogo";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/components/Toast";
import { useNotificationContext } from "@/providers/NotificationProvider";

export default function AuthenticatedHome() {
  const { user, loading, mounted } = useAuth();
  const { showSuccess, showError, showWarning, showInfo } = useToast();
  const { 
    showSuccess: showSystemSuccess, 
    showError: showSystemError, 
    showWarning: showSystemWarning, 
    showInfo: showSystemInfo,
    showAuthError,
    showNetworkError 
  } = useNotificationContext();

  // Показываем loading state до монтирования для предотвращения гидратации
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-black dark:to-gray-900">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-500"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-black dark:to-gray-900">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
        {/* Hero Section */}
        <div className="text-center mb-12 sm:mb-16 lg:mb-20">
          <div className="flex justify-center mb-6 sm:mb-8">
            <UmbraLogo size="xl" />
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6 leading-tight">
            Добро пожаловать!
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto px-4">
            Рады видеть вас в Umbra Platform. Выберите, что хотите сделать дальше.
          </p>
        </div>

        {/* Navigation Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 max-w-7xl mx-auto">
          
          {/* Документация */}
          <Link href="/docs" className="group">
            <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl p-6 sm:p-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 sm:hover:-translate-y-2 border border-gray-200 dark:border-gray-700 h-full">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 dark:bg-gray-900/30 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-6 h-6 sm:w-8 sm:h-8 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 5.477 5.754 5 7.5 5s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 19 16.5 19c-1.746 0-3.332-.523-4.5-1.253" />
                </svg>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-2 sm:mb-3 text-center">Документация</h2>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 text-center">Изучите API, интеграции и примеры использования</p>
            </div>
          </Link>


          {/* Профиль */}
          <Link href="/profile" className="group">
            <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl p-6 sm:p-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 sm:hover:-translate-y-2 border border-gray-200 dark:border-gray-700 h-full">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-purple-100 dark:bg-purple-900/30 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-2 sm:mb-3 text-center">Профиль</h2>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 text-center">Управляйте настройками и личными данными</p>
            </div>
          </Link>
        </div>

        {/* Тестирование уведомлений */}
        <div className="mt-12 max-w-6xl mx-auto space-y-6">
          {/* Toast уведомления */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 text-center">
              📱 Toast уведомления (справа сверху)
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <button
                onClick={() => showSuccess('Успех!', 'Операция выполнена успешно')}
                className="px-4 py-2 bg-green-100 text-green-800 rounded-lg hover:bg-green-200 transition-colors text-sm font-medium"
              >
                ✅ Успех
              </button>
              <button
                onClick={() => showError('Ошибка!', 'Что-то пошло не так')}
                className="px-4 py-2 bg-red-100 text-red-800 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium"
              >
                ❌ Ошибка
              </button>
              <button
                onClick={() => showWarning('Внимание!', 'Проверьте данные')}
                className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg hover:bg-yellow-200 transition-colors text-sm font-medium"
              >
                ⚠️ Предупреждение
              </button>
              <button
                onClick={() => showInfo('Информация', 'Новые данные доступны')}
                className="px-4 py-2 bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium"
              >
                ℹ️ Информация
              </button>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 text-center mt-3">
              Автоматически исчезают через 5-10 секунд
            </p>
          </div>

          {/* Системные уведомления */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 text-center">
              🔔 Системные уведомления (в историю)
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <button
                onClick={() => showSystemSuccess('Данные сохранены', 'Все изменения успешно применены', 'Система')}
                className="px-4 py-2 bg-green-100 text-green-800 rounded-lg hover:bg-green-200 transition-colors text-sm font-medium"
              >
                💾 Сохранение
              </button>
              <button
                onClick={() => showSystemError('Ошибка загрузки', 'Не удалось загрузить данные с сервера', 'API')}
                className="px-4 py-2 bg-red-100 text-red-800 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium"
              >
                🌐 Ошибка API
              </button>
              <button
                onClick={() => showSystemWarning('Проверьте подключение', 'Обнаружены проблемы с сетью', 'Сеть')}
                className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg hover:bg-yellow-200 transition-colors text-sm font-medium"
              >
                📡 Сеть
              </button>
              <button
                onClick={() => showAuthError()}
                className="px-4 py-2 bg-red-100 text-red-800 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium"
              >
                🔐 Авторизация
              </button>
              <button
                onClick={() => showNetworkError('Тестовый модуль', () => alert('Повторная попытка!'))}
                className="px-4 py-2 bg-orange-100 text-orange-800 rounded-lg hover:bg-orange-200 transition-colors text-sm font-medium"
              >
                🔧 С действием
              </button>
              <button
                onClick={() => showSystemInfo('Обновление', 'Доступна новая версия системы', 'Обновления')}
                className="px-4 py-2 bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium"
              >
                🔄 Информация
              </button>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 text-center mt-3">
              Попадают в историю, доступны в выпадающем меню уведомлений в Header
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
