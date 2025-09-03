"use client";

import { useState, useEffect } from 'react';
import { X, Save, Plus } from 'lucide-react';

interface CounterpartyFormData {
  name: string;
  type: 'CLIENT' | 'SUPPLIER' | 'PARTNER' | 'EMPLOYEE';
}

interface CategoryFormData {
  name: string;
  type: 'INCOME' | 'EXPENSE';
  description: string;
  color: string;
}

interface ProjectFormData {
  name: string;
  description: string;
  status: 'ACTIVE' | 'COMPLETED' | 'ON_HOLD' | 'CANCELLED';
}

interface AccountFormData {
  name: string;
  type: 'BANK' | 'CASH' | 'CREDIT' | 'CRYPTO_WALLET' | 'CRYPTO_EXCHANGE' | 'OTHER';
  currency: string;
  balance: number;
  commission: number;
  cryptocurrencies?: string[];
}

type EntityType = 'counterparty' | 'category' | 'project' | 'account';

interface FinanceEntityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Record<string, unknown>) => Promise<void>;
  entityType: EntityType;
  mode: 'create' | 'edit';
  initialData?: Record<string, unknown>;
}

const typeOptions = {
  counterparty: [
    { value: 'CLIENT', label: 'Клиент' },
    { value: 'SUPPLIER', label: 'Поставщик' },
    { value: 'PARTNER', label: 'Партнер' },
    { value: 'EMPLOYEE', label: 'Сотрудник' },
  ],
  category: [
    { value: 'INCOME', label: 'Доход' },
    { value: 'EXPENSE', label: 'Расход' },
  ],
  project: [
    { value: 'ACTIVE', label: 'Активный' },
    { value: 'COMPLETED', label: 'Завершен' },
    { value: 'ON_HOLD', label: 'На паузе' },
    { value: 'CANCELLED', label: 'Отменен' },
  ],
  account: [
    { value: 'BANK', label: 'Банковский счет' },
    { value: 'CASH', label: 'Наличные' },
    { value: 'CREDIT', label: 'Кредитная карта' },
    { value: 'CRYPTO_WALLET', label: 'Криптокошелек' },
    { value: 'CRYPTO_EXCHANGE', label: 'Криптобиржа' },
    { value: 'OTHER', label: 'Другое' },
  ],
};

const currencyOptions = [
  { value: 'USD', label: 'USD ($)' },
  { value: 'RUB', label: 'RUB (₽)' },
  { value: 'EUR', label: 'EUR (€)' },
];

const cryptocurrencyOptions = [
  { value: 'BTC', label: 'BTC' },
  { value: 'ETH', label: 'ETH' },
  { value: 'TRX', label: 'TRX' },
  { value: 'USDT_TRC20', label: 'USDT TRC20' },
  { value: 'USDT_ERC20', label: 'USDT ERC20' },
  { value: 'USDT_BEP20', label: 'USDT BEP20' },
  { value: 'USDT_SOL20', label: 'USDT SOL20' },
  { value: 'USDC', label: 'USDC' },
  { value: 'XRP', label: 'XRP' },
  { value: 'BASE', label: 'BASE' },
  { value: 'BNB', label: 'BNB' },
  { value: 'TRON', label: 'TRON' },
  { value: 'TON', label: 'TON' },
  { value: 'SOLANA', label: 'SOLANA' },
];

const colorOptions = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4',
  '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899', '#6b7280'
];

export default function FinanceEntityModal({
  isOpen,
  onClose,
  onSave,
  entityType,
  mode,
  initialData
}: FinanceEntityModalProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<Record<string, unknown>>({});

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (isOpen) {
      setIsVisible(true);
      document.body.style.overflow = 'hidden';
      initializeFormData();
    } else {
      setIsVisible(false);
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, entityType, mode, initialData]);

  const initializeFormData = () => {
    let defaultData: Record<string, unknown> = {};

    switch (entityType) {
      case 'counterparty':
        defaultData = {
          name: '',
          type: 'CLIENT',
        };
        break;
      case 'category':
        defaultData = {
          name: '',
          type: 'EXPENSE',
          description: '',
          color: colorOptions[0],
        };
        break;
      case 'project':
        defaultData = {
          name: '',
          description: '',
          status: 'ACTIVE',
        };
        break;
      case 'account':
        defaultData = {
          name: '',
          type: 'BANK',
          currency: 'USD',
          balance: 0,
          commission: 0,
        };
        break;
    }

    setFormData(initialData ? { ...defaultData, ...initialData } : defaultData);
  };

  const handleInputChange = (field: string, value: unknown) => {
    setFormData((prev: Record<string, unknown>) => ({ ...prev, [field]: value }));
  };

  const handleCryptocurrencyChange = (crypto: string, checked: boolean) => {
    const currentCryptos = formData.cryptocurrencies || [];
    const newCryptos = checked
      ? [...currentCryptos, crypto]
      : currentCryptos.filter((c: string) => c !== crypto);

    setFormData((prev: Record<string, unknown>) => ({
      ...prev,
      cryptocurrencies: newCryptos
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Ошибка сохранения:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const getTitle = () => {
    const titles = {
      counterparty: mode === 'create' ? 'Новый контрагент' : 'Редактировать контрагента',
      category: mode === 'create' ? 'Новая статья' : 'Редактировать статью',
      project: mode === 'create' ? 'Новый проект' : 'Редактировать проект',
      account: mode === 'create' ? 'Новый счет' : 'Редактировать счет',
    };
    return titles[entityType];
  };

  const renderForm = () => {
    switch (entityType) {
      case 'counterparty':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#171717] dark:text-[#ededed] mb-2">
                Название контрагента *
              </label>
              <input
                type="text"
                value={formData.name || ''}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full px-3 py-2 border border-[#171717]/20 dark:border-[#ededed]/20 rounded-md bg-white dark:bg-gray-800 text-[#171717] dark:text-[#ededed] focus:ring-2 focus:ring-[#2563eb] focus:border-transparent"
                placeholder="Введите название"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#171717] dark:text-[#ededed] mb-2">
                Тип контрагента *
              </label>
              <select
                value={formData.type || 'CLIENT'}
                onChange={(e) => handleInputChange('type', e.target.value)}
                className="w-full px-3 py-2 border border-[#171717]/20 dark:border-[#ededed]/20 rounded-md bg-white dark:bg-gray-800 text-[#171717] dark:text-[#ededed] focus:ring-2 focus:ring-[#2563eb] focus:border-transparent"
              >
                {typeOptions.counterparty.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>


          </div>
        );

      case 'category':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#171717] dark:text-[#ededed] mb-2">
                Название статьи *
              </label>
              <input
                type="text"
                value={formData.name || ''}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full px-3 py-2 border border-[#171717]/20 dark:border-[#ededed]/20 rounded-md bg-white dark:bg-gray-800 text-[#171717] dark:text-[#ededed] focus:ring-2 focus:ring-[#2563eb] focus:border-transparent"
                placeholder="Введите название статьи"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#171717] dark:text-[#ededed] mb-2">
                Тип статьи *
              </label>
              <select
                value={formData.type || 'EXPENSE'}
                onChange={(e) => handleInputChange('type', e.target.value)}
                className="w-full px-3 py-2 border border-[#171717]/20 dark:border-[#ededed]/20 rounded-md bg-white dark:bg-gray-800 text-[#171717] dark:text-[#ededed] focus:ring-2 focus:ring-[#2563eb] focus:border-transparent"
              >
                {typeOptions.category.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#171717] dark:text-[#ededed] mb-2">
                Описание
              </label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-[#171717]/20 dark:border-[#ededed]/20 rounded-md bg-white dark:bg-gray-800 text-[#171717] dark:text-[#ededed] focus:ring-2 focus:ring-[#2563eb] focus:border-transparent"
                placeholder="Описание статьи"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#171717] dark:text-[#ededed] mb-2">
                Цвет
              </label>
              <div className="flex gap-2 flex-wrap">
                {colorOptions.map(color => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => handleInputChange('color', color)}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      formData.color === color
                        ? 'border-[#171717] dark:border-[#ededed] scale-110'
                        : 'border-[#171717]/20 dark:border-[#ededed]/20 hover:scale-105'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </div>
        );

      case 'project':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#171717] dark:text-[#ededed] mb-2">
                Название проекта *
              </label>
              <input
                type="text"
                value={formData.name || ''}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full px-3 py-2 border border-[#171717]/20 dark:border-[#ededed]/20 rounded-md bg-white dark:bg-gray-800 text-[#171717] dark:text-[#ededed] focus:ring-2 focus:ring-[#2563eb] focus:border-transparent"
                placeholder="Введите название проекта"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#171717] dark:text-[#ededed] mb-2">
                Описание
              </label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-[#171717]/20 dark:border-[#ededed]/20 rounded-md bg-white dark:bg-gray-800 text-[#171717] dark:text-[#ededed] focus:ring-2 focus:ring-[#2563eb] focus:border-transparent"
                placeholder="Описание проекта"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#171717] dark:text-[#ededed] mb-2">
                Статус *
              </label>
              <select
                value={formData.status || 'ACTIVE'}
                onChange={(e) => handleInputChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-[#171717]/20 dark:border-[#ededed]/20 rounded-md bg-white dark:bg-gray-800 text-[#171717] dark:text-[#ededed] focus:ring-2 focus:ring-[#2563eb] focus:border-transparent"
              >
                {typeOptions.project.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>


          </div>
        );

      case 'account':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#171717] dark:text-[#ededed] mb-2">
                Название счета *
              </label>
              <input
                type="text"
                value={formData.name || ''}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full px-3 py-2 border border-[#171717]/20 dark:border-[#ededed]/20 rounded-md bg-white dark:bg-gray-800 text-[#171717] dark:text-[#ededed] focus:ring-2 focus:ring-[#2563eb] focus:border-transparent"
                placeholder="Введите название счета"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#171717] dark:text-[#ededed] mb-2">
                  Тип счета *
                </label>
                <select
                  value={formData.type || 'BANK'}
                  onChange={(e) => handleInputChange('type', e.target.value)}
                  className="w-full px-3 py-2 border border-[#171717]/20 dark:border-[#ededed]/20 rounded-md bg-white dark:bg-gray-800 text-[#171717] dark:text-[#ededed] focus:ring-2 focus:ring-[#2563eb] focus:border-transparent"
                >
                  {typeOptions.account.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#171717] dark:text-[#ededed] mb-2">
                  Валюта *
                </label>
                <select
                  value={formData.currency || 'USD'}
                  onChange={(e) => handleInputChange('currency', e.target.value)}
                  className="w-full px-3 py-2 border border-[#171717]/20 dark:border-[#ededed]/20 rounded-md bg-white dark:bg-gray-800 text-[#171717] dark:text-[#ededed] focus:ring-2 focus:ring-[#2563eb] focus:border-transparent"
                >
                  {currencyOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#171717] dark:text-[#ededed] mb-2">
                Начальный баланс
              </label>
              <input
                type="number"
                value={formData.balance || ''}
                onChange={(e) => handleInputChange('balance', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-[#171717]/20 dark:border-[#ededed]/20 rounded-md bg-white dark:bg-gray-800 text-[#171717] dark:text-[#ededed] focus:ring-2 focus:ring-[#2563eb] focus:border-transparent"
                placeholder="0"
                step="0.01"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#171717] dark:text-[#ededed] mb-2">
                Комиссия счета (%)
              </label>
              <input
                type="number"
                value={formData.commission || ''}
                onChange={(e) => handleInputChange('commission', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-[#171717]/20 dark:border-[#ededed]/20 rounded-md bg-white dark:bg-gray-800 text-[#171717] dark:text-[#ededed] focus:ring-2 focus:ring-[#2563eb] focus:border-transparent"
                placeholder="0"
                min="0"
                max="100"
                step="0.01"
              />
              <p className="text-xs text-[#171717]/60 dark:text-[#ededed]/60 mt-1">
                Процент комиссии, которая автоматически рассчитывается при каждой операции на этом счете
              </p>
            </div>

            {/* Криптовалюты - показываются только для крипто-счетов */}
            {(formData.type === 'CRYPTO_WALLET' || formData.type === 'CRYPTO_EXCHANGE') && (
              <div>
                <label className="block text-sm font-medium text-[#171717] dark:text-[#ededed] mb-2">
                  Криптовалюты на этом счете
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-3 border border-[#171717]/20 dark:border-[#ededed]/20 rounded-md bg-white dark:bg-gray-800">
                  {cryptocurrencyOptions.map((crypto) => (
                    <label key={crypto.value} className="flex items-center space-x-2 cursor-pointer hover:bg-[#171717]/5 dark:hover:bg-[#ededed]/5 p-2 rounded">
                      <input
                        type="checkbox"
                        checked={(formData.cryptocurrencies || []).includes(crypto.value)}
                        onChange={(e) => handleCryptocurrencyChange(crypto.value, e.target.checked)}
                        className="w-4 h-4 text-[#2563eb] border-[#171717]/20 dark:border-[#ededed]/20 rounded focus:ring-[#2563eb] focus:ring-2"
                      />
                      <span className="text-sm text-[#171717] dark:text-[#ededed]">
                        {crypto.label}
                      </span>
                    </label>
                  ))}
                </div>
                <p className="text-xs text-[#171717]/60 dark:text-[#ededed]/60 mt-1">
                  Выберите криптовалюты, которые хранятся на этом {formData.type === 'CRYPTO_WALLET' ? 'кошельке' : 'счете биржи'}
                </p>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
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
              {mode === 'create' ? (
                <Plus className="w-5 h-5 text-[#2563eb]" />
              ) : (
                <Save className="w-5 h-5 text-[#2563eb]" />
              )}
              {getTitle()}
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
            {renderForm()}

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
                    Сохранение...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    {mode === 'create' ? 'Создать' : 'Сохранить'}
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
