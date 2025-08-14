import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

// GET /api/admin/finance/transactions
export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
    const txs = await prisma.financeTransaction.findMany({
      include: { account: { select: { id: true, name: true, currency: true } } },
      orderBy: { occurredAt: "desc" },
      take: 200,
    });
    return NextResponse.json(txs);
  } catch (e: any) {
    return NextResponse.json({ message: e.message || "Server error" }, { status: e.message === "Не авторизован" ? 401 : 500 });
  }
}

// POST /api/admin/finance/transactions
export async function POST(request: NextRequest) {
  try {
    await requireAdmin(request);
    const body = await request.json();
    const { accountId, type, amount, description, projectKey, userId } = body || {};
    if (!accountId || !amount) return NextResponse.json({ error: "accountId and amount required" }, { status: 400 });
    const tx = await prisma.$transaction(async (db) => {
      const created = await db.financeTransaction.create({ data: { accountId, type, amount, description, projectKey, userId } });
      // обновим баланс: INCOME +, EXPENSE -, TRANSFER не трогаем (в упрощении)
      if (type === 'INCOME') await db.financeAccount.update({ where: { id: accountId }, data: { balance: { increment: amount } } });
      else if (type === 'EXPENSE') await db.financeAccount.update({ where: { id: accountId }, data: { balance: { decrement: amount } } });
      return created;
    });
    return NextResponse.json(tx, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ message: e.message || "Server error" }, { status: e.message === "Не авторизован" ? 401 : 500 });
  }
}


