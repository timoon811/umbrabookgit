import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { checkAdminAuthUserId } from "@/lib/admin-auth";

// Получение информации о пользователе
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await checkAdminAuthUserId();
    
    const { id } = await params;

    // Получаем пользователя с дополнительной информацией
    const user = await prisma.users.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        telegram: true,
        role: true,
        status: true,
        isBlocked: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { message: "Пользователь не найден" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      user,
    });
  } catch (error: any) {
    console.error("Ошибка получения пользователя:", error);
    return NextResponse.json(
      { message: error.message || "Внутренняя ошибка сервера" },
      { status: error.message === "Не авторизован" ? 401 : error.message === "Недостаточно прав" ? 403 : 500 }
    );
  }
}

// Обновление пользователя (блокировка, одобрение, редактирование)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await checkAdminAuthUserId();
    
    const { id } = await params;
    const body = await request.json();
    const { action, name, email, role, password } = body;

    // Проверяем, что пользователь существует
    const existingUser = await prisma.users.findUnique({
      where: { id },
      select: { id: true, role: true, email: true }
    });

    if (!existingUser) {
      return NextResponse.json(
        { message: "Пользователь не найден" },
        { status: 404 }
      );
    }

    // Запрещаем изменение админа другими админами (кроме self-edit)
    if (existingUser.role === "ADMIN") {
      return NextResponse.json(
        { message: "Нельзя изменять других администраторов" },
        { status: 403 }
      );
    }

    let updateData: any = {};

    switch (action) {
      case "approve":
        updateData = { status: "APPROVED" };
        break;
        
      case "reject":
        updateData = { status: "REJECTED" };
        break;
        
      case "block":
        updateData = { isBlocked: true };
        break;
        
      case "unblock":
        updateData = { isBlocked: false };
        break;
        
      case "update":
        // Проверяем уникальность email
        if (email && email !== existingUser.email) {
          const emailExists = await prisma.users.findUnique({
            where: { email },
            select: { id: true }
          });
          
          if (emailExists) {
            return NextResponse.json(
              { message: "Email уже используется" },
              { status: 400 }
            );
          }
        }

        updateData = {
          ...(name && { name }),
          ...(email && { email }),
          ...(role && { role }),
        };

        // Обновляем пароль если предоставлен
        if (password && password.trim()) {
          const hashedPassword = await bcrypt.hash(password, 10);
          updateData.password = hashedPassword;
        }
        break;
        
      default:
        return NextResponse.json(
          { message: "Неизвестное действие" },
          { status: 400 }
        );
    }

    // Обновляем пользователя
    const updatedUser = await prisma.users.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        telegram: true,
        role: true,
        status: true,
        isBlocked: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      message: "Пользователь обновлен",
      user: updatedUser,
    });
  } catch (error: any) {
    console.error("Ошибка обновления пользователя:", error);
    return NextResponse.json(
      { message: error.message || "Внутренняя ошибка сервера" },
      { status: error.message === "Не авторизован" ? 401 : error.message === "Недостаточно прав" ? 403 : 500 }
    );
  }
}

// Удаление пользователя
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await checkAdminAuthUserId();
    
    const { id } = await params;

    // Проверяем, что пользователь существует
    const existingUser = await prisma.users.findUnique({
      where: { id },
      select: { id: true, role: true, email: true }
    });

    if (!existingUser) {
      return NextResponse.json(
        { message: "Пользователь не найден" },
        { status: 404 }
      );
    }

    // Запрещаем удаление администраторов
    if (existingUser.role === "ADMIN") {
      return NextResponse.json(
        { message: "Нельзя удалить администратора" },
        { status: 403 }
      );
    }

    // Удаляем пользователя
    await prisma.users.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "Пользователь удален",
    });
  } catch (error: any) {
    console.error("Ошибка удаления пользователя:", error);
    return NextResponse.json(
      { message: error.message || "Внутренняя ошибка сервера" },
      { status: error.message === "Не авторизован" ? 401 : error.message === "Недостаточно прав" ? 403 : 500 }
    );
  }
}
