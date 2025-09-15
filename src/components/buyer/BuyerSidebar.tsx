"use client";

import { BuyerStats } from "@/types/buyer";

interface TabInfo {
  id: string;
  name: string;
  icon: string;
  badge?: number;
}

interface BuyerSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  tabs: TabInfo[];
  stats?: BuyerStats | null;
}

export default function BuyerSidebar({ activeTab, onTabChange, tabs, stats }: BuyerSidebarProps) {
  return (
    <div className="space-y-6">
      {/* Navigation */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
          Навигация
        </h3>
        <nav className="space-y-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
              </svg>
              <span className="font-medium">{tab.name}</span>
              {tab.badge && tab.badge > 0 && (
                <span className="ml-auto bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Today/Yesterday Summary */}
      {stats && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
            Сегодня/Вчера
          </h3>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600 dark:text-gray-400">Сегодня</div>
              <div className={`text-xs px-2 py-1 rounded-full ${
                stats.todayYesterday.today.hasLog 
                  ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                  : 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400'
              }`}>
                {stats.todayYesterday.today.hasLog ? 'Заполнено' : 'Ожидает'}
              </div>
            </div>
            <div className="text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Spend:</span>
                <span className="text-gray-900 dark:text-white font-medium">
                  ${stats.todayYesterday.today.spend.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Deposits:</span>
                <span className="text-gray-900 dark:text-white font-medium">
                  ${stats.todayYesterday.today.deposits.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
              <div className="flex justify-between items-center mb-2">
                <div className="text-sm text-gray-600 dark:text-gray-400">Вчера</div>
                <div className={`text-xs px-2 py-1 rounded-full ${
                  stats.todayYesterday.yesterday.hasLog 
                    ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                    : 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                }`}>
                  {stats.todayYesterday.yesterday.hasLog ? 'Заполнено' : 'Пропущено'}
                </div>
              </div>
              <div className="text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Spend:</span>
                  <span className="text-gray-900 dark:text-white font-medium">
                    ${stats.todayYesterday.yesterday.spend.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Deposits:</span>
                  <span className="text-gray-900 dark:text-white font-medium">
                    ${stats.todayYesterday.yesterday.deposits.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Alerts Summary */}
      {stats && stats.alerts.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
            Активные сигналы
          </h3>
          
          <div className="space-y-2">
            {stats.alerts.slice(0, 3).map((alert) => (
              <div key={alert.id} className={`p-2 rounded-lg border-l-4 ${
                alert.severity === 'CRITICAL' ? 'border-red-500 bg-red-50 dark:bg-red-900/20' :
                alert.severity === 'HIGH' ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20' :
                alert.severity === 'MEDIUM' ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20' :
                'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
              }`}>
                <div className="text-xs font-medium text-gray-900 dark:text-white">
                  {alert.title}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  {alert.description.length > 50 
                    ? `${alert.description.substring(0, 50)}...` 
                    : alert.description
                  }
                </div>
              </div>
            ))}
            
            {stats.alerts.length > 3 && (
              <div className="text-xs text-gray-500 dark:text-gray-400 text-center pt-2">
                +{stats.alerts.length - 3} ещё
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

