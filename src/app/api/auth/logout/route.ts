import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    // Создаем ответ с успешным выходом
    const response = NextResponse.json({
      message: "Успешный выход",
      success: true
    });

    // Правильно удаляем cookie токена со всеми параметрами
    response.cookies.set("auth-token", "", {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0,
      expires: new Date(0),
    });

    // Устанавливаем заголовки для предотвращения кэширования
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");

    return response;
  } catch (error) {
    console.error("Ошибка выхода:", error);
    
    // Даже при ошибке пытаемся очистить cookie
    const response = NextResponse.json(
      { message: "Выход выполнен", success: true },
      { status: 200 }
    );
    
    response.cookies.set("auth-token", "", {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0,
      expires: new Date(0),
    });

    return response;
  }
}

