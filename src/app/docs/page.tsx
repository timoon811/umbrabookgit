import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import DocsRedirect from "@/components/DocsRedirect";

export default async function DocsIndexPage() {
  try {
    console.log('🔍 DocsIndexPage: Поиск первой страницы документации...');
    
    // Принудительно обновляем соединение с базой данных
    await prisma.$queryRaw`SELECT 1`;
    
    // Ищем первую опубликованную страницу документации
    const firstPage = await prisma.documentation.findFirst({
      where: {
        isPublished: true,
      },
      select: {
        slug: true,
        title: true,
      },
      orderBy: [
        { order: 'asc' },
        { createdAt: 'asc' },
      ],
    });

    console.log('📄 DocsIndexPage: Найденная первая страница:', firstPage);

    // Если есть первая страница - перенаправляем на неё
    if (firstPage?.slug) {
      console.log(`🔄 DocsIndexPage: Редирект на /docs/${firstPage.slug}`);
      redirect(`/docs/${firstPage.slug}`);
    }

    console.log('⚠️ DocsIndexPage: Первая страница не найдена, пробуем клиентский редирект');

    // Если нет страниц через серверный запрос, пробуем клиентский редирект
    return <DocsRedirect />;
  } catch (error) {
    console.error("❌ DocsIndexPage: Ошибка при загрузке документации:", error);
    
    // Попробуем альтернативный способ поиска первой страницы
    try {
      console.log('🔄 DocsIndexPage: Попытка альтернативного поиска...');
      
      const docs = await prisma.documentation.findMany({
        where: {
          isPublished: true,
        },
        select: {
          slug: true,
          title: true,
          order: true,
        },
        orderBy: [
          { order: 'asc' },
          { createdAt: 'asc' },
        ],
        take: 1,
      });

      if (docs.length > 0 && docs[0].slug) {
        console.log(`🔄 DocsIndexPage: Альтернативный редирект на /docs/${docs[0].slug}`);
        redirect(`/docs/${docs[0].slug}`);
      }
      
      console.log('⚠️ DocsIndexPage: Альтернативный поиск не дал результатов');
    } catch (secondError) {
      console.error("❌ DocsIndexPage: Альтернативный поиск также завершился ошибкой:", secondError);
    }
    
    // В случае ошибки пробуем клиентский редирект с fallback на известную страницу
    console.log('🔄 DocsIndexPage: Используем клиентский редирект с fallback на welcome');
    return <DocsRedirect fallbackSlug="welcome" />;
  }
}