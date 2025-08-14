import jwt from "jsonwebtoken";
import { NextRequest } from "next/server";
import { prisma } from "./prisma";

const JWT_SECRET = process.env.JWT_SECRET || "umbra_platform_super_secret_jwt_key_2024";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

export async function verifyToken(token: string): Promise<AuthUser | null> {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    // Проверяем существование пользователя в БД
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        isBlocked: true,
      },
    });

    if (!user || user.isBlocked || user.status === "BANNED") {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };
  } catch (error) {
    return null;
  }
}

export async function getCurrentUser(request: NextRequest): Promise<AuthUser | null> {
  const token = request.cookies.get("auth-token")?.value;
  
  if (!token) {
    return null;
  }

  return verifyToken(token);
}

export async function requireAuth(request: NextRequest): Promise<AuthUser> {
  const user = await getCurrentUser(request);
  
  if (!user) {
    throw new Error("Не авторизован");
  }
  
  return user;
}

export async function requireAdmin(request: NextRequest): Promise<AuthUser> {
  const user = await requireAuth(request);
  
  if (user.role !== "ADMIN") {
    throw new Error("Доступ запрещен");
  }
  
  return user;
}
