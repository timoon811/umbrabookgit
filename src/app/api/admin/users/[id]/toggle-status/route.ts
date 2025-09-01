import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

const JWT_SECRET = process.env.JWT_SECRET || "umbra_platform_super_secret_jwt_key_2024";

// Проверка прав администратора
async function checkAdminAuth(request: NextRequest) {
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

// PATCH /api/admin/users/[id]/toggle-status - Изменение статуса пользователя
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await checkAdminAuth(request);
    const userId = params.id;
    const { isBlocked } = await request.json();

    // Обновляем статус пользователя
    const updatedUser = await prisma.users.update({
      where: { id: userId },
      data: { isBlocked },
      select: {
        id: true,
        name: true,
        email: true,
        isBlocked: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Неизвестная ошибка";
    console.error("Ошибка изменения статуса пользователя:", error);
    return NextResponse.json(
      { error: errorMessage },
      { status: errorMessage === "Не авторизован" ? 401 : errorMessage === "Недостаточно прав" ? 403 : 500 }
    );
  }
}
