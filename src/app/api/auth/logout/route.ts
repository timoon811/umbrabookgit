import { NextRequest, NextResponse } from "next/server";

export async function POST() {
  try {
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

