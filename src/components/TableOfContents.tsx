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
    const extractHeadings = () => {
      // Для динамического контента всегда ищем в DOM
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
    };

    if (content === 'dynamic') {
      // Для динамического контента используем более надежный подход
      let attempts = 0;
      const maxAttempts = 20; // максимум 2 секунды
      
      const checkForHeadings = () => {
        const headings = document.querySelectorAll('#article-content h1, #article-content h2, #article-content h3');
        
        if (headings.length > 0) {
          extractHeadings();
          return;
        }
        
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(checkForHeadings, 100);
        }
      };

      // Начинаем проверку сразу, а затем через таймеры
      checkForHeadings();
      
      // Также отслеживаем изменения в DOM
      const observer = new MutationObserver((mutations) => {
        // Проверяем, были ли добавлены заголовки
        let hasHeadingChanges = false;
        mutations.forEach(mutation => {
          if (mutation.type === 'childList') {
            mutation.addedNodes.forEach(node => {
              if (node.nodeType === Node.ELEMENT_NODE) {
                const element = node as Element;
                if (element.matches && (element.matches('h1, h2, h3') || element.querySelector('h1, h2, h3'))) {
                  hasHeadingChanges = true;
                }
              }
            });
          }
        });
        
        if (hasHeadingChanges) {
          // Небольшая задержка, чтобы дать время DOM обновиться
          setTimeout(extractHeadings, 50);
        }
      });

      const articleContent = document.getElementById('article-content');
      if (articleContent) {
        observer.observe(articleContent, {
          childList: true,
          subtree: true
        });
      }

      return () => {
        observer.disconnect();
      };
    } else if (content) {
      // Для статического контента сразу ищем
      extractHeadings();
    } else {
      setTocItems([]);
    }
  }, [content]);

  // Дополнительная проверка на случай, если компонент замонтирован после загрузки контента
  useEffect(() => {
    if (content === 'dynamic' && tocItems.length === 0) {
      const timer = setTimeout(() => {
        const headings = document.querySelectorAll('#article-content h1, #article-content h2, #article-content h3');
        if (headings.length > 0) {
          const extractHeadings = () => {
            const items: TocItem[] = [];
            const usedIds = new Set<string>();

            headings.forEach((heading) => {
              const text = heading.textContent?.trim();
              if (!text) return;

              const tagName = heading.tagName.toLowerCase();
              const depth = tagName === 'h1' ? 1 : tagName === 'h2' ? 2 : 3;

              let id = generateSlugId(text);
              
              let counter = 1;
              const originalId = id;
              while (usedIds.has(id)) {
                id = `${originalId}-${counter}`;
                counter++;
              }
              
              usedIds.add(id);

              if (!heading.id) {
                heading.id = id;
              }

              items.push({ depth, text, id });
            });

            setTocItems(items);
          };
          
          extractHeadings();
        }
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [tocItems.length, content]);

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
        <div className="text-xs mb-2">
          Заголовки отсутствуют
        </div>
        {process.env.NODE_ENV === 'development' && (
          <div className="text-xs text-red-500 space-y-1">
            <div>Debug: content = "{content}"</div>
            <div>Debug: поиск в #article-content</div>
            <button 
              onClick={() => {
                const headings = document.querySelectorAll('#article-content h1, #article-content h2, #article-content h3');
                console.log('TOC Debug - найдено заголовков:', headings.length);
                headings.forEach((h, i) => console.log(`${i+1}. ${h.tagName}: "${h.textContent}"`));
              }}
              className="text-xs bg-red-100 px-2 py-1 rounded hover:bg-red-200"
            >
              Debug заголовки
            </button>
          </div>
        )}
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
