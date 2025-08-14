import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
const JWT_SECRET = process.env.JWT_SECRET || "umbra_platform_super_secret_jwt_key_2024";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { currentPassword, newPassword, confirmPassword } = body;

    // Валидация входных данных
    if (!currentPassword || !newPassword || !confirmPassword) {
      return NextResponse.json(
        { error: "Все поля обязательны для заполнения" },
        { status: 400 }
      );
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { error: "Новый пароль и подтверждение не совпадают" },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: "Новый пароль должен содержать минимум 6 символов" },
        { status: 400 }
      );
    }

    // Получение токена из cookies
    const cookieStore = await cookies();
    const token = cookieStore.get("auth-token")?.value;

    if (!token) {
      return NextResponse.json(
        { error: "Токен аутентификации не найден" },
        { status: 401 }
      );
    }

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    } catch (error) {
      return NextResponse.json(
        { error: "Недействительный токен" },
        { status: 401 }
      );
    }

    // Получение текущего пользователя
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Пользователь не найден" },
        { status: 404 }
      );
    }

    // Проверка текущего пароля
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return NextResponse.json(
        { error: "Неверный текущий пароль" },
        { status: 400 }
      );
    }

    // Хеширование нового пароля
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);

    // Обновление пароля в базе данных
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedNewPassword,
        updatedAt: new Date(),
      },
    });

    // Логирование события в аналитику
    await prisma.analytics.create({
      data: {
        event: "password_changed",
        data: JSON.stringify({
          userId: user.id,
          email: user.email,
          timestamp: new Date(),
        }),
      },
    });

    return NextResponse.json(
      { message: "Пароль успешно изменен" },
      { status: 200 }
    );

  } catch (error) {
    console.error("Ошибка при смене пароля:", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}
