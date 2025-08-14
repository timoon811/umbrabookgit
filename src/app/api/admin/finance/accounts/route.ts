import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

// GET /api/admin/finance/accounts
export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
    const accounts = await prisma.financeAccount.findMany({ orderBy: { createdAt: "asc" } });
    return NextResponse.json(accounts);
  } catch (e: any) {
    return NextResponse.json({ message: e.message || "Server error" }, { status: e.message === "Не авторизован" ? 401 : 500 });
  }
}

// POST /api/admin/finance/accounts
export async function POST(request: NextRequest) {
  try {
    const user = await requireAdmin(request);
    const body = await request.json();
    const { name, type = "OTHER", currency = "RUB" } = body || {};
    if (!name) return NextResponse.json({ error: "name required" }, { status: 400 });
    const acc = await prisma.financeAccount.create({ data: { name, type, currency } });
    return NextResponse.json(acc, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ message: e.message || "Server error" }, { status: e.message === "Не авторизован" ? 401 : 500 });
  }
}


