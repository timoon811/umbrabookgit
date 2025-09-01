import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

const JWT_SECRET = process.env.JWT_SECRET || "umbra_platform_super_secret_jwt_key_2024";

// Проверка прав администратора
async function checkAdminAuth(request: NextRequest) {
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

// GET /api/admin/managers/[id]/stats - Получение статистики менеджера
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await checkAdminAuth(request);
    const managerId = params.id;

    // Получаем все депозиты менеджера
    const allDeposits = await prisma.processor_deposits.findMany({
      where: { processorId: managerId },
      select: {
        amount: true,
        bonusAmount: true,
        createdAt: true,
      },
    });

    // Получаем депозиты за текущий месяц
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const thisMonthDeposits = allDeposits.filter(
      deposit => new Date(deposit.createdAt) >= monthStart
    );

    // Рассчитываем статистику
    const totalDeposits = allDeposits.length;
    const totalAmount = allDeposits.reduce((sum, d) => sum + d.amount, 0);
    const totalBonuses = allDeposits.reduce((sum, d) => sum + d.bonusAmount, 0);
    
    const thisMonthCount = thisMonthDeposits.length;
    const thisMonthAmount = thisMonthDeposits.reduce((sum, d) => sum + d.amount, 0);
    const thisMonthBonuses = thisMonthDeposits.reduce((sum, d) => sum + d.bonusAmount, 0);

    // Средний процент бонуса
    const avgBonusRate = totalAmount > 0 ? (totalBonuses / totalAmount) * 100 : 0;

    const stats = {
      totalDeposits,
      totalAmount: Math.round(totalAmount * 100) / 100,
      totalBonuses: Math.round(totalBonuses * 100) / 100,
      avgBonusRate: Math.round(avgBonusRate * 100) / 100,
      thisMonthDeposits: thisMonthCount,
      thisMonthAmount: Math.round(thisMonthAmount * 100) / 100,
      thisMonthBonuses: Math.round(thisMonthBonuses * 100) / 100,
    };

    return NextResponse.json(stats);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Неизвестная ошибка";
    console.error("Ошибка получения статистики менеджера:", error);
    return NextResponse.json(
      { error: errorMessage },
      { status: errorMessage === "Не авторизован" ? 401 : errorMessage === "Недостаточно прав" ? 403 : 500 }
    );
  }
}
