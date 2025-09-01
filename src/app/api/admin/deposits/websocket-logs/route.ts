import { NextRequest, NextResponse } from 'next/server';
import { getWebSocketClient } from '@/lib/websocket-client';
import { verifyToken } from '@/lib/api-auth';

async function checkAdminAuth(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    if (!user || user.role !== 'admin') {
      throw new Error("Недостаточно прав");
    }
  } catch (error) {
    console.error("Ошибка проверки прав администратора:", error);
    throw new Error("Недостаточно прав");
  }
}

// GET /api/admin/deposits/websocket-logs - Получение логов WebSocket
export async function GET(request: NextRequest) {
  try {
    await checkAdminAuth(request);

    const { searchParams } = new URL(request.url);
    const sourceId = searchParams.get('sourceId');

    const wsClient = getWebSocketClient();
    const logs = wsClient.getLogs(sourceId || undefined);

    return NextResponse.json({
      success: true,
      logs: logs.map(log => ({
        ...log,
        timestamp: log.timestamp.toISOString()
      }))
    });

  } catch (error: any) {
    console.error('Ошибка получения логов WebSocket:', error);
    return NextResponse.json(
      { error: error.message || 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/deposits/websocket-logs - Очистка логов WebSocket
export async function DELETE(request: NextRequest) {
  try {
    await checkAdminAuth(request);

    const wsClient = getWebSocketClient();
    wsClient.clearLogs();

    return NextResponse.json({
      success: true,
      message: 'Логи WebSocket успешно очищены'
    });

  } catch (error: any) {
    console.error('Ошибка очистки логов WebSocket:', error);
    return NextResponse.json(
      { error: error.message || 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
