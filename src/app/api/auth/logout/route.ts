import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    // Удаление cookie токена
    const cookieStore = await cookies();
    cookieStore.delete("auth-token");

    return NextResponse.json({
      message: "Успешный выход",
    });
  } catch (error) {
    console.error("Ошибка выхода:", error);
    return NextResponse.json(
      { message: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}
