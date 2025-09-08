"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/Toast";
import SalaryRequestModal from "@/components/modals/SalaryRequestModal";

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
  status: "PENDING" | "APPROVED" | "REJECTED" | "PROCESSING";
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
  status: "PENDING" | "APPROVED" | "REJECTED" | "PAID";
  createdAt: string;
  adminComment?: string;
}

interface ProcessorShift {
  id: string;
  shiftType: 'MORNING' | 'DAY' | 'NIGHT';
  shiftDate: string;
  scheduledStart: string;
  scheduledEnd: string;
  actualStart?: string;
  actualEnd?: string;
  status: 'SCHEDULED' | 'ACTIVE' | 'COMPLETED' | 'MISSED';
  notes?: string;
}

export default function ProcessingPage() {
  const router = useRouter();
  const { showSuccess, showError, showWarning } = useToast();

  // Функция для красивого отображения названий валют
  const getCurrencyDisplayName = (currency: string) => {
    const currencyNames: Record<string, string> = {
      'BTC': 'Bitcoin',
      'ETH': 'Ethereum',
      'TRX': 'TRON',
      'USDT_TRC20': 'USDT TRC20',
      'USDT_ERC20': 'USDT ERC20',
      'USDT_BEP20': 'USDT BEP20',
      'USDT_SOL': 'USDT SOL',
      'USDC': 'USD Coin',
      'XRP': 'Ripple',
      'BASE': 'Base Network',
      'BNB': 'Binance Coin',
      'TRON': 'TRON Network',
      'TON': 'The Open Network',
      'SOLANA': 'Solana Network'
    };
    return currencyNames[currency] || currency;
  };
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

  // Состояния для управления сменами
  const [currentShift, setCurrentShift] = useState<ProcessorShift | null>(null);
  const [shiftTimeRemaining, setShiftTimeRemaining] = useState<number | null>(null);
  const [shiftTimer, setShiftTimer] = useState<NodeJS.Timeout | null>(null);
  const [isShiftActive, setIsShiftActive] = useState(false);
  const [shiftLoading, setShiftLoading] = useState(false);

  // Состояния для материалов
  const [instructions, setInstructions] = useState<Array<{
    id: string;
    title: string;
    content: string;
    category: string;
    priority: number;
  }>>([]);
  const [scripts, setScripts] = useState<Array<{
    id: string;
    title: string;
    content: string;
    description?: string;
    category: string;
    language: string;
  }>>([]);
  const [resources, setResources] = useState<Array<{
    id: string;
    title: string;
    description?: string;
    type: string;
    url?: string;
    filePath?: string;
  }>>([]);
  const [templates, setTemplates] = useState<Array<{
    id: string;
    name: string;
    description?: string;
    content: string;
    type: string;
  }>>([]);
  
  // Состояния для бонусной системы
  const [bonusSettings, setBonusSettings] = useState<{
    baseCommissionRate: number;
    baseBonusRate: number;
  } | null>(null);
  const [bonusGrids, setBonusGrids] = useState<Array<{
    id: string;
    minAmount: number;
    maxAmount?: number;
    bonusPercentage: number;
    description?: string;
  }>>([]);
  const [bonusMotivations, setBonusMotivations] = useState<Array<{
    id: string;
    type: 'PERCENTAGE' | 'FIXED_AMOUNT';
    name: string;
    description?: string;
    value: number;
    conditions?: string;
  }>>([]);

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
        setUserRole(userData.role);
        
        // Загружаем данные для процессоров и админов
        if (userData.role === "PROCESSOR" || userData.role === "ADMIN") {
          loadProcessorData();
          loadProcessingMaterials();
        } else {
          // Для обычных пользователей загружаем только настройки бонусов
          loadBonusSettings();
          setLoading(false);
        }
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
        setDeposits(depositsData.deposits || []);
      }

      // Загружаем информацию о смене
      await loadShiftData();

      // Загружаем заявки на зарплату
      const salaryResponse = await fetch("/api/processor/salary-requests");
      if (salaryResponse.ok) {
        const salaryData = await salaryResponse.json();
        setSalaryRequests(salaryData.salaryRequests || []);
      }
      
    } catch (error) {
      console.error("Ошибка загрузки данных:", error);
    } finally {
      setLoading(false);
    }
  };

  // Отправка заявки на зарплату
  const handleSalaryRequest = async (data: {
    periodStart: string;
    periodEnd: string;
    requestedAmount: number;
    paymentDetails: {
      method: string;
      account: string;
      additionalInfo?: string;
    };
    comment?: string;
  }) => {
    try {
      setSubmittingDeposit(true);
      
      const response = await fetch("/api/processor/salary-requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          periodStart: data.periodStart,
          periodEnd: data.periodEnd,
          requestedAmount: data.requestedAmount,
          paymentDetails: data.paymentDetails,
          comment: data.comment,
        }),
      });

      if (response.ok) {
        showSuccess("Заявка отправлена", "Заявка на зарплату успешно отправлена на рассмотрение");
        loadProcessorData(); // Перезагружаем данные
      } else {
        const errorData = await response.json();
        showError("Ошибка отправки", errorData.error || "Не удалось отправить заявку");
      }
    } catch (error) {
      console.error("Ошибка отправки заявки на зарплату:", error);
      showError("Ошибка отправки", "Произошла ошибка при отправке заявки");
    } finally {
      setSubmittingDeposit(false);
    }
  };

  // Загрузка материалов обработки
  const loadProcessingMaterials = async () => {
    try {
      // Загружаем инструкции, скрипты, ресурсы и шаблоны
      const materialsResponse = await fetch("/api/processor/instructions");
      if (materialsResponse.ok) {
        const materialsData = await materialsResponse.json();
        setInstructions(materialsData.instructions || []);
        setScripts(materialsData.scripts || []);
        setResources(materialsData.resources || []);
        setTemplates(materialsData.templates || []);
      }
    } catch (error) {
      console.error("Ошибка загрузки материалов:", error);
    }
  };

  // Загрузка настроек бонусной системы
  const loadBonusSettings = async () => {
    try {
      const response = await fetch("/api/bonus-settings");
      if (response.ok) {
        const data = await response.json();
        setBonusSettings(data.bonusSettings);
        setBonusGrids(data.bonusGrids || []);
        setBonusMotivations(data.bonusMotivations || []);
      }
    } catch (error) {
      console.error("Ошибка загрузки настроек бонусов:", error);
    }
  };

  // Загрузка данных о смене
  const loadShiftData = async () => {
    try {
      const response = await fetch("/api/processor/shifts");
      if (response.ok) {
        const data = await response.json();
        setCurrentShift(data.shift);
        setIsShiftActive(data.isActive);

        if (data.timeRemaining !== null) {
          setShiftTimeRemaining(data.timeRemaining);
          startTimer(data.timeRemaining);
        }
      }
    } catch (error) {
      console.error("Ошибка загрузки данных смены:", error);
    }
  };

  // Функция для запуска таймера
  const startTimer = (initialTime: number) => {
    if (shiftTimer) {
      clearInterval(shiftTimer);
    }

    setShiftTimeRemaining(initialTime);

    const timer = setInterval(() => {
      setShiftTimeRemaining(prev => {
        if (prev === null || prev <= 1000) {
          clearInterval(timer);
          setShiftTimer(null);
          return 0;
        }
        return prev - 1000;
      });
    }, 1000);

    setShiftTimer(timer);
  };

  // Начать смену
  const startShift = async () => {
    setShiftLoading(true);
    try {
      const response = await fetch("/api/processor/shifts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start" }),
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentShift(data.shift);
        setIsShiftActive(true);
        startTimer(8 * 60 * 60 * 1000); // 8 часов
        showSuccess(data.message);
      } else {
        const error = await response.json();
        showError(error.error || "Ошибка при начале смены");
      }
    } catch (error) {
      console.error("Ошибка начала смены:", error);
      showError("Ошибка при начале смены");
    } finally {
      setShiftLoading(false);
    }
  };

  // Закончить смену
  const endShift = async () => {
    setShiftLoading(true);
    try {
      const response = await fetch("/api/processor/shifts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "end" }),
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentShift(data.shift);
        setIsShiftActive(false);
        setShiftTimeRemaining(null);

        if (shiftTimer) {
          clearInterval(shiftTimer);
          setShiftTimer(null);
        }

        showSuccess(data.message);
      } else {
        const error = await response.json();
        showError(error.error || "Ошибка при завершении смены");
      }
    } catch (error) {
      console.error("Ошибка завершения смены:", error);
      showError("Ошибка при завершении смены");
    } finally {
      setShiftLoading(false);
    }
  };

  // Форматирование времени
  const formatTime = (milliseconds: number) => {
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((milliseconds % (1000 * 60)) / 1000);

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Очистка таймера при размонтировании
  useEffect(() => {
    return () => {
      if (shiftTimer) {
        clearInterval(shiftTimer);
      }
    };
  }, [shiftTimer]);

  // Отправка депозита
  const handleSubmitDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!depositForm.amount || !depositForm.currency || !depositForm.playerEmail) {
      showWarning("Заполните все поля", "Все обязательные поля должны быть заполнены");
      return;
    }

    if (parseFloat(depositForm.amount) <= 0) {
      showError("Неверная сумма", "Сумма должна быть больше 0");
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
        showSuccess("Депозит добавлен", "Депозит успешно отправлен на обработку");
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
        showError("Ошибка отправки", errorData.error || "Не удалось отправить депозит");
      }
    } catch (error) {
      console.error("Ошибка отправки депозита:", error);
      showError("Ошибка отправки", "Произошла ошибка при отправке депозита");
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

  // Если пользователь не процессор и не админ, показываем информационную страницу
  if (userRole !== "PROCESSOR" && userRole !== "ADMIN") {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="bg-white dark:bg-[#0a0a0a] border-b border-gray-200 dark:border-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-[#171717] dark:text-[#ededed]">
                Система обработки депозитов
              </h1>
              <p className="text-[#171717]/60 dark:text-[#ededed]/60 mt-1">
                Профессиональная система управления депозитами и выплатами
              </p>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {userRole === "ADMIN" ? (
            <div className="bg-white dark:bg-[#0a0a0a] rounded-xl border border-gray-200 dark:border-gray-800 p-8">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-[#171717] dark:text-[#ededed] mb-2">
                  Администратор системы
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Для управления системой обработки перейдите в административную панель
                </p>
              </div>
              
              <div className="flex justify-center">
                <a 
                  href="/admin/processing"
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Административная панель
                </a>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-[#0a0a0a] rounded-xl border border-gray-200 dark:border-gray-800 p-8">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-[#171717] dark:text-[#ededed] mb-2">
                  Доступ ограничен
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Эта страница предназначена для пользователей с ролью &quot;Обработчик депозитов&quot;
                </p>
              </div>

              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-6">
                <h3 className="font-medium text-[#171717] dark:text-[#ededed] mb-4">
                  О системе обработки депозитов:
                </h3>
                <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                  <li className="flex items-start gap-2">
                    <svg className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>Автоматический расчёт бонусов и комиссий</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>Поддержка фиатных валют и криптовалют</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>Детальная аналитика и отчётность</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>Система заявок на выплату зарплаты</span>
                  </li>
                </ul>
              </div>

              <div className="mt-6 text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Обратитесь к администратору для получения доступа к системе обработки
                </p>
              </div>
            </div>
          )}
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
              {/* Заголовок убран по запросу */}
            </div>

          </div>
        </div>
      </div>

      {/* Управление сменами */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white dark:bg-[#0a0a0a] rounded-xl border border-gray-200 dark:border-gray-800 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-[#171717] dark:text-[#ededed]">
                Управление сменой
              </h3>
              {currentShift && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Смена: {
                    currentShift.shiftType === 'MORNING' ? '🌅 Утреняя (06:00-14:00)' :
                    currentShift.shiftType === 'DAY' ? '☀️ Дневная (14:00-22:00)' :
                    '🌙 Ночная (22:00-06:00)'
                  }
                  {currentShift.actualStart && (
                    <span className="ml-2">
                      • Начало: {new Date(currentShift.actualStart).toLocaleTimeString('ru-RU')}
                    </span>
                  )}
                  {currentShift.actualEnd && (
                    <span className="ml-2">
                      • Завершение: {new Date(currentShift.actualEnd).toLocaleTimeString('ru-RU')}
                    </span>
                  )}
                </p>
              )}
            </div>

            {isShiftActive && shiftTimeRemaining !== null && (
              <div className="text-right">
                <div className="text-sm text-gray-600 dark:text-gray-400">Осталось времени</div>
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {formatTime(shiftTimeRemaining)}
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            {!isShiftActive ? (
              <button
                onClick={startShift}
                disabled={shiftLoading}
                className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {shiftLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                Начать смену
              </button>
            ) : (
              <button
                onClick={endShift}
                disabled={shiftLoading}
                className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {shiftLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                Закончить смену
              </button>
            )}

            {currentShift && (
              <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 dark:bg-[#0a0a0a] rounded-lg">
                <div className={`w-3 h-3 rounded-full ${
                  currentShift.status === 'ACTIVE' ? 'bg-green-500' :
                  currentShift.status === 'COMPLETED' ? 'bg-blue-500' :
                  'bg-gray-400'
                }`}></div>
                <span className="text-sm font-medium text-[#171717] dark:text-[#ededed]">
                  {currentShift.status === 'ACTIVE' ? 'Смена активна' :
                   currentShift.status === 'COMPLETED' ? 'Смена завершена' :
                   'Смена запланирована'}
                </span>
              </div>
            )}
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

            {/* Информация */}
            <div className="bg-white dark:bg-[#0a0a0a] rounded-xl border border-gray-200 dark:border-gray-800 p-6">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Информация</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Все депозиты:</span>
                  <span className="text-sm font-medium text-green-600">Автоматически одобрены</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Бонусы:</span>
                  <span className="text-sm font-medium text-blue-600">Начисляются сразу</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Быстрые действия */}
        <div className="flex gap-3 mb-6">
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
              <button
                onClick={() => setActiveTab("bonuses")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "bonuses"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                }`}
              >
                Бонусы
              </button>
              <button
                onClick={() => setActiveTab("instructions")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "instructions"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                }`}
              >
                Инструкции
              </button>
            </nav>
          </div>

          {/* Содержимое табов */}
          <div className="p-6">
            {activeTab === "deposits" && (
              <div className="space-y-4">
                {deposits.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-[#0a0a0a] rounded-lg flex items-center justify-center mx-auto mb-4">
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
                          <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Дата и время</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Email игрока</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Сумма</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Сеть</th>
                        </tr>
                      </thead>
                      <tbody>
                        {deposits.map((deposit) => (
                          <tr key={deposit.id} className="border-b border-gray-100 dark:border-gray-800">
                            <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                              {new Date(deposit.createdAt).toLocaleString()}
                            </td>
                            <td className="py-3 px-4 text-sm">
                              <div className="font-medium text-gray-900 dark:text-gray-100">{deposit.playerId}</div>
                            </td>
                            <td className="py-3 px-4 text-sm font-medium text-gray-900 dark:text-gray-100">
                              ${deposit.amount}
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                              {getCurrencyDisplayName(deposit.currency)}
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
                    <div className="w-16 h-16 bg-gray-100 dark:bg-[#0a0a0a] rounded-lg flex items-center justify-center mx-auto mb-4">
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

            {activeTab === "bonuses" && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <h3 className="text-xl font-semibold text-[#171717] dark:text-[#ededed] mb-4">
                    Бонусная сетка и условия работы
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Узнайте, как рассчитываются бонусы и комиссии за ваши депозиты
                  </p>
                </div>

                {/* Базовая комиссия */}
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
                  <h4 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">
                    Базовая комиссия
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {bonusSettings?.baseCommissionRate || 30}%
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Комиссия платформы</div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {bonusSettings?.baseBonusRate || 5}%
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Базовый бонус</div>
                    </div>
                  </div>
                </div>

                {/* Сетка бонусов */}
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-6">
                  <h4 className="text-lg font-semibold text-green-900 dark:text-green-100 mb-3">
                    Прогрессивная сетка бонусов
                  </h4>
                  <div className="space-y-3">
                    {bonusGrids.length > 0 ? (
                      bonusGrids.map((grid) => (
                        <div key={grid.id} className="flex justify-between items-center p-3 bg-white dark:bg-gray-800 rounded-lg">
                          <span className="font-medium">
                            Дневная сумма ${grid.minAmount.toLocaleString()} - {grid.maxAmount ? `$${grid.maxAmount.toLocaleString()}` : '∞'}
                          </span>
                          <span className="text-green-600 font-semibold">{grid.bonusPercentage}% бонус</span>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                        Бонусная сетка не настроена
                      </div>
                    )}
                  </div>
                </div>

                {/* Дополнительные мотивации */}
                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-6">
                  <h4 className="text-lg font-semibold text-purple-900 dark:text-purple-100 mb-3">
                    Дополнительные мотивации
                  </h4>
                  <div className="space-y-3">
                    {bonusMotivations.length > 0 ? (
                      bonusMotivations.map((motivation) => (
                        <div key={motivation.id} className="flex justify-between items-center p-3 bg-white dark:bg-gray-800 rounded-lg">
                          <div>
                            <span className="font-medium">{motivation.name}</span>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              {motivation.description || 'Дополнительная мотивация'}
                            </div>
                          </div>
                          <span className="text-purple-600 font-semibold">
                            {motivation.type === 'PERCENTAGE' ? `+${motivation.value}%` : `+$${motivation.value}`}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                        Дополнительные мотивации не настроены
                      </div>
                    )}
                  </div>
                </div>

                {/* Примеры расчета */}
                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-6">
                  <h4 className="text-lg font-semibold text-purple-900 dark:text-purple-100 mb-3">
                    Примеры расчета бонусов
                  </h4>
                  <div className="space-y-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                      <div className="font-medium mb-2">
                        Депозит $100 (первый за день)
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Бонус: $100 × {bonusSettings?.baseBonusRate || 5}% = ${((100 * (bonusSettings?.baseBonusRate || 5)) / 100).toFixed(2)}
                      </div>
                    </div>
                    {bonusGrids.length > 0 && (
                      <>
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                          <div className="font-medium mb-2">
                            Депозит $500 (сумма за день $600)
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            Бонус: $500 × {bonusGrids[0]?.bonusPercentage || 5}% = ${((500 * (bonusGrids[0]?.bonusPercentage || 5)) / 100).toFixed(2)} (базовая ставка)
                          </div>
                        </div>
                        {bonusGrids.length > 1 && (
                          <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                            <div className="font-medium mb-2">
                              Депозит $1000 (сумма за день $2000)
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              Бонус: $1000 × {bonusGrids[1]?.bonusPercentage || 7.5}% = ${((1000 * (bonusGrids[1]?.bonusPercentage || 7.5)) / 100).toFixed(2)} (повышенная ставка)
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "instructions" && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <h3 className="text-xl font-semibold text-[#171717] dark:text-[#ededed] mb-4">
                    Инструкции и скрипты обработки
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Полезные материалы для эффективной работы с депозитами
                  </p>
                </div>

                {/* Загрузка материалов */}
                {loading ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-500 dark:text-gray-400">Загрузка материалов...</p>
                  </div>
                ) : (
                  <>
                    {/* Инструкции */}
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-6">
                      <h4 className="text-lg font-semibold text-yellow-900 dark:text-yellow-100 mb-4">
                        Инструкции и правила
                      </h4>
                      <div className="space-y-4">
                        {instructions && instructions.length > 0 ? (
                          instructions.map((instruction) => (
                            <div key={instruction.id} className="bg-white dark:bg-gray-800 rounded-lg p-4">
                              <div className="flex items-center gap-3 mb-2">
                                <span className={`px-2 py-1 text-xs rounded-full ${
                                  instruction.category === 'rules' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                                  instruction.category === 'faq' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                                  'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                }`}>
                                  {instruction.category === 'rules' ? 'Правила' : 
                                   instruction.category === 'faq' ? 'FAQ' : 'Советы'}
                                </span>
                                {instruction.priority >= 4 && (
                                  <span className="px-2 py-1 text-xs rounded-full bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400">
                                    Важно
                                  </span>
                                )}
                              </div>
                              <h5 className="font-medium mb-2">{instruction.title}</h5>
                              <div className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-line">
                                {instruction.content}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                            Инструкции не загружены
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Скрипты */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
                      <h4 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-4">
                        Скрипты для работы с клиентами
                      </h4>
                      <div className="space-y-4">
                        {scripts && scripts.length > 0 ? (
                          scripts.map((script) => (
                            <div key={script.id} className="bg-white dark:bg-gray-800 rounded-lg p-4">
                              <div className="flex items-center gap-3 mb-2">
                                <span className={`px-2 py-1 text-xs rounded-full ${
                                  script.category === 'greeting' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                                  script.category === 'clarification' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                  script.category === 'confirmation' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                                  'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
                                }`}>
                                  {script.category === 'greeting' ? 'Приветствие' : 
                                   script.category === 'clarification' ? 'Уточнение' :
                                   script.category === 'confirmation' ? 'Подтверждение' : 'Поддержка'}
                                </span>
                                <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400">
                                  {script.language.toUpperCase()}
                                </span>
                              </div>
                              <h5 className="font-medium mb-2">{script.title}</h5>
                              {script.description && (
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                  {script.description}
                                </p>
                              )}
                              <div className="bg-gray-100 dark:bg-[#0a0a0a] rounded p-3 text-sm font-mono">
                                {script.content}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                            Скрипты не загружены
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Ресурсы */}
                    {resources && resources.length > 0 && (
                      <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-6">
                        <h4 className="text-lg font-semibold text-purple-900 dark:text-purple-100 mb-4">
                          Полезные ресурсы
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {resources.map((resource) => (
                            <div key={resource.id} className="bg-white dark:bg-gray-800 rounded-lg p-4">
                              <div className="flex items-center gap-3 mb-2">
                                <span className={`px-2 py-1 text-xs rounded-full ${
                                  resource.type === 'link' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                                  resource.type === 'video' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                                  resource.type === 'document' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                                  'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
                                }`}>
                                  {resource.type === 'link' ? 'Ссылка' : 
                                   resource.type === 'video' ? 'Видео' :
                                   resource.type === 'document' ? 'Документ' : 'Файл'}
                                </span>
                              </div>
                              <h5 className="font-medium mb-2">{resource.title}</h5>
                              {resource.description && (
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                  {resource.description}
                                </p>
                              )}
                              {(resource.url || resource.filePath) && (
                                <a
                                  href={resource.url || resource.filePath}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                  </svg>
                                  Открыть ресурс
                                </a>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Шаблоны */}
                    {templates && templates.length > 0 && (
                      <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-6">
                        <h4 className="text-lg font-semibold text-orange-900 dark:text-orange-100 mb-4">
                          Готовые шаблоны
                        </h4>
                        <div className="space-y-4">
                          {templates.map((template) => (
                            <div key={template.id} className="bg-white dark:bg-gray-800 rounded-lg p-4">
                              <div className="flex items-center gap-3 mb-2">
                                <span className={`px-2 py-1 text-xs rounded-full ${
                                  template.type === 'email' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                                  template.type === 'message' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                                  'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
                                }`}>
                                  {template.type === 'email' ? 'Email' : 
                                   template.type === 'message' ? 'Сообщение' : 'Уведомление'}
                                </span>
                              </div>
                              <h5 className="font-medium mb-2">{template.name}</h5>
                              {template.description && (
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                  {template.description}
                                </p>
                              )}
                              <div className="bg-gray-100 dark:bg-[#0a0a0a] rounded p-3 text-sm font-mono">
                                {template.content}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
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
              {/* Сумма в долларах */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Сумма в USD *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={depositForm.amount}
                  onChange={(e) => setDepositForm({...depositForm, amount: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="0.00 USD"
                  required
                />
              </div>

              {/* Криптовалюта/Сеть */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Криптовалюта/Сеть *
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                  Выберите криптовалюту или сеть для пометки, куда поступил депозит
                </p>
                <select
                  value={depositForm.currency}
                  onChange={(e) => setDepositForm({...depositForm, currency: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                >
                  <option value="BTC">BTC - Bitcoin</option>
                  <option value="ETH">ETH - Ethereum</option>
                  <option value="TRX">TRX - TRON</option>
                  <option value="USDT_TRC20">USDT TRC20 - Tether на TRON</option>
                  <option value="USDT_ERC20">USDT ERC20 - Tether на Ethereum</option>
                  <option value="USDT_BEP20">USDT BEP20 - Tether на BSC</option>
                  <option value="USDT_SOL">USDT SOL - Tether на Solana</option>
                  <option value="USDC">USDC - USD Coin</option>
                  <option value="XRP">XRP - Ripple</option>
                  <option value="BASE">BASE - Base Network</option>
                  <option value="BNB">BNB - Binance Coin</option>
                  <option value="TRON">TRON - TRON Network</option>
                  <option value="TON">TON - The Open Network</option>
                  <option value="SOLANA">SOLANA - Solana Network</option>
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

      <SalaryRequestModal
        isOpen={showSalaryModal}
        onClose={() => setShowSalaryModal(false)}
        onSubmit={handleSalaryRequest}
        availableAmount={stats?.balance.available || 0}
        isLoading={submittingDeposit}
      />
    </div>
  );
}