"use client";

import Link from "next/link";
import ThemeToggle from "./ThemeToggle";
import UmbraLogo from "./UmbraLogo";

export default function AdminHeader() {
  return (
    <header className="sticky top-0 z-50 bg-white/95 dark:bg-[#0a0a0a]/95 backdrop-blur-sm border-b border-[#171717]/5 dark:border-[#ededed]/10">
      <div className="mx-auto max-w-screen-2xl px-6">
        <div className="flex items-center justify-between h-14">
          {/* Логотип и название админ панели */}
          <div className="flex items-center gap-3">
            <Link href="/admin" className="flex items-center gap-2">
              <UmbraLogo size="sm" />
              <div className="flex items-center gap-2">
                <span className="text-lg font-semibold text-[#171717] dark:text-[#ededed]">
                  Umbra Platform
                </span>
                <span className="px-2 py-1 text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full font-medium">
                  Admin
                </span>
              </div>
            </Link>
          </div>

          {/* Правая часть с переключателем темы */}
          <div className="flex items-center gap-4">
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
}


