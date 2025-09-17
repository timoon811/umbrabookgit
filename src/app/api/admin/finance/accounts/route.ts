import { checkAdminAuthUserId } from "@/lib/admin-auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminAuth } from '@/lib/api-auth';

// GET /api/admin/finance/accounts
export async function GET() {
  try {
  

    const authResult = await requireAdminAuth(request);
  
    if ('error' in authResult) {
    return authResult.error;
  }
  
  const { user } = authResult;


    await checkAdminAuthUserId();

    const accounts = await prisma.finance_accounts.findMany({
      orderBy: { createdAt: "asc" },
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

    // Преобразуем cryptocurrencies из JSON строки в массив
    const processedAccounts = accounts.map((account) => ({
      ...account,
      cryptocurrencies: account.cryptocurrencies ? JSON.parse(account.cryptocurrencies) : []
    }));

    return NextResponse.json(processedAccounts);
  } catch (error: any) {
    console.error("Ошибка при получении счетов:", error);
    return NextResponse.json(
      { error: error.message || "Не удалось получить счета" },
      { status: error.message === "Не авторизован" ? 401 : error.message === "Недостаточно прав" ? 403 : 500 }
    );
  }
}

// POST /api/admin/finance/accounts
export async function POST(request: NextRequest) {
  try {
  

    const authResult = await requireAdminAuth(request);
  
    if ('error' in authResult) {
    return authResult.error;
  }
  
  const { user } = authResult;


    await checkAdminAuthUserId();

    const body = await request.json();
    const { name, type = "OTHER", currency = "USD", balance = 0, commission = 0, cryptocurrencies } = body || {};
    if (!name) return NextResponse.json({ error: "name required" }, { status: 400 });

    const cryptocurrenciesJson = cryptocurrencies && cryptocurrencies.length > 0
      ? JSON.stringify(cryptocurrencies)
      : null;

    const acc = await prisma.finance_accounts.create({
      data: {
        name,
        type,
        currency,
        balance,
        commission: parseFloat(commission) || 0,
        cryptocurrencies: cryptocurrenciesJson
      }
    });
    return NextResponse.json(acc, { status: 201 });
  } catch (error: any) {
    console.error("Ошибка при создании счета:", error);
    return NextResponse.json(
      { error: error.message || "Не удалось создать счет" },
      { status: error.message === "Не авторизован" ? 401 : error.message === "Недостаточно прав" ? 403 : 500 }
    );
  }
}


