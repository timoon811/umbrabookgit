import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireManagerAuth } from "@/lib/api-auth";
import {
  getCurrentUTC3Time,
  getCurrentDayStartUTC3,
  getCurrentWeekPeriod,
  getCurrentMonthPeriod
} from "@/lib/time-utils";
import { maskUserName } from "@/utils/userUtils";

export async function GET(request: NextRequest) {
  // Проверяем авторизацию
  const authResult = await requireManagerAuth(request);
  if ('error' in authResult) {
    return authResult.error;
  }

  const { user } = authResult;
  const url = new URL(request.url);
  
  // Получаем параметры периода из запроса
  const period = url.searchParams.get('period') || 'current'; // current, previous, custom
  const customStart = url.searchParams.get('startDate');
  const customEnd = url.searchParams.get('endDate');
  
  try {
    const processorId = user.userId;
    const utc3Now = getCurrentUTC3Time();
    
    // Определяем периоды в зависимости от выбора
    let todayStart, weekPeriod, monthPeriod;
    
    if (period === 'previous') {
      // Предыдущий месяц
      const lastMonth = new Date(utc3Now.getFullYear(), utc3Now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(utc3Now.getFullYear(), utc3Now.getMonth(), 0);
      monthPeriod = { start: lastMonth, end: lastMonthEnd };
      
      // Предыдущая неделя
      const lastWeekStart = new Date(utc3Now);
      lastWeekStart.setDate(utc3Now.getDate() - 7 - utc3Now.getDay());
      const lastWeekEnd = new Date(lastWeekStart);
      lastWeekEnd.setDate(lastWeekStart.getDate() + 6);
      weekPeriod = { start: lastWeekStart, end: lastWeekEnd };
      
      // Вчера
      todayStart = new Date(utc3Now);
      todayStart.setDate(utc3Now.getDate() - 1);
      todayStart.setHours(0, 0, 0, 0);
    } else if (period === 'custom' && customStart && customEnd) {
      // Кастомный период
      const startDate = new Date(customStart);
      const endDate = new Date(customEnd);
      monthPeriod = { start: startDate, end: endDate };
      weekPeriod = { start: startDate, end: endDate };
      todayStart = startDate;
    } else {
      // Текущий период (по умолчанию)
      todayStart = getCurrentDayStartUTC3();
      weekPeriod = getCurrentWeekPeriod();
      monthPeriod = getCurrentMonthPeriod();
    }

    // Получаем настройки зарплаты из админ панели
    const salarySettings = await prisma.salary_settings.findFirst({
      where: { isActive: true }
    });

    // Получаем настройки депозитной сетки (проценты от депозитов за смену)
    const depositGrid = await prisma.salary_deposit_grid.findMany({
      where: { isActive: true },
      orderBy: { minAmount: "asc" }
    });

    // Получаем месячные бонусы за план
    const monthlyBonuses = await prisma.salary_monthly_bonus.findMany({
      where: { isActive: true },
      orderBy: { minAmount: "asc" }
    });

    // Определяем месячный бонус для текущего объема депозитов
    const currentMonthVolume = monthDeposits.reduce((sum, d) => sum + d.amount, 0);
    const applicableMonthlyBonus = monthlyBonuses.find(bonus => 
      currentMonthVolume >= bonus.minAmount
    );
    
    // Определяем следующий месячный бонус (к чему стремиться)
    const nextMonthlyBonus = monthlyBonuses.find(bonus => 
      currentMonthVolume < bonus.minAmount
    );

    // Получаем бонусные настройки
    const bonusSettings = await prisma.bonus_settings.findFirst({
      where: { isActive: true }
    });

    const bonusGrids = await prisma.bonus_grid.findMany({
      where: { isActive: true },
      orderBy: { minAmount: "asc" },
      select: {
        id: true,
        minAmount: true,
        maxAmount: true,
        bonusPercentage: true,
        shiftType: true,
        description: true
      }
    });

    // Статистика за разные периоды
    const [todayDeposits, weekDeposits, monthDeposits] = await Promise.all([
      prisma.processor_deposits.findMany({
        where: { processorId, createdAt: { gte: todayStart } }
      }),
      prisma.processor_deposits.findMany({
        where: { processorId, createdAt: { gte: weekPeriod.start } }
      }),
      prisma.processor_deposits.findMany({
        where: { processorId, createdAt: { gte: monthPeriod.start } }
      })
    ]);

    // Статистика смен
    const [todayShifts, weekShifts, monthShifts] = await Promise.all([
      prisma.processor_shifts.findMany({
        where: { 
          processorId, 
          shiftDate: { gte: todayStart }
        }
      }),
      prisma.processor_shifts.findMany({
        where: { 
          processorId, 
          shiftDate: { gte: weekPeriod.start }
        }
      }),
      prisma.processor_shifts.findMany({
        where: { 
          processorId, 
          shiftDate: { gte: monthPeriod.start }
        }
      })
    ]);

    // Получаем информацию о текущей активной смене
    const activeShift = await prisma.processor_shifts.findFirst({
      where: {
        processorId,
        status: 'ACTIVE'
      }
    });

    // Если есть активная смена, получаем депозиты за неё
    let currentShiftSum = 0;
    let currentShiftType = 'DAY'; // По умолчанию

    if (activeShift) {
      const shiftStart = activeShift.actualStart || activeShift.startTime;
      if (shiftStart) {
        const shiftDeposits = await prisma.processor_deposits.findMany({
          where: {
            processorId,
            createdAt: {
              gte: shiftStart,
            },
          },
        });
        currentShiftSum = shiftDeposits.reduce((sum, d) => sum + d.amount, 0);
        currentShiftType = activeShift.shiftType;
      }
    } else {
      // Если нет активной смены, используем тип смены по времени и депозиты за день
      const currentHour = getCurrentUTC3Time().getHours();
      if (currentHour >= 6 && currentHour < 14) {
        currentShiftType = 'MORNING';
      } else if (currentHour >= 14 && currentHour < 22) {
        currentShiftType = 'DAY';
      } else {
        currentShiftType = 'NIGHT';
      }
      currentShiftSum = todayDeposits.reduce((sum, d) => sum + d.amount, 0);
    }

    // Рассчитываем рабочие часы
    const calculateWorkHours = (shifts: any[]) => {
      return shifts.reduce((total, shift) => {
        if (shift.actualStart && shift.actualEnd) {
          const start = new Date(shift.actualStart);
          const end = new Date(shift.actualEnd);
          return total + (end.getTime() - start.getTime()) / (1000 * 60 * 60);
        }
        return total;
      }, 0);
    };

    // Функция для расчета бонусов по сменам
    const calculateShiftBasedBonuses = (shifts: any[], deposits: any[]) => {
      let totalBonuses = 0;
      
      for (const shift of shifts) {
        if (!shift.actualStart) continue; // Пропускаем смены без фактического начала
        
        const shiftStart = new Date(shift.actualStart);
        const shiftEnd = shift.actualEnd ? new Date(shift.actualEnd) : new Date(); // Если смена активна, берем текущее время
        
        // Находим депозиты этой смены
        const shiftDeposits = deposits.filter(d => {
          const depositTime = new Date(d.createdAt);
          return depositTime >= shiftStart && depositTime <= shiftEnd;
        });
        
        if (shiftDeposits.length === 0) continue;
        
        // Суммируем депозиты за смену
        const shiftSum = shiftDeposits.reduce((sum, d) => sum + d.amount, 0);
        
        // Находим подходящую бонусную сетку для этого типа смены и суммы
        let applicableGrid = null;
        for (const grid of bonusGrids) {
          if (grid.shiftType === shift.shiftType && 
              shiftSum >= grid.minAmount && 
              (!grid.maxAmount || shiftSum <= grid.maxAmount)) {
            applicableGrid = grid;
            break;
          }
        }
        
        if (applicableGrid) {
          // Рассчитываем бонус для каждого депозита в смене по ставке смены
          for (const deposit of shiftDeposits) {
            const depositBonus = (deposit.amount * applicableGrid.bonusPercentage) / 100;
            totalBonuses += depositBonus;
          }
          
          // Добавляем фиксированный бонус, если достигнут порог
          if (applicableGrid.fixedBonus && applicableGrid.fixedBonusMin && 
              shiftSum >= applicableGrid.fixedBonusMin) {
            totalBonuses += applicableGrid.fixedBonus;
          }
        }
      }
      
      return totalBonuses;
    };

    const todayHours = calculateWorkHours(todayShifts);
    const weekHours = calculateWorkHours(weekShifts);
    const monthHours = calculateWorkHours(monthShifts);

    // Заработок: базовая зарплата + бонусы по депозитной сетке
    const hourlyRate = salarySettings?.hourlyRate || 2.0;
    
    const todayBaseSalary = todayHours * hourlyRate;
    const weekBaseSalary = weekHours * hourlyRate;
    const monthBaseSalary = monthHours * hourlyRate;
    
    const todayBonuses = calculateShiftBasedBonuses(todayShifts, todayDeposits);
    const weekBonuses = calculateShiftBasedBonuses(weekShifts, weekDeposits);
    const monthBonuses = calculateShiftBasedBonuses(monthShifts, monthDeposits);
    
    const todayEarnings = todayBaseSalary + todayBonuses;
    const weekEarnings = weekBaseSalary + weekBonuses;
    const monthEarnings = monthBaseSalary + monthBonuses;

    // Рейтинг менеджеров (топ по месяцу)
    const topManagers = await prisma.processor_deposits.groupBy({
      by: ['processorId'],
      where: {
        createdAt: { gte: monthPeriod.start }
      },
      _sum: {
        amount: true,
        bonusAmount: true
      },
      _count: {
        id: true
      },
      orderBy: {
        _sum: {
          bonusAmount: 'desc'
        }
      },
      take: 10
    });

    // Получаем информацию о менеджерах для рейтинга
    const processorIds = topManagers.map(p => p.processorId);
    const managers = await prisma.users.findMany({
      where: { id: { in: processorIds } },
      select: { id: true, name: true, email: true }
    });

    const leaderboard = topManagers.map((stats, index) => {
      const manager = managers.find(p => p.id === stats.processorId);
      const name = manager?.name || manager?.email || 'Unknown';
      const maskedName = maskUserName(name);
      
      return {
        rank: index + 1,
        name: maskedName,
        isCurrentUser: stats.processorId === processorId,
        earnings: stats._sum.bonusAmount || 0,
        deposits: stats._count.id || 0,
        volume: stats._sum.amount || 0
      };
    });

    // Прогноз зарплаты на основе текущих показателей
    const daysInMonth = new Date(utc3Now.getFullYear(), utc3Now.getMonth() + 1, 0).getDate();
    const daysPassed = period === 'current' ? utc3Now.getDate() : daysInMonth;
    const avgDailyEarnings = daysPassed > 0 ? monthEarnings / daysPassed : 0;
    const projectedMonthlyEarnings = avgDailyEarnings * daysInMonth;

    // Цели на месяц из настроенных планов
    const totalMonthDeposits = monthDeposits.reduce((sum, d) => sum + d.amount, 0);
    
    // Получаем активные месячные планы
    const activeGoals = await prisma.user_goals.findMany({
      where: {
        isActive: true,
        periodType: 'MONTHLY'
      },
      include: {
        goalType: true,
        stages: {
          where: { isActive: true },
          orderBy: { targetValue: 'desc' },
          take: 1 // Берем максимальную цель
        }
      }
    });
    
    // Определяем цели по типам
    let monthlyGoals = {
      earnings: 1000, // дефолт
      deposits: 100,  // дефолт
      hours: 160,     // дефолт
      depositVolume: 20000 // из месячных бонусов
    };
    
    // Цель по объему депозитов из месячных бонусов
    let currentVolumeGoal = monthlyBonuses.find(bonus => totalMonthDeposits < bonus.minAmount);
    if (!currentVolumeGoal && monthlyBonuses.length > 0) {
      currentVolumeGoal = monthlyBonuses[monthlyBonuses.length - 1];
    }
    monthlyGoals.depositVolume = currentVolumeGoal ? currentVolumeGoal.minAmount : 20000;
    
    // Устанавливаем цели из настроенных планов
    for (const goal of activeGoals) {
      if (goal.stages.length > 0) {
        const maxStage = goal.stages[0]; // Максимальная цель (сортировка по убыванию)
        
        switch (goal.goalType.type) {
          case 'EARNINGS':
            monthlyGoals.earnings = maxStage.targetValue;
            break;
          case 'DEPOSITS_COUNT':
            monthlyGoals.deposits = maxStage.targetValue;
            break;
          case 'HOURS':
            monthlyGoals.hours = maxStage.targetValue;
            break;
        }
      }
    }

    const progress = {
      earnings: Math.min((monthEarnings / monthlyGoals.earnings) * 100, 100),
      deposits: Math.min((monthDeposits.length / monthlyGoals.deposits) * 100, 100),
      hours: Math.min((monthHours / monthlyGoals.hours) * 100, 100),
      depositVolume: Math.min((totalMonthDeposits / monthlyGoals.depositVolume) * 100, 100)
    };

    // Формируем milestones для прогресс-баров
    const goalMilestones = {
      earnings: [],
      deposits: [],
      hours: []
    };

    for (const goal of activeGoals) {
      if (goal.stages.length > 0) {
        const milestones = goal.stages
          .sort((a, b) => a.targetValue - b.targetValue)
          .map(stage => ({
            value: stage.targetValue,
            label: `${stage.title}: ${stage.targetValue}${goal.goalType.unit}`
          }));

        switch (goal.goalType.type) {
          case 'EARNINGS':
            goalMilestones.earnings = milestones;
            break;
          case 'DEPOSITS_COUNT':
            goalMilestones.deposits = milestones;
            break;
          case 'HOURS':
            goalMilestones.hours = milestones;
            break;
        }
      }
    }

    const stats = {
      // Основные метрики
      performance: {
        today: {
          deposits: todayDeposits.length,
          volume: todayDeposits.reduce((sum, d) => sum + d.amount, 0),
          earnings: todayEarnings,
          hours: todayHours,
          avgPerHour: todayHours > 0 ? todayEarnings / todayHours : 0
        },
        week: {
          deposits: weekDeposits.length,
          volume: weekDeposits.reduce((sum, d) => sum + d.amount, 0),
          earnings: weekEarnings,
          hours: weekHours,
          avgPerHour: weekHours > 0 ? weekEarnings / weekHours : 0
        },
        month: {
          deposits: monthDeposits.length,
          volume: monthDeposits.reduce((sum, d) => sum + d.amount, 0),
          earnings: monthEarnings,
          hours: monthHours,
          avgPerHour: monthHours > 0 ? monthEarnings / monthHours : 0
        }
      },

      // Прогнозы
      projections: {
        monthlyEarnings: projectedMonthlyEarnings,
        remainingDays: Math.max(0, daysInMonth - daysPassed),
        dailyTarget: (daysInMonth - daysPassed) > 0 
          ? (monthlyGoals.earnings - monthEarnings) / (daysInMonth - daysPassed)
          : 0,
        onTrack: projectedMonthlyEarnings >= monthlyGoals.earnings * 0.9
      },

      // Прогресс к целям
      goals: {
        monthly: monthlyGoals,
        progress: progress,
        milestones: goalMilestones,
      },

      // Рейтинг
      leaderboard: leaderboard,
      currentUserRank: leaderboard.findIndex(p => p.isCurrentUser) + 1 || null,

      // Настройки
      settings: {
        hourlyRate: salarySettings?.hourlyRate || 2.0,
        baseCommission: bonusSettings?.baseCommissionRate || 30.0,
        bonusGrids: bonusGrids,
        depositGrid: depositGrid,
        monthlyBonuses: monthlyBonuses,
        currentMonthlyBonus: applicableMonthlyBonus ? {
          bonusPercent: applicableMonthlyBonus.bonusPercent,
          minAmount: applicableMonthlyBonus.minAmount,
          eligible: true
        } : null,
        nextMonthlyBonus: nextMonthlyBonus ? {
          bonusPercent: nextMonthlyBonus.bonusPercent,
          minAmount: nextMonthlyBonus.minAmount,
          eligible: false
        } : null
      },

      // Информация о периоде
      period: {
        type: period,
        isCurrentMonth: period === 'current'
      },

      // Данные о текущей смене
      currentShift: {
        currentSum: currentShiftSum,
        shiftType: currentShiftType,
        isActive: !!activeShift,
        startTime: activeShift?.actualStart?.toISOString() || activeShift?.startTime?.toISOString(),
        endTime: activeShift?.actualEnd?.toISOString()
      }
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Ошибка получения детальной статистики:", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}
