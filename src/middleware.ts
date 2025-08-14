import { NextRequest, NextResponse } from "next/server";

// Публичные маршруты, которые не требуют аутентификации
const publicRoutes = [
  "/",
  "/login", 
  "/register",
  "/api/auth/login",
  "/api/auth/register",
];

// Маршруты только для администраторов
const adminRoutes = ["/admin"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Разрешаем доступ к статическим файлам и API маршрутам аутентификации
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api") || // временно разрешаем все API
    pathname.includes(".") // файлы со статическими расширениями
  ) {
    return NextResponse.next();
  }

  // Проверяем, является ли маршрут публичным
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next();
  }

  // Получаем токен из cookies
  const token = request.cookies.get("auth-token")?.value;

  // Если токена нет, перенаправляем на страницу входа (кроме корневого маршрута)
  if (!token && pathname !== "/") {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Если есть токен, проверяем его валидность
  if (token) {
    // Простая проверка наличия токена без декодирования
    // Полную валидацию JWT будут делать серверные компоненты
    if (token.length > 50) {
      return NextResponse.next();
    } else {
      const response = NextResponse.redirect(new URL("/login", request.url));
      response.cookies.delete("auth-token");
      return response;
    }
  }

  // Для корневого маршрута без токена позволяем продолжить
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
