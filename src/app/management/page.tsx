"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/Toast";
import SalaryRequestModal from "@/components/modals/SalaryRequestModal";
import DepositModal from "@/components/modals/DepositModal";
import { MetricCard, ProgressBar, LeaderboardCard, ProjectionCard, PeriodSelector } from "@/components/ManagerStatsComponents";
import GoalsSection from "@/components/GoalsSection";
import SalaryStatsCard from "@/components/SalaryStatsCard";
import WalletBalance from "@/components/WalletBalance";
import { useAuth } from "@/hooks/useAuth";

// Компонент управления сменами
function ShiftManagementControls({ 
  allShifts, 
  currentTime, 
  shiftLoading, 
  onCreateShift 
}: {
  allShifts: Array<{
    id: string;
    type: 'MORNING' | 'DAY' | 'NIGHT';
    name: string;
    timeDisplay: string;
    description: string;
    isCurrent: boolean;
    isActive: boolean;
    isAvailableForProcessor: boolean;
    status: 'current' | 'available' | 'disabled' | 'inactive';
    icon: string;
    startTime: { hour: number; minute: number };
    endTime: { hour: number; minute: number };
  }>;
  currentTime: Date;
  shiftLoading: boolean;
  onCreateShift: (shiftType: string) => void;
}) {
  const [timeToNextShift, setTimeToNextShift] = useState<string>("");
  const [nextShift, setNextShift] = useState<typeof allShifts[0] | null>(null);
  const [canStartShift, setCanStartShift] = useState(false);

  useEffect(() => {
    const updateTimer = () => {
      // Находим ближайшую доступную смену
      const availableShifts = allShifts.filter(s => s.isAvailableForProcessor);
      if (availableShifts.length === 0) return;

      const now = new Date(currentTime);
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const currentTotalMinutes = currentHour * 60 + currentMinute;

      let nearestShift = null;
      let minTimeDiff = Infinity;

      for (const shift of availableShifts) {
        const shiftStartMinutes = shift.startTime.hour * 60 + shift.startTime.minute;
        
        // Время когда можно начать смену (за 30 минут до начала)
        const canStartAt = shiftStartMinutes - 30;
        
        // Рассчитываем разность времени
        let timeDiff;
        if (canStartAt > currentTotalMinutes) {
          timeDiff = canStartAt - currentTotalMinutes;
        } else {
          // Смена на следующий день
          timeDiff = (24 * 60) - currentTotalMinutes + canStartAt;
        }

        if (timeDiff < minTimeDiff) {
          minTimeDiff = timeDiff;
          nearestShift = shift;
        }
      }

      if (nearestShift) {
        setNextShift(nearestShift);
        
        // Проверяем, можно ли уже начать смену (за 30 минут до начала)
        const shiftStartMinutes = nearestShift.startTime.hour * 60 + nearestShift.startTime.minute;
        const canStartAtMinutes = shiftStartMinutes - 30;
        
        let canStart = false;
        if (canStartAtMinutes <= currentTotalMinutes && currentTotalMinutes < shiftStartMinutes) {
          canStart = true;
        }
        
        setCanStartShift(canStart);

        if (canStart) {
          setTimeToNextShift("Можно начать смену");
        } else {
          const hours = Math.floor(minTimeDiff / 60);
          const minutes = minTimeDiff % 60;
          setTimeToNextShift(`через ${hours > 0 ? `${hours}ч ` : ''}${minutes}мин`);
        }
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [allShifts, currentTime]);

  const availableShifts = allShifts.filter(s => s.isAvailableForProcessor);

  if (availableShifts.length === 0) {
    return (
      <div className="text-center py-3">
        <div className="text-xs text-amber-600 dark:text-amber-400 mb-2">
          У вас нет назначенных смен
        </div>
        <button
          disabled={true}
          className="w-full bg-gray-400 text-white px-4 py-2 rounded-lg text-sm font-medium cursor-not-allowed"
        >
          Начать смену
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Кнопка начала смены */}
      <button
        onClick={() => nextShift && onCreateShift(nextShift.type)}
        disabled={shiftLoading || !canStartShift}
        className={`w-full px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm font-medium ${
          canStartShift 
            ? 'bg-green-600 hover:bg-green-700 text-white' 
            : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
        }`}
      >
        {shiftLoading ? (
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        ) : (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z"/>
          </svg>
        )}
        Начать смену
        {nextShift && (
          <span className="text-xs opacity-75">
            ({nextShift.name})
          </span>
        )}
      </button>

      {/* Таймер */}
      {nextShift && (
        <div className="text-center">
          <div className="text-xs text-gray-600 dark:text-gray-400">
            {canStartShift ? (
              <span className="text-green-600 dark:text-green-400 font-medium">
                ✓ Можно начать смену &quot;{nextShift.name}&quot;
              </span>
            ) : (
              <span>
                Начало смены &quot;{nextShift.name}&quot; {timeToNextShift}
              </span>
            )}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Время смены: {nextShift.timeDisplay}
          </div>
        </div>
      )}
    </div>
  );
}

// Типы данных
interface ManagerStats {
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

interface ManagerDeposit {
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

interface ManagerShift {
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

interface DetailedStats {
  performance: {
    today: PeriodStats;
    week: PeriodStats;
    month: PeriodStats;
  };
  projections: {
    monthlyEarnings: number;
    remainingDays: number;
    dailyTarget: number;
    onTrack: boolean;
  };
  goals: {
    monthly: {
      earnings: number;
      deposits: number;
      hours: number;
      depositVolume: number;
    };
    progress: {
      earnings: number;
      deposits: number;
      hours: number;
      depositVolume: number;
    };
    achievements: {
      earningsAchieved: boolean;
      depositsAchieved: boolean;
      hoursAchieved: boolean;
    };
  };
  leaderboard: Array<{
    rank: number;
    name: string;
    isCurrentUser: boolean;
    earnings: number;
    deposits: number;
    volume: number;
  }>;
  currentUserRank: number | null;
  settings: {
    hourlyRate: number;
    baseCommission: number;
    bonusGrids: Array<{
      id: string;
      minAmount: number;
      maxAmount?: number;
      bonusPercentage: number;
      description?: string;
    }>;
    depositGrid: Array<{
      id: string;
      minAmount: number;
      percentage: number;
      description?: string;
    }>;
    monthlyBonuses: Array<{
      id: string;
      name: string;
      minAmount: number;
      bonusPercent: number;
      description?: string;
    }>;
  };
  period: {
    type: string;
    isCurrentMonth: boolean;
  };
}

interface PeriodStats {
  deposits: number;
  volume: number;
  earnings: number;
  hours: number;
  avgPerHour: number;
}

export default function ProcessingPage() {
  const router = useRouter();
  const { showSuccess, showError, showWarning } = useToast();
  const { user } = useAuth();

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
  const [stats, setStats] = useState<ManagerStats | null>(null);
  const [detailedStats, setDetailedStats] = useState<DetailedStats | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<'current' | 'previous' | 'custom'>('current');
  const [customDateRange, setCustomDateRange] = useState<{start: string; end: string}>({ start: '', end: '' });
  const [deposits, setDeposits] = useState<ManagerDeposit[]>([]);
  const [salaryRequests, setSalaryRequests] = useState<SalaryRequest[]>([]);
  const [activeTab, setActiveTab] = useState("shifts");
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showSalaryModal, setShowSalaryModal] = useState(false);
  const [submittingDeposit, setSubmittingDeposit] = useState(false);

  // Состояния для истории действий
  const [actionLogs, setActionLogs] = useState<Array<{
    id: string;
    action: string;
    description: string;
    createdAt: string;
    metadata?: Record<string, unknown>;
  }>>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Состояния для статистики зарплаты
  const [salaryStats, setSalaryStats] = useState<{
    todayHours: number;
    monthHours: number;
    todayBaseSalary: number;
    monthBaseSalary: number;
    projectedMonthSalary: number;
    hourlyRate: number;
    currentActiveHours?: number;
    hasActiveShift: boolean;
  } | null>(null);

  // Состояния для управления сменами
  const [currentShift, setCurrentShift] = useState<ManagerShift | null>(null);
  const [shiftTimeRemaining, setShiftTimeRemaining] = useState<number | null>(null);
  const [shiftTimer, setShiftTimer] = useState<NodeJS.Timeout | null>(null);
  const [isShiftActive, setIsShiftActive] = useState(false);
  const [shiftLoading, setShiftLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [allShifts, setAllShifts] = useState<Array<{
    id: string;
    type: 'MORNING' | 'DAY' | 'NIGHT';
    name: string;
    timeDisplay: string;
    description: string;
    isCurrent: boolean;
    isActive: boolean;
    isAvailableForProcessor: boolean;
    status: 'current' | 'available' | 'disabled' | 'inactive';
    icon: string;
    startTime: { hour: number; minute: number };
    endTime: { hour: number; minute: number };
  }>>([]);

  // Состояния для доступных смен
  const [availableShifts] = useState<Array<{
    type: 'MORNING' | 'DAY' | 'NIGHT';
    name: string;
    timeDisplay: string;
    description: string;
    isCurrent: boolean;
    icon: string;
  }>>([]);
  

  // Проверка авторизации и роли
  useEffect(() => {
    const checkAuth = async () => {
      try {
        if (!user) {
          router.push("/login");
          return;
        }
        
        setUserRole(user.role);
        
        // Загружаем данные для менеджеров и админов
        if (user.role === "PROCESSOR" || user.role === "ADMIN") {
          // Запускаем загрузку данных
          (async () => {
            try {
              setLoading(true);

              // Загружаем статистику
              const statsResponse = await fetch("/api/manager/stats");
              if (statsResponse.ok) {
                const statsData = await statsResponse.json();
                setStats(statsData);
              }

              // Загружаем детальную статистику
              const url = `/api/manager/stats-detailed?period=${selectedPeriod}`;
              const detailedStatsResponse = await fetch(url);
              if (detailedStatsResponse.ok) {
                const detailedStatsData = await detailedStatsResponse.json();
                setDetailedStats(detailedStatsData);
              }

              // Загружаем данные смены
              const shiftResponse = await fetch("/api/manager/shifts");
              if (shiftResponse.ok) {
                const shiftData = await shiftResponse.json();
                setCurrentShift(shiftData.shift);
                setIsShiftActive(shiftData.isActive);

                if (shiftData.timeRemaining !== null) {
                  setShiftTimeRemaining(shiftData.timeRemaining);
                }
              }

              // Загружаем все смены в системе
              const allShiftsResponse = await fetch(`/api/manager/all-shifts`);
              if (allShiftsResponse.ok) {
                const allShiftsData = await allShiftsResponse.json();
                setAllShifts(allShiftsData.shifts || []);
              }

              // Загружаем депозиты менеджера
              const depositsResponse = await fetch(`/api/manager/deposits?page=1&limit=50`);
              if (depositsResponse.ok) {
                const depositsData = await depositsResponse.json();
                setDeposits(depositsData.deposits || []);
              }

              // Загружаем историю действий
              const historyResponse = await fetch(`/api/manager/action-logs?page=1&limit=15`);
              if (historyResponse.ok) {
                const historyData = await historyResponse.json();
                setActionLogs(historyData.logs);
              }

              // Загружаем статистику зарплаты
              await loadSalaryStats();
            } catch (error) {
              console.error("Ошибка загрузки данных:", error);
            } finally {
              setLoading(false);
            }
          })();
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error("Ошибка проверки авторизации:", error);
        router.push("/login");
      }
    };

    if (user) {
      checkAuth();
    }
  }, [user, router, selectedPeriod]);

  // Обновление текущего времени каждую секунду
  useEffect(() => {
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timeInterval);
  }, []);

  // Загрузка статистики зарплаты
  const loadSalaryStats = useCallback(async () => {
    try {
      const response = await fetch('/api/manager/salary-stats');
      if (response.ok) {
        const data = await response.json();
        setSalaryStats(data);
      }
    } catch (error) {
      console.error("Ошибка загрузки статистики зарплаты:", error);
    }
  }, []);

  // Периодическое обновление статистики зарплаты (каждые 30 секунд)
  useEffect(() => {
    if (salaryStats && isShiftActive) {
      const interval = setInterval(() => {
        loadSalaryStats();
      }, 30000); // 30 секунд

      return () => clearInterval(interval);
    }
  }, [salaryStats, isShiftActive, loadSalaryStats]);


  // Отдельная функция для загрузки детальной статистики с параметрами
  const loadDetailedStats = useCallback(async (period = selectedPeriod, startDate?: string, endDate?: string) => {
    try {
      let url = `/api/manager/stats-detailed?period=${period}`;
      if (period === 'custom' && startDate && endDate) {
        url += `&startDate=${startDate}&endDate=${endDate}`;
      }
      
      const detailedStatsResponse = await fetch(url);
      if (detailedStatsResponse.ok) {
        const detailedStatsData = await detailedStatsResponse.json();
        setDetailedStats(detailedStatsData);
      }
    } catch (error) {
      console.error("Ошибка загрузки детальной статистики:", error);
    }
  }, [selectedPeriod]);

  // Функция для изменения периода
  const handlePeriodChange = async (period: 'current' | 'previous' | 'custom') => {
    setSelectedPeriod(period);
    await loadDetailedStats(period, customDateRange.start, customDateRange.end);
  };

  // Функция для применения кастомного периода
  const handleCustomPeriodApply = async () => {
    if (customDateRange.start && customDateRange.end) {
      await loadDetailedStats('custom', customDateRange.start, customDateRange.end);
    }
  };




  // Загрузка данных о смене
  const loadShiftData = useCallback(async () => {
    try {
      const response = await fetch("/api/manager/shifts");
      if (response.ok) {
        const data = await response.json();
        setCurrentShift(data.shift);
        setIsShiftActive(data.isActive);

        if (data.timeRemaining !== null) {
          setShiftTimeRemaining(data.timeRemaining);
        }
      }
    } catch (error) {
      console.error("Ошибка загрузки данных смены:", error);
    }
  }, []);

  // Загрузка истории действий
  const loadActionHistory = useCallback(async () => {
    try {
      setHistoryLoading(true);
      const response = await fetch(`/api/manager/action-logs?page=1&limit=15`);
      const data = await response.json();

      if (response.ok) {
        setActionLogs(data.logs);
      } else {
        showError(data.error || "Ошибка загрузки истории действий");
      }
    } catch (error) {
      console.error("Ошибка:", error);
      showError("Ошибка соединения с сервером");
    } finally {
      setHistoryLoading(false);
    }
  }, [showError]);

  // Загрузка всех смен в системе
  const loadAllShifts = useCallback(async () => {
    try {
      const response = await fetch(`/api/manager/all-shifts`);
      const data = await response.json();

      if (response.ok) {
        setAllShifts(data.shifts || []);
      } else {
        console.error("Ошибка загрузки всех смен:", data.error);
      }
    } catch (error) {
      console.error("Ошибка загрузки всех смен:", error);
    }
  }, []);

  // Загрузка депозитов менеджера
  const loadDeposits = useCallback(async () => {
    try {
      const response = await fetch(`/api/manager/deposits?page=1&limit=50`);
      const data = await response.json();

      if (response.ok) {
        setDeposits(data.deposits || []);
      } else {
        console.error("Ошибка загрузки депозитов:", data.error);
      }
    } catch (error) {
      console.error("Ошибка загрузки депозитов:", error);
    }
  }, []);

  // Создать смену
  const createShift = async (shiftType: string) => {
    setShiftLoading(true);
    try {
      const response = await fetch("/api/manager/shifts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create", shiftType }),
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentShift(data.shift);
        showSuccess(data.message);
        
        // Обновляем данные
        await loadShiftData();
        await loadAllShifts();
      } else {
        const error = await response.json();
        showError(error.error || "Ошибка при создании смены");
      }
    } catch (error) {
      console.error("Ошибка создания смены:", error);
      showError("Ошибка при создании смены");
    } finally {
      setShiftLoading(false);
    }
  };

  // Функция для запуска таймера
  const startTimer = useCallback((initialTime: number) => {
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
  }, [shiftTimer]);

  // Начать смену
  const startShift = async () => {
    setShiftLoading(true);
    try {
      const response = await fetch("/api/manager/shifts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start" }),
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentShift(data.shift);
        setIsShiftActive(true);
        
        // Вычисляем время до конца смены по графику
        if (data.shift.scheduledEnd) {
          const now = new Date();
          const endTime = new Date(data.shift.scheduledEnd);
          const timeRemaining = Math.max(0, endTime.getTime() - now.getTime());
          setShiftTimeRemaining(timeRemaining);
          startTimer(timeRemaining);
        }
        
        showSuccess(data.message);
        // Обновляем историю действий и смен
        await loadActionHistory();
        await loadAllShifts();
        await loadSalaryStats();
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
      const response = await fetch("/api/manager/shifts", {
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
        // Обновляем историю действий и смен
        await loadActionHistory();
        await loadAllShifts();
        await loadSalaryStats();
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
  const handleSubmitDeposit = async (depositData: {
    amount: string;
    currency: string;
    playerEmail: string;
    notes: string;
  }) => {
    if (!depositData.amount || !depositData.currency || !depositData.playerEmail) {
      showWarning("Заполните все поля", "Все обязательные поля должны быть заполнены");
      return;
    }

    if (parseFloat(depositData.amount) <= 0) {
      showError("Неверная сумма", "Сумма должна быть больше 0");
      return;
    }

    try {
      setSubmittingDeposit(true);
      
      const response = await fetch("/api/manager/deposits", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: parseFloat(depositData.amount),
          currency: depositData.currency,
          playerEmail: depositData.playerEmail,
          notes: depositData.notes,
          playerId: `deposit_${Date.now()}`, // Генерируем ID
        }),
      });

      if (response.ok) {
        showSuccess("Депозит добавлен", "Депозит успешно отправлен на обработку");
        setShowDepositModal(false);
        // Перезагружаем статистику и депозиты
        const statsResponse = await fetch("/api/manager/stats");
        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          setStats(statsData);
        }
        // Обновляем список депозитов
        await loadDeposits();
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

  // Отправка запроса на зарплату
  const handleSalaryRequest = async (salaryData: {
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
      setSubmittingDeposit(true); // Используем тот же флаг загрузки
      
      const response = await fetch("/api/manager/salary-requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(salaryData),
      });

      if (response.ok) {
        showSuccess("Заявка отправлена", "Заявка на выплату зарплаты успешно создана");
        setShowSalaryModal(false);
        // Перезагружаем статистику
        const statsResponse = await fetch("/api/manager/stats");
        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          setStats(statsData);
        }
      } else {
        const errorData = await response.json();
        showError("Ошибка отправки", errorData.error || "Не удалось создать заявку");
      }
    } catch (error) {
      console.error("Ошибка создания заявки:", error);
      showError("Ошибка отправки", "Произошла ошибка при создании заявки");
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

  // Если пользователь не менеджер и не админ, показываем информационную страницу
  if (userRole !== "PROCESSOR" && userRole !== "ADMIN") {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">

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
                  href="/admin/management"
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
                  Эта страница предназначена для пользователей с ролью &quot;Менеджер депозитов&quot;
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

      {/* Система табов */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white dark:bg-[#0a0a0a] rounded-xl border border-gray-200 dark:border-gray-800">
          {/* Навигация табов */}
          <div className="border-b border-gray-200 dark:border-gray-800">
            <div className="flex justify-between items-center px-6">
              <nav className="flex space-x-8" aria-label="Tabs">
              <button
                onClick={() => setActiveTab("shifts")}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                  activeTab === "shifts"
                    ? "border-blue-500 text-blue-600 dark:text-blue-400"
                    : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Смены
              </button>
              
              <button
                onClick={() => setActiveTab("statistics")}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                  activeTab === "statistics"
                    ? "border-blue-500 text-blue-600 dark:text-blue-400"
                    : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Статистика
              </button>

              <button
                onClick={() => setActiveTab("deposits")}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                  activeTab === "deposits"
                    ? "border-blue-500 text-blue-600 dark:text-blue-400"
                    : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
                Депозиты ({deposits.length})
              </button>

              <button
                onClick={() => setActiveTab("salary")}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                  activeTab === "salary"
                    ? "border-blue-500 text-blue-600 dark:text-blue-400"
                    : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Зарплата ({salaryRequests.length})
              </button>
              </nav>

              {/* Кошелек справа от табов */}
              {stats && (
                <div className="py-2">
                  <WalletBalance 
                    balance={stats.balance} 
                    className="w-auto"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Содержимое табов */}
          <div className="p-6">
            {/* Таб Смены */}
            {activeTab === "shifts" && (
              <div className="space-y-4">
                {/* Компактная панель управления сменой */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {/* Текущее время */}
                  <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Время UTC+3</span>
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="text-lg font-mono font-bold text-gray-900 dark:text-white">
                      {currentTime.toLocaleTimeString('ru-RU', { 
                        timeZone: 'Europe/Moscow',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                      {currentTime.toLocaleDateString('ru-RU', { 
                        timeZone: 'Europe/Moscow',
                        day: 'numeric',
                        month: 'short'
                      })}
                    </div>
                    {availableShifts.length > 0 && (
                      <div className="flex items-center gap-1 text-xs">
                        {availableShifts.find(shift => shift.isCurrent) && (
                          <>
                            {availableShifts.find(shift => shift.isCurrent)?.icon === 'sunrise' && (
                              <svg className="w-3 h-3 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                              </svg>
                            )}
                            {availableShifts.find(shift => shift.isCurrent)?.icon === 'sun' && (
                              <svg className="w-3 h-3 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                              </svg>
                            )}
                            {availableShifts.find(shift => shift.isCurrent)?.icon === 'moon' && (
                              <svg className="w-3 h-3 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                              </svg>
                            )}
                            <span className="text-gray-600 dark:text-gray-300 font-medium">
                              {availableShifts.find(shift => shift.isCurrent)?.name}
                            </span>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Статус смены */}
                  <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Статус</span>
                      <div className={`w-2 h-2 rounded-full ${
                        currentShift && currentShift.status === 'ACTIVE' ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
                      }`}></div>
                    </div>
                    <div className={`text-lg font-semibold ${
                      currentShift && currentShift.status === 'ACTIVE' ? 'text-green-600' : 'text-gray-600'
                    }`}>
                      {currentShift && currentShift.status === 'ACTIVE' ? 'Активна' : 'Не начата'}
                    </div>
                    {shiftTimeRemaining !== null && (
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {formatTime(shiftTimeRemaining)} до окончания
                      </div>
                    )}
                    {!isShiftActive && (
                      <div className="mt-2 text-xs text-blue-700 dark:text-blue-300">
                        <div className="font-medium">Доступные операции</div>
                        <div className="text-blue-600 dark:text-blue-400">
                          После начала смены станут доступны депозиты и другие функции
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Кнопка управления */}
                  <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Управление</span>
                    </div>
                    {!currentShift ? (
                      <ShiftManagementControls 
                        allShifts={allShifts}
                        currentTime={currentTime}
                        shiftLoading={shiftLoading}
                        onCreateShift={createShift}
                      />
                    ) : !isShiftActive ? (
                      <button
                        onClick={startShift}
                        disabled={shiftLoading}
                        className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                      >
                        {shiftLoading ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z"/>
                          </svg>
                        )}
                        Начать смену
                      </button>
                    ) : (
                      <button
                        onClick={endShift}
                        disabled={shiftLoading}
                        className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                      >
                        {shiftLoading ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        )}
                        Завершить
                      </button>
                    )}
                  </div>
                </div>


                {/* Доступные смены */}
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Смены проекта
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        Назначено вам: {allShifts.filter(s => s.isAvailableForManager).length}
                      </div>
                    </div>
                  </div>
                  <div className="p-3">
                    {allShifts.length === 0 ? (
                      <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                        <div className="w-8 h-8 mx-auto mb-2 text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <p className="text-sm">Нет настроенных смен</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-2">
                        {allShifts.map((shift) => (
                          <div key={shift.id} className={`relative p-3 rounded-lg border transition-all ${
                            shift.isCurrent 
                              ? 'border-blue-200 bg-blue-50 dark:border-blue-700 dark:bg-blue-900/20' 
                              : shift.isAvailableForManager 
                                ? 'border-green-200 bg-green-50 dark:border-green-700 dark:bg-green-900/20' 
                                : 'border-gray-200 bg-gray-50 dark:border-gray-600 dark:bg-gray-700'
                          }`}>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${
                                  shift.type === 'MORNING' ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400' :
                                  shift.type === 'DAY' ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                  'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400'
                                }`}>
                                  {shift.type === 'MORNING' ? 'У' : shift.type === 'DAY' ? 'Д' : 'Н'}
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-gray-900 dark:text-white text-sm">
                                      {shift.name}
                                    </span>
                                    {shift.isCurrent && (
                                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                                        Сейчас
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-xs text-gray-600 dark:text-gray-400">
                                    {shift.timeDisplay}
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                {shift.isAvailableForManager ? (
                                  <div className="flex items-center gap-1">
                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                    <span className="text-xs font-medium text-green-700 dark:text-green-400">
                                      Назначена
                                    </span>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-1">
                                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                      {shift.isActive ? 'Не назначена' : 'Отключена'}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* История действий */}
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      История действий
                    </h3>
                  </div>
                  <div className="p-4">
                    {historyLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
                      </div>
                    ) : actionLogs.length === 0 ? (
                      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        <p>История действий пуста</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {actionLogs.map((log) => (
                          <div key={log.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <div className="flex-shrink-0">
                              {/* Иконки для разных типов действий */}
                              {log.action === 'SHIFT_START' && (
                                <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                                  <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h8m-10 5.5V7a2 2 0 012-2h8a2 2 0 012 2v12.5" />
                                  </svg>
                                </div>
                              )}
                              {log.action === 'SHIFT_END' && (
                                <div className="w-8 h-8 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                                  <svg className="w-4 h-4 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h8m-4-4v8" />
                                  </svg>
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {log.description}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {new Date(log.createdAt).toLocaleString('ru-RU', { 
                                  timeZone: 'Europe/Moscow',
                                  day: 'numeric',
                                  month: 'short',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </div>
                            </div>
                            <div className="flex-shrink-0">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                log.action === 'SHIFT_START' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                                log.action === 'SHIFT_END' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                                'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                              }`}>
                                {log.action === 'SHIFT_START' ? 'Начало смены' :
                                 log.action === 'SHIFT_END' ? 'Конец смены' :
                                 log.action}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

              </div>
            )}

            {/* Таб Статистика */}
            {activeTab === "statistics" && detailedStats && (
              <div className="space-y-6">
                {/* Заголовок и селектор периода */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-2">
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Статистика и аналитика</h2>
                    {!detailedStats.period.isCurrentMonth && (
                      <span className="px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 text-xs rounded-full">
                        Архивные данные
                      </span>
                    )}
                  </div>
                  
                  <div className="flex-shrink-0">
                    <PeriodSelector
                      selectedPeriod={selectedPeriod}
                      customDateRange={customDateRange}
                      onPeriodChange={handlePeriodChange}
                      onCustomDateChange={setCustomDateRange}
                      onCustomApply={handleCustomPeriodApply}
                    />
                  </div>
                </div>

                {/* Основные метрики производительности */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <MetricCard
                    title="Сегодня"
                    value={`$${detailedStats.performance.today.earnings.toFixed(2)}`}
                    subtitle={`${detailedStats.performance.today.deposits} депозитов • ${detailedStats.performance.today.hours.toFixed(1)}ч`}
                    icon={
                      <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    }
                    gradient="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800"
                  />

                  <MetricCard
                    title="Неделя"
                    value={`$${detailedStats.performance.week.earnings.toFixed(2)}`}
                    subtitle={`${detailedStats.performance.week.deposits} депозитов • ${detailedStats.performance.week.hours.toFixed(1)}ч`}
                    icon={
                      <svg className="w-6 h-6 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    }
                    gradient="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 border-emerald-200 dark:border-emerald-800"
                  />

                  <MetricCard
                    title="Месяц"
                    value={`$${detailedStats.performance.month.earnings.toFixed(2)}`}
                    subtitle={`${detailedStats.performance.month.deposits} депозитов • ${detailedStats.performance.month.hours.toFixed(1)}ч`}
                    icon={
                      <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    }
                    gradient="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-800"
                  />

                  <MetricCard
                    title="Прогноз на месяц"
                    value={`$${detailedStats.projections.monthlyEarnings.toFixed(2)}`}
                    subtitle={`Оклад + бонусы • ${detailedStats.projections.remainingDays} дней осталось`}
                    icon={
                      <svg className="w-6 h-6 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    }
                    gradient="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 border-amber-200 dark:border-amber-800"
                  />
                </div>


                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Прогресс к целям */}
                  <div className="lg:col-span-2">
                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                      <div className="flex items-center gap-2 mb-6">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                          <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                          </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          Прогресс к месячным целям
                        </h3>
                      </div>

                      <div className="space-y-6">
                        <ProgressBar
                          label="Объем депозитов (месячный план)"
                          value={detailedStats.performance.month.volume}
                          target={detailedStats.goals.monthly.depositVolume}
                          color="bg-gradient-to-r from-blue-500 to-blue-600"
                          unit="$"
                          milestones={detailedStats.settings.monthlyBonuses.map(bonus => ({
                            value: bonus.minAmount,
                            label: `${bonus.name}: $${bonus.minAmount.toLocaleString()}`
                          }))}
                        />

                        <ProgressBar
                          label="Заработок"
                          value={detailedStats.performance.month.earnings}
                          target={detailedStats.goals.monthly.earnings}
                          color="bg-gradient-to-r from-emerald-500 to-emerald-600"
                          unit="$"
                        />

                        <ProgressBar
                          label="Депозиты (количество)"
                          value={detailedStats.performance.month.deposits}
                          target={detailedStats.goals.monthly.deposits}
                          color="bg-gradient-to-r from-purple-500 to-purple-600"
                        />

                        <ProgressBar
                          label="Рабочие часы"
                          value={detailedStats.performance.month.hours}
                          target={detailedStats.goals.monthly.hours}
                          color="bg-gradient-to-r from-amber-500 to-amber-600"
                          unit="ч"
                        />
                      </div>

                      {/* Достижения */}
                      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Достижения месяца</h4>
                        <div className="flex flex-wrap gap-2">
                          {detailedStats.goals.achievements.earningsAchieved && (
                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200 text-sm rounded-full">
                              🎯 Цель по заработку
                            </span>
                          )}
                          {detailedStats.goals.achievements.depositsAchieved && (
                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 text-sm rounded-full">
                              📈 Цель по депозитам
                            </span>
                          )}
                          {detailedStats.goals.achievements.hoursAchieved && (
                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 text-sm rounded-full">
                              ⏰ Цель по часам
                            </span>
                          )}
                          {!detailedStats.goals.achievements.earningsAchieved && 
                           !detailedStats.goals.achievements.depositsAchieved && 
                           !detailedStats.goals.achievements.hoursAchieved && (
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              Пока нет достижений этого месяца
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Прогноз заработка */}
                  <ProjectionCard projections={detailedStats.projections} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Рейтинг менеджеров */}
                  <LeaderboardCard 
                    leaderboard={detailedStats.leaderboard}
                    currentUserRank={detailedStats.currentUserRank}
                  />

                  {/* Настройки бонусов */}
                  <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                    <div className="flex items-center gap-2 mb-6">
                      <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                        <svg className="w-5 h-5 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Система бонусов
                      </h3>
                    </div>

                    <div className="space-y-4">

                      <div>
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                          Проценты от депозитов (за смену)
                        </h4>
                        <div className="space-y-2">
                          {detailedStats.settings.depositGrid.slice(0, 5).map((grid) => (
                            <div key={grid.id} className="flex justify-between items-center text-sm p-2 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg">
                              <span className="text-gray-600 dark:text-gray-400">
                                ${grid.minAmount.toLocaleString()}+ депозитов
                              </span>
                              <span className="font-semibold text-green-700 dark:text-green-300">
                                {grid.percentage}%
                              </span>
                            </div>
                          ))}
                          {detailedStats.settings.depositGrid.length > 5 && (
                            <div className="text-center text-xs text-gray-500 dark:text-gray-400 pt-2">
                              +{detailedStats.settings.depositGrid.length - 5} уровней
                            </div>
                          )}
                        </div>
                        
                        <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                          <div className="text-xs text-amber-700 dark:text-amber-300">
                            <strong>Важно:</strong> Бонусы рассчитываются за каждую смену отдельно. В каждую новую смену расчет начинается с нуля.
                          </div>
                        </div>
                      </div>

                      {/* Месячные планы */}
                      {detailedStats.settings.monthlyBonuses && detailedStats.settings.monthlyBonuses.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                            Месячные планы (дополнительный бонус)
                          </h4>
                          <div className="space-y-2">
                            {detailedStats.settings.monthlyBonuses.map((plan) => (
                              <div key={plan.id} className="flex justify-between items-center text-sm p-2 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-lg">
                                <span className="text-gray-600 dark:text-gray-400">
                                  {plan.name}: ${plan.minAmount.toLocaleString()}
                                </span>
                                <span className="font-semibold text-purple-700 dark:text-purple-300">
                                  +{plan.bonusPercent}% от всех депозитов
                                </span>
                              </div>
                            ))}
                          </div>
                          
                          <div className="mt-4 p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                            <div className="text-xs text-purple-700 dark:text-purple-300">
                              <strong>Важно:</strong> Месячные планы действуют прогрессивно. При достижении большего плана, процент заменяется на более высокий (не суммируется).
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Пользовательские планы/цели */}
                      <GoalsSection />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Таб Депозиты */}
            {activeTab === "deposits" && (
              <div className="space-y-6">
                <div className="space-y-6">
                    {/* Кнопка добавления депозита */}
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold text-[#171717] dark:text-[#ededed]">
                        Список депозитов
                      </h3>
                      {isShiftActive ? (
                        <button
                          onClick={() => setShowDepositModal(true)}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          Добавить депозит
                        </button>
                      ) : (
                        <div className="text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-3 py-2 rounded-lg border border-amber-200 dark:border-amber-800">
                          🚫 Начните смену для добавления депозитов
                        </div>
                      )}
                    </div>

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
                      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-gray-700">
                              <tr>
                                <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Дата и время</th>
                                <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Email игрока</th>
                                <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Сумма</th>
                                <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Сеть</th>
                                <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Статус</th>
                              </tr>
                            </thead>
                            <tbody>
                              {deposits.map((deposit) => (
                                <tr key={deposit.id} className="border-b border-gray-100 dark:border-gray-800">
                                  <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                                    {new Date(deposit.createdAt).toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' })}
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
                                  <td className="py-3 px-4">
                                    <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                      Автоодобрен
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                </div>
              </div>
            )}

            {/* Таб Зарплата */}
            {activeTab === "salary" && (
              <div className="space-y-6">
                {!isShiftActive ? (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-10 h-10 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-amber-800 dark:text-amber-200 mb-2">
                      Зарплатные заявки недоступны
                    </h3>
                    <p className="text-amber-600 dark:text-amber-300 mb-4">
                      Начните рабочую смену для подачи заявок на зарплату
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Кнопка создания заявки */}
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold text-[#171717] dark:text-[#ededed]">
                        Заявки на зарплату
                      </h3>
                      <button
                        onClick={() => setShowSalaryModal(true)}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Подать заявку
                      </button>
                    </div>

                    {/* Информация о доступной сумме */}
                    {stats && (
                      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-green-200 dark:bg-green-800 rounded-lg flex items-center justify-center">
                            <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                            </svg>
                          </div>
                          <div>
                            <p className="font-semibold text-green-800 dark:text-green-200">
                              Доступно к выводу: ${stats.balance.available}
                            </p>
                            <p className="text-sm text-green-700 dark:text-green-300">
                              Общий заработок: ${stats.balance.earned} | Выплачено: ${stats.balance.paid}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

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
                      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-gray-700">
                              <tr>
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
                                    {new Date(request.createdAt).toLocaleDateString('ru-RU', { timeZone: 'Europe/Moscow' })}
                                  </td>
                                  <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                                    {new Date(request.periodStart).toLocaleDateString('ru-RU')} - {new Date(request.periodEnd).toLocaleDateString('ru-RU')}
                                  </td>
                                  <td className="py-3 px-4 text-sm font-medium text-gray-900 dark:text-gray-100">
                                    ${request.calculatedAmount || request.requestedAmount}
                                  </td>
                                  <td className="py-3 px-4">
                                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                                      request.status === "PAID" 
                                        ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" 
                                        : request.status === "APPROVED"
                                        ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                                        : request.status === "REJECTED"
                                        ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                                        : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
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
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Модальное окно добавления депозита */}
      <DepositModal
        isOpen={showDepositModal}
        onClose={() => setShowDepositModal(false)}
        onSubmit={handleSubmitDeposit}
        isLoading={submittingDeposit}
      />

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