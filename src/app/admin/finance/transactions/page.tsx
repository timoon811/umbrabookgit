"use client";

import { useState, useEffect } from "react";

interface Transaction {
  id: string;
  type: string;
  amount: number;
  description: string | null;
  date: string;
  accountId: string;
  counterpartyId: string | null;
  categoryId: string | null;
  projectId: string | null;
  account: {
    id: string;
    name: string;
    balance: number;
    currency: string;
  };
  counterparty: {
    id: string;
    name: string;
    type: string;
  } | null;
  category: {
    id: string;
    name: string;
    type: string;
    color: string;
  } | null;
  project: {
    id: string;
    name: string;
    status: string;
  } | null;
}

interface Account {
  id: string;
  name: string;
  balance: number;
  currency: string;
}

interface Category {
  id: string;
  name: string;
  type: string;
  color: string;
}

interface Project {
  id: string;
  name: string;
  status: string;
}

interface Counterparty {
  id: string;
  name: string;
  type: string;
}

export default function FinanceTransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [counterparties, setCounterparties] = useState<Counterparty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Состояние фильтров
  const [periodFilter, setPeriodFilter] = useState<'current_month' | 'all' | 'planned_actual'>('current_month');
  const [accountFilter, setAccountFilter] = useState<string | null>(null);
  const [projectFilter, setProjectFilter] = useState<string | null>(null);
  const [counterpartyFilter, setCounterpartyFilter] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [amountFilter, setAmountFilter] = useState('');
  const [descriptionFilter, setDescriptionFilter] = useState('');
  const [fileFilter, setFileFilter] = useState<'all' | 'with_files' | 'without_files'>('all');
  
  // Состояние модального окна
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalType, setModalType] = useState<'income' | 'expense' | 'transfer'>('expense');
  const [formData, setFormData] = useState({
    amount: '',
    accountId: '',
    toAccountId: '',
    categoryId: '',
    date: new Date().toISOString().split('T')[0],
    projectId: '',
    counterpartyId: '',
    description: '',
    includeInLiabilities: false,
    accrueOnDifferentDate: false,
    repeatOperation: false
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Получаем все данные параллельно
      const [transactionsRes, accountsRes, categoriesRes, projectsRes, counterpartiesRes] = await Promise.all([
        fetch('/api/admin/finance/transactions'),
        fetch('/api/admin/finance/accounts'),
        fetch('/api/admin/finance/categories'),
        fetch('/api/admin/finance/projects'),
        fetch('/api/admin/finance/counterparties')
      ]);

      if (transactionsRes.ok) {
        const data = await transactionsRes.json();
        setTransactions(data.transactions || []);
      }
      
      if (accountsRes.ok) {
        const data = await accountsRes.json();
        setAccounts(data.accounts || []);
      }
      
      if (categoriesRes.ok) {
        const data = await categoriesRes.json();
        setCategories(data.categories || []);
      }
      
      if (projectsRes.ok) {
        const data = await projectsRes.json();
        setProjects(data.projects || []);
      }
      
      if (counterpartiesRes.ok) {
        const data = await counterpartiesRes.json();
        setCounterparties(data.counterparties || []);
      }
      
    } catch (error) {
      setError('Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTransaction = async () => {
    try {
      const response = await fetch('/api/admin/finance/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          type: modalType.toUpperCase(),
          amount: parseFloat(formData.amount),
          ...(modalType === 'transfer' && { toAccountId: formData.toAccountId }),
        }),
      });

      if (response.ok) {
        setShowAddModal(false);
        setFormData({
          amount: '',
          accountId: '',
          toAccountId: '',
          categoryId: '',
          date: new Date().toISOString().split('T')[0],
          projectId: '',
          counterpartyId: '',
          description: '',
          includeInLiabilities: false,
          accrueOnDifferentDate: false,
          repeatOperation: false
        });
        fetchData(); // Обновляем список
      }
    } catch (error) {
      console.error('Ошибка добавления операции:', error);
    }
  };

  const openAddModal = (type: 'income' | 'expense' | 'transfer') => {
    setModalType(type);
    setShowAddModal(true);
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Сегодня';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Вчера';
    } else {
      return date.toLocaleDateString('ru-RU');
    }
  };

  const getUncategorizedCount = () => {
    return transactions.filter(t => !t.categoryId).length;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Основная область */}
      <div className="p-6">
          {/* Заголовок и статистика */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Операции за текущий месяц
                </h1>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {getUncategorizedCount()} без статьи
                </div>
              </div>
            </div>

            {/* Кнопки действий */}
            <div className="flex gap-3 mb-6">
              <button
                onClick={() => openAddModal('income')}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium"
              >
                + Приход
              </button>
              <button
                onClick={() => openAddModal('expense')}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium"
              >
                - Расход
              </button>
              <button
                onClick={() => openAddModal('transfer')}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium"
              >
                ⇄ Перевод
              </button>
              <button className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium">
                🔍 Фильтр
              </button>
              <button className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium">
                📥 Импорт
              </button>
              <button className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium">
                📤 Экспорт
              </button>
            </div>

            {/* Фильтры */}
            <div className="flex flex-wrap gap-2 mb-6">
              <button
                onClick={() => setPeriodFilter('current_month')}
                className={`px-3 py-1 rounded-lg text-sm font-medium ${
                  periodFilter === 'current_month'
                    ? 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
                    : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                Текущий месяц
              </button>
              <button
                onClick={() => setPeriodFilter('all')}
                className={`px-3 py-1 rounded-lg text-sm font-medium ${
                  periodFilter === 'all'
                    ? 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
                    : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                Все операции
              </button>
              <button
                onClick={() => setPeriodFilter('planned_actual')}
                className={`px-3 py-1 rounded-lg text-sm font-medium ${
                  periodFilter === 'planned_actual'
                    ? 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
                    : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                Плановые и фактические
              </button>
            </div>

            {/* Дополнительные фильтры */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Сумма
                </label>
                <input
                  type="text"
                  value={amountFilter}
                  onChange={(e) => setAmountFilter(e.target.value)}
                  placeholder="Введите сумму"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Поиск по описанию
                </label>
                <input
                  type="text"
                  value={descriptionFilter}
                  onChange={(e) => setDescriptionFilter(e.target.value)}
                  placeholder="Введите описание"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Файлы
                </label>
                <select
                  value={fileFilter}
                  onChange={(e) => setFileFilter(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="all">С файлами и без</option>
                  <option value="with_files">С файлами</option>
                  <option value="without_files">Без файлов</option>
                </select>
              </div>
            </div>
          </div>

          {/* Таблица операций */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      ДАТА
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      ОПЕРАЦИЯ
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      СТАТЬЯ/ОПИСАНИЕ
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      ПРОЕКТ
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      КОНТРАГЕНТ
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      СЧЕТ
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {transactions.map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {formatDate(transaction.date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm font-medium ${
                          transaction.type === 'INCOME' 
                            ? 'text-green-600 dark:text-green-400' 
                            : 'text-red-600 dark:text-red-400'
                        }`}>
                          {transaction.type === 'INCOME' ? '+' : '-'}
                          {formatCurrency(transaction.amount, transaction.account.currency)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {transaction.category?.name || 'Без статьи'} {transaction.description}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {transaction.project?.name || 'Без проекта'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {transaction.counterparty?.name || 'Без контрагента'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {transaction.account.name} ({formatCurrency(transaction.account.balance, transaction.account.currency)})
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Правая панель - форма добавления */}
        {showAddModal && (
          <div className="w-96 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {modalType === 'income' && 'Добавить операцию прихода'}
                {modalType === 'expense' && 'Добавить операцию расхода'}
                {modalType === 'transfer' && 'Добавить перевод'}
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  СУММА *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: e.target.value})}
                  placeholder="0,00"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  СЧЕТ *
                </label>
                <select
                  value={formData.accountId}
                  onChange={(e) => setFormData({...formData, accountId: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="">Выберите счет...</option>
                  {accounts.map(account => (
                    <option key={account.id} value={account.id}>
                      {account.name} ({formatCurrency(account.balance, account.currency)})
                    </option>
                  ))}
                </select>
              </div>

              {modalType !== 'transfer' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    СТАТЬЯ
                  </label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => setFormData({...formData, categoryId: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  >
                    <option value="">Выберите статью...</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {modalType === 'transfer' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      СО СЧЕТА
                    </label>
                    <select
                      value={formData.accountId}
                      onChange={(e) => setFormData({...formData, accountId: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    >
                      <option value="">Выберите счет...</option>
                      {accounts.map(account => (
                        <option key={account.id} value={account.id}>
                          {account.name} ({formatCurrency(account.balance, account.currency)})
                        </option>
                      ))}
                    </select>
                  </div>
                                     <div>
                     <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                       НА СЧЕТ
                     </label>
                     <select
                       value={formData.toAccountId}
                       onChange={(e) => setFormData({...formData, toAccountId: e.target.value})}
                       className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                     >
                       <option value="">Выберите счет...</option>
                       {accounts.map(account => (
                         <option key={account.id} value={account.id}>
                           {account.name} ({formatCurrency(account.balance, account.currency)})
                         </option>
                       ))}
                     </select>
                   </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ДАТА
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>

              {modalType !== 'transfer' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    ПРОЕКТ ИЛИ НАПРАВЛЕНИЕ
                  </label>
                  <select
                    value={formData.projectId}
                    onChange={(e) => setFormData({...formData, projectId: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  >
                    <option value="">Выберите проект...</option>
                    {projects.map(project => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {modalType !== 'transfer' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    КОНТРАГЕНТ
                  </label>
                  <select
                    value={formData.counterpartyId}
                    onChange={(e) => setFormData({...formData, counterpartyId: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  >
                    <option value="">Выберите контрагента...</option>
                    {counterparties.map(counterparty => (
                      <option key={counterparty.id} value={counterparty.id}>
                        {counterparty.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ОПИСАНИЕ
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  placeholder="Введите описание операции"
                />
              </div>

              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.includeInLiabilities}
                    onChange={(e) => setFormData({...formData, includeInLiabilities: e.target.checked})}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Учитывать в обязательствах
                  </span>
                  <a href="#" className="ml-2 text-gray-600 hover:text-gray-800 text-sm">
                    Что произойдет?
                  </a>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.accrueOnDifferentDate}
                    onChange={(e) => setFormData({...formData, accrueOnDifferentDate: e.target.checked})}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Начислить на другую дату
                  </span>
                  <a href="#" className="ml-2 text-gray-600 hover:text-gray-800 text-sm">
                    Что произойдет?
                  </a>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.repeatOperation}
                    onChange={(e) => setFormData({...formData, repeatOperation: e.target.checked})}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Повторять операцию
                  </span>
                </label>
              </div>

              <button
                onClick={handleAddTransaction}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg font-medium"
              >
                {modalType === 'income' && 'Добавить операцию'}
                {modalType === 'expense' && 'Добавить операцию'}
                {modalType === 'transfer' && 'Добавить перевод'}
              </button>

              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Перетащите сюда документы или{' '}
                  <a href="#" className="text-gray-600 hover:text-gray-800">
                    выберите файлы
                  </a>
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
  );
}


