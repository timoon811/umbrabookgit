import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import DocsRedirect from "@/components/DocsRedirect";

export default function DocsIndexPage() {
  console.log('🔍 DocsIndexPage: Рендерим страницу с клиентским редиректом');

  // Используем клиентский редирект для надежности
  return <DocsRedirect fallbackSlug="welcome" />;
}