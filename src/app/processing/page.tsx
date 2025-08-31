"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

// Типы данных
interface ProcessorStats {
  today: {
    depositsCount: number;
    depositsSum: number;
    approvedSum: number;
    pendingCount: number;
    rejectedCount: number;
  };
  period: {
    weekDeposits: number;
    monthDeposits: number;
    salaryPaid: number;
    bonuses: number;
  };
  balance: {
    earned: number;
    paid: number;
    pending: number;
    available: number;
  };
}

interface ProcessorDeposit {
  id: string;
  playerId: string;
  playerNick?: string;
  playerEmail?: string;
  offerName?: string;
  geo?: string;
  amount: number;
  currency: string;
  currencyType?: string;
  status: string;
  createdAt: string;
  bonusAmount: number;
  proofs?: string;
  notes?: string;
}

interface SalaryRequest {
  id: string;
  periodStart: string;
  periodEnd: string;
  requestedAmount: number;
  calculatedAmount?: number;
  status: string;
  createdAt: string;
  adminComment?: string;
}

export default function ProcessingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string>("");
  const [stats, setStats] = useState<ProcessorStats | null>(null);
  const [deposits, setDeposits] = useState<ProcessorDeposit[]>([]);
  const [salaryRequests, setSalaryRequests] = useState<SalaryRequest[]>([]);
  const [activeTab, setActiveTab] = useState("deposits");
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showSalaryModal, setShowSalaryModal] = useState(false);
  const [depositForm, setDepositForm] = useState({
    amount: "",
    currency: "USD",
    playerEmail: "",
    notes: "",
  });
  const [submittingDeposit, setSubmittingDeposit] = useState(false);

  // Проверка авторизации и роли
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/me");
        if (!response.ok) {
          router.push("/login");
          return;
        }
        
        const userData = await response.json();
        if (userData.role !== "PROCESSOR") {
          router.push("/");
          return;
        }
        
        setUserRole(userData.role);
        loadProcessorData();
      } catch (error) {
        console.error("Ошибка проверки авторизации:", error);
        router.push("/login");
      }
    };

    checkAuth();
  }, [router]);

  // Загрузка данных процессора
  const loadProcessorData = async () => {
    try {
      setLoading(true);
      
      // Загружаем статистику
      const statsResponse = await fetch("/api/processor/stats");
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }

      // Загружаем депозиты
      const depositsResponse = await fetch("/api/processor/deposits");
      if (depositsResponse.ok) {
        const depositsData = await depositsResponse.json();
        setDeposits(depositsData);
      }

      // Загружаем заявки на зарплату
      const salaryResponse = await fetch("/api/processor/salary-requests");
      if (salaryResponse.ok) {
        const salaryData = await salaryResponse.json();
        setSalaryRequests(salaryData);
      }
      
    } catch (error) {
      console.error("Ошибка загрузки данных:", error);
    } finally {
      setLoading(false);
    }
  };

  // Отправка депозита
  const handleSubmitDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!depositForm.amount || !depositForm.currency || !depositForm.playerEmail) {
      alert("Заполните все обязательные поля");
      return;
    }

    if (parseFloat(depositForm.amount) <= 0) {
      alert("Сумма должна быть больше 0");
      return;
    }

    try {
      setSubmittingDeposit(true);
      
      const response = await fetch("/api/processor/deposits", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: parseFloat(depositForm.amount),
          currency: depositForm.currency,
          playerEmail: depositForm.playerEmail,
          notes: depositForm.notes,
          playerId: `deposit_${Date.now()}`, // Генерируем ID
        }),
      });

      if (response.ok) {
        alert("Депозит успешно добавлен!");
        setDepositForm({
          amount: "",
          currency: "USD",
          playerEmail: "",
          notes: "",
        });
        setShowDepositModal(false);
        loadProcessorData(); // Перезагружаем данные
      } else {
        const errorData = await response.json();
        alert(`Ошибка: ${errorData.error}`);
      }
    } catch (error) {
      console.error("Ошибка отправки депозита:", error);
      alert("Произошла ошибка при отправке депозита");
    } finally {
      setSubmittingDeposit(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#171717]/60 dark:text-[#ededed]/60">Загрузка...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Заголовок */}
      <div className="bg-white dark:bg-[#0a0a0a] border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-[#171717] dark:text-[#ededed]">
                Мой кабинет
              </h1>
              <p className="text-[#171717]/60 dark:text-[#ededed]/60 mt-1">
                Панель обработчика депозитов
              </p>
            </div>
            
            {/* Быстрые действия */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowDepositModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Внести депозит
              </button>
              <button
                onClick={() => setShowSalaryModal(true)}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                Заявка на ЗП
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* KPI виджеты */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Сегодня */}
            <div className="bg-white dark:bg-[#0a0a0a] rounded-xl border border-gray-200 dark:border-gray-800 p-6">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Сегодня</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Депозиты:</span>
                  <span className="text-sm font-medium">{stats.today.depositsCount} шт</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Сумма:</span>
                  <span className="text-sm font-medium">${stats.today.depositsSum}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Подтверждено:</span>
                  <span className="text-sm font-medium text-green-600">${stats.today.approvedSum}</span>
                </div>
              </div>
            </div>

            {/* За период */}
            <div className="bg-white dark:bg-[#0a0a0a] rounded-xl border border-gray-200 dark:border-gray-800 p-6">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">За месяц</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Депозиты:</span>
                  <span className="text-sm font-medium">${stats.period.monthDeposits}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">ЗП выплачено:</span>
                  <span className="text-sm font-medium">${stats.period.salaryPaid}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Бонусы:</span>
                  <span className="text-sm font-medium">${stats.period.bonuses}</span>
                </div>
              </div>
            </div>

            {/* Баланс */}
            <div className="bg-white dark:bg-[#0a0a0a] rounded-xl border border-gray-200 dark:border-gray-800 p-6">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Баланс</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Заработано:</span>
                  <span className="text-sm font-medium">${stats.balance.earned}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Выплачено:</span>
                  <span className="text-sm font-medium">${stats.balance.paid}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">К выплате:</span>
                  <span className="text-lg font-bold text-blue-600">${stats.balance.available}</span>
                </div>
              </div>
            </div>

            {/* Статусы */}
            <div className="bg-white dark:bg-[#0a0a0a] rounded-xl border border-gray-200 dark:border-gray-800 p-6">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Статусы</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">В обработке:</span>
                  <span className="text-sm font-medium text-yellow-600">{stats.today.pendingCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Отклонено:</span>
                  <span className="text-sm font-medium text-red-600">{stats.today.rejectedCount}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Табы */}
        <div className="bg-white dark:bg-[#0a0a0a] rounded-xl border border-gray-200 dark:border-gray-800">
          <div className="border-b border-gray-200 dark:border-gray-800">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              <button
                onClick={() => setActiveTab("deposits")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "deposits"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                }`}
              >
                Депозиты ({deposits.length})
              </button>
              <button
                onClick={() => setActiveTab("salary")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "salary"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                }`}
              >
                Зарплата ({salaryRequests.length})
              </button>
            </nav>
          </div>

          {/* Содержимое табов */}
          <div className="p-6">
            {activeTab === "deposits" && (
              <div className="space-y-4">
                {deposits.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Нет депозитов</h3>
                    <p className="text-gray-500 dark:text-gray-400">Внесите первый депозит для начала работы</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-700">
                          <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Дата</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Игрок</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Оффер</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Сумма</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Бонус</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Статус</th>
                        </tr>
                      </thead>
                      <tbody>
                        {deposits.map((deposit) => (
                          <tr key={deposit.id} className="border-b border-gray-100 dark:border-gray-800">
                            <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                              {new Date(deposit.createdAt).toLocaleDateString()}
                            </td>
                            <td className="py-3 px-4 text-sm">
                              <div>
                                <div className="font-medium text-gray-900 dark:text-gray-100">{deposit.playerId}</div>
                                {deposit.playerNick && (
                                  <div className="text-gray-500 dark:text-gray-400">{deposit.playerNick}</div>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                              {deposit.offerName || "-"}
                            </td>
                            <td className="py-3 px-4 text-sm font-medium text-gray-900 dark:text-gray-100">
                              ${deposit.amount}
                            </td>
                            <td className="py-3 px-4 text-sm font-medium text-green-600">
                              ${deposit.bonusAmount}
                            </td>
                            <td className="py-3 px-4">
                              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                                deposit.status === "APPROVED" 
                                  ? "bg-green-100 text-green-800" 
                                  : deposit.status === "REJECTED"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-yellow-100 text-yellow-800"
                              }`}>
                                {deposit.status === "APPROVED" ? "Подтвержден" : 
                                 deposit.status === "REJECTED" ? "Отклонен" : "В обработке"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeTab === "salary" && (
              <div className="space-y-4">
                {salaryRequests.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Нет заявок на зарплату</h3>
                    <p className="text-gray-500 dark:text-gray-400">Подайте заявку на выплату заработанных средств</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-700">
                          <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Дата заявки</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Период</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Сумма</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Статус</th>
                        </tr>
                      </thead>
                      <tbody>
                        {salaryRequests.map((request) => (
                          <tr key={request.id} className="border-b border-gray-100 dark:border-gray-800">
                            <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                              {new Date(request.createdAt).toLocaleDateString()}
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                              {new Date(request.periodStart).toLocaleDateString()} - {new Date(request.periodEnd).toLocaleDateString()}
                            </td>
                            <td className="py-3 px-4 text-sm font-medium text-gray-900 dark:text-gray-100">
                              ${request.calculatedAmount || request.requestedAmount}
                            </td>
                            <td className="py-3 px-4">
                              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                                request.status === "PAID" 
                                  ? "bg-green-100 text-green-800" 
                                  : request.status === "APPROVED"
                                  ? "bg-blue-100 text-blue-800"
                                  : request.status === "REJECTED"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-yellow-100 text-yellow-800"
                              }`}>
                                {request.status === "PAID" ? "Выплачена" : 
                                 request.status === "APPROVED" ? "Одобрена" :
                                 request.status === "REJECTED" ? "Отклонена" : "В обработке"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Модалка добавления депозита */}
      {showDepositModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-6">Добавить депозит</h3>
            
            <form onSubmit={handleSubmitDeposit} className="space-y-4">
              {/* Сумма */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Сумма *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={depositForm.amount}
                  onChange={(e) => setDepositForm({...depositForm, amount: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="0.00"
                  required
                />
              </div>

              {/* Криптовалюта */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Валюта *
                </label>
                <select
                  value={depositForm.currency}
                  onChange={(e) => setDepositForm({...depositForm, currency: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                >
                  <optgroup label="Фиатные валюты">
                    <option value="USD">USD - Доллар США</option>
                    <option value="EUR">EUR - Евро</option>
                    <option value="RUB">RUB - Российский рубль</option>
                  </optgroup>
                  <optgroup label="Криптовалюты">
                    <option value="BTC">BTC - Bitcoin</option>
                    <option value="ETH">ETH - Ethereum</option>
                    <option value="USDT">USDT - Tether</option>
                    <option value="USDC">USDC - USD Coin</option>
                    <option value="BNB">BNB - Binance Coin</option>
                    <option value="XRP">XRP - Ripple</option>
                    <option value="ADA">ADA - Cardano</option>
                    <option value="SOL">SOL - Solana</option>
                    <option value="DOGE">DOGE - Dogecoin</option>
                    <option value="MATIC">MATIC - Polygon</option>
                  </optgroup>
                </select>
              </div>

              {/* Email депозитера */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email депозитера *
                </label>
                <input
                  type="email"
                  value={depositForm.playerEmail}
                  onChange={(e) => setDepositForm({...depositForm, playerEmail: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="user@example.com"
                  required
                />
              </div>

              {/* Заметки */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Заметки (необязательно)
                </label>
                <textarea
                  value={depositForm.notes}
                  onChange={(e) => setDepositForm({...depositForm, notes: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  rows={3}
                  placeholder="Дополнительная информация о депозите"
                />
              </div>

              {/* Кнопки */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowDepositModal(false)}
                  className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded hover:bg-gray-300 transition-colors"
                  disabled={submittingDeposit}
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
                  disabled={submittingDeposit}
                >
                  {submittingDeposit ? "Отправка..." : "Добавить депозит"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showSalaryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">Заявка на зарплату</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">Форма подачи заявки на зарплату будет реализована в следующей итерации</p>
            <button
              onClick={() => setShowSalaryModal(false)}
              className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded hover:bg-gray-300 transition-colors"
            >
              Закрыть
            </button>
          </div>
        </div>
      )}
    </div>
  );
}