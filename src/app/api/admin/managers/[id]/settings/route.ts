import { checkAdminAuthUserId } from "@/lib/admin-auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminAuth } from '@/lib/api-auth';

// GET /api/admin/managers/[id]/settings - Получение настроек менеджера
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
  const authResult = await requireAdminAuth(request);
  
    if ('error' in authResult) {
    return authResult.error;
  }
  
  const { user } = authResult;


    await checkAdminAuthUserId();
    const { id: processorId } = await params;

    // Получаем данные пользователя
        const targetUser = await prisma.users.findUnique({
      where: { id: processorId },
      include: {
        assignedShifts: {
          include: {
            shiftSetting: true
          }
        }
      }
    });

        if (!targetUser) {
      return NextResponse.json(
        { error: "Пользователь не найден" },
        { status: 404 }
      );
    }

    // Получаем настройки бонусов (можно использовать дефолтные)
    const bonusSettings = await prisma.bonus_settings.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' }
    });

    const settings = {
      baseRate: 5.0, // Базовая ставка (можно добавить в схему пользователя)
      bonusPercentage: bonusSettings ? JSON.parse(bonusSettings.tiers || '[]')[0]?.percentage || 0 : 0,
      fixedBonus: 0, // Фиксированный бонус
      customBonusRules: bonusSettings?.description || "",
      commissionRate: 30.0, // Default commission rate
      shiftTypes: targetUser.assignedShifts.map(assignment => ({
        type: assignment.shiftSetting.shiftType,
        name: assignment.shiftSetting.name,
        startTime: `${String(assignment.shiftSetting.startHour).padStart(2, '0')}:${String(assignment.shiftSetting.startMinute).padStart(2, '0')}`,
        endTime: `${String(assignment.shiftSetting.endHour).padStart(2, '0')}:${String(assignment.shiftSetting.endMinute).padStart(2, '0')}`,
        isActive: assignment.isActive
      })),
      userInfo: {
        name: targetUser.name,
        email: targetUser.email,
        telegram: targetUser.telegram,
        role: targetUser.role,
        status: targetUser.status,
        isBlocked: targetUser.isBlocked
      }
    };

    return NextResponse.json(settings);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Неизвестная ошибка";
    console.error("Ошибка получения настроек менеджера:", error);
    return NextResponse.json(
      { error: errorMessage },
      { status: errorMessage === "Не авторизован" ? 401 : errorMessage === "Недостаточно прав" ? 403 : 500 }
    );
  }
}

// PUT /api/admin/managers/[id]/settings - Обновление настроек менеджера
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
  const authResult = await requireAdminAuth(request);
  
    if ('error' in authResult) {
    return authResult.error;
  }
  
  const { user } = authResult;


    await checkAdminAuthUserId();
    const { id: processorId } = await params;
    const data = await request.json();

    // Здесь можно сохранить настройки в базу данных
    // Пока возвращаем обновленные настройки
    const updatedSettings = {
      baseRate: data.baseRate || 5.0,
      bonusPercentage: data.bonusPercentage || 0,
      fixedBonus: data.fixedBonus || 0,
      customBonusRules: data.customBonusRules || "",
    };

    return NextResponse.json(updatedSettings);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Неизвестная ошибка";
    console.error("Ошибка обновления настроек менеджера:", error);
    return NextResponse.json(
      { error: errorMessage },
      { status: errorMessage === "Не авторизован" ? 401 : errorMessage === "Недостаточно прав" ? 403 : 500 }
    );
  }
}
