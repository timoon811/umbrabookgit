"use client";

import { useState, useEffect } from "react";

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  type: 'performance' | 'financial' | 'bonus' | 'custom';
  category: string;
  fields: string[];
  isDefault: boolean;
}

interface GeneratedReport {
  id: string;
  name: string;
  type: string;
  period: string;
  generatedAt: Date;
  status: 'generating' | 'ready' | 'error';
  fileSize: string;
  downloadUrl?: string;
}

export default function BuyerReportsSystem() {
  const [reports, setReports] = useState<GeneratedReport[]>([]);
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('generate');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [reportParams, setReportParams] = useState({
    period: 'current_month',
    dateFrom: '',
    dateTo: '',
    projects: [] as string[],
    format: 'excel',
    includeCharts: true,
    groupBy: 'project'
  });

  useEffect(() => {
    loadReportsData();
  }, []);

  const loadReportsData = async () => {
    try {
      setLoading(true);
      
      // Загружаем шаблоны отчетов
      const templatesResponse = await fetch('/api/buyer/reports/templates');
      if (templatesResponse.ok) {
        const templatesData = await templatesResponse.json();
        setTemplates(templatesData.templates || []);
      }

      // Загружаем сгенерированные отчеты
      const reportsResponse = await fetch('/api/buyer/reports');
      if (reportsResponse.ok) {
        const reportsData = await reportsResponse.json();
        setReports(reportsData.reports || []);
      }
    } catch (error) {
      setError('Ошибка загрузки данных отчетов');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    if (!selectedTemplate) {
      alert('Выберите шаблон отчета');
      return;
    }

    try {
      const response = await fetch('/api/buyer/reports/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          templateId: selectedTemplate,
          ...reportParams
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setShowCreateModal(false);
        loadReportsData(); // Перезагружаем список отчетов
        alert('Отчет поставлен в очередь на генерацию');
      } else {
        const error = await response.json();
        alert(error.error || 'Ошибка генерации отчета');
      }
    } catch (error) {
      alert('Ошибка сети');
    }
  };

  const handleDownloadReport = (report: GeneratedReport) => {
    if (report.downloadUrl) {
      window.open(report.downloadUrl, '_blank');
    } else {
      alert('Файл отчета недоступен');
    }
  };

  const getReportTypeColor = (type: string) => {
    switch (type) {
      case 'performance':
        return 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400';
      case 'financial':
        return 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400';
      case 'bonus':
        return 'bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400';
      case 'custom':
        return 'bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400';
      default:
        return 'bg-gray-100 dark:bg-gray-900/20 text-gray-700 dark:text-gray-400';
    }
  };

  const getReportTypeLabel = (type: string) => {
    switch (type) {
      case 'performance': return 'Производительность';
      case 'financial': return 'Финансовый';
      case 'bonus': return 'Бонусы';
      case 'custom': return 'Кастомный';
      default: return type;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'generating':
        return 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400';
      case 'ready':
        return 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400';
      case 'error':
        return 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400';
      default:
        return 'bg-gray-100 dark:bg-gray-900/20 text-gray-700 dark:text-gray-400';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'generating': return 'Генерируется';
      case 'ready': return 'Готов';
      case 'error': return 'Ошибка';
      default: return status;
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
              Отчетная система
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Генерация и управление отчетами по производительности
            </p>
          </div>
          
          <button 
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span>Создать отчет</span>
            </div>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'generate', name: 'Генерация', icon: '⚡' },
              { id: 'reports', name: 'Мои отчеты', icon: '📊' },
              { id: 'templates', name: 'Шаблоны', icon: '📋' }
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
                {tab.id === 'reports' && reports.length > 0 && (
                  <span className="ml-2 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400 text-xs rounded-full">
                    {reports.length}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'generate' && (
            <QuickReportGeneration 
              templates={templates}
              onGenerate={handleGenerateReport}
            />
          )}

          {activeTab === 'reports' && (
            <ReportsList 
              reports={reports}
              onDownload={handleDownloadReport}
              onRefresh={loadReportsData}
            />
          )}

          {activeTab === 'templates' && (
            <TemplatesList templates={templates} />
          )}
        </div>
      </div>

      {/* Create Report Modal */}
      {showCreateModal && (
        <CreateReportModal
          templates={templates}
          selectedTemplate={selectedTemplate}
          setSelectedTemplate={setSelectedTemplate}
          reportParams={reportParams}
          setReportParams={setReportParams}
          onClose={() => setShowCreateModal(false)}
          onGenerate={handleGenerateReport}
        />
      )}
    </div>
  );
}

// Компонент быстрой генерации отчетов
function QuickReportGeneration({ templates, onGenerate }: { 
  templates: ReportTemplate[], 
  onGenerate: () => void 
}) {
  const quickReports = [
    {
      id: 'daily_performance',
      name: 'Дневная производительность',
      description: 'Показатели за последние 24 часа',
      icon: '📈',
      type: 'performance'
    },
    {
      id: 'weekly_financial',
      name: 'Недельный финансовый отчет',
      description: 'Доходы, расходы и прибыль за неделю',
      icon: '💰',
      type: 'financial'
    },
    {
      id: 'monthly_bonus',
      name: 'Месячный расчет бонусов',
      description: 'Подробный расчет бонусов за месяц',
      icon: '🎯',
      type: 'bonus'
    },
    {
      id: 'project_comparison',
      name: 'Сравнение проектов',
      description: 'Анализ эффективности всех проектов',
      icon: '📊',
      type: 'performance'
    }
  ];

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'performance': return 'from-blue-500 to-blue-600';
      case 'financial': return 'from-green-500 to-green-600';
      case 'bonus': return 'from-purple-500 to-purple-600';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
        Быстрая генерация отчетов
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {quickReports.map((report) => (
          <div key={report.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-md transition-all">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className={`w-12 h-12 bg-gradient-to-r ${getTypeColor(report.type)} rounded-lg flex items-center justify-center text-white text-xl`}>
                  {report.icon}
                </div>
                <div>
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                    {report.name}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {report.description}
                  </p>
                </div>
              </div>
            </div>
            
            <button className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
              Сгенерировать
            </button>
          </div>
        ))}
      </div>

      <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
        <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">
          Недавняя активность
        </h4>
        
        <div className="space-y-3">
          {[
            { name: 'Дневной отчет', time: '2 часа назад', status: 'Готов' },
            { name: 'Месячные бонусы', time: '1 день назад', status: 'Готов' },
            { name: 'Сравнение проектов', time: '3 дня назад', status: 'Готов' }
          ].map((item, index) => (
            <div key={index} className="flex items-center justify-between py-2">
              <div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {item.name}
                </span>
                <span className="text-xs text-gray-600 dark:text-gray-400 ml-2">
                  {item.time}
                </span>
              </div>
              <span className="px-2 py-1 text-xs bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400 rounded-full">
                {item.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Компонент списка отчетов
function ReportsList({ 
  reports, 
  onDownload, 
  onRefresh 
}: { 
  reports: GeneratedReport[], 
  onDownload: (report: GeneratedReport) => void,
  onRefresh: () => void
}) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'generating': return 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400';
      case 'ready': return 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400';
      case 'error': return 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400';
      default: return 'bg-gray-100 dark:bg-gray-900/20 text-gray-700 dark:text-gray-400';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'generating': return 'Генерируется';
      case 'ready': return 'Готов';
      case 'error': return 'Ошибка';
      default: return status;
    }
  };

  if (reports.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Нет отчетов
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Сгенерируйте ваш первый отчет для анализа производительности
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Сгенерированные отчеты
        </h3>
        <button 
          onClick={onRefresh}
          className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Отчет</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Тип</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Период</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Создан</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Статус</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Размер</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Действия</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {reports.map((report) => (
              <tr key={report.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                <td className="px-4 py-4 text-sm font-medium text-gray-900 dark:text-white">
                  {report.name}
                </td>
                <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-400">
                  {report.type}
                </td>
                <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-400">
                  {report.period}
                </td>
                <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-400">
                  {new Date(report.generatedAt).toLocaleDateString('ru-RU')}
                </td>
                <td className="px-4 py-4">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(report.status)}`}>
                    {getStatusLabel(report.status)}
                  </span>
                </td>
                <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-400">
                  {report.fileSize}
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center space-x-2">
                    {report.status === 'ready' && (
                      <button 
                        onClick={() => onDownload(report)}
                        className="p-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
                        title="Скачать"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </button>
                    )}
                    <button className="p-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Компонент списка шаблонов
function TemplatesList({ templates }: { templates: ReportTemplate[] }) {
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'performance': return 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400';
      case 'financial': return 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400';
      case 'bonus': return 'bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400';
      case 'custom': return 'bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400';
      default: return 'bg-gray-100 dark:bg-gray-900/20 text-gray-700 dark:text-gray-400';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'performance': return 'Производительность';
      case 'financial': return 'Финансовый';
      case 'bonus': return 'Бонусы';
      case 'custom': return 'Кастомный';
      default: return type;
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
        Доступные шаблоны отчетов
      </h3>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {templates.map((template) => (
          <div key={template.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                  {template.name}
                </h4>
                <div className="flex items-center space-x-2 mt-1">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(template.type)}`}>
                    {getTypeLabel(template.type)}
                  </span>
                  {template.isDefault && (
                    <span className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full">
                      По умолчанию
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {template.description}
            </p>
            
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                Включенные поля:
              </p>
              <div className="flex flex-wrap gap-1">
                {template.fields.slice(0, 6).map((field, index) => (
                  <span key={index} className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded">
                    {field}
                  </span>
                ))}
                {template.fields.length > 6 && (
                  <span className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded">
                    +{template.fields.length - 6} еще
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Модальное окно создания отчета
function CreateReportModal({ 
  templates, 
  selectedTemplate, 
  setSelectedTemplate, 
  reportParams, 
  setReportParams, 
  onClose, 
  onGenerate 
}: {
  templates: ReportTemplate[],
  selectedTemplate: string,
  setSelectedTemplate: (id: string) => void,
  reportParams: any,
  setReportParams: (params: any) => void,
  onClose: () => void,
  onGenerate: () => void
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-900 rounded-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Создать новый отчет
          </h3>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Выбор шаблона */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Шаблон отчета
            </label>
            <div className="space-y-2">
              {templates.map((template) => (
                <label key={template.id} className="flex items-center">
                  <input
                    type="radio"
                    name="template"
                    value={template.id}
                    checked={selectedTemplate === template.id}
                    onChange={(e) => setSelectedTemplate(e.target.value)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <div className="ml-3">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {template.name}
                    </span>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {template.description}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Параметры отчета */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Период
              </label>
              <select
                value={reportParams.period}
                onChange={(e) => setReportParams({...reportParams, period: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
              >
                <option value="current_month">Текущий месяц</option>
                <option value="last_month">Прошлый месяц</option>
                <option value="current_week">Текущая неделя</option>
                <option value="last_week">Прошлая неделя</option>
                <option value="custom">Произвольный период</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Формат
              </label>
              <select
                value={reportParams.format}
                onChange={(e) => setReportParams({...reportParams, format: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
              >
                <option value="excel">Excel (.xlsx)</option>
                <option value="pdf">PDF</option>
                <option value="csv">CSV</option>
              </select>
            </div>
          </div>

          {reportParams.period === 'custom' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Дата начала
                </label>
                <input
                  type="date"
                  value={reportParams.dateFrom}
                  onChange={(e) => setReportParams({...reportParams, dateFrom: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Дата окончания
                </label>
                <input
                  type="date"
                  value={reportParams.dateTo}
                  onChange={(e) => setReportParams({...reportParams, dateTo: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                />
              </div>
            </div>
          )}

          <div className="flex items-center space-x-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={reportParams.includeCharts}
                onChange={(e) => setReportParams({...reportParams, includeCharts: e.target.checked})}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-900 dark:text-white">
                Включить графики
              </span>
            </label>
          </div>
        </div>
        
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Отмена
          </button>
          <button
            onClick={onGenerate}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Сгенерировать
          </button>
        </div>
      </div>
    </div>
  );
}

