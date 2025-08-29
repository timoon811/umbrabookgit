
import { getDocsNav } from "@/lib/docs";
import DocsNavigation from "@/components/DocsNavigation";
import TableOfContents from "@/components/TableOfContents";

interface DocsLayoutProps {
  children: React.ReactNode;
}

export default async function DocsLayout({ children }: DocsLayoutProps) {
  // Получаем навигацию для документации
  const nav = await getDocsNav('docs');

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Убираем дублирующийся хэдер - используем основной из ConditionalNavigation */}

      <div className="docs-layout">
        {/* Левый сайдбар - навигация (оптимизированная ширина) */}
        <aside className="docs-sidebar border-r border-gray-200 dark:border-gray-800">
          <div className="sticky top-[calc(var(--header-height)+0.5rem)] h-[calc(100vh-var(--header-height)-1rem)] overflow-y-auto p-3">
            {/* Навигация */}
            <DocsNavigation nav={nav} />
          </div>
        </aside>

        {/* Центральный контент */}
        <main className="docs-content">
          {children}
        </main>

        {/* Правая колонка - TOC (оптимизированная ширина) */}
        <aside className="docs-toc border-l border-gray-200 dark:border-gray-800">
          <div className="sticky top-[calc(var(--header-height)+0.5rem)] h-[calc(100vh-var(--header-height)-1rem)] overflow-y-auto p-3">
            <div className="text-sm font-medium text-gray-900 dark:text-white mb-3">
              На этой странице
            </div>
            <TableOfContents content="dynamic" />
          </div>
        </aside>
      </div>
    </div>
  );
}

