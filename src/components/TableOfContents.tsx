'use client';

import { useEffect, useState } from 'react';

interface TocItem {
  id: string;
  text: string;
  depth: number;
}

interface TableOfContentsProps {
  content?: string;
  pageType?: 'article' | 'course';
}

export default function TableOfContents({ content, pageType = 'article' }: TableOfContentsProps) {
  const [tocItems, setTocItems] = useState<TocItem[]>([]);
  const [activeId, setActiveId] = useState<string>('');

  // Функция для генерации ID как в редакторе
  const generateSlugId = (text: string): string => {
    if (!text || typeof text !== 'string') return '';
    
    return text
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\u0400-\u04FFa-z0-9\-]/gi, '')
      .replace(/\-\-+/g, '-')
      .replace(/^-+/, '')
      .replace(/-+$/, '');
  };

  // Извлекаем заголовки из контента на клиенте
  useEffect(() => {
    if (!content) {
      setTocItems([]);
      return;
    }

    // Ищем заголовки в DOM
    const headings = document.querySelectorAll('#article-content h1, #article-content h2, #article-content h3');
    const items: TocItem[] = [];
    const usedIds = new Set<string>();

    headings.forEach((heading) => {
      const text = heading.textContent?.trim();
      if (!text) return;

      const tagName = heading.tagName.toLowerCase();
      const depth = tagName === 'h1' ? 1 : tagName === 'h2' ? 2 : 3;

      let id = generateSlugId(text);
      
      // Убеждаемся, что ID уникален
      let counter = 1;
      const originalId = id;
      while (usedIds.has(id)) {
        id = `${originalId}-${counter}`;
        counter++;
      }
      
      usedIds.add(id);

      // Устанавливаем ID элементу если его нет
      if (!heading.id) {
        heading.id = id;
      }

      items.push({ depth, text, id });
    });

    setTocItems(items);
  }, [content]);

  // Отслеживаем активный заголовок при скролле
  useEffect(() => {
    if (tocItems.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries.filter(entry => entry.isIntersecting);
        if (visibleEntries.length > 0) {
          setActiveId(visibleEntries[0].target.id);
        }
      },
      { 
        rootMargin: '-80px 0px -80px 0px',
        threshold: 0.1
      }
    );

    tocItems.forEach(item => {
      const element = document.getElementById(item.id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [tocItems]);

  // Обработчик клика по элементу оглавления
  const handleClick = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      const offsetTop = element.offsetTop - 100; // Отступ для фиксированного хедера
      window.scrollTo({
        top: offsetTop,
        behavior: 'smooth'
      });
      setActiveId(id);
    }
  };

  if (tocItems.length === 0) {
    return (
      <div className="text-sm text-gray-500 dark:text-gray-400">
        <div className="text-xs">
          Заголовки отсутствуют
        </div>
      </div>
    );
  }

  return (
    <nav className="text-sm">
      <ul className="space-y-1">
        {tocItems.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              onClick={(e) => handleClick(item.id, e)}
              className={`block py-1 px-2 text-xs transition-colors rounded hover:bg-gray-100 dark:hover:bg-gray-800 ${
                activeId === item.id
                  ? 'text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-800 font-medium'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              } ${
                item.depth === 2
                  ? 'pl-4'
                  : item.depth === 3
                  ? 'pl-6'
                  : ''
              }`}
              title={item.text}
            >
              <span className="line-clamp-2">
                {item.text}
              </span>
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
