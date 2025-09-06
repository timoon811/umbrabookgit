import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminAuth } from "@/lib/api-auth";

// Проверка прав администратора
async function checkAdminAuth() {
  const authResult = await requireAdminAuth({} as NextRequest);
  if ('error' in authResult) {
    return authResult.error;
  }
  return null;
}

// Массовые операции с пользователями
export async function PUT(request: NextRequest) {
  try {
    const authError = await checkAdminAuth();
    if (authError) return authError;

    const body = await request.json();
    const { userIds, action } = body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json(
        { message: "Не указаны ID пользователей" },
        { status: 400 }
      );
    }

    if (!action) {
      return NextResponse.json(
        { message: "Не указано действие" },
        { status: 400 }
      );
    }

    // Проверяем существование пользователей и их роли
    const existingUsers = await prisma.users.findMany({
      where: {
        id: { in: userIds }
      },
      select: {
        id: true,
        role: true,
        email: true
      }
    });

    if (existingUsers.length !== userIds.length) {
      return NextResponse.json(
        { message: "Один или несколько пользователей не найдены" },
        { status: 404 }
      );
    }

    // Запрещаем массовые операции с администраторами
    const adminUsers = existingUsers.filter(user => user.role === "ADMIN");
    if (adminUsers.length > 0) {
      return NextResponse.json(
        { message: "Нельзя выполнять массовые операции с администраторами" },
        { status: 403 }
      );
    }

    let updateData: any = {};
    let successMessage = "";

    switch (action) {
      case "approve":
        updateData = { status: "APPROVED" };
        successMessage = `Одобрено ${userIds.length} заявок`;
        break;

      case "reject":
        updateData = { status: "REJECTED" };
        successMessage = `Отклонено ${userIds.length} заявок`;
        break;

      case "block":
        updateData = { isBlocked: true };
        successMessage = `Заблокировано ${userIds.length} пользователей`;
        break;

      case "unblock":
        updateData = { isBlocked: false };
        successMessage = `Разблокировано ${userIds.length} пользователей`;
        break;

      default:
        return NextResponse.json(
          { message: "Неизвестное действие" },
          { status: 400 }
        );
    }

    // Выполняем массовое обновление
    await prisma.users.updateMany({
      where: {
        id: { in: userIds }
      },
      data: updateData
    });

    return NextResponse.json({
      message: successMessage,
      updatedCount: userIds.length
    });

  } catch (error: any) {
    console.error("Ошибка массовой операции:", error);
    return NextResponse.json(
      { message: error.message || "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}

// Массовое удаление пользователей
export async function DELETE(request: NextRequest) {
  try {
    const authError = await checkAdminAuth();
    if (authError) return authError;

    const body = await request.json();
    const { userIds } = body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json(
        { message: "Не указаны ID пользователей" },
        { status: 400 }
      );
    }

    // Проверяем существование пользователей и их роли
    const existingUsers = await prisma.users.findMany({
      where: {
        id: { in: userIds }
      },
      select: {
        id: true,
        role: true,
        email: true
      }
    });

    if (existingUsers.length !== userIds.length) {
      return NextResponse.json(
        { message: "Один или несколько пользователей не найдены" },
        { status: 404 }
      );
    }

    // Запрещаем удаление администраторов
    const adminUsers = existingUsers.filter(user => user.role === "ADMIN");
    if (adminUsers.length > 0) {
      return NextResponse.json(
        { message: "Нельзя удалить администраторов" },
        { status: 403 }
      );
    }

    // Выполняем массовое удаление
    await prisma.users.deleteMany({
      where: {
        id: { in: userIds }
      }
    });

    return NextResponse.json({
      message: `Удалено ${userIds.length} пользователей`,
      deletedCount: userIds.length
    });

  } catch (error: any) {
    console.error("Ошибка массового удаления:", error);
    return NextResponse.json(
      { message: error.message || "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}
