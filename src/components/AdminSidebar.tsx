"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import AdminUserSection from "./AdminUserSection";

// Навигация как было: плоский верхний блок и "КОНТЕНТ" со статичными пунктами
const navigationSections = [
  {
    title: "",
    items: [
      { name: "Дашборд", href: "/admin" },
      { name: "Все пользователи", href: "/admin/users" },
    ],
  },
  {
    title: "КОНТЕНТ",
    items: [
      { name: "Документация", href: "/admin/articles/new" },
      { name: "Курсы", href: "/admin/workspaces/courses" },
    ],
  },
  {
    title: "ФИНАНСЫ",
    items: [
      { name: "Сводка", href: "/admin/finance" },
      { name: "Счета", href: "/admin/finance/accounts" },
      { name: "Операции", href: "/admin/finance/transactions" },
      { name: "Отчёты", href: "/admin/finance/reports" },
    ],
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  };

  return (
    <aside className="sidebar-column hidden lg:flex lg:flex-col border-r border-black/5 dark:border-white/10 sticky top-14 h-[calc(100vh-56px)] overflow-hidden">
      <div className="flex-1 overflow-y-auto p-6">
        <nav className="text-sm leading-6">
          {navigationSections.map((section, sectionIndex) => (
            <div key={`section-${section.title}-${sectionIndex}`} className={section.title === 'КОНТЕНТ' ? 'mb-4' : 'mb-6'}>
              {section.title ? (
                <div className="nav-section-title flex items-center justify-between">
                  <span>{section.title}</span>
                  {section.title === 'КОНТЕНТ' && (
                    <button
                      title="Создать воркспейс"
                      onClick={async () => {
                        try {
                          const name = `Новый воркспейс`;
                          const res = await fetch('/api/admin/articles/categories', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) });
                          if (res.ok) {
                            const data = await res.json();
                            router.push(`/admin/workspaces/${data.category.key}`);
                          }
                        } catch {}
                      }}
                      className="ml-2 w-6 h-6 inline-flex items-center justify-center rounded border border-black/10 dark:border-white/10 text-sm hover:bg-black/5 dark:hover:bg-white/10"
                    >
                      +
                    </button>
                  )}
                </div>
              ) : null}
              <ul className="space-y-1">
                {section.items.map((item, itemIndex) => {
                  const active = isActive(item.href);
                  return (
                    <li key={`${section.title}-${item.href}-${itemIndex}`}>
                      <Link href={item.href} className={`nav-item ${section.title === 'КОНТЕНТ' ? 'pl-3' : ''} ${active ? 'active' : ''}`}>
                        {item.name}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </div>
      <div className="flex-shrink-0">
        <AdminUserSection />
      </div>
    </aside>
  );
}

