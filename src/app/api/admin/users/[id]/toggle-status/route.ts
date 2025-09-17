import { checkAdminAuthUserId } from "@/lib/admin-auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminAuth } from '@/lib/api-auth';

// PUT /api/admin/users/[id]/toggle-status
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
  const authResult = await requireAdminAuth(request);
  
    if ('error' in authResult) {
    return authResult.error;
  }
  
  const { user } = authResult;


    await checkAdminAuthUserId();
    const { id } = await params;
    const { isBlocked } = await request.json();

    // Обновляем статус пользователя
    const updatedUser = await prisma.users.update({
      where: { id },
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
