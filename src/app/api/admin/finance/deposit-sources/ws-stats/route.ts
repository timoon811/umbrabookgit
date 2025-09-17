import { checkAdminAuthUserId } from "@/lib/admin-auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getWebSocketClient } from "@/lib/websocket-client";
import { requireAdminAuth } from '@/lib/api-auth';

// GET /api/admin/finance/deposit-sources/ws-stats - Получение статистики WebSocket подключений
export async function GET(request: NextRequest) {
  try {
  

    const authResult = await requireAdminAuth(request);
  
    if ('error' in authResult) {
    return authResult.error;
  }
  
  const { user } = authResult;


    await checkAdminAuthUserId();

    const wsClient = getWebSocketClient();
    const connectionStats = wsClient.getConnectionStats();

    // Получаем информацию об источниках
    const depositSources = await prisma.deposit_sources.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        project: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    // Объединяем статистику подключений с информацией об источниках
    const stats = depositSources.map(source => ({
      id: source.id,
      name: source.name,
      project: source.project,
      connection: connectionStats[source.id] || { state: -1, stateText: 'NOT_CONNECTED' }
    }));

    return NextResponse.json({ stats });
  } catch (error: any) {
    console.error("Ошибка при получении статистики WebSocket:", error);
    return NextResponse.json(
      { error: error.message || "Не удалось получить статистику WebSocket" },
      { status: error.message === "Не авторизован" ? 401 : error.message === "Недостаточно прав" ? 403 : 500 }
    );
  }
}

// POST /api/admin/finance/deposit-sources/ws-stats - Переподключение WebSocket
export async function POST(request: NextRequest) {
  try {
  

    const authResult = await requireAdminAuth(request);
  
    if ('error' in authResult) {
    return authResult.error;
  }
  
  const { user } = authResult;


    await checkAdminAuthUserId();

    const body = await request.json();
    const { action } = body;

    const wsClient = getWebSocketClient();

    if (action === 'reconnect') {
      wsClient.reconnectAll();
      return NextResponse.json({ message: "Переподключение запущено" });
    }

    return NextResponse.json({ error: "Неизвестное действие" }, { status: 400 });
  
  } catch (error: any) {
    console.error("Ошибка при управлении WebSocket:", error);
    return NextResponse.json(
      { error: error.message || "Не удалось выполнить действие" },
      { status: error.message === "Не авторизован" ? 401 : error.message === "Недостаточно прав" ? 403 : 500 }
    );
  }
}
