"use client";

import { BuyerStats } from "@/types/buyer";

interface BuyerStatsCardsProps {
  stats: BuyerStats;
}

export default function BuyerStatsCards({ stats }: BuyerStatsCardsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatPercent = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const cards = [
    {
      title: "Spend (период)",
      value: formatCurrency(stats.currentPeriod.spend),
      icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1",
      color: "red",
      change: stats.todayYesterday.today.spend > stats.todayYesterday.yesterday.spend ? "up" : "down"
    },
    {
      title: "Deposits (период)",
      value: formatCurrency(stats.currentPeriod.deposits),
      icon: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6",
      color: "green",
      change: stats.todayYesterday.today.deposits > stats.todayYesterday.yesterday.deposits ? "up" : "down"
    },
    {
      title: "Profit (период)",
      value: formatCurrency(stats.currentPeriod.profit),
      icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
      color: stats.currentPeriod.profit >= 0 ? "green" : "red",
      change: "neutral"
    },
    {
      title: "ROAS",
      value: stats.currentPeriod.roas.toFixed(2),
      icon: "M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z",
      color: stats.currentPeriod.roas >= 1.5 ? "green" : stats.currentPeriod.roas >= 1.2 ? "yellow" : "red",
      change: "neutral"
    }
  ];

  const getColorClasses = (color: string) => {
    switch (color) {
      case "green":
        return {
          bg: "bg-green-50 dark:bg-green-900/20",
          icon: "bg-green-500",
          text: "text-green-700 dark:text-green-400"
        };
      case "red":
        return {
          bg: "bg-red-50 dark:bg-red-900/20",
          icon: "bg-red-500",
          text: "text-red-700 dark:text-red-400"
        };
      case "yellow":
        return {
          bg: "bg-yellow-50 dark:bg-yellow-900/20",
          icon: "bg-yellow-500",
          text: "text-yellow-700 dark:text-yellow-400"
        };
      default:
        return {
          bg: "bg-blue-50 dark:bg-blue-900/20",
          icon: "bg-blue-500",
          text: "text-blue-700 dark:text-blue-400"
        };
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, index) => {
        const colors = getColorClasses(card.color);
        
        return (
          <div key={index} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                  {card.title}
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {card.value}
                </div>
              </div>
              
              <div className={`w-12 h-12 ${colors.bg} rounded-lg flex items-center justify-center`}>
                <div className={`w-8 h-8 ${colors.icon} rounded-lg flex items-center justify-center`}>
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={card.icon} />
                  </svg>
                </div>
              </div>
            </div>

            {/* Trend indicator */}
            {card.change !== "neutral" && (
              <div className="mt-4 flex items-center">
                <svg 
                  className={`w-4 h-4 mr-1 ${
                    card.change === "up" ? "text-green-500" : "text-red-500"
                  } ${card.change === "up" ? "" : "rotate-180"}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 14l9-9 9 9" />
                </svg>
                <span className={`text-sm font-medium ${
                  card.change === "up" ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400"
                }`}>
                  {card.change === "up" ? "Рост" : "Снижение"} по сравнению с вчера
                </span>
              </div>
            )}
          </div>
        );
      })}

      {/* Additional info card */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6 md:col-span-2 lg:col-span-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Активных проектов</div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">{stats.currentPeriod.projectCount}</div>
          </div>
          
          <div className="text-center">
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Текущая схема бонусов</div>
            <div className="text-lg font-semibold text-gray-900 dark:text-white">
              {stats.bonusPreview.currentScheme?.name || 'Не назначена'}
            </div>
            {stats.bonusPreview.currentScheme?.type && (
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {stats.bonusPreview.currentScheme.type === 'FIFTY_FIFTY' ? '50/50' :
                 stats.bonusPreview.currentScheme.type === 'TIER_SYSTEM' ? 'Тир-система' :
                 'Кастомная формула'}
              </div>
            )}
          </div>
          
          <div className="text-center">
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Прогноз бонуса</div>
            <div className="text-3xl font-bold text-green-600 dark:text-green-400">
              {formatCurrency(stats.bonusPreview.estimatedBonus)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              От прибыли: {formatCurrency(stats.bonusPreview.periodProfit)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

