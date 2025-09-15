import { NextRequest } from "next/server";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";
import { hasAdminAccess } from "./permissions";
import { UserRole } from "@/types/roles";
import { getJwtSecret } from "@/lib/jwt";

const JWT_SECRET = getJwtSecret();

export async function verifyToken(token: string) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET!) as {
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

    const decoded = jwt.verify(token, JWT_SECRET!) as {
      userId: string;
      role: string;
    };

    if (!hasAdminAccess(decoded.role as UserRole)) {
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
  return hasAdminAccess(role as UserRole);
}

// Функция для проверки прав администратора на клиенте
export function hasClientAdminAccess(user: { role: string } | null): boolean {
  return user !== null && hasAdminAccess(user.role as UserRole);
}

// Утилиты для проверки аутентификации в API маршрутах
export async function getCurrentUser(request: NextRequest) {
  const token = request.cookies.get("auth-token")?.value;
  
  if (!token) {
    return null;
  }

  return await verifyToken(token);
}

// Функция requireAuth перенесена в api-auth.ts для API роутов
// Для серверных компонентов используйте getCurrentUser

export async function getAuthenticatedUserFromCookies() {
  if (typeof window !== 'undefined') {
    // На клиенте НЕ МОЖЕМ читать httpOnly cookies
    // Вместо этого используем API /auth/me
    try {
      const response = await fetch("/api/auth/me", {
        credentials: "include",
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
      });

      if (response.ok) {
        const data = await response.json();
        return {
          id: data.user.id,
          email: data.user.email,
          name: data.user.name,
          role: data.user.role,
        };
      }
    } catch (error) {
      console.error("Ошибка получения пользователя:", error);
    }
    return null;
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
