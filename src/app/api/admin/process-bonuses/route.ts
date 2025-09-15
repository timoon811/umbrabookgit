import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentDayStartUTC3 } from "@/lib/time-utils";

export async function POST(request: NextRequest) {
  try {
    console.log('🔥 Запуск обработки бонусов (сгорание и активация)...');

    const now = new Date();
    const todayStart = getCurrentDayStartUTC3();

    // 1. Активируем бонусы, срок холда которых истек
    const expiredHolds = await prisma.bonus_payments.findMany({
      where: {
        status: 'HELD',
        holdUntil: {
          lte: now
        }
      }
    });

    if (expiredHolds.length > 0) {
      await prisma.bonus_payments.updateMany({
        where: {
          id: { in: expiredHolds.map(b => b.id) }
        },
        data: {
          status: 'APPROVED'
        }
      });

      console.log(`✅ Активировано ${expiredHolds.length} бонусов из холда`);
    }

    // 2. Проверяем условия сгорания для каждого менеджера
    const activeManagers = await prisma.users.findMany({
      where: {
        role: 'PROCESSOR',
        status: 'APPROVED'
      },
      select: { id: true, name: true, email: true }
    });

    let burnedCount = 0;

    for (const manager of activeManagers) {
      // Получаем бонусы в холде за вчера
      const yesterdayStart = new Date(todayStart);
      yesterdayStart.setUTCDate(yesterdayStart.getUTCDate() - 1);

      const yesterdayEnd = new Date(todayStart);
      yesterdayEnd.setUTCMilliseconds(-1); // Конец вчерашнего дня

      const yesterdayBonuses = await prisma.bonus_payments.findMany({
        where: {
          processorId: manager.id,
          status: 'HELD',
          period: {
            gte: yesterdayStart,
            lte: yesterdayEnd
          }
        }
      });

      if (yesterdayBonuses.length === 0) continue;

      // Получаем депозиты за вчера и сегодня
      const yesterdayDeposits = await prisma.processor_deposits.findMany({
        where: {
          processorId: manager.id,
          status: 'APPROVED',
          createdAt: {
            gte: yesterdayStart,
            lte: yesterdayEnd
          }
        }
      });

      const todayDeposits = await prisma.processor_deposits.findMany({
        where: {
          processorId: manager.id,
          status: 'APPROVED',
          createdAt: {
            gte: todayStart
          }
        }
      });

      const yesterdaySum = yesterdayDeposits.reduce((sum, d) => sum + d.amount, 0);
      const todaySum = todayDeposits.reduce((sum, d) => sum + d.amount, 0);

      // Проверяем условие сгорания: результат сегодня в 2 раза меньше вчерашнего
      const shouldBurn = todaySum < (yesterdaySum / 2);

      if (shouldBurn && yesterdayBonuses.length > 0) {
        // Сжигаем бонусы
        await prisma.bonus_payments.updateMany({
          where: {
            id: { in: yesterdayBonuses.map(b => b.id) }
          },
          data: {
            status: 'BURNED',
            burnReason: `Результат сегодня ($${todaySum}) в 2 раза меньше вчерашнего ($${yesterdaySum})`,
            burnedAt: now
          }
        });

        burnedCount += yesterdayBonuses.length;
        const totalBurnedAmount = yesterdayBonuses.reduce((sum, b) => sum + b.amount, 0);

        console.log(`🔥 Сгорели бонусы менеджера ${manager.name}:`);
        console.log(`   - Вчерашний результат: $${yesterdaySum}`);
        console.log(`   - Сегодняшний результат: $${todaySum}`);
        console.log(`   - Сгорело бонусов: ${yesterdayBonuses.length} шт.`);
        console.log(`   - Сумма сгорания: $${totalBurnedAmount}`);
      }
    }

    // 3. Обновляем статистику бонусов
    const stats = {
      activated: expiredHolds.length,
      burned: burnedCount,
      processedAt: now.toISOString()
    };

    console.log('✅ Обработка бонусов завершена:', stats);

    return NextResponse.json({
      success: true,
      stats,
      message: `Обработано ${expiredHolds.length} активаций и ${burnedCount} сгораний бонусов`
    });

  } catch (error) {
    console.error('❌ Ошибка обработки бонусов:', error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}
