import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUserFromCookies } from "@/lib/auth";

// GET /api/admin/finance/accounts
export async function GET() {
  try {
    const user = await getAuthenticatedUserFromCookies();

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ message: "Недостаточно прав" }, { status: 403 });
    }

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
  } catch (e: unknown) {
    const error = e as Error;
    return NextResponse.json(
      { message: error.message || "Server error" },
      { status: error.message === "Не авторизован" ? 401 : 500 }
    );
  }
}

// POST /api/admin/finance/accounts
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUserFromCookies();

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ message: "Недостаточно прав" }, { status: 403 });
    }

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
  } catch (e: unknown) {
    const error = e as Error;
    return NextResponse.json(
      { message: error.message || "Server error" },
      { status: error.message === "Не авторизован" ? 401 : 500 }
    );
  }
}


