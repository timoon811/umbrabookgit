import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { requireAdminAuth } from '@/lib/api-auth';

// GET /api/admin/finance/transactions
export async function GET(request: NextRequest) {
  try {
  

    const authResult = await requireAdminAuth(request);
  
    if ('error' in authResult) {
    return authResult.error;
  }
  
  const { user } = authResult;


    await requireAdmin(request);

    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('accountId');
    const projectId = searchParams.get('projectId');
    const limit = parseInt(searchParams.get('limit') || '50');

    const where: any = {};
    if (accountId) {
      where.accountId = accountId;
    }
    if (projectId) {
      where.projectId = projectId;
    }

    const transactions = await prisma.finance_transactions.findMany({
      where,
      include: {
        account: { select: { id: true, name: true, currency: true, commission: true } },
        toAccount: { select: { id: true, name: true, currency: true } },
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
  

    const authResult = await requireAdminAuth(request);
  
    if ('error' in authResult) {
    return authResult.error;
  }
  
  const { user } = authResult;


    await checkAdminAuth();

    const body = await request.json();
    const {
      accountId,
      type,
      amount,
      description,
      counterpartyId,
      categoryId,
      projectId,
      toAccountId,
      fromCurrency,
      toCurrency,
      exchangeRate,
      toAmount
    } = body || {};

    if (!accountId || !amount || !type) {
      return NextResponse.json({
        error: "accountId, amount и type обязательны"
      }, { status: 400 });
    }

    // Дополнительная валидация для переводов
    if (type === 'TRANSFER' && !toAccountId) {
      return NextResponse.json({
        error: "Для переводов обязательно указание счета получателя (toAccountId)"
      }, { status: 400 });
    }

    // Дополнительная валидация для обменов
    if (type === 'EXCHANGE' && (!fromCurrency || !toCurrency || !exchangeRate || !toAmount)) {
      return NextResponse.json({
        error: "Для обмена обязательны поля: fromCurrency, toCurrency, exchangeRate, toAmount"
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
    } else if (type === 'TRANSFER') {
      // При переводах комиссия добавляется к сумме перевода
      commissionAmount = (parseFloat(amount) * commissionPercent) / 100;
      netAmount = parseFloat(amount) + commissionAmount; // Общая сумма списания
      actualBalanceChange = -netAmount; // Баланс отправителя уменьшается
    } else if (type === 'EXCHANGE') {
      // При обмене комиссия рассчитывается от суммы обмена
      commissionAmount = (parseFloat(amount) * commissionPercent) / 100;
      netAmount = parseFloat(amount) + commissionAmount; // Общая сумма списания в исходной валюте
      actualBalanceChange = -netAmount; // Баланс уменьшается на сумму с комиссией
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
          // Поля для переводов
          toAccountId: type === 'TRANSFER' ? toAccountId : undefined,
          // Поля для обменов
          fromCurrency: type === 'EXCHANGE' ? fromCurrency : undefined,
          toCurrency: type === 'EXCHANGE' ? toCurrency : undefined,
          exchangeRate: type === 'EXCHANGE' ? parseFloat(exchangeRate) : undefined,
          toAmount: type === 'EXCHANGE' ? parseFloat(toAmount) : undefined,
        }
      });

      // Обновляем баланс счета отправителя
      await db.finance_accounts.update({
        where: { id: accountId },
        data: { balance: { increment: actualBalanceChange } }
      });

      // Для переводов обновляем баланс счета получателя
      if (type === 'TRANSFER' && toAccountId) {
        await db.finance_accounts.update({
          where: { id: toAccountId },
          data: { balance: { increment: parseFloat(amount) } } // Получатель получает сумму без комиссии
        });
      }

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


