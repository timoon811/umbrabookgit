"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import clsx from "clsx";
import SearchBox from "@/components/SearchBox";
import ThemeToggle from "@/components/ThemeToggle";
import UmbraLogo from "@/components/UmbraLogo";

type Workspace = { key: string; name: string };

export default function ConditionalNavigation() {
  const pathname = usePathname();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  
  // Не показываем навигацию на страницах аутентификации и в админ панели
  const isAuthPage = pathname.startsWith("/login") || pathname.startsWith("/register");
  const isAdminPage = pathname.startsWith("/admin");
  const isCourses = pathname.startsWith("/courses");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/workspaces', { cache: 'no-store' });
        if (res.ok) setWorkspaces(await res.json());
      } catch {}
    })();
  }, []);

  if (isAuthPage || isAdminPage) {
    return null;
  }

  return (
    <div className="sticky-topbar border-b border-black/5 dark:border-white/10">
      <div className="mx-auto max-w-screen-2xl px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <UmbraLogo size="sm" />
            Umbra Platform
          </Link>
          <div className="flex items-center gap-1">
            {(workspaces.length ? workspaces : [{ key: 'docs', name: 'Документация' }, { key: 'courses', name: 'Курсы' }]).map(ws => {
              const href = ws.key === 'courses' ? '/courses' : ws.key === 'docs' ? '/docs' : `/${ws.key}`;
              const active = pathname.startsWith(href);
              return (
                <Link key={ws.key} href={href} className={clsx("px-3 py-1 rounded-md text-sm transition-colors", active ? "bg-black/5 dark:bg-white/10 font-medium" : "hover:bg-black/5 dark:hover:bg-white/10 text-black/60 dark:text-white/60")}>{ws.name}</Link>
              );
            })}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden md:block"><SearchBox /></div>
          <ThemeToggle />
        </div>
      </div>
    </div>
  );
}
