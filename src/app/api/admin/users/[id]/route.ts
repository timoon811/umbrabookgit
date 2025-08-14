import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import bcrypt from "bcrypt";

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

// Обновление пользователя (блокировка, одобрение, редактирование)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await checkAdminAuth();
    
    const { id } = params;
    const body = await request.json();
    const { action, name, email, role, password } = body;

    // Проверяем, что пользователь существует
    const existingUser = await prisma.user.findUnique({
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
      case "block":
        updateData.isBlocked = true;
        break;
        
      case "unblock":
        updateData.isBlocked = false;
        break;
        
      case "approve":
        updateData.status = "APPROVED";
        break;
        
      case "reject":
        updateData.status = "REJECTED";
        break;
        
      case "update":
        // Проверяем уникальность email
        if (email && email !== existingUser.email) {
          const emailExists = await prisma.user.findUnique({
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
    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        isBlocked: true,
        createdAt: true,
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
  { params }: { params: { id: string } }
) {
  try {
    await checkAdminAuth();
    
    const { id } = params;

    // Проверяем, что пользователь существует
    const existingUser = await prisma.user.findUnique({
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
    await prisma.user.delete({
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
