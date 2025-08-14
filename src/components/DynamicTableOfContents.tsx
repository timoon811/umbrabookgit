"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import TableOfContents from "./TableOfContents";
import type { TocItem } from "@/lib/docs";

export default function DynamicTableOfContents() {
  const [tocItems, setTocItems] = useState<TocItem[]>([]);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    async function loadTocForCurrentPage() {
      setLoading(true);
      try {
        // Получаем slug из pathname (убираем начальный /)
        const slug = pathname.startsWith('/') ? pathname.slice(1) : pathname;
        
        const response = await fetch(`/api/toc?slug=${encodeURIComponent(slug)}`);
        if (response.ok) {
          const data = await response.json();
          setTocItems(data.items || []);
        } else {
          console.warn('Failed to load TOC for current page');
          setTocItems([]);
        }
      } catch (error) {
        console.warn('Error loading TOC:', error);
        setTocItems([]);
      } finally {
        setLoading(false);
      }
    }

    loadTocForCurrentPage();
  }, [pathname]);

  if (loading) {
    return (
      <nav aria-label="Оглавление">
        <div className="nav-section-title mb-4">На этой странице</div>
        <div className="text-sm text-black/40 dark:text-white/40">Загружается...</div>
      </nav>
    );
  }

  return <TableOfContents items={tocItems} />;
}
