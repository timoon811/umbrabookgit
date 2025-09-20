import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import DocsRedirect from "@/components/DocsRedirect";

export default async function DocsIndexPage() {
  try {
    console.log('🔍 DocsIndexPage: Поиск первого доступного проекта...');

    // Сначала получаем первый активный проект
    const firstProject = await prisma.content_projects.findFirst({
      where: {
        isActive: true
      },
      select: {
        id: true,
        name: true,
      },
      orderBy: [
        { type: 'asc' },
        { createdAt: 'asc' }
      ]
    });

    if (firstProject) {
      console.log(`🔄 DocsIndexPage: Найден проект: ${firstProject.name} (${firstProject.id})`);
      
      // Получаем первую опубликованную страницу из этого проекта
      const firstPage = await prisma.documentation.findFirst({
        where: {
          isPublished: true,
          slug: {
            not: null
          },
          section: {
            projectId: firstProject.id,
            isVisible: true
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
        console.log(`🔄 DocsIndexPage: Редирект на /docs/${firstPage.slug}?project=${firstProject.id} (${firstPage.title})`);
        redirect(`/docs/${firstPage.slug}?project=${firstProject.id}`);
      } else {
        console.log(`🔄 DocsIndexPage: У проекта ${firstProject.name} нет страниц, редирект на главную с project ID`);
        redirect(`/docs?project=${firstProject.id}`);
      }
    }

    console.log('⚠️ DocsIndexPage: Проекты не найдены, используем клиентский редирект');
    return <DocsRedirect fallbackSlug="page-1" />;
  } catch (error) {
    console.error("❌ DocsIndexPage: Ошибка при загрузке документации:", error);
    return <DocsRedirect fallbackSlug="page-1" />;
  }
}