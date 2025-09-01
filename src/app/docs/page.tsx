import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import DocsRedirect from "@/components/DocsRedirect";

export default async function DocsIndexPage() {
  try {
    console.log('🔍 DocsIndexPage: Поиск первой страницы документации...');

    // Получаем первую опубликованную страницу документации
    const firstPage = await prisma.documentation.findFirst({
      where: {
        isPublished: true,
        slug: {
          isNot: null
        }
      },
      select: {
        slug: true,
        title: true,
      },
      orderBy: [
        { order: 'asc' },
        { createdAt: 'asc' }
      ],
    });

    if (firstPage?.slug) {
      console.log(`🔄 DocsIndexPage: Редирект на /docs/${firstPage.slug} (${firstPage.title})`);
      redirect(`/docs/${firstPage.slug}`);
    }

    console.log('⚠️ DocsIndexPage: Первая страница не найдена, используем клиентский редирект');
    return <DocsRedirect fallbackSlug="page-4" />;
  } catch (error) {
    console.error("❌ DocsIndexPage: Ошибка при загрузке документации:", error);
    return <DocsRedirect fallbackSlug="page-4" />;
  }
}