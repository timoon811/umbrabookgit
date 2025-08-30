"use client";

import { useEffect, useRef, useState } from 'react';

interface SmartSidebarProps {
  children: React.ReactNode;
  className?: string;
}

export default function SmartSidebar({ children, className = '' }: SmartSidebarProps) {
  const sidebarRef = useRef<HTMLDivElement>(null);
  const [needsScroll, setNeedsScroll] = useState(false);

  useEffect(() => {
    const checkScrollNeed = () => {
      if (sidebarRef.current) {
        const { scrollHeight, clientHeight } = sidebarRef.current;
        setNeedsScroll(scrollHeight > clientHeight);
      }
    };

    // Проверяем при монтировании
    checkScrollNeed();

    // Проверяем при изменении размера окна
    const handleResize = () => {
      checkScrollNeed();
    };

    // Проверяем при изменении контента
    const observer = new MutationObserver(checkScrollNeed);
    
    if (sidebarRef.current) {
      observer.observe(sidebarRef.current, {
        childList: true,
        subtree: true,
        characterData: true
      });
    }

    window.addEventListener('resize', handleResize);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div 
      ref={sidebarRef}
      className={`sticky top-4 max-h-[calc(100vh-var(--header-height)-2rem)] p-3 ${
        needsScroll ? 'overflow-y-auto' : 'overflow-y-visible'
      } ${className}`}
      style={{
        // Показываем скроллбар только когда он нужен
        overflowY: needsScroll ? 'auto' : 'visible'
      }}
    >
      {children}
    </div>
  );
}
