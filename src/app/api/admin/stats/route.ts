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

// GET /api/admin/stats - Получение общей статистики для админ панели
export async function GET(request: NextRequest) {
  try {
    await checkAdminAuth();
    
    // Общие счетчики
    const [
      totalUsers,
      totalCourses,
      totalAccounts,
      totalTransactions,
    ] = await Promise.all([
      prisma.users.count(),
      prisma.courses.count(),
      prisma.finance_accounts.count(),
      prisma.finance_transactions.count(),
    ]);
    
    // Статистика пользователей
    const [
      activeUsers,
      pendingUsers,
      blockedUsers,
      rejectedUsers,
    ] = await Promise.all([
      prisma.users.count({ where: { status: "APPROVED", isBlocked: false } }),
      prisma.users.count({ where: { status: "PENDING" } }),
      prisma.users.count({ where: { isBlocked: true } }),
      prisma.users.count({ where: { status: "REJECTED" } }),
    ]);

    // Статистика курсов
    const [
      publishedCourses,
      draftCourses,
    ] = await Promise.all([
      prisma.courses.count({ where: { isPublished: true } }),
      prisma.courses.count({ where: { isPublished: false } }),
    ]);

    // Финансовая статистика
    const [
      totalBalance,
      monthlyIncome,
      monthlyExpenses,
    ] = await Promise.all([
      prisma.finance_accounts.aggregate({
        _sum: { balance: true }
      }),
      prisma.finance_transactions.aggregate({
        _sum: { amount: true },
        where: { 
          type: "INCOME",
          date: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) }
        }
      }),
      prisma.finance_transactions.aggregate({
        _sum: { amount: true },
        where: { 
          type: "EXPENSE",
          date: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) }
        }
      }),
    ]);

    // Статистика за последние 7 дней
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const [
      newUsersThisWeek,
      newCoursesThisWeek,
      newTransactionsThisWeek,
    ] = await Promise.all([
      prisma.users.count({
        where: { createdAt: { gte: weekAgo } },
      }),
      prisma.courses.count({
        where: { createdAt: { gte: weekAgo } },
      }),
      prisma.finance_transactions.count({
        where: { createdAt: { gte: weekAgo } },
      }),
    ]);

    // Распределение пользователей по ролям
    const usersByRole = await prisma.users.groupBy({
      by: ["role"],
      _count: { role: true },
    });

    // Распределение транзакций по типам
    const transactionsByType = await prisma.finance_transactions.groupBy({
      by: ["type"],
      _count: { type: true },
    });

    // Распределение счетов по валютам
    const accountsByCurrency = await prisma.finance_accounts.groupBy({
      by: ["currency"],
      _sum: { balance: true },
    });

    return NextResponse.json({
      overview: {
        totalUsers,
        totalCourses,
        totalAccounts,
        totalTransactions,
      },
      users: {
        active: activeUsers,
        pending: pendingUsers,
        blocked: blockedUsers,
        rejected: rejectedUsers,
        byRole: usersByRole.reduce((acc, item) => {
          acc[item.role] = item._count.role || 0;
          return acc;
        }, {} as Record<string, number>),
      },
      courses: {
        published: publishedCourses,
        draft: draftCourses,
        newThisWeek: newCoursesThisWeek,
      },
      finance: {
        totalBalance: totalBalance._sum.balance || 0,
        monthlyIncome: monthlyIncome._sum.amount || 0,
        monthlyExpenses: monthlyExpenses._sum.amount || 0,
        newTransactionsThisWeek: newTransactionsThisWeek,
        byType: transactionsByType.reduce((acc, item) => {
          acc[item.type] = item._count.type || 0;
          return acc;
        }, {} as Record<string, number>),
        byCurrency: accountsByCurrency.reduce((acc, item) => {
          acc[item.currency] = item._sum.balance || 0;
          return acc;
        }, {} as Record<string, number>),
      },
      weekly: {
        newUsers: newUsersThisWeek,
        newCourses: newCoursesThisWeek,
        newTransactions: newTransactionsThisWeek,
      },
    });
  } catch (error: any) {
    console.error("Ошибка при получении статистики:", error);
    return NextResponse.json(
      { error: error.message || "Не удалось получить статистику" },
      { status: error.message === "Не авторизован" ? 401 : error.message === "Недостаточно прав" ? 403 : 500 }
    );
  }
}

