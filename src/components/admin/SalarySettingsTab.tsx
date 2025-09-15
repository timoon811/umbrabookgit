"use client";

import { useState, useEffect } from 'react';
import { useNotificationContext } from '@/providers/NotificationProvider';
import { 
  Edit,
  X,
  AlertCircle,
  Settings,
  Plus,
  Grid,
  Target,
  Percent
} from 'lucide-react';
import GoalModal from './GoalModal';

interface SalarySettings {
  id: string | null;
  name: string;
  description?: string;
  hourlyRate: number;
  isActive: boolean;
}

interface BonusGrid {
  id: string;
  minAmount: number;
  maxAmount?: number | null;
  bonusPercentage: number;
  fixedBonus?: number | null;
  fixedBonusMin?: number | null;
  description?: string;
}

interface MonthlyBonus {
  id: string;
  name: string;
  description?: string;
  minAmount: number;
  bonusPercent: number;
  value?: number; // для совместимости с API
  conditions?: string; // для совместимости с API
  isActive: boolean;
}

interface PlatformCommission {
  id: string | null;
  name: string;
  description?: string;
  commissionPercent: number;
  isActive: boolean;
}

interface GoalType {
  id: string;
  name: string;
  description?: string;
  unit: string;
  type: string;
  isActive: boolean;
}

interface GoalStage {
  id?: string;
  stage: number;
  targetValue: number;
  rewardAmount: number;
  title: string;
  description?: string;
  isActive?: boolean;
}

interface UserGoal {
  id: string;
  name: string;
  description?: string;
  goalTypeId: string;
  goalTypeName: string;
  goalTypeUnit: string;
  goalTypeType: string;
  periodType: string;
  isActive: boolean;
  stages: GoalStage[];
  createdAt: string;
  updatedAt: string;
}

export default function SalarySettingsTab() {
  const { showSuccess, showError, showWarning } = useNotificationContext();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Основные настройки
  const [salarySettings, setSalarySettings] = useState<SalarySettings>({
    id: null,
    name: "Настройки зарплаты",
    description: "",
    hourlyRate: 2.0,
    isActive: true,
  });

  const [error, setError] = useState<string | null>(null);
  
  // Модальное окно редактирования настроек
  const [showEditSettingsModal, setShowEditSettingsModal] = useState(false);

  // Настройки бонусной сетки
  const [bonusGrid, setBonusGrid] = useState<BonusGrid[]>([]);
  const [editingBonusGrid, setEditingBonusGrid] = useState<BonusGrid | null>(null);
  const [showBonusGridModal, setShowBonusGridModal] = useState(false);
  
  // Настройки месячных бонусов
  const [monthlyBonuses, setMonthlyBonuses] = useState<MonthlyBonus[]>([]);
  const [editingMonthlyBonus, setEditingMonthlyBonus] = useState<MonthlyBonus | null>(null);
  const [showMonthlyBonusModal, setShowMonthlyBonusModal] = useState(false);

  // Настройки комиссии платформы
  const [platformCommission, setPlatformCommission] = useState<PlatformCommission>({
    id: null,
    name: "Комиссия платформы",
    description: "Процент комиссии, который забирает платформа с депозитов",
    commissionPercent: 5.0,
    isActive: true,
  });
  const [showCommissionModal, setShowCommissionModal] = useState(false);

  // Настройки планов/целей
  const [goalTypes, setGoalTypes] = useState<GoalType[]>([]);
  const [userGoals, setUserGoals] = useState<UserGoal[]>([]);
  const [editingGoal, setEditingGoal] = useState<UserGoal | null>(null);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [activeGoalsTab, setActiveGoalsTab] = useState('list');

  useEffect(() => {
    loadSalarySettings();
  }, []);

  // Отдельный useEffect для загрузки комиссии платформы
  useEffect(() => {
    loadPlatformCommission();
  }, []);

  const loadPlatformCommission = async () => {
    try {
      console.log('Загружаем настройки комиссии платформы...'); // Отладка
      const commissionResponse = await fetch('/api/admin/platform-commission', {
        credentials: 'include',
      });

      if (commissionResponse.ok) {
        const commissionData = await commissionResponse.json();
        console.log('Загружены настройки комиссии:', commissionData); // Отладка
        if (commissionData.commission) {
          setPlatformCommission(commissionData.commission);
          console.log('Установлены настройки комиссии в состояние:', commissionData.commission); // Отладка
        }
      } else {
        console.error('Ошибка загрузки настроек комиссии:', commissionResponse.status, commissionResponse.statusText);
      }
    } catch (error) {
      console.error('Ошибка загрузки настроек комиссии:', error);
    }
  };

  const loadSalarySettings = async () => {
    try {
      setLoading(true);
      setError(null);

      // Используем credentials для отправки cookies автоматически
      // Загружаем основные настройки
      const salaryResponse = await fetch('/api/admin/salary-settings', {
        credentials: 'include',
      });

      if (salaryResponse.ok) {
        const salaryData = await salaryResponse.json();
        console.log('Загружены настройки зарплаты:', salaryData.salarySettings); // Отладка
        setSalarySettings(salaryData.salarySettings);
        console.log('Установлены настройки зарплаты в состояние:', salaryData.salarySettings); // Отладка
        
        // Загружаем месячные бонусы из правильного источника
        console.log('Загружены месячные бонусы:', salaryData.monthlyBonuses);
        setMonthlyBonuses(salaryData.monthlyBonuses || []);
      } else {
        console.error('Ошибка загрузки настроек зарплаты:', salaryResponse.status, salaryResponse.statusText);
      }

      // Загружаем настройки бонусов
      const bonusResponse = await fetch('/api/admin/bonus-settings', {
        credentials: 'include',
      });

      if (bonusResponse.ok) {
        const bonusData = await bonusResponse.json();
        console.log('Загружены данные бонусов:', bonusData);
        setBonusGrid(bonusData.bonusGrids || []);
      } else {
        console.error('Ошибка загрузки бонусов:', bonusResponse.status, bonusResponse.statusText);
      }

      // Загружаем планы/цели
      const goalsResponse = await fetch('/api/admin/goals', {
        credentials: 'include',
      });

      if (goalsResponse.ok) {
        const goalsData = await goalsResponse.json();
        console.log('Загружены планы:', goalsData);
        setGoalTypes(goalsData.goalTypes || []);
        setUserGoals(goalsData.goals || []);
      } else {
        console.error('Ошибка загрузки планов:', goalsResponse.status, goalsResponse.statusText);
      }

      // Настройки комиссии платформы загружаются в отдельном useEffect

    } catch (error) {
      setError('Ошибка сети');
      showError('Ошибка сети', 'Проблема с подключением к серверу', 'ЗП');
      console.error('Ошибка загрузки настроек ЗП:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSalarySettings = async () => {
    try {
      setSaving(true);
      setError(null);

      const url = salarySettings.id ? '/api/admin/salary-settings' : '/api/admin/salary-settings';
      const method = salarySettings.id ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(salarySettings),
      });

      if (response.ok) {
        const data = await response.json();
        setSalarySettings(data);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Ошибка сохранения настроек');
      }
    } catch (error) {
      setError('Ошибка сети');
      console.error('Ошибка сохранения настроек ЗП:', error);
    } finally {
      setSaving(false);
    }
  };

  const saveSalarySettingsWithData = async (settingsData: SalarySettings) => {
    try {
      setSaving(true);
      setError(null);

      const url = settingsData.id ? '/api/admin/salary-settings' : '/api/admin/salary-settings';
      const method = settingsData.id ? 'PUT' : 'POST';

      console.log('Отправляем настройки зарплаты:', settingsData); // Отладка

      const response = await fetch(url, {
        method,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settingsData),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Получили ответ от сервера (зарплата):', data); // Отладка
        setSalarySettings(data);
        console.log('Обновили состояние настроек зарплаты:', data); // Отладка
        showSuccess('Настройки зарплаты сохранены', 'Настройки успешно обновлены', 'ЗП');
        // Перезагружаем настройки для подтверждения
        setTimeout(() => {
          loadSalarySettings();
        }, 100);
      } else {
        const errorData = await response.json();
        console.error('Ошибка API (зарплата):', errorData); // Отладка
        setError(errorData.error || 'Ошибка сохранения настроек');
        showError('Ошибка сохранения', errorData.error || 'Не удалось сохранить настройки зарплаты', 'ЗП');
      }
    } catch (error) {
      console.error('Ошибка сети при сохранении зарплаты:', error); // Отладка
      setError('Ошибка сети');
      showError('Ошибка сети', 'Проблема с подключением к серверу', 'ЗП');
    } finally {
      setSaving(false);
    }
  };

  const saveBonusGrid = async (bonusGridEntry: Partial<BonusGrid>) => {
    try {
      setSaving(true);
      const method = bonusGridEntry.id ? 'PUT' : 'POST';
      
      const response = await fetch('/api/admin/bonus-settings', {
        method,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'bonusGrid',
          id: bonusGridEntry.id,
          settings: bonusGridEntry.id ? undefined : {
            ...bonusGridEntry,
            shiftType: 'MORNING' // Используем единую сетку для всех смен
          },
          updates: bonusGridEntry.id ? {
            ...bonusGridEntry,
            shiftType: 'MORNING' // Используем единую сетку для всех смен
          } : undefined,
        }),
      });

      if (response.ok) {
        await loadSalarySettings();
        setShowBonusGridModal(false);
        setEditingBonusGrid(null);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Ошибка сохранения настроек бонусной сетки');
      }
    } catch (error) {
      setError('Ошибка сети');
      console.error('Ошибка сохранения настроек бонусной сетки:', error);
    } finally {
      setSaving(false);
    }
  };

  const saveMonthlyBonus = async (monthlyBonusEntry: Partial<MonthlyBonus>) => {
    try {
      setSaving(true);
      const method = monthlyBonusEntry.id ? 'PUT' : 'POST';
      
      const url = monthlyBonusEntry.id 
        ? `/api/admin/salary-monthly-bonus?id=${monthlyBonusEntry.id}`
        : '/api/admin/salary-monthly-bonus';
      
      const response = await fetch(url, {
        method,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: monthlyBonusEntry.name,
          description: monthlyBonusEntry.description,
          minAmount: monthlyBonusEntry.minAmount,
          bonusPercent: monthlyBonusEntry.bonusPercent,
          isActive: monthlyBonusEntry.isActive
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Результат создания месячного бонуса:', result);
        showSuccess('Месячный бонус сохранен', 'Настройки успешно обновлены', 'ЗП');
        await loadSalarySettings();
        setShowMonthlyBonusModal(false);
        setEditingMonthlyBonus(null);
      } else {
        const errorData = await response.json();
        console.error('Ошибка создания месячного бонуса:', errorData);
        setError(errorData.error || 'Ошибка сохранения настроек месячного бонуса');
        showError('Ошибка сохранения', errorData.error || 'Не удалось сохранить настройки месячного бонуса', 'ЗП');
      }
    } catch (error) {
      setError('Ошибка сети');
      console.error('Ошибка сохранения настроек месячного бонуса:', error);
    } finally {
      setSaving(false);
    }
  };

  const deleteBonusGrid = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/bonus-settings?type=bonusGrid&id=${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        await loadSalarySettings();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Ошибка удаления настроек бонусной сетки');
      }
    } catch (error) {
      setError('Ошибка сети');
      console.error('Ошибка удаления настроек бонусной сетки:', error);
    }
  };

  const deleteMonthlyBonus = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/salary-monthly-bonus?id=${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        showSuccess('Месячный бонус удален', 'Настройки успешно обновлены', 'ЗП');
        await loadSalarySettings();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Ошибка удаления настроек месячного бонуса');
        showError('Ошибка удаления', errorData.error || 'Не удалось удалить месячный бонус', 'ЗП');
      }
    } catch (error) {
      setError('Ошибка сети');
      console.error('Ошибка удаления настроек месячного бонуса:', error);
      showError('Ошибка сети', 'Проблема с подключением к серверу', 'ЗП');
    }
  };

  const savePlatformCommission = async () => {
    try {
      setSaving(true);
      setError(null);

      const url = platformCommission.id ? '/api/admin/platform-commission' : '/api/admin/platform-commission';
      const method = platformCommission.id ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(platformCommission),
      });

      if (response.ok) {
        const data = await response.json();
        setPlatformCommission(data.commission);
        showSuccess('Настройки комиссии сохранены', 'Настройки успешно обновлены', 'ЗП');
        setShowCommissionModal(false);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Ошибка сохранения настроек комиссии');
        showError('Ошибка сохранения', errorData.error || 'Не удалось сохранить настройки комиссии', 'ЗП');
      }
    } catch (error) {
      setError('Ошибка сети');
      showError('Ошибка сети', 'Проблема с подключением к серверу', 'ЗП');
      console.error('Ошибка сохранения настроек комиссии:', error);
    } finally {
      setSaving(false);
    }
  };

  const deleteGoal = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/goals/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        showSuccess('План удален', 'План успешно удален', 'Планы');
        await loadSalarySettings();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Ошибка удаления плана');
        showError('Ошибка удаления', errorData.error || 'Не удалось удалить план', 'Планы');
      }
    } catch (error) {
      setError('Ошибка сети');
      console.error('Ошибка удаления плана:', error);
      showError('Ошибка сети', 'Проблема с подключением к серверу', 'Планы');
    }
  };

  const saveGoal = async (goalData: any) => {
    try {
      setSaving(true);
      setError(null);

      const method = editingGoal ? 'PUT' : 'POST';
      const url = editingGoal ? `/api/admin/goals/${editingGoal.id}` : '/api/admin/goals';

      const response = await fetch(url, {
        method,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(goalData),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Результат сохранения плана:', result);
        showSuccess(
          editingGoal ? 'План обновлен' : 'План создан',
          editingGoal ? 'План успешно обновлен' : 'План успешно создан',
          'Планы'
        );
        await loadSalarySettings();
        setShowGoalModal(false);
        setEditingGoal(null);
      } else {
        const errorData = await response.json();
        console.error('Ошибка сохранения плана:', errorData);
        setError(errorData.error || 'Ошибка сохранения плана');
        showError('Ошибка сохранения', errorData.error || 'Не удалось сохранить план', 'Планы');
      }
    } catch (error) {
      setError('Ошибка сети');
      console.error('Ошибка сохранения плана:', error);
      showError('Ошибка сети', 'Проблема с подключением к серверу', 'Планы');
    } finally {
      setSaving(false);
    }
  };

  const savePlatformCommissionWithData = async (commissionData: PlatformCommission) => {
    try {
      setSaving(true);
      setError(null);

      const url = commissionData.id ? '/api/admin/platform-commission' : '/api/admin/platform-commission';
      const method = commissionData.id ? 'PUT' : 'POST';

      console.log('Отправляем данные комиссии:', commissionData); // Отладка

      const response = await fetch(url, {
        method,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(commissionData),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Получили ответ от сервера:', data); // Отладка
        setPlatformCommission(data.commission);
        console.log('Обновили состояние комиссии после сохранения:', data.commission); // Отладка
        showSuccess('Настройки комиссии сохранены', 'Настройки успешно обновлены', 'ЗП');
        setShowCommissionModal(false);
        // Перезагружаем настройки для подтверждения
        setTimeout(() => {
          loadPlatformCommission();
        }, 100);
      } else {
        const errorData = await response.json();
        console.error('Ошибка API:', errorData); // Отладка
        setError(errorData.error || 'Ошибка сохранения настроек комиссии');
        showError('Ошибка сохранения', errorData.error || 'Не удалось сохранить настройки комиссии', 'ЗП');
      }
    } catch (error) {
      console.error('Ошибка сети при сохранении комиссии:', error); // Отладка
      setError('Ошибка сети');
      showError('Ошибка сети', 'Проблема с подключением к серверу', 'ЗП');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-400 mr-3" />
            <span className="text-red-800 dark:text-red-200">{error}</span>
          </div>
        </div>
      )}

      {/* Компактная карточка основных настроек */}
      <div className="bg-white dark:bg-[#0a0a0a] rounded-lg border border-[#171717]/5 dark:border-[#ededed]/10 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Settings className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h4 className="text-lg font-semibold text-[#171717] dark:text-[#ededed]">
                {salarySettings.name}
              </h4>
              <p className="text-sm text-[#171717]/60 dark:text-[#ededed]/60">
                {salarySettings.description || 'Базовые настройки зарплатной системы'}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  ${salarySettings.hourlyRate}
                </span>
                <span className="text-sm text-[#171717]/60 dark:text-[#ededed]/60">
                  за час
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={() => setShowEditSettingsModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Edit className="w-4 h-4" />
            Редактировать
          </button>
        </div>
      </div>

      {/* Секция бонусной сетки */}
      <div className="bg-white dark:bg-[#0a0a0a] rounded-lg border border-[#171717]/5 dark:border-[#ededed]/10 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <Grid className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h4 className="text-lg font-semibold text-[#171717] dark:text-[#ededed]">
                Настройки бонусной сетки
              </h4>
              <p className="text-sm text-[#171717]/60 dark:text-[#ededed]/60">
                Единая бонусная сетка за депозиты по суммам
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setEditingBonusGrid(null);
              setShowBonusGridModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Добавить
          </button>
        </div>

        {bonusGrid.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#171717]/5 dark:border-[#ededed]/10">
                  <th className="text-left py-2 px-3 text-[#171717]/70 dark:text-[#ededed]/70 font-medium">Сумма ($)</th>
                  <th className="text-left py-2 px-3 text-[#171717]/70 dark:text-[#ededed]/70 font-medium">Процент</th>
                  <th className="text-left py-2 px-3 text-[#171717]/70 dark:text-[#ededed]/70 font-medium">Фикс. бонус</th>
                  <th className="text-right py-2 px-3 text-[#171717]/70 dark:text-[#ededed]/70 font-medium">Действия</th>
                </tr>
              </thead>
              <tbody>
                {bonusGrid.map((entry) => (
                  <tr key={entry.id} className="border-b border-[#171717]/5 dark:border-[#ededed]/10 hover:bg-[#171717]/2 dark:hover:bg-[#ededed]/5 transition-colors">
                    <td className="py-2 px-3 text-[#171717] dark:text-[#ededed]">
                      {entry.minAmount}
                      {entry.maxAmount ? ` - ${entry.maxAmount}` : '+'}
                    </td>
                    <td className="py-2 px-3 text-[#171717] dark:text-[#ededed]">
                      {entry.bonusPercentage}%
                    </td>
                    <td className="py-2 px-3 text-[#171717] dark:text-[#ededed]">
                      {entry.fixedBonus ? `$${entry.fixedBonus}` : '-'}
                    </td>
                    <td className="py-2 px-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setEditingBonusGrid(entry);
                            setShowBonusGridModal(true);
                          }}
                          className="p-1 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteBonusGrid(entry.id)}
                          className="p-1 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8">
            <Grid className="w-12 h-12 text-[#171717]/20 dark:text-[#ededed]/20 mx-auto mb-3" />
            <p className="text-[#171717]/60 dark:text-[#ededed]/60 text-sm">
              Нет настроенных правил бонусной сетки
            </p>
          </div>
        )}
      </div>

      {/* Секция настройки комиссии платформы */}
      <div className="bg-white dark:bg-[#0a0a0a] rounded-lg border border-[#171717]/5 dark:border-[#ededed]/10 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <Percent className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <h4 className="text-lg font-semibold text-[#171717] dark:text-[#ededed]">
                {platformCommission.name}
              </h4>
              <p className="text-sm text-[#171717]/60 dark:text-[#ededed]/60">
                {platformCommission.description || 'Настройка комиссии платформы с депозитов'}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {platformCommission.commissionPercent}%
                </span>
                <span className="text-sm text-[#171717]/60 dark:text-[#ededed]/60">
                  комиссия платформы
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={() => setShowCommissionModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
          >
            <Edit className="w-4 h-4" />
            Редактировать
          </button>
        </div>
      </div>

      {/* Секция месячных бонусов */}
      <div className="bg-white dark:bg-[#0a0a0a] rounded-lg border border-[#171717]/5 dark:border-[#ededed]/10 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Target className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h4 className="text-lg font-semibold text-[#171717] dark:text-[#ededed]">
                Месячные бонусы за план
              </h4>
              <p className="text-sm text-[#171717]/60 dark:text-[#ededed]/60">
                Мотивационные бонусы при выполнении плана
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setEditingMonthlyBonus(null);
              setShowMonthlyBonusModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Добавить
          </button>
        </div>

        {monthlyBonuses.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#171717]/5 dark:border-[#ededed]/10">
                  <th className="text-left py-2 px-3 text-[#171717]/70 dark:text-[#ededed]/70 font-medium">Название</th>
                  <th className="text-left py-2 px-3 text-[#171717]/70 dark:text-[#ededed]/70 font-medium">План ($)</th>
                  <th className="text-left py-2 px-3 text-[#171717]/70 dark:text-[#ededed]/70 font-medium">Бонус (%)</th>
                  <th className="text-left py-2 px-3 text-[#171717]/70 dark:text-[#ededed]/70 font-medium">Статус</th>
                  <th className="text-right py-2 px-3 text-[#171717]/70 dark:text-[#ededed]/70 font-medium">Действия</th>
                </tr>
              </thead>
              <tbody>
                {monthlyBonuses.map((bonus) => (
                  <tr key={bonus.id} className="border-b border-[#171717]/5 dark:border-[#ededed]/10 hover:bg-[#171717]/2 dark:hover:bg-[#ededed]/5 transition-colors">
                    <td className="py-2 px-3">
                      <div>
                        <div className="font-medium text-[#171717] dark:text-[#ededed]">{bonus.name}</div>
                        {bonus.description && (
                          <div className="text-xs text-[#171717]/60 dark:text-[#ededed]/60">{bonus.description}</div>
                        )}
                      </div>
                    </td>
                    <td className="py-2 px-3 text-[#171717] dark:text-[#ededed]">
                      ${(() => {
                        try {
                          const conditions = typeof bonus.conditions === 'string' ? JSON.parse(bonus.conditions) : bonus.conditions;
                          return conditions?.minAmount || bonus.minAmount || 0;
                        } catch {
                          return bonus.minAmount || 0;
                        }
                      })()}
                    </td>
                    <td className="py-2 px-3 text-[#171717] dark:text-[#ededed]">
                      +{bonus.value || bonus.bonusPercent || 0}%
                    </td>
                    <td className="py-2 px-3">
                      <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                        bonus.isActive 
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                          : 'bg-gray-100 dark:bg-gray-900/30 text-gray-600 dark:text-gray-400'
                      }`}>
                        {bonus.isActive ? 'Активен' : 'Неактивен'}
                      </span>
                    </td>
                    <td className="py-2 px-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setEditingMonthlyBonus(bonus);
                            setShowMonthlyBonusModal(true);
                          }}
                          className="p-1 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteMonthlyBonus(bonus.id)}
                          className="p-1 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8">
            <Target className="w-12 h-12 text-[#171717]/20 dark:text-[#ededed]/20 mx-auto mb-3" />
            <p className="text-[#171717]/60 dark:text-[#ededed]/60 text-sm">
              Нет настроенных месячных бонусов
            </p>
          </div>
        )}
      </div>

      {/* Планы/Цели пользователей */}
      <div className="bg-white dark:bg-[#0a0a0a] rounded-xl border border-[#171717]/10 dark:border-[#ededed]/20 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
              <Target className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h4 className="text-lg font-semibold text-[#171717] dark:text-[#ededed]">
                Планы и цели пользователей
              </h4>
              <p className="text-sm text-[#171717]/60 dark:text-[#ededed]/60">
                Многоэтапные планы с фиксированными бонусами за достижения
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setEditingGoal(null);
              setShowGoalModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Создать план
          </button>
        </div>

        {userGoals.length > 0 ? (
          <div className="space-y-6">
            {userGoals.map((goal) => (
              <div key={goal.id} className="border border-[#171717]/10 dark:border-[#ededed]/20 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h5 className="font-medium text-[#171717] dark:text-[#ededed]">
                      {goal.name}
                    </h5>
                    <p className="text-sm text-[#171717]/60 dark:text-[#ededed]/60 mt-1">
                      {goal.goalTypeName} • {goal.periodType === 'DAILY' ? 'Ежедневно' : goal.periodType === 'WEEKLY' ? 'Еженедельно' : 'Ежемесячно'}
                    </p>
                    {goal.description && (
                      <p className="text-xs text-[#171717]/50 dark:text-[#ededed]/50 mt-1">
                        {goal.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setEditingGoal(goal);
                        setShowGoalModal(true);
                      }}
                      className="p-1 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteGoal(goal.id)}
                      className="p-1 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Этапы плана */}
                <div className="space-y-2">
                  <h6 className="text-sm font-medium text-[#171717] dark:text-[#ededed] mb-2">
                    Этапы ({goal.stages.length}):
                  </h6>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {goal.stages
                      .sort((a, b) => a.stage - b.stage)
                      .map((stage) => (
                        <div
                          key={stage.id}
                          className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg p-3"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400">
                              Этап {stage.stage}
                            </span>
                            <span className="text-xs font-bold text-green-600 dark:text-green-400">
                              +${stage.rewardAmount}
                            </span>
                          </div>
                          <p className="text-sm font-medium text-[#171717] dark:text-[#ededed]">
                            {stage.title}
                          </p>
                          <p className="text-xs text-[#171717]/60 dark:text-[#ededed]/60">
                            {stage.targetValue}{goal.goalTypeUnit}
                          </p>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Target className="w-12 h-12 text-[#171717]/20 dark:text-[#ededed]/20 mx-auto mb-3" />
            <p className="text-[#171717]/60 dark:text-[#ededed]/60 text-sm mb-4">
              Нет настроенных планов
            </p>
            <button
              onClick={() => {
                setEditingGoal(null);
                setShowGoalModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors mx-auto"
            >
              <Plus className="w-4 h-4" />
              Создать первый план
            </button>
          </div>
        )}
      </div>

      {/* Модальное окно редактирования базовых настроек */}
      {showEditSettingsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-[#0a0a0a] rounded-xl border border-[#171717]/10 dark:border-[#ededed]/20 p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Settings className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold text-[#171717] dark:text-[#ededed]">
                  Редактировать настройки
                </h3>
              </div>
              <button
                onClick={() => setShowEditSettingsModal(false)}
                className="p-1.5 text-[#171717]/60 dark:text-[#ededed]/60 hover:text-[#171717] dark:hover:text-[#ededed] hover:bg-[#171717]/5 dark:hover:bg-[#ededed]/10 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const updatedSettings = {
                ...salarySettings,
                name: formData.get('name') as string,
                description: formData.get('description') as string || '',
                hourlyRate: parseFloat(formData.get('hourlyRate') as string) || 0,
              };
              setSalarySettings(updatedSettings);
              saveSalarySettingsWithData(updatedSettings);
              setShowEditSettingsModal(false);
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#171717]/70 dark:text-[#ededed]/70 mb-2">
                    Название настроек
                  </label>
                  <input
                    type="text"
                    name="name"
                    defaultValue={salarySettings.name}
                    className="w-full px-3 py-2 border border-[#171717]/10 dark:border-[#ededed]/20 rounded-lg bg-white dark:bg-gray-800 text-[#171717] dark:text-[#ededed] focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Название настроек"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-[#171717]/70 dark:text-[#ededed]/70 mb-2">
                    Ставка за час ($)
                  </label>
                  <input
                    type="number"
                    name="hourlyRate"
                    step="0.01"
                    min="0"
                    defaultValue={salarySettings.hourlyRate}
                    className="w-full px-3 py-2 border border-[#171717]/10 dark:border-[#ededed]/20 rounded-lg bg-white dark:bg-gray-800 text-[#171717] dark:text-[#ededed] focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="2.00"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#171717]/70 dark:text-[#ededed]/70 mb-2">
                    Описание
                  </label>
                  <textarea
                    name="description"
                    rows={3}
                    defaultValue={salarySettings.description || ''}
                    className="w-full px-3 py-2 border border-[#171717]/10 dark:border-[#ededed]/20 rounded-lg bg-white dark:bg-gray-800 text-[#171717] dark:text-[#ededed] focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Описание настроек зарплатной системы"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6 pt-4 border-t border-[#171717]/5 dark:border-[#ededed]/10">
                <button
                  type="button"
                  onClick={() => setShowEditSettingsModal(false)}
                  className="flex-1 px-4 py-2 text-[#171717]/60 dark:text-[#ededed]/60 bg-[#171717]/5 dark:bg-[#ededed]/10 hover:bg-[#171717]/10 dark:hover:bg-[#ededed]/20 rounded-lg transition-colors"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 rounded-lg transition-colors font-medium"
                >
                  {saving ? 'Сохранение...' : 'Сохранить'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Модальное окно бонусной сетки */}
      {showBonusGridModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-[#0a0a0a] rounded-xl border border-[#171717]/10 dark:border-[#ededed]/20 p-6 w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <Grid className="w-4 h-4 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-lg font-semibold text-[#171717] dark:text-[#ededed]">
                  {editingBonusGrid ? 'Редактировать правило' : 'Новое правило бонусной сетки'}
                </h3>
              </div>
              <button
                onClick={() => setShowBonusGridModal(false)}
                className="p-1.5 text-[#171717]/60 dark:text-[#ededed]/60 hover:text-[#171717] dark:hover:text-[#ededed] hover:bg-[#171717]/5 dark:hover:bg-[#ededed]/10 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              saveBonusGrid({
                id: editingBonusGrid?.id,
                minAmount: parseFloat(formData.get('minAmount') as string),
                maxAmount: formData.get('maxAmount') ? parseFloat(formData.get('maxAmount') as string) : null,
                bonusPercentage: parseFloat(formData.get('bonusPercentage') as string),
                fixedBonus: formData.get('fixedBonus') ? parseFloat(formData.get('fixedBonus') as string) : null,
                fixedBonusMin: formData.get('fixedBonusMin') ? parseFloat(formData.get('fixedBonusMin') as string) : null,
                description: formData.get('description') as string || undefined,
              });
            }}>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#171717]/70 dark:text-[#ededed]/70 mb-2">
                      Мин. сумма ($)
                    </label>
                    <input
                      type="number"
                      name="minAmount"
                      step="1"
                      min="0"
                      defaultValue={editingBonusGrid?.minAmount || ''}
                      className="w-full px-3 py-2 border border-[#171717]/10 dark:border-[#ededed]/20 rounded-lg bg-white dark:bg-gray-800 text-[#171717] dark:text-[#ededed] focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="100"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#171717]/70 dark:text-[#ededed]/70 mb-2">
                      Макс. сумма ($)
                    </label>
                    <input
                      type="number"
                      name="maxAmount"
                      step="1"
                      min="0"
                      defaultValue={editingBonusGrid?.maxAmount || ''}
                      className="w-full px-3 py-2 border border-[#171717]/10 dark:border-[#ededed]/20 rounded-lg bg-white dark:bg-gray-800 text-[#171717] dark:text-[#ededed] focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="Оставьте пустым для 'от суммы и выше'"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-[#171717]/70 dark:text-[#ededed]/70 mb-2">
                    Процент бонуса (%)
                  </label>
                  <input
                    type="number"
                    name="bonusPercentage"
                    step="0.1"
                    min="0"
                    max="100"
                    defaultValue={editingBonusGrid?.bonusPercentage || ''}
                    className="w-full px-3 py-2 border border-[#171717]/10 dark:border-[#ededed]/20 rounded-lg bg-white dark:bg-gray-800 text-[#171717] dark:text-[#ededed] focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="5.0"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#171717]/70 dark:text-[#ededed]/70 mb-2">
                      Фикс. бонус ($)
                    </label>
                    <input
                      type="number"
                      name="fixedBonus"
                      step="0.01"
                      min="0"
                      defaultValue={editingBonusGrid?.fixedBonus || ''}
                      className="w-full px-3 py-2 border border-[#171717]/10 dark:border-[#ededed]/20 rounded-lg bg-white dark:bg-gray-800 text-[#171717] dark:text-[#ededed] focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="Опционально"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#171717]/70 dark:text-[#ededed]/70 mb-2">
                      Мин. для фикс. бонуса ($)
                    </label>
                    <input
                      type="number"
                      name="fixedBonusMin"
                      step="0.01"
                      min="0"
                      defaultValue={editingBonusGrid?.fixedBonusMin || ''}
                      className="w-full px-3 py-2 border border-[#171717]/10 dark:border-[#ededed]/20 rounded-lg bg-white dark:bg-gray-800 text-[#171717] dark:text-[#ededed] focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="Опционально"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#171717]/70 dark:text-[#ededed]/70 mb-2">
                    Описание
                  </label>
                  <input
                    type="text"
                    name="description"
                    defaultValue={editingBonusGrid?.description || ''}
                    className="w-full px-3 py-2 border border-[#171717]/10 dark:border-[#ededed]/20 rounded-lg bg-white dark:bg-gray-800 text-[#171717] dark:text-[#ededed] focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="Описание правила"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6 pt-4 border-t border-[#171717]/5 dark:border-[#ededed]/10">
                <button
                  type="button"
                  onClick={() => setShowBonusGridModal(false)}
                  className="flex-1 px-4 py-2 text-[#171717]/60 dark:text-[#ededed]/60 bg-[#171717]/5 dark:bg-[#ededed]/10 hover:bg-[#171717]/10 dark:hover:bg-[#ededed]/20 rounded-lg transition-colors"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 rounded-lg transition-colors font-medium"
                >
                  {saving ? 'Сохранение...' : (editingBonusGrid ? 'Сохранить' : 'Добавить')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Модальное окно месячных бонусов */}
      {showMonthlyBonusModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-[#0a0a0a] rounded-xl border border-[#171717]/10 dark:border-[#ededed]/20 p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <Target className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-lg font-semibold text-[#171717] dark:text-[#ededed]">
                  {editingMonthlyBonus ? 'Редактировать бонус' : 'Новый месячный бонус'}
                </h3>
              </div>
              <button
                onClick={() => setShowMonthlyBonusModal(false)}
                className="p-1.5 text-[#171717]/60 dark:text-[#ededed]/60 hover:text-[#171717] dark:hover:text-[#ededed] hover:bg-[#171717]/5 dark:hover:bg-[#ededed]/10 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              saveMonthlyBonus({
                id: editingMonthlyBonus?.id,
                name: formData.get('name') as string,
                description: formData.get('description') as string || undefined,
                minAmount: parseFloat(formData.get('minAmount') as string),
                bonusPercent: parseFloat(formData.get('bonusPercent') as string),
                isActive: true,
              });
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#171717]/70 dark:text-[#ededed]/70 mb-2">
                    Название бонуса
                  </label>
                  <input
                    type="text"
                    name="name"
                    defaultValue={editingMonthlyBonus?.name || ''}
                    className="w-full px-3 py-2 border border-[#171717]/10 dark:border-[#ededed]/20 rounded-lg bg-white dark:bg-gray-800 text-[#171717] dark:text-[#ededed] focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    placeholder="Название месячного бонуса"
                    required
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#171717]/70 dark:text-[#ededed]/70 mb-2">
                      План за месяц ($)
                    </label>
                    <input
                      type="number"
                      name="minAmount"
                      step="1"
                      min="0"
                      defaultValue={(() => {
                        if (!editingMonthlyBonus) return '';
                        try {
                          const conditions = typeof editingMonthlyBonus.conditions === 'string' 
                            ? JSON.parse(editingMonthlyBonus.conditions) 
                            : editingMonthlyBonus.conditions;
                          return conditions?.minAmount || editingMonthlyBonus.minAmount || '';
                        } catch {
                          return editingMonthlyBonus.minAmount || '';
                        }
                      })()}
                      className="w-full px-3 py-2 border border-[#171717]/10 dark:border-[#ededed]/20 rounded-lg bg-white dark:bg-gray-800 text-[#171717] dark:text-[#ededed] focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      placeholder="5000"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#171717]/70 dark:text-[#ededed]/70 mb-2">
                      Бонус (%)
                    </label>
                    <input
                      type="number"
                      name="bonusPercent"
                      step="0.1"
                      min="0"
                      max="100"
                      defaultValue={editingMonthlyBonus?.value || editingMonthlyBonus?.bonusPercent || ''}
                      className="w-full px-3 py-2 border border-[#171717]/10 dark:border-[#ededed]/20 rounded-lg bg-white dark:bg-gray-800 text-[#171717] dark:text-[#ededed] focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      placeholder="10.0"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#171717]/70 dark:text-[#ededed]/70 mb-2">
                    Описание
                  </label>
                  <textarea
                    name="description"
                    rows={3}
                    defaultValue={editingMonthlyBonus?.description || ''}
                    className="w-full px-3 py-2 border border-[#171717]/10 dark:border-[#ededed]/20 rounded-lg bg-white dark:bg-gray-800 text-[#171717] dark:text-[#ededed] focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    placeholder="Описание условий получения бонуса"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6 pt-4 border-t border-[#171717]/5 dark:border-[#ededed]/10">
                <button
                  type="button"
                  onClick={() => setShowMonthlyBonusModal(false)}
                  className="flex-1 px-4 py-2 text-[#171717]/60 dark:text-[#ededed]/60 bg-[#171717]/5 dark:bg-[#ededed]/10 hover:bg-[#171717]/10 dark:hover:bg-[#ededed]/20 rounded-lg transition-colors"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50 rounded-lg transition-colors font-medium"
                >
                  {saving ? 'Сохранение...' : (editingMonthlyBonus ? 'Сохранить' : 'Добавить')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Модальное окно настройки комиссии платформы */}
      {showCommissionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-[#0a0a0a] rounded-xl border border-[#171717]/10 dark:border-[#ededed]/20 p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                  <Percent className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                </div>
                <h3 className="text-lg font-semibold text-[#171717] dark:text-[#ededed]">
                  Настройка комиссии платформы
                </h3>
              </div>
              <button
                onClick={() => setShowCommissionModal(false)}
                className="p-1.5 text-[#171717]/60 dark:text-[#ededed]/60 hover:text-[#171717] dark:hover:text-[#ededed] hover:bg-[#171717]/5 dark:hover:bg-[#ededed]/10 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const updatedCommission = {
                id: platformCommission.id, // Явно сохраняем ID
                name: formData.get('name') as string,
                description: formData.get('description') as string || '',
                commissionPercent: parseFloat(formData.get('commissionPercent') as string) || 0,
                isActive: platformCommission.isActive // Явно сохраняем isActive
              };
              setPlatformCommission(updatedCommission);
              savePlatformCommissionWithData(updatedCommission);
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#171717]/70 dark:text-[#ededed]/70 mb-2">
                    Название настройки
                  </label>
                  <input
                    type="text"
                    name="name"
                    defaultValue={platformCommission.name}
                    className="w-full px-3 py-2 border border-[#171717]/10 dark:border-[#ededed]/20 rounded-lg bg-white dark:bg-gray-800 text-[#171717] dark:text-[#ededed] focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="Название настройки"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-[#171717]/70 dark:text-[#ededed]/70 mb-2">
                    Процент комиссии (%)
                  </label>
                  <input
                    type="number"
                    name="commissionPercent"
                    step="0.1"
                    min="0"
                    max="50"
                    defaultValue={platformCommission.commissionPercent}
                    className="w-full px-3 py-2 border border-[#171717]/10 dark:border-[#ededed]/20 rounded-lg bg-white dark:bg-gray-800 text-[#171717] dark:text-[#ededed] focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="5.0"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#171717]/70 dark:text-[#ededed]/70 mb-2">
                    Описание
                  </label>
                  <textarea
                    name="description"
                    rows={3}
                    defaultValue={platformCommission.description || ''}
                    className="w-full px-3 py-2 border border-[#171717]/10 dark:border-[#ededed]/20 rounded-lg bg-white dark:bg-gray-800 text-[#171717] dark:text-[#ededed] focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="Описание настройки комиссии платформы"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6 pt-4 border-t border-[#171717]/5 dark:border-[#ededed]/10">
                <button
                  type="button"
                  onClick={() => setShowCommissionModal(false)}
                  className="flex-1 px-4 py-2 text-[#171717]/60 dark:text-[#ededed]/60 bg-[#171717]/5 dark:bg-[#ededed]/10 hover:bg-[#171717]/10 dark:hover:bg-[#ededed]/20 rounded-lg transition-colors"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-orange-600 text-white hover:bg-orange-700 disabled:opacity-50 rounded-lg transition-colors font-medium"
                >
                  {saving ? 'Сохранение...' : 'Сохранить'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Модальное окно планов/целей */}
      {showGoalModal && (
        <GoalModal
          isOpen={showGoalModal}
          onClose={() => {
            setShowGoalModal(false);
            setEditingGoal(null);
          }}
          goal={editingGoal}
          goalTypes={goalTypes}
          onSave={saveGoal}
          isLoading={saving}
        />
      )}
    </div>
  );
}