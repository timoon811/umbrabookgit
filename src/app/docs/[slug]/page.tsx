import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { extractHeadingsForToc } from "@/lib/docs";

import DocumentationRenderer from "@/components/docs/DocumentationRenderer";

interface DocumentationPage {
  id: string;
  title: string;
  description: string | null;
  slug: string;
  content: string | null;
  blocks: string | null;
  sectionId: string;
  order: number;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
  section: {
    id: string;
    name: string;
    key: string;
    description: string | null;
    projectId: string;  // ✅ Добавляем projectId в интерфейс
  };
}

async function getDocumentationPage(slug: string, projectId: string | null): Promise<DocumentationPage | null> {
  try {
    // Принудительно обновляем кэш для получения актуальных данных
    await prisma.$queryRaw`SELECT 1`;

    // ✅ ИСПРАВЛЕНИЕ: Обязательная проверка projectId для изоляции проектов
    if (!projectId) {
      console.log("⚠️ getDocumentationPage: ProjectId не указан для страницы", slug);
      return null;
    }

    const page = await prisma.documentation.findFirst({
      where: {
        slug: slug,
        isPublished: true,
        section: {
          projectId: projectId,  // ✅ КРИТИЧНО: Фильтрация по проекту
          isVisible: true
        }
      },
      include: {
        section: {
          select: {
            id: true,
            name: true,
            key: true,
            description: true,
            projectId: true,  // ✅ Включаем projectId для дополнительной проверки
          }
        }
      }
    });

    // ✅ Дополнительная проверка проекта
    if (page && page.section.projectId !== projectId) {
      console.log(`🚫 getDocumentationPage: Страница ${slug} принадлежит проекту ${page.section.projectId}, а не ${projectId}`);
      return null;
    }

    return page;
  } catch (error) {
    console.error("❌ Error loading documentation page:", error);
    return null;
  }
}

interface DocumentationArticlePageProps {
  params: Promise<{
    slug: string;
  }>;
  searchParams: Promise<{
    project?: string;
  }>;
}

export default async function DocumentationArticlePage({ params, searchParams }: DocumentationArticlePageProps) {
  const paramsResolved = await params;
  const searchParamsResolved = await searchParams;
  
  // ✅ КРИТИЧНО: Получаем projectId из URL параметров
  const projectId = searchParamsResolved.project || null;
  
  const page = await getDocumentationPage(paramsResolved.slug, projectId);

  if (!page) {
    notFound();
  }

  // Получаем информацию о разделе
  const sectionInfo = {
    name: page.section.name,
    
    description: page.section.description || 'Документация по данному разделу'
  };

  return (
    <article className="max-w-none">
      {/* Хлебные крошки */}
      <nav className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400 mb-8">
        <Link 
          href={projectId ? `/docs?project=${projectId}` : "/docs"} 
          className="hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
        >
          Документация
        </Link>
        <span>/</span>
        <Link
          href={`/docs?section=${page.section.key}${projectId ? `&project=${projectId}` : ''}`}
          className="hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
        >
          {sectionInfo.name}
        </Link>
        <span>/</span>
        <span className="text-gray-700 dark:text-gray-300">{page.title}</span>
      </nav>

      {/* Заголовок статьи */}
      <header className="mb-12">
        <div className="mb-8">
          <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-4 leading-tight">
            {page.title}
          </h1>
          {page.description && (
            <p className="text-xl lg:text-2xl text-gray-600 dark:text-gray-300 leading-relaxed">
              {page.description}
            </p>
          )}
        </div>
      </header>

      {/* Содержимое статьи */}
      <div id="article-content">
        {page.content ? (
          <DocumentationRenderer content={page.content} />
        ) : (
          <div className="text-center py-16">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Содержимое скоро будет добавлено</h3>
            <p className="text-gray-600 dark:text-gray-400">Автор работает над этой статьей</p>
          </div>
        )}
      </div>


    </article>
  );
}
