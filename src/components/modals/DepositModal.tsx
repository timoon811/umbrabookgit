"use client";

import React, { useState, useEffect } from 'react';

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (depositData: any) => Promise<void>;
  isLoading: boolean;
}

interface CryptoOption {
  value: string;
  label: string;
  network: string;
  icon: string;
}

const CRYPTO_OPTIONS: CryptoOption[] = [
  { value: "BTC", label: "Bitcoin", network: "BTC", icon: "₿" },
  { value: "ETH", label: "Ethereum", network: "ETH", icon: "Ξ" },
  { value: "TRX", label: "TRON", network: "TRX", icon: "⟁" },
  { value: "USDT_TRC20", label: "USDT", network: "TRC20", icon: "₮" },
  { value: "USDT_ERC20", label: "USDT", network: "ERC20", icon: "₮" },
  { value: "USDT_BEP20", label: "USDT", network: "BEP20", icon: "₮" },
  { value: "USDT_SOL", label: "USDT", network: "SOL", icon: "₮" },
  { value: "USDC", label: "USD Coin", network: "USDC", icon: "$" },
  { value: "XRP", label: "Ripple", network: "XRP", icon: "◉" },
  { value: "BASE", label: "Base Network", network: "BASE", icon: "🔵" },
  { value: "BNB", label: "Binance Coin", network: "BNB", icon: "🔶" },
  { value: "TON", label: "The Open Network", network: "TON", icon: "💎" },
  { value: "SOLANA", label: "Solana", network: "SOL", icon: "◎" },
];

export default function DepositModal({ isOpen, onClose, onSubmit, isLoading }: DepositModalProps) {
  const [formData, setFormData] = useState({
    amount: '',
    currency: 'USDT_TRC20',
    playerEmail: '',
    notes: ''
  });

  const [showCryptoDropdown, setShowCryptoDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [platformCommission, setPlatformCommission] = useState(5.0);

  const filteredCryptos = CRYPTO_OPTIONS.filter(crypto =>
    crypto.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    crypto.network.toLowerCase().includes(searchTerm.toLowerCase()) ||
    crypto.value.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedCrypto = CRYPTO_OPTIONS.find(crypto => crypto.value === formData.currency) || CRYPTO_OPTIONS[0];

  // Загружаем настройки комиссии при открытии модала
  useEffect(() => {
    const loadPlatformCommission = async () => {
      try {
        const response = await fetch('/api/admin/platform-commission', {
          credentials: 'include'
        });
        if (response.ok) {
          const data = await response.json();
          if (data.commission) {
            setPlatformCommission(data.commission.commissionPercent);
          }
        }
      } catch (error) {
        console.error('Ошибка загрузки настроек комиссии:', error);
      }
    };

    if (isOpen) {
      loadPlatformCommission();
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
    setFormData({ amount: '', currency: 'USDT_TRC20', playerEmail: '', notes: '' });
  };

  const handleClose = () => {
    setFormData({ amount: '', currency: 'USDT_TRC20', playerEmail: '', notes: '' });
    setShowCryptoDropdown(false);
    setSearchTerm('');
    onClose();
  };

  const selectCrypto = (crypto: CryptoOption) => {
    setFormData({ ...formData, currency: crypto.value });
    setShowCryptoDropdown(false);
    setSearchTerm('');
  };

  // Вычисляем чистую сумму после вычета комиссии
  const amount = parseFloat(formData.amount) || 0;
  const netAmount = amount * (1 - platformCommission / 100);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Добавить депозит</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Заполните данные о новом депозите</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            disabled={isLoading}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Сумма депозита *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 font-medium">$</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.amount}
                onChange={(e) => setFormData({...formData, amount: e.target.value})}
                className="w-full pl-8 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-lg"
                placeholder="0.00"
                required
              />
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 text-sm">USD</span>
            </div>
            {/* Показываем чистую сумму если введена сумма больше 0 */}
            {amount > 0 && (
              <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-green-800 dark:text-green-200">
                    Чистая сумма депозита:
                  </span>
                  <span className="font-semibold text-green-800 dark:text-green-200">
                    ${netAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="text-xs text-green-600 dark:text-green-300 mt-1">
                  После вычета комиссии платформы {platformCommission}%
                </div>
              </div>
            )}
          </div>

          {/* Crypto Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Криптовалюта/Сеть *
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowCryptoDropdown(!showCryptoDropdown)}
                className="w-full flex items-center justify-between px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">{selectedCrypto.icon}</span>
                  <div className="text-left">
                    <div className="font-medium">{selectedCrypto.label}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">{selectedCrypto.network}</div>
                  </div>
                </div>
                <svg className={`w-5 h-5 transition-transform ${showCryptoDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showCryptoDropdown && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-10 max-h-64 overflow-y-auto">
                  {/* Search */}
                  <div className="p-3 border-b border-gray-200 dark:border-gray-600">
                    <input
                      type="text"
                      placeholder="Поиск криптовалюты..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white text-sm"
                    />
                  </div>
                  
                  {/* Options */}
                  <div className="max-h-48 overflow-y-auto">
                    {filteredCryptos.map((crypto) => (
                      <button
                        key={crypto.value}
                        type="button"
                        onClick={() => selectCrypto(crypto)}
                        className={`w-full flex items-center gap-3 px-3 py-3 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors ${
                          crypto.value === formData.currency ? 'bg-blue-50 dark:bg-blue-900/30 border-r-2 border-blue-500' : ''
                        }`}
                      >
                        <span className="text-lg">{crypto.icon}</span>
                        <div className="text-left flex-1">
                          <div className="font-medium text-gray-900 dark:text-white">{crypto.label}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">{crypto.network}</div>
                        </div>
                        {crypto.value === formData.currency && (
                          <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email депозитера *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                </svg>
              </span>
              <input
                type="email"
                value={formData.playerEmail}
                onChange={(e) => setFormData({...formData, playerEmail: e.target.value})}
                className="w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="user@example.com"
                required
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Заметки (необязательно)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              className="w-full px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white resize-none"
              rows={3}
              placeholder="Дополнительная информация о депозите..."
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-3 px-4 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-medium"
              disabled={isLoading}
            >
              Отмена
            </button>
            <button
              type="submit"
              className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white py-3 px-4 rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Отправка...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Добавить депозит
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
