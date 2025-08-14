import Link from "next/link";
import { getDocsNav } from "@/lib/docs";
import DynamicTableOfContents from "@/components/DynamicTableOfContents";
import UserSection from "@/components/UserSection";

export default async function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Позже workspaceKey можно брать из cookie/поддомена/URL; используем docs как базовый префикс
  const nav = await getDocsNav('docs');

  return (
    <div className="mx-auto max-w-screen-2xl px-6 lg:px-6 md:px-4 sm:px-3">
      <div className="grid layout-root">
      <aside className="sidebar-column hidden lg:flex lg:flex-col border-r border-black/5 dark:border-white/10 sticky top-14 h-[calc(100vh-56px)] overflow-hidden">
        {/* Навигационная область (скроллируемая) */}
        <div className="flex-1 overflow-y-auto p-6">
          <nav className="text-sm leading-6">
            {nav.map((section, index) => (
              <div key={`section-${section.title}-${index}`} className="mb-6">
                <div className="nav-section-title">
                  {section.title}
                </div>
                <ul className="space-y-1">
                   {section.items.map((item, index) => (
                    <li key={`${section.title}-${item.href}-${index}`}>
                       <Link href={item.href} className={`nav-item ${item.depth === 1 ? 'pl-2' : item.depth === 2 ? 'pl-4' : item.depth && item.depth >= 3 ? 'pl-6' : ''}`}>
                        {item.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>
        
        {/* Пользовательская секция (фиксированная снизу) */}
        <div className="flex-shrink-0">
          <UserSection />
        </div>
      </aside>
      <main className="p-6">
        <div className="mx-auto max-w-[760px]">
          <article className="prose prose-zinc dark:prose-invert max-w-none">{children}</article>
        </div>
      </main>
      <aside className="toc-column hidden xl:block border-l border-black/5 dark:border-white/10 p-6 sticky top-14 h-[calc(100vh-56px)] overflow-y-auto">
        <DynamicTableOfContents />
        
        <div className="copy-section">
          <button className="copy-button">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            Copy
          </button>
        </div>

        <div className="mt-8 text-sm">
          <div className="mb-3 text-black/60 dark:text-white/60 font-medium">Was this helpful?</div>
          <div className="flex gap-2">
            <button className="h-8 w-8 rounded-full border border-black/5 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
              🙂
            </button>
            <button className="h-8 w-8 rounded-full border border-black/5 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
              😐
            </button>
            <button className="h-8 w-8 rounded-full border border-black/5 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
              🙁
            </button>
          </div>
        </div>
      </aside>
      </div>
    </div>
  );
}


