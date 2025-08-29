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

// GET /api/admin/courses - Получение списка курсов
export async function GET(request: NextRequest) {
  try {
    await checkAdminAuth();
    
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    
    const where: any = {};
    
    if (status) {
      where.isPublished = status === 'published';
    }
    
    if (category) {
      where.category = category;
    }
    
    const courses = await prisma.courses.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        description: true,
        slug: true,
        isPublished: true,
        createdAt: true,
        updatedAt: true,
      }
    });
    
    return NextResponse.json({ courses });
  } catch (error: any) {
    console.error("Ошибка при получении курсов:", error);
    return NextResponse.json(
      { error: error.message || "Не удалось получить курсы" },
      { status: error.message === "Не авторизован" ? 401 : error.message === "Недостаточно прав" ? 403 : 500 }
    );
  }
}

// POST /api/admin/courses - Создание нового курса
export async function POST(request: NextRequest) {
  try {
    await checkAdminAuth();
    
    const body = await request.json();
    const { title, description, slug, isPublished = false, category = 'general' } = body;
    
    if (!title) {
      return NextResponse.json({ error: "Название курса обязательно" }, { status: 400 });
    }
    
    if (!slug) {
      return NextResponse.json({ error: "Slug курса обязателен" }, { status: 400 });
    }
    
    // Проверяем уникальность slug
    const existingCourse = await prisma.courses.findUnique({
      where: { slug }
    });
    
    if (existingCourse) {
      return NextResponse.json({ error: "Курс с таким slug уже существует" }, { status: 400 });
    }
    
    const course = await prisma.courses.create({
      data: {
        title,
        description,
        slug,
        isPublished,
        category,
      }
    });
    
    return NextResponse.json(course, { status: 201 });
  } catch (error: any) {
    console.error("Ошибка при создании курса:", error);
    return NextResponse.json(
      { error: error.message || "Не удалось создать курс" },
      { status: error.message === "Не авторизован" ? 401 : error.message === "Недостаточно прав" ? 403 : 500 }
    );
  }
}
