import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

const JWT_SECRET = process.env.JWT_SECRET || "umbra_platform_super_secret_jwt_key_2024";

// Проверка прав администратора
async function checkAdminAuth(request: NextRequest) {
  try {
    // Используем существующую функцию проверки админских прав
    const { requireAdmin } = await import('@/lib/auth');
    const user = await requireAdmin(request);
    return user;
  } catch (error) {
    console.error("Ошибка проверки админских прав:", error);
    throw new Error("Недостаточно прав");
  }
}

// GET /api/admin/finance/deposits - Получение списка депозитов
export async function GET(request: NextRequest) {
  try {
    await checkAdminAuth(request);

    const { searchParams } = new URL(request.url);
    const depositSourceId = searchParams.get('depositSourceId');
    const projectId = searchParams.get('projectId');
    const processed = searchParams.get('processed');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const where: any = {};

    if (depositSourceId) {
      where.depositSourceId = depositSourceId;
    }

    if (projectId) {
      // Если указан проект, получаем все источники этого проекта
      const depositSources = await prisma.deposit_sources.findMany({
        where: { projectId },
        select: { id: true }
      });
      where.depositSourceId = {
        in: depositSources.map(ds => ds.id)
      };
    }

    if (processed !== null) {
      where.processed = processed === 'true';
    }

    const deposits = await prisma.deposits.findMany({
      where,
      include: {
        depositSource: {
          include: {
            project: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset
    });

    // Получаем статистику для отображения
    const stats = await prisma.deposits.aggregate({
      where,
      _sum: {
        amount: true,
        amountUsd: true,
        commissionAmount: true,
        commissionAmountUsd: true,
        netAmount: true,
        netAmountUsd: true
      },
      _count: {
        id: true
      }
    });

    const total = await prisma.deposits.count({ where });

    return NextResponse.json({
      deposits,
      stats: {
        totalDeposits: stats._count.id,
        totalAmount: stats._sum.amount || 0,
        totalAmountUsd: stats._sum.amountUsd || 0,
        totalCommission: stats._sum.commissionAmount || 0,
        totalCommissionUsd: stats._sum.commissionAmountUsd || 0,
        totalNetAmount: stats._sum.netAmount || 0,
        totalNetAmountUsd: stats._sum.netAmountUsd || 0
      },
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    });
  } catch (error: any) {
    console.error("Ошибка при получении депозитов:", error);
    return NextResponse.json(
      { error: error.message || "Не удалось получить депозиты" },
      { status: error.message === "Не авторизован" ? 401 : error.message === "Недостаточно прав" ? 403 : 500 }
    );
  }
}

// POST /api/admin/finance/deposits - Создание депозита (для тестирования)
export async function POST(request: NextRequest) {
  try {
    await checkAdminAuth(request);

    const body = await request.json();
    const {
      id,
      depositSourceId,
      mammothId,
      mammothLogin,
      mammothCountry,
      mammothPromo,
      token,
      amount,
      amountUsd,
      workerPercent,
      domain,
      txHash
    } = body;

    if (!id || !depositSourceId || !mammothId || !mammothLogin || !token || !amount || !amountUsd) {
      return NextResponse.json(
        { error: "Обязательные поля: id, depositSourceId, mammothId, mammothLogin, token, amount, amountUsd" },
        { status: 400 }
      );
    }

    // Проверяем, существует ли источник депозитов
    const depositSource = await prisma.deposit_sources.findUnique({
      where: { id: depositSourceId }
    });

    if (!depositSource) {
      return NextResponse.json(
        { error: "Источник депозитов не найден" },
        { status: 404 }
      );
    }

    // Проверяем, не существует ли уже такой депозит
    const existingDeposit = await prisma.deposits.findUnique({
      where: { id }
    });

    if (existingDeposit) {
      return NextResponse.json(
        { error: "Депозит с таким ID уже существует" },
        { status: 400 }
      );
    }

    // Рассчитываем комиссию
    const commissionPercent = depositSource.commission;
    const commissionAmount = (parseFloat(amount) * commissionPercent) / 100;
    const commissionAmountUsd = (parseFloat(amountUsd) * commissionPercent) / 100;
    const netAmount = parseFloat(amount) - commissionAmount;
    const netAmountUsd = parseFloat(amountUsd) - commissionAmountUsd;

    const deposit = await prisma.deposits.create({
      data: {
        id,
        depositSourceId,
        mammothId,
        mammothLogin,
        mammothCountry: mammothCountry || 'US',
        mammothPromo,
        token,
        amount: parseFloat(amount),              // Грязная сумма
        amountUsd: parseFloat(amountUsd),        // Грязная сумма USD
        commissionPercent: commissionPercent,    // Процент комиссии
        commissionAmount: commissionAmount,      // Сумма комиссии в токене
        commissionAmountUsd: commissionAmountUsd,// Сумма комиссии в USD
        netAmount: netAmount,                    // Чистая сумма в токене
        netAmountUsd: netAmountUsd,              // Чистая сумма в USD
        workerPercent: workerPercent || 0,
        domain,
        txHash,
        processed: false
      },
      include: {
        depositSource: {
          include: {
            project: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });

    return NextResponse.json(deposit, { status: 201 });
  } catch (error: any) {
    console.error("Ошибка при создании депозита:", error);
    return NextResponse.json(
      { error: error.message || "Не удалось создать депозит" },
      { status: error.message === "Не авторизован" ? 401 : error.message === "Недостаточно прав" ? 403 : 500 }
    );
  }
}
