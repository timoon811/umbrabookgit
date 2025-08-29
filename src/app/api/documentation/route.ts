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
    return NextResponse.json(
      { error: "Не авторизован" },
      { status: 401 }
    );
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
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Пользователь не найден или заблокирован" },
        { status: 403 }
      );
    }

    return user;
  } catch (error) {
    console.error("Ошибка проверки токена:", error);
    return NextResponse.json(
      { error: "Недействительный токен" },
      { status: 401 }
    );
  }
}

export async function GET(request: NextRequest) {
  // Публичный API - авторизация не требуется для просмотра опубликованной документации
  try {
    // Получаем все опубликованные документы
    const documentation = await prisma.documentation.findMany({
      where: {
        isPublished: true,
      },
      select: {
        id: true,
        title: true,
        description: true,
        slug: true,
        sectionId: true,
        order: true,
        isPublished: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: [
        { order: 'asc' },
        { sectionId: 'asc' },
        { createdAt: 'desc' },
      ],
    });

    // Группируем по секциям
    const sections = documentation.reduce((acc, doc) => {
      if (!acc[doc.sectionId]) {
        acc[doc.sectionId] = [];
      }
      acc[doc.sectionId].push(doc);
      return acc;
    }, {} as Record<string, typeof documentation>);

    // Статистика
    const totalDocs = documentation.length;
    const sectionsCount = Object.keys(sections).length;
    const recentDocs = documentation.filter(doc =>
      new Date(doc.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    ).length;

    return NextResponse.json({
      documentation,
      sections,
      statistics: {
        total: totalDocs,
        sections: sectionsCount,
        recent: recentDocs,
      },
    });
  } catch (error: any) {
    console.error("Ошибка получения документации:", error);
    return NextResponse.json(
      { error: "Ошибка сервера" },
      { status: 500 }
    );
  }
}