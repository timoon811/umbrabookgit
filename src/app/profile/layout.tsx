import Link from "next/link";
import { getDocsNav } from "@/lib/docs";
import DynamicTableOfContents from "@/components/DynamicTableOfContents";
import UserSection from "@/components/UserSection";

export default async function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const nav = await getDocsNav();

  return (
    <div className="mx-auto max-w-screen-2xl px-6 lg:px-6 md:px-4 sm:px-3">
      <div className="grid layout-root">
        {/* Левая колонка со списком разделов/статей и нижним блоком пользователя */}
        <aside className="sidebar-column hidden lg:flex lg:flex-col border-r border-black/5 dark:border-white/10 sticky top-14 h-[calc(100vh-56px)] overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6">
            <nav className="text-sm leading-6">
              {nav.map((section, index) => (
                <div key={`section-${section.title}-${index}`} className="mb-6">
                  <div className="nav-section-title">{section.title}</div>
                  <ul className="space-y-1">
                    {section.items.map((item, idx) => (
                      <li key={`${section.title}-${item.href}-${idx}`}>
                        <Link href={item.href} className="nav-item">
                          {item.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </nav>
          </div>
          <div className="flex-shrink-0">
            <UserSection />
          </div>
        </aside>

        {/* Контент */}
        <main className="p-6">
          <div className="mx-auto max-w-[760px]">{children}</div>
        </main>

        {/* Правая колонка (TOC) */}
        <aside className="toc-column hidden xl:block border-l border-black/5 dark:border-white/10 p-6 sticky top-14 h-[calc(100vh-56px)] overflow-y-auto">
          <DynamicTableOfContents />
        </aside>
      </div>
    </div>
  );
}


