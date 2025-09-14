"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import SearchBox from "@/components/SearchBox";
import ThemeToggle from "@/components/ThemeToggle";
import UmbraLogo from "@/components/UmbraLogo";
import UserActions from "@/components/UserActions";
import NoSSR from "@/components/NoSSR";
import MaterialsDropdown from "@/components/MaterialsDropdown";
import { useAuth } from "@/hooks/useAuth";

export default function ConditionalNavigation() {
  const pathname = usePathname();
  const { user, mounted } = useAuth();
  
  // Не показываем навигацию на страницах аутентификации
  const isAuthPage = pathname.startsWith("/login") || pathname.startsWith("/register");

  if (isAuthPage) {
    return null;
  }

  return (
    <header className="fixed-header">
      <div className="mx-auto max-w-screen-2xl px-6 h-[var(--header-height)] flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <UmbraLogo size="sm" />
            Umbra Platform
          </Link>
          
          {/* Навигационные кнопки - только для авторизованных */}
          <div className="flex items-center gap-2">
            {/* Материалы - выпадающее меню с проектами */}
            {mounted && user && (
              <MaterialsDropdown />
            )}
            
            {/* Обработка - доступна всем авторизованным */}
            {mounted && user && (
              <Link
                href="/processing"
                className="px-2 py-1 text-xs font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white bg-gray-100 dark:bg-[#0a0a0a] hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
              >
                Обработка
              </Link>
            )}
            
            {/* Связки - скрыты для процессоров */}
            {mounted && user?.role !== "PROCESSOR" && (
              <Link
                href="/connections"
                className="px-2 py-1 text-xs font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white bg-gray-100 dark:bg-[#0a0a0a] hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
              >
                Связки
              </Link>
            )}
            
            {/* Buyer - скрыты для процессоров */}
            {mounted && user?.role !== "PROCESSOR" && (
              <Link
                href="/buyer"
                className="px-2 py-1 text-xs font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white bg-gray-100 dark:bg-[#0a0a0a] hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
              >
                Buyer
              </Link>
            )}
            
            {/* Финансы - скрыты для процессоров */}
            {mounted && user?.role !== "PROCESSOR" && (
              <Link
                href="/finance"
                className="px-2 py-1 text-xs font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white bg-gray-100 dark:bg-[#0a0a0a] hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
              >
                Финансы
              </Link>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="hidden md:block">
            <NoSSR>
              <SearchBox />
            </NoSSR>
          </div>
          <ThemeToggle />
          <NoSSR>
            <UserActions />
          </NoSSR>
        </div>
      </div>
    </header>
  );
}
