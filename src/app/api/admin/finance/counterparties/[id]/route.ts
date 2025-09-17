import { checkAdminAuthUserId } from "@/lib/admin-auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminAuth } from '@/lib/api-auth';

// GET /api/admin/finance/counterparties/[id] - Получение контрагента по ID
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
    
    const counterparty = await prisma.finance_counterparties.findUnique({
      where: { id: (await params).id }
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
  const authResult = await requireAdminAuth(request);
  
    if ('error' in authResult) {
    return authResult.error;
  }
  
  const { user } = authResult;


    await checkAdminAuthUserId();
    
    const body = await request.json();
    const { name, type, email, phone, address, taxNumber, bankDetails, isArchived } = body;

    // Проверяем, существует ли контрагент
    const existingCounterparty = await prisma.finance_counterparties.findUnique({
      where: { id: (await params).id }
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
      where: { id: (await params).id },
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
  const authResult = await requireAdminAuth(request);
  
    if ('error' in authResult) {
    return authResult.error;
  }
  
  const { user } = authResult;


    await checkAdminAuthUserId();
    
    // Проверяем, существует ли контрагент
    const existingCounterparty = await prisma.finance_counterparties.findUnique({
      where: { id: (await params).id }
    });
    
    if (!existingCounterparty) {
      return NextResponse.json({ error: "Контрагент не найден" }, { status: 404 });
    }
    
    // Удаляем контрагента
    await prisma.finance_counterparties.delete({
      where: { id: (await params).id }
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
