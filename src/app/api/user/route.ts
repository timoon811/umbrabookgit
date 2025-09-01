import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";

// GET /api/user - Получение информации о текущем пользователе
export async function GET(request: NextRequest) {
  // Проверяем авторизацию
  const authResult = await requireAuth(request);
  if ('error' in authResult) {
    return authResult.error;
  }

  const { user } = authResult;

  try {
    // Получаем полную информацию о пользователе
    const fullUser = await prisma.users.findUnique({
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
        // Добавляем связанные данные в зависимости от роли
        ...(user.role === 'PROCESSOR' && {
          processor_deposits: {
            select: {
              id: true,
              amount: true,
              bonusAmount: true,
              status: true,
              createdAt: true,
            },
            orderBy: {
              createdAt: 'desc'
            },
            take: 10, // Последние 10 депозитов
          },
          salary_requests: {
            select: {
              id: true,
              requestedAmount: true,
              calculatedAmount: true,
              status: true,
              createdAt: true,
            },
            orderBy: {
              createdAt: 'desc'
            },
            take: 5, // Последние 5 заявок на зарплату
          }
        }),
        wallets: {
          select: {
            id: true,
            network: true,
            address: true,
            label: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      },
    });

    if (!fullUser) {
      return NextResponse.json(
        { message: "Пользователь не найден" },
        { status: 404 }
      );
    }

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
  // Проверяем авторизацию
  const authResult = await requireAuth(request);
  if ('error' in authResult) {
    return authResult.error;
  }

  const { user } = authResult;

  try {
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
