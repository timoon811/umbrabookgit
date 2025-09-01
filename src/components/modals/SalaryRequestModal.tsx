"use client";

import { useState, useEffect } from 'react';
import { X, Calendar, DollarSign, MessageSquare, CreditCard } from 'lucide-react';

interface SalaryRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: SalaryRequestData) => Promise<void>;
  availableAmount: number;
  isLoading?: boolean;
}

interface SalaryRequestData {
  periodStart: string;
  periodEnd: string;
  requestedAmount: number;
  paymentDetails: {
    method: string;
    account: string;
    additionalInfo?: string;
  };
  comment?: string;
}

export default function SalaryRequestModal({
  isOpen,
  onClose,
  onSubmit,
  availableAmount,
  isLoading = false
}: SalaryRequestModalProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [formData, setFormData] = useState<SalaryRequestData>({
    periodStart: '',
    periodEnd: '',
    requestedAmount: 0,
    paymentDetails: {
      method: 'bank',
      account: '',
      additionalInfo: ''
    },
    comment: ''
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (isOpen) {
      setIsVisible(true);
      document.body.style.overflow = 'hidden';
      // Устанавливаем период по умолчанию (текущий месяц)
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      
      setFormData(prev => ({
        ...prev,
        periodStart: monthStart.toISOString().split('T')[0],
        periodEnd: monthEnd.toISOString().split('T')[0],
        requestedAmount: availableAmount
      }));
    } else {
      setIsVisible(false);
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, availableAmount]);

  const handleInputChange = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof SalaryRequestData],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.requestedAmount <= 0) {
      alert('Сумма должна быть больше 0');
      return;
    }

    if (formData.requestedAmount > availableAmount) {
      alert('Запрашиваемая сумма превышает доступную');
      return;
    }

    if (!formData.periodStart || !formData.periodEnd) {
      alert('Выберите период');
      return;
    }

    if (new Date(formData.periodStart) >= new Date(formData.periodEnd)) {
      alert('Дата начала должна быть раньше даты окончания');
      return;
    }

    try {
      await onSubmit(formData);
      onClose();
    } catch (error) {
      console.error('Ошибка отправки заявки:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  if (!isOpen) return null;

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
              <DollarSign className="w-5 h-5 text-[#2563eb]" />
              Заявка на выплату зарплаты
            </h3>
            <button
              onClick={onClose}
              className="text-[#171717]/60 dark:text-[#ededed]/60 hover:text-[#171717] dark:hover:text-[#ededed] transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Available Amount Info */}
          <div className="px-6 py-4 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
              <DollarSign className="w-4 h-4" />
              <span className="font-medium">Доступно для выплаты:</span>
              <span className="text-lg font-bold">{formatCurrency(availableAmount)}</span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Period Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Calendar className="w-4 h-4 inline mr-2" />
                  Период начала
                </label>
                <input
                  type="date"
                  value={formData.periodStart}
                  onChange={(e) => handleInputChange('periodStart', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Calendar className="w-4 h-4 inline mr-2" />
                  Период окончания
                </label>
                <input
                  type="date"
                  value={formData.periodEnd}
                  onChange={(e) => handleInputChange('periodEnd', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                />
              </div>
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <DollarSign className="w-4 h-4 inline mr-2" />
                Сумма к выплате
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max={availableAmount}
                value={formData.requestedAmount}
                onChange={(e) => handleInputChange('requestedAmount', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="0.00"
                required
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Максимальная сумма: {formatCurrency(availableAmount)}
              </p>
            </div>

            {/* Payment Details */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                Детали выплаты
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Способ выплаты
                  </label>
                  <select
                    value={formData.paymentDetails.method}
                    onChange={(e) => handleInputChange('paymentDetails.method', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    required
                  >
                    <option value="bank">Банковский перевод</option>
                    <option value="crypto">Криптовалюта</option>
                    <option value="paypal">PayPal</option>
                    <option value="other">Другое</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Счет/Кошелек
                  </label>
                  <input
                    type="text"
                    value={formData.paymentDetails.account}
                    onChange={(e) => handleInputChange('paymentDetails.account', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="Номер счета или адрес кошелька"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Дополнительная информация
                </label>
                <textarea
                  value={formData.paymentDetails.additionalInfo}
                  onChange={(e) => handleInputChange('paymentDetails.additionalInfo', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  rows={2}
                  placeholder="Дополнительные детали для выплаты (необязательно)"
                />
              </div>
            </div>

            {/* Comment */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <MessageSquare className="w-4 h-4 inline mr-2" />
                Комментарий (необязательно)
              </label>
              <textarea
                value={formData.comment}
                onChange={(e) => handleInputChange('comment', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                rows={3}
                placeholder="Дополнительная информация о заявке"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded hover:bg-gray-300 transition-colors"
                disabled={isLoading}
              >
                Отмена
              </button>
              <button
                type="submit"
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
                disabled={isLoading}
              >
                {isLoading ? "Отправка..." : "Отправить заявку"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
