import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";

// POST /api/auth/verify - Проверка токена и очистка невалидных cookies
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const authToken = cookieStore.get("auth-token")?.value;
    
    if (!authToken || authToken.length <= 50) {
      return NextResponse.json({ isValid: false, user: null });
    }
    
    // Проверяем валидность токена
    const user = await verifyToken(authToken);
    
    if (user) {
      return NextResponse.json({ isValid: true, user });
    } else {
      // Удаляем невалидный токен
      cookieStore.delete("auth-token");
      return NextResponse.json({ isValid: false, user: null });
    }
  } catch (error) {
    console.error("❌ Ошибка проверки токена:", error);
    
    // Удаляем невалидный токен
    const cookieStore = await cookies();
    cookieStore.delete("auth-token");
    
    return NextResponse.json(
      { isValid: false, user: null, error: "Ошибка проверки токена" },
      { status: 500 }
    );
  }
}
