import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentDayStartUTC3,
  getShiftTypeByTime
} from '@/lib/time-utils';
import { getSystemTime } from '@/lib/system-time';
import { ShiftType as PrismaShiftType } from "@prisma/client";
import { requireManagerAuth } from "@/lib/api-auth";
import { requireAuth } from '@/lib/api-auth';

// Функция пересчета бонусов для всех депозитов в смене
// Функция проверки достижения месячных планов
async function checkMonthlyPlanAchievement(processorId: string) {
  try {
    
    // Получаем начало текущего месяца
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    // Получаем все депозиты за текущий месяц
    const monthDeposits = await prisma.processor_deposits.findMany({
      where: {
        processorId,
        createdAt: {
          gte: startOfMonth,
          lte: endOfMonth
        }
      }
    });

    const totalMonthlyVolume = monthDeposits.reduce((sum, d) => sum + d.amount, 0);

    // Получаем активные месячные планы
    const monthlyPlans = await prisma.salary_monthly_bonus.findMany({
      where: { isActive: true },
      orderBy: { minAmount: 'desc' } // От большего к меньшему
    });

    // Определяем подходящий план (наибольший достигнутый)
    let applicablePlan = null;
    for (const plan of monthlyPlans) {
      if (totalMonthlyVolume >= plan.minAmount) {
        applicablePlan = plan;
        break; // Берем первый подходящий (самый высокий)
      }
    }

    if (!applicablePlan) {
      return;
    }

    // Проверяем, не начислялся ли уже бонус за этот план в этом месяце
    const existingBonus = await prisma.bonus_payments.findFirst({
      where: {
        processorId,
        type: 'ACHIEVEMENT_BONUS',
        description: { contains: applicablePlan.name },
        period: {
          gte: startOfMonth,
          lte: endOfMonth
        },
        status: { not: 'BURNED' }
      }
    });

    if (existingBonus) {
      return;
    }

    // Рассчитываем бонус
    const monthlyBonusAmount = (totalMonthlyVolume * applicablePlan.bonusPercent) / 100;
    
    // Создаем запись о бонусе
    await prisma.bonus_payments.create({
      data: {
        processorId,
        type: 'ACHIEVEMENT_BONUS',
        amount: monthlyBonusAmount,
        description: `Месячный бонус за план "${applicablePlan.name}" (${applicablePlan.bonusPercent}% от $${totalMonthlyVolume.toLocaleString()})`,
        period: now,
        conditions: `Месячный план: минимум $${applicablePlan.minAmount.toLocaleString()}`,
        status: 'APPROVED' // Автоматически одобряем месячные бонусы
      }
    });

  } catch (error) {
    console.error('Ошибка при проверке месячных планов:', error);
  }
}

async function recalculateShiftBonuses(shiftId: string, processorId: string, shiftType: PrismaShiftType) {
  try {
    
    // Получаем активную смену
    const shift = await prisma.processor_shifts.findUnique({
      where: { id: shiftId }
    });
    
    if (!shift) {
      return;
    }
    
    // Получаем все депозиты в смене
      const shiftStart = new Date(shift.actualStart || shift.scheduledStart);
    const shiftDeposits = await prisma.processor_deposits.findMany({
      where: {
        processorId,
        createdAt: {
          gte: shiftStart,
        },
      },
      orderBy: { createdAt: 'asc' }
    });
    
    if (shiftDeposits.length === 0) {
      return;
    }
    
    // Рассчитываем общую сумму смены
    const totalShiftSum = shiftDeposits.reduce((sum, d) => sum + d.amount, 0);
    
    // Получаем актуальную бонусную сетку для новой суммы
    const bonusGrid = await prisma.bonus_grid.findFirst({
      where: {
        isActive: true,
        shiftType: shiftType,
        minAmount: { lte: totalShiftSum },
        OR: [
          { maxAmount: { gte: totalShiftSum } },
          { maxAmount: null }
        ]
      },
      orderBy: { bonusPercentage: "desc" }
    });
    
    if (!bonusGrid) {
      // Обнуляем бонусы у всех депозитов
      await prisma.processor_deposits.updateMany({
        where: {
          id: { in: shiftDeposits.map(d => d.id) }
        },
        data: {
          bonusRate: 0,
          bonusAmount: 0
        }
      });
      return;
    }
    
    
    // Рассчитываем общий бонус за смену
    const totalShiftBonus = (totalShiftSum * bonusGrid.bonusPercentage) / 100;
    
    // Пересчитываем бонус для каждого депозита пропорционально
    for (const deposit of shiftDeposits) {
      const depositShare = deposit.amount / totalShiftSum;
      const newBonusAmount = totalShiftBonus * depositShare;
      
      // Обновляем депозит
      await prisma.processor_deposits.update({
        where: { id: deposit.id },
        data: {
          bonusRate: bonusGrid.bonusPercentage,
          bonusAmount: newBonusAmount
        }
      });
      
    }
    
    
  } catch (error) {
    console.error(`[BONUS_CALC] ERROR: Ошибка пересчета бонусов смены:`, error);
  }
}

export async function GET(request: NextRequest) {
  try {
  

    const authResult = await requireAuth(request);
  
    if ('error' in authResult) {
    return authResult.error;
  }
  
  const { user } = authResult;

// Проверяем авторизацию
  // Для админов показываем все депозиты, для менеджеров - только их
    const processorId = user.role === "ADMIN" ? null : user.userId;

    // Получаем параметры запроса
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    // Формируем условия поиска
    const where: {
      processorId?: string;
    } = {
      ...(processorId && { processorId }),
    };

    console.log('[DEPOSITS_GET] Загрузка депозитов для процессора:', processorId);
    console.log('[DEPOSITS_GET] Условия поиска:', where);

    // Получаем депозиты с пагинацией
    const [deposits, total] = await Promise.all([
      prisma.processor_deposits.findMany({
        where,
        orderBy: {
          createdAt: "desc",
        },
        skip,
        take: limit,
      }),
      prisma.processor_deposits.count({ where }),
    ]);

    console.log('[DEPOSITS_GET] ✅ Найдено депозитов:', deposits.length, 'из общего количества:', total);

    return NextResponse.json({
      deposits,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Ошибка получения депозитов менеджера:", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    

    const authResult = await requireAuth(request);
    
    if ('error' in authResult) {
      return authResult.error;
    }
    
    const { user } = authResult;

    // Основная логика POST
    const processorId = user.userId;
    const data = await request.json();

    // Валидация данных
    if (!data.amount || !data.currency || !data.playerEmail) {
      return NextResponse.json(
        { error: "Обязательные поля: amount, currency, playerEmail" },
        { status: 400 }
      );
    }

    // Валидация email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.playerEmail)) {
      return NextResponse.json(
        { error: "Некорректный формат email" },
        { status: 400 }
      );
    }

    if (data.amount <= 0) {
      return NextResponse.json(
        { error: "Сумма должна быть больше 0" },
        { status: 400 }
      );
    }

    // Проверяем дубликаты (email + сумма + время в течение часа)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const existingDeposit = await prisma.processor_deposits.findFirst({
      where: {
        processorId,
        playerEmail: data.playerEmail,
        amount: data.amount,
        currency: data.currency,
        createdAt: {
          gte: oneHourAgo,
        },
      },
    });

    if (existingDeposit) {
      return NextResponse.json(
        { error: "Похожий депозит уже был добавлен в течение последнего часа" },
        { status: 400 }
      );
    }

    // Получаем настройки бонусов
    const bonusSettings = await prisma.bonus_settings.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
    });

    // Получаем настройки комиссии платформы
    const platformCommission = await prisma.platform_commission.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
    });

    const commissionRate = bonusSettings?.baseCommissionRate || 30.0;
    const platformCommissionPercent = platformCommission?.commissionPercent || 0;

    // Проверяем дневную сумму для применения сетки бонусов
    // Используем Стамбульское время для корректного расчета 24-часового периода
    const utc3Now = getSystemTime();
    const todayStart = getCurrentDayStartUTC3();

    // Определяем тип смены для текущего времени
    const currentShiftType = getShiftTypeByTime(utc3Now);

    // Проверка 24-часового сброса не используется в логике сохранения

    // Получаем активную смену процессора
    const activeShift = await prisma.processor_shifts.findFirst({
      where: {
        processorId,
        status: 'ACTIVE'
      }
    });

    let shiftSum = data.amount; // По умолчанию только текущий депозит
    let existingShiftSum = 0;

    if (activeShift) {
      // Получаем депозиты за текущую смену
      const shiftStart = new Date(activeShift.actualStart || activeShift.scheduledStart);
      const shiftDeposits = await prisma.processor_deposits.findMany({
        where: {
          processorId,
          createdAt: {
            gte: shiftStart,
          },
        },
      });

      existingShiftSum = shiftDeposits.reduce((sum, d) => sum + d.amount, 0);
      shiftSum = existingShiftSum + data.amount;
      
    } else {
    }

    // Также получаем все депозиты за день для общей статистики
    const todayDeposits = await prisma.processor_deposits.findMany({
      where: {
        processorId,
        createdAt: {
          gte: todayStart,
        },
      },
    });

    const existingTodaySum = todayDeposits.reduce((sum, d) => sum + d.amount, 0);
    const todaySum = existingTodaySum + data.amount;
    

    // Применяем бонусную сетку на основе суммы за СМЕНУ и типа смены
    const effectiveShiftType = activeShift ? activeShift.shiftType : currentShiftType;
    
    const bonusGrid = await prisma.bonus_grid.findFirst({
      where: {
        isActive: true,
        shiftType: effectiveShiftType as PrismaShiftType,
        minAmount: { lte: shiftSum },
        OR: [
          { maxAmount: { gte: shiftSum } },
          { maxAmount: null }
        ]
      },
      orderBy: { bonusPercentage: "desc" }
    });

    // ИСПРАВЛЕНИЕ: Рассчитываем бонус от общей суммы за смену, а не от отдельного депозита
    let bonusAmount = 0;
    if (bonusGrid) {
      const bonusRate = bonusGrid.bonusPercentage;
      // Рассчитываем долю текущего депозита в общей сумме смены
      const depositShare = data.amount / shiftSum;
      // Общий бонус за всю смену
      const totalShiftBonus = (shiftSum * bonusRate) / 100;
      // Бонус за текущий депозит = доля депозита * общий бонус
      bonusAmount = totalShiftBonus * depositShare;
      
    } else {
    }

    // Проверяем фиксированные бонусы за достижения (по сумме за смену)
    if (bonusGrid && bonusGrid.fixedBonus && bonusGrid.fixedBonusMin && shiftSum >= bonusGrid.fixedBonusMin) {
      bonusAmount += bonusGrid.fixedBonus;
    }

    // Проверяем дополнительные мотивации
    const activeMotivations = await prisma.bonus_motivations.findMany({
      where: { isActive: true }
    });

    for (const motivation of activeMotivations) {
      try {
        const conditions = motivation.conditions ? JSON.parse(motivation.conditions) : {};
        let shouldApply = true;

        // Проверяем условия мотивации
        if (conditions.minDeposits) {
          const totalDeposits = await prisma.processor_deposits.count({
            where: { processorId }
          });
          if (totalDeposits < conditions.minDeposits) shouldApply = false;
        }

        if (conditions.minAmount) {
          if (todaySum < conditions.minAmount) shouldApply = false;
        }

        if (shouldApply) {
          if (motivation.type === 'PERCENTAGE') {
            // ИСПРАВЛЕНИЕ: Мотивационные бонусы тоже должны учитывать долю депозита в смене
            const depositShare = data.amount / shiftSum;
            const totalMotivationBonus = (shiftSum * motivation.value) / 100;
            bonusAmount += totalMotivationBonus * depositShare;
          } else if (motivation.type === 'FIXED_AMOUNT') {
            // Фиксированные мотивационные бонусы применяются полностью к первому депозиту смены
            // или разделяются поровну между всеми депозитами (можно настроить)
            bonusAmount += motivation.value;
          }
        }
      } catch (error) {
        console.error(`Ошибка проверки мотивации ${motivation.id}:`, error);
      }
    }

    // Определяем тип валюты - теперь все валюты криптовалюты
    const currencyType = 'CRYPTO';

    // Рассчитываем комиссию платформы и заработок менеджера
    const platformCommissionAmount = (data.amount * platformCommissionPercent) / 100;
    const processorEarnings = data.amount - platformCommissionAmount;

    // Создаем депозит
    console.log('[DEPOSIT] Создание депозита с данными:', {
      processorId,
      playerEmail: data.playerEmail,
      amount: data.amount,
      currency: data.currency
    });
    
    const deposit = await prisma.processor_deposits.create({
      data: {
        processorId,
        playerId: data.playerId || data.playerEmail, // Используем email как playerId если нет отдельного playerId
        playerNick: data.playerNick,
        playerEmail: data.playerEmail,
        offerId: data.offerId,
        offerName: data.offerName,
        geo: data.geo,
        amount: data.amount,
        currency: data.currency.toUpperCase(),
        currencyType: currencyType,
        paymentMethod: data.paymentMethod,
        leadSource: data.leadSource,
        proofs: data.proofs ? JSON.stringify(data.proofs) : null,
        notes: data.notes,
        commissionRate,
        bonusRate: bonusGrid?.bonusPercentage || 0,
        bonusAmount,
        platformCommissionPercent,
        platformCommissionAmount,
        processorEarnings,
      },
    });

    console.log('[DEPOSIT] ✅ Депозит успешно создан:', {
      id: deposit.id,
      processorId: deposit.processorId,
      playerEmail: deposit.playerEmail,
      amount: deposit.amount,
      currency: deposit.currency,
      createdAt: deposit.createdAt
    });

    // КРИТИЧЕСКИ ВАЖНО: Пересчитываем бонусы для всех депозитов в смене
    // так как новый депозит может изменить процентную сетку для всей смены
    if (activeShift) {
      await recalculateShiftBonuses(activeShift.id, processorId, effectiveShiftType as PrismaShiftType);
    }

    // НОВОЕ: Проверяем достижение месячных планов
    await checkMonthlyPlanAchievement(processorId);

    // Создаем запись о бонусе в холде (до следующего дня)
    if (bonusAmount > 0) {
      const holdUntil = new Date(todayStart);
      holdUntil.setUTCDate(holdUntil.getUTCDate() + 1); // Холд до следующего дня

      await prisma.bonus_payments.create({
        data: {
          processorId,
          type: 'DEPOSIT_BONUS',
          description: `Бонус за депозит $${data.amount} (${currentShiftType})`,
          amount: bonusAmount,
          depositId: deposit.id,
          period: todayStart,
          shiftType: currentShiftType as PrismaShiftType,
          holdUntil,
          status: 'HELD', // Бонус в холде
        },
      });

    }

    return NextResponse.json(deposit, { status: 201 });
  } catch (error) {
    if (error instanceof Error) {
      console.error("[DEPOSIT] ERROR: Подробная ошибка создания депозита:", error);
      console.error("[DEPOSIT] ERROR: Stack trace:", error.stack);
    } else {
      console.error("[DEPOSIT] ERROR: Неизвестная ошибка создания депозита", error);
    }
    return NextResponse.json(
      { 
        error: "Внутренняя ошибка сервера",
        details: process.env.NODE_ENV === 'development' && error instanceof Error ? error.message : undefined 
      },
      { status: 500 }
    );
  }
}
