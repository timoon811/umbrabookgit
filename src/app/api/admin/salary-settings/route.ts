import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

// Проверка админских прав
async function checkAdminAuth(request: NextRequest) {
  const token = request.headers.get("authorization")?.replace("Bearer ", "");
  
  if (!token) {
    throw new Error("Не авторизован");
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
  
  if (!decoded || !decoded.userId) {
    throw new Error("Недействительный токен");
  }

  const user = await prisma.users.findUnique({
    where: { id: decoded.userId },
  });

  if (!user || user.role !== "ADMIN") {
    throw new Error("Недостаточно прав");
  }

  return decoded.userId;
}

// GET /api/admin/salary-settings - Получение всех настроек ЗП
export async function GET(request: NextRequest) {
  try {
    await checkAdminAuth(request);

    // Получаем основные настройки
    const salarySettings = await prisma.salary_settings.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' }
    });

    // Получаем сетку процентов по депозитам
    const depositGrid = await prisma.salary_deposit_grid.findMany({
      where: { isActive: true },
      orderBy: { minAmount: 'asc' }
    });

    // Получаем месячные бонусы
    const monthlyBonuses = await prisma.salary_monthly_bonus.findMany({
      where: { isActive: true },
      orderBy: { minAmount: 'asc' }
    });

    return NextResponse.json({
      salarySettings: salarySettings || {
        id: null,
        name: "Настройки по умолчанию",
        description: "Базовые настройки зарплаты",
        hourlyRate: 2.0,
        isActive: true,
      },
      depositGrid,
      monthlyBonuses,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Неизвестная ошибка";
    console.error("Ошибка получения настроек ЗП:", error);
    return NextResponse.json(
      { error: errorMessage },
      { status: errorMessage === "Не авторизован" ? 401 : errorMessage === "Недостаточно прав" ? 403 : 500 }
    );
  }
}

// POST /api/admin/salary-settings - Создание/обновление основных настроек ЗП
export async function POST(request: NextRequest) {
  try {
    await checkAdminAuth(request);
    const data = await request.json();

    // Деактивируем все существующие настройки
    await prisma.salary_settings.updateMany({
      where: { isActive: true },
      data: { isActive: false }
    });

    // Создаем новую запись настроек
    const salarySettings = await prisma.salary_settings.create({
      data: {
        name: data.name || "Настройки зарплаты",
        description: data.description,
        hourlyRate: parseFloat(data.hourlyRate) || 2.0,
        isActive: true,
      },
    });

    return NextResponse.json(salarySettings);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Неизвестная ошибка";
    console.error("Ошибка создания настроек ЗП:", error);
    return NextResponse.json(
      { error: errorMessage },
      { status: errorMessage === "Не авторизован" ? 401 : errorMessage === "Недостаточно прав" ? 403 : 500 }
    );
  }
}

// PUT /api/admin/salary-settings - Обновление настроек ЗП
export async function PUT(request: NextRequest) {
  try {
    await checkAdminAuth(request);
    const data = await request.json();

    if (!data.id) {
      return NextResponse.json({ error: "ID настроек обязателен" }, { status: 400 });
    }

    const salarySettings = await prisma.salary_settings.update({
      where: { id: data.id },
      data: {
        name: data.name,
        description: data.description,
        hourlyRate: parseFloat(data.hourlyRate),
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(salarySettings);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Неизвестная ошибка";
    console.error("Ошибка обновления настроек ЗП:", error);
    return NextResponse.json(
      { error: errorMessage },
      { status: errorMessage === "Не авторизован" ? 401 : errorMessage === "Недостаточно прав" ? 403 : 500 }
    );
  }
}
