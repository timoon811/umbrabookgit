import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import AuthenticatedHome from "@/components/AuthenticatedHome";
import { verifyToken } from "@/lib/auth";

export default async function HomePage() {
  const cookieStore = await cookies();
  const authToken = cookieStore.get("auth-token")?.value;

  // Если пользователь авторизован, проверяем валидность токена
  if (authToken && authToken.length > 50) {
    try {
      // Проверяем валидность токена
      const user = await verifyToken(authToken);
      if (user) {
        return <AuthenticatedHome />;
      }
    } catch (error) {
      // Ошибка проверки токена - продолжаем с перенаправлением
      console.error("Ошибка проверки токена:", error);
    }
  }

  // Если не авторизован или токен невалиден, перенаправляем на login
  redirect("/login?from=/");
}
