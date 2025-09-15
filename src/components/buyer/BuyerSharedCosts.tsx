"use client";

import { useState, useEffect } from "react";
import { SharedCost, SharedCostAllocation, ConsumableItem } from "@/types/buyer";

export default function BuyerSharedCosts() {
  const [sharedCosts, setSharedCosts] = useState<SharedCost[]>([]);
  const [allocations, setAllocations] = useState<SharedCostAllocation[]>([]);
  const [consumables, setConsumables] = useState<ConsumableItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('allocations');

  useEffect(() => {
    loadSharedCostsData();
  }, []);

  const loadSharedCostsData = async () => {
    try {
      setLoading(true);
      
      // Загружаем аллокации пользователя
      const allocationsResponse = await fetch('/api/buyer/shared-costs/allocations');
      if (allocationsResponse.ok) {
        const allocationsData = await allocationsResponse.json();
        setAllocations(allocationsData.allocations || []);
      }

      // Загружаем общие расходы
      const costsResponse = await fetch('/api/buyer/shared-costs');
      if (costsResponse.ok) {
        const costsData = await costsResponse.json();
        setSharedCosts(costsData.costs || []);
      }

      // Загружаем каталог расходников
      const consumablesResponse = await fetch('/api/buyer/consumables');
      if (consumablesResponse.ok) {
        const consumablesData = await consumablesResponse.json();
        setConsumables(consumablesData.items || []);
      }
    } catch (error) {
      setError('Ошибка загрузки данных об общих расходах');
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

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'INFRASTRUCTURE':
        return 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400';
      case 'TOOLS':
        return 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400';
      case 'PROXIES':
        return 'bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400';
      case 'ACCOUNTS':
        return 'bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400';
      case 'DOMAINS':
        return 'bg-pink-100 dark:bg-pink-900/20 text-pink-700 dark:text-pink-400';
      case 'OTHER':
        return 'bg-gray-100 dark:bg-gray-900/20 text-gray-700 dark:text-gray-400';
      default:
        return 'bg-gray-100 dark:bg-gray-900/20 text-gray-700 dark:text-gray-400';
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'INFRASTRUCTURE': return 'Инфраструктура';
      case 'TOOLS': return 'Инструменты';
      case 'PROXIES': return 'Прокси';
      case 'ACCOUNTS': return 'Аккаунты';
      case 'DOMAINS': return 'Домены';
      case 'OTHER': return 'Прочее';
      default: return category;
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

  const totalAllocated = allocations.reduce((sum, allocation) => sum + allocation.allocatedAmount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Общие расходы
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Управление аллокацией общих расходов и расходников
            </p>
          </div>
          
          <div className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-lg p-4">
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">Моя доля за месяц</p>
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {formatCurrency(totalAllocated)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500">
                Аллокировано на мои проекты
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'allocations', name: 'Мои аллокации', icon: '📊' },
              { id: 'costs', name: 'Общие расходы', icon: '💼' },
              { id: 'consumables', name: 'Каталог расходников', icon: '🛒' }
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
          {activeTab === 'allocations' && (
            <AllocationsList allocations={allocations} />
          )}

          {activeTab === 'costs' && (
            <SharedCostsList costs={sharedCosts} />
          )}

          {activeTab === 'consumables' && (
            <ConsumablesCatalog items={consumables} />
          )}
        </div>
      </div>
    </div>
  );
}

// Компонент списка аллокаций
function AllocationsList({ allocations }: { allocations: SharedCostAllocation[] }) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  if (allocations.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Нет аллокаций
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Здесь будут отображаться ваши доли в общих расходах
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
        Мои аллокации общих расходов
      </h3>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Расход</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Тип</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Общая сумма</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Моя доля</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Аллокация</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Период</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {allocations.map((allocation) => (
              <tr key={allocation.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                <td className="px-4 py-4 text-sm font-medium text-gray-900 dark:text-white">
                  {allocation.sharedCost?.name}
                </td>
                <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-400">
                  {allocation.allocationType === 'PERCENTAGE' ? 'Процент' :
                   allocation.allocationType === 'FIXED_AMOUNT' ? 'Фиксированная сумма' :
                   allocation.allocationType === 'PROJECT_BASED' ? 'По проектам' : 'По использованию'}
                </td>
                <td className="px-4 py-4 text-sm text-gray-900 dark:text-white">
                  {formatCurrency(allocation.sharedCost?.totalAmount || 0)}
                </td>
                <td className="px-4 py-4 text-sm text-gray-900 dark:text-white">
                  {allocation.allocationType === 'PERCENTAGE' 
                    ? `${(allocation.allocationValue * 100).toFixed(1)}%`
                    : formatCurrency(allocation.allocationValue)
                  }
                </td>
                <td className="px-4 py-4 text-sm font-medium text-gray-900 dark:text-white">
                  {formatCurrency(allocation.allocatedAmount)}
                </td>
                <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-400">
                  {allocation.sharedCost?.period}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Компонент списка общих расходов
function SharedCostsList({ costs }: { costs: SharedCost[] }) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'INFRASTRUCTURE': return 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400';
      case 'TOOLS': return 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400';
      case 'PROXIES': return 'bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400';
      case 'ACCOUNTS': return 'bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400';
      case 'DOMAINS': return 'bg-pink-100 dark:bg-pink-900/20 text-pink-700 dark:text-pink-400';
      default: return 'bg-gray-100 dark:bg-gray-900/20 text-gray-700 dark:text-gray-400';
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'INFRASTRUCTURE': return 'Инфраструктура';
      case 'TOOLS': return 'Инструменты';
      case 'PROXIES': return 'Прокси';
      case 'ACCOUNTS': return 'Аккаунты';
      case 'DOMAINS': return 'Домены';
      default: return category;
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
        Общие расходы команды
      </h3>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {costs.map((cost) => (
          <div key={cost.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                  {cost.name}
                </h4>
                <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(cost.category)}`}>
                  {getCategoryLabel(cost.category)}
                </span>
              </div>
              
              <div className="text-right">
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {formatCurrency(cost.totalAmount)}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {cost.period}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {cost.description}
              </p>
              
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Участников:</span>
                <span className="text-gray-900 dark:text-white">{cost.participants}</span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Статус:</span>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  cost.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                  cost.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {cost.status === 'ACTIVE' ? 'Активен' :
                   cost.status === 'PENDING' ? 'В ожидании' : 'Завершен'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Компонент каталога расходников
function ConsumablesCatalog({ items }: { items: ConsumableItem[] }) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'PROXIES': return 'bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400';
      case 'ACCOUNTS': return 'bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400';
      case 'DOMAINS': return 'bg-pink-100 dark:bg-pink-900/20 text-pink-700 dark:text-pink-400';
      case 'TOOLS': return 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400';
      default: return 'bg-gray-100 dark:bg-gray-900/20 text-gray-700 dark:text-gray-400';
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'PROXIES': return 'Прокси';
      case 'ACCOUNTS': return 'Аккаунты';
      case 'DOMAINS': return 'Домены';
      case 'TOOLS': return 'Инструменты';
      default: return category;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Каталог расходников
        </h3>
        <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
          Запросить расходники
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item) => (
          <div key={item.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">
                  {item.name}
                </h4>
                <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(item.category)}`}>
                  {getCategoryLabel(item.category)}
                </span>
              </div>
              
              <div className="text-right">
                <p className="font-bold text-gray-900 dark:text-white">
                  {formatCurrency(item.unitPrice)}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  за {item.unit}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {item.description}
              </p>
              
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">В наличии:</span>
                <span className={`font-medium ${
                  item.availableQuantity > 10 ? 'text-green-600' :
                  item.availableQuantity > 0 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {item.availableQuantity} {item.unit}
                </span>
              </div>
              
              {item.tags && item.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {item.tags.map((tag, index) => (
                    <span key={index} className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

