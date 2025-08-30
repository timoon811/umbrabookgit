import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { DocumentationPage } from '@/types/documentation';

interface SortablePageProps {
  page: DocumentationPage;
  onClick: () => void;
  children: React.ReactNode;
}

export default function SortablePage({ page, onClick, children }: SortablePageProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `page-${page.id}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className="select-none"
    >
      {/* Обертка для drag handle с правильной изоляцией от полей ввода */}
      <div 
        {...listeners}
        style={{
          // Применяем listeners только к элементам, которые НЕ являются полями ввода
          pointerEvents: 'auto'
        }}
        onKeyDown={(e) => {
          // Блокируем обработку клавиш для полей ввода
          const target = e.target as HTMLElement;
          if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
            e.stopPropagation();
            return;
          }
        }}
        onClick={(e) => {
          // Проверяем, что клик не по полю ввода
          const target = e.target as HTMLElement;
          if (target.tagName === 'INPUT' || target.closest('input')) {
            e.stopPropagation();
            return;
          }
          if (!isDragging) {
            onClick();
          }
        }}
        className="cursor-pointer"
        data-sortable-handle="true"
      >
        {children}
      </div>
    </div>
  );
}
