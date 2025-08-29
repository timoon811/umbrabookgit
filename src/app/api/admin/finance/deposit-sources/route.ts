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

// GET /api/admin/finance/deposit-sources - Получение списка источников депозитов
export async function GET(request: NextRequest) {
  try {
    await checkAdminAuth();

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const isActive = searchParams.get('isActive');

    const where: any = {};

    if (projectId) {
      where.projectId = projectId;
    }

    if (isActive !== null) {
      where.isActive = isActive === 'true';
    }

    const depositSources = await prisma.deposit_sources.findMany({
      where,
      include: {
        project: {
          select: {
            id: true,
            name: true,
            status: true
          }
        },
        _count: {
          select: {
            deposits: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ depositSources });
  } catch (error: any) {
    console.error("Ошибка при получении источников депозитов:", error);
    return NextResponse.json(
      { error: error.message || "Не удалось получить источники депозитов" },
      { status: error.message === "Не авторизован" ? 401 : error.message === "Недостаточно прав" ? 403 : 500 }
    );
  }
}

// POST /api/admin/finance/deposit-sources - Создание нового источника депозитов
export async function POST(request: NextRequest) {
  try {
    await checkAdminAuth();

    const body = await request.json();
    const { name, token, projectId } = body;

    if (!name || !token || !projectId) {
      return NextResponse.json(
        { error: "Название, токен и проект обязательны" },
        { status: 400 }
      );
    }

    // Проверяем, существует ли проект
    const project = await prisma.finance_projects.findUnique({
      where: { id: projectId }
    });

    if (!project) {
      return NextResponse.json(
        { error: "Проект не найден" },
        { status: 404 }
      );
    }

    // Проверяем, не существует ли уже источник с таким токеном для этого проекта
    const existingSource = await prisma.deposit_sources.findFirst({
      where: {
        token: token,
        projectId: projectId
      }
    });

    if (existingSource) {
      return NextResponse.json(
        { error: "Источник с таким токеном уже существует для этого проекта" },
        { status: 400 }
      );
    }

    const depositSource = await prisma.deposit_sources.create({
      data: {
        name,
        token,
        projectId
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            status: true
          }
        },
        _count: {
          select: {
            deposits: true
          }
        }
      }
    });

    return NextResponse.json(depositSource, { status: 201 });
  } catch (error: any) {
    console.error("Ошибка при создании источника депозитов:", error);
    return NextResponse.json(
      { error: error.message || "Не удалось создать источник депозитов" },
      { status: error.message === "Не авторизован" ? 401 : error.message === "Недостаточно прав" ? 403 : 500 }
    );
  }
}
