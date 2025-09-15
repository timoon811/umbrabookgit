import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireManagerAuth } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  // Проверяем авторизацию
  const authResult = await requireManagerAuth(request);
  if ('error' in authResult) {
    return authResult.error;
  }

  const { user } = authResult;

  try {
    // Получаем параметры запроса
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    // Получаем историю смен менеджера
    const [shifts, total] = await Promise.all([
      prisma.processor_shifts.findMany({
        where: {
          processorId: user.userId,
        },
        orderBy: {
          shiftDate: "desc",
        },
        skip,
        take: limit,
      }),
      prisma.processor_shifts.count({
        where: {
          processorId: user.userId,
        },
      }),
    ]);

    return NextResponse.json({
      shifts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Ошибка получения истории смен:", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}
