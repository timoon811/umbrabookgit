import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { getWebSocketClient } from "@/lib/websocket-client";

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

// GET /api/admin/finance/deposit-sources/[id] - Получение источника депозитов по ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await checkAdminAuth();

    const depositSource = await prisma.deposit_sources.findUnique({
      where: { id: params.id },
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

    if (!depositSource) {
      return NextResponse.json({ error: "Источник депозитов не найден" }, { status: 404 });
    }

    return NextResponse.json({ depositSource });
  } catch (error: any) {
    console.error("Ошибка при получении источника депозитов:", error);
    return NextResponse.json(
      { error: error.message || "Не удалось получить источник депозитов" },
      { status: error.message === "Не авторизован" ? 401 : error.message === "Недостаточно прав" ? 403 : 500 }
    );
  }
}

// PATCH /api/admin/finance/deposit-sources/[id] - Обновление источника депозитов
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await checkAdminAuth();

    const body = await request.json();
    const { name, token, projectId, commission, isActive } = body;

    // Валидация комиссии
    if (commission !== undefined && (commission < 0 || commission > 100)) {
      return NextResponse.json(
        { error: "Комиссия должна быть от 0 до 100%" },
        { status: 400 }
      );
    }

    // Проверяем, существует ли источник
    const existingSource = await prisma.deposit_sources.findUnique({
      where: { id: params.id }
    });

    if (!existingSource) {
      return NextResponse.json({ error: "Источник депозитов не найден" }, { status: 404 });
    }

    // Если меняем проект, проверяем его существование
    if (projectId && projectId !== existingSource.projectId) {
      const project = await prisma.finance_projects.findUnique({
        where: { id: projectId }
      });

      if (!project) {
        return NextResponse.json(
          { error: "Проект не найден" },
          { status: 404 }
        );
      }
    }

    // Если меняем токен, проверяем уникальность
    if (token && token !== existingSource.token) {
      const duplicateSource = await prisma.deposit_sources.findFirst({
        where: {
          token: token,
          projectId: projectId || existingSource.projectId,
          id: { not: params.id }
        }
      });

      if (duplicateSource) {
        return NextResponse.json(
          { error: "Источник с таким токеном уже существует для этого проекта" },
          { status: 400 }
        );
      }
    }

    const updatedSource = await prisma.deposit_sources.update({
      where: { id: params.id },
      data: {
        ...(name !== undefined && { name }),
        ...(token !== undefined && { token }),
        ...(projectId !== undefined && { projectId }),
        ...(commission !== undefined && { commission: parseFloat(commission.toString()) }),
        ...(isActive !== undefined && { isActive }),
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

    // Обновляем источник в WebSocket клиенте
    try {
      const wsClient = getWebSocketClient();
      wsClient.updateSource({
        id: updatedSource.id,
        name: updatedSource.name,
        token: updatedSource.token,
        projectId: updatedSource.projectId,
        isActive: updatedSource.isActive
      });
      console.log(`✅ Источник ${updatedSource.name} обновлен в WebSocket клиенте`);
    } catch (wsError) {
      console.error(`❌ Ошибка обновления источника в WebSocket клиенте:`, wsError);
    }

    return NextResponse.json(updatedSource);
  } catch (error: any) {
    console.error("Ошибка при обновлении источника депозитов:", error);
    return NextResponse.json(
      { error: error.message || "Не удалось обновить источник депозитов" },
      { status: error.message === "Не авторизован" ? 401 : error.message === "Недостаточно прав" ? 403 : 500 }
    );
  }
}

// DELETE /api/admin/finance/deposit-sources/[id] - Удаление источника депозитов
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await checkAdminAuth();

    // Проверяем, существует ли источник
    const existingSource = await prisma.deposit_sources.findUnique({
      where: { id: params.id }
    });

    if (!existingSource) {
      return NextResponse.json({ error: "Источник депозитов не найден" }, { status: 404 });
    }

    // Удаляем источник из WebSocket клиента перед удалением из БД
    try {
      const wsClient = getWebSocketClient();
      wsClient.removeSource(params.id);
      console.log(`✅ Источник ${params.id} удален из WebSocket клиента`);
    } catch (wsError) {
      console.error(`❌ Ошибка удаления источника из WebSocket клиента:`, wsError);
    }

    // Удаляем источник (каскадно удалятся все депозиты)
    await prisma.deposit_sources.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ message: "Источник депозитов успешно удален" });
  } catch (error: any) {
    console.error("Ошибка при удалении источника депозитов:", error);
    return NextResponse.json(
      { error: error.message || "Не удалось удалить источник депозитов" },
      { status: error.message === "Не авторизован" ? 401 : error.message === "Недостаточно прав" ? 403 : 500 }
    );
  }
}
