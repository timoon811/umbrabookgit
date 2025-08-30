import { useState, useEffect } from 'react';

export type ScrollDirection = 'up' | 'down' | 'idle';

interface UseScrollDirectionOptions {
  threshold?: number;
  debounceMs?: number;
}

export function useScrollDirection(options: UseScrollDirectionOptions = {}) {
  const { threshold = 10, debounceMs = 100 } = options;
  
  const [scrollDirection, setScrollDirection] = useState<ScrollDirection>('idle');
  const [scrollY, setScrollY] = useState(0);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    let debounceTimer: NodeJS.Timeout;
    let idleTimer: NodeJS.Timeout;

    const updateScrollDirection = () => {
      const currentScrollY = window.scrollY;
      const difference = currentScrollY - lastScrollY;

      // Определяем направление только если прокрутка достаточно значительная
      if (Math.abs(difference) > threshold) {
        const newDirection: ScrollDirection = difference > 0 ? 'down' : 'up';
        
        setScrollDirection(newDirection);
        setScrollY(currentScrollY);
        setLastScrollY(currentScrollY);

        // Сбрасываем на idle через некоторое время после остановки скролла
        clearTimeout(idleTimer);
        idleTimer = setTimeout(() => {
          setScrollDirection('idle');
        }, debounceMs * 2);
      }
    };

    const handleScroll = () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(updateScrollDirection, debounceMs);
    };

    // Инициализация
    setScrollY(window.scrollY);
    setLastScrollY(window.scrollY);

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      clearTimeout(debounceTimer);
      clearTimeout(idleTimer);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [threshold, debounceMs, lastScrollY]);

  return {
    scrollDirection,
    scrollY,
    isScrollingDown: scrollDirection === 'down',
    isScrollingUp: scrollDirection === 'up',
    isIdle: scrollDirection === 'idle'
  };
}
