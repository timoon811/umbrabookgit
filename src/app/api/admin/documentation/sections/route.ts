import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

const JWT_SECRET = process.env.JWT_SECRET || "umbra_platform_super_secret_jwt_key_2024";

// Проверка прав администратора
async function checkAdminAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth-token")?.value;

  if (!token) {
    throw new Error("Не авторизован");
  }

  const decoded = jwt.verify(token, JWT_SECRET) as {
    userId: string;
    role: string;
  };

  if (decoded.role !== "ADMIN") {
    throw new Error("Недостаточно прав");
  }

  return decoded.userId;
}

// GET /api/admin/documentation/sections - Получение списка разделов
export async function GET(request: NextRequest) {
  try {
    await checkAdminAuth();

    const sections = await prisma.documentation_sections.findMany({
      orderBy: [
        { order: 'asc' },
        { createdAt: 'asc' }
      ],
      select: {
        id: true,
        key: true,
        name: true,
        description: true,
        order: true,
        isVisible: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            pages: true
          }
        }
      }
    });

    return NextResponse.json({ sections });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Неизвестная ошибка";
    console.error("Ошибка при получении разделов:", error);
    return NextResponse.json(
      { error: errorMessage || "Не удалось получить разделы" },
      { status: errorMessage === "Не авторизован" ? 401 : errorMessage === "Недостаточно прав" ? 403 : 500 }
    );
  }
}

// POST /api/admin/documentation/sections - Создание нового раздела
export async function POST(request: NextRequest) {
  try {
    await checkAdminAuth();
    
    const body = await request.json();
    const { name, key, description, order = 0, projectId } = body;
    
    if (!name) {
      return NextResponse.json({ error: "Название раздела обязательно" }, { status: 400 });
    }
    
    if (!key) {
      return NextResponse.json({ error: "Ключ раздела обязателен" }, { status: 400 });
    }
    
    // Проверяем уникальность ключа
    const existingSection = await prisma.documentation_sections.findUnique({
      where: { key }
    });
    
    if (existingSection) {
      return NextResponse.json({ error: "Раздел с таким ключом уже существует" }, { status: 400 });
    }
    
    // Принудительно обновляем кэш после создания
    const section = await prisma.documentation_sections.create({
      data: {
        name,
        key,
        description,
        order,
        isVisible: true,
        projectId: projectId || null
      }
    });
    
    return NextResponse.json(section, { status: 201 });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Неизвестная ошибка";
    console.error("Ошибка при создании раздела:", error);
    return NextResponse.json(
      { error: errorMessage || "Не удалось создать раздел" },
      { status: errorMessage === "Не авторизован" ? 401 : errorMessage === "Недостаточно прав" ? 403 : 500 }
    );
  }
}

// PUT /api/admin/documentation/sections - Обновление порядка разделов
export async function PUT(request: NextRequest) {
  try {
    await checkAdminAuth();

    const body = await request.json();
    const { sections } = body;

    if (!Array.isArray(sections)) {
      return NextResponse.json({ error: "Неверный формат данных" }, { status: 400 });
    }

    // Обновляем порядок разделов
    const updatePromises = sections.map((section: { id: string; order: number }) =>
      prisma.documentation_sections.update({
        where: { id: section.id },
        data: { order: section.order }
      })
    );

    await Promise.all(updatePromises);
    
    // Принудительно обновляем кэш после изменения порядка
    await prisma.$queryRaw`SELECT 1`;

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Неизвестная ошибка";
    console.error("Ошибка при обновлении порядка разделов:", error);
    return NextResponse.json(
      { error: errorMessage || "Не удалось обновить порядок разделов" },
      { status: errorMessage === "Не авторизован" ? 401 : errorMessage === "Недостаточно прав" ? 403 : 500 }
    );
  }
}
