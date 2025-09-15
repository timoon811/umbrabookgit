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
    // Для админов показываем все заявки, для менеджеров - только их
    const processorId = user.role === "ADMIN" ? null : user.userId;

    // Получаем параметры запроса
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const status = searchParams.get("status");
    const skip = (page - 1) * limit;

    // Формируем условия поиска
    const where: any = {
      ...(processorId && { processorId }),
    };

    if (status && status !== "all") {
      where.status = status.toUpperCase();
    }

    // Получаем заявки с пагинацией
    const [salaryRequests, total] = await Promise.all([
      prisma.salary_requests.findMany({
        where,
        orderBy: {
          createdAt: "desc",
        },
        skip,
        take: limit,
      }),
      prisma.salary_requests.count({ where }),
    ]);

    return NextResponse.json({
      salaryRequests,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Ошибка получения заявок на зарплату:", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  // Проверяем авторизацию (только для менеджеров)
  const authResult = await requireManagerAuth(request);
  if ('error' in authResult) {
    return authResult.error;
  }

  const { user } = authResult;

  // Только менеджеры могут создавать заявки
  if (user.role !== "PROCESSOR") {
    return NextResponse.json({ error: "Доступ запрещен" }, { status: 403 });
  }
  
  try {
    const processorId = user.userId;
    const data = await request.json();

    // Валидация данных
    if (!data.periodStart || !data.periodEnd) {
      return NextResponse.json(
        { error: "Обязательные поля: periodStart, periodEnd" },
        { status: 400 }
      );
    }

    const periodStart = new Date(data.periodStart);
    const periodEnd = new Date(data.periodEnd);

    if (periodStart >= periodEnd) {
      return NextResponse.json(
        { error: "Дата начала должна быть раньше даты окончания" },
        { status: 400 }
      );
    }

    if (periodEnd > new Date()) {
      return NextResponse.json(
        { error: "Дата окончания не может быть в будущем" },
        { status: 400 }
      );
    }

    // Проверяем, нет ли пересекающихся заявок
    const existingRequest = await prisma.salary_requests.findFirst({
      where: {
        processorId,
        status: {
          in: ["PENDING", "APPROVED", "PAID"],
        },
        OR: [
          {
            AND: [
              { periodStart: { lte: periodStart } },
              { periodEnd: { gte: periodStart } },
            ],
          },
          {
            AND: [
              { periodStart: { lte: periodEnd } },
              { periodEnd: { gte: periodEnd } },
            ],
          },
          {
            AND: [
              { periodStart: { gte: periodStart } },
              { periodEnd: { lte: periodEnd } },
            ],
          },
        ],
      },
    });

    if (existingRequest) {
      return NextResponse.json(
        { error: "Заявка на этот период уже существует или пересекается с существующей" },
        { status: 400 }
      );
    }

    // Рассчитываем сумму на основе подтвержденных депозитов за период
    const approvedDeposits = await prisma.processor_deposits.findMany({
      where: {
        processorId,
        status: "APPROVED",
        createdAt: {
          gte: periodStart,
          lte: periodEnd,
        },
      },
    });

    const calculatedAmount = approvedDeposits.reduce((sum, deposit) => sum + deposit.bonusAmount, 0);

    // Создаем заявку
    const salaryRequest = await prisma.salary_requests.create({
      data: {
        processorId,
        periodStart,
        periodEnd,
        requestedAmount: data.requestedAmount || calculatedAmount,
        calculatedAmount: Math.round(calculatedAmount * 100) / 100,
        paymentDetails: data.paymentDetails ? JSON.stringify(data.paymentDetails) : null,
        comment: data.comment,
        status: "PENDING",
      },
    });

    return NextResponse.json(salaryRequest, { status: 201 });
  } catch (error) {
    console.error("Ошибка создания заявки на зарплату:", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}
