import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from '@/lib/api-auth';

export async function POST() {
  try {
  

    const authResult = await requireAuth(request);
  
    if ('error' in authResult) {
    return authResult.error;
  }
  
  const { user } = authResult;


    // Создаем ответ
    const response = NextResponse.json({
      message: "Успешный выход",
    });

    // Правильно удаляем cookie токена
    response.cookies.set("auth-token", "", {
      path: "/",
      httpOnly: true,
      maxAge: 0,
      expires: new Date(0),
      sameSite: "lax",
    });

    return response;
  } catch (error) {
    console.error("Ошибка выхода:", error);
    return NextResponse.json(
      { message: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}

