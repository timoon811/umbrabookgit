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

// GET /api/admin/finance/accounts/[id] - Получение счета по ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await checkAdminAuth();

    const account = await prisma.finance_accounts.findUnique({
      where: { id: params.id }
    });

    if (!account) {
      return NextResponse.json({ error: "Счет не найден" }, { status: 404 });
    }

    // Преобразуем cryptocurrencies из JSON строки в массив
    const processedAccount = {
      ...account,
      cryptocurrencies: account.cryptocurrencies ? JSON.parse(account.cryptocurrencies) : []
    };

    return NextResponse.json({ account: processedAccount });
  } catch (error: any) {
    console.error("Ошибка при получении счета:", error);
    return NextResponse.json(
      { error: error.message || "Не удалось получить счет" },
      { status: error.message === "Не авторизован" ? 401 : error.message === "Недостаточно прав" ? 403 : 500 }
    );
  }
}

// PATCH /api/admin/finance/accounts/[id] - Обновление счета
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await checkAdminAuth();

    const body = await request.json();
    const { name, type, currency, balance, commission, cryptocurrencies } = body;

    // Проверяем, существует ли счет
    const existingAccount = await prisma.finance_accounts.findUnique({
      where: { id: params.id }
    });

    if (!existingAccount) {
      return NextResponse.json({ error: "Счет не найден" }, { status: 404 });
    }

    const cryptocurrenciesJson = cryptocurrencies && cryptocurrencies.length > 0
      ? JSON.stringify(cryptocurrencies)
      : null;

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (type !== undefined) updateData.type = type;
    if (currency !== undefined) updateData.currency = currency;
    if (balance !== undefined) updateData.balance = balance;
    if (commission !== undefined) updateData.commission = parseFloat(commission) || 0;
    if (cryptocurrencies !== undefined) updateData.cryptocurrencies = cryptocurrenciesJson;

    const updatedAccount = await prisma.finance_accounts.update({
      where: { id: params.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        type: true,
        currency: true,
        balance: true,
        commission: true,
        cryptocurrencies: true,
        isArchived: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    // Преобразуем cryptocurrencies из JSON строки в массив для ответа
    const processedAccount = {
      ...updatedAccount,
      cryptocurrencies: updatedAccount.cryptocurrencies ? JSON.parse(updatedAccount.cryptocurrencies) : []
    };

    return NextResponse.json(processedAccount);
  } catch (error: any) {
    console.error("Ошибка при обновлении счета:", error);
    return NextResponse.json(
      { error: error.message || "Не удалось обновить счет" },
      { status: error.message === "Не авторизован" ? 401 : error.message === "Недостаточно прав" ? 403 : 500 }
    );
  }
}

// DELETE /api/admin/finance/accounts/[id] - Удаление счета
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await checkAdminAuth();

    // Проверяем, существует ли счет
    const existingAccount = await prisma.finance_accounts.findUnique({
      where: { id: params.id }
    });

    if (!existingAccount) {
      return NextResponse.json({ error: "Счет не найден" }, { status: 404 });
    }

    // Удаляем счет
    await prisma.finance_accounts.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ message: "Счет успешно удален" });
  } catch (error: any) {
    console.error("Ошибка при удалении счета:", error);
    return NextResponse.json(
      { error: error.message || "Не удалось удалить счет" },
      { status: error.message === "Не авторизован" ? 401 : error.message === "Недостаточно прав" ? 403 : 500 }
    );
  }
}
