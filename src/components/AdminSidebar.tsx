"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

// Навигация: упрощенная структура
const navigationSections = [
  {
    title: "",
    items: [
      { name: "Дашборд", href: "/admin" },
      { name: "Пользователи", href: "/admin/users" },
      { name: "Редактор", href: "/admin/documentation" },
      { name: "Управление", href: "/admin/management" },
    ],
  },
  {
    title: "BUYER СИСТЕМА",
    items: [
      { name: "Обзор Байеров", href: "/admin/buyer" },
      { name: "Проекты", href: "/admin/buyer/projects" },
      { name: "Дневники", href: "/admin/buyer/dailylogs" },
      { name: "Заявки", href: "/admin/buyer/requests" },
      { name: "Бонусы", href: "/admin/buyer/bonus" },
      { name: "Общие расходы", href: "/admin/buyer/shared-costs" },
      { name: "Сигналы", href: "/admin/buyer/signals" },
      { name: "Отчеты", href: "/admin/buyer/reports" },
    ],
  },
  {
    title: "ФИНАНСЫ",
    items: [
      { name: "Проекты", href: "/admin/finance/projects" },
      { name: "Счета", href: "/admin/finance/accounts" },
      { name: "Операции", href: "/admin/finance/transactions" },
      { name: "Настройки", href: "/admin/finance/settings" },
    ],
  },
  {
    title: "СИСТЕМА",
    items: [
      { name: "Настройки", href: "/admin/settings" },
      { name: "База данных", href: "/admin/database" },
    ],
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  };

  const closeMobileMenu = () => setMobileMenuOpen(false);

  const NavigationContent = ({ onItemClick }: { onItemClick?: () => void }) => (
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
                  <Link 
                    href={item.href} 
                    className={`nav-item ${active ? 'active' : ''}`} 
                    style={{ zIndex: active ? 10 : 1 }}
                    onClick={onItemClick}
                  >
                    {item.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );

  return (
    <>
      {/* Mobile menu button */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg"
        onClick={() => setMobileMenuOpen(true)}
        aria-label="Открыть меню"
      >
        <svg className="w-6 h-6 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Desktop sidebar */}
      <aside className="sidebar-column hidden lg:flex lg:flex-col border-r border-black/5 dark:border-white/20 sticky top-[calc(var(--header-height)+1rem)] h-[calc(100vh-var(--header-height)-2rem)] overflow-hidden bg-white dark:bg-[#0a0a0a]">
        <div className="flex-1 overflow-y-auto p-6">
          <NavigationContent />
        </div>
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50 transition-opacity"
            onClick={closeMobileMenu}
          />
          
          {/* Sidebar panel */}
          <div className="relative flex w-full max-w-xs flex-col bg-white dark:bg-[#0a0a0a] shadow-xl">
            <div className="flex h-16 items-center justify-between px-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Админ панель
              </h2>
              <button
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                onClick={closeMobileMenu}
                aria-label="Закрыть меню"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              <NavigationContent onItemClick={closeMobileMenu} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

