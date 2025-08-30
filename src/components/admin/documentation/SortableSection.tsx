import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { DocumentationSection } from '@/types/documentation';

interface SortableSectionProps {
  section: DocumentationSection;
  children: React.ReactNode;
}

export default function SortableSection({ section, children }: SortableSectionProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `section-${section.id}` });

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
        className="relative group"
        data-sortable-handle="true"
      >
        {children}
      </div>
    </div>
  );
}
