import { useEffect, useState, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { useScrollDirection } from './useScrollDirection';
import { useResponsiveConfig } from './useResponsiveConfig';

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
  const responsiveConfig = useResponsiveConfig();
  const { scrollDirection, isScrollingDown, isScrollingUp } = useScrollDirection({
    threshold: 5,
    debounceMs: responsiveConfig.debounceMs
  });

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

    let debounceTimer: NodeJS.Timeout;
    const visibilityMap = new Map<string, boolean>();

    const updateActiveHeading = () => {
      // Получаем все заголовки и их позиции
      const headingElements = tocItems
        .map(item => {
          const element = document.getElementById(item.id);
          if (!element) return null;
          
          const rect = element.getBoundingClientRect();
          return {
            id: item.id,
            element,
            top: rect.top,
            bottom: rect.bottom,
            isVisible: visibilityMap.get(item.id) || false
          };
        })
        .filter(Boolean) as Array<{
          id: string;
          element: HTMLElement;
          top: number;
          bottom: number;
          isVisible: boolean;
        }>;

      if (headingElements.length === 0) return;

      // Определяем активный заголовок с учетом направления скролла:
      // 1. При скролле вниз - активируем заголовок, когда он пересекает верхнюю границу
      // 2. При скролле вверх - активируем заголовок, когда следующий уходит за верхнюю границу
      // 3. При отсутствии скролла - используем ближайший к активной зоне
      
      const { headerOffset, activeThreshold, toleranceUp, toleranceDown } = responsiveConfig;
      
      // Сортируем заголовки по их позиции в документе
      const sortedHeadings = headingElements.sort((a, b) => {
        return a.element.offsetTop - b.element.offsetTop;
      });

      let newActiveId = '';

      if (isScrollingDown) {
        // При скролле вниз: активируем заголовок, когда он пересекает активную зону сверху
        for (let i = sortedHeadings.length - 1; i >= 0; i--) {
          const heading = sortedHeadings[i];
          if (heading.top <= activeThreshold + toleranceDown) {
            newActiveId = heading.id;
            break;
          }
        }
      } else if (isScrollingUp) {
        // При скролле вверх: более консервативная логика - активируем только когда заголовок четко в зоне
        for (let i = sortedHeadings.length - 1; i >= 0; i--) {
          const heading = sortedHeadings[i];
          if (heading.top <= activeThreshold - toleranceUp) {
            newActiveId = heading.id;
            break;
          }
        }
        
        // Если при скролле вверх ничего не найдено, проверяем видимые заголовки
        if (!newActiveId) {
          const visibleHeadings = sortedHeadings.filter(h => h.isVisible && h.top >= 0);
          if (visibleHeadings.length > 0) {
            newActiveId = visibleHeadings[0].id;
          }
        }
      } else {
        // При отсутствии скролла или медленном скролле: стандартная логика
        for (let i = sortedHeadings.length - 1; i >= 0; i--) {
          const heading = sortedHeadings[i];
          if (heading.top <= activeThreshold) {
            newActiveId = heading.id;
            break;
          }
        }
      }

      // Fallback: если ни один заголовок не выбран, выбираем первый видимый
      if (!newActiveId && sortedHeadings.length > 0) {
        const firstVisible = sortedHeadings.find(h => h.isVisible);
        newActiveId = firstVisible?.id || sortedHeadings[0].id;
      }

      // Обновляем активный заголовок только если он изменился
      setActiveId(prevId => {
        if (prevId !== newActiveId) {
          console.log('🎯 TOC: Активный заголовок изменился:', {
            from: prevId,
            to: newActiveId,
            scrollDirection,
            scrollingDown: isScrollingDown,
            scrollingUp: isScrollingUp
          });
          return newActiveId;
        }
        return prevId;
      });
    };

    const observer = new IntersectionObserver(
      (entries) => {
        // Обновляем карту видимости элементов
        entries.forEach(entry => {
          visibilityMap.set(entry.target.id, entry.isIntersecting);
        });

        // Debounce обновления активного заголовка
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(updateActiveHeading, 10);
      },
      { 
        // Адаптивные настройки для определения видимости
        rootMargin: responsiveConfig.rootMargin,
        threshold: [0, 0.1, 0.25, 0.5, 0.75, 1.0] // Более детальное отслеживание
      }
    );

    // Дополнительный observer для отслеживания скролла
    const scrollObserver = new IntersectionObserver(
      () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(updateActiveHeading, 10);
      },
      {
        rootMargin: '0px',
        threshold: 0
      }
    );

    const timeoutId = setTimeout(() => {
      tocItems.forEach(item => {
        const element = document.getElementById(item.id);
        if (element) {
          observer.observe(element);
          // Инициализируем видимость
          const rect = element.getBoundingClientRect();
          visibilityMap.set(item.id, rect.top >= 0 && rect.bottom <= window.innerHeight);
        }
      });

      // Наблюдаем за контейнером для отслеживания скролла
      const container = document.querySelector('#article-content');
      if (container) {
        scrollObserver.observe(container);
      }

      // Первоначальное определение активного заголовка
      updateActiveHeading();
    }, 50);

    // Слушатель скролла как fallback
    const handleScroll = () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(updateActiveHeading, 16); // ~60fps
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      clearTimeout(timeoutId);
      clearTimeout(debounceTimer);
      observer.disconnect();
      scrollObserver.disconnect();
      window.removeEventListener('scroll', handleScroll);
    };
  }, [enabled, tocItems, pathname]);

  // Функция для навигации к заголовку
  const scrollToHeading = useCallback((id: string) => {
    const element = document.getElementById(id);
    if (element) {
      // Вычисляем точную позицию с учетом адаптивных настроек
      const extraOffset = 20; // Дополнительный отступ для удобства чтения
      const targetPosition = element.offsetTop - responsiveConfig.headerOffset - extraOffset;
      
      // Устанавливаем активный ID немедленно для визуальной обратной связи
      setActiveId(id);
      
      // Плавная анимация скролла
      window.scrollTo({
        top: Math.max(0, targetPosition), // Не скроллим выше начала страницы
        behavior: 'smooth'
      });
      
      // Дополнительная проверка после завершения скролла
      setTimeout(() => {
        const rect = element.getBoundingClientRect();
        const isInCorrectPosition = rect.top >= responsiveConfig.headerOffset - 10 && 
                                  rect.top <= responsiveConfig.headerOffset + 50;
        
        if (!isInCorrectPosition) {
          // Корректируем позицию если нужно
          const correctedPosition = element.offsetTop - responsiveConfig.headerOffset - extraOffset;
          window.scrollTo({
            top: Math.max(0, correctedPosition),
            behavior: 'smooth'
          });
        }
      }, 500); // Даем время на завершение анимации
    }
  }, [responsiveConfig]);

  return {
    tocItems,
    activeId,
    scrollToHeading,
    extractHeadings // Экспортируем для ручного обновления
  };
}
