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

// GET /api/admin/finance/counterparties - Получение списка контрагентов
export async function GET(request: NextRequest) {
  try {
    await checkAdminAuth();
    
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    
    const where: any = {};
    
    if (type) {
      where.type = type;
    }
    
    if (status) {
      where.isArchived = status === 'archived';
    }
    
    const counterparties = await prisma.finance_counterparties.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        type: true,
        email: true,
        phone: true,
        address: true,
        taxNumber: true,
        bankDetails: true,
        isArchived: true,
        createdAt: true,
        updatedAt: true,
      }
    });
    
    return NextResponse.json({ counterparties });
  } catch (error: any) {
    console.error("Ошибка при получении контрагентов:", error);
    return NextResponse.json(
      { error: error.message || "Не удалось получить контрагентов" },
      { status: error.message === "Не авторизован" ? 401 : error.message === "Недостаточно прав" ? 403 : 500 }
    );
  }
}

// POST /api/admin/finance/counterparties - Создание нового контрагента
export async function POST(request: NextRequest) {
  try {
    await checkAdminAuth();
    
    const body = await request.json();
    const { name, type, email, phone, address, taxNumber, bankDetails, isArchived = false } = body;

    if (!name) {
      return NextResponse.json({ error: "Название контрагента обязательно" }, { status: 400 });
    }

    const counterparty = await prisma.finance_counterparties.create({
      data: {
        name,
        type: type || "CLIENT",
        email,
        phone,
        address,
        taxNumber,
        bankDetails,
        isArchived,
      }
    });
    
    return NextResponse.json(counterparty, { status: 201 });
  } catch (error: any) {
    console.error("Ошибка при создании контрагента:", error);
    return NextResponse.json(
      { error: error.message || "Не удалось создать контрагента" },
      { status: error.message === "Не авторизован" ? 401 : error.message === "Недостаточно прав" ? 403 : 500 }
    );
  }
}
