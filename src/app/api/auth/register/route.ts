import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { registerSchema, validateSchema } from "@/lib/zod-schemas";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Валидация с помощью Zod
    const validationResult = validateSchema(registerSchema, body);
    if (!validationResult.success) {
      return NextResponse.json(
        { message: "Ошибка валидации данных", errors: validationResult.errors },
        { status: 400 }
      );
    }

    const { name, email, telegram, password } = validationResult.data;

    if (telegram.length < 4) {
      return NextResponse.json(
        { message: "Telegram должен содержать минимум 3 символа после @" },
        { status: 400 }
      );
    }

    if (!/^@[a-zA-Z0-9_]{3,32}$/.test(telegram)) {
      return NextResponse.json(
        { message: "Telegram может содержать только буквы, цифры и подчеркивания" },
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
      where: { telegram: telegram.toLowerCase() },
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
        telegram: telegram.toLowerCase(),
        password: hashedPassword,
        role: "USER", // По умолчанию роль пользователя
        status: "PENDING", // Требуется одобрение администратора
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
      message: "Заявка на регистрацию отправлена! Администратор рассмотрит её в ближайшее время.",
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
