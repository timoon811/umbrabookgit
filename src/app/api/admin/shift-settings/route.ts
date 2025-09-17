import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminAuth } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  try {
    
    const authResult = await requireAdminAuth(request);
  
    if ('error' in authResult) {
    return authResult.error;
  }

  
    // Получаем настройки смен или создаем дефолтные
    let settings = await prisma.shift_settings.findMany({
      orderBy: { shiftType: 'asc' }
    });

    // Если настроек нет, создаем дефолтные
    if (settings.length === 0) {
      const defaultSettings = [
        {
          shiftType: 'MORNING',
          startHour: 6,
          startMinute: 0,
          endHour: 14,
          endMinute: 0,
          timezone: '+3',
          isActive: true,
          name: 'Утренняя смена',
          description: '06:00 - 14:00 по времени UTC+3'
        },
        {
          shiftType: 'DAY',
          startHour: 14,
          startMinute: 0,
          endHour: 22,
          endMinute: 0,
          timezone: '+3',
          isActive: true,
          name: 'Дневная смена',
          description: '14:00 - 22:00 по времени UTC+3'
        },
        {
          shiftType: 'NIGHT',
          startHour: 22,
          startMinute: 0,
          endHour: 6,
          endMinute: 0,
          timezone: '+3',
          isActive: true,
          name: 'Ночная смена',
          description: '22:00 - 06:00 по времени UTC+3'
        }
      ];

      settings = await Promise.all(
        defaultSettings.map(setting => 
          prisma.shift_settings.create({ data: setting })
        )
      );
    }

    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Ошибка получения настроек смен:', error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    
    const authResult = await requireAdminAuth(request);
    
    if ('error' in authResult) {
      return authResult.error;
    }
    
    const { user } = authResult;
    const data = await request.json();
    const { id, updates } = data;

    // Валидация данных
    if (updates.startHour !== undefined && (updates.startHour < 0 || updates.startHour > 23)) {
      return NextResponse.json(
        { error: "Час начала должен быть от 0 до 23" },
        { status: 400 }
      );
    }

    if (updates.endHour !== undefined && (updates.endHour < 0 || updates.endHour > 23)) {
      return NextResponse.json(
        { error: "Час окончания должен быть от 0 до 23" },
        { status: 400 }
      );
    }

    if (updates.startMinute !== undefined && (updates.startMinute < 0 || updates.startMinute > 59)) {
      return NextResponse.json(
        { error: "Минуты начала должны быть от 0 до 59" },
        { status: 400 }
      );
    }

    if (updates.endMinute !== undefined && (updates.endMinute < 0 || updates.endMinute > 59)) {
      return NextResponse.json(
        { error: "Минуты окончания должны быть от 0 до 59" },
        { status: 400 }
      );
    }

    const updatedSetting = await prisma.shift_settings.update({
      where: { id },
      data: updates
    });

    return NextResponse.json({ setting: updatedSetting });
  } catch (error) {
    console.error('Ошибка обновления настроек смены:', error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    
    const authResult = await requireAdminAuth(request);
  
    if ('error' in authResult) {
    return authResult.error;
  }

  
    
    const { user } = authResult;

    const data = await request.json();
    const { shiftType, startHour, startMinute, endHour, endMinute, name, description } = data;

    // Валидация обязательных полей
    if (!shiftType || !['MORNING', 'DAY', 'NIGHT'].includes(shiftType)) {
      return NextResponse.json(
        { error: "Необходимо указать корректный тип смены" },
        { status: 400 }
      );
    }

    // Проверяем, что такая смена еще не существует
    const existingSetting = await prisma.shift_settings.findUnique({
      where: { shiftType }
    });

    if (existingSetting) {
      return NextResponse.json(
        { error: "Смена с таким типом уже существует" },
        { status: 400 }
      );
    }

    // Валидация времени
    if (startHour < 0 || startHour > 23) {
      return NextResponse.json(
        { error: "Час начала должен быть от 0 до 23" },
        { status: 400 }
      );
    }

    if (endHour < 0 || endHour > 23) {
      return NextResponse.json(
        { error: "Час окончания должен быть от 0 до 23" },
        { status: 400 }
      );
    }

    if (startMinute < 0 || startMinute > 59) {
      return NextResponse.json(
        { error: "Минуты начала должны быть от 0 до 59" },
        { status: 400 }
      );
    }

    if (endMinute < 0 || endMinute > 59) {
      return NextResponse.json(
        { error: "Минуты окончания должны быть от 0 до 59" },
        { status: 400 }
      );
    }

    const newSetting = await prisma.shift_settings.create({
      data: {
        shiftType,
        startHour,
        startMinute,
        endHour,
        endMinute,
        timezone: '+3',
        isActive: true,
        name: name || `${shiftType} смена`,
        description: description || `${startHour.toString().padStart(2, '0')}:${startMinute.toString().padStart(2, '0')} - ${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')} по времени UTC+3`
      }
    });

    return NextResponse.json({ setting: newSetting });
  } catch (error) {
    console.error('Ошибка создания настроек смены:', error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}
