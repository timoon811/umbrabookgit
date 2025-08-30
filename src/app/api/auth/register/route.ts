import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json();

    // Валидация входных данных
    if (!name || !email || !password) {
      return NextResponse.json(
        { message: "Имя, email и пароль обязательны" },
        { status: 400 }
      );
    }

    if (name.trim().length < 2) {
      return NextResponse.json(
        { message: "Имя должно содержать минимум 2 символа" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { message: "Пароль должен содержать минимум 6 символов" },
        { status: 400 }
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { message: "Некорректный email адрес" },
        { status: 400 }
      );
    }

    if (!/(?=.*[a-zA-Z])(?=.*\d)/.test(password)) {
      return NextResponse.json(
        { message: "Пароль должен содержать буквы и цифры" },
        { status: 400 }
      );
    }

    // Валидация telegram удалена (поле больше не используется)

    // Проверка уникальности email
    const existingUser = await prisma.users.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "Пользователь с таким email уже существует" },
        { status: 409 }
      );
    }

    // Проверка уникальности telegram удалена (поле больше не используется)

    // Хеширование пароля
    const hashedPassword = await bcrypt.hash(password, 10);

    // Создание пользователя
    const user = await prisma.users.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase(),
        password: hashedPassword,
        role: "USER", // По умолчанию роль пользователя
      },
    });

    // Логирование события регистрации (временно отключено)
    // await prisma.analytics.create({
    //   userId: user.id,
    //   action: 'user_registered',
    //   metadata: JSON.stringify({
    //     event: "user_registration",
    //     email: user.email,
    //     userAgent: request.headers.get("user-agent"),
    //   }),
    // });

    return NextResponse.json({
      message: "Регистрация успешна. Добро пожаловать!",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Ошибка регистрации:", error);
    return NextResponse.json(
      { message: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}
