import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    const { name, email, password, telegram } = await request.json();

    // Валидация входных данных
    if (!name || !email || !password || !telegram) {
      return NextResponse.json(
        { message: "Имя, email, пароль и Telegram обязательны" },
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

    // Валидация telegram
    if (!telegram.startsWith("@")) {
      return NextResponse.json(
        { message: "Telegram должен начинаться с @" },
        { status: 400 }
      );
    }
    
    if (telegram.length < 6) {
      return NextResponse.json(
        { message: "Telegram ник должен содержать минимум 5 символов после @" },
        { status: 400 }
      );
    }
    
    if (!/^@[a-zA-Z0-9_]+$/.test(telegram)) {
      return NextResponse.json(
        { message: "Telegram ник может содержать только буквы, цифры и _" },
        { status: 400 }
      );
    }

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

    // Проверка уникальности telegram
    const existingTelegram = await prisma.users.findUnique({
      where: { telegram },
    });

    if (existingTelegram) {
      return NextResponse.json(
        { message: "Пользователь с таким Telegram уже существует" },
        { status: 409 }
      );
    }

    // Хеширование пароля
    const hashedPassword = await bcrypt.hash(password, 10);

    // Создание пользователя
    const user = await prisma.users.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase(),
        password: hashedPassword,
        telegram: telegram,
        role: "USER",
        status: "PENDING", // Требует подтверждения администратора
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
      message: "Регистрация успешна. Ожидайте подтверждения администратора.",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        telegram: user.telegram,
        role: user.role,
        status: user.status,
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
