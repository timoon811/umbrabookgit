import { useEffect, useState, useCallback } from 'react';
import { usePathname } from 'next/navigation';

interface TocItem {
  id: string;
  text: string;
  depth: number;
}

interface UseTableOfContentsOptions {
  enabled?: boolean;
  container?: string;
  headingSelector?: string;
}

export function useTableOfContents(options: UseTableOfContentsOptions = {}) {
  const {
    enabled = true,
    container = '#article-content',
    headingSelector = 'h1, h2, h3'
  } = options;

  const [tocItems, setTocItems] = useState<TocItem[]>([]);
  const [activeId, setActiveId] = useState<string>('');
  const pathname = usePathname();

  // Функция для генерации slug ID
  const generateSlugId = useCallback((text: string): string => {
    if (!text || typeof text !== 'string') return '';
    
    return text
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\u0400-\u04FFa-z0-9\-]/gi, '')
      .replace(/\-\-+/g, '-')
      .replace(/^-+/, '')
      .replace(/-+$/, '');
  }, []);

  // Функция для извлечения заголовков из DOM
  const extractHeadings = useCallback(() => {
    if (!enabled) return;

    const headings = document.querySelectorAll(`${container} ${headingSelector}`);
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
  }, [enabled, container, headingSelector, generateSlugId]);

  // Сброс состояния при смене страницы
  useEffect(() => {
    if (!enabled) return;
    setTocItems([]);
    setActiveId('');
  }, [pathname, enabled]);

  // Основная логика извлечения заголовков
  useEffect(() => {
    if (!enabled) return;

    // Немедленная попытка извлечения
    const headings = document.querySelectorAll(`${container} ${headingSelector}`);
    if (headings.length > 0) {
      extractHeadings();
      return;
    }

    // Debounce для избежания частых обновлений
    let debounceTimer: NodeJS.Timeout;
    
    // Observer для отслеживания изменений DOM
    const observer = new MutationObserver((mutations) => {
      let hasContentChanges = false;
      
      mutations.forEach(mutation => {
        if (mutation.type === 'childList') {
          const target = mutation.target as Element;
          const containerElement = document.querySelector(container);
          
          if (containerElement && (target === containerElement || containerElement.contains(target) || target.contains(containerElement))) {
            mutation.addedNodes.forEach(node => {
              if (node.nodeType === Node.ELEMENT_NODE) {
                const element = node as Element;
                if (element.matches && (element.matches(headingSelector) || element.querySelector(headingSelector))) {
                  hasContentChanges = true;
                }
              }
            });
          }
        } else if (mutation.type === 'attributes' && mutation.attributeName === 'id') {
          const target = mutation.target as Element;
          if (target.matches(container.replace('#', ''))) {
            hasContentChanges = true;
          }
        }
      });
      
      if (hasContentChanges) {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(extractHeadings, 50);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['id']
    });

    // Fallback проверка через интервалы
    let attempts = 0;
    const maxAttempts = 30;
    
    const checkInterval = setInterval(() => {
      const headings = document.querySelectorAll(`${container} ${headingSelector}`);
      
      if (headings.length > 0) {
        extractHeadings();
        clearInterval(checkInterval);
        return;
      }
      
      attempts++;
      if (attempts >= maxAttempts) {
        clearInterval(checkInterval);
      }
    }, 100);

    return () => {
      clearTimeout(debounceTimer);
      observer.disconnect();
      clearInterval(checkInterval);
    };
  }, [enabled, container, headingSelector, pathname, extractHeadings]);

  // Отслеживание активного заголовка при скролле
  useEffect(() => {
    if (!enabled || tocItems.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries.filter(entry => entry.isIntersecting);
        if (visibleEntries.length > 0) {
          const topEntry = visibleEntries.sort((a, b) => {
            return a.boundingClientRect.top - b.boundingClientRect.top;
          })[0];
          setActiveId(topEntry.target.id);
        }
      },
      { 
        rootMargin: '-80px 0px -80px 0px',
        threshold: [0, 0.1, 0.5, 1]
      }
    );

    const timeoutId = setTimeout(() => {
      tocItems.forEach(item => {
        const element = document.getElementById(item.id);
        if (element) observer.observe(element);
      });
    }, 50);

    return () => {
      clearTimeout(timeoutId);
      observer.disconnect();
    };
  }, [enabled, tocItems, pathname]);

  // Функция для навигации к заголовку
  const scrollToHeading = useCallback((id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offsetTop = element.offsetTop - 100;
      window.scrollTo({
        top: offsetTop,
        behavior: 'smooth'
      });
      setActiveId(id);
    }
  }, []);

  return {
    tocItems,
    activeId,
    scrollToHeading,
    extractHeadings // Экспортируем для ручного обновления
  };
}
