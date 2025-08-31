import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

const JWT_SECRET = process.env.JWT_SECRET || "umbra_platform_super_secret_jwt_key_2024";

export async function GET(request: NextRequest) {
  try {
    // Проверяем авторизацию
    const cookieStore = await cookies();
    const token = cookieStore.get("auth-token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      role: string;
    };

    if (decoded.role !== "PROCESSOR") {
      return NextResponse.json({ error: "Доступ запрещен" }, { status: 403 });
    }

    const processorId = decoded.userId;

    // Получаем параметры запроса
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const status = searchParams.get("status");
    const skip = (page - 1) * limit;

    // Формируем условия поиска
    const where: any = {
      processorId,
    };

    if (status && status !== "all") {
      where.status = status.toUpperCase();
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
  try {
    // Проверяем авторизацию
    const cookieStore = await cookies();
    const token = cookieStore.get("auth-token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      role: string;
    };

    if (decoded.role !== "PROCESSOR") {
      return NextResponse.json({ error: "Доступ запрещен" }, { status: 403 });
    }

    const processorId = decoded.userId;
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

    // Получаем настройки бонусов (пока используем значения по умолчанию)
    const bonusSettings = await prisma.bonus_settings.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
    });

    const commissionRate = bonusSettings?.baseCommissionRate || 30.0;
    const baseBonusRate = bonusSettings?.baseBonusRate || 5.0;

    // Рассчитываем бонус (пока без учета сетки)
    let bonusRate = baseBonusRate;
    
    // Проверяем дневную сумму для применения сетки бонусов
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    
    const todayDeposits = await prisma.processor_deposits.findMany({
      where: {
        processorId,
        status: "APPROVED",
        createdAt: {
          gte: todayStart,
        },
      },
    });

    const todaySum = todayDeposits.reduce((sum, d) => sum + d.amount, 0) + data.amount;
    
    // Применяем сетку бонусов (пример: если сумма за день >= 900, то 10% вместо 5%)
    if (todaySum >= 900) {
      bonusRate = 10.0;
    }

    const bonusAmount = (data.amount * bonusRate) / 100;

    // Определяем тип валюты
    const cryptoCurrencies = ['BTC', 'ETH', 'USDT', 'USDC', 'BNB', 'XRP', 'ADA', 'SOL', 'DOGE', 'MATIC'];
    const currencyType = cryptoCurrencies.includes(data.currency.toUpperCase()) ? 'CRYPTO' : 'FIAT';

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
        status: "PENDING",
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
