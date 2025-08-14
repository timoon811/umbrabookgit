import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

const JWT_SECRET = process.env.JWT_SECRET || "umbra_platform_super_secret_jwt_key_2024";

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth-token")?.value;

    if (!token) {
      const res = NextResponse.json({ message: "Не авторизован" }, { status: 401 });
      res.cookies.set("auth-token", "", { path: "/", httpOnly: true, maxAge: 0, expires: new Date(0), sameSite: "lax" });
      return res;
    }

    // Проверка токена
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      email: string;
      role: string;
    };

    // Получение актуальной информации о пользователе
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        isBlocked: true,
        telegram: true,
        lastLoginAt: true,
        createdAt: true,
      },
    });

    if (!user) {
      const res = NextResponse.json({ message: "Не авторизован" }, { status: 401 });
      res.cookies.set("auth-token", "", { path: "/", httpOnly: true, maxAge: 0, expires: new Date(0), sameSite: "lax" });
      return res;
    }

    if (user.isBlocked || user.status === "BANNED") {
      return NextResponse.json(
        { message: "Аккаунт заблокирован" },
        { status: 403 }
      );
    }

    if (user.status !== "APPROVED") {
      return NextResponse.json(
        { message: "Аккаунт не подтвержден" },
        { status: 403 }
      );
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Ошибка проверки токена:", error);
    const res = NextResponse.json({ message: "Недействительный токен" }, { status: 401 });
    res.cookies.set("auth-token", "", { path: "/", httpOnly: true, maxAge: 0, expires: new Date(0), sameSite: "lax" });
    return res;
  }
}
