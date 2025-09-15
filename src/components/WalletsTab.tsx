"use client";

import { useState, useEffect } from "react";
import CopyButton from "./CopyButton";

interface Wallet {
  id: string;
  network: string;
  address: string;
  label?: string | null;
  createdAt: string;
}

interface WalletFormData {
  network: string;
  address: string;
  label: string;
}

const SUPPORTED_NETWORKS = [
  { value: "BTC", label: "Bitcoin (BTC)" },
  { value: "ETH", label: "Ethereum (ETH)" },
  { value: "TRX", label: "TRON (TRX)" },
  { value: "USDT_TRC20", label: "USDT TRC20" },
  { value: "USDT_ERC20", label: "USDT ERC20" },
  { value: "USDT_BEP20", label: "USDT BEP20" },
  { value: "USDT_SOL20", label: "USDT SOL20" },
  { value: "USDC", label: "USD Coin (USDC)" },
  { value: "XRP", label: "Ripple (XRP)" },
  { value: "BASE", label: "Base" },
  { value: "BNB", label: "BNB" },
  { value: "TRON", label: "TRON" },
  { value: "TON", label: "TON" },
  { value: "SOLANA", label: "Solana" },
];

export default function WalletsTab() {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingWallet, setEditingWallet] = useState<Wallet | null>(null);
  const [formData, setFormData] = useState<WalletFormData>({
    network: "",
    address: "",
    label: "",
  });
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  useEffect(() => {
    fetchWallets();
  }, []);

  const fetchWallets = async () => {
    try {
      const response = await fetch("/api/user/wallets");
      if (response.ok) {
        const data = await response.json();
        setWallets(data.wallets);
      } else {
        console.error("Failed to fetch wallets");
      }
    } catch (error) {
      console.error("Error fetching wallets:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = editingWallet ? "/api/user/wallets" : "/api/user/wallets";
      const method = editingWallet ? "PUT" : "POST";
      const body = editingWallet
        ? { id: editingWallet.id, ...formData }
        : formData;

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        const data = await response.json();
        setNotification({
          type: "success",
          message: editingWallet
            ? "Кошелек успешно обновлен!"
            : "Кошелек успешно добавлен!",
        });
        
        setFormData({ network: "", address: "", label: "" });
        setShowForm(false);
        setEditingWallet(null);
        fetchWallets();
      } else {
        const errorData = await response.json();
        setNotification({
          type: "error",
          message: errorData.error || "Произошла ошибка",
        });
      }
    } catch (error) {
      setNotification({
        type: "error",
        message: "Произошла ошибка. Попробуйте еще раз.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (wallet: Wallet) => {
    setEditingWallet(wallet);
    setFormData({
      network: wallet.network,
      address: wallet.address,
      label: wallet.label || "",
    });
    setShowForm(true);
  };

  const handleDelete = async (walletId: string) => {
    if (!confirm("Вы уверены, что хотите удалить этот кошелек?")) {
      return;
    }

    try {
      const response = await fetch(`/api/user/wallets?id=${walletId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setNotification({
          type: "success",
          message: "Кошелек успешно удален!",
        });
        fetchWallets();
      } else {
        const errorData = await response.json();
        setNotification({
          type: "error",
          message: errorData.error || "Ошибка при удалении",
        });
      }
    } catch (error) {
      setNotification({
        type: "error",
        message: "Произошла ошибка. Попробуйте еще раз.",
      });
    }
  };

  const getNetworkLabel = (network: string) => {
    return SUPPORTED_NETWORKS.find((n) => n.value === network)?.label || network;
  };

  const getNetworkIcon = (network: string) => {
    switch (network) {
      case 'BTC':
        return "₿";
      case 'ETH':
        return "Ξ";
      case 'TRX':
        return "TRX";
      case 'USDT_TRC20':
        return (
          <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
          </svg>
        );
      case 'USDT_ERC20':
        return (
          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        );
      case 'USDT_BEP20':
        return (
          <svg className="w-4 h-4 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
        );
      case 'USDT_SOL20':
        return (
          <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        );
      case 'USDC':
        return (
          <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
          </svg>
        );
      case 'XRP':
        return "✖";
      case 'BASE':
        return (
          <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        );
      case 'BNB':
        return (
          <svg className="w-4 h-4 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
        );
      case 'TRON':
        return (
          <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        );
      case 'TON':
        return (
          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        );
      case 'SOLANA':
        return (
          <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
        );
    }
  };

  if (loading && wallets.length === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-500/30 border-t-gray-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Уведомления */}
      {notification && (
        <div
          className={`p-4 rounded-md text-sm ${
            notification.type === "success"
              ? "bg-green-500/15 text-green-700 dark:bg-green-500/30 dark:text-green-300"
              : "bg-red-500/15 text-red-700 dark:bg-red-500/30 dark:text-red-300"
          }`}
        >
          {notification.message}
        </div>
      )}

      {/* Заголовок и кнопка добавления */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-semibold text-black/90 dark:text-white/90">
            Мои кошельки
          </h3>
          <p className="text-sm text-black/60 dark:text-white/60">
            Управляйте своими криптокошельками для получения выплат
          </p>
        </div>
        <button
          onClick={() => {
            setShowForm(!showForm);
            if (!showForm) {
              setEditingWallet(null);
              setFormData({ network: "", address: "", label: "" });
            }
          }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-gray-800 dark:bg-white/10 dark:hover:bg-white/20 text-white text-sm font-medium rounded-md transition-colors"
        >
          {showForm ? (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Отмена
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Добавить кошелек
            </>
          )}
        </button>
      </div>

      {/* Форма добавления/редактирования */}
      {showForm && (
        <div className="p-4 sm:p-6 border border-black/5 dark:border-white/10 rounded-lg bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
          <h4 className="text-md font-semibold text-black/90 dark:text-white/90 mb-4">
            {editingWallet ? "Редактировать кошелек" : "Добавить новый кошелек"}
          </h4>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-black/70 dark:text-white/80 mb-2">
                  Сеть
                </label>
                <select
                  value={formData.network}
                  onChange={(e) => setFormData({ ...formData, network: e.target.value })}
                  className="w-full px-3 py-2 border border-black/10 dark:border-white/10 rounded-md bg-transparent text-black/90 dark:text-white/90 text-sm focus:outline-none focus:border-gray-500 dark:focus:border-gray-400 transition-colors"
                  required
                  disabled={editingWallet !== null} // Нельзя менять сеть при редактировании
                >
                  <option value="">Выберите сеть</option>
                  {SUPPORTED_NETWORKS.map((network) => (
                    <option key={network.value} value={network.value}>
                      {network.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-black/70 dark:text-white/80 mb-2">
                  Адрес кошелька
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 border border-black/10 dark:border-white/10 rounded-md bg-transparent text-black/90 dark:text-white/90 text-sm focus:outline-none focus:border-gray-500 dark:focus:border-gray-400 transition-colors"
                  placeholder="Введите адрес кошелька"
                  required
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-black/70 dark:text-white/80 mb-2">
                Метка (необязательно)
              </label>
              <input
                type="text"
                value={formData.label}
                onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                className="w-full px-3 py-2 border border-black/10 dark:border-white/10 rounded-md bg-transparent text-black/90 dark:text-white/90 text-sm focus:outline-none focus:border-gray-500 dark:focus:border-gray-400 transition-colors"
                placeholder="Например: Основной кошелек, Рабочий кошелек"
              />
            </div>
            
            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-gray-800 dark:bg-white/10 dark:hover:bg-white/20 disabled:bg-gray-700 text-white text-sm font-medium rounded-md transition-colors disabled:cursor-not-allowed"
              >
                {loading && (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></div>
                )}
                {loading
                  ? "Сохранение..."
                  : editingWallet
                  ? "Обновить"
                  : "Добавить"}
              </button>
              
              {editingWallet && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingWallet(null);
                    setFormData({ network: "", address: "", label: "" });
                  }}
                  className="px-4 py-2 text-sm text-black/60 dark:text-white/60 hover:text-black/80 dark:hover:text-white/80 transition-colors"
                >
                  Отмена
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      {/* Список кошельков */}
      {wallets.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-[#0a0a0a] flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-black/70 dark:text-white/70 mb-2">
            Кошельки не добавлены
          </h3>
          <p className="text-sm text-black/50 dark:text-white/50 mb-4">
            Добавьте свои криптокошельки для получения выплат
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-gray-800 dark:bg-white/10 dark:hover:bg-white/20 text-white text-sm font-medium rounded-md transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Добавить первый кошелек
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {wallets.map((wallet) => (
            <div
              key={wallet.id}
              className="p-4 sm:p-6 border border-black/5 dark:border-white/10 rounded-lg bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm"
            >
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-500 to-purple-600 flex items-center justify-center text-white text-lg font-bold flex-shrink-0">
                    {getNetworkIcon(wallet.network)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-semibold text-black/90 dark:text-white/90">
                        {getNetworkLabel(wallet.network)}
                      </h4>
                      {wallet.label && (
                        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 dark:bg-[#0a0a0a] text-gray-700 dark:text-gray-300">
                          {wallet.label}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <code className="text-sm bg-black/5 dark:bg-white/10 px-2 py-1 rounded text-xs font-mono text-black/80 dark:text-white/80 break-all">
                        {wallet.address}
                      </code>
                      <CopyButton text={wallet.address} />
                    </div>
                    
                    <p className="text-xs text-black/50 dark:text-white/50 mt-1">
                      Добавлен {new Date(wallet.createdAt).toLocaleDateString("ru-RU")}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleEdit(wallet)}
                    className="p-2 text-black/60 dark:text-white/60 hover:text-black/80 dark:hover:text-white/80 hover:bg-black/5 dark:hover:bg-white/10 rounded-md transition-colors"
                    title="Редактировать"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  
                  <button
                    onClick={() => handleDelete(wallet.id)}
                    className="p-2 text-red-500/70 hover:text-red-500 hover:bg-red-500/10 rounded-md transition-colors"
                    title="Удалить"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
