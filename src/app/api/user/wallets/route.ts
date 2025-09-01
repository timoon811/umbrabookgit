import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

// Получить все кошельки пользователя
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("auth-token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const wallets = await prisma.user_wallets.findMany({
      where: {
        userId: decoded.userId,
        isActive: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ wallets });
  } catch (error) {
    console.error("Error fetching wallets:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Создать новый кошелек
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("auth-token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const { network, address, label } = await request.json();

    if (!network || !address) {
      return NextResponse.json(
        { error: "Network and address are required" },
        { status: 400 }
      );
    }

    // Проверяем, что сеть поддерживается
    const supportedNetworks = [
      "BTC",
      "ETH",
      "TRX",
      "USDT_TRC20",
      "USDT_ERC20",
      "USDT_BEP20",
      "USDT_SOL20",
      "USDC",
      "XRP",
      "BASE",
      "BNB",
      "TRON",
      "TON",
      "SOLANA",
    ];

    if (!supportedNetworks.includes(network)) {
      return NextResponse.json(
        { error: "Unsupported network" },
        { status: 400 }
      );
    }

    // Проверяем, что у пользователя еще нет кошелька в этой сети
    const existingWallet = await prisma.user_wallets.findFirst({
      where: {
        userId: decoded.userId,
        network,
        isActive: true,
      },
    });

    if (existingWallet) {
      return NextResponse.json(
        { error: "Wallet for this network already exists" },
        { status: 400 }
      );
    }

    const wallet = await prisma.user_wallets.create({
      data: {
        userId: decoded.userId,
        network,
        address: address.trim(),
        label: label?.trim() || null,
      },
    });

    return NextResponse.json({ wallet }, { status: 201 });
  } catch (error) {
    console.error("Error creating wallet:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Обновить кошелек
export async function PUT(request: NextRequest) {
  try {
    const token = request.cookies.get("auth-token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const { id, address, label } = await request.json();

    if (!id || !address) {
      return NextResponse.json(
        { error: "ID and address are required" },
        { status: 400 }
      );
    }

    // Проверяем, что кошелек принадлежит пользователю
    const existingWallet = await prisma.user_wallets.findFirst({
      where: {
        id,
        userId: decoded.userId,
        isActive: true,
      },
    });

    if (!existingWallet) {
      return NextResponse.json(
        { error: "Wallet not found" },
        { status: 404 }
      );
    }

    const wallet = await prisma.user_wallets.update({
      where: { id },
      data: {
        address: address.trim(),
        label: label?.trim() || null,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ wallet });
  } catch (error) {
    console.error("Error updating wallet:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Удалить кошелек (soft delete)
export async function DELETE(request: NextRequest) {
  try {
    const token = request.cookies.get("auth-token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Wallet ID is required" },
        { status: 400 }
      );
    }

    // Проверяем, что кошелек принадлежит пользователю
    const existingWallet = await prisma.user_wallets.findFirst({
      where: {
        id,
        userId: decoded.userId,
        isActive: true,
      },
    });

    if (!existingWallet) {
      return NextResponse.json(
        { error: "Wallet not found" },
        { status: 404 }
      );
    }

    // Soft delete - помечаем как неактивный
    await prisma.user_wallets.update({
      where: { id },
      data: {
        isActive: false,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ message: "Wallet deleted successfully" });
  } catch (error) {
    console.error("Error deleting wallet:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
