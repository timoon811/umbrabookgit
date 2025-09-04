"use client";

import AuthGuard from "@/components/AuthGuard";

export default function ConnectionsPage() {
  return (
    <AuthGuard blockProcessors={true}>
      <div className="min-h-screen bg-white dark:bg-gray-900">
        <div className="mx-auto max-w-screen-2xl px-6 py-12">
          <div className="text-center">
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Связки и интеграции
            </h1>
            <p className="text-lg lg:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-8 leading-relaxed">
              Настройте связки между различными системами и автоматизируйте процессы интеграции.
            </p>
            
            <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-12 max-w-2xl mx-auto">
              <div className="w-16 h-16 mx-auto mb-6 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                Раздел в разработке
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Этот раздел находится в активной разработке. Скоро здесь появятся инструменты для настройки связок, управления интеграциями и мониторинга соединений между системами.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
