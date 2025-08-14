"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";
import type { TocItem } from "@/lib/docs";

export default function TableOfContents({ items }: { items: TocItem[] }) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      // Плавная прокрутка к элементу с отступом для header
      const headerOffset = 80; // 56px header + отступ
      const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
      const offsetPosition = elementPosition - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });

      // Обновить URL без перезагрузки с правильной кодировкой
      history.pushState(null, '', `#${encodeURIComponent(id)}`);
      setActiveId(id);
    } else {
      console.warn('Element not found for ID:', id);
    }
  };

  useEffect(() => {
    if (!items.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Найти все видимые заголовки
        const visibleEntries = entries.filter((entry) => entry.isIntersecting);
        
        if (visibleEntries.length > 0) {
          // Сортировать по позиции на экране (верхний первый)
          const sortedEntries = visibleEntries.sort((a, b) => {
            const aRect = a.target.getBoundingClientRect();
            const bRect = b.target.getBoundingClientRect();
            return aRect.top - bRect.top;
          });
          
          // Установить активным первый видимый заголовок
          setActiveId(sortedEntries[0].target.id);
        }
      },
      { 
        rootMargin: "-20% 0px -60% 0px", // Активирует заголовок, когда он в верхних 40% экрана
        threshold: [0, 0.1, 0.5, 1] 
      }
    );

    // Добавить небольшую задержку для того, чтобы DOM успел загрузиться
    const timeoutId = setTimeout(() => {
      items.forEach((item) => {
        const element = document.getElementById(item.id);
        if (element) {
          observer.observe(element);
        } else {
          console.warn('TOC: Element not found for ID:', item.id);
        }
      });
    }, 100);

    // Проверить URL hash при загрузке и активировать соответствующий элемент
    const checkInitialHash = () => {
      const hash = window.location.hash.slice(1); // убираем #
      if (hash) {
        try {
          const decodedHash = decodeURIComponent(hash);
          const element = document.getElementById(decodedHash);
          if (element) {
            setActiveId(decodedHash);
          }
        } catch (e) {
          // Fallback для случаев, когда hash уже декодирован
          const element = document.getElementById(hash);
          if (element) {
            setActiveId(hash);
          }
        }
      }
    };

    // Проверяем hash при монтировании компонента
    checkInitialHash();

    return () => {
      clearTimeout(timeoutId);
      observer.disconnect();
    };
  }, [items]);

  if (!items.length) return null;

  return (
    <nav aria-label="Оглавление">
      <div className="nav-section-title mb-4">На этой странице</div>
      <ul className="text-sm space-y-2">
        {items.map((t, index) => (
          <li key={`toc-${t.id}-${index}`} className={clsx(t.depth === 3 ? "pl-4" : "pl-0")}>
            <a
              href={`#${t.id}`}
              onClick={(e) => handleClick(e, t.id)}
              className={clsx(
                "block py-1 text-black/70 dark:text-white/70 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer",
                activeId === t.id && "text-blue-600 dark:text-blue-400 font-medium"
              )}
            >
              {t.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}



