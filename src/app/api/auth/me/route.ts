import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  // Используем централизованную аутентификацию
  const authResult = await requireAuth(request);
  if ('error' in authResult) {
    return authResult.error;
  }

  const { user } = authResult;

  try {
    return NextResponse.json({
      user: {
        id: user.userId,
        email: user.email,
        name: user.name || 'Пользователь',
        role: user.role,
        status: 'APPROVED', // Если пользователь дошел до этой точки, он одобрен
        isBlocked: false // Если пользователь дошел до этой точки, он не заблокирован
      }
    });
  } catch (error: unknown) {
    console.error("Ошибка получения информации о пользователе:", error);
    
    if (error.name === "JsonWebTokenError") {
      return NextResponse.json(
        { message: "Недействительный токен" },
        { status: 401 }
      );
    }
    
    if (error.name === "TokenExpiredError") {
      return NextResponse.json(
        { message: "Токен истек" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { message: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}
