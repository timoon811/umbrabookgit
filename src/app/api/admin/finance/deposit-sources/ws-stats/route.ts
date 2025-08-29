import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { getWebSocketClient } from "@/lib/websocket-client";

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

// GET /api/admin/finance/deposit-sources/ws-stats - Получение статистики WebSocket подключений
export async function GET(request: NextRequest) {
  try {
    await checkAdminAuth();

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
    await checkAdminAuth();

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
