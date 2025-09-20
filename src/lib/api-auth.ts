import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { hasAdminAccess } from "@/lib/permissions";
import { UserRole } from "@/types/roles";
import { getDisplayName } from "@/utils/userUtils";
import { getJwtSecret } from "@/lib/jwt";

const JWT_SECRET = getJwtSecret();

export interface AuthUser {
  userId: string;
  email: string;
  role: string;
  name?: string;
}

export interface ApiAuthResult {
  user: AuthUser;
  error?: never;
}

export interface ApiAuthError {
  user?: never;
  error: NextResponse;
}

/**
 * Centralized API authentication middleware
 * @param request - NextRequest object
 * @param requiredRoles - Array of roles that are allowed to access this endpoint (legacy)
 * @param adminOnly - Whether this endpoint requires admin access (uses new permission system)
 * @returns Promise with user data or error response
 */
export async function authenticateApiRequest(
  request: NextRequest,
  requiredRoles?: string[],
  adminOnly: boolean = false
): Promise<ApiAuthResult | ApiAuthError> {
  try {
    // Проверяем токен в cookies или в Authorization header
    const cookieStore = await cookies();
    let token = cookieStore.get("auth-token")?.value;
    
    // Если нет токена в cookies, проверяем Authorization header
    if (!token) {
      const authHeader = request.headers.get("authorization");
      if (authHeader?.startsWith("Bearer ")) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      return {
        error: NextResponse.json(
          { message: "Не авторизован" },
          { status: 401 }
        )
      };
    }

    // Verify JWT token
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      email: string;
      role: string;
    };

    // Get user from database to ensure they still exist and are not blocked
    const user = await prisma.users.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isBlocked: true,
        status: true,
      },
    });

    if (!user) {
      return {
        error: NextResponse.json(
          { message: "Пользователь не найден" },
          { status: 404 }
        )
      };
    }

    // Check if user is blocked
    if (user.isBlocked) {
      return {
        error: NextResponse.json(
          { message: "Учетная запись заблокирована" },
          { status: 403 }
        )
      };
    }

    // Check user status
    if (user.status === "PENDING") {
      return {
        error: NextResponse.json(
          { message: "Ваша заявка на регистрацию ещё не одобрена администратором" },
          { status: 403 }
        )
      };
    }

    if (user.status === "REJECTED") {
      return {
        error: NextResponse.json(
          { message: "Ваша заявка на регистрацию была отклонена" },
          { status: 403 }
        )
      };
    }

    // Check role permissions
    if (adminOnly) {
      // Use new permission system for admin access
      if (!hasAdminAccess(user.role as UserRole)) {
        return {
          error: NextResponse.json(
            { message: "Недостаточно прав доступа" },
            { status: 403 }
          )
        };
      }
    } else if (requiredRoles && requiredRoles.length > 0) {
      // Legacy role checking
      if (!requiredRoles.includes(user.role)) {
        return {
          error: NextResponse.json(
            { message: "Недостаточно прав доступа" },
            { status: 403 }
          )
        };
      }
    }

    return {
      user: {
        userId: user.id,
        email: user.email,
        role: user.role,
        name: getDisplayName(user.name),
      }
    };

  } catch (error: unknown) {
    const requestContext = {
      url: request.url,
      method: request.method,
      userAgent: request.headers.get('user-agent') || undefined,
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
    };

    if (error instanceof jwt.JsonWebTokenError) {
      logger.warn("Невалидный JWT токен", requestContext);
      return {
        error: NextResponse.json(
          { message: "Невалидный токен авторизации" },
          { status: 401 }
        )
      };
    }

    logger.error("Ошибка аутентификации API", error, requestContext);
    return {
      error: NextResponse.json(
        { message: "Ошибка сервера при проверке авторизации" },
        { status: 500 }
      )
    };
  }
}

/**
 * Simplified authentication for admin-only endpoints
 */
export async function authenticateAdmin(request: NextRequest): Promise<ApiAuthResult | ApiAuthError> {
  return authenticateApiRequest(request, undefined, true);
}

/**
 * Shorthand for admin-only endpoints
 */
export async function requireAdminAuth(request: NextRequest): Promise<ApiAuthResult | ApiAuthError> {
  return authenticateApiRequest(request, undefined, true);
}

/**
 * Shorthand for manager/admin endpoints
 */
export async function requireManagerAuth(request: NextRequest): Promise<ApiAuthResult | ApiAuthError> {
  return authenticateApiRequest(request, ["PROCESSOR", "ADMIN"]);
}

// Алиас для обратной совместимости
export const requireProcessorAuth = requireManagerAuth;

/**
 * Shorthand for any authenticated user
 */
export async function requireAuth(request: NextRequest): Promise<ApiAuthResult | ApiAuthError> {
  return authenticateApiRequest(request);
}
