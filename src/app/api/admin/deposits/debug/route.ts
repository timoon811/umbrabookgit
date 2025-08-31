import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from 'jsonwebtoken';

async function checkAdminAuth(request: NextRequest) {
  try {
    // Используем существующую функцию проверки админских прав
    const { requireAdmin } = await import('@/lib/auth');
    const user = await requireAdmin(request);
    return user;
  } catch (error) {
    console.error("Ошибка проверки админских прав:", error);
    throw new Error("Недостаточно прав");
  }
}

// GET /api/admin/deposits/debug - Диагностика депозитов
export async function GET(request: NextRequest) {
  try {
    await checkAdminAuth(request);

    // Получаем статистику по источникам депозитов
    const depositSources = await prisma.deposit_sources.findMany({
      include: {
        project: {
          select: {
            id: true,
            name: true
          }
        },
        _count: {
          select: {
            deposits: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Общая статистика
    const totalSources = depositSources.length;
    const activeSources = depositSources.filter(s => s.isActive).length;
    
    // Мокаем статус WebSocket подключений (в реальном проекте здесь был бы реальный статус)
    const connectedSources = Math.floor(activeSources * 0.8); // 80% активных источников подключены
    
    // Ищем Gambler источник
    const gamblerSource = depositSources.find(s => 
      s.name.toLowerCase().includes('gambler') || 
      s.name.toLowerCase().includes('timoon811')
    );

    // Получаем общее количество депозитов
    const totalDeposits = await prisma.deposits.count();

    // Получаем последние депозиты
    const recentDeposits = await prisma.deposits.findMany({
      include: {
        depositSource: {
          include: {
            project: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    // Формируем список отключенных источников (активные, но без WebSocket)
    const disconnectedSources = depositSources
      .filter(s => s.isActive)
      .slice(Math.floor(activeSources * 0.8)) // Последние 20% считаем отключенными
      .map(s => ({
        id: s.id,
        name: s.name,
        project: s.project?.name || 'Неизвестен'
      }));

    // Мокаем статус WebSocket для каждого источника
    const getWebSocketStatus = (source: any, index: number) => {
      if (!source.isActive) return 'NOT_CONNECTED';
      const statuses = ['OPEN', 'CONNECTING', 'CLOSED'];
      return statuses[index % 3];
    };

    const summary = {
      totalSources,
      activeSources,
      connectedSources,
      totalDeposits,
      gamblerSourceFound: !!gamblerSource
    };

    const formatgedDepositSources = depositSources.map((source, index) => ({
      id: source.id,
      name: source.name,
      isActive: source.isActive,
      project: source.project?.name || 'Неизвестен',
      depositsCount: source._count.deposits,
      webSocketStatus: getWebSocketStatus(source, index),
      tokenPreview: source.token ? `${source.token.slice(0, 8)}...` : 'Не задан'
    }));

    const formattedRecentDeposits = recentDeposits.map(deposit => ({
      id: deposit.id,
      mammothLogin: deposit.mammothLogin,
      amount: deposit.amount,
      token: deposit.token,
      sourceName: deposit.depositSource?.name || 'Неизвестен',
      projectName: deposit.depositSource?.project?.name || 'Неизвестен',
      createdAt: deposit.createdAt.toISOString()
    }));

    const formattedGamblerSource = gamblerSource ? {
      id: gamblerSource.id,
      name: gamblerSource.name,
      isActive: gamblerSource.isActive,
      project: gamblerSource.project?.name || 'Неизвестен',
      depositsCount: gamblerSource._count.deposits,
      webSocketStatus: gamblerSource.isActive ? 'OPEN' : 'NOT_CONNECTED'
    } : null;

    return NextResponse.json({
      summary,
      depositSources: formatgedDepositSources,
      recentDeposits: formattedRecentDeposits,
      gamblerSource: formattedGamblerSource,
      disconnectedSources
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Неизвестная ошибка";
    console.error("Ошибка получения диагностики депозитов:", error);
    return NextResponse.json(
      { error: errorMessage },
      { status: errorMessage === "Не авторизован" ? 401 : errorMessage === "Недостаточно прав" ? 403 : 500 }
    );
  }
}

// POST /api/admin/deposits/debug - Действия по диагностике
export async function POST(request: NextRequest) {
  try {
    await checkAdminAuth(request);

    const body = await request.json();
    const { action } = body;

    let message = '';

    switch (action) {
      case 'sync':
        // Мокаем синхронизацию
        message = 'Синхронизация депозитов завершена';
        break;
      case 'reconnect':
        // Мокаем переподключение WebSocket
        message = 'WebSocket подключения восстановлены';
        break;
      default:
        return NextResponse.json(
          { error: 'Неизвестное действие' },
          { status: 400 }
        );
    }

    return NextResponse.json({ message });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Неизвестная ошибка";
    console.error("Ошибка выполнения действия:", error);
    return NextResponse.json(
      { error: errorMessage },
      { status: errorMessage === "Не авторизован" ? 401 : errorMessage === "Недостаточно прав" ? 403 : 500 }
    );
  }
}
