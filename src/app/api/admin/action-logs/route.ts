import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminAuth } from "@/lib/api-auth";

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
  try {
    // Проверяем авторизацию администратора
    const authResult = await requireAdminAuth(request);
    
    if ('error' in authResult) {
      return authResult.error;
    }

    const { user } = authResult;

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const userId = searchParams.get('userId');
    const action = searchParams.get('action');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const skip = (page - 1) * limit;

    // Формируем условия поиска
    const where: any = {
      action: {
        in: ["SHIFT_START", "SHIFT_END"],
      },
    };

    if (userId) {
      where.userId = userId;
    }

    if (action) {
      where.action = action;
    }

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {
        where.createdAt.gte = new Date(dateFrom);
      }
      if (dateTo) {
        where.createdAt.lte = new Date(dateTo);
      }
    }

    // Получаем логи действий с информацией о пользователях
    const [rawLogs, total] = await Promise.all([
      prisma.analytics.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              telegram: true,
              role: true
            }
          }
        },
        orderBy: {
          createdAt: "desc",
        },
        skip,
        take: limit,
      }),
      prisma.analytics.count({ where }),
    ]);

    // Преобразуем логи, извлекая описание из metadata
    const logs = rawLogs.map(log => {
      let description = log.action;
      let shiftType = '';
      let duration = null;
      let autoEnded = false;

      try {
        const metadata = JSON.parse(log.metadata || '{}');
        description = metadata.description || getActionDescription(log.action);
        shiftType = metadata.shiftType || '';
        duration = metadata.duration || null;
        autoEnded = metadata.autoEnded || false;
      } catch (error) {
        description = getActionDescription(log.action);
      }

      return {
        id: log.id,
        action: log.action,
        description,
        createdAt: log.createdAt,
        user: log.user,
        shiftType,
        duration,
        autoEnded,
        ip: log.ip,
        userAgent: log.userAgent
      };
    });

    // Получаем статистику по действиям
    const actionStats = await prisma.analytics.groupBy({
      by: ['action'],
      where: {
        action: {
          in: ["SHIFT_START", "SHIFT_END"],
        },
      },
      _count: {
        id: true,
      },
    });

    const stats = {
      total: total,
      shiftStarts: actionStats.find(s => s.action === 'SHIFT_START')?._count.id || 0,
      shiftEnds: actionStats.find(s => s.action === 'SHIFT_END')?._count.id || 0,
    };

    return NextResponse.json({
      logs,
      stats,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Ошибка получения логов действий:', error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}