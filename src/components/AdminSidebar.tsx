"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Навигация: упрощенная структура
const navigationSections = [
  {
    title: "",
    items: [
      { name: "Дашборд", href: "/admin" },
      { name: "Все пользователи", href: "/admin/users" },
      { name: "Документация", href: "/admin/documentation" },
      { name: "Курсы", href: "/admin/courses" },
      { name: "Обработка", href: "/admin/processing" },
      { name: "Депозиты", href: "/admin/deposits" },
      { name: "🔍 Диагностика депозитов", href: "/admin/deposits/debug" },
    ],
  },
  {
    title: "ФИНАНСЫ",
    items: [
      { name: "Сводка", href: "/admin/finance" },
      { name: "Проекты", href: "/admin/finance/projects" },
      { name: "Счета", href: "/admin/finance/accounts" },
      { name: "Операции", href: "/admin/finance/transactions" },
      { name: "Отчёты", href: "/admin/finance/reports" },
      { name: "Настройки", href: "/admin/finance/settings" },
    ],
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  };

  return (
    <aside className="sidebar-column hidden lg:flex lg:flex-col border-r border-black/5 dark:border-white/20 sticky top-[calc(var(--header-height)+1rem)] h-[calc(100vh-var(--header-height)-2rem)] overflow-hidden bg-white dark:bg-[#0a0a0a]">
      <div className="flex-1 overflow-y-auto p-6">
        <nav className="text-sm leading-6">
          {navigationSections.map((section, sectionIndex) => (
            <div key={`section-${section.title}-${sectionIndex}`} className={`${section.title ? 'mb-6' : 'mb-6'} ${section.title ? 'nav-section' : ''}`}>
              {section.title ? (
                <div className={`nav-section-title flex items-center justify-between ${section.title === 'ФИНАНСЫ' ? 'finance-section' : ''}`}>
                  <span>{section.title}</span>
                </div>
              ) : null}
              <ul className="space-y-1">
                {section.items.map((item, itemIndex) => {
                  const active = isActive(item.href);
                  return (
                    <li key={`${section.title}-${item.href}-${itemIndex}`}>
                      <Link href={item.href} className={`nav-item ${active ? 'active' : ''}`} style={{ zIndex: active ? 10 : 1 }}>
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
    </aside>
  );
}

