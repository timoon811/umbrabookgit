"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import SearchBox from "@/components/SearchBox";
import ThemeToggle from "@/components/ThemeToggle";
import UmbraLogo from "@/components/UmbraLogo";
import UserActions from "@/components/UserActions";
import NoSSR from "@/components/NoSSR";

export default function ConditionalNavigation() {
  const pathname = usePathname();
  
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
          
          {/* Отдельные блоки Документация и Курсы */}
          <div className="flex items-center gap-4">
            <Link
              href="/docs"
              className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md transition-colors"
            >
              Документация
            </Link>
            <Link
              href="/courses"
              className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md transition-colors"
            >
              Курсы
            </Link>
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
