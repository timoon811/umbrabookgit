"use client";

import { useState, useEffect } from "react";
import { Edit, Trash2, Plus } from "lucide-react";
import ConfirmModal from "@/components/modals/ConfirmModal";
import DepositSourceModal from "@/components/modals/DepositSourceModal";
import NoSSR from "@/components/NoSSR";

export default function AdminDepositsPage() {
  const [activeTab, setActiveTab] = useState<'management' | 'all-deposits'>('management');
  const [depositSources, setDepositSources] = useState<any[]>([]);
  const [deposits, setDeposits] = useState<any[]>([]);
  const [allDeposits, setAllDeposits] = useState<any[]>([]);
  const [depositStats, setDepositStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [allDepositsLoading, setAllDepositsLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0
  });

  // Modal states
  const [depositSourceModalOpen, setDepositSourceModalOpen] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [currentDepositSource, setCurrentDepositSource] = useState<any>(null);
  const [entityToDelete, setEntityToDelete] = useState<{id: string, name: string, type: string} | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (activeTab === 'all-deposits') {
      fetchAllDeposits();
    }
  }, [activeTab, pagination.page]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Загружаем источники депозитов
      const depositSourcesResponse = await fetch('/api/admin/finance/deposit-sources');
      if (depositSourcesResponse.ok) {
        const depositSourcesData = await depositSourcesResponse.json();
        setDepositSources(depositSourcesData.depositSources || []);
      }

      // Загружаем депозиты из правильной таблицы (deposits, не processor_deposits)
      const depositsResponse = await fetch('/api/admin/finance/deposits?limit=20');
      if (depositsResponse.ok) {
        const depositsData = await depositsResponse.json();
        setDeposits(depositsData.deposits || []);
        setDepositStats(depositsData.stats || null);
      }
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllDeposits = async () => {
    setAllDepositsLoading(true);
    try {
      const offset = (pagination.page - 1) * pagination.limit;
      const response = await fetch(`/api/admin/finance/deposits?limit=${pagination.limit}&offset=${offset}`);
      if (response.ok) {
        const data = await response.json();
        setAllDeposits(data.deposits || []);
        setPagination(prev => ({
          ...prev,
          total: data.pagination?.total || 0,
          totalPages: Math.ceil((data.pagination?.total || 0) / pagination.limit)
        }));
      }
    } catch (error) {
      console.error('Ошибка загрузки всех депозитов:', error);
    } finally {
      setAllDepositsLoading(false);
    }
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    // Список поддерживаемых криптовалют и токенов
    const cryptoCurrencies = {
      'btc': '₿',
      'bitcoin': '₿',
      'eth': 'Ξ',
      'ethereum': 'Ξ',
      'usdt': '₮',
      'usdt_trc20': '₮',
      'usdt_erc20': '₮',
      'usdc': '$',
      'busd': '$',
      'bnb': 'BNB',
      'ltc': 'Ł',
      'trx': 'TRX',
      'ton': 'TON'
    };

    const currencyLower = currency.toLowerCase();
    
    // Если это криптовалюта, форматируем без Intl.NumberFormat
    if (cryptoCurrencies[currencyLower]) {
      const symbol = cryptoCurrencies[currencyLower];
      return `${symbol}${amount.toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 8,
      })}`;
    }
    
    // Для обычных валют используем стандартное форматирование
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency.toUpperCase(),
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }).format(amount);
    } catch (error) {
      // Если валюта не поддерживается, просто показываем сумму с символом
      return `${currency.toUpperCase()} ${amount.toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      })}`;
    }
  };

  const openCreateModal = () => {
    setCurrentDepositSource(null);
    setModalMode('create');
    setDepositSourceModalOpen(true);
  };

  const openEditModal = (source: any) => {
    setCurrentDepositSource(source);
    setModalMode('edit');
    setDepositSourceModalOpen(true);
  };

  const openDeleteModal = (source: any) => {
    setEntityToDelete({
      id: source.id,
      name: source.name,
      type: 'источник депозитов'
    });
    setConfirmModalOpen(true);
  };

  const handleSaveDepositSource = async (data: any) => {
    try {
      const url = modalMode === 'create' 
        ? '/api/admin/finance/deposit-sources'
        : `/api/admin/finance/deposit-sources/${currentDepositSource.id}`;
      
      const method = modalMode === 'create' ? 'POST' : 'PUT';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        setDepositSourceModalOpen(false);
        fetchData();
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Ошибка сохранения');
      }
    } catch (error) {
      console.error('Ошибка сохранения:', error);
      alert('Ошибка сохранения');
    }
  };

  const handleDeleteEntity = async () => {
    if (!entityToDelete) return;

    try {
      const response = await fetch(`/api/admin/finance/deposit-sources/${entityToDelete.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setConfirmModalOpen(false);
        setEntityToDelete(null);
        fetchData();
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Ошибка удаления');
      }
    } catch (error) {
      console.error('Ошибка удаления:', error);
      alert('Ошибка удаления');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#171717] dark:text-[#ededed]">
            Управление депозитами
          </h1>
          <p className="text-[#171717]/60 dark:text-[#ededed]/60 mt-2">
            Источники, статистика и обработка депозитов
          </p>
        </div>
        <div className="text-sm text-[#171717]/40 dark:text-[#ededed]/40">
          <NoSSR fallback={<span>Загрузка...</span>}>
            Обновлено: {new Date().toLocaleString('ru-RU')}
          </NoSSR>
        </div>
      </div>

      {/* Табы */}
      <div className="flex space-x-1 bg-[#171717]/5 dark:bg-[#ededed]/5 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('management')}
          className={`flex-1 text-center py-2 px-4 rounded-md font-medium transition-colors ${
            activeTab === 'management'
              ? 'bg-white dark:bg-[#0a0a0a] text-[#171717] dark:text-[#ededed] shadow-sm'
              : 'text-[#171717]/60 dark:text-[#ededed]/60 hover:text-[#171717] dark:hover:text-[#ededed]'
          }`}
        >
          Управление
        </button>
        <button
          onClick={() => setActiveTab('all-deposits')}
          className={`flex-1 text-center py-2 px-4 rounded-md font-medium transition-colors ${
            activeTab === 'all-deposits'
              ? 'bg-white dark:bg-[#0a0a0a] text-[#171717] dark:text-[#ededed] shadow-sm'
              : 'text-[#171717]/60 dark:text-[#ededed]/60 hover:text-[#171717] dark:hover:text-[#ededed]'
          }`}
        >
          Все депозиты
        </button>
      </div>

      {/* Контент в зависимости от активной вкладки */}
      {activeTab === 'management' && (
        <>
          {/* Статистика депозитов */}
      {depositStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-[#0a0a0a] rounded-xl border border-[#171717]/5 dark:border-[#ededed]/10 p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gray-100 dark:bg-gray-900/30 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-[#171717]/60 dark:text-[#ededed]/60">Всего депозитов</p>
                <p className="text-2xl font-bold text-[#171717] dark:text-[#ededed]">{depositStats.totalDeposits}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-[#0a0a0a] rounded-xl border border-[#171717]/5 dark:border-[#ededed]/10 p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-[#171717]/60 dark:text-[#ededed]/60">Общая комиссия</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">{formatCurrency(depositStats.totalCommissionUsd, 'USD')}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-[#0a0a0a] rounded-xl border border-[#171717]/5 dark:border-[#ededed]/10 p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-[#171717]/60 dark:text-[#ededed]/60">Чистая сумма</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{formatCurrency(depositStats.totalNetAmountUsd, 'USD')}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-[#0a0a0a] rounded-xl border border-[#171717]/5 dark:border-[#ededed]/10 p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-[#171717]/60 dark:text-[#ededed]/60">Грязная сумма</p>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{formatCurrency(depositStats.totalAmountUsd, 'USD')}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Источники депозитов */}
      <div className="bg-white dark:bg-[#0a0a0a] rounded-xl border border-[#171717]/5 dark:border-[#ededed]/10 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-[#171717] dark:text-[#ededed]">
            Источники депозитов
          </h2>
          <button
            onClick={openCreateModal}
            className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Добавить источник
          </button>
        </div>

        {depositSources.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 mx-auto mb-4 bg-[#171717]/5 dark:bg-[#ededed]/5 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-[#171717]/40 dark:text-[#ededed]/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <h4 className="text-lg font-medium text-[#171717] dark:text-[#ededed] mb-2">
              Источники депозитов не найдены
            </h4>
            <p className="text-[#171717]/60 dark:text-[#ededed]/60">
              Создайте первый источник для приема депозитов, используя кнопку выше
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {depositSources.map((source: any) => (
              <div
                key={source.id}
                className="rounded-lg border border-[#171717]/5 dark:border-[#ededed]/10 p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                        </svg>
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <h4 className="text-base font-semibold text-[#171717] dark:text-[#ededed] truncate">
                          {source.name}
                        </h4>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          source.isActive
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                        }`}>
                          {source.isActive ? 'Активен' : 'Отключен'}
                        </span>
                      </div>

                      <p className="text-sm text-[#171717]/60 dark:text-[#ededed]/60 truncate">
                        Проект: {source.project?.name || 'Не указан'} • Комиссия: {source.commission}% • Депозитов: {source._count?.deposits || 0}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => openEditModal(source)}
                      className="p-2 text-[#2563eb] dark:text-[#60a5fa] hover:bg-[#2563eb]/10 dark:hover:bg-[#60a5fa]/10 rounded-md transition-colors"
                      title="Редактировать"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => openDeleteModal(source)}
                      className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                      title="Удалить"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Список депозитов */}
      <div className="bg-white dark:bg-[#0a0a0a] rounded-xl border border-[#171717]/5 dark:border-[#ededed]/10 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-[#171717] dark:text-[#ededed]">
            Последние депозиты
          </h2>
          <button
            onClick={() => fetchData()}
            className="text-[#2563eb] dark:text-[#60a5fa] hover:underline text-sm"
          >
            Обновить
          </button>
        </div>

        {deposits.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 mx-auto mb-4 bg-[#171717]/5 dark:bg-[#ededed]/5 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-[#171717]/40 dark:text-[#ededed]/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <h4 className="text-lg font-medium text-[#171717] dark:text-[#ededed] mb-2">
              Депозиты не найдены
            </h4>
            <p className="text-[#171717]/60 dark:text-[#ededed]/60">
              Здесь будут отображаться поступившие депозиты
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Мамонт
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Страна
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Токен
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Грязная сумма
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Комиссия
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Чистая сумма
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Домен
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Статус
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Дата
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Действия
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {deposits.map((deposit: any) => (
                  <tr key={deposit.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {deposit.mammothLogin}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          ID: {deposit.mammothId}
                        </div>
                        {deposit.mammothPromo && (
                          <div className="text-xs text-blue-600 dark:text-blue-400">
                            Промо: {deposit.mammothPromo}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900 dark:text-gray-100">
                        {deposit.mammothCountry}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                        {deposit.token?.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <div className="text-sm font-medium text-red-600 dark:text-red-400">
                          {formatCurrency(deposit.amount, deposit.token)}
                        </div>
                        <div className="text-xs text-red-500 dark:text-red-400">
                          {formatCurrency(deposit.amountUsd, 'USD')}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <div className="text-sm text-orange-600 dark:text-orange-400">
                          {deposit.commissionPercent}%
                        </div>
                        <div className="text-xs text-orange-500 dark:text-orange-400">
                          {formatCurrency(deposit.commissionAmountUsd, 'USD')}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <div className="text-sm font-medium text-green-600 dark:text-green-400">
                          {formatCurrency(deposit.netAmount, deposit.token)}
                        </div>
                        <div className="text-xs text-green-500 dark:text-green-400">
                          {formatCurrency(deposit.netAmountUsd, 'USD')}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <div className="text-sm text-gray-900 dark:text-gray-100">
                          {deposit.domain}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Воркер: {deposit.workerPercent}%
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        deposit.processed
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                      }`}>
                        {deposit.processed ? 'Обработан' : 'Новый'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(deposit.createdAt).toLocaleString('ru-RU')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => {
                          console.log('Обработать депозит:', deposit.id);
                        }}
                        className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                        title="Обработать"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
        </>
      )}

      {/* Вкладка "Все депозиты" */}
      {activeTab === 'all-deposits' && (
        <div className="bg-white dark:bg-[#0a0a0a] rounded-xl border border-[#171717]/5 dark:border-[#ededed]/10 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-[#171717] dark:text-[#ededed]">
                Все депозиты
              </h2>
              <p className="text-sm text-[#171717]/60 dark:text-[#ededed]/60 mt-1">
                Полный список всех депозитов в системе
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm text-[#171717]/60 dark:text-[#ededed]/60">
                Показано: {allDeposits.length} из {pagination.total}
              </div>
              <button
                onClick={() => fetchAllDeposits()}
                className="text-[#2563eb] dark:text-[#60a5fa] hover:underline text-sm"
                disabled={allDepositsLoading}
              >
                {allDepositsLoading ? 'Загрузка...' : 'Обновить'}
              </button>
            </div>
          </div>

          {allDepositsLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-500"></div>
            </div>
          ) : allDeposits.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 mx-auto mb-4 bg-[#171717]/5 dark:bg-[#ededed]/5 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-[#171717]/40 dark:text-[#ededed]/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <h4 className="text-lg font-medium text-[#171717] dark:text-[#ededed] mb-2">
                Депозиты не найдены
              </h4>
              <p className="text-[#171717]/60 dark:text-[#ededed]/60">
                Здесь будут отображаться все депозиты
              </p>
            </div>
          ) : (
            <>
              {/* Таблица всех депозитов */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider" title="ID депозита">
                        ID Деп.
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider" title="ID мамонта">
                        ID Мам.
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider" title="Логин мамонта">
                        Логин
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider" title="Страна мамонта">
                        Страна
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider" title="Промокод мамонта">
                        Промо
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider" title="Токен">
                        Токен
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider" title="Сумма в токене">
                        Сумма
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider" title="Сумма в USD">
                        USD
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider" title="Чистая сумма в токене">
                        Чист. Сум.
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider" title="Чистая сумма в USD">
                        Чист. USD
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider" title="Процент воркера">
                        Воркер %
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider" title="Домен">
                        Домен
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider" title="Hash транзакции">
                        TX Hash
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {allDeposits.map((deposit: any) => (
                      <tr key={deposit.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        {/* ID депозита */}
                        <td className="px-3 py-4 whitespace-nowrap text-sm font-mono text-gray-500 dark:text-gray-400" title={deposit.id}>
                          #{deposit.id.slice(-8)}
                        </td>
                        {/* ID мамонта */}
                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                          {deposit.mammothId}
                        </td>
                        {/* Логин мамонта */}
                        <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                          {deposit.mammothLogin}
                        </td>
                        {/* Страна мамонта */}
                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                          {deposit.mammothCountry}
                        </td>
                        {/* Промо мамонта */}
                        <td className="px-3 py-4 whitespace-nowrap text-sm text-blue-600 dark:text-blue-400">
                          {deposit.mammothPromo || '-'}
                        </td>
                        {/* Токен */}
                        <td className="px-3 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                            {deposit.token?.toUpperCase()}
                          </span>
                        </td>
                        {/* Сумма в токене */}
                        <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                          {formatCurrency(deposit.amount, deposit.token)}
                        </td>
                        {/* Сумма в USD */}
                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                          {formatCurrency(deposit.amountUsd, 'USD')}
                        </td>
                        {/* Чистая сумма в токене */}
                        <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-green-600 dark:text-green-400">
                          {formatCurrency(deposit.netAmount, deposit.token)}
                        </td>
                        {/* Чистая сумма в USD */}
                        <td className="px-3 py-4 whitespace-nowrap text-sm text-green-600 dark:text-green-400">
                          {formatCurrency(deposit.netAmountUsd, 'USD')}
                        </td>
                        {/* Процент воркера */}
                        <td className="px-3 py-4 whitespace-nowrap text-sm text-orange-600 dark:text-orange-400">
                          {deposit.workerPercent}%
                        </td>
                        {/* Домен */}
                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100" title={deposit.domain}>
                          {deposit.domain ? (deposit.domain.length > 15 ? deposit.domain.slice(0, 15) + '...' : deposit.domain) : '-'}
                        </td>
                        {/* TX Hash */}
                        <td className="px-3 py-4 whitespace-nowrap text-sm font-mono text-gray-500 dark:text-gray-400" title={deposit.txHash}>
                          {deposit.txHash ? (deposit.txHash.length > 10 ? deposit.txHash.slice(0, 10) + '...' : deposit.txHash) : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Пагинация */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <div className="text-sm text-gray-700 dark:text-gray-300">
                    Страница {pagination.page} из {pagination.totalPages}
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                      disabled={pagination.page === 1}
                      className="px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Назад
                    </button>
                    <button
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                      disabled={pagination.page === pagination.totalPages}
                      className="px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Вперед
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Модальные окна */}
      <ConfirmModal
        isOpen={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        onConfirm={handleDeleteEntity}
        title={`Удалить ${entityToDelete?.type}?`}
        message={`Вы уверены, что хотите удалить ${entityToDelete?.type} "${entityToDelete?.name}"? Это действие нельзя отменить.`}
        confirmText="Удалить"
        type="danger"
        actionType="delete"
      />

      <DepositSourceModal
        isOpen={depositSourceModalOpen}
        onClose={() => setDepositSourceModalOpen(false)}
        onSave={handleSaveDepositSource}
        mode={currentDepositSource ? 'edit' : 'create'}
        initialData={currentDepositSource}
      />
    </div>
  );
}
