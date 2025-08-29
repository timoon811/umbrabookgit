import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "production" ? ["error", "warn"] : ["query", "error", "warn"],
    errorFormat: "pretty",
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// Обработка подключения к базе данных отключена для совместимости с новой версией Prisma

// Функция для принудительного подключения
export async function connectPrisma() {
  try {
    await prisma.$connect();
    if (process.env.NODE_ENV !== "production") {
      console.log("Prisma Client connected successfully");
    }
  } catch (error) {
    console.error("Failed to connect Prisma Client:", error);
    throw error;
  }
}

// Функция для принудительного отключения
export async function disconnectPrisma() {
  try {
    await prisma.$disconnect();
    if (process.env.NODE_ENV !== "production") {
      console.log("Prisma Client disconnected successfully");
    }
  } catch (error) {
    console.error("Failed to disconnect Prisma Client:", error);
  }
}
