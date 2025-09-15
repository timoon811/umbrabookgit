import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireProcessorAuth } from "@/lib/api-auth";
import {
  getCurrentUTC3Time,
  getCurrentDayStartUTC3,
  getCurrentWeekPeriod,
  getCurrentMonthPeriod
} from "@/lib/time-utils";
import { maskUserName } from "@/utils/userUtils";

export async function GET(request: NextRequest) {
  // Проверяем авторизацию
  const authResult = await requireProcessorAuth(request);
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

    // Получаем бонусные настройки
    const bonusSettings = await prisma.bonus_settings.findFirst({
      where: { isActive: true }
    });

    const bonusGrids = await prisma.bonus_grid.findMany({
      where: { isActive: true },
      orderBy: { minAmount: "asc" }
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

    // Функция для расчета бонусов по депозитной сетке (за смену)
    const calculateShiftBonuses = (shifts: any[], deposits: any[]) => {
      let totalBonuses = 0;
      
      for (const shift of shifts) {
        if (!shift.actualStart || !shift.actualEnd) continue;
        
        // Находим депозиты этой смены
        const shiftStart = new Date(shift.actualStart);
        const shiftEnd = new Date(shift.actualEnd);
        
        const shiftDeposits = deposits.filter(d => {
          const depositTime = new Date(d.createdAt);
          return depositTime >= shiftStart && depositTime <= shiftEnd;
        });
        
        // Суммируем депозиты за смену
        const shiftSum = shiftDeposits.reduce((sum, d) => sum + d.amount, 0);
        
        // Находим подходящий процент из депозитной сетки
        let bonusPercent = 0;
        for (const grid of depositGrid) {
          if (shiftSum >= grid.minAmount) {
            bonusPercent = grid.percentage;
          }
        }
        
        // Рассчитываем бонус за эту смену
        const shiftBonus = (shiftSum * bonusPercent) / 100;
        totalBonuses += shiftBonus;
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
    
    const todayBonuses = calculateShiftBonuses(todayShifts, todayDeposits);
    const weekBonuses = calculateShiftBonuses(weekShifts, weekDeposits);
    const monthBonuses = calculateShiftBonuses(monthShifts, monthDeposits);
    
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

    // Цели на месяц из месячных планов админ панели
    const totalMonthDeposits = monthDeposits.reduce((sum, d) => sum + d.amount, 0);
    
    // Определяем ближайшую цель из месячных бонусов
    let currentGoal = monthlyBonuses.find(bonus => totalMonthDeposits < bonus.minAmount);
    if (!currentGoal && monthlyBonuses.length > 0) {
      currentGoal = monthlyBonuses[monthlyBonuses.length - 1];
    }
    
    const monthlyGoals = {
      earnings: currentGoal ? currentGoal.minAmount * 0.03 : 1000, // 3% от цели по депозитам
      deposits: 100, // базовое количество депозитов
      hours: 160, // базовые часы (20 дней по 8 часов)
      depositVolume: currentGoal ? currentGoal.minAmount : 20000 // цель по объему депозитов
    };

    const progress = {
      earnings: Math.min((monthEarnings / monthlyGoals.earnings) * 100, 100),
      deposits: Math.min((monthDeposits.length / monthlyGoals.deposits) * 100, 100),
      hours: Math.min((monthHours / monthlyGoals.hours) * 100, 100),
      depositVolume: Math.min((totalMonthDeposits / monthlyGoals.depositVolume) * 100, 100)
    };

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
        achievements: {
          earningsAchieved: monthEarnings >= monthlyGoals.earnings,
          depositsAchieved: monthDeposits.length >= monthlyGoals.deposits,
          hoursAchieved: monthHours >= monthlyGoals.hours
        }
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
        monthlyBonuses: monthlyBonuses
      },

      // Информация о периоде
      period: {
        type: period,
        isCurrentMonth: period === 'current'
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
