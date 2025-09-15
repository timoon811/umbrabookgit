"use client";

import React from 'react';

// Компонент прогресс-бара
export const ProgressBar: React.FC<{
  label: string;
  value: number;
  target: number;
  color: string;
  unit?: string;
  milestones?: Array<{ value: number; label: string; }>;
  monthlyBonus?: { bonusPercent: number; minAmount: number; eligible: boolean; };
}> = ({ label, value, target, color, unit = '', milestones, monthlyBonus }) => {
  const percentage = Math.min((value / target) * 100, 100);
  
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center text-sm">
        <span className="font-medium text-gray-700 dark:text-gray-300">{label}</span>
        <span className="text-gray-600 dark:text-gray-400">
          {value.toLocaleString()}{unit} / {target.toLocaleString()}{unit}
        </span>
      </div>
      
      {/* Информация о месячном бонусе */}
      {monthlyBonus && (
        <div className={`text-xs px-3 py-2 rounded-lg border ${
          monthlyBonus.eligible 
            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300'
            : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300'
        }`}>
          <div className="flex items-center justify-between">
            <span className="font-medium">
              <div className="flex items-center gap-2">
                {monthlyBonus.eligible ? (
                  <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                )}
                Месячный бонус: +{monthlyBonus.bonusPercent}%
              </div>
            </span>
            {monthlyBonus.eligible && (
              <span className="text-xs opacity-75">
                План выполнен!
              </span>
            )}
          </div>
          <div className="text-xs opacity-75 mt-1">
            {monthlyBonus.eligible 
              ? `Вы получите дополнительно ${monthlyBonus.bonusPercent}% от общего объема депозитов за месяц`
              : `При достижении $${monthlyBonus.minAmount.toLocaleString()} получите дополнительно ${monthlyBonus.bonusPercent}% от общего объема`
            }
          </div>
        </div>
      )}
      
      <div className="relative w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
        <div
          className={`h-3 rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${percentage}%` }}
        />
        {/* Отметки для месячных планов */}
        {milestones && milestones.map((milestone, index) => {
          const milestonePercentage = Math.min((milestone.value / target) * 100, 100);
          return (
            <div
              key={index}
              className="absolute top-0 h-3 w-0.5 bg-white dark:bg-gray-600"
              style={{ left: `${milestonePercentage}%` }}
              title={milestone.label}
            />
          );
        })}
      </div>
      <div className="flex justify-between items-center">
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {percentage.toFixed(1)}% выполнено
        </div>
        {milestones && (
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Планы: {milestones.map(m => `$${m.value.toLocaleString()}`).join(', ')}
          </div>
        )}
      </div>
    </div>
  );
};

// Компонент выбора периода (компактный)
export const PeriodSelector: React.FC<{
  selectedPeriod: 'current' | 'previous' | 'custom';
  customDateRange: { start: string; end: string };
  onPeriodChange: (period: 'current' | 'previous' | 'custom') => void;
  onCustomDateChange: (range: { start: string; end: string }) => void;
  onCustomApply: () => void;
}> = ({ selectedPeriod, customDateRange, onPeriodChange, onCustomDateChange, onCustomApply }) => {
  const [showCustom, setShowCustom] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // Закрытие при клике вне компонента и нажатии Escape
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowCustom(false);
      }
    };

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowCustom(false);
      }
    };

    if (showCustom) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscapeKey);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [showCustom]);

  const handlePeriodSelect = (period: 'current' | 'previous' | 'custom') => {
    if (period === 'custom') {
      setShowCustom(true);
    } else {
      setShowCustom(false);
      onPeriodChange(period);
    }
  };

  const handleCustomApply = () => {
    onCustomApply();
    setShowCustom(false);
  };

  const getPeriodLabel = () => {
    switch (selectedPeriod) {
      case 'current': return 'Текущий месяц';
      case 'previous': return 'Прошлый месяц';
      case 'custom': return customDateRange.start && customDateRange.end 
        ? `${new Date(customDateRange.start).toLocaleDateString('ru-RU')} - ${new Date(customDateRange.end).toLocaleDateString('ru-RU')}`
        : 'Выбрать период';
      default: return 'Текущий месяц';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Основной селектор */}
      <div className="flex items-center gap-2">
        <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        
        <select
          value={selectedPeriod}
          onChange={(e) => handlePeriodSelect(e.target.value as 'current' | 'previous' | 'custom')}
          className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="current">Текущий месяц</option>
          <option value="previous">Прошлый месяц</option>
          <option value="custom">Выбрать период</option>
        </select>

        {selectedPeriod === 'custom' && (
          <button
            onClick={() => setShowCustom(!showCustom)}
            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
          >
            {showCustom ? 'Скрыть' : 'Настроить'}
          </button>
        )}
      </div>

      {/* Кастомный период */}
      {showCustom && (
        <div className="absolute top-full left-0 mt-2 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 min-w-[320px]">
          <div className="space-y-4">
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Выберите период:
            </div>
            
            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1.5">
                  Дата начала
                </label>
                <input
                  type="date"
                  value={customDateRange.start}
                  onChange={(e) => onCustomDateChange({ ...customDateRange, start: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1.5">
                  Дата окончания
                </label>
                <input
                  type="date"
                  value={customDateRange.end}
                  onChange={(e) => onCustomDateChange({ ...customDateRange, end: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-gray-200 dark:border-gray-600">
              <button
                onClick={() => setShowCustom(false)}
                className="flex-1 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={handleCustomApply}
                disabled={!customDateRange.start || !customDateRange.end}
                className="flex-1 px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Применить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Компонент метрики
export const MetricCard: React.FC<{
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  gradient: string;
}> = ({ title, value, subtitle, icon, trend, gradient }) => {
  return (
    <div className={`${gradient} rounded-xl border p-4 relative overflow-hidden`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
            {title}
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          {subtitle && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {subtitle}
            </p>
          )}
          {trend && (
            <div className={`flex items-center gap-1 mt-2 text-xs ${
              trend.isPositive ? 'text-green-600' : 'text-red-600'
            }`}>
              {trend.isPositive ? (
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 10.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l4.293-4.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
              {Math.abs(trend.value)}%
            </div>
          )}
        </div>
        <div className="p-2 rounded-lg bg-white/10 dark:bg-black/10">
          {icon}
        </div>
      </div>
    </div>
  );
};

// Компонент рейтинга
export const LeaderboardCard: React.FC<{
  leaderboard: Array<{
    rank: number;
    name: string;
    isCurrentUser: boolean;
    earnings: number;
    deposits: number;
    volume: number;
  }>;
  currentUserRank: number | null;
}> = ({ leaderboard, currentUserRank }) => {
  const topThree = leaderboard.slice(0, 3);
  const otherUsers = leaderboard.slice(3, 7);
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center gap-2 mb-6">
        <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
          <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Рейтинг менеджеров
        </h3>
      </div>

      {/* Топ 3 */}
      <div className="space-y-3 mb-6">
        {topThree.map((user) => (
          <div
            key={user.rank}
            className={`flex items-center gap-4 p-3 rounded-lg transition-colors ${
              user.isCurrentUser 
                ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800' 
                : 'bg-gray-50 dark:bg-gray-700/50'
            }`}
          >
            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
              user.rank === 1 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
              user.rank === 2 ? 'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-200' :
              user.rank === 3 ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' :
              'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
            }`}>
              {user.rank === 1 ? '🥇' : user.rank === 2 ? '🥈' : user.rank === 3 ? '🥉' : user.rank}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className={`font-medium truncate ${
                  user.isCurrentUser ? 'text-blue-900 dark:text-blue-100' : 'text-gray-900 dark:text-white'
                }`}>
                  {user.name}
                  {user.isCurrentUser && (
                    <span className="ml-2 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 text-xs rounded-full">
                      Вы
                    </span>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                <span>${user.earnings.toLocaleString()}</span>
                <span>{user.deposits} деп.</span>
                <span>${user.volume.toLocaleString()} об.</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Остальные пользователи (компактно) */}
      {otherUsers.length > 0 && (
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <div className="space-y-2">
            {otherUsers.map((user) => (
              <div
                key={user.rank}
                className={`flex items-center justify-between text-sm p-2 rounded ${
                  user.isCurrentUser 
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-900 dark:text-blue-100' 
                    : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 text-center font-medium">#{user.rank}</span>
                  <span className={user.isCurrentUser ? 'font-medium' : ''}>
                    {user.name}
                    {user.isCurrentUser && <span className="ml-1 text-blue-600 dark:text-blue-400">(Вы)</span>}
                  </span>
                </div>
                <span className="font-medium">${user.earnings.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Позиция текущего пользователя, если он не в топе */}
      {currentUserRank && currentUserRank > 7 && (
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
          <div className="text-center text-sm text-gray-600 dark:text-gray-400">
            Ваша позиция: <span className="font-semibold text-blue-600 dark:text-blue-400">#{currentUserRank}</span>
          </div>
        </div>
      )}
    </div>
  );
};

// Компонент прогноза
export const ProjectionCard: React.FC<{
  projections: {
    monthlyEarnings: number;
    remainingDays: number;
    dailyTarget: number;
    onTrack: boolean;
  };
}> = ({ projections }) => {
  return (
    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800 p-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
          <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Прогноз заработка
        </h3>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-400">Прогноз на месяц:</span>
          <span className="text-xl font-bold text-emerald-700 dark:text-emerald-300">
            ${projections.monthlyEarnings.toLocaleString()}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-400">Дней осталось:</span>
          <span className="font-semibold text-gray-900 dark:text-white">
            {projections.remainingDays}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-400">Дневная цель:</span>
          <span className="font-semibold text-gray-900 dark:text-white">
            ${projections.dailyTarget ? projections.dailyTarget.toFixed(2) : '0.00'}
          </span>
        </div>

        <div className={`flex items-center gap-2 p-3 rounded-lg ${
          projections.onTrack 
            ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200' 
            : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200'
        }`}>
          {projections.onTrack ? (
            <>
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-medium">Вы на правильном пути!</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-medium">Нужно увеличить темп</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// Компонент целей на смену
export const ShiftGoalsCard: React.FC<{
  shiftData: {
    currentSum: number;
    shiftType: string;
    isActive: boolean;
    startTime?: string;
    endTime?: string;
  };
  bonusGrid: Array<{
    id: string;
    minAmount: number;
    maxAmount?: number;
    bonusPercentage: number;
    shiftType: string;
    description?: string;
  }>;
}> = ({ shiftData, bonusGrid }) => {
  
  // Фильтруем сетку для текущего типа смены
  const currentGrid = bonusGrid.filter(grid => 
    grid.shiftType === shiftData.shiftType
  );
  
  // Находим текущий уровень
  const currentLevel = currentGrid.find(grid => 
    shiftData.currentSum >= grid.minAmount && 
    (!grid.maxAmount || shiftData.currentSum <= grid.maxAmount)
  );
  
  // Находим следующий уровень
  const nextLevel = currentGrid.find(grid => 
    grid.minAmount > shiftData.currentSum
  );
  
  const formatShiftType = (type: string) => {
    const types = {
      'MORNING': 'Утренняя',
      'DAY': 'Дневная', 
      'NIGHT': 'Ночная'
    };
    return types[type as keyof typeof types] || type;
  };

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl border border-indigo-200 dark:border-indigo-800 p-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
          <svg className="w-5 h-5 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 00-2-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Цель на смену
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {formatShiftType(shiftData.shiftType)} смена {shiftData.isActive ? '(активна)' : ''}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Текущий прогресс */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Депозиты за смену
            </span>
            <span className="text-lg font-bold text-indigo-700 dark:text-indigo-300">
              ${shiftData.currentSum.toLocaleString()}
            </span>
          </div>
          
          {currentLevel && (
            <div className="text-xs text-gray-600 dark:text-gray-400">
              Текущий уровень: <span className="font-medium text-green-600 dark:text-green-400">
                {currentLevel.bonusPercentage}% бонус
              </span>
            </div>
          )}
        </div>

        {/* Градация бонусной сетки */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Бонусная сетка для смены:
          </h4>
          
          {currentGrid.length > 0 ? (
            <div className="space-y-2">
              {currentGrid.map((level, index) => {
                const isCurrentLevel = currentLevel?.id === level.id;
                const isPassed = shiftData.currentSum >= level.minAmount;
                const isNext = nextLevel?.id === level.id;
                
                return (
                  <div 
                    key={level.id}
                    className={`relative p-3 rounded-lg border transition-all ${
                      isCurrentLevel 
                        ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700 ring-2 ring-green-200 dark:ring-green-800'
                        : isPassed 
                        ? 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                        : isNext
                        ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700'
                        : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {isPassed ? (
                          <div className="w-5 h-5 bg-green-500 text-white rounded-full flex items-center justify-center">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        ) : isNext ? (
                          <div className="w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                            !
                          </div>
                        ) : (
                          <div className="w-5 h-5 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                        )}
                        
                        <span className={`font-medium ${
                          isCurrentLevel 
                            ? 'text-green-700 dark:text-green-300'
                            : isPassed 
                            ? 'text-gray-600 dark:text-gray-400'
                            : isNext
                            ? 'text-blue-700 dark:text-blue-300'
                            : 'text-gray-500 dark:text-gray-500'
                        }`}>
                          ${level.minAmount.toLocaleString()}
                          {level.maxAmount ? ` - $${level.maxAmount.toLocaleString()}` : '+'}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className={`font-bold ${
                          isCurrentLevel 
                            ? 'text-green-700 dark:text-green-300'
                            : isPassed 
                            ? 'text-gray-600 dark:text-gray-400'
                            : isNext
                            ? 'text-blue-700 dark:text-blue-300'
                            : 'text-gray-500 dark:text-gray-500'
                        }`}>
                          {level.bonusPercentage}%
                        </span>
                        
                        {isNext && (
                          <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                            Ещё ${(level.minAmount - shiftData.currentSum).toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {isCurrentLevel && (
                      <div className="mt-2 text-xs text-green-600 dark:text-green-400">
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                          </svg>
                          Текущий уровень
                        </div>
                      </div>
                    )}
                    
                    {isNext && (
                      <div className="mt-2 text-xs text-blue-600 dark:text-blue-400">
                        🚀 Следующая цель
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500 dark:text-gray-400">
              <p>Бонусная сетка для {formatShiftType(shiftData.shiftType)} смены не настроена</p>
            </div>
          )}
        </div>

        {/* Прогресс к следующему уровню */}
        {nextLevel && (
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                До следующего уровня ({nextLevel.bonusPercentage}%)
              </span>
              <span className="text-lg font-bold text-blue-700 dark:text-blue-300">
                ${(nextLevel.minAmount - shiftData.currentSum).toLocaleString()}
              </span>
            </div>
            
            <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                style={{ 
                  width: `${Math.min((shiftData.currentSum / nextLevel.minAmount) * 100, 100)}%` 
                }}
              />
            </div>
            
            <div className="mt-2 text-xs text-blue-600 dark:text-blue-400">
              {((shiftData.currentSum / nextLevel.minAmount) * 100).toFixed(1)}% прогресс к следующему уровню
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
