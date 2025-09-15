import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireManagerAuth } from "@/lib/api-auth";

// Функция для получения описания действия по умолчанию
function getActionDescription(action: string): string {
  switch (action) {
    case 'SHIFT_START':
      return 'Начал смену';
    case 'SHIFT_END':
      return 'Завершил смену';
    default:
      return action.replace('SHIFT_', '').replace(/_/g, ' ').toLowerCase();
  }
}

export async function GET(request: NextRequest) {
  // Проверяем авторизацию
  const authResult = await requireManagerAuth(request);
  if ('error' in authResult) {
    return authResult.error;
  }

  const { user } = authResult;

  try {
    // Получаем параметры запроса
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    // Получаем логи действий менеджера из таблицы analytics
    const [rawLogs, total] = await Promise.all([
      prisma.analytics.findMany({
        where: {
          userId: user.userId,
          action: {
            in: ["SHIFT_START", "SHIFT_END"],
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        skip,
        take: limit,
      }),
      prisma.analytics.count({
        where: {
          userId: user.userId,
          action: {
            in: ["SHIFT_START", "SHIFT_END"],
          },
        },
      }),
    ]);

    // Преобразуем логи, извлекая описание из metadata
    const logs = rawLogs.map(log => {
      let description = log.action;
      try {
        const metadata = JSON.parse(log.metadata || '{}');
        description = metadata.description || getActionDescription(log.action);
      } catch (error) {
        description = getActionDescription(log.action);
      }

      return {
        id: log.id,
        action: log.action,
        description,
        createdAt: log.createdAt,
        metadata: log.metadata
      };
    });

    return NextResponse.json({
      logs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Ошибка получения логов действий:", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}
