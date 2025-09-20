import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminAuth } from "@/lib/api-auth";
import { ShiftAutoCloser } from "@/lib/shift-auto-closer";

export async function GET(request: NextRequest) {
  try {
    // ДОБАВЛЕНО: Автозакрытие просроченных смен при просмотре логов
    await ShiftAutoCloser.checkAndCloseOverdueShifts();
    
    // Проверяем авторизацию администратора
      const authResult = await requireAdminAuth(request);
      
        if ('error' in authResult) {
        return authResult.error;
      }
    
      
        const { user } = authResult;
    
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const processorId = searchParams.get('processorId');
        const shiftType = searchParams.get('shiftType');
        const status = searchParams.get('status');
        const dateFrom = searchParams.get('dateFrom');
        const dateTo = searchParams.get('dateTo');
        const skip = (page - 1) * limit;
    
        // Формируем условия поиска
        const where: any = {};
    
        if (processorId) {
          where.processorId = processorId;
        }
    
        if (shiftType) {
          where.shiftType = shiftType;
        }
    
        if (status) {
          where.status = status;
        }
    
        if (dateFrom || dateTo) {
          where.shiftDate = {};
          if (dateFrom) {
            where.shiftDate.gte = new Date(dateFrom);
          }
          if (dateTo) {
            where.shiftDate.lte = new Date(dateTo);
          }
        }
    
        // Получаем логи смен с пагинацией
        const [shifts, total] = await Promise.all([
          prisma.processor_shifts.findMany({
            where,
            include: {
              processor: {
                select: {
                  name: true,
                  email: true,
                  telegram: true
                }
              }
            },
            orderBy: [
              { shiftDate: 'desc' },
              { createdAt: 'desc' }
            ],
            skip,
            take: limit,
          }),
          prisma.processor_shifts.count({ where }),
        ]);
    
        // Получаем статистику
        const stats = await prisma.processor_shifts.groupBy({
          by: ['status'],
          _count: {
            id: true,
          },
        });
    
        const statusStats = {
          total: total,
          scheduled: stats.find(s => s.status === 'SCHEDULED')?._count.id || 0,
          active: stats.find(s => s.status === 'ACTIVE')?._count.id || 0,
          completed: stats.find(s => s.status === 'COMPLETED')?._count.id || 0,
          missed: stats.find(s => s.status === 'MISSED')?._count.id || 0,
        };
    
        return NextResponse.json({
          shifts,
          stats: statusStats,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
          },
        });
      
  } catch (error: any) {
    console.error('Ошибка получения логов смен:', error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Проверяем авторизацию администратора
      const authResult = await requireAdminAuth(request);
      
        if ('error' in authResult) {
        return authResult.error;
      }
    
      
        const { user } = authResult;
    
        const data = await request.json();
        const { id, updates } = data;
    
        const updatedShift = await prisma.processor_shifts.update({
          where: { id },
          data: updates,
          include: {
            processor: {
              select: {
                name: true,
                email: true,
                telegram: true
              }
            }
          }
        });
    
        return NextResponse.json(updatedShift);
      
  } catch (error: any) {
    console.error('Ошибка обновления смены:', error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}