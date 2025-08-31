import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

async function checkAdminAuth(request: NextRequest) {
  try {
    const { requireAdmin } = await import('@/lib/auth');
    const user = await requireAdmin(request);
    return user;
  } catch (error) {
    console.error("Ошибка проверки админских прав:", error);
    throw new Error("Недостаточно прав");
  }
}

// POST /api/admin/deposits/test - Создание тестового депозита
export async function POST(request: NextRequest) {
  try {
    await checkAdminAuth(request);

    // Получаем первый активный источник депозитов
    const depositSource = await prisma.deposit_sources.findFirst({
      where: { isActive: true },
      include: { project: true }
    });

    if (!depositSource) {
      return NextResponse.json(
        { error: "Активные источники депозитов не найдены" },
        { status: 404 }
      );
    }

    // Генерируем тестовые данные
    const testDeposit = {
      id: `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      depositSourceId: depositSource.id,
      mammothId: `test_mammoth_${Math.floor(Math.random() * 10000)}`,
      mammothLogin: `testuser${Math.floor(Math.random() * 1000)}`,
      mammothCountry: ['RU', 'BY', 'KZ', 'UA'][Math.floor(Math.random() * 4)],
      mammothPromo: Math.random() > 0.5 ? `PROMO${Math.floor(Math.random() * 100)}` : null,
      token: ['USDT', 'BTC', 'ETH', 'TRX'][Math.floor(Math.random() * 4)],
      amount: Math.floor(Math.random() * 1000) + 100, // 100-1100
      amountUsd: 0, // будет рассчитан
      workerPercent: Math.floor(Math.random() * 30) + 10, // 10-40%
      domain: `test${Math.floor(Math.random() * 100)}.example.com`,
      txHash: `0x${Math.random().toString(16).substr(2, 64)}`,
    };

    // Рассчитываем USD сумму (для теста просто умножаем на коэффициент)
    const tokenRates = { USDT: 1, BTC: 45000, ETH: 3000, TRX: 0.1 };
    testDeposit.amountUsd = testDeposit.amount * (tokenRates[testDeposit.token as keyof typeof tokenRates] || 1);

    // Рассчитываем комиссию
    const commissionPercent = depositSource.commission;
    const commissionAmount = (testDeposit.amount * commissionPercent) / 100;
    const commissionAmountUsd = (testDeposit.amountUsd * commissionPercent) / 100;
    const netAmount = testDeposit.amount - commissionAmount;
    const netAmountUsd = testDeposit.amountUsd - commissionAmountUsd;

    // Создаем депозит в базе
    const deposit = await prisma.deposits.create({
      data: {
        ...testDeposit,
        commissionPercent,
        commissionAmount,
        commissionAmountUsd,
        netAmount,
        netAmountUsd,
        processed: false,
      },
      include: {
        depositSource: {
          include: {
            project: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: "Тестовый депозит создан",
      deposit: {
        id: deposit.id,
        amount: deposit.amount,
        token: deposit.token,
        amountUsd: deposit.amountUsd,
        mammothLogin: deposit.mammothLogin,
        source: deposit.depositSource.name,
        project: deposit.depositSource.project?.name,
      }
    });

  } catch (error: any) {
    console.error('Ошибка создания тестового депозита:', error);
    
    if (error.message === "Недостаточно прав") {
      return NextResponse.json(
        { error: 'Недостаточно прав' },
        { status: 403 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || 'Ошибка сервера' },
      { status: 500 }
    );
  }
}

// GET /api/admin/deposits/test - Получение статистики тестовых депозитов
export async function GET(request: NextRequest) {
  try {
    await checkAdminAuth(request);

    const testDepositsCount = await prisma.deposits.count({
      where: {
        id: {
          startsWith: 'test_'
        }
      }
    });

    const lastTestDeposits = await prisma.deposits.findMany({
      where: {
        id: {
          startsWith: 'test_'
        }
      },
      include: {
        depositSource: {
          include: {
            project: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    return NextResponse.json({
      testDepositsCount,
      lastTestDeposits: lastTestDeposits.map(d => ({
        id: d.id,
        amount: d.amount,
        token: d.token,
        amountUsd: d.amountUsd,
        mammothLogin: d.mammothLogin,
        source: d.depositSource.name,
        project: d.depositSource.project?.name,
        createdAt: d.createdAt
      }))
    });

  } catch (error: any) {
    console.error('Ошибка получения тестовых депозитов:', error);
    
    if (error.message === "Недостаточно прав") {
      return NextResponse.json(
        { error: 'Недостаточно прав' },
        { status: 403 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || 'Ошибка сервера' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/deposits/test - Удаление всех тестовых депозитов
export async function DELETE(request: NextRequest) {
  try {
    await checkAdminAuth(request);

    const result = await prisma.deposits.deleteMany({
      where: {
        id: {
          startsWith: 'test_'
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: `Удалено ${result.count} тестовых депозитов`,
      deletedCount: result.count
    });

  } catch (error: any) {
    console.error('Ошибка удаления тестовых депозитов:', error);
    
    if (error.message === "Недостаточно прав") {
      return NextResponse.json(
        { error: 'Недостаточно прав' },
        { status: 403 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || 'Ошибка сервера' },
      { status: 500 }
    );
  }
}
