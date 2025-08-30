
import { getDocsNav } from "@/lib/docs";
import DocsNavigation from "@/components/DocsNavigation";
import TableOfContents from "@/components/TableOfContents";
import SmartSidebar from "@/components/SmartSidebar";
import BodyClassManager from "@/components/BodyClassManager";

interface DocsLayoutProps {
  children: React.ReactNode;
}

export default async function DocsLayout({ children }: DocsLayoutProps) {
  // Получаем навигацию для документации
  const nav = await getDocsNav('docs');

  return (
    <>
      <BodyClassManager className="page-with-custom-layout" />
      <div className="min-h-screen bg-white dark:bg-gray-900">
        {/* Убираем дублирующийся хэдер - используем основной из ConditionalNavigation */}

        <div className="docs-layout">
        {/* Левый сайдбар - навигация (улучшенное позиционирование) */}
        <aside className="docs-sidebar border-r border-gray-200 dark:border-gray-800">
          <SmartSidebar>
            <DocsNavigation nav={nav} />
          </SmartSidebar>
        </aside>

        {/* Центральный контент */}
        <main className="docs-content">
          {children}
        </main>

        {/* Правая колонка - TOC (улучшенное позиционирование) */}
        <aside className="docs-toc border-l border-gray-200 dark:border-gray-800">
          <SmartSidebar>
            <div className="text-sm font-medium text-gray-900 dark:text-white mb-3">
              На этой странице
            </div>
            <TableOfContents content="dynamic" />
          </SmartSidebar>
        </aside>
        </div>
      </div>
    </>
  );
}

