import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminAuth } from "@/lib/api-auth";

// PUT /api/admin/deposits/manage?depositId=xxx - Обновление депозита
export async function PUT(request: NextRequest) {
  const authResult = await requireAdminAuth(request);
  if ('error' in authResult) {
    return authResult.error;
  }

  try {
    const { searchParams } = new URL(request.url);
    const depositId = searchParams.get('depositId');

    if (!depositId) {
      return NextResponse.json(
        { error: "ID депозита обязателен" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { 
      amount, 
      currency, 
      playerEmail, 
      notes, 
      paymentMethod 
    } = body;

    // Валидация обязательных полей
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: "Сумма депозита должна быть больше 0" },
        { status: 400 }
      );
    }

    if (!currency) {
      return NextResponse.json(
        { error: "Валюта обязательна" },
        { status: 400 }
      );
    }

    if (!playerEmail || !playerEmail.includes('@')) {
      return NextResponse.json(
        { error: "Корректный email депозитера обязателен" },
        { status: 400 }
      );
    }

    // Проверяем, существует ли депозит
    const existingDeposit = await prisma.processor_deposits.findUnique({
      where: { id: depositId }
    });

    if (!existingDeposit) {
      return NextResponse.json(
        { error: "Депозит не найден" },
        { status: 404 }
      );
    }

    // Определяем тип валюты
    const cryptoCurrencies = ['USDT_TRC20', 'USDT_ERC20', 'BTC', 'ETH', 'LTC'];
    const currencyType = cryptoCurrencies.includes(currency) ? 'CRYPTO' : 'FIAT';

    // Обновляем депозит
    const updatedDeposit = await prisma.processor_deposits.update({
      where: { id: depositId },
      data: {
        amount: parseFloat(amount.toString()),
        currency,
        currencyType,
        playerEmail,
        playerId: playerEmail, // Используем email как playerId
        notes: notes || null,
        paymentMethod: paymentMethod || null,
        updatedAt: new Date()
      },
      include: {
        processor: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    console.log(`✅ Депозит ${depositId} обновлен администратором ${authResult.user.email}`);

    return NextResponse.json({
      message: "Депозит успешно обновлен",
      deposit: updatedDeposit
    });

  } catch (error) {
    console.error("Ошибка при обновлении депозита:", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/deposits/manage?depositId=xxx - Удаление депозита
export async function DELETE(request: NextRequest) {
  const authResult = await requireAdminAuth(request);
  if ('error' in authResult) {
    return authResult.error;
  }

  try {
    const { searchParams } = new URL(request.url);
    const depositId = searchParams.get('depositId');

    if (!depositId) {
      return NextResponse.json(
        { error: "ID депозита обязателен" },
        { status: 400 }
      );
    }

    // Проверяем, существует ли депозит
    const existingDeposit = await prisma.processor_deposits.findUnique({
      where: { id: depositId },
      include: {
        processor: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    if (!existingDeposit) {
      return NextResponse.json(
        { error: "Депозит не найден" },
        { status: 404 }
      );
    }

    // Удаляем депозит
    await prisma.processor_deposits.delete({
      where: { id: depositId }
    });

    console.log(`🗑️ Депозит ${depositId} удален администратором ${authResult.user.email}`);
    console.log(`   Сумма: $${existingDeposit.amount}, Менеджер: ${existingDeposit.processor.name}`);

    return NextResponse.json({
      message: "Депозит успешно удален"
    });

  } catch (error) {
    console.error("Ошибка при удалении депозита:", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}
