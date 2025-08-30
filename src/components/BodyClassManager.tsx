"use client";

import { useEffect } from 'react';

interface BodyClassManagerProps {
  className: string;
}

export default function BodyClassManager({ className }: BodyClassManagerProps) {
  useEffect(() => {
    // Удаляем все page-* классы
    document.body.classList.remove('page-with-header', 'page-with-custom-layout');
    
    // Добавляем нужный класс
    document.body.classList.add(className);
    
    return () => {
      document.body.classList.remove(className);
    };
  }, [className]);

  return null; // Этот компонент ничего не рендерит
}
