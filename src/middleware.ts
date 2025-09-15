import { NextRequest, NextResponse } from "next/server";

// JWT_SECRET для Edge Runtime
const JWT_SECRET = "umbra_platform_super_secret_jwt_key_2024";

// Роли с доступом к админ панели
const ADMIN_ROLES = ['ADMIN', 'ROP_PROCESSOR', 'ROP_BUYER', 'MODERATOR', 'SUPPORT', 'MEDIA_BUYER'];

// Публичные маршруты, которые не требуют аутентификации
const publicRoutes = [
  "/login",
  "/register",
  "/error",
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/logout",
  "/api/auth/verify-email",
  "/api/auth/reset-password",
  "/api/seed",
  "/api/admin/import-db",
  "/processing-project", // Добавлен публичный доступ к странице проекта обработки
];

// Маршруты, которые требуют аутентификации
const protectedRoutes = [
  "/profile",
  "/settings",
  "/management",
  "/deposit",
  "/salaries",
  "/wallets",
  "/api/user",
  "/api/deposits",
  "/api/manager",
  "/api/notifications",
];

// Маршруты только для администраторов
const adminRoutes = [
  "/admin",
  "/connections", // Связки
  "/buyer", // Байер
  "/finance", // Финансы
];

// Простая функция декодирования JWT без использования внешних библиотек
function decodeJWT(token: string): { userId: string; role: string; exp: number } | null {
  try {
    // JWT состоит из трех частей, разделенных точками
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    // Декодируем payload (вторая часть)
    const payload = parts[1];
    // Добавляем недостающие символы для правильного base64
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + (4 - base64.length % 4) % 4, '=');
    
    // Декодируем base64
    const decoded = atob(padded);
    const data = JSON.parse(decoded);

    return {
      userId: data.userId,
      role: data.role,
      exp: data.exp
    };
  } catch (error) {
    return null;
  }
}

// Функция для проверки роли администратора
function checkAdminRole(role: string): boolean {
  return ADMIN_ROLES.includes(role);
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
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Проверяем публичные маршруты
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  const token = request.cookies.get("auth-token")?.value;

  // Проверяем защищенные маршруты
  if (protectedRoutes.some(route => pathname.startsWith(route))) {
    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    // Проверяем валидность токена
    const decoded = decodeJWT(token);
    if (!decoded || decoded.exp * 1000 < Date.now()) {
      // Токен невалиден или истек
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

  // Проверяем, является ли маршрут только для администраторов
  if (adminRoutes.some(route => pathname.startsWith(route))) {
    if (!token) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Декодируем токен
    const decoded = decodeJWT(token);
    
    if (!decoded) {
      // Невалидный токен - очищаем и редиректим
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

    // Проверяем срок действия токена
    if (decoded.exp * 1000 < Date.now()) {
      // Токен истек
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
    const isAdmin = checkAdminRole(decoded.role);

    if (!isAdmin) {
      // Роль не админ — отправляем на главную
      return NextResponse.redirect(new URL("/", request.url));
    }

    // Все проверки пройдены, пропускаем
    return NextResponse.next();
  }

  // API маршруты для администраторов
  if (pathname.startsWith("/api/admin")) {
    if (!token) {
      return NextResponse.json(
        { message: "Не авторизован" },
        { status: 401 }
      );
    }

    // Декодируем токен
    const decoded = decodeJWT(token);
    
    if (!decoded || decoded.exp * 1000 < Date.now()) {
      return NextResponse.json(
        { message: "Токен недействителен или истек" },
        { status: 401 }
      );
    }

    // Проверяем роль администратора
    const isAdmin = checkAdminRole(decoded.role);

    if (!isAdmin) {
      return NextResponse.json(
        { message: "Недостаточно прав" },
        { status: 403 }
      );
    }

    return NextResponse.next();
  }

  // API маршруты для байеров
  if (pathname.startsWith("/api/buyer")) {
    if (!token) {
      return NextResponse.json(
        { message: "Не авторизован" },
        { status: 401 }
      );
    }

    // Декодируем токен
    const decoded = decodeJWT(token);
    
    if (!decoded || decoded.exp * 1000 < Date.now()) {
      return NextResponse.json(
        { message: "Токен недействителен или истек" },
        { status: 401 }
      );
    }

    // Проверяем роль байера или администратора
    const hasBuyerAccess = ['MEDIA_BUYER', 'ROP_BUYER', 'ADMIN'].includes(decoded.role);

    if (!hasBuyerAccess) {
      return NextResponse.json(
        { message: "Недостаточно прав" },
        { status: 403 }
      );
    }

    return NextResponse.next();
  }

  // Проверка API маршрутов менеджера - требуют роли PROCESSOR
  if (pathname.startsWith("/api/manager")) {
    if (!token) {
      return NextResponse.json(
        { message: "Не авторизован" },
        { status: 401 }
      );
    }

    // Декодируем токен
    const decoded = decodeJWT(token);
    
    if (!decoded || decoded.exp * 1000 < Date.now()) {
      return NextResponse.json(
        { message: "Токен недействителен или истек" },
        { status: 401 }
      );
    }

    // Только менеджеры и администраторы могут использовать эти маршруты
    const hasManagerAccess = ['PROCESSOR', 'ROP_PROCESSOR', 'ADMIN'].includes(decoded.role);

    if (!hasManagerAccess) {
      return NextResponse.json(
        { message: "Доступ запрещен. Требуется роль менеджера." },
        { status: 403 }
      );
    }

    return NextResponse.next();
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