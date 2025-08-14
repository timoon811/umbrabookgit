import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Публичный список воркспейсов для хедера
export async function GET(_req: NextRequest) {
  try {
    // Проверяем подключение к базе данных
    try {
      await prisma.$connect();
    } catch (dbError: unknown) {
      console.error("Ошибка подключения к БД:", dbError);
      return NextResponse.json(
        { message: "Ошибка подключения к базе данных" },
        { status: 503 }
      );
    }

    const categories = await prisma.category.findMany({
      where: { isActive: true },
      select: { key: true, name: true, order: true },
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    });
    
    return NextResponse.json(categories);
  } catch (error: unknown) {
    console.error("Ошибка получения воркспейсов:", error);
    
    // Более детальная обработка ошибок
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P1001') {
      return NextResponse.json(
        { message: "Ошибка подключения к базе данных" },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { message: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  } finally {
    // Всегда отключаемся от БД
    try {
      await prisma.$disconnect();
    } catch (disconnectError) {
      console.error("Ошибка отключения от БД:", disconnectError);
    }
  }
}


