import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "umbra_platform_super_secret_jwt_key_2024";

// Публичные маршруты, которые не требуют аутентификации
const publicRoutes = [
  "/login",
  "/register",
  "/docs", // Документация доступна публично
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/refresh",
  "/api/auth/me", // Добавляем для проверки статуса аутентификации
  "/api/documentation", // Публичная документация
  "/api/courses", // Публичные курсы
  "/api/search", // Поиск
  "/api/documentation/search", // Поиск в документации
];

// Маршруты только для администраторов
const adminRoutes = ["/admin"];

// Внутренние маршруты, требующие авторизации
const protectedRoutes = [
  "/", // Главная страница (требует авторизации)
  "/courses", // Курсы
  "/profile", // Профиль
  "/processing", // Кабинет обработчика
];

// Функция для проверки роли администратора
async function checkAdminRole(token: string): Promise<boolean> {
  try {
    // В Edge Runtime используем verify для проверки подписи
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      role: string;
      exp: number;
    };

    // Проверяем, что токен декодирован и содержит роль
    if (!decoded || !decoded.role) {
      return false;
    }

    return decoded.role === "ADMIN";
  } catch (error) {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Разрешаем доступ к статическим файлам и API маршрутам аутентификации
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/api/auth") ||
    pathname.includes(".") // файлы со статическими расширениями
  ) {
    return NextResponse.next();
  }

  // Проверяем, является ли маршрут публичным
  if (publicRoutes.includes(pathname) || pathname.startsWith('/docs/')) {
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
     * - public files with extensions
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.).*)",
  ],
};
