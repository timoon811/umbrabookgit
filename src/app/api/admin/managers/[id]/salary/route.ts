import { checkAdminAuthUserId } from "@/lib/admin-auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminAuth } from '@/lib/api-auth';

// GET /api/admin/managers/[id]/salary - Получение данных о зарплате менеджера
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
  const authResult = await requireAdminAuth(request);
  
    if ('error' in authResult) {
    return authResult.error;
  }
  
  const { user } = authResult;


    await checkAdminAuthUserId();
    const { id: processorId } = await params;

    // Получаем данные пользователя и его зарплатную информацию
        const targetUser = await prisma.users.findUnique({
      where: { id: processorId },
      include: {
        salaryRequests: {
          where: { status: "PAID" },
          orderBy: { paidAt: "desc" },
          take: 1,
        },
        processorDeposits: {
          where: { 
            createdAt: {
              gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
            }
          }
        }
      }
    });

        if (!targetUser) {
      return NextResponse.json(
        { error: "Пользователь не найден" },
        { status: 404 }
      );
    }

    // Рассчитываем статистику зарплаты
    const monthlyEarnings = targetUser.processorDeposits.reduce((sum, d) => sum + d.processorEarnings, 0);
    const lastPaidRequest = targetUser.salaryRequests[0];
    const totalPaid = targetUser.salaryRequests.reduce((sum, s) => sum + (s.calculatedAmount || s.requestedAmount), 0);

    const salaryData = {
      baseSalary: 0, // Base hourly rate (можно добавить в схему)
      commissionRate: 30.0, // Default commission rate
      bonusMultiplier: 1.0,
      monthlyEarnings: Math.round(monthlyEarnings * 100) / 100,
      lastPaid: lastPaidRequest?.paidAt || null,
      lastPaidAmount: lastPaidRequest ? (lastPaidRequest.calculatedAmount || lastPaidRequest.requestedAmount) : 0,
      totalPaid: Math.round(totalPaid * 100) / 100,
      availableForPayout: Math.round(monthlyEarnings * 100) / 100,
    };

    return NextResponse.json(salaryData);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Неизвестная ошибка";
    console.error("Ошибка получения данных о зарплате:", error);
    return NextResponse.json(
      { error: errorMessage },
      { status: errorMessage === "Не авторизован" ? 401 : errorMessage === "Недостаточно прав" ? 403 : 500 }
    );
  }
}

// PUT /api/admin/managers/[id]/salary - Обновление данных о зарплате менеджера
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
  const authResult = await requireAdminAuth(request);
  
    if ('error' in authResult) {
    return authResult.error;
  }
  
  const { user } = authResult;


    await checkAdminAuthUserId();
    const { id: processorId } = await params;
    const data = await request.json();

    // Здесь можно сохранить данные о зарплате в базу данных
    // Пока возвращаем обновленные данные
    const updatedSalary = {
      baseSalary: data.baseSalary || 0,
      commissionRate: data.commissionRate || 0,
      bonusMultiplier: data.bonusMultiplier || 1.0,
      lastPaid: data.lastPaid || null,
      totalPaid: data.totalPaid || 0,
    };

    return NextResponse.json(updatedSalary);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Неизвестная ошибка";
    console.error("Ошибка обновления данных о зарплате:", error);
    return NextResponse.json(
      { error: errorMessage },
      { status: errorMessage === "Не авторизован" ? 401 : errorMessage === "Недостаточно прав" ? 403 : 500 }
    );
  }
}
