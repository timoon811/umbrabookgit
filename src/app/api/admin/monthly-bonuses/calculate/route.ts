import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminAuth } from "@/lib/api-auth";

// POST /api/admin/monthly-bonuses/calculate - Расчет и начисление месячных бонусов
export async function POST(request: NextRequest) {
  const authResult = await requireAdminAuth(request);
  if ('error' in authResult) {
    return authResult.error;
  }

  try {
    const { month, year, dryRun = true } = await request.json();

    // Определяем период
    const currentDate = new Date();
    const targetYear = year || currentDate.getFullYear();
    const targetMonth = month !== undefined ? month : currentDate.getMonth();

    const startOfMonth = new Date(targetYear, targetMonth, 1);
    const endOfMonth = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59);

    console.log(`🎯 Расчет месячных бонусов за ${startOfMonth.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })}`);

    // Получаем активные месячные планы
    const monthlyPlans = await prisma.salary_monthly_bonus.findMany({
      where: { isActive: true },
      orderBy: { minAmount: 'desc' } // От большего к меньшему
    });

    if (monthlyPlans.length === 0) {
      return NextResponse.json({
        error: "Активные месячные планы не найдены"
      }, { status: 400 });
    }

    // Получаем всех активных менеджеров (включая админов для тестирования)
    const managers = await prisma.users.findMany({
      where: { 
        role: { in: ['PROCESSOR', 'ADMIN'] },
        status: 'APPROVED'
      }
    });

    const results = [];

    for (const manager of managers) {
      // Получаем все депозиты менеджера за указанный месяц
      const deposits = await prisma.processor_deposits.findMany({
        where: {
          processorId: manager.id,
          createdAt: {
            gte: startOfMonth,
            lte: endOfMonth
          }
        }
      });

      const totalMonthlyVolume = deposits.reduce((sum, deposit) => sum + deposit.amount, 0);

      // Определяем подходящий план (наибольший достигнутый)
      let applicablePlan = null;
      for (const plan of monthlyPlans) {
        if (totalMonthlyVolume >= plan.minAmount) {
          applicablePlan = plan;
          break; // Берем первый подходящий (самый высокий)
        }
      }

      const monthlyBonusAmount = applicablePlan 
        ? (totalMonthlyVolume * applicablePlan.bonusPercent / 100)
        : 0;

      let bonusPaymentId = null;

      // Если не тестовый режим и есть бонус - создаем запись о выплате
      if (!dryRun && monthlyBonusAmount > 0) {
        const bonusPayment = await prisma.bonus_payments.create({
          data: {
            processorId: manager.id,
            type: 'MONTHLY_PLAN_BONUS',
            amount: monthlyBonusAmount,
            description: `Месячный бонус за план "${applicablePlan.name}" ($${totalMonthlyVolume.toLocaleString()})`,
            periodStart: startOfMonth,
            periodEnd: endOfMonth,
            bonusPercent: applicablePlan.bonusPercent,
            isActive: true,
            status: 'PENDING' // Требует подтверждения администратора
          }
        });
        bonusPaymentId = bonusPayment.id;
      }

      results.push({
        managerId: manager.id,
        managerName: manager.name,
        managerEmail: manager.email,
        totalMonthlyVolume,
        depositsCount: deposits.length,
        applicablePlan: applicablePlan ? {
          id: applicablePlan.id,
          name: applicablePlan.name,
          minAmount: applicablePlan.minAmount,
          bonusPercent: applicablePlan.bonusPercent
        } : null,
        monthlyBonusAmount,
        bonusPaymentId,
        status: monthlyBonusAmount > 0 ? 'ELIGIBLE' : 'NOT_ELIGIBLE'
      });
    }

    // Сводная статистика
    const totalBonusAmount = results.reduce((sum, r) => sum + r.monthlyBonusAmount, 0);
    const eligibleManagers = results.filter(r => r.monthlyBonusAmount > 0).length;

    const summary = {
      period: {
        month: targetMonth,
        year: targetYear,
        startDate: startOfMonth.toISOString(),
        endDate: endOfMonth.toISOString(),
        displayName: startOfMonth.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })
      },
      plans: monthlyPlans.map(plan => ({
        id: plan.id,
        name: plan.name,
        minAmount: plan.minAmount,
        bonusPercent: plan.bonusPercent
      })),
      statistics: {
        totalManagers: managers.length,
        eligibleManagers,
        totalBonusAmount,
        averageBonusAmount: eligibleManagers > 0 ? totalBonusAmount / eligibleManagers : 0
      },
      results,
      dryRun
    };

    console.log(`✅ Расчет завершен: ${eligibleManagers}/${managers.length} менеджеров получат бонусы на сумму $${totalBonusAmount.toFixed(2)}`);

    return NextResponse.json(summary);

  } catch (error) {
    console.error("Ошибка расчета месячных бонусов:", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}
