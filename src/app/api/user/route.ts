import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";

// GET /api/user - Получение информации о текущем пользователе
export async function GET(request: NextRequest) {
  try {
    // Проверяем авторизацию
    const authResult = await requireAuth(request);
    
    if ('error' in authResult) {
      return authResult.error;
    }

    const { user } = authResult;

    // Получаем базовую информацию о пользователе
    const baseUser = await prisma.users.findUnique({
      where: { id: user.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        isBlocked: true,
      },
    });

    if (!baseUser) {
      return NextResponse.json(
        { message: "Пользователь не найден" },
        { status: 404 }
      );
    }

    // Дополнительные данные для процессоров
    let additionalData = {};
    if (baseUser.role === 'PROCESSOR') {
      try {
        const deposits = await prisma.processor_deposits.findMany({
          where: { processorId: user.userId },
          select: {
            id: true,
            amount: true,
            bonusAmount: true,
            status: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        });

        const salaryRequests = await prisma.salary_requests.findMany({
          where: { processorId: user.userId },
          select: {
            id: true,
            requestedAmount: true,
            calculatedAmount: true,
            status: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 5,
        });
        
        additionalData = {
          processor_deposits: deposits,
          salary_requests: salaryRequests,
        };
      } catch (error) {
        console.error("❌ Ошибка получения данных процессора:", error);
        // Продолжаем без данных процессора
        additionalData = {
          processor_deposits: [],
          salary_requests: [],
        };
      }
    }

    // Кошельки для всех пользователей
    let wallets = [];
    try {
      wallets = await prisma.user_wallets.findMany({
        where: { userId: user.userId },
        select: {
          id: true,
          network: true,
          address: true,
          label: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' }
      });
    } catch (error) {
      console.error("❌ Ошибка получения кошельков:", error);
      // Продолжаем без кошельков
      wallets = [];
    }

    const fullUser = {
      ...baseUser,
      ...additionalData,
      wallets,
    };

    return NextResponse.json(fullUser);
  } catch (error: unknown) {
    console.error("❌ Ошибка получения данных пользователя:", error);
    return NextResponse.json(
      { message: "Ошибка сервера при получении данных пользователя" },
      { status: 500 }
    );
  }
}

// PATCH /api/user - Обновление профиля пользователя
export async function PATCH(request: NextRequest) {
  try {
    // Проверяем авторизацию
    const authResult = await requireAuth(request);
    
    if ('error' in authResult) {
      return authResult.error;
    }

    const { user } = authResult;

    const body = await request.json();
    const { name, email } = body;

    // Валидация данных
    if (name && (typeof name !== 'string' || name.trim().length < 2)) {
      return NextResponse.json(
        { message: "Имя должно содержать минимум 2 символа" },
        { status: 400 }
      );
    }

    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          { message: "Некорректный формат email" },
          { status: 400 }
        );
      }

      // Проверяем, не занят ли email другим пользователем
      const existingUser = await prisma.users.findFirst({
        where: {
          email: email.toLowerCase(),
          id: { not: user.userId }
        }
      });

      if (existingUser) {
        return NextResponse.json(
          { message: "Этот email уже используется другим пользователем" },
          { status: 409 }
        );
      }
    }

    // Обновляем профиль
    const updatedUser = await prisma.users.update({
      where: { id: user.userId },
      data: {
        ...(name && { name: name.trim() }),
        ...(email && { email: email.toLowerCase() }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(updatedUser);
    
  } catch (error: unknown) {
    console.error("❌ Ошибка обновления профиля:", error);
    return NextResponse.json(
      { message: "Ошибка сервера при обновлении профиля" },
      { status: 500 }
    );
  }
}
