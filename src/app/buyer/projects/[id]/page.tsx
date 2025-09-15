"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { hasPermission } from "@/lib/permissions";
import { BuyerProject, BuyerDailyLog } from "@/types/buyer";

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [project, setProject] = useState<BuyerProject | null>(null);
  const [dailyLogs, setDailyLogs] = useState<BuyerDailyLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  // Проверяем права доступа
  if (!user || !hasPermission(user, 'buyer.projects.view')) {
    router.push('/');
    return null;
  }

  useEffect(() => {
    loadProjectData();
  }, [params.id]);

  const loadProjectData = async () => {
    try {
      setLoading(true);
      
      // Загружаем данные проекта
      const projectResponse = await fetch(`/api/buyer/projects/${params.id}`);
      if (!projectResponse.ok) {
        throw new Error('Проект не найден');
      }
      const projectData = await projectResponse.json();
      setProject(projectData.project);

      // Загружаем дневники проекта
      const logsResponse = await fetch(`/api/buyer/daily-logs?projectId=${params.id}&sortBy=date&sortOrder=desc`);
      if (logsResponse.ok) {
        const logsData = await logsResponse.json();
        setDailyLogs(logsData.logs || []);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Ошибка загрузки');
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

  const calculateProjectStats = () => {
    if (!dailyLogs.length) {
      return {
        totalSpend: 0,
        totalRevenue: 0,
        totalFTD: 0,
        totalRED: 0,
        averageROAS: 0,
        daysWithData: 0
      };
    }

    const totalSpend = dailyLogs.reduce((sum, log) => sum + log.spend, 0);
    const totalRevenue = dailyLogs.reduce((sum, log) => sum + log.totalDeposits, 0);
    const totalFTD = dailyLogs.reduce((sum, log) => sum + log.ftdCount, 0);
    const totalRED = dailyLogs.reduce((sum, log) => sum + log.redCount, 0);
    const averageROAS = totalSpend > 0 ? totalRevenue / totalSpend : 0;

    return {
      totalSpend,
      totalRevenue,
      totalFTD,
      totalRED,
      averageROAS,
      daysWithData: dailyLogs.length
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
              ))}
            </div>
            <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {error || 'Проект не найден'}
            </h3>
            <button 
              onClick={() => router.push('/buyer')}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Вернуться к проектам
            </button>
          </div>
        </div>
      </div>
    );
  }

  const stats = calculateProjectStats();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => router.push('/buyer')}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {project.name}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {project.offer} • {project.geo} • {project.trafficSource}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <span className={`px-3 py-1 text-sm font-medium rounded-full ${
              project.status === 'ACTIVE' 
                ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                : project.status === 'PAUSED'
                ? 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400'
                : 'bg-gray-100 dark:bg-gray-900/20 text-gray-700 dark:text-gray-400'
            }`}>
              {project.status === 'ACTIVE' ? 'Активный' : 
               project.status === 'PAUSED' ? 'На паузе' : 
               project.status === 'TESTING' ? 'Тестирование' : 'Завершен'}
            </span>
            
            <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
              Настройки
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Общий Spend
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {formatCurrency(stats.totalSpend)}
                </p>
              </div>
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Общая Revenue
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {formatCurrency(stats.totalRevenue)}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Средний ROAS
                </p>
                <p className={`text-2xl font-bold mt-1 ${
                  stats.averageROAS >= 1.5 
                    ? 'text-green-600 dark:text-green-400' 
                    : stats.averageROAS >= 1.2 
                    ? 'text-yellow-600 dark:text-yellow-400'
                    : 'text-red-600 dark:text-red-400'
                }`}>
                  {stats.averageROAS.toFixed(2)}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Депозиты
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {stats.totalFTD + stats.totalRED}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  FTD: {stats.totalFTD}, RED: {stats.totalRED}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'overview', name: 'Обзор', icon: '📊' },
                { id: 'logs', name: 'Дневники', icon: '📝' },
                { id: 'settings', name: 'Настройки', icon: '⚙️' }
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
            {activeTab === 'overview' && (
              <ProjectOverview project={project} stats={stats} />
            )}

            {activeTab === 'logs' && (
              <ProjectLogs projectId={project.id} logs={dailyLogs} />
            )}

            {activeTab === 'settings' && (
              <ProjectSettings project={project} onUpdate={loadProjectData} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Компонент обзора проекта
function ProjectOverview({ project, stats }: { project: BuyerProject, stats: any }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Информация о проекте */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Информация о проекте
          </h3>
          
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Оффер:</span>
              <span className="text-gray-900 dark:text-white font-medium">{project.offer}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">ГЕО:</span>
              <span className="text-gray-900 dark:text-white font-medium">{project.geo}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Источник трафика:</span>
              <span className="text-gray-900 dark:text-white font-medium">{project.trafficSource}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Валюта:</span>
              <span className="text-gray-900 dark:text-white font-medium">{project.currency}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Создан:</span>
              <span className="text-gray-900 dark:text-white font-medium">
                {new Date(project.createdAt).toLocaleDateString('ru-RU')}
              </span>
            </div>
            {project.stopConditions && (
              <div className="mt-4">
                <span className="text-gray-600 dark:text-gray-400">Условия остановки:</span>
                <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <pre className="text-sm text-gray-700 dark:text-gray-300">
                    {JSON.stringify(JSON.parse(project.stopConditions), null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Статистика */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Статистика за всё время
          </h3>
          
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Дней с данными:</span>
              <span className="text-gray-900 dark:text-white font-medium">{stats.daysWithData}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Общий Spend:</span>
              <span className="text-red-600 dark:text-red-400 font-medium">
                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(stats.totalSpend)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Общий Revenue:</span>
              <span className="text-green-600 dark:text-green-400 font-medium">
                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(stats.totalRevenue)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Прибыль:</span>
              <span className={`font-medium ${
                (stats.totalRevenue - stats.totalSpend) >= 0 
                  ? 'text-green-600 dark:text-green-400' 
                  : 'text-red-600 dark:text-red-400'
              }`}>
                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(stats.totalRevenue - stats.totalSpend)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">ROAS:</span>
              <span className={`font-medium ${
                stats.averageROAS >= 1.5 
                  ? 'text-green-600 dark:text-green-400' 
                  : stats.averageROAS >= 1.2 
                  ? 'text-yellow-600 dark:text-yellow-400'
                  : 'text-red-600 dark:text-red-400'
              }`}>
                {stats.averageROAS.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Компонент дневников проекта
function ProjectLogs({ projectId, logs }: { projectId: string, logs: BuyerDailyLog[] }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Дневники проекта
        </h3>
        <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
          Добавить запись
        </button>
      </div>
      
      {logs.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-600 dark:text-gray-400">
            Нет записей в дневнике для этого проекта
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Дата</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Spend</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Revenue</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">ROAS</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">FTD/RED</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Статус</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="px-4 py-4 text-sm text-gray-900 dark:text-white">
                    {new Date(log.date).toLocaleDateString('ru-RU')}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-900 dark:text-white">
                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(log.spend)}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-900 dark:text-white">
                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(log.totalDeposits)}
                  </td>
                  <td className="px-4 py-4 text-sm">
                    <span className={`font-medium ${
                      (log.totalDeposits / log.spend) >= 1.5 
                        ? 'text-green-600 dark:text-green-400' 
                        : (log.totalDeposits / log.spend) >= 1.2 
                        ? 'text-yellow-600 dark:text-yellow-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      {(log.totalDeposits / log.spend).toFixed(2)}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-900 dark:text-white">
                    {log.ftdCount + log.redCount} ({log.ftdCount}F/{log.redCount}R)
                  </td>
                  <td className="px-4 py-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      log.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                      log.status === 'SUBMITTED' ? 'bg-blue-100 text-blue-800' :
                      log.status === 'DRAFT' ? 'bg-gray-100 text-gray-800' :
                      'bg-purple-100 text-purple-800'
                    }`}>
                      {log.status === 'APPROVED' ? 'Одобрен' :
                       log.status === 'SUBMITTED' ? 'На проверке' :
                       log.status === 'DRAFT' ? 'Черновик' : 'Заблокирован'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// Компонент настроек проекта
function ProjectSettings({ project, onUpdate }: { project: BuyerProject, onUpdate: () => void }) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
        Настройки проекта
      </h3>
      
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
        <div className="flex items-center">
          <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <p className="text-yellow-800 dark:text-yellow-400 text-sm">
            Настройки проекта доступны только для Lead Buyer и администраторов
          </p>
        </div>
      </div>
      
      <div className="text-center py-8">
        <p className="text-gray-600 dark:text-gray-400">
          Функция настроек проекта находится в разработке
        </p>
      </div>
    </div>
  );
}

