export default function FinancePage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <div className="mx-auto max-w-screen-2xl px-6 py-12">
        <div className="text-center">
          <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Финансовые инструменты
          </h1>
          <p className="text-lg lg:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-8 leading-relaxed">
            Управление финансами, аналитика доходов и расходов, отчетность и планирование бюджета.
          </p>
          
          <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-12 max-w-2xl mx-auto">
            <div className="w-16 h-16 mx-auto mb-6 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              Раздел в разработке
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Этот раздел находится в активной разработке. Скоро здесь появятся инструменты для финансового учета, создания отчетов и управления бюджетом.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
