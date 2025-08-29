import { NextRequest } from "next/server";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

const JWT_SECRET = process.env.JWT_SECRET || "umbra_platform_super_secret_jwt_key_2024";

export async function verifyToken(token: string) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      email: string;
      role: string;
    };

    const user = await prisma.users.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return null;
    }

    return user;
  } catch (error) {
    console.error("Ошибка верификации токена:", error);
    return null;
  }
}

// Функция getUserFromToken удалена - используйте verifyToken

export async function requireAdmin(requestOrToken: NextRequest | string) {
  try {
    let token: string;

    if (typeof requestOrToken === 'string') {
      token = requestOrToken;
    } else {
      // Извлекаем токен из cookies request
      token = requestOrToken.cookies.get("auth-token")?.value || '';
    }

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

    const user = await prisma.users.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,

      },
    });

    if (!user) {
      throw new Error("Пользователь не найден");
    }

    return user;
  } catch (error) {
    console.error("Ошибка проверки прав администратора:", error);
    throw new Error("Недостаточно прав");
  }
}

// Функция для проверки роли администратора на клиенте
export function isAdminRole(role: string): boolean {
  return role === "ADMIN";
}

// Функция для проверки прав администратора на клиенте
export function hasAdminAccess(user: { role: string } | null): boolean {
  return user !== null && user.role === "ADMIN";
}

// Утилиты для проверки аутентификации в API маршрутах
export async function getCurrentUser(request: NextRequest) {
  const token = request.cookies.get("auth-token")?.value;
  
  if (!token) {
    return null;
  }

  return await verifyToken(token);
}

export async function requireAuth(request: NextRequest) {
  const user = await getCurrentUser(request);
  
  if (!user) {
    throw new Error("Не авторизован");
  }

  return user;
}

export async function getAuthenticatedUserFromCookies() {
  if (typeof window !== 'undefined') {
    // На клиенте используем document.cookie
    const token = document.cookie
      .split('; ')
      .find(row => row.startsWith('auth-token='))
      ?.split('=')[1];
    
    if (!token) {
      return null;
    }

    return await verifyToken(token);
  } else {
    // На сервере используем cookies() из next/headers
    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();
    const token = cookieStore.get("auth-token")?.value;
    
    if (!token) {
      return null;
    }

    return await verifyToken(token);
  }
}
