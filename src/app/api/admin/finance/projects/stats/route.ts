import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

const JWT_SECRET = process.env.JWT_SECRET || "umbra_platform_super_secret_jwt_key_2024";

// Проверка прав администратора
async function checkAdminAuth() {
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

// GET /api/admin/finance/projects/stats - Получение проектов с финансовой статистикой
export async function GET(request: NextRequest) {
  try {
    await checkAdminAuth();
    
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const archiveStatus = searchParams.get('archiveStatus');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (archiveStatus) {
      where.isArchived = archiveStatus === 'archived';
    }

    // Фильтрация по дате создания
    if (dateFrom || dateTo) {
      where.createdAt = {};

      if (dateFrom) {
        // Начало дня для dateFrom
        const fromDate = new Date(dateFrom);
        fromDate.setHours(0, 0, 0, 0);
        where.createdAt.gte = fromDate;
      }

      if (dateTo) {
        // Конец дня для dateTo
        const toDate = new Date(dateTo);
        toDate.setHours(23, 59, 59, 999);
        where.createdAt.lte = toDate;
      }
    }
    
    // Получаем все проекты
    const projects = await prisma.finance_projects.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        description: true,
        status: true,
        startDate: true,
        endDate: true,
        budget: true,
        isArchived: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    // Для каждого проекта получаем финансовую статистику
    const projectsWithStats = await Promise.all(
      projects.map(async (project) => {
        // Получаем все транзакции проекта
        const transactions = await prisma.finance_transactions.findMany({
          where: { projectId: project.id },
          select: {
            type: true,
            amount: true,
            counterpartyId: true,
            counterparty: {
              select: {
                id: true,
                name: true,
                type: true,
              }
            }
          }
        });

        // Вычисляем финансовую статистику
        let income = 0;
        let expenses = 0;
        const counterparties = new Set<string>();
        const counterpartyDetails: any[] = [];

        transactions.forEach(transaction => {
          if (transaction.type === 'INCOME') {
            income += transaction.amount;
          } else if (transaction.type === 'EXPENSE') {
            expenses += transaction.amount;
          }

          if (transaction.counterpartyId) {
            if (!counterparties.has(transaction.counterpartyId)) {
              counterparties.add(transaction.counterpartyId);
              if (transaction.counterparty) {
                counterpartyDetails.push(transaction.counterparty);
              }
            }
          }
        });

        const netProfit = income - expenses;
        const budgetUtilization = project.budget ? (expenses / project.budget) * 100 : 0;

        return {
          ...project,
          income,
          expenses,
          netProfit,
          budgetUtilization,
          transactionCount: transactions.length,
          counterparties: counterpartyDetails,
          counterpartyCount: counterparties.size,
        };
      })
    );
    
    return NextResponse.json({ projects: projectsWithStats });
  } catch (error: any) {
    console.error("Ошибка при получении проектов со статистикой:", error);
    return NextResponse.json(
      { error: error.message || "Не удалось получить проекты" },
      { status: error.message === "Не авторизован" ? 401 : error.message === "Недостаточно прав" ? 403 : 500 }
    );
  }
}
