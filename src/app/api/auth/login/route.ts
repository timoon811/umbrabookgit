import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "umbra_platform_super_secret_jwt_key_2024";

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type")?.toLowerCase() || "";
    let email: string | undefined;
    let password: string | undefined;

    // Надежный парсинг тела запроса с поддержкой JSON и form data
    if (contentType.includes("application/json")) {
      const raw = await request.text();
      try {
        const parsed = raw ? JSON.parse(raw) : {};
        email = parsed?.email;
        password = parsed?.password;
      } catch {
        return NextResponse.json(
          { message: "Некорректный JSON в теле запроса" },
          { status: 400 }
        );
      }
    } else if (contentType.includes("application/x-www-form-urlencoded")) {
      const form = await request.formData();
      email = String(form.get("email") || "");
      password = String(form.get("password") || "");
    } else {
      // Пытаемся распарсить как JSON по умолчанию
      const raw = await request.text();
      try {
        const parsed = raw ? JSON.parse(raw) : {};
        email = parsed?.email;
        password = parsed?.password;
      } catch {
        // Последняя попытка: примитивный парсинг пары ключ=значение
        const params = new URLSearchParams(raw);
        email = email ?? params.get("email") ?? undefined;
        password = password ?? params.get("password") ?? undefined;
      }
    }

    // Валидация входных данных
    if (!email || !password) {
      return NextResponse.json(
        { message: "Email и пароль обязательны" },
        { status: 400 }
      );
    }

    // Поиск пользователя
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      return NextResponse.json(
        { message: "Неверный email или пароль" },
        { status: 401 }
      );
    }

    // Проверка статуса пользователя
    if (user.isBlocked) {
      return NextResponse.json(
        { message: "Аккаунт заблокирован" },
        { status: 403 }
      );
    }

    if (user.status === "PENDING") {
      return NextResponse.json(
        { message: "Аккаунт ожидает подтверждения администратора" },
        { status: 403 }
      );
    }

    if (user.status === "REJECTED") {
      return NextResponse.json(
        { message: "Регистрация отклонена администратором" },
        { status: 403 }
      );
    }

    // Проверка пароля
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return NextResponse.json(
        { message: "Неверный email или пароль" },
        { status: 401 }
      );
    }

    // Создание JWT токена
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Обновление времени последнего входа
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Установка cookie
    const cookieStore = await cookies();
    cookieStore.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 дней
    });

    // Логирование события входа
    await prisma.analytics.create({
      data: {
        event: "user_login",
        data: JSON.stringify({
          userId: user.id,
          email: user.email,
          userAgent: request.headers.get("user-agent"),
        }),
      },
    });

    return NextResponse.json({
      message: "Успешный вход",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Ошибка входа:", error);
    return NextResponse.json(
      { message: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}
