import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { prisma, connectPrisma, disconnectPrisma } from "@/lib/prisma";

const JWT_SECRET = process.env.JWT_SECRET || "umbra_platform_super_secret_jwt_key_2024";

export async function POST(request: NextRequest) {
  try {
    
    // Принудительно подключаемся к базе данных
    await connectPrisma();

    const cookieStore = await cookies();
    const token = cookieStore.get("auth-token")?.value;

    if (!token) {
      return NextResponse.json({ message: "Токен не найден" }, { status: 401 });
    }

    // Проверяем текущий токен
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      email: string;
      role: string;
      exp: number;
    };

    // Проверяем, что токен не истек
    const currentTime = Math.floor(Date.now() / 1000);
    if (decoded.exp < currentTime) {
      return NextResponse.json({ message: "Токен истек" }, { status: 401 });
    }

    // Проверяем, что пользователь все еще существует и активен
    const user = await prisma.users.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        role: true,
      },
    });

    if (!user) {
      return NextResponse.json({ message: "Пользователь не найден" }, { status: 403 });
    }

    // Создаем новый токен с тем же сроком действия
    const tokenExpiry = "7d"; // 7 дней
    const newToken = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: tokenExpiry }
    );

    // Создаем response с новым токеном
    const response = NextResponse.json({
      message: "Токен обновлен",
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    });

    // Устанавливаем новый токен в cookie
    const maxAge = 7 * 24 * 60 * 60; // 7 дней
    response.cookies.set("auth-token", newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: maxAge,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Ошибка обновления токена:", error);
    return NextResponse.json({ message: "Ошибка обновления токена" }, { status: 500 });
  } finally {
    // Всегда отключаемся от БД
    try {
      await disconnectPrisma();
    } catch (disconnectError) {
      console.error("Ошибка отключения от БД:", disconnectError);
    }
  }
}
