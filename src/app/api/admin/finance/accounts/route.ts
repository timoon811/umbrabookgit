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

// GET /api/admin/finance/accounts
export async function GET() {
  try {
    await checkAdminAuth();

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
    await checkAdminAuth();

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


