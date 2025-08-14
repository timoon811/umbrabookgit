import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Публичный список воркспейсов для хедера
export async function GET(_req: NextRequest) {
  try {
    const categories = await prisma.category.findMany({
      where: { isWorkspace: true, isActive: true },
      select: { key: true, name: true, order: true },
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    });
    return NextResponse.json(categories);
  } catch (e: any) {
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}


