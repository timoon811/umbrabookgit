"use client";

import { useState, useEffect } from "react";
import { BuyerBonusScheme, BuyerBonusAssignment, BuyerBonusFilters } from "@/types/buyer";

export default function BuyerBonusSystem() {
  const [activeSchemes, setActiveSchemes] = useState<BuyerBonusAssignment[]>([]);
  const [bonusHistory, setBonusHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('current');
  const [currentBonusForecast, setCurrentBonusForecast] = useState<any>(null);

  useEffect(() => {
    loadBonusData();
  }, []);

  const loadBonusData = async () => {
    try {
      setLoading(true);
      
      // Загружаем активные схемы бонусов
      const schemesResponse = await fetch('/api/buyer/bonus/assignments');
      if (schemesResponse.ok) {
        const schemesData = await schemesResponse.json();
        setActiveSchemes(schemesData.assignments || []);
      }

      // Загружаем прогноз текущего бонуса
      const forecastResponse = await fetch('/api/buyer/bonus/forecast');
      if (forecastResponse.ok) {
        const forecastData = await forecastResponse.json();
        setCurrentBonusForecast(forecastData.forecast);
      }

      // Загружаем историю бонусов
      const historyResponse = await fetch('/api/buyer/bonus/history');
      if (historyResponse.ok) {
        const historyData = await historyResponse.json();
        setBonusHistory(historyData.history || []);
      }
    } catch (error) {
      setError('Ошибка загрузки данных о бонусах');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const getSchemeTypeLabel = (type: string) => {
    switch (type) {
      case 'FIFTY_FIFTY': return '50/50';
      case 'TIERED': return 'Тирная система';
      case 'FIXED_RATE': return 'Фиксированная ставка';
      case 'PERFORMANCE': return 'За результат';
      case 'CUSTOM': return 'Индивидуальная';
      default: return type;
    }
  };

  const getSchemeTypeColor = (type: string) => {
    switch (type) {
      case 'FIFTY_FIFTY': 
        return 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400';
      case 'TIERED': 
        return 'bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400';
      case 'FIXED_RATE': 
        return 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400';
      case 'PERFORMANCE': 
        return 'bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400';
      case 'CUSTOM': 
        return 'bg-gray-100 dark:bg-gray-900/20 text-gray-700 dark:text-gray-400';
      default: 
        return 'bg-gray-100 dark:bg-gray-900/20 text-gray-700 dark:text-gray-400';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="text-center text-red-600 dark:text-red-400">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Система бонусов
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Управление схемами мотивации и прогноз выплат
            </p>
          </div>
          
          {currentBonusForecast && (
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-4">
              <div className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">Прогноз бонуса за месяц</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {formatCurrency(currentBonusForecast.estimatedAmount)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  При текущей динамике ({currentBonusForecast.confidence}% уверенности)
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'current', name: 'Текущие схемы', icon: '💰' },
              { id: 'history', name: 'История выплат', icon: '📊' },
              { id: 'calculator', name: 'Калькулятор', icon: '🧮' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'current' && (
            <CurrentBonusSchemes schemes={activeSchemes} />
          )}

          {activeTab === 'history' && (
            <BonusHistory history={bonusHistory} />
          )}

          {activeTab === 'calculator' && (
            <BonusCalculator schemes={activeSchemes} />
          )}
        </div>
      </div>
    </div>
  );
}

// Компонент текущих схем бонусов
function CurrentBonusSchemes({ schemes }: { schemes: BuyerBonusAssignment[] }) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const getSchemeTypeLabel = (type: string) => {
    switch (type) {
      case 'FIFTY_FIFTY': return '50/50';
      case 'TIERED': return 'Тирная система';
      case 'FIXED_RATE': return 'Фиксированная ставка';
      case 'PERFORMANCE': return 'За результат';
      case 'CUSTOM': return 'Индивидуальная';
      default: return type;
    }
  };

  const getSchemeTypeColor = (type: string) => {
    switch (type) {
      case 'FIFTY_FIFTY': 
        return 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400';
      case 'TIERED': 
        return 'bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400';
      case 'FIXED_RATE': 
        return 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400';
      case 'PERFORMANCE': 
        return 'bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400';
      case 'CUSTOM': 
        return 'bg-gray-100 dark:bg-gray-900/20 text-gray-700 dark:text-gray-400';
      default: 
        return 'bg-gray-100 dark:bg-gray-900/20 text-gray-700 dark:text-gray-400';
    }
  };

  if (schemes.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Нет активных схем бонусов
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Обратитесь к Lead Buyer для назначения схемы мотивации
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
        Активные схемы бонусов
      </h3>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {schemes.map((assignment) => (
          <div key={assignment.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                  {assignment.bonusScheme?.name}
                </h4>
                <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                  getSchemeTypeColor(assignment.bonusScheme?.type || '')
                }`}>
                  {getSchemeTypeLabel(assignment.bonusScheme?.type || '')}
                </span>
              </div>
              
              <div className="text-right">
                <p className="text-sm text-gray-600 dark:text-gray-400">Активна с</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {new Date(assignment.assignedAt).toLocaleDateString('ru-RU')}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {assignment.bonusScheme?.description}
              </p>
              
              {assignment.bonusScheme?.configuration && (
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Параметры схемы:
                  </p>
                  <BonusSchemeConfig config={assignment.bonusScheme.configuration} />
                </div>
              )}

              {assignment.currentBonus !== undefined && (
                <div className="flex justify-between items-center pt-3 border-t border-gray-200 dark:border-gray-700">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Текущий бонус за месяц:
                  </span>
                  <span className="text-lg font-bold text-green-600 dark:text-green-400">
                    {formatCurrency(assignment.currentBonus)}
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Компонент для отображения конфигурации схемы бонусов
function BonusSchemeConfig({ config }: { config: string }) {
  try {
    const parsedConfig = JSON.parse(config);
    
    return (
      <div className="space-y-2 text-sm">
        {Object.entries(parsedConfig).map(([key, value]) => (
          <div key={key} className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400 capitalize">
              {key.replace(/([A-Z])/g, ' $1').toLowerCase()}:
            </span>
            <span className="text-gray-900 dark:text-white font-medium">
              {typeof value === 'number' && key.includes('rate') 
                ? `${(value * 100).toFixed(1)}%`
                : typeof value === 'number' && key.includes('amount')
                ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)
                : String(value)
              }
            </span>
          </div>
        ))}
      </div>
    );
  } catch {
    return (
      <p className="text-xs text-gray-500 dark:text-gray-500">
        Конфигурация схемы
      </p>
    );
  }
}

// Компонент истории бонусов
function BonusHistory({ history }: { history: any[] }) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  if (history.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          История бонусов пуста
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Здесь будут отображаться выплаченные бонусы
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
        История выплат бонусов
      </h3>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Период</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Схема</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Сумма</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Статус</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Выплачено</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {history.map((entry, index) => (
              <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                <td className="px-4 py-4 text-sm text-gray-900 dark:text-white">
                  {entry.period}
                </td>
                <td className="px-4 py-4 text-sm text-gray-900 dark:text-white">
                  {entry.schemeName}
                </td>
                <td className="px-4 py-4 text-sm font-medium text-gray-900 dark:text-white">
                  {formatCurrency(entry.amount)}
                </td>
                <td className="px-4 py-4">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    entry.status === 'PAID' ? 'bg-green-100 text-green-800' :
                    entry.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {entry.status === 'PAID' ? 'Выплачено' :
                     entry.status === 'PENDING' ? 'В ожидании' : 'Рассчитан'}
                  </span>
                </td>
                <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-400">
                  {entry.paidAt ? new Date(entry.paidAt).toLocaleDateString('ru-RU') : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Компонент калькулятора бонусов
function BonusCalculator({ schemes }: { schemes: BuyerBonusAssignment[] }) {
  const [calculatorInputs, setCalculatorInputs] = useState({
    spend: 10000,
    revenue: 15000,
    deposits: 50,
    days: 30
  });
  const [calculationResults, setCalculationResults] = useState<any[]>([]);

  const calculateBonuses = () => {
    const results = schemes.map(assignment => {
      const scheme = assignment.bonusScheme;
      let bonusAmount = 0;
      
      if (scheme?.configuration) {
        try {
          const config = JSON.parse(scheme.configuration);
          const profit = calculatorInputs.revenue - calculatorInputs.spend;
          
          switch (scheme.type) {
            case 'FIFTY_FIFTY':
              bonusAmount = profit * 0.5;
              break;
            case 'FIXED_RATE':
              bonusAmount = calculatorInputs.revenue * (config.rate || 0.1);
              break;
            case 'TIERED':
              if (config.tiers) {
                for (const tier of config.tiers) {
                  if (profit >= tier.minProfit) {
                    bonusAmount = profit * tier.rate;
                  }
                }
              }
              break;
            case 'PERFORMANCE':
              if (config.targets) {
                const roas = calculatorInputs.revenue / calculatorInputs.spend;
                if (roas >= config.targets.minROAS) {
                  bonusAmount = profit * (config.baseRate || 0.3);
                  if (roas >= config.targets.bonusROAS) {
                    bonusAmount *= 1.5; // Бонус за превышение целевого ROAS
                  }
                }
              }
              break;
          }
        } catch (error) {
          console.error('Error calculating bonus:', error);
        }
      }
      
      return {
        schemeName: scheme?.name,
        bonusAmount: Math.max(0, bonusAmount)
      };
    });
    
    setCalculationResults(results);
  };

  useEffect(() => {
    calculateBonuses();
  }, [calculatorInputs, schemes]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
        Калькулятор бонусов
      </h3>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Входные параметры */}
        <div className="space-y-4">
          <h4 className="text-md font-medium text-gray-900 dark:text-white">
            Введите параметры
          </h4>
          
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Spend (USD)
              </label>
              <input
                type="number"
                value={calculatorInputs.spend}
                onChange={(e) => setCalculatorInputs({
                  ...calculatorInputs,
                  spend: parseFloat(e.target.value) || 0
                })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Revenue (USD)
              </label>
              <input
                type="number"
                value={calculatorInputs.revenue}
                onChange={(e) => setCalculatorInputs({
                  ...calculatorInputs,
                  revenue: parseFloat(e.target.value) || 0
                })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Количество депозитов
              </label>
              <input
                type="number"
                value={calculatorInputs.deposits}
                onChange={(e) => setCalculatorInputs({
                  ...calculatorInputs,
                  deposits: parseInt(e.target.value) || 0
                })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
              />
            </div>
            
            <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Прибыль:</span>
                  <span className={`block font-medium ${
                    (calculatorInputs.revenue - calculatorInputs.spend) >= 0 
                      ? 'text-green-600 dark:text-green-400' 
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    {formatCurrency(calculatorInputs.revenue - calculatorInputs.spend)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">ROAS:</span>
                  <span className="block font-medium text-gray-900 dark:text-white">
                    {calculatorInputs.spend > 0 ? (calculatorInputs.revenue / calculatorInputs.spend).toFixed(2) : '0.00'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Результаты расчета */}
        <div className="space-y-4">
          <h4 className="text-md font-medium text-gray-900 dark:text-white">
            Расчет бонусов
          </h4>
          
          {calculationResults.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600 dark:text-gray-400">
                Нет активных схем для расчета
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {calculationResults.map((result, index) => (
                <div key={index} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-900 dark:text-white">
                      {result.schemeName}
                    </span>
                    <span className="text-lg font-bold text-green-600 dark:text-green-400">
                      {formatCurrency(result.bonusAmount)}
                    </span>
                  </div>
                </div>
              ))}
              
              <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-900 dark:text-white">
                    Общий бонус:
                  </span>
                  <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
                    {formatCurrency(calculationResults.reduce((sum, result) => sum + result.bonusAmount, 0))}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

