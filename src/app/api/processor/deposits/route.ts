import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { 
  getCurrentUTCTime, 
  getCurrentDayStartUTC, 
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
    // Для админов показываем все депозиты, для процессоров - только их
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
    console.error("Ошибка получения депозитов процессора:", error);
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

    const commissionRate = bonusSettings?.baseCommissionRate || 30.0;
    let bonusRate = bonusSettings?.baseBonusRate || 5.0;

    // Проверяем дневную сумму для применения сетки бонусов
    // Используем UTC время для корректного расчета 24-часового периода
    const utcNow = getCurrentUTCTime();
    const todayStart = getCurrentDayStartUTC();
    
    // Проверяем корректность 24-часового сброса
    const isResetValid = validate24HourReset();
    
    // Получаем все депозиты за текущий день (UTC)
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
    console.log(`   - Время UTC: ${utcNow.toISOString()}`);
    console.log(`   - Начало дня UTC: ${todayStart.toISOString()}`);
    console.log(`   - Существующие депозиты за день: $${existingTodaySum}`);
    console.log(`   - Общая сумма за день: $${todaySum}`);
    console.log(`   - 24-часовой сброс: ${isResetValid ? '✅ Корректно' : '❌ Некорректно'}`);
    
    // Применяем сетку бонусов из базы данных
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

    if (bonusGrid) {
      bonusRate = bonusGrid.bonusPercentage;
      console.log(`   - Применена бонусная сетка: ${bonusGrid.minAmount} - ${bonusGrid.maxAmount || '∞'} = ${bonusGrid.bonusPercentage}%`);
    } else {
      console.log(`   - Применена базовая ставка: ${bonusRate}%`);
    }

    // Рассчитываем базовый бонус
    let bonusAmount = (data.amount * bonusRate) / 100;

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
        bonusRate,
        bonusAmount,
      },
    });

    return NextResponse.json(deposit, { status: 201 });
  } catch (error) {
    console.error("Ошибка создания депозита:", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}
