"use client";

interface DepositBreakdownProps {
  amount: number;
  currency: string;
  platformCommissionPercent: number;
  platformCommissionAmount: number;
  managerEarnings: number;
  className?: string;
}

export default function DepositBreakdown({ 
  amount, 
  currency, 
  platformCommissionPercent, 
  platformCommissionAmount, 
  managerEarnings,
  className = "" 
}: DepositBreakdownProps) {
  const formatCurrency = (value: number, curr: string) => {
    return `${value.toFixed(2)} ${curr}`;
  };

  return (
    <div className={`bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-800 p-4 ${className}`}>
      <div className="flex items-center gap-2 mb-3">
        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
          <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">
          Разбивка депозита
        </h3>
      </div>

      <div className="space-y-4">
        {/* Общая сумма */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Общая сумма депозита
            </span>
            <span className="text-lg font-bold text-gray-900 dark:text-white">
              {formatCurrency(amount, currency)}
            </span>
          </div>
        </div>

        {/* Комиссия платформы */}
        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 border border-red-200 dark:border-red-800">
          <div className="flex justify-between items-center">
            <div>
              <span className="text-sm font-medium text-red-700 dark:text-red-300">
                Комиссия платформы
              </span>
              <div className="text-xs text-red-600 dark:text-red-400">
                ({platformCommissionPercent}%)
              </div>
            </div>
            <span className="text-lg font-bold text-red-800 dark:text-red-200">
              -{formatCurrency(platformCommissionAmount, currency)}
            </span>
          </div>
        </div>

        {/* Заработок менеджера */}
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 border border-green-200 dark:border-green-800">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-green-700 dark:text-green-300">
              Ваш заработок с депозита
            </span>
            <span className="text-lg font-bold text-green-800 dark:text-green-200">
              {formatCurrency(managerEarnings, currency)}
            </span>
          </div>
        </div>

        {/* Пояснение */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
          <div className="text-xs text-blue-700 dark:text-blue-300">
            <strong>Как это работает:</strong> С общей суммы депозита удерживается комиссия платформы, 
            оставшаяся часть идет в ваш заработок. Дополнительно вы получаете бонусы согласно бонусной сетке.
          </div>
        </div>
      </div>
    </div>
  );
}
