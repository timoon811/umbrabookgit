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

// GET /api/admin/courses/[id]/sections - Получение разделов курса
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await checkAdminAuth();
    
    const sections = await prisma.course_sections.findMany({
      where: { courseId: params.id },
      include: {
        pages: {
          orderBy: { order: 'asc' }
        }
      },
      orderBy: { order: 'asc' }
    });
    
    return NextResponse.json({ sections });
  } catch (error: any) {
    console.error("Ошибка при получении разделов курса:", error);
    return NextResponse.json(
      { error: error.message || "Не удалось получить разделы курса" },
      { status: error.message === "Не авторизован" ? 401 : error.message === "Недостаточно прав" ? 403 : 500 }
    );
  }
}

// POST /api/admin/courses/[id]/sections - Создание нового раздела
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await checkAdminAuth();
    
    const body = await request.json();
    const { title, description, order } = body;
    
    if (!title) {
      return NextResponse.json(
        { error: "Название раздела обязательно" },
        { status: 400 }
      );
    }
    
    const section = await prisma.course_sections.create({
      data: {
        title,
        description: description || "",
        order: order || 0,
        courseId: params.id,
      },
    });
    
    return NextResponse.json(section, { status: 201 });
  } catch (error: any) {
    console.error("Ошибка при создании раздела:", error);
    return NextResponse.json(
      { error: error.message || "Не удалось создать раздел" },
      { status: error.message === "Не авторизован" ? 401 : error.message === "Недостаточно прав" ? 403 : 500 }
    );
  }
}
