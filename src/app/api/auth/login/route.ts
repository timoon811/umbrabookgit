import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "umbra_platform_super_secret_jwt_key_2024";

// OPTIONS обработчик для CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { message: "Email и пароль обязательны" },
        { status: 400 }
      );
    }

    // Ищем пользователя по email
    const user = await prisma.users.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        email: true,
        name: true,
        password: true,
        role: true,
        status: true,
        isBlocked: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { message: "Неверный email или пароль" },
        { status: 401 }
      );
    }

    // Проверяем статус пользователя
    if (user.status === "PENDING") {
      return NextResponse.json(
        { message: "Ваша заявка на регистрацию ещё не одобрена администратором" },
        { status: 403 }
      );
    }

    if (user.status === "REJECTED") {
      return NextResponse.json(
        { message: "Ваша заявка на регистрацию была отклонена" },
        { status: 403 }
      );
    }

    if (user.isBlocked) {
      return NextResponse.json(
        { message: "Ваш аккаунт заблокирован" },
        { status: 403 }
      );
    }

    // Проверяем пароль
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { message: "Неверный email или пароль" },
        { status: 401 }
      );
    }

    // Создаем JWT токен
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Создаем ответ с токеном в cookie
    const response = NextResponse.json({
      message: "Вход выполнен успешно",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });

    // Устанавливаем cookie с токеном
    response.cookies.set("auth-token", token, {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 дней
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    // Устанавливаем заголовки для предотвращения кэширования
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");

    return response;
  } catch (error) {
    console.error("Ошибка при аутентификации:", error);
    return NextResponse.json(
      { message: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}
