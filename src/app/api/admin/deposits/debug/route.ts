import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getWebSocketClient } from "@/lib/websocket-client";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

const JWT_SECRET = process.env.JWT_SECRET || "umbra_platform_super_secret_jwt_key_2024";

// Проверка прав администратора
async function checkAdminAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth-token")?.value;

  if (!token) {
    throw new Error("Не авторизован");
  }

  const decoded = jwt.verify(token, JWT_SECRET) as {
    userId: string;
    role: string;
  };

  if (decoded.role !== "ADMIN") {
    throw new Error("Недостаточно прав");
  }

  return decoded.userId;
}

// GET /api/admin/deposits/debug - Получение диагностической информации
export async function GET(request: NextRequest) {
  try {
    await checkAdminAuth();

    console.log('🔍 === ДИАГНОСТИКА СИСТЕМЫ ДЕПОЗИТОВ ===');

    // 1. Проверяем источники депозитов в БД
    const depositSources = await prisma.deposit_sources.findMany({
      include: {
        project: {
          select: {
            id: true,
            name: true,
            status: true
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

    console.log(`📊 Найдено источников депозитов: ${depositSources.length}`);
    depositSources.forEach(source => {
      console.log(`  - ${source.name} (${source.id}): ${source.isActive ? '✅ Активен' : '❌ Неактивен'}, депозитов: ${source._count.deposits}, проект: ${source.project.name}`);
      console.log(`    Токен: ${source.token.substring(0, 20)}...`);
    });

    // 2. Проверяем WebSocket подключения
    const wsClient = getWebSocketClient();
    const connectionStats = wsClient.getConnectionStats();

    console.log(`🔌 WebSocket подключения:`);
    Object.entries(connectionStats).forEach(([sourceId, stats]) => {
      const source = depositSources.find(s => s.id === sourceId);
      console.log(`  - ${source?.name || sourceId}: ${stats.stateText}`);
    });

    // 3. Проверяем депозиты
    const totalDeposits = await prisma.deposits.count();
    const recentDeposits = await prisma.deposits.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        depositSource: {
          select: {
            name: true,
            project: {
              select: {
                name: true
              }
            }
          }
        }
      }
    });

    console.log(`💰 Всего депозитов в БД: ${totalDeposits}`);
    console.log(`💰 Последние 10 депозитов:`);
    recentDeposits.forEach(deposit => {
      console.log(`  - ${deposit.id}: ${deposit.mammothLogin}, ${deposit.amount} ${deposit.token}, источник: ${deposit.depositSource.name}`);
    });

    // 4. Поиск источника "Gambler timoon811"
    const gamblerSource = depositSources.find(source => 
      source.name.toLowerCase().includes('gambler') && 
      source.name.toLowerCase().includes('timoon811')
    );

    if (gamblerSource) {
      console.log(`🎯 Найден источник Gambler timoon811:`);
      console.log(`  - ID: ${gamblerSource.id}`);
      console.log(`  - Активен: ${gamblerSource.isActive ? '✅' : '❌'}`);
      console.log(`  - Проект: ${gamblerSource.project.name}`);
      console.log(`  - Депозитов: ${gamblerSource._count.deposits}`);
      console.log(`  - WebSocket: ${connectionStats[gamblerSource.id]?.stateText || 'НЕ ПОДКЛЮЧЕН'}`);

      // Проверяем депозиты этого источника
      const gamblerDeposits = await prisma.deposits.findMany({
        where: { depositSourceId: gamblerSource.id },
        orderBy: { createdAt: 'desc' },
        take: 5
      });

      console.log(`  - Последние депозиты:`);
      gamblerDeposits.forEach(deposit => {
        console.log(`    ${deposit.id}: ${deposit.mammothLogin}, ${deposit.amount} ${deposit.token} (${new Date(deposit.createdAt).toISOString()})`);
      });
    } else {
      console.log(`❌ Источник "Gambler timoon811" не найден!`);
    }

    // 5. Активные источники без WebSocket подключений
    const activeSources = depositSources.filter(s => s.isActive);
    const disconnectedSources = activeSources.filter(s => !connectionStats[s.id] || connectionStats[s.id].stateText !== 'OPEN');

    if (disconnectedSources.length > 0) {
      console.log(`⚠️ Активные источники БЕЗ WebSocket подключения:`);
      disconnectedSources.forEach(source => {
        console.log(`  - ${source.name} (${source.id})`);
      });
    }

    return NextResponse.json({
      summary: {
        totalSources: depositSources.length,
        activeSources: activeSources.length,
        connectedSources: Object.keys(connectionStats).length,
        totalDeposits,
        gamblerSourceFound: !!gamblerSource
      },
      depositSources: depositSources.map(source => ({
        id: source.id,
        name: source.name,
        isActive: source.isActive,
        project: source.project.name,
        depositsCount: source._count.deposits,
        webSocketStatus: connectionStats[source.id]?.stateText || 'NOT_CONNECTED',
        tokenPreview: source.token.substring(0, 20) + '...'
      })),
      recentDeposits: recentDeposits.map(deposit => ({
        id: deposit.id,
        mammothLogin: deposit.mammothLogin,
        amount: deposit.amount,
        token: deposit.token,
        sourceName: deposit.depositSource.name,
        projectName: deposit.depositSource.project.name,
        createdAt: deposit.createdAt
      })),
      gamblerSource: gamblerSource ? {
        id: gamblerSource.id,
        name: gamblerSource.name,
        isActive: gamblerSource.isActive,
        project: gamblerSource.project.name,
        depositsCount: gamblerSource._count.deposits,
        webSocketStatus: connectionStats[gamblerSource.id]?.stateText || 'NOT_CONNECTED'
      } : null,
      disconnectedSources: disconnectedSources.map(source => ({
        id: source.id,
        name: source.name,
        project: source.project.name
      }))
    });

  } catch (error: any) {
    console.error("❌ Ошибка диагностики:", error);
    return NextResponse.json(
      { error: error.message || "Ошибка диагностики" },
      { status: error.message === "Не авторизован" ? 401 : error.message === "Недостаточно прав" ? 403 : 500 }
    );
  }
}

// POST /api/admin/deposits/debug - Принудительное переподключение и пересинхронизация
export async function POST(request: NextRequest) {
  try {
    await checkAdminAuth();

    const body = await request.json();
    const { action } = body;

    const wsClient = getWebSocketClient();

    if (action === 'reconnect') {
      console.log('🔄 Принудительное переподключение всех WebSocket соединений...');
      wsClient.reconnectAll();
      return NextResponse.json({ message: "Переподключение запущено" });
    }

    if (action === 'sync') {
      console.log('🔄 Синхронизация источников с WebSocket клиентом...');
      
      // Получаем все активные источники
      const activeSources = await prisma.deposit_sources.findMany({
        where: { isActive: true }
      });

      // Переподключаем каждый источник
      for (const source of activeSources) {
        wsClient.updateSource({
          id: source.id,
          name: source.name,
          token: source.token,
          projectId: source.projectId,
          isActive: source.isActive
        });
      }

      return NextResponse.json({ 
        message: "Синхронизация завершена", 
        syncedSources: activeSources.length 
      });
    }

    return NextResponse.json({ error: "Неизвестное действие" }, { status: 400 });

  } catch (error: any) {
    console.error("❌ Ошибка управления:", error);
    return NextResponse.json(
      { error: error.message || "Ошибка управления" },
      { status: error.message === "Не авторизован" ? 401 : error.message === "Недостаточно прав" ? 403 : 500 }
    );
  }
}
