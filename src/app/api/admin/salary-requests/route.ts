import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

// GET /api/admin/salary-requests - Получение всех заявок на зарплату
export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const status = searchParams.get("status");
    const processorId = searchParams.get("processorId");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";
    const search = searchParams.get("search"); // Поиск по имени процессора
    
    const skip = (page - 1) * limit;

    // Формируем условия поиска
    const where: Record<string, unknown> = {};

    if (status && status !== "all") {
      where.status = status.toUpperCase();
    }

    if (processorId && processorId !== "all") {
      where.processorId = processorId;
    }

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {
        where.createdAt.gte = new Date(dateFrom);
      }
      if (dateTo) {
        where.createdAt.lte = new Date(dateTo);
      }
    }

    if (search) {
      where.processor = {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      };
    }

    // Формируем сортировку
    const orderBy: Record<string, unknown> = {};
    if (sortBy === "processor") {
      orderBy.processor = { name: sortOrder };
    } else if (sortBy === "amount") {
      orderBy.requestedAmount = sortOrder;
    } else {
      orderBy[sortBy] = sortOrder;
    }

    // Получаем заявки с информацией о процессорах
    const [salaryRequests, total] = await Promise.all([
      prisma.salary_requests.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          processor: {
            select: {
              id: true,
              name: true,
              email: true,
              telegram: true,
            },
          },
        },
      }),
      prisma.salary_requests.count({ where }),
    ]);

    // Получаем список всех процессоров для фильтра
    const processors = await prisma.users.findMany({
      where: { role: "PROCESSOR" },
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({
      salaryRequests,
      processors,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Неизвестная ошибка";
    console.error("Ошибка получения заявок на зарплату:", error);
    return NextResponse.json(
      { error: errorMessage },
      { status: errorMessage === "Не авторизован" ? 401 : errorMessage === "Недостаточно прав" ? 403 : 500 }
    );
  }
}

// PUT /api/admin/salary-requests/[id] - Обновление статуса заявки
export async function PUT(request: NextRequest) {
  try {
    await requireAdmin(request);

    const body = await request.json();
    const { id, status, adminComment, action } = body;

    if (!id || !status) {
      return NextResponse.json(
        { error: "ID и статус обязательны" },
        { status: 400 }
      );
    }

    // Получаем текущую заявку
    const currentRequest = await prisma.salary_requests.findUnique({
      where: { id },
      include: {
        processor: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!currentRequest) {
      return NextResponse.json(
        { error: "Заявка не найдена" },
        { status: 404 }
      );
    }

    // Проверяем, что заявка не была уже обработана
    if (currentRequest.status === "PAID" || currentRequest.status === "REJECTED") {
      return NextResponse.json(
        { error: "Заявка уже была обработана" },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {
      status,
      adminComment,
      updatedAt: new Date(),
    };

    // Если заявка одобрена, создаем транзакцию списания
    if (status === "APPROVED") {
      updateData.processedAt = new Date();
      
      // Находим счет процессора (создаем временный, если не существует)
      let processorAccount = await prisma.finance_accounts.findFirst({
        where: {
          name: `Счет процессора ${currentRequest.processor.name}`,
          type: "PROCESSOR",
        },
      });

      if (!processorAccount) {
        processorAccount = await prisma.finance_accounts.create({
          data: {
            name: `Счет процессора ${currentRequest.processor.name}`,
            type: "PROCESSOR",
            currency: "USD",
            balance: 0,
            commission: 0,
          },
        });
      }

      // Создаем транзакцию списания
      const transaction = await prisma.finance_transactions.create({
        data: {
          accountId: processorAccount.id,
          type: "EXPENSE",
          amount: currentRequest.calculatedAmount || currentRequest.requestedAmount,
          netAmount: currentRequest.calculatedAmount || currentRequest.requestedAmount,
          originalAmount: currentRequest.calculatedAmount || currentRequest.requestedAmount,
          commissionPercent: 0,
          commissionAmount: 0,
          description: `Выплата зарплаты за период ${currentRequest.periodStart.toISOString().split('T')[0]} - ${currentRequest.periodEnd.toISOString().split('T')[0]}`,
          date: new Date(),
        },
      });

      // Обновляем баланс счета процессора
      await prisma.finance_accounts.update({
        where: { id: processorAccount.id },
        data: {
          balance: processorAccount.balance - (currentRequest.calculatedAmount || currentRequest.requestedAmount),
        },
      });

      updateData.transactionId = transaction.id;
    } else if (status === "REJECTED") {
      updateData.processedAt = new Date();
    }

    // Обновляем заявку
    const updatedRequest = await prisma.salary_requests.update({
      where: { id },
      data: updateData,
      include: {
        processor: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(updatedRequest);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Неизвестная ошибка";
    console.error("Ошибка обновления заявки на зарплату:", error);
    return NextResponse.json(
      { error: errorMessage },
      { status: errorMessage === "Не авторизован" ? 401 : errorMessage === "Недостаточно прав" ? 403 : 500 }
    );
  }
}

// DELETE /api/admin/salary-requests/[id] - Удаление заявки (только для отклоненных)
export async function DELETE(request: NextRequest) {
  try {
    await checkAdminAuth(request);

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "ID заявки обязателен" },
        { status: 400 }
      );
    }

    // Проверяем, что заявка отклонена
    const request = await prisma.salary_requests.findUnique({
      where: { id },
      select: { status: true },
    });

    if (!request) {
      return NextResponse.json(
        { error: "Заявка не найдена" },
        { status: 404 }
      );
    }

    if (request.status !== "REJECTED") {
      return NextResponse.json(
        { error: "Можно удалить только отклоненные заявки" },
        { status: 400 }
      );
    }

    // Удаляем заявку
    await prisma.salary_requests.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Заявка удалена" });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Неизвестная ошибка";
    console.error("Ошибка удаления заявки на зарплату:", error);
    return NextResponse.json(
      { error: errorMessage },
      { status: errorMessage === "Не авторизован" ? 401 : errorMessage === "Недостаточно прав" ? 403 : 500 }
    );
  }
}
