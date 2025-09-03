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

// GET /api/admin/finance/counterparties/[id] - Получение контрагента по ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await checkAdminAuth();
    
    const counterparty = await prisma.finance_counterparties.findUnique({
      where: { id: params.id }
    });
    
    if (!counterparty) {
      return NextResponse.json({ error: "Контрагент не найден" }, { status: 404 });
    }
    
    return NextResponse.json({ counterparty });
  } catch (error: any) {
    console.error("Ошибка при получении контрагента:", error);
    return NextResponse.json(
      { error: error.message || "Не удалось получить контрагента" },
      { status: error.message === "Не авторизован" ? 401 : error.message === "Недостаточно прав" ? 403 : 500 }
    );
  }
}

// PATCH /api/admin/finance/counterparties/[id] - Обновление контрагента
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await checkAdminAuth();
    
    const body = await request.json();
    const { name, type, email, phone, address, taxNumber, bankDetails, isArchived } = body;

    // Проверяем, существует ли контрагент
    const existingCounterparty = await prisma.finance_counterparties.findUnique({
      where: { id: params.id }
    });

    if (!existingCounterparty) {
      return NextResponse.json({ error: "Контрагент не найден" }, { status: 404 });
    }

    // Обновляем только разрешенные поля
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (type !== undefined) updateData.type = type;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (address !== undefined) updateData.address = address;
    if (taxNumber !== undefined) updateData.taxNumber = taxNumber;
    if (bankDetails !== undefined) updateData.bankDetails = bankDetails;
    if (isArchived !== undefined) updateData.isArchived = isArchived;

    const updatedCounterparty = await prisma.finance_counterparties.update({
      where: { id: params.id },
      data: updateData,
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
    
    return NextResponse.json(updatedCounterparty);
  } catch (error: any) {
    console.error("Ошибка при обновлении контрагента:", error);
    return NextResponse.json(
      { error: error.message || "Не удалось обновить контрагента" },
      { status: error.message === "Не авторизован" ? 401 : error.message === "Недостаточно прав" ? 403 : 500 }
    );
  }
}

// DELETE /api/admin/finance/counterparties/[id] - Удаление контрагента
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await checkAdminAuth();
    
    // Проверяем, существует ли контрагент
    const existingCounterparty = await prisma.finance_counterparties.findUnique({
      where: { id: params.id }
    });
    
    if (!existingCounterparty) {
      return NextResponse.json({ error: "Контрагент не найден" }, { status: 404 });
    }
    
    // Удаляем контрагента
    await prisma.finance_counterparties.delete({
      where: { id: params.id }
    });
    
    return NextResponse.json({ message: "Контрагент успешно удален" });
  } catch (error: any) {
    console.error("Ошибка при удалении контрагента:", error);
    return NextResponse.json(
      { error: error.message || "Не удалось удалить контрагента" },
      { status: error.message === "Не авторизован" ? 401 : error.message === "Недостаточно прав" ? 403 : 500 }
    );
  }
}
