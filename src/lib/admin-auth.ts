import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { hasAdminAccess } from "@/lib/permissions";
import { UserRole } from "@/types/roles";
import { getJwtSecret } from "@/lib/jwt";

const JWT_SECRET = getJwtSecret();

// Единая функция проверки прав администратора для API роутов
export async function checkAdminAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth-token")?.value;

  if (!token) {
    throw new Error("Не авторизован");
  }

  const decoded = jwt.verify(token, JWT_SECRET) as {
    userId: string;
    role: string;
  };

  // Используем новую систему проверки прав
  if (!hasAdminAccess(decoded.role as UserRole)) {
    throw new Error("Недостаточно прав доступа к админ панели");
  }

  return {
    userId: decoded.userId,
    role: decoded.role as UserRole
  };
}

// Альтернативная функция для случаев, когда нужен только userId
export async function checkAdminAuthUserId(): Promise<string> {
  const result = await checkAdminAuth();
  return result.userId;
}
