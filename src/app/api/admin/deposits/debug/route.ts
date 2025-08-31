import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from 'jsonwebtoken';
import { getWebSocketClient } from "@/lib/websocket-client";

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
    
    // Получаем реальный статус WebSocket подключений
    const wsClient = getWebSocketClient();
    const connectionStats = wsClient.getConnectionStats();
    const connectedSources = Object.values(connectionStats).filter(stat => stat.stateText === 'OPEN').length;
    
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
      .filter(s => s.isActive && (!connectionStats[s.id] || connectionStats[s.id].stateText !== 'OPEN'))
      .map(s => ({
        id: s.id,
        name: s.name,
        project: s.project?.name || 'Неизвестен'
      }));

    // Получаем реальный статус WebSocket для каждого источника
    const getWebSocketStatus = (source: any) => {
      if (!source.isActive) return 'NOT_CONNECTED';
      const connectionInfo = connectionStats[source.id];
      return connectionInfo ? connectionInfo.stateText : 'NOT_CONNECTED';
    };

    const summary = {
      totalSources,
      activeSources,
      connectedSources,
      totalDeposits,
      gamblerSourceFound: !!gamblerSource
    };

    const formatgedDepositSources = depositSources.map((source) => ({
      id: source.id,
      name: source.name,
      isActive: source.isActive,
      project: source.project?.name || 'Неизвестен',
      depositsCount: source._count.deposits,
      webSocketStatus: getWebSocketStatus(source),
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
      webSocketStatus: getWebSocketStatus(gamblerSource)
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
    const wsClient = getWebSocketClient();

    switch (action) {
      case 'sync':
        // Выполняем принудительную синхронизацию активных источников
        try {
          const activeSources = await prisma.deposit_sources.findMany({
            where: { isActive: true }
          });
          
          for (const source of activeSources) {
            wsClient.addSource(source);
          }
          
          message = `Синхронизация завершена: проверено ${activeSources.length} активных источников`;
        } catch (error) {
          message = 'Ошибка синхронизации';
        }
        break;
      case 'reconnect':
        // Выполняем переподключение всех WebSocket соединений
        try {
          wsClient.reconnectAll();
          message = 'WebSocket подключения перезапущены';
        } catch (error) {
          message = 'Ошибка переподключения';
        }
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
