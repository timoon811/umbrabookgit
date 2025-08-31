import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getWebSocketClient } from "@/lib/websocket-client";

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

// GET /api/admin/deposits/websocket-diagnosis - Детальная диагностика WebSocket
export async function GET(request: NextRequest) {
  try {
    await checkAdminAuth(request);

    const wsClient = getWebSocketClient();
    const connectionStats = wsClient.getConnectionStats();

    // Получаем все источники депозитов
    const allSources = await prisma.deposit_sources.findMany({
      include: {
        project: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Анализируем каждый источник
    const sourceAnalysis = allSources.map(source => {
      const connectionInfo = connectionStats[source.id];
      const isConnected = connectionInfo && connectionInfo.stateText === 'OPEN';
      
      // Проверяем токен
      const hasValidToken = source.token && source.token.length > 10;
      
      // Генерируем URL, который будет использоваться
      const encodedToken = source.token ? encodeURIComponent(`Worker ${source.token}`) : '';
      const wsUrl = `wss://gambler-panel.com/api/ws?token=${encodedToken}&connectionType=bot`;

      return {
        id: source.id,
        name: source.name,
        isActive: source.isActive,
        project: source.project?.name || 'Неизвестен',
        token: {
          exists: !!source.token,
          length: source.token?.length || 0,
          preview: source.token ? `${source.token.slice(0, 8)}...${source.token.slice(-4)}` : 'НЕТ ТОКЕНА',
          isValid: hasValidToken
        },
        websocket: {
          connected: isConnected,
          status: connectionInfo?.stateText || 'NOT_CONNECTED',
          state: connectionInfo?.state || -1,
          url: wsUrl
        },
        issues: [
          ...((!source.isActive) ? ['Источник неактивен'] : []),
          ...((!hasValidToken) ? ['Некорректный токен'] : []),
          ...(source.isActive && !isConnected ? ['WebSocket не подключен'] : [])
        ]
      };
    });

    // Статистика
    const stats = {
      total: allSources.length,
      active: allSources.filter(s => s.isActive).length,
      withValidTokens: allSources.filter(s => s.token && s.token.length > 10).length,
      connected: Object.values(connectionStats).filter(stat => stat.stateText === 'OPEN').length,
      connecting: Object.values(connectionStats).filter(stat => stat.stateText === 'CONNECTING').length,
      failed: Object.values(connectionStats).filter(stat => stat.stateText === 'CLOSED').length
    };

    // Группируем проблемы
    const commonIssues = {
      inactiveSources: sourceAnalysis.filter(s => !s.isActive).length,
      invalidTokens: sourceAnalysis.filter(s => !s.token.isValid).length,
      connectionProblems: sourceAnalysis.filter(s => s.isActive && s.token.isValid && !s.websocket.connected).length
    };

    return NextResponse.json({
      stats,
      commonIssues,
      sources: sourceAnalysis,
      recommendations: generateRecommendations(sourceAnalysis, stats)
    });

  } catch (error: any) {
    console.error('Ошибка диагностики WebSocket:', error);
    
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

function generateRecommendations(sources: any[], stats: any) {
  const recommendations = [];

  // Проверяем неактивные источники
  const inactiveSources = sources.filter(s => !s.isActive);
  if (inactiveSources.length > 0) {
    recommendations.push({
      type: 'warning',
      title: 'Неактивные источники',
      description: `${inactiveSources.length} источников неактивны. Активируйте их для получения депозитов.`,
      action: 'Перейти в управление источниками и активировать нужные'
    });
  }

  // Проверяем токены
  const invalidTokens = sources.filter(s => !s.token.isValid);
  if (invalidTokens.length > 0) {
    recommendations.push({
      type: 'error',
      title: 'Некорректные токены',
      description: `${invalidTokens.length} источников имеют некорректные токены.`,
      action: 'Обновить токены для этих источников'
    });
  }

  // Проверяем подключения
  const connectionProblems = sources.filter(s => s.isActive && s.token.isValid && !s.websocket.connected);
  if (connectionProblems.length > 0) {
    recommendations.push({
      type: 'error',
      title: 'Проблемы с подключением',
      description: `${connectionProblems.length} активных источников с корректными токенами не могут подключиться.`,
      action: 'Проверить доступность gambler-panel.com или выполнить переподключение'
    });
  }

  // Проверяем соотношение подключенных к активным
  if (stats.active > 0 && stats.connected / stats.active < 0.5) {
    recommendations.push({
      type: 'warning',
      title: 'Низкий процент подключений',
      description: `Менее 50% активных источников подключены (${stats.connected}/${stats.active}).`,
      action: 'Выполнить переподключение или проверить сетевое соединение'
    });
  }

  // Если все хорошо
  if (recommendations.length === 0 && stats.active > 0) {
    recommendations.push({
      type: 'success',
      title: 'Все в порядке',
      description: `${stats.connected} из ${stats.active} активных источников успешно подключены.`,
      action: 'Продолжить мониторинг'
    });
  }

  return recommendations;
}

// POST /api/admin/deposits/websocket-diagnosis - Исправление проблем
export async function POST(request: NextRequest) {
  try {
    await checkAdminAuth(request);

    const body = await request.json();
    const { action, sourceId } = body;

    const wsClient = getWebSocketClient();
    let message = '';

    switch (action) {
      case 'reconnect_source':
        if (!sourceId) {
          return NextResponse.json(
            { error: 'Не указан ID источника' },
            { status: 400 }
          );
        }

        const source = await prisma.deposit_sources.findUnique({
          where: { id: sourceId }
        });

        if (!source) {
          return NextResponse.json(
            { error: 'Источник не найден' },
            { status: 404 }
          );
        }

        wsClient.updateSource(source);
        message = `Переподключение источника ${source.name} выполнено`;
        break;

      case 'reconnect_all':
        wsClient.reconnectAll();
        message = 'Переподключение всех источников выполнено';
        break;

      case 'sync_sources':
        const activeSources = await prisma.deposit_sources.findMany({
          where: { isActive: true }
        });
        
        for (const activeSource of activeSources) {
          wsClient.addSource(activeSource);
        }
        
        message = `Синхронизация выполнена для ${activeSources.length} активных источников`;
        break;

      default:
        return NextResponse.json(
          { error: 'Неизвестное действие' },
          { status: 400 }
        );
    }

    return NextResponse.json({ 
      success: true,
      message 
    });

  } catch (error: any) {
    console.error('Ошибка исправления проблем WebSocket:', error);
    
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
