import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

// GET /api/admin/users/[id]/shifts - Получение назначенных смен пользователя
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAdminAuth(request);
  if ('error' in authResult) {
    return authResult.error;
  }

  try {
    const { id: userId } = await params;

    // Проверяем существование пользователя и его роль
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { id: true, role: true, name: true }
    });

    if (!user) {
      return NextResponse.json(
        { error: "Пользователь не найден" },
        { status: 404 }
      );
    }

    // Смены могут быть назначены только обработчикам
    if (user.role !== 'PROCESSOR') {
      return NextResponse.json({
        shifts: [],
        assignedCount: 0,
        message: "Назначение смен доступно только для обработчиков"
      });
    }

    // Получаем все смены и отмечаем назначенные
    const allShifts = await prisma.shift_settings.findMany({
      orderBy: { startHour: 'asc' }
    });

    const userAssignments = await prisma.user_shift_assignments.findMany({
      where: {
        userId,
        isActive: true
      },
      include: {
        shiftSetting: true
      }
    });

    const assignedShiftIds = new Set(userAssignments.map(a => a.shiftSettingId));

    const shiftsWithAssignment = allShifts.map(shift => ({
      id: shift.id,
      shiftType: shift.shiftType,
      name: shift.name || (shift.shiftType === 'MORNING' ? 'Утренняя смена' : 
                          shift.shiftType === 'DAY' ? 'Дневная смена' : 'Ночная смена'),
      timeDisplay: `${shift.startHour.toString().padStart(2, '0')}:${shift.startMinute.toString().padStart(2, '0')} - ${shift.endHour.toString().padStart(2, '0')}:${shift.endMinute.toString().padStart(2, '0')}`,
      isActive: shift.isActive,
      isAssigned: assignedShiftIds.has(shift.id),
      description: shift.description
    }));

    return NextResponse.json({
      shifts: shiftsWithAssignment,
      assignedCount: userAssignments.length
    });
  } catch (error) {
    console.error('Ошибка получения назначенных смен:', error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}

// POST /api/admin/users/[id]/shifts - Обновление назначенных смен пользователя
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAdminAuth(request);
  if ('error' in authResult) {
    return authResult.error;
  }

  try {
    const { id: userId } = await params;
    const { shiftIds } = await request.json();

    if (!Array.isArray(shiftIds)) {
      return NextResponse.json(
        { error: "shiftIds должен быть массивом" },
        { status: 400 }
      );
    }

    // Проверяем существование пользователя и его роль
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { id: true, role: true, name: true }
    });

    if (!user) {
      return NextResponse.json(
        { error: "Пользователь не найден" },
        { status: 404 }
      );
    }

    // Назначать смены можно только обработчикам
    if (user.role !== 'PROCESSOR') {
      return NextResponse.json(
        { error: "Назначать смены можно только пользователям с ролью PROCESSOR" },
        { status: 400 }
      );
    }

    // Проверяем существование всех указанных смен
    const shifts = await prisma.shift_settings.findMany({
      where: {
        id: { in: shiftIds }
      }
    });

    if (shifts.length !== shiftIds.length) {
      return NextResponse.json(
        { error: "Одна или несколько смен не найдены" },
        { status: 400 }
      );
    }

    // Транзакция для обновления назначений
    await prisma.$transaction(async (tx) => {
      // Деактивируем все текущие назначения
      await tx.user_shift_assignments.updateMany({
        where: {
          userId,
          isActive: true
        },
        data: {
          isActive: false,
          updatedAt: new Date()
        }
      });

      // Создаем новые назначения
      if (shiftIds.length > 0) {
        await tx.user_shift_assignments.createMany({
          data: shiftIds.map((shiftId: string) => ({
            userId,
            shiftSettingId: shiftId,
            assignedBy: authResult.user.userId,
            isActive: true
          })),
          skipDuplicates: true
        });
      }
    });

    return NextResponse.json({
      success: true,
      message: `Назначено ${shiftIds.length} смен пользователю`
    });
  } catch (error) {
    console.error('Ошибка обновления назначенных смен:', error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}
