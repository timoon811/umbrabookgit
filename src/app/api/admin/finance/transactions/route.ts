import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

// GET /api/admin/finance/transactions
export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);

    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('accountId');
    const limit = parseInt(searchParams.get('limit') || '50');

    const where: any = {};
    if (accountId) {
      where.accountId = accountId;
    }

    const transactions = await prisma.finance_transactions.findMany({
      where,
      include: {
        account: { select: { id: true, name: true, currency: true, commission: true } },
        counterparty: { select: { id: true, name: true } },
        category: { select: { id: true, name: true } },
        project: { select: { id: true, name: true } }
      },
      orderBy: { date: "desc" },
      take: limit,
    });

    return NextResponse.json({ transactions });
  } catch (error: any) {
    console.error("Ошибка при получении транзакций:", error);
    return NextResponse.json(
      { error: error.message || "Не удалось получить транзакции" },
      { status: error.message === "Не авторизован" ? 401 : error.message === "Недостаточно прав" ? 403 : 500 }
    );
  }
}

// POST /api/admin/finance/transactions - Создание транзакции с учетом комиссий
export async function POST(request: NextRequest) {
  try {
    await checkAdminAuth();

    const body = await request.json();
    const {
      accountId,
      type,
      amount,
      description,
      counterpartyId,
      categoryId,
      projectId
    } = body || {};

    if (!accountId || !amount || !type) {
      return NextResponse.json({
        error: "accountId, amount и type обязательны"
      }, { status: 400 });
    }

    // Получаем информацию о счете для расчета комиссий
    const account = await prisma.finance_accounts.findUnique({
      where: { id: accountId },
      select: { commission: true, balance: true }
    });

    if (!account) {
      return NextResponse.json({ error: "Счет не найден" }, { status: 404 });
    }

    const commissionPercent = account.commission || 0;
    let commissionAmount = 0;
    let netAmount = 0;
    let actualBalanceChange = 0;

    // Расчет комиссий в зависимости от типа транзакции
    if (type === 'INCOME') {
      // При пополнении счета комиссия вычитается из суммы пополнения
      commissionAmount = (parseFloat(amount) * commissionPercent) / 100;
      netAmount = parseFloat(amount) - commissionAmount; // Чистая сумма зачисления
      actualBalanceChange = netAmount; // Баланс увеличивается на чистую сумму
    } else if (type === 'EXPENSE') {
      // При расходовании комиссия добавляется к сумме расхода
      commissionAmount = (parseFloat(amount) * commissionPercent) / 100;
      netAmount = parseFloat(amount) + commissionAmount; // Общая сумма списания
      actualBalanceChange = -netAmount; // Баланс уменьшается на общую сумму
    }

    // Создаем транзакцию с учетом комиссий
    const transaction = await prisma.$transaction(async (db) => {
      const created = await db.finance_transactions.create({
        data: {
          accountId,
          type,
          amount: parseFloat(amount), // Оригинальная сумма
          commissionPercent,
          commissionAmount,
          netAmount,
          originalAmount: parseFloat(amount),
          description,
          counterpartyId,
          categoryId,
          projectId,
        }
      });

      // Обновляем баланс счета
      await db.finance_accounts.update({
        where: { id: accountId },
        data: { balance: { increment: actualBalanceChange } }
      });

      return created;
    });

    return NextResponse.json(transaction, { status: 201 });
  } catch (error: any) {
    console.error("Ошибка при создании транзакции:", error);
    return NextResponse.json(
      { error: error.message || "Не удалось создать транзакцию" },
      { status: error.message === "Не авторизован" ? 401 : error.message === "Недостаточно прав" ? 403 : 500 }
    );
  }
}


