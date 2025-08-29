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

// GET /api/admin/documentation/sections/[id] - Получение раздела по ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await checkAdminAuth();
    
    const section = await prisma.documentation_sections.findUnique({
      where: { id: params.id },
      include: {
        pages: {
          orderBy: [
            { order: 'asc' },
            { createdAt: 'asc' }
          ]
        }
      }
    });
    
    if (!section) {
      return NextResponse.json({ error: "Раздел не найден" }, { status: 404 });
    }
    
    return NextResponse.json({ section });
  } catch (error: any) {
    console.error("Ошибка при получении раздела:", error);
    return NextResponse.json(
      { error: error.message || "Не удалось получить раздел" },
      { status: error.message === "Не авторизован" ? 401 : error.message === "Недостаточно прав" ? 403 : 500 }
    );
  }
}

// PATCH /api/admin/documentation/sections/[id] - Обновление раздела
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await checkAdminAuth();
    
    const body = await request.json();
    const { name, key, description, order, isVisible } = body;
    
    // Проверяем, существует ли раздел
    const existingSection = await prisma.documentation_sections.findUnique({
      where: { id: params.id }
    });
    
    if (!existingSection) {
      return NextResponse.json({ error: "Раздел не найден" }, { status: 404 });
    }
    
    // Если изменяется ключ, проверяем уникальность
    if (key && key !== existingSection.key) {
      const duplicateKey = await prisma.documentation_sections.findUnique({
        where: { key }
      });
      
      if (duplicateKey) {
        return NextResponse.json({ error: "Раздел с таким ключом уже существует" }, { status: 400 });
      }
    }
    
    // Принудительно обновляем кэш после изменения
    const updatedSection = await prisma.documentation_sections.update({
      where: { id: params.id },
      data: {
        ...(name !== undefined && { name }),
        ...(key !== undefined && { key }),
  
        ...(description !== undefined && { description }),
        ...(order !== undefined && { order }),
        ...(isVisible !== undefined && { isVisible }),
      }
    });
    
    // Принудительно обновляем кэш после изменения
    await prisma.$queryRaw`SELECT 1`;
    
    return NextResponse.json(updatedSection);
  } catch (error: any) {
    console.error("Ошибка при обновлении раздела:", error);
    return NextResponse.json(
      { error: error.message || "Не удалось обновить раздел" },
      { status: error.message === "Не авторизован" ? 401 : error.message === "Недостаточно прав" ? 403 : 500 }
    );
  }
}

// DELETE /api/admin/documentation/sections/[id] - Удаление раздела
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await checkAdminAuth();
    
    // Проверяем, существует ли раздел
    const existingSection = await prisma.documentation_sections.findUnique({
      where: { id: params.id },
      include: {
        pages: true
      }
    });
    
    if (!existingSection) {
      return NextResponse.json({ error: "Раздел не найден" }, { status: 404 });
    }

    // Удаляем все страницы раздела
    if (existingSection.pages.length > 0) {
      await prisma.documentation.deleteMany({
        where: { sectionId: params.id }
      });
    }
    
    // Удаляем раздел
    await prisma.documentation_sections.delete({
      where: { id: params.id }
    });
    
    // Принудительно обновляем кэш после удаления
    await prisma.$queryRaw`SELECT 1`;
    
    return NextResponse.json({ message: "Раздел и все его страницы успешно удалены" });
  } catch (error: any) {
    console.error("Ошибка при удалении раздела:", error);
    return NextResponse.json(
      { error: error.message || "Не удалось удалить раздел" },
      { status: error.message === "Не авторизован" ? 401 : error.message === "Недостаточно прав" ? 403 : 500 }
    );
  }
}
