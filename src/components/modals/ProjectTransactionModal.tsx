"use client";

import { useState, useEffect } from 'react';
import { X, Save, Plus } from 'lucide-react';

interface Account {
  id: string;
  name: string;
  currency: string;
  commission: number;
}

interface Counterparty {
  id: string;
  name: string;
  type: string;
}

interface Category {
  id: string;
  name: string;
  type: string;
}

interface Project {
  id: string;
  name: string;
  description: string | null;
  status: string;
}

interface ProjectTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  transactionType: 'INCOME' | 'EXPENSE' | 'TRANSFER' | 'EXCHANGE';
  selectedProject: Project | null;
  accounts: Account[];
  counterparties: Counterparty[];
  categories: Category[];
  allProjects: Project[];
  isLoading: boolean;
}

interface TransactionFormData {
  accountId: string;
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER' | 'EXCHANGE';
  amount: number;
  description: string;
  counterpartyId?: string;
  categoryId?: string;
  projectId?: string;
  // Поля для переводов
  toAccountId?: string;
  // Поля для обменов
  fromCurrency?: string;
  toCurrency?: string;
  exchangeRate?: number;
  toAmount?: number;
}

export default function ProjectTransactionModal({
  isOpen,
  onClose,
  onSave,
  transactionType,
  selectedProject,
  accounts,
  counterparties,
  categories,
  allProjects,
  isLoading: dataLoading
}: ProjectTransactionModalProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<TransactionFormData>({
    accountId: '',
    type: transactionType,
    amount: 0,
    description: '',
    projectId: selectedProject?.id || '',
  });
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [commissionInfo, setCommissionInfo] = useState<{
    commissionPercent: number;
    commissionAmount: number;
    netAmount: number;
  } | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (isOpen) {
      setIsVisible(true);
      document.body.style.overflow = 'hidden';
      // Устанавливаем предустановленные значения
      setFormData({
        accountId: '',
        type: transactionType,
        amount: 0,
        description: '',
        projectId: selectedProject?.id || '',
      });
    } else {
      setIsVisible(false);
      document.body.style.overflow = 'unset';
      setSelectedAccount(null);
      setCommissionInfo(null);
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, transactionType, selectedProject]);

  const handleInputChange = (field: string, value: any) => {
    const newFormData = { ...formData, [field]: value };
    setFormData(newFormData);

    // Если изменился счет, сумма или курс обмена, пересчитываем комиссию
    if (field === 'accountId' || field === 'amount' || field === 'exchangeRate' || field === 'toAmount') {
      calculateCommission(newFormData);
    }
  };

  const calculateCommission = (data: TransactionFormData) => {
    if (!data.accountId || !data.amount || data.amount <= 0) {
      setCommissionInfo(null);
      return;
    }

    const account = accounts.find(acc => acc.id === data.accountId);
    if (!account) {
      setCommissionInfo(null);
      return;
    }

    setSelectedAccount(account);

    const commissionPercent = account.commission || 0;
    const amount = parseFloat(data.amount.toString());

    if (commissionPercent > 0) {
      const commissionAmount = (amount * commissionPercent) / 100;

      if (data.type === 'INCOME') {
        // При пополнении комиссия вычитается
        const netAmount = amount - commissionAmount;
        setCommissionInfo({
          commissionPercent,
          commissionAmount,
          netAmount
        });
      } else if (data.type === 'EXPENSE') {
        // При расходовании комиссия добавляется
        const netAmount = amount + commissionAmount;
        setCommissionInfo({
          commissionPercent,
          commissionAmount,
          netAmount
        });
      } else if (data.type === 'TRANSFER') {
        // При переводах комиссия добавляется к сумме перевода
        const netAmount = amount + commissionAmount;
        setCommissionInfo({
          commissionPercent,
          commissionAmount,
          netAmount
        });
      } else if (data.type === 'EXCHANGE') {
        // При обмене комиссия добавляется к сумме обмена
        const netAmount = amount + commissionAmount;
        setCommissionInfo({
          commissionPercent,
          commissionAmount,
          netAmount
        });
      }
    } else {
      setCommissionInfo(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Ошибка сохранения транзакции:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredCategories = categories.filter(category => 
    category.type === transactionType || category.type === 'BOTH'
  );

  // Список поддерживаемых валют
  const supportedCurrencies = [
    'USD', 'EUR', 'RUB', 'BTC', 'ETH', 'USDT', 'USDC', 'BNB', 'TRX', 'XRP', 'SOL', 'TON'
  ];

  if (!isOpen) return null;

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={`relative w-full max-w-2xl max-h-[90vh] overflow-y-auto transform transition-all duration-300 ${
          isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
      >
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-[#171717]/5 dark:border-[#ededed]/10">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-[#171717]/5 dark:border-[#ededed]/10">
            <h3 className="text-lg font-semibold text-[#171717] dark:text-[#ededed] flex items-center gap-2">
              <Plus className={`w-5 h-5 ${
                transactionType === 'INCOME' ? 'text-green-600' : 
                transactionType === 'EXPENSE' ? 'text-red-600' :
                transactionType === 'TRANSFER' ? 'text-blue-600' : 'text-purple-600'
              }`} />
              Добавить {
                transactionType === 'INCOME' ? 'доходную операцию' : 
                transactionType === 'EXPENSE' ? 'расходную операцию' :
                transactionType === 'TRANSFER' ? 'перевод' : 'обмен'
              }
            </h3>
            <button
              onClick={onClose}
              className="text-[#171717]/60 dark:text-[#ededed]/60 hover:text-[#171717] dark:hover:text-[#ededed] transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6">
            <div className="space-y-4">
              {/* Проект (предустановлен и отображается) */}
              <div>
                <label className="block text-sm font-medium text-[#171717] dark:text-[#ededed] mb-2">
                  Проект *
                </label>
                <div className="w-full px-3 py-2 border border-[#171717]/20 dark:border-[#ededed]/20 rounded-md bg-gray-50 dark:bg-gray-700 text-[#171717] dark:text-[#ededed]">
                  {selectedProject?.name || 'Проект не выбран'}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Операция будет автоматически привязана к этому проекту
                </p>
              </div>

              {/* Счет */}
              <div>
                <label className="block text-sm font-medium text-[#171717] dark:text-[#ededed] mb-2">
                  Счет *
                </label>
                <select
                  value={formData.accountId}
                  onChange={(e) => handleInputChange('accountId', e.target.value)}
                  className="w-full px-3 py-2 border border-[#171717]/20 dark:border-[#ededed]/20 rounded-md bg-white dark:bg-gray-800 text-[#171717] dark:text-[#ededed] focus:ring-2 focus:ring-[#2563eb] focus:border-transparent"
                  required
                  disabled={dataLoading}
                >
                  <option value="">Выберите счет</option>
                  {accounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name} ({account.currency})
                      {account.commission > 0 && ` - Комиссия: ${account.commission}%`}
                    </option>
                  ))}
                </select>
              </div>

              {/* Сумма */}
              <div>
                <label className="block text-sm font-medium text-[#171717] dark:text-[#ededed] mb-2">
                  Сумма *
                </label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => handleInputChange('amount', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-[#171717]/20 dark:border-[#ededed]/20 rounded-md bg-white dark:bg-gray-800 text-[#171717] dark:text-[#ededed] focus:ring-2 focus:ring-[#2563eb] focus:border-transparent"
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  required
                />
              </div>

              {/* Дополнительные поля для переводов */}
              {transactionType === 'TRANSFER' && (
                <div>
                  <label className="block text-sm font-medium text-[#171717] dark:text-[#ededed] mb-2">
                    Счет получатель *
                  </label>
                  <select
                    value={formData.toAccountId || ''}
                    onChange={(e) => handleInputChange('toAccountId', e.target.value)}
                    className="w-full px-3 py-2 border border-[#171717]/20 dark:border-[#ededed]/20 rounded-md bg-white dark:bg-gray-800 text-[#171717] dark:text-[#ededed] focus:ring-2 focus:ring-[#2563eb] focus:border-transparent"
                    required
                    disabled={dataLoading}
                  >
                    <option value="">Выберите счет получатель</option>
                    {accounts.filter(acc => acc.id !== formData.accountId).map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.name} ({account.currency})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Дополнительные поля для обменов */}
              {transactionType === 'EXCHANGE' && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[#171717] dark:text-[#ededed] mb-2">
                        Исходная валюта *
                      </label>
                      <select
                        value={formData.fromCurrency || ''}
                        onChange={(e) => handleInputChange('fromCurrency', e.target.value)}
                        className="w-full px-3 py-2 border border-[#171717]/20 dark:border-[#ededed]/20 rounded-md bg-white dark:bg-gray-800 text-[#171717] dark:text-[#ededed] focus:ring-2 focus:ring-[#2563eb] focus:border-transparent"
                        required
                      >
                        <option value="">Выберите валюту</option>
                        {supportedCurrencies.map((currency) => (
                          <option key={currency} value={currency}>
                            {currency}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#171717] dark:text-[#ededed] mb-2">
                        Целевая валюта *
                      </label>
                      <select
                        value={formData.toCurrency || ''}
                        onChange={(e) => handleInputChange('toCurrency', e.target.value)}
                        className="w-full px-3 py-2 border border-[#171717]/20 dark:border-[#ededed]/20 rounded-md bg-white dark:bg-gray-800 text-[#171717] dark:text-[#ededed] focus:ring-2 focus:ring-[#2563eb] focus:border-transparent"
                        required
                      >
                        <option value="">Выберите валюту</option>
                        {supportedCurrencies.map((currency) => (
                          <option key={currency} value={currency}>
                            {currency}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[#171717] dark:text-[#ededed] mb-2">
                        Курс обмена *
                      </label>
                      <input
                        type="number"
                        value={formData.exchangeRate || 0}
                        onChange={(e) => handleInputChange('exchangeRate', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-[#171717]/20 dark:border-[#ededed]/20 rounded-md bg-white dark:bg-gray-800 text-[#171717] dark:text-[#ededed] focus:ring-2 focus:ring-[#2563eb] focus:border-transparent"
                        placeholder="1.0"
                        step="0.000001"
                        min="0"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#171717] dark:text-[#ededed] mb-2">
                        Сумма получения *
                      </label>
                      <input
                        type="number"
                        value={formData.toAmount || 0}
                        onChange={(e) => handleInputChange('toAmount', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-[#171717]/20 dark:border-[#ededed]/20 rounded-md bg-white dark:bg-gray-800 text-[#171717] dark:text-[#ededed] focus:ring-2 focus:ring-[#2563eb] focus:border-transparent"
                        placeholder="0.00"
                        step="0.01"
                        min="0"
                        required
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Информация о комиссии */}
              {commissionInfo && selectedAccount && (
                <div className="bg-[#171717]/5 dark:bg-[#ededed]/5 p-4 rounded-lg border border-[#171717]/10 dark:border-[#ededed]/10">
                  <h4 className="text-sm font-medium text-[#171717] dark:text-[#ededed] mb-2">
                    💰 Расчет комиссии ({commissionInfo.commissionPercent}%)
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-[#171717]/60 dark:text-[#ededed]/60">
                        {formData.type === 'INCOME' ? 'Сумма пополнения:' : 
                         formData.type === 'EXPENSE' ? 'Основная сумма:' :
                         formData.type === 'TRANSFER' ? 'Сумма перевода:' : 'Сумма обмена:'}
                      </span>
                      <span className="font-medium">
                        {formatCurrency(formData.amount, selectedAccount.currency)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#171717]/60 dark:text-[#ededed]/60">
                        Комиссия ({commissionInfo.commissionPercent}%):
                      </span>
                      <span className="font-medium text-red-600 dark:text-red-400">
                        -{formatCurrency(commissionInfo.commissionAmount, selectedAccount.currency)}
                      </span>
                    </div>
                    <div className="flex justify-between border-t border-[#171717]/20 dark:border-[#ededed]/20 pt-2">
                      <span className="font-medium">
                        {formData.type === 'INCOME' ? 'Зачислится на счет:' : 'Спишется со счета:'}
                      </span>
                      <span className="font-bold text-green-600 dark:text-green-400">
                        {formatCurrency(commissionInfo.netAmount, selectedAccount.currency)}
                      </span>
                    </div>
                    {formData.type === 'TRANSFER' && formData.toAccountId && (
                      <div className="flex justify-between border-t border-[#171717]/20 dark:border-[#ededed]/20 pt-2">
                        <span className="font-medium text-blue-600 dark:text-blue-400">
                          Получатель получит:
                        </span>
                        <span className="font-bold text-blue-600 dark:text-blue-400">
                          {formatCurrency(formData.amount, selectedAccount.currency)}
                        </span>
                      </div>
                    )}
                    {formData.type === 'EXCHANGE' && formData.toAmount && formData.toCurrency && (
                      <div className="flex justify-between border-t border-[#171717]/20 dark:border-[#ededed]/20 pt-2">
                        <span className="font-medium text-purple-600 dark:text-purple-400">
                          Получится в обмене:
                        </span>
                        <span className="font-bold text-purple-600 dark:text-purple-400">
                          {formatCurrency(formData.toAmount, formData.toCurrency)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Контрагент */}
              <div>
                <label className="block text-sm font-medium text-[#171717] dark:text-[#ededed] mb-2">
                  Контрагент
                </label>
                <select
                  value={formData.counterpartyId || ''}
                  onChange={(e) => handleInputChange('counterpartyId', e.target.value || undefined)}
                  className="w-full px-3 py-2 border border-[#171717]/20 dark:border-[#ededed]/20 rounded-md bg-white dark:bg-gray-800 text-[#171717] dark:text-[#ededed] focus:ring-2 focus:ring-[#2563eb] focus:border-transparent"
                  disabled={dataLoading}
                >
                  <option value="">Не указан</option>
                  {counterparties.map((counterparty) => (
                    <option key={counterparty.id} value={counterparty.id}>
                      {counterparty.name} ({counterparty.type === 'CLIENT' ? 'Клиент' : 
                       counterparty.type === 'SUPPLIER' ? 'Поставщик' : 
                       counterparty.type === 'PARTNER' ? 'Партнер' : 'Сотрудник'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Категория */}
              <div>
                <label className="block text-sm font-medium text-[#171717] dark:text-[#ededed] mb-2">
                  Категория
                </label>
                <select
                  value={formData.categoryId || ''}
                  onChange={(e) => handleInputChange('categoryId', e.target.value || undefined)}
                  className="w-full px-3 py-2 border border-[#171717]/20 dark:border-[#ededed]/20 rounded-md bg-white dark:bg-gray-800 text-[#171717] dark:text-[#ededed] focus:ring-2 focus:ring-[#2563eb] focus:border-transparent"
                  disabled={dataLoading}
                >
                  <option value="">Не указана</option>
                  {filteredCategories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Описание */}
              <div>
                <label className="block text-sm font-medium text-[#171717] dark:text-[#ededed] mb-2">
                  Описание
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-[#171717]/20 dark:border-[#ededed]/20 rounded-md bg-white dark:bg-gray-800 text-[#171717] dark:text-[#ededed] focus:ring-2 focus:ring-[#2563eb] focus:border-transparent"
                  placeholder="Описание операции"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-6 border-t border-[#171717]/5 dark:border-[#ededed]/10 mt-6">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-[#171717]/80 dark:text-[#ededed]/80 bg-[#171717]/5 dark:bg-[#ededed]/5 hover:bg-[#171717]/10 dark:hover:bg-[#ededed]/10 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-[#2563eb] disabled:opacity-50"
              >
                Отмена
              </button>
              <button
                type="submit"
                disabled={isLoading || dataLoading}
                className={`px-4 py-2 text-sm font-medium text-white rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-[#2563eb] disabled:opacity-50 flex items-center gap-2 ${
                  transactionType === 'INCOME' 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : transactionType === 'EXPENSE'
                    ? 'bg-red-600 hover:bg-red-700'
                    : transactionType === 'TRANSFER'
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : 'bg-purple-600 hover:bg-purple-700'
                }`}
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Создание...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Создать {
                      transactionType === 'INCOME' ? 'доходную операцию' : 
                      transactionType === 'EXPENSE' ? 'расходную операцию' :
                      transactionType === 'TRANSFER' ? 'перевод' : 'обмен'
                    }
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
