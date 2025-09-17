import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminAuth } from "@/lib/api-auth";
import { SalaryLogger } from "@/lib/salary-logger";

// GET /api/admin/salary-requests - Получение всех заявок на зарплату
export async function GET(request: NextRequest) {
  try {
    

    const authResult = await requireAdminAuth(request);
    
    if ('error' in authResult) {
      return authResult.error;
    }

    
    const { user } = authResult;

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const status = searchParams.get("status");
    const processorId = searchParams.get("processorId");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";
    const search = searchParams.get("search"); // Поиск по имени менеджера
    
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
      where.manager = {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      };
    }

    // Формируем сортировку
    const orderBy: Record<string, unknown> = {};
    if (sortBy === "manager") {
      orderBy.manager = { name: sortOrder };
    } else if (sortBy === "amount") {
      orderBy.requestedAmount = sortOrder;
    } else {
      orderBy[sortBy] = sortOrder;
    }

    // Получаем заявки с информацией о менеджерах
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

    // Получаем список всех менеджеров для фильтра
    const managers = await prisma.users.findMany({
      where: { role: "PROCESSOR" },
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({
      salaryRequests,
      managers,
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
    

    const authResult = await requireAdminAuth(request);
    
    if ('error' in authResult) {
      return authResult.error;
    }

    
    const { user } = authResult;

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
    };

    // Если заявка одобрена, создаем транзакцию списания
    if (status === "APPROVED") {
      updateData.processedAt = new Date();
      
      // Находим счет менеджера (создаем временный, если не существует)
      let managerAccount = await prisma.finance_accounts.findFirst({
        where: {
          name: `Счет менеджера ${currentRequest.manager.name}`,
          type: "PROCESSOR",
        },
      });

      if (!managerAccount) {
        managerAccount = await prisma.finance_accounts.create({
          data: {
            name: `Счет менеджера ${currentRequest.manager.name}`,
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
          accountId: managerAccount.id,
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

      // Обновляем баланс счета менеджера
      await prisma.finance_accounts.update({
        where: { id: managerAccount.id },
        data: {
          balance: managerAccount.balance - (currentRequest.calculatedAmount || currentRequest.requestedAmount),
        },
      });

      // Связь с транзакцией можно отслеживать через описание в транзакции
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

    // Логируем действие администратора
    await SalaryLogger.logSalaryRequestAction({
      salaryRequestId: id,
      processorId: currentRequest.processorId,
      action: action || status.toUpperCase(),
      status: status,
      details: `Администратор изменил статус заявки на "${status}"${adminComment ? `. Комментарий: ${adminComment}` : ''}`,
      amount: updatedRequest.calculatedAmount || updatedRequest.requestedAmount,
      adminId: authResult.user.userId,
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
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
