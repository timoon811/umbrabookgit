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

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  accounts: Account[];
  counterparties: Counterparty[];
  categories: Category[];
  projects: Project[];
}

interface TransactionFormData {
  accountId: string;
  type: 'INCOME' | 'EXPENSE';
  amount: number;
  description: string;
  counterpartyId?: string;
  categoryId?: string;
  projectId?: string;
}

export default function TransactionModal({
  isOpen,
  onClose,
  onSave,
  accounts,
  counterparties,
  categories,
  projects
}: TransactionModalProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<TransactionFormData>({
    accountId: '',
    type: 'INCOME',
    amount: 0,
    description: '',
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
    } else {
      setIsVisible(false);
      document.body.style.overflow = 'unset';
      // Сброс формы при закрытии
      setFormData({
        accountId: '',
        type: 'INCOME',
        amount: 0,
        description: '',
      });
      setSelectedAccount(null);
      setCommissionInfo(null);
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleInputChange = (field: string, value: any) => {
    const newFormData = { ...formData, [field]: value };
    setFormData(newFormData);

    // Если изменился счет или сумма, пересчитываем комиссию
    if (field === 'accountId' || field === 'amount' || field === 'type') {
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
      } else {
        // При расходовании комиссия добавляется
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
              <Plus className="w-5 h-5 text-[#2563eb]" />
              Создать транзакцию
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

              {/* Тип транзакции */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#171717] dark:text-[#ededed] mb-2">
                    Тип транзакции *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => handleInputChange('type', e.target.value)}
                    className="w-full px-3 py-2 border border-[#171717]/20 dark:border-[#ededed]/20 rounded-md bg-white dark:bg-gray-800 text-[#171717] dark:text-[#ededed] focus:ring-2 focus:ring-[#2563eb] focus:border-transparent"
                    required
                  >
                    <option value="INCOME">Пополнение</option>
                    <option value="EXPENSE">Расход</option>
                  </select>
                </div>

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
              </div>

              {/* Информация о комиссии */}
              {commissionInfo && selectedAccount && (
                <div className="bg-[#171717]/5 dark:bg-[#ededed]/5 p-4 rounded-lg border border-[#171717]/10 dark:border-[#ededed]/10">
                  <h4 className="text-sm font-medium text-[#171717] dark:text-[#ededed] mb-2">
                    💰 Расчет комиссии ({commissionInfo.commissionPercent}%)
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-[#171717]/60 dark:text-[#ededed]/60">
                        {formData.type === 'INCOME' ? 'Сумма пополнения:' : 'Основная сумма:'}
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
                >
                  <option value="">Не указан</option>
                  {counterparties.map((counterparty) => (
                    <option key={counterparty.id} value={counterparty.id}>
                      {counterparty.name} ({counterparty.type === 'CLIENT' ? 'Клиент' : counterparty.type === 'SUPPLIER' ? 'Поставщик' : counterparty.type === 'PARTNER' ? 'Партнер' : 'Сотрудник'})
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
                >
                  <option value="">Не указана</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name} ({category.type === 'INCOME' ? 'Доход' : 'Расход'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Проект */}
              <div>
                <label className="block text-sm font-medium text-[#171717] dark:text-[#ededed] mb-2">
                  Проект
                </label>
                <select
                  value={formData.projectId || ''}
                  onChange={(e) => handleInputChange('projectId', e.target.value || undefined)}
                  className="w-full px-3 py-2 border border-[#171717]/20 dark:border-[#ededed]/20 rounded-md bg-white dark:bg-gray-800 text-[#171717] dark:text-[#ededed] focus:ring-2 focus:ring-[#2563eb] focus:border-transparent"
                >
                  <option value="">Не указан</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
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
                  placeholder="Описание транзакции"
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
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-[#2563eb] hover:bg-[#1d4ed8] rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-[#2563eb] disabled:opacity-50 flex items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Создание...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Создать транзакцию
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
