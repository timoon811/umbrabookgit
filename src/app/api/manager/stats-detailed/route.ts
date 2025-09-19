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
import { requireAuth } from '@/lib/api-auth';

export async function GET(request: NextRequest) {
  try {
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
  
  const processorId = user.userId;
    const utc3Now = getCurrentUTC3Time();
    
    // Определяем периоды в зависимости от выбора
    let todayStart, weekPeriod, monthPeriod;
    
    if (period === 'previous') {
      // Предыдущий месяц с корректным расчетом по UTC+3
      const currentMonth = getCurrentMonthPeriod();
      const prevMonthStart = new Date(currentMonth.start);
      prevMonthStart.setMonth(prevMonthStart.getMonth() - 1);
      const prevMonthEnd = new Date(currentMonth.start);
      prevMonthEnd.setTime(prevMonthEnd.getTime() - 1); // Последняя миллисекунда прошлого месяца
      
      monthPeriod = { start: prevMonthStart, end: prevMonthEnd };
      
      // Последняя неделя прошлого месяца
      const lastWeekStart = new Date(prevMonthEnd);
      lastWeekStart.setDate(lastWeekStart.getDate() - 6);
      lastWeekStart.setUTCHours(3, 0, 0, 0); // 06:00 UTC+3 = 03:00 UTC
      weekPeriod = { start: lastWeekStart, end: prevMonthEnd };
      
      // Последний день прошлого месяца
      todayStart = new Date(prevMonthEnd);
      todayStart.setUTCHours(3, 0, 0, 0); // 06:00 UTC+3 = 03:00 UTC
    } else if (period === 'custom' && customStart && customEnd) {
      // Кастомный период
      const startDate = new Date(customStart);
      const endDate = new Date(customEnd);
      endDate.setUTCHours(20, 59, 59, 999); // Конец дня UTC+3 = 23:59 UTC+3 = 20:59 UTC
      
      monthPeriod = { start: startDate, end: endDate };
      weekPeriod = { start: startDate, end: endDate };
      todayStart = startDate;
    } else {
      // Текущий период (по умолчанию) - используем корректные UTC+3 периоды
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

    // Корректные временные окончания для фильтрации
    // ИСПРАВЛЕНО: Используем корректное UTC+3 время вместо new Date()
    const todayEnd = period === 'current' ? getCurrentUTC3Time() : new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
    const weekEnd = period === 'current' ? getCurrentUTC3Time() : weekPeriod.end || getCurrentUTC3Time();
    const monthEnd = period === 'current' ? getCurrentUTC3Time() : monthPeriod.end || getCurrentUTC3Time();

    // Статистика за разные периоды с корректными фильтрами
    const [todayDeposits, weekDeposits, monthDeposits] = await Promise.all([
      prisma.processor_deposits.findMany({
        where: { 
          processorId, 
          createdAt: { 
            gte: todayStart,
            lte: todayEnd
          } 
        }
      }),
      prisma.processor_deposits.findMany({
        where: { 
          processorId, 
          createdAt: { 
            gte: weekPeriod.start,
            lte: weekEnd
          } 
        }
      }),
      prisma.processor_deposits.findMany({
        where: { 
          processorId, 
          createdAt: { 
            gte: monthPeriod.start,
            lte: monthEnd
          } 
        }
      })
    ]);

    // Определяем месячный бонус для текущего объема депозитов
    const currentMonthVolume = monthDeposits.reduce((sum, d) => sum + d.amount, 0);
    const applicableMonthlyBonus = monthlyBonuses.find(bonus => 
      currentMonthVolume >= bonus.minAmount
    );
    
    // Определяем следующий месячный бонус (к чему стремиться)
    const nextMonthlyBonus = monthlyBonuses.find(bonus => 
      currentMonthVolume < bonus.minAmount
    );

    // Статистика смен с корректными фильтрами
    const [todayShifts, weekShifts, monthShifts] = await Promise.all([
      prisma.processor_shifts.findMany({
        where: { 
          processorId, 
          shiftDate: { 
            gte: todayStart,
            lte: todayEnd
          }
        }
      }),
      prisma.processor_shifts.findMany({
        where: { 
          processorId, 
          shiftDate: { 
            gte: weekPeriod.start,
            lte: weekEnd
          }
        }
      }),
      prisma.processor_shifts.findMany({
        where: { 
          processorId, 
          shiftDate: { 
            gte: monthPeriod.start,
            lte: monthEnd
          }
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
      const shiftStart = activeShift.actualStart || activeShift.scheduledStart;
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
      const currentHour = getCurrentUTC3Time().getUTCHours();
      if (currentHour >= 6 && currentHour < 14) {
        currentShiftType = 'MORNING';
      } else if (currentHour >= 14 && currentHour < 22) {
        currentShiftType = 'DAY';
      } else {
        currentShiftType = 'NIGHT';
      }
      currentShiftSum = todayDeposits.reduce((sum, d) => sum + d.amount, 0);
    }

    // Рассчитываем рабочие часы с проверками корректности
    const calculateWorkHours = (shifts: any[]) => {
      return shifts.reduce((total, shift) => {
        if (shift.actualStart && shift.actualEnd) {
          const start = new Date(shift.actualStart);
          const end = new Date(shift.actualEnd);
          
          // Проверяем корректность времени
          if (end <= start) {
            console.warn(`[STATS_DETAILED] Некорректное время смены ${shift.id}: конец (${end.toISOString()}) раньше или равен началу (${start.toISOString()})`);
            return total;
          }
          
          const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
          
          // Проверяем разумные границы (не более 24 часов за смену)
          if (hours > 0 && hours <= 24) {
            return total + hours;
          } else {
            console.warn(`[STATS_DETAILED] Некорректная продолжительность смены ${shift.id}: ${hours.toFixed(2)} часов`);
            return total;
          }
        }
        return total;
      }, 0);
    };

    // Функция для расчета ВСЕХ видов бонусов за период
    const calculateAllBonuses = async (deposits: any[], periodStart: Date, periodEnd: Date) => {
      let totalBonuses = 0;
      
      // 1. Депозитные бонусы, уже записанные в базе (bonusAmount в processor_deposits)
      const depositBonuses = deposits.reduce((sum, d) => sum + (d.bonusAmount || 0), 0);
      totalBonuses += depositBonuses;
      
      // 2. Дополнительные бонусы из таблицы bonus_payments за период
      const additionalBonuses = await prisma.bonus_payments.findMany({
        where: {
          processorId,
          status: 'PAID',
          paidAt: {
            gte: periodStart,
            lte: periodEnd
          }
        }
      });
      const additionalBonusAmount = additionalBonuses.reduce((sum, b) => sum + b.amount, 0);
      totalBonuses += additionalBonusAmount;
      
      // 3. Зарплатные бонусы по депозитной сетке (salary_deposit_grid)
      const totalDepositAmount = deposits.reduce((sum, d) => sum + d.amount, 0);
      if (totalDepositAmount > 0) {
        const applicableSalaryGrid = depositGrid.find(grid => 
          totalDepositAmount >= grid.minAmount && 
          (!grid.maxAmount || totalDepositAmount <= grid.maxAmount)
        );
        if (applicableSalaryGrid) {
          const salaryGridBonus = (totalDepositAmount * applicableSalaryGrid.percentage) / 100;
          totalBonuses += salaryGridBonus;
        }
      }
      
      // 4. Месячные бонусы за план (только для месячного периода)
      if (period === 'current' && periodStart.getMonth() === monthPeriod.start.getMonth()) {
        if (applicableMonthlyBonus) {
          const monthlyBonusAmount = (totalDepositAmount * applicableMonthlyBonus.bonusPercent) / 100;
          totalBonuses += monthlyBonusAmount;
        }
      }
      
      // 5. Мотивационные бонусы (bonus_motivations) - активные для текущего периода
      const motivationBonuses = await prisma.bonus_motivations.findMany({
        where: { isActive: true }
      });
      
      for (const motivation of motivationBonuses) {
        if (motivation.type === 'PERCENTAGE') {
          // Процентный бонус от общего объема депозитов
          const motivationAmount = (totalDepositAmount * motivation.value) / 100;
          totalBonuses += motivationAmount;
        } else if (motivation.type === 'FIXED_AMOUNT') {
          // Фиксированный бонус (если условия выполнены)
          // TODO: Добавить логику проверки условий из motivation.conditions
          totalBonuses += motivation.value;
        }
      }
      
      const motivationBonusAmount = motivationBonuses.reduce((sum, m) => {
        if (m.type === 'PERCENTAGE') {
          return sum + (totalDepositAmount * m.value) / 100;
        } else {
          return sum + m.value;
        }
      }, 0);
      
      console.log(`[BONUS_CALC] Расчет бонусов за период ${periodStart.toISOString()} - ${periodEnd.toISOString()}:`, {
        depositBonuses,
        additionalBonusAmount,
        salaryGridBonus: totalDepositAmount > 0 ? 'calculated' : 0,
        monthlyBonus: applicableMonthlyBonus ? 'calculated' : 0,
        motivationBonusAmount,
        totalBonuses
      });
      
      return totalBonuses;
    };

    const todayHours = calculateWorkHours(todayShifts);
    const weekHours = calculateWorkHours(weekShifts);
    const monthHours = calculateWorkHours(monthShifts);

    // Заработок: базовая зарплата + ВСЕ виды бонусов
    const hourlyRate = salarySettings?.hourlyRate || 2.0;
    
    const todayBaseSalary = todayHours * hourlyRate;
    const weekBaseSalary = weekHours * hourlyRate;
    const monthBaseSalary = monthHours * hourlyRate;
    
    // Рассчитываем ВСЕ виды бонусов за каждый период
    const todayBonuses = await calculateAllBonuses(todayDeposits, todayStart, todayEnd);
    const weekBonuses = await calculateAllBonuses(weekDeposits, weekPeriod.start, weekEnd);
    const monthBonuses = await calculateAllBonuses(monthDeposits, monthPeriod.start, monthEnd);
    
    const todayEarnings = Math.max(0, todayBaseSalary + todayBonuses);
    const weekEarnings = Math.max(0, weekBaseSalary + weekBonuses);
    const monthEarnings = Math.max(0, monthBaseSalary + monthBonuses);

    // Рейтинг менеджеров (топ по выбранному периоду)
    const topManagers = await prisma.processor_deposits.groupBy({
      by: ['processorId'],
      where: {
        createdAt: { 
          gte: monthPeriod.start,
          lte: monthEnd
        }
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

    // Прогноз зарплаты на основе текущих показателей (только для текущего периода)
    let projectedMonthlyEarnings = monthEarnings; // По умолчанию используем фактические данные
    
    if (period === 'current') {
      const daysInMonth = new Date(utc3Now.getFullYear(), utc3Now.getMonth() + 1, 0).getDate();
      const daysPassed = utc3Now.getDate();
      
      if (daysPassed > 0 && daysPassed < daysInMonth) {
        const avgDailyEarnings = monthEarnings / daysPassed;
        projectedMonthlyEarnings = avgDailyEarnings * daysInMonth;
      } else if (daysPassed === 0) {
        // Первый день месяца - прогноз на основе вчерашнего дня
        projectedMonthlyEarnings = todayEarnings * daysInMonth;
      }
    }

    // Цели на месяц из настроенных планов
    const totalMonthDeposits = monthDeposits.reduce((sum, d) => sum + d.amount, 0);
    
    // Получаем активные месячные планы (с проверкой существования таблицы)
    let activeGoals = [];
    try {
      // Проверяем существование таблицы user_goals
      const tableExists = await prisma.$queryRaw`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'user_goals'
      ` as Array<{ table_name: string }>;

      if (tableExists.length > 0) {
        activeGoals = await prisma.user_goals.findMany({
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
      }
    } catch (error: any) {
      console.log("Таблица user_goals не найдена, используем дефолтные цели");
      activeGoals = [];
    }
    
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

    // Отладочная информация
    console.log(`[STATS] Статистика для пользователя ${processorId}, период: ${period}`);
    console.log(`[STATS] Периоды:`, {
      today: { start: todayStart, end: todayEnd },
      week: weekPeriod,
      month: monthPeriod
    });
    console.log(`[STATS] Депозиты:`, {
      today: { count: todayDeposits.length, sum: todayDeposits.reduce((sum, d) => sum + d.amount, 0) },
      week: { count: weekDeposits.length, sum: weekDeposits.reduce((sum, d) => sum + d.amount, 0) },
      month: { count: monthDeposits.length, sum: monthDeposits.reduce((sum, d) => sum + d.amount, 0) }
    });
    console.log(`[STATS] Заработок (базовая ставка + ВСЕ бонусы):`, { 
      today: { base: todayBaseSalary, bonuses: todayBonuses, total: todayEarnings },
      week: { base: weekBaseSalary, bonuses: weekBonuses, total: weekEarnings },
      month: { base: monthBaseSalary, bonuses: monthBonuses, total: monthEarnings }
    });

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

      // Прогнозы (только для текущего периода)
      projections: {
        monthlyEarnings: projectedMonthlyEarnings,
        remainingDays: period === 'current' ? Math.max(0, new Date(utc3Now.getFullYear(), utc3Now.getMonth() + 1, 0).getDate() - utc3Now.getDate()) : 0,
        dailyTarget: period === 'current' 
          ? (() => {
              const daysInMonth = new Date(utc3Now.getFullYear(), utc3Now.getMonth() + 1, 0).getDate();
              const daysPassed = utc3Now.getDate();
              const remainingDays = daysInMonth - daysPassed;
              return remainingDays > 0 ? (monthlyGoals.earnings - monthEarnings) / remainingDays : 0;
            })()
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
        startTime: activeShift?.actualStart?.toISOString() || activeShift?.scheduledStart?.toISOString(),
        endTime: activeShift?.actualEnd?.toISOString()
      }
    };

    return NextResponse.json(stats);
  } catch (error: any) {
    console.error("Ошибка получения детальной статистики:", error);
    
    // Более детальная обработка ошибок
    if (error.name === 'PrismaClientKnownRequestError') {
      if (error.code === 'P2002') {
        return NextResponse.json(
          { error: "Нарушение уникальности данных" },
          { status: 400 }
        );
      } else if (error.code === 'P2025') {
        return NextResponse.json(
          { error: "Запрашиваемые данные не найдены" },
          { status: 404 }
        );
      }
    } else if (error.name === 'PrismaClientValidationError') {
      return NextResponse.json(
        { error: "Ошибка валидации данных запроса" },
        { status: 400 }
      );
    } else if (error.name === 'PrismaClientUnknownRequestError') {
      return NextResponse.json(
        { error: "Ошибка подключения к базе данных" },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { 
        error: "Внутренняя ошибка сервера", 
        details: process.env.NODE_ENV === 'development' ? error.message : undefined 
      },
      { status: 500 }
    );
  }
}
