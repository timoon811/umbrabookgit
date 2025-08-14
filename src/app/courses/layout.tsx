import Link from "next/link";
import DynamicTableOfContents from "@/components/DynamicTableOfContents";
import UserSection from "@/components/UserSection";

export default function CoursesLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-screen-2xl px-6 lg:px-6 md:px-4 sm:px-3">
      <div className="grid layout-root">
        <aside className="sidebar-column hidden lg:flex lg:flex-col border-r border-black/5 dark:border-white/10 sticky top-14 h-[calc(100vh-56px)] overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6">
            <nav className="text-sm leading-6">
              <div className="mb-6">
                <div className="nav-section-title">Курсы</div>
                <ul className="space-y-1">
                  <li>
                    <Link href="/courses" className="nav-item">Обзор курсов</Link>
                  </li>
                </ul>
              </div>
            </nav>
          </div>
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
        </aside>
      </div>
    </div>
  );
}


