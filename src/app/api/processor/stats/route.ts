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

    // Для админов показываем общую статистику, для процессоров - их личную
    const processorId = decoded.role === "ADMIN" ? null : decoded.userId;

    // Получаем текущую дату
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Статистика за сегодня
    const todayDeposits = await prisma.processor_deposits.findMany({
      where: {
        ...(processorId && { processorId }),
        createdAt: {
          gte: todayStart,
        },
      },
    });

    const todayStats = {
      depositsCount: todayDeposits.length,
      depositsSum: todayDeposits.reduce((sum, d) => sum + d.amount, 0),
      approvedSum: todayDeposits
        .filter(d => d.status === "APPROVED")
        .reduce((sum, d) => sum + d.amount, 0),
      pendingCount: todayDeposits.filter(d => d.status === "PENDING").length,
      rejectedCount: todayDeposits.filter(d => d.status === "REJECTED").length,
    };

    // Статистика за неделю
    const weekDeposits = await prisma.processor_deposits.findMany({
      where: {
        ...(processorId && { processorId }),
        createdAt: {
          gte: weekStart,
        },
        status: "APPROVED",
      },
    });

    // Статистика за месяц
    const monthDeposits = await prisma.processor_deposits.findMany({
      where: {
        ...(processorId && { processorId }),
        createdAt: {
          gte: monthStart,
        },
        status: "APPROVED",
      },
    });

    // Выплаченная зарплата за месяц
    const monthSalary = await prisma.salary_requests.findMany({
      where: {
        ...(processorId && { processorId }),
        status: "PAID",
        paidAt: {
          gte: monthStart,
        },
      },
    });

    // Бонусы за месяц
    const monthBonuses = await prisma.bonus_payments.findMany({
      where: {
        ...(processorId && { processorId }),
        status: "PAID",
        paidAt: {
          gte: monthStart,
        },
      },
    });

    // Баланс
    const allApprovedDeposits = await prisma.processor_deposits.findMany({
      where: {
        ...(processorId && { processorId }),
        status: "APPROVED",
      },
    });

    const allPaidSalary = await prisma.salary_requests.findMany({
      where: {
        ...(processorId && { processorId }),
        status: "PAID",
      },
    });

    const earned = allApprovedDeposits.reduce((sum, d) => sum + d.bonusAmount, 0);
    const paid = allPaidSalary.reduce((sum, s) => sum + (s.calculatedAmount || s.requestedAmount), 0);
    const available = earned - paid;

    const stats = {
      today: todayStats,
      period: {
        weekDeposits: weekDeposits.reduce((sum, d) => sum + d.amount, 0),
        monthDeposits: monthDeposits.reduce((sum, d) => sum + d.amount, 0),
        salaryPaid: monthSalary.reduce((sum, s) => sum + (s.calculatedAmount || s.requestedAmount), 0),
        bonuses: monthBonuses.reduce((sum, b) => sum + b.amount, 0),
      },
      balance: {
        earned: Math.round(earned * 100) / 100,
        paid: Math.round(paid * 100) / 100,
        pending: 0, // Pending заявки на зарплату
        available: Math.round(available * 100) / 100,
      },
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Ошибка получения статистики процессора:", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}
