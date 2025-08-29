import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

const JWT_SECRET = process.env.JWT_SECRET || "umbra_platform_super_secret_jwt_key_2024";

// Проверка авторизации
async function checkAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth-token")?.value;

  if (!token) {
    return null;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      role: string;
    };

    const user = await prisma.users.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        isBlocked: true,
      },
    });

    if (!user || user.status !== "APPROVED" || user.isBlocked) {
      return null;
    }

    return user;
  } catch (error) {
    console.error("Ошибка проверки токена:", error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Проверяем авторизацию
    const user = await checkAuth();
    if (!user) {
      return NextResponse.json(
        { error: "Не авторизован" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { pageId, pageTitle, type, comment } = body;

    // Валидация данных
    if (!pageId || !pageTitle || !type || !comment) {
      return NextResponse.json(
        { error: "Неполные данные" },
        { status: 400 }
      );
    }

    if (!['positive', 'negative'].includes(type)) {
      return NextResponse.json(
        { error: "Неверный тип фидбека" },
        { status: 400 }
      );
    }

    // Сохраняем фидбек в базе данных
    // Примечание: здесь можно создать таблицу feedback в базе данных
    // Пока что просто логируем для демонстрации
    console.log('Получен фидбек:', {
      userId: user.id,
      userEmail: user.email,
      pageId,
      pageTitle,
      type,
      comment,
      timestamp: new Date().toISOString()
    });

    // TODO: Создать таблицу feedback в базе данных
    // await prisma.feedback.create({
    //   data: {
    //     userId: user.id,
    //     pageId,
    //     pageTitle,
    //     type,
    //     comment,
    //   }
    // });

    return NextResponse.json({ 
      success: true, 
      message: "Фидбек успешно отправлен" 
    });

  } catch (error: any) {
    console.error("Ошибка обработки фидбека:", error);
    return NextResponse.json(
      { error: "Ошибка сервера" },
      { status: 500 }
    );
  }
}
