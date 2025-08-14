import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "umbra_platform_super_secret_jwt_key_2024";

export default async function Home() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth-token")?.value;

  // Если пользователь авторизован, перенаправляем в документацию
  if (token) {
    try {
      jwt.verify(token, JWT_SECRET);
      redirect("/overview");
    } catch (error) {
      // Токен недействителен, показываем страницу входа
      redirect("/login");
    }
  }

  // Пользователь не авторизован, перенаправляем на страницу входа
  redirect("/login");
}
