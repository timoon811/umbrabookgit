import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getCurrentUTC3Time,
  getCurrentDayStartUTC3,
  getShiftType,
  validate24HourReset
} from "@/lib/time-utils";
import { requireProcessorAuth } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  // Проверяем авторизацию
  const authResult = await requireProcessorAuth(request);
  if ('error' in authResult) {
    return authResult.error;
  }

  const { user } = authResult;
  
  try {
    // Для админов показываем все депозиты, для менеджеров - только их
    const processorId = user.role === "ADMIN" ? null : user.userId;

    // Получаем параметры запроса
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const status = searchParams.get("status");
    const skip = (page - 1) * limit;

    // Формируем условия поиска
    const where: {
      processorId?: string;
      status?: "PENDING" | "APPROVED" | "REJECTED" | "PROCESSING";
    } = {
      ...(processorId && { processorId }),
    };

    if (status && status !== "all") {
      where.status = status.toUpperCase() as "PENDING" | "APPROVED" | "REJECTED" | "PROCESSING";
    }

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
  // Проверяем авторизацию
  const authResult = await requireProcessorAuth(request);
  if ('error' in authResult) {
    return authResult.error;
  }

  const { user } = authResult;
  
  try {
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
    // Используем UTC+3 время для корректного расчета 24-часового периода
    const utc3Now = getCurrentUTC3Time();
    const todayStart = getCurrentDayStartUTC3();

    // Определяем тип смены для текущего времени
    const currentShiftType = getShiftType(utc3Now);

    // Проверяем корректность 24-часового сброса
    const isResetValid = validate24HourReset();

    // Получаем все депозиты за текущий день (UTC+3)
    const todayDeposits = await prisma.processor_deposits.findMany({
      where: {
        processorId,
        createdAt: {
          gte: todayStart,
        },
      },
    });

    // Рассчитываем сумму уже существующих депозитов за день
    const existingTodaySum = todayDeposits.reduce((sum, d) => sum + d.amount, 0);
    
    // Общая сумма за день (существующие + новый депозит)
    const todaySum = existingTodaySum + data.amount;
    
    console.log(`💰 Расчет бонусов для депозита $${data.amount}:`);
    console.log(`   - Время UTC+3: ${utc3Now.toISOString()}`);
    console.log(`   - Начало дня UTC+3: ${todayStart.toISOString()}`);
    console.log(`   - Тип смены: ${currentShiftType}`);
    console.log(`   - Существующие депозиты за день: $${existingTodaySum}`);
    console.log(`   - Общая сумма за день: $${todaySum}`);
    console.log(`   - 24-часовой сброс: ${isResetValid ? '✅ Корректно' : '❌ Некорректно'}`);

    // Применяем единую сетку бонусов (не зависит от типа смены)
    const bonusGrid = await prisma.bonus_grid.findFirst({
      where: {
        isActive: true,
        minAmount: { lte: todaySum },
        OR: [
          { maxAmount: { gte: todaySum } },
          { maxAmount: null }
        ]
      },
      orderBy: { bonusPercentage: "desc" }
    });

    // Рассчитываем бонус только на основе сетки
    let bonusAmount = 0;
    if (bonusGrid) {
      const bonusRate = bonusGrid.bonusPercentage;
      bonusAmount = (data.amount * bonusRate) / 100;
      console.log(`   - Применена бонусная сетка: ${bonusGrid.minAmount} - ${bonusGrid.maxAmount || '∞'} = ${bonusGrid.bonusPercentage}%`);
      console.log(`   - Бонус за депозит: $${bonusAmount.toFixed(2)}`);
    } else {
      console.log(`   - ❌ Сетка бонусов не найдена для суммы $${todaySum}, бонус = $0`);
    }

    // Проверяем фиксированные бонусы за достижения
    if (bonusGrid && bonusGrid.fixedBonus && bonusGrid.fixedBonusMin && todaySum >= bonusGrid.fixedBonusMin) {
      bonusAmount += bonusGrid.fixedBonus;
      console.log(`   - Фиксированный бонус: +$${bonusGrid.fixedBonus} (порог: $${bonusGrid.fixedBonusMin})`);
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
            bonusAmount += (data.amount * motivation.value) / 100;
          } else if (motivation.type === 'FIXED_AMOUNT') {
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

    console.log(`💰 Расчет депозита ${data.amount} ${data.currency}:`);
    console.log(`   - Комиссия платформы (${platformCommissionPercent}%): ${platformCommissionAmount}`);
    console.log(`   - Заработок менеджера: ${processorEarnings}`);
    console.log(`   - Бонус менеджера: ${bonusAmount}`);

    // Создаем депозит
    const deposit = await prisma.processor_deposits.create({
      data: {
        processorId,
        playerId: data.playerId || `deposit_${Date.now()}`, // Fallback если нет playerId
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
          shiftType: currentShiftType.toUpperCase() as any,
          holdUntil,
          status: 'HELD', // Бонус в холде
        },
      });

      console.log(`   - Бонус $${bonusAmount} помещен в холд до ${holdUntil.toISOString()}`);
    }

    return NextResponse.json(deposit, { status: 201 });
  } catch (error) {
    console.error("❌ Подробная ошибка создания депозита:", error);
    console.error("❌ Stack trace:", error.stack);
    return NextResponse.json(
      { 
        error: "Внутренняя ошибка сервера",
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
