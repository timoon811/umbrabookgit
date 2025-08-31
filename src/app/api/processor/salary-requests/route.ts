import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

const JWT_SECRET = process.env.JWT_SECRET || "umbra_platform_super_secret_jwt_key_2024";

export async function GET(request: NextRequest) {
  try {
    // Проверяем авторизацию
    const cookieStore = await cookies();
    const token = cookieStore.get("auth-token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      role: string;
    };

    if (decoded.role !== "PROCESSOR" && decoded.role !== "ADMIN") {
      return NextResponse.json({ error: "Доступ запрещен" }, { status: 403 });
    }

    // Для админов показываем все заявки, для процессоров - только их
    const processorId = decoded.role === "ADMIN" ? null : decoded.userId;

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
  try {
    // Проверяем авторизацию
    const cookieStore = await cookies();
    const token = cookieStore.get("auth-token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      role: string;
    };

    if (decoded.role !== "PROCESSOR") {
      return NextResponse.json({ error: "Доступ запрещен" }, { status: 403 });
    }

    const processorId = decoded.userId;
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
