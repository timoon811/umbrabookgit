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
    emoji: string;
    description: string | null;
  };
}

async function getDocumentationPage(slug: string): Promise<DocumentationPage | null> {
  try {
    // Принудительно обновляем кэш для получения актуальных данных
    await prisma.$queryRaw`SELECT 1`;
    
    const page = await prisma.documentation.findFirst({
      where: {
        slug: slug,
        isPublished: true
      },
      include: {
        section: {
          select: {
            id: true,
            name: true,
            key: true,
    
            description: true,
          }
        }
      }
    });

    return page;
  } catch (error) {
    console.error("Error loading documentation page:", error);
    return null;
  }
}

interface DocumentationArticlePageProps {
  params: {
    slug: string;
  };
}

export default async function DocumentationArticlePage({ params }: DocumentationArticlePageProps) {
  const paramsResolved = await params;
  const page = await getDocumentationPage(paramsResolved.slug);

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
        <Link href="/docs" className="hover:text-gray-900 dark:hover:text-gray-200 transition-colors">
          Документация
        </Link>
        <span>/</span>
        <Link
          href={`/docs?section=${page.section.key}`}
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
