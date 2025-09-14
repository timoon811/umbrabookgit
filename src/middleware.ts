import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { hasAdminAccess } from "@/lib/permissions";
import { UserRole } from "@/types/roles";

const JWT_SECRET = process.env.JWT_SECRET || "umbra_platform_super_secret_jwt_key_2024";

// Публичные маршруты, которые не требуют аутентификации
const publicRoutes = [
  "/login",
  "/register",
  "/api/auth/login",
  "/api/auth/register", 
  "/api/auth/refresh",
  "/api/auth/me", // Добавляем для проверки статуса аутентификации
];

// Маршруты только для администраторов
const adminRoutes = ["/admin"];

// Маршруты, запрещенные для PROCESSOR (они могут видеть только /processing, /docs, /profile)
const processorRestrictedRoutes = [
  "/connections", 
  "/buyer",
  "/finance",
];

// Внутренние маршруты, требующие авторизации
const protectedRoutes = [
  "/", // Главная страница (требует авторизации)
  "/docs", // Документация (теперь требует авторизации)
  "/profile", // Профиль
  "/processing", // Кабинет обработчика
  "/connections", // Связки
  "/buyer", // Байер
  "/finance", // Финансы
];

// Функция для проверки роли администратора
async function checkAdminRole(token: string): Promise<boolean> {
  try {
    // Сначала попробуем верифицировать токен
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as {
        userId: string;
        role: string;
        exp: number;
      };

      return hasAdminAccess(decoded.role as UserRole);
    } catch (verifyError) {
      // Fallback: декодируем без верификации
      const decoded = jwt.decode(token) as any;

      if (!decoded || !decoded.role) {
        return false;
      }

      return hasAdminAccess(decoded.role as UserRole);
    }
  } catch (error) {
    return false;
  }
}

// Функция для получения роли пользователя
async function getUserRole(token: string): Promise<string | null> {
  try {
    // Сначала попробуем верифицировать токен
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as {
        userId: string;
        role: string;
        exp: number;
      };

      return decoded.role;
    } catch (verifyError) {
      // Fallback: декодируем без верификации
      const decoded = jwt.decode(token) as any;

      if (!decoded || !decoded.role) {
        return null;
      }

      return decoded.role;
    }
  } catch (error) {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Разрешаем доступ к статическим файлам и API маршрутам аутентификации
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/seed") || // Добавляем для инициализации БД
    pathname.startsWith("/api/admin/import-db") || // Добавляем для импорта БД
    pathname.startsWith("/api/migrate-users") || // Добавляем для миграции пользователей
    pathname.startsWith("/api/migrate-all-users") || // Добавляем для полной миграции всех пользователей
    pathname.startsWith("/api/migrate-docs") || // Добавляем для миграции документации
    pathname.startsWith("/api/verify-migration") || // Добавляем для проверки миграции
    pathname.startsWith("/uploads") ||
    pathname.startsWith("/api/uploads") ||
    pathname.includes(".") // файлы со статическими расширениями
  ) {
    return NextResponse.next();
  }

  // Проверяем, является ли маршрут публичным
  if (publicRoutes.includes(pathname)) {
    // Для страниц логина и регистрации проверяем, авторизован ли пользователь
    if (pathname === "/login" || pathname === "/register") {
      const token = request.cookies.get("auth-token")?.value;
      
      if (token) {
        // Проверяем валидность токена
        try {
          const tokenParts = token.split('.');
          if (tokenParts.length === 3 && tokenParts.every(part => part.length > 0)) {
            // Токен выглядит валидно, перенаправляем на главную
            return NextResponse.redirect(new URL("/", request.url));
          }
        } catch (error) {
          // Невалидный токен, очищаем cookie и позволяем доступ к странице
          const response = NextResponse.next();
          response.cookies.set("auth-token", "", {
            path: "/",
            httpOnly: true,
            maxAge: 0,
            expires: new Date(0),
            sameSite: "lax",
          });
          return response;
        }
      }
    }
    
    return NextResponse.next();
  }

  // Проверяем, является ли маршрут только для администраторов
  if (adminRoutes.some(route => pathname.startsWith(route))) {
    const token = request.cookies.get("auth-token")?.value;

    if (!token) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Проверяем формат токена
    const tokenParts = token.split('.');
    if (tokenParts.length !== 3 || !tokenParts.every(part => part.length > 0)) {
      const response = NextResponse.redirect(new URL("/login", request.url));
      response.cookies.set("auth-token", "", {
        path: "/",
        httpOnly: true,
        maxAge: 0,
        expires: new Date(0),
        sameSite: "lax",
      });
      return response;
    }

    // Проверяем роль администратора
    const isAdmin = await checkAdminRole(token);

    if (!isAdmin) {
      // Если не администратор, перенаправляем на главную страницу
      return NextResponse.redirect(new URL("/", request.url));
    }

    return NextResponse.next();
  }

  // Проверяем, является ли маршрут защищенным
  if (protectedRoutes.some(route => pathname.startsWith(route))) {
    // Получаем токен из cookies
    const token = request.cookies.get("auth-token")?.value;

    // Если токена нет, перенаправляем на страницу входа
    if (!token) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Проверяем, что токен выглядит как JWT (3 части, разделенные точками)
    const tokenParts = token.split('.');
    if (tokenParts.length !== 3 || !tokenParts.every(part => part.length > 0)) {
      const response = NextResponse.redirect(new URL("/login", request.url));
      response.cookies.set("auth-token", "", {
        path: "/",
        httpOnly: true,
        maxAge: 0,
        expires: new Date(0),
        sameSite: "lax",
      });
      return response;
    }

    // Дополнительная проверка для PROCESSOR - ограничиваем доступ к определенным страницам
    if (processorRestrictedRoutes.some(route => pathname.startsWith(route))) {
      const userRole = await getUserRole(token);
      if (userRole === "PROCESSOR") {
        // Перенаправляем PROCESSOR на /processing если он пытается попасть на запрещенную страницу
        return NextResponse.redirect(new URL("/processing", request.url));
      }
    }

    return NextResponse.next();
  }

  // Для всех остальных маршрутов требуем авторизацию
  const token = request.cookies.get("auth-token")?.value;
  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Проверяем формат токена
  const tokenParts = token.split('.');
  if (tokenParts.length !== 3 || !tokenParts.every(part => part.length > 0)) {
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.set("auth-token", "", {
      path: "/",
      httpOnly: true,
      maxAge: 0,
      expires: new Date(0),
      sameSite: "lax",
    });
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - uploads (uploaded files)
     * - public files with extensions
     */
    "/((?!_next/static|_next/image|favicon.ico|uploads|.*\\.).*)",
  ],
};
