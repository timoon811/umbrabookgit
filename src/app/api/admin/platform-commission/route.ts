import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdminAuth } from '@/lib/api-auth';

export async function GET(req: NextRequest) {
  try {
    const authResponse = await verifyAdminAuth(req);
    if (authResponse) return authResponse;

    // Получаем настройки комиссии платформы (должна быть только одна запись)
    const commission = await prisma.platform_commission.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({
      success: true,
      commission: commission || {
        id: null,
        name: "Комиссия платформы",
        description: "Процент комиссии, который забирает платформа с депозитов",
        commissionPercent: 5.0,
        isActive: true
      }
    });
  } catch (error) {
    console.error('Ошибка получения настроек комиссии:', error);
    return NextResponse.json(
      { error: 'Ошибка получения настроек комиссии' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const authResponse = await verifyAdminAuth(req);
    if (authResponse) return authResponse;

    const body = await req.json();
    const { name, description, commissionPercent } = body;

    // Валидация данных
    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { error: 'Название настройки обязательно' },
        { status: 400 }
      );
    }

    if (commissionPercent === undefined || typeof commissionPercent !== 'number' || commissionPercent < 0 || commissionPercent > 50) {
      return NextResponse.json(
        { error: 'Процент комиссии должен быть числом от 0 до 50' },
        { status: 400 }
      );
    }

    // Деактивируем все существующие настройки
    await prisma.platform_commission.updateMany({
      where: { isActive: true },
      data: { isActive: false }
    });

    // Создаем новую настройку
    const commission = await prisma.platform_commission.create({
      data: {
        name,
        description: description || null,
        commissionPercent,
        isActive: true
      }
    });

    return NextResponse.json({
      success: true,
      commission
    });
  } catch (error) {
    console.error('Ошибка создания настроек комиссии:', error);
    return NextResponse.json(
      { error: 'Ошибка создания настроек комиссии' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const authResponse = await verifyAdminAuth(req);
    if (authResponse) return authResponse;

    const body = await req.json();
    const { id, name, description, commissionPercent } = body;

    // Валидация данных
    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { error: 'Название настройки обязательно' },
        { status: 400 }
      );
    }

    if (commissionPercent === undefined || typeof commissionPercent !== 'number' || commissionPercent < 0 || commissionPercent > 50) {
      return NextResponse.json(
        { error: 'Процент комиссии должен быть числом от 0 до 50' },
        { status: 400 }
      );
    }

    if (!id) {
      return NextResponse.json(
        { error: 'ID настройки обязателен для обновления' },
        { status: 400 }
      );
    }

    // Обновляем настройку
    const commission = await prisma.platform_commission.update({
      where: { id },
      data: {
        name,
        description: description || null,
        commissionPercent
      }
    });

    return NextResponse.json({
      success: true,
      commission
    });
  } catch (error) {
    console.error('Ошибка обновления настроек комиссии:', error);
    return NextResponse.json(
      { error: 'Ошибка обновления настроек комиссии' },
      { status: 500 }
    );
  }
}
