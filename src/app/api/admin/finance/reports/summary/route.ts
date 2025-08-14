import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const where: any = {};
    if (from) where.occurredAt = { gte: new Date(from) };
    if (to) where.occurredAt = { ...(where.occurredAt||{}), lte: new Date(to + 'T23:59:59') };

    const txs = await prisma.financeTransaction.findMany({ where });
    const income = txs.filter(t => t.type === 'INCOME').reduce((s, t) => s + Number(t.amount), 0);
    const expense = txs.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + Number(t.amount), 0);

    const byAccountAgg = await prisma.financeTransaction.groupBy({ by: ['accountId', 'type'], where, _sum: { amount: true } });
    const accounts = await prisma.financeAccount.findMany({ select: { id: true, name: true } });
    const idToName = Object.fromEntries(accounts.map(a => [a.id, a.name]));
    const byAccountMap: Record<string, { income: number; expense: number }> = {};
    for (const row of byAccountAgg) {
      const key = idToName[row.accountId] || row.accountId;
      const bucket = byAccountMap[key] || { income: 0, expense: 0 };
      if (row.type === 'INCOME') bucket.income += Number(row._sum.amount || 0);
      if (row.type === 'EXPENSE') bucket.expense += Number(row._sum.amount || 0);
      byAccountMap[key] = bucket;
    }
    const byAccount = Object.entries(byAccountMap).map(([account, v]) => ({ account, income: v.income.toFixed(2), expense: v.expense.toFixed(2) }));

    const byProjectAgg = await prisma.financeTransaction.groupBy({ by: ['projectKey', 'type'], where, _sum: { amount: true } });
    const byProjectMap: Record<string, { income: number; expense: number }> = {};
    for (const row of byProjectAgg) {
      const key = row.projectKey || '—';
      const bucket = byProjectMap[key] || { income: 0, expense: 0 };
      if (row.type === 'INCOME') bucket.income += Number(row._sum.amount || 0);
      if (row.type === 'EXPENSE') bucket.expense += Number(row._sum.amount || 0);
      byProjectMap[key] = bucket;
    }
    const byProject = Object.entries(byProjectMap).map(([projectKey, v]) => ({ projectKey, income: v.income.toFixed(2), expense: v.expense.toFixed(2) }));

    return NextResponse.json({ income: income.toFixed(2), expense: expense.toFixed(2), byAccount, byProject });
  } catch (e: any) {
    return NextResponse.json({ message: e.message || "Server error" }, { status: e.message === "Не авторизован" ? 401 : 500 });
  }
}


